/**
 * Logcomex "Brasil | Análise de Embarques" (ETAPA 14).
 *
 * Regra (FONTES.md §28, PLANEJAMENTO.md ETAPA 14): o schema recebido NÃO
 * demonstrou um array estruturado de KPIs. Portanto, NÃO desenvolvemos
 * processamento automático: preservamos a resposta bruta com ressalva e a
 * marca `structuredConfirmed: false`. Confirmar a resposta real antes de
 * processar. É contexto de carteira/mercado, nunca dado da carga individual.
 */

import type { SourceReference } from "../domain";

/** Entregáveis declarados (§28) — estrutura de KPIs NÃO confirmada. */
export interface LogcomexShipmentAnalysisDTO {
  kpis?: unknown;
  ranking?: unknown;
  evolucao_mensal?: unknown;
  insights?: unknown;
}

export interface ShipmentAnalysisContext {
  /** Sempre false até o schema real ser confirmado (FONTES §28). */
  structuredConfirmed: false;
  raw: LogcomexShipmentAnalysisDTO;
  caveat: string;
  source: SourceReference;
  scope: "MARKET_AGGREGATE";
}

export function shipmentAnalysisSource(accessedAt: string): SourceReference {
  return {
    id: "logcomex-brasil-analise-embarques",
    title: "Logcomex — Brasil | Análise de Embarques",
    publisher: "Logcomex",
    accessedAt,
    kind: "EXTERNAL_API",
  };
}

/**
 * Preserva a resposta de embarques como contexto bruto, sem processar KPIs.
 */
export function adaptShipmentAnalysis(
  dto: LogcomexShipmentAnalysisDTO,
  accessedAt: string,
): ShipmentAnalysisContext {
  return {
    structuredConfirmed: false,
    raw: dto,
    caveat:
      "Estrutura de KPIs não confirmada (FONTES §28): processamento automático pendente de confirmação da resposta real.",
    source: shipmentAnalysisSource(accessedAt),
    scope: "MARKET_AGGREGATE",
  };
}
