/**
 * Regime de Entreposto Aduaneiro (ETAPA 15).
 *
 * Regra (PLANEJAMENTO.md ETAPA 15, FONTES.md §19): modelar regras detalhadas
 * SOMENTE depois de validar admissão, suspensão tributária, DTA, recinto
 * habilitado, movimentação, saída, nacionalização/destinação, custos e prazo.
 * Como essas condições ainda NÃO foram validadas, o regime é modelado como um
 * contrato com estado explícito de validação — nada é inventado.
 *
 * Entreposto aduaneiro NÃO é sinônimo de retroporto, porto seco ou recinto
 * alfandegado genérico (FONTES §19).
 *
 * Módulo puro e determinístico (importa apenas o domínio).
 */

import type { SourceReference } from "../domain";

/** Condições que precisam ser validadas antes de modelar o regime em detalhe. */
export const ENTREPOSTO_CONDITIONS = [
  "ADMISSAO",
  "SUSPENSAO_TRIBUTARIA",
  "DTA",
  "RECINTO_HABILITADO",
  "MOVIMENTACAO",
  "SAIDA",
  "NACIONALIZACAO_DESTINACAO",
  "CUSTO",
  "PRAZO",
] as const;
export type EntrepostoCondition = (typeof ENTREPOSTO_CONDITIONS)[number];

export const VALIDATION_STATES = [
  "VALIDADA",
  "NAO_VALIDADA",
  "NAO_APLICAVEL",
] as const;
export type ValidationState = (typeof VALIDATION_STATES)[number];

export interface EntrepostoConditionStatus {
  condition: EntrepostoCondition;
  state: ValidationState;
  detail: string;
}

export interface EntrepostoRegime {
  conditions: EntrepostoConditionStatus[];
  source: SourceReference;
}

/** Fonte oficial preferida (FONTES §19). */
export const SOURCE_MANUAL_ENTREPOSTO: SourceReference = {
  id: "rfb-manual-entreposto-aduaneiro",
  title: "Manual de Entreposto Aduaneiro",
  publisher: "Receita Federal do Brasil",
  accessedAt: "2026-09-19",
  confidence: "A",
  kind: "OFFICIAL_REGULATION",
};

const CONDITION_LABEL: Record<EntrepostoCondition, string> = {
  ADMISSAO: "condições de admissão",
  SUSPENSAO_TRIBUTARIA: "suspensão tributária",
  DTA: "trânsito aduaneiro (DTA)",
  RECINTO_HABILITADO: "recinto habilitado",
  MOVIMENTACAO: "movimentação",
  SAIDA: "saída",
  NACIONALIZACAO_DESTINACAO: "nacionalização/destinação posterior",
  CUSTO: "custos",
  PRAZO: "prazo",
};

/**
 * Baseline do regime: todas as condições NÃO VALIDADAS. Reflete honestamente o
 * estado atual (FONTES §19) — a validar no Manual de Entreposto Aduaneiro.
 */
export function baselineEntrepostoRegime(): EntrepostoRegime {
  return {
    conditions: ENTREPOSTO_CONDITIONS.map((condition) => ({
      condition,
      state: "NAO_VALIDADA",
      detail: `A validar: ${CONDITION_LABEL[condition]} (Manual de Entreposto Aduaneiro).`,
    })),
    source: SOURCE_MANUAL_ENTREPOSTO,
  };
}

export const ENTREPOSTO_READINESS = [
  "PRONTO",
  "PENDENTE_VALIDACAO",
  "INDETERMINADO",
] as const;
export type EntrepostoReadiness = (typeof ENTREPOSTO_READINESS)[number];

export interface EntrepostoAssessment {
  readiness: EntrepostoReadiness;
  pendingConditions: EntrepostoCondition[];
  conditions: EntrepostoConditionStatus[];
  note: string;
}

const DISTINCTION_NOTE =
  "Entreposto aduaneiro não deve ser confundido com retroporto, porto seco ou recinto alfandegado genérico (FONTES §19).";

/**
 * Avalia a prontidão do regime. Enquanto houver condição não validada, o
 * regime está PENDENTE_VALIDACAO — não se modela custo/prazo detalhado ainda.
 */
export function assessEntrepostoRegime(
  regime: EntrepostoRegime,
): EntrepostoAssessment {
  const pendingConditions = regime.conditions
    .filter((c) => c.state === "NAO_VALIDADA")
    .map((c) => c.condition);

  const readiness: EntrepostoReadiness =
    regime.conditions.length === 0
      ? "INDETERMINADO"
      : pendingConditions.length === 0
        ? "PRONTO"
        : "PENDENTE_VALIDACAO";

  return {
    readiness,
    pendingConditions,
    conditions: regime.conditions,
    note: DISTINCTION_NOTE,
  };
}
