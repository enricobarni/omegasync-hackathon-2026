/**
 * Motor de elegibilidade de rotas (ETAPA 3).
 *
 * Responde: "Quais rotas podem ser executadas por esta carga?"
 *
 * Diferença central em relação ao motor anterior (PLANEJAMENTO.md ETAPA 3):
 * o motor antigo colapsava a decisão em um único cenário A–F. Aqui cada rota
 * é avaliada individualmente como VIAVEL / INVIAVEL / INDETERMINADA, e este
 * motor trata apenas de RESTRIÇÕES QUE INVIABILIZAM uma rota. Fatores
 * comportamentais (caixa, estrutura, janela, canal) — que tornam outra rota
 * mais provável, mas não a inviabilizam — são tratados separadamente em
 * `behavioral-factors.ts`.
 *
 * O motor é determinístico e puro: não acessa rede, React, HTTP nem Logcomex.
 */

import type {
  Cargo,
  Evidence,
  ResolvedAnuencia,
  Route,
  RouteEligibilityStatus,
  TrackedValue,
} from "../domain";
import { cargoTypeAcceptance, isKnown } from "../domain";

/** Restrições avaliadas pelo motor de elegibilidade. */
export const ELIGIBILITY_RULES = [
  "ANUENCIA",
  "CARGO_TYPE",
  "AVAILABILITY",
  "ENTREPOSTAGEM",
] as const;
export type EligibilityRule = (typeof ELIGIBILITY_RULES)[number];

/** Resultado de uma regra sobre uma rota. */
export const RULE_OUTCOMES = ["PASS", "BLOCK", "INDETERMINATE"] as const;
export type RuleOutcome = (typeof RULE_OUTCOMES)[number];

export interface EligibilityReason {
  rule: EligibilityRule;
  outcome: RuleOutcome;
  detail: string;
  evidence?: Evidence;
}

export interface RouteEligibility {
  routeId: string;
  status: RouteEligibilityStatus;
  /** Motivo determinante, legível. */
  summary: string;
  reasons: EligibilityReason[];
  /** Dados faltantes que impedem uma conclusão definitiva. */
  missingData: string[];
}

/**
 * Entrada do motor. Só inclui o que as restrições duras exigem. A anuência e
 * a necessidade de entrepostagem são opcionais: quando ausentes/desconhecidas,
 * a rota tende à INDETERMINAÇÃO em vez de a uma conclusão inventada.
 */
export interface EligibilityInput {
  cargo: Cargo;
  anuencia?: ResolvedAnuencia;
  necessitaEntrepostagem?: TrackedValue<boolean>;
}

function evaluateAnuencia(input: EligibilityInput): EligibilityReason {
  const { anuencia } = input;

  if (!anuencia) {
    return {
      rule: "ANUENCIA",
      outcome: "INDETERMINATE",
      detail:
        "Anuência não resolvida: não é possível confirmar que a operação pode ser executada.",
    };
  }

  switch (anuencia.state) {
    case "IMPEDIMENTO":
      return {
        rule: "ANUENCIA",
        outcome: "BLOCK",
        detail: "A anuência impede o prosseguimento da operação.",
        evidence: anuencia.evidence,
      };
    case "PREVIA_AO_EMBARQUE":
      return {
        rule: "ANUENCIA",
        outcome: "BLOCK",
        detail:
          "Anuência prévia ao embarque não atendida impede o prosseguimento da operação.",
        evidence: anuencia.evidence,
      };
    default:
      // SEM_ANUENCIA, AUTOMATICA, NAO_AUTOMATICA_POSTERIOR não inviabilizam
      // uma rota. NAO_AUTOMATICA_POSTERIOR é fator comportamental (retroporto),
      // tratado em behavioral-factors.ts.
      return {
        rule: "ANUENCIA",
        outcome: "PASS",
        detail: `Estado de anuência (${anuencia.state}) não inviabiliza a rota.`,
        evidence: anuencia.evidence,
      };
  }
}

function evaluateCargoType(cargo: Cargo, route: Route): EligibilityReason {
  const acceptance = cargoTypeAcceptance(route, cargo.cargoType);

  if (acceptance === "UNKNOWN") {
    return {
      rule: "CARGO_TYPE",
      outcome: "INDETERMINATE",
      detail: "Tipos de carga aceitos pela rota não informados.",
    };
  }

  if (acceptance === "REJECTED") {
    return {
      rule: "CARGO_TYPE",
      outcome: "BLOCK",
      detail: `A rota não aceita carga ${cargo.cargoType}.`,
    };
  }

  return {
    rule: "CARGO_TYPE",
    outcome: "PASS",
    detail: `A rota aceita carga ${cargo.cargoType}.`,
  };
}

