/**
 * Regime de Entreposto Aduaneiro (ETAPA 15 + rodada de correção).
 *
 * Regra (PLANEJAMENTO.md ETAPA 15, FONTES.md §19): modelar regras detalhadas
 * SOMENTE depois de validar admissão, suspensão tributária, DTA, recinto
 * habilitado, movimentação, saída, nacionalização/destinação, custos e prazo.
 * Como não foram validadas, o regime é um contrato com estado explícito por
 * condição — e nada pode ficar PRONTO sem evidência (AJUSTE 15.2/15.5).
 *
 * Entreposto é um REGIME (ver domain/customs `CustomsRegime`), não um tipo de
 * recinto (AJUSTE 15.3). Puro e determinístico.
 */

import type { CustomsRegime, Evidence, SourceReference } from "../domain";

/** Condições canônicas que precisam ser validadas antes do regime. */
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

export const ENTREPOSTO_REGIME: CustomsRegime = "ENTREPOSTO_ADUANEIRO";

/**
 * Estado de uma condição. VALIDADA e NAO_APLICAVEL EXIGEM evidência
 * (AJUSTE 15.2/15.5): "validado"/"não se aplica" precisa de base rastreável.
 * NAO_VALIDADA não tem evidência suficiente.
 */
export type EntrepostoConditionStatus =
  | { condition: EntrepostoCondition; state: "VALIDADA"; detail: string; evidence: Evidence }
  | { condition: EntrepostoCondition; state: "NAO_VALIDADA"; detail: string }
  | {
      condition: EntrepostoCondition;
      state: "NAO_APLICAVEL";
      detail: string;
      evidence: Evidence;
    };

export interface EntrepostoRegime {
  conditions: EntrepostoConditionStatus[];
  source: SourceReference;
}

/**
 * Fonte oficial preferida — ainda A CONSULTAR (AJUSTE 15.1). Não registra
 * accessedAt/confiança como se já tivesse sido verificada; é orientação
 * administrativa (OFFICIAL_GUIDANCE), não norma.
 */
export const SOURCE_MANUAL_ENTREPOSTO: SourceReference = {
  id: "rfb-manual-entreposto-aduaneiro",
  title: "Manual de Entreposto Aduaneiro (fonte a consultar)",
  publisher: "Receita Federal do Brasil",
  consulted: false,
  kind: "OFFICIAL_GUIDANCE",
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
 * Baseline do regime: todas as condições NÃO VALIDADAS (sem evidência), pois
 * a fonte ainda não foi consultada (FONTES §19).
 */
export function baselineEntrepostoRegime(): EntrepostoRegime {
  return {
    conditions: ENTREPOSTO_CONDITIONS.map((condition) => ({
      condition,
      state: "NAO_VALIDADA" as const,
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

export const ENTREPOSTO_INTEGRITY = [
  "OK",
  "CONDICAO_AUSENTE",
  "CONDICAO_DUPLICADA",
] as const;
export type EntrepostoIntegrity = (typeof ENTREPOSTO_INTEGRITY)[number];

export interface EntrepostoAssessment {
  readiness: EntrepostoReadiness;
  integrity: EntrepostoIntegrity;
  pendingConditions: EntrepostoCondition[];
  conditions: EntrepostoConditionStatus[];
  /** Proveniência do regime, preservada para auditoria (AJUSTE 15.6). */
  source: SourceReference;
  note: string;
}

const DISTINCTION_NOTE =
  "Entreposto aduaneiro é um regime, não um tipo de recinto: não se confunde com retroporto, porto seco ou recinto alfandegado genérico (FONTES §19).";

/**
 * Verifica que o conjunto contém exatamente uma vez cada condição canônica
 * (AJUSTE 15.4). Retorna a primeira violação encontrada.
 */
function checkIntegrity(
  conditions: EntrepostoConditionStatus[],
): EntrepostoIntegrity {
  const seen = new Set<EntrepostoCondition>();
  for (const c of conditions) {
    if (seen.has(c.condition)) {
      return "CONDICAO_DUPLICADA";
    }
    seen.add(c.condition);
  }
  for (const required of ENTREPOSTO_CONDITIONS) {
    if (!seen.has(required)) {
      return "CONDICAO_AUSENTE";
    }
  }
  return "OK";
}

/**
 * Avalia a prontidão do regime. Só calcula prontidão sobre um conjunto íntegro
 * (todas as condições canônicas, sem duplicatas). Estrutura inválida =>
 * INDETERMINADO, nunca PRONTO (AJUSTE 15.4). VALIDADA/NAO_APLICAVEL só contam
 * como não pendentes porque o tipo já exige evidência (AJUSTE 15.2/15.5).
 */
export function assessEntrepostoRegime(
  regime: EntrepostoRegime,
): EntrepostoAssessment {
  const integrity = checkIntegrity(regime.conditions);

  if (integrity !== "OK") {
    return {
      readiness: "INDETERMINADO",
      integrity,
      pendingConditions: regime.conditions
        .filter((c) => c.state === "NAO_VALIDADA")
        .map((c) => c.condition),
      conditions: regime.conditions,
      source: regime.source,
      note: DISTINCTION_NOTE,
    };
  }

  const pendingConditions = regime.conditions
    .filter((c) => c.state === "NAO_VALIDADA")
    .map((c) => c.condition);

  return {
    readiness: pendingConditions.length === 0 ? "PRONTO" : "PENDENTE_VALIDACAO",
    integrity,
    pendingConditions,
    conditions: regime.conditions,
    source: regime.source,
    note: DISTINCTION_NOTE,
  };
}
