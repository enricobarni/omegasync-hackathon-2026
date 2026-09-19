/**
 * Serviço de simulação (ETAPA 9).
 *
 * Camada de aplicação/orquestração (PLANEJAMENTO.md §3): a aplicação
 * COORDENA, o domínio DECIDE, as integrações FORNECEM dados. Este serviço
 * apenas encadeia os módulos determinísticos — não contém regra de negócio
 * própria.
 *
 * Pipeline (PLANEJAMENTO.md ETAPA 9):
 *   input → normalização → enriquecimento → elegibilidade → custo das rotas
 *         → comparação → evidências → response
 *
 * A normalização/validação de entrada externa crua e a integração Logcomex
 * ficam em etapas posteriores (ETAPA 10/11). Aqui a entrada já é domínio
 * normalizado; o enriquecimento resolve a anuência a partir do registro.
 */

import type {
  Cargo,
  CostComponent,
  Evidence,
  Route,
  TrackedValue,
} from "../domain";
import { createCostComponent, isKnown, unknownAmount } from "../domain";
import {
  assessBehavioralFactors,
  assessWindow48h,
  compareRoutes,
  computeRouteCost,
  evaluateEligibility,
} from "../engine";
import type {
  BehavioralFactor,
  EligibilityInput,
  RouteComparison,
  RouteComparisonCandidate,
  RouteCostResult,
  RouteEligibility,
  Window48hAssessment,
  Window48hContext,
} from "../engine";
import {
  ANUENCIA_REGISTRY_BASELINE,
  assessClearance,
  resolveAnuenciaByNcm,
} from "../customs";
import type {
  AnuenciaRegistryEntry,
  AnuenciaResolution,
  ClearanceAssessment,
} from "../customs";

export interface SimulationInput {
  cargo: Cargo;
  /** Rotas a avaliar. */
  routes: readonly Route[];
  /** Necessidade de entrepostagem (opcional; desconhecida se ausente). */
  necessitaEntrepostagem?: TrackedValue<boolean>;
  /** Componentes de custo por rota, montados pelo chamador (ETAPA 5 + tarifas). */
  routeCostComponents?: Record<string, CostComponent[]>;
  /** Sinais comportamentais (não bloqueiam viabilidade). */
  behavioral?: {
    possuiCaixaParaAntecipacao?: TrackedValue<boolean>;
    possuiEstruturaSincronizada?: TrackedValue<boolean>;
    janela48hViavel?: TrackedValue<boolean>;
  };
  /** Contexto da janela de 48h. */
  window48h?: Window48hContext;
  /** Registro de anuência; por padrão o baseline vazio. */
  anuenciaRegistry?: AnuenciaRegistryEntry[];
}

export interface RouteSimulation {
  route: Route;
  eligibility: RouteEligibility;
  cost: RouteCostResult;
}

export interface SimulationResult {
  cargo: Cargo;
  anuencia: AnuenciaResolution;
  clearance: ClearanceAssessment;
  routes: RouteSimulation[];
  comparison: RouteComparison;
  window48h: Window48hAssessment;
  behavioralFactors: BehavioralFactor[];
  missingData: string[];
  evidences: Evidence[];
}

function costComponentsForRoute(
  input: SimulationInput,
  route: Route,
): CostComponent[] {
  const provided = input.routeCostComponents?.[route.id];
  if (provided && provided.length > 0) {
    return provided;
  }
  // Sem custo informado => custo desconhecido (não zero).
  return [
    createCostComponent(
      "OUTRO",
      "Custo não informado",
      unknownAmount("Nenhum componente de custo informado para a rota."),
    ),
  ];
}

function dedupeEvidences(evidences: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  const result: Evidence[] = [];
  for (const evidence of evidences) {
    const key = `${evidence.origin}|${evidence.reference ?? ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(evidence);
  }
  return result;
}

/**
 * Executa a simulação encadeando os módulos determinísticos.
 */
export function runSimulation(input: SimulationInput): SimulationResult {
  const registry = input.anuenciaRegistry ?? ANUENCIA_REGISTRY_BASELINE;

  // 1. Enriquecimento: resolve a anuência.
  const anuencia = resolveAnuenciaByNcm(input.cargo.ncm, registry);

  // 2. Liberação (canal + anuência) — descoberta central da ETAPA 8.
  const clearance = assessClearance({
    channel: input.cargo.channel,
    anuencia,
  });

  // 3. Elegibilidade por rota.
  const eligibilityInput: EligibilityInput = {
    cargo: input.cargo,
    anuencia: anuencia.status === "RESOLVED" ? anuencia.anuencia : undefined,
    necessitaEntrepostagem: input.necessitaEntrepostagem,
  };
  const eligibilities = evaluateEligibility(eligibilityInput, input.routes);

  // 4. Custo por rota.
  const routeSimulations: RouteSimulation[] = input.routes.map((route, index) => {
    const cost = computeRouteCost(
      route.id,
      costComponentsForRoute(input, route),
    );
    return { route, eligibility: eligibilities[index], cost };
  });

  // 5. Comparação (só rotas viáveis, por dimensões comparáveis).
  const candidates: RouteComparisonCandidate[] = routeSimulations.map((sim) => ({
    routeId: sim.route.id,
    label: sim.route.label,
    eligibility: sim.eligibility.status,
    cost: sim.cost.summary,
    distanceKm: sim.route.distanceKm,
    estimatedDurationHours: sim.route.estimatedDurationHours,
  }));
  const comparison = compareRoutes(candidates);

  // 6. Janela de 48h e fatores comportamentais.
  const window48h = assessWindow48h(input.window48h ?? {});
  const behavioralFactors = assessBehavioralFactors({
    cargo: input.cargo,
    anuencia: anuencia.status === "RESOLVED" ? anuencia.anuencia : undefined,
    possuiCaixaParaAntecipacao: input.behavioral?.possuiCaixaParaAntecipacao,
    possuiEstruturaSincronizada: input.behavioral?.possuiEstruturaSincronizada,
    janela48hViavel: input.behavioral?.janela48hViavel,
  });

  // 7. Evidências e dados faltantes agregados.
  const missingData = Array.from(
    new Set([
      ...clearance.missingData,
      ...routeSimulations.flatMap((sim) => sim.eligibility.missingData),
      ...window48h.missingData,
    ]),
  );

  const costEvidences = routeSimulations.flatMap((sim) =>
    sim.cost.components
      .map((component) => component.amount)
      .filter(isKnown)
      .map((amount) => amount.evidence),
  );

  const evidences = dedupeEvidences([
    ...(anuencia.status === "RESOLVED" ? [anuencia.anuencia.evidence] : []),
    ...costEvidences,
    ...window48h.evidence,
    ...behavioralFactors.map((factor) => factor.evidence),
  ]);

  return {
    cargo: input.cargo,
    anuencia,
    clearance,
    routes: routeSimulations,
    comparison,
    window48h,
    behavioralFactors,
    missingData,
    evidences,
  };
}