function evaluateAvailability(route: Route): EligibilityReason {
  switch (route.availability.status) {
    case "AVAILABLE":
      return {
        rule: "AVAILABILITY",
        outcome: "PASS",
        detail: "Rota disponível.",
        evidence: route.availability.evidence,
      };
    case "UNAVAILABLE":
      return {
        rule: "AVAILABILITY",
        outcome: "BLOCK",
        detail: route.availability.reason ?? "Rota indisponível.",
        evidence: route.availability.evidence,
      };
    default:
      return {
        rule: "AVAILABILITY",
        outcome: "INDETERMINATE",
        detail: "Disponibilidade da rota não informada.",
      };
  }
}

/**
 * Entrepostagem só restringe quando é uma necessidade CONHECIDA. Sem uma
 * necessidade conhecida, o motor não aplica a restrição — não converte
 * "desconhecido" em "não precisa". Quando conhecida e verdadeira, apenas
 * rotas que terminam em entreposto aduaneiro permanecem viáveis.
 */
function evaluateEntrepostagem(
  necessita: TrackedValue<boolean> | undefined,
  route: Route,
): EligibilityReason {
  if (!necessita || !isKnown(necessita)) {
    return {
      rule: "ENTREPOSTAGEM",
      outcome: "PASS",
      detail: "Sem necessidade conhecida de entrepostagem.",
    };
  }

  if (!necessita.value) {
    return {
      rule: "ENTREPOSTAGEM",
      outcome: "PASS",
      detail: "Operação não requer entrepostagem.",
      evidence: necessita.evidence,
    };
  }

  // Entreposto é um REGIME habilitado no recinto (AJUSTE 3.3/15.3), não um
  // tipo físico. A habilitação é rastreável; desconhecida => indeterminado.
  const regimes = route.destination.enabledRegimes;
  if (!regimes || !isKnown(regimes)) {
    return {
      rule: "ENTREPOSTAGEM",
      outcome: "INDETERMINATE",
      detail:
        "Habilitação do recinto de destino ao regime de entreposto não informada.",
      evidence: necessita.evidence,
    };
  }

  if (regimes.value.includes("ENTREPOSTO_ADUANEIRO")) {
    return {
      rule: "ENTREPOSTAGEM",
      outcome: "PASS",
      detail:
        "Recinto de destino habilitado ao regime de entreposto, atendendo à necessidade.",
      evidence: necessita.evidence,
    };
  }

  return {
    rule: "ENTREPOSTAGEM",
    outcome: "BLOCK",
    detail:
      "Operação requer entrepostagem, mas o recinto de destino não é habilitado ao regime de entreposto.",
    evidence: necessita.evidence,
  };
}

function resolveStatus(reasons: EligibilityReason[]): RouteEligibilityStatus {
  if (reasons.some((reason) => reason.outcome === "BLOCK")) {
    return "INVIAVEL";
  }
  if (reasons.some((reason) => reason.outcome === "INDETERMINATE")) {
    return "INDETERMINADA";
  }
  return "VIAVEL";
}

function summarize(
  status: RouteEligibilityStatus,
  reasons: EligibilityReason[],
): string {
  if (status === "INVIAVEL") {
    const block = reasons.find((reason) => reason.outcome === "BLOCK");
    return block?.detail ?? "Rota inviável.";
  }
  if (status === "INDETERMINADA") {
    return "Rota indeterminada: faltam dados para uma conclusão definitiva.";
  }
  return "Rota viável para a carga.";
}

/** Avalia a elegibilidade de uma única rota para a carga. */
export function evaluateRouteEligibility(
  input: EligibilityInput,
  route: Route,
): RouteEligibility {
  const reasons: EligibilityReason[] = [
    evaluateAnuencia(input),
    evaluateCargoType(input.cargo, route),
    evaluateAvailability(route),
    evaluateEntrepostagem(input.necessitaEntrepostagem, route),
  ];

  const status = resolveStatus(reasons);
  const missingData = reasons
    .filter((reason) => reason.outcome === "INDETERMINATE")
    .map((reason) => reason.detail);

  return {
    routeId: route.id,
    status,
    summary: summarize(status, reasons),
    reasons,
    missingData,
  };
}

/** Avalia a elegibilidade de todas as rotas informadas para a carga. */
export function evaluateEligibility(
  input: EligibilityInput,
  routes: readonly Route[],
): RouteEligibility[] {
  return routes.map((route) => evaluateRouteEligibility(input, route));
}
