/**
 * Regra da janela de 48 horas (ETAPA 7).
 *
 * Fontes (FONTES.md §15): IN RFB nº 248/2002, art. 71 §3º; Portaria ALF/STS
 * nº 209/2026 (vigência 01/09/2026); Portaria ALF/STS nº 210/2026.
 *
 * Correção conceitual preservada: a regra de 48h NÃO nasceu com a DUIMP —
 * vincula-se ao art. 71 §3º da IN RFB 248/2002.
 *
 * Regra do PLANEJAMENTO.md (ETAPA 7): NÃO aplicar universalmente a toda carga.
 * Modelar explicitamente APLICAVEL / NAO_APLICAVEL / INDETERMINADO ANTES de
 * avaliar a viabilidade da janela. Nunca criar tarifa de no-show fictícia
 * (FONTES.md §16): o custo da perda da janela permanece desconhecido.
 *
 * Módulo puro e determinístico (importa apenas o domínio).
 */

import type { Evidence, SourceReference, TrackedValue } from "../domain";
import { createEvidence, isKnown, isNotApplicable } from "../domain";

// --- Fontes regulatórias (FONTES.md §15) ---------------------------------

export const SOURCE_IN_RFB_248: SourceReference = {
  id: "in-rfb-248-2002-art-71-3",
  title: "IN RFB nº 248/2002, art. 71 §3º",
  publisher: "Receita Federal do Brasil",
  accessedAt: "2026-09-19",
  confidence: "A",
  kind: "OFFICIAL_REGULATION",
};

export const SOURCE_PORTARIA_ALF_STS_209: SourceReference = {
  id: "portaria-alf-sts-209-2026",
  title: "Portaria ALF/STS nº 209/2026",
  publisher: "Alfândega do Porto de Santos (ALF/STS)",
  accessedAt: "2026-09-19",
  effectiveFrom: "2026-09-01",
  confidence: "A",
  kind: "OFFICIAL_REGULATION",
};

export const SOURCE_PORTARIA_ALF_STS_210: SourceReference = {
  id: "portaria-alf-sts-210-2026",
  title: "Portaria ALF/STS nº 210/2026",
  publisher: "Alfândega do Porto de Santos (ALF/STS)",
  accessedAt: "2026-09-19",
  confidence: "A",
  kind: "OFFICIAL_REGULATION",
};

// --- Regra documentada (FONTES.md §15) -----------------------------------

/**
 * Detalhes pesquisados da regra, tratados como conhecimento documentado com
 * fonte. Não são recalculados aqui; servem de referência auditável.
 */
export const WINDOW_48H_RULE = {
  retrievalBusinessHours: 48,
  retrievalUnit: "horas úteis" as const,
  countingFromYardArrival:
    "48 horas úteis a partir da chegada da carga ao pátio",
  countingWhenNoFacilityDiscriminated:
    "quando não há recinto discriminado no agendamento, a contagem inicia no fim da operação da embarcação",
  schedulingRequestDeadlines: [
    { berthingWindow: "13h30–18h59", requestUntil: "10h30" },
    { berthingWindow: "19h00–13h29 do dia seguinte", requestUntil: "16h00" },
  ],
  complementaryRequest: "uma solicitação complementar, até 2 dias corridos",
  additionalStay:
    "o operador pode manter a carga por segurança/conveniência",
  consequenceIfExceeded:
    "excedido o prazo, a carga vai para armazenagem e perde o status de carga-pátio",
  conceptualNote:
    "A regra de 48h não nasceu com a DUIMP; vincula-se ao art. 71 §3º da IN RFB 248/2002.",
  sources: [
    SOURCE_IN_RFB_248,
    SOURCE_PORTARIA_ALF_STS_209,
    SOURCE_PORTARIA_ALF_STS_210,
  ],
} as const;

// --- Evidências de campo (FONTES.md §16) ---------------------------------

/** E31 — N=1: reagendamento por problema com veículo de retirada. */
export const EVID_E31_JANELA: Evidence = createEvidence("PESQUISA_CAMPO", {
  reference:
    "E31 (N=1): reagendamento observado por problema com veículo de retirada, não por falta de capacidade do terminal (FONTES §16)",
  confidence: "N1",
});

/** E28 — N=1: perda da janela gerou custo adicional; valor não capturado. */
export const EVID_E28_JANELA: Evidence = createEvidence("PESQUISA_CAMPO", {
  reference:
    "E28 (N=1): perda da janela de 48h gerou custo adicional; valor não capturado (FONTES §16)",
  confidence: "N1",
});

// --- Avaliação ------------------------------------------------------------

export const WINDOW_48H_APPLICABILITY = [
  "APLICAVEL",
  "NAO_APLICAVEL",
  "INDETERMINADO",
] as const;
export type Window48hApplicability =
  (typeof WINDOW_48H_APPLICABILITY)[number];

export const WINDOW_48H_VIABILITY = [
  "VIAVEL",
  "INVIAVEL",
  "INDETERMINADO",
] as const;
export type Window48hViability = (typeof WINDOW_48H_VIABILITY)[number];

/**
 * Contexto operacional para avaliar a janela. Todos os sinais são rastreáveis
 * e podem ser desconhecidos (unknown != false).
 */
export interface Window48hContext {
  /** A operação é de carga-pátio (retirada direta do terminal)? */
  cargoYardWithdrawal?: TrackedValue<boolean>;
  /** Há recinto discriminado no agendamento? (define a base de contagem) */
  facilityDiscriminatedInSchedule?: TrackedValue<boolean>;
  /** A retirada é viável dentro das 48h úteis? */
  withinBusinessWindow?: TrackedValue<boolean>;
}

export interface Window48hAssessment {
  applicability: Window48hApplicability;
  /** Só avaliada quando a regra é aplicável; caso contrário, null. */
  viability: Window48hViability | null;
  /** Base de contagem do prazo, quando aplicável e conhecida. */
  countingBasis: string | null;
  /** Consequência quando a janela é excedida (INVIAVEL). */
  consequenceIfExceeded: string | null;
  missingData: string[];
  /** Evidência dos inputs conhecidos que sustentam a conclusão (AJUSTE 7.4). */
  inputEvidence: Evidence[];
  /** Fontes regulatórias da regra (AJUSTE 7.4/7.7). */
  ruleSources: SourceReference[];
  /** Evidência de campo (E28/E31) quando a janela é excedida. */
  evidence: Evidence[];
}

/**
 * Resolve aplicabilidade distinguindo NOT_APPLICABLE de UNKNOWN (AJUSTE 7.3):
 * carga-pátio KNOWN(true) => APLICAVEL; KNOWN(false) ou NOT_APPLICABLE =>
 * NAO_APLICAVEL; UNKNOWN/ausente => INDETERMINADO.
 */
function resolveApplicability(
  flag: TrackedValue<boolean> | undefined,
): Window48hApplicability {
  if (!flag) {
    return "INDETERMINADO";
  }
  if (isNotApplicable(flag)) {
    return "NAO_APLICAVEL";
  }
  if (!isKnown(flag)) {
    return "INDETERMINADO";
  }
  return flag.value ? "APLICAVEL" : "NAO_APLICAVEL";
}

/**
 * Avalia a janela de 48h para o contexto informado. Primeiro decide a
 * aplicabilidade; só então (quando APLICAVEL) avalia a viabilidade.
 */
export function assessWindow48h(
  context: Window48hContext,
): Window48hAssessment {
  const applicability = resolveApplicability(context.cargoYardWithdrawal);
  const missingData: string[] = [];
  const evidence: Evidence[] = [];
  const inputEvidence = collectInputEvidence(context);
  const ruleSources = [...WINDOW_48H_RULE.sources];

  const base = (
    viability: Window48hViability | null,
    countingBasis: string | null,
    consequenceIfExceeded: string | null,
  ): Window48hAssessment => ({
    applicability,
    viability,
    countingBasis,
    consequenceIfExceeded,
    missingData,
    inputEvidence,
    ruleSources,
    evidence,
  });

  if (applicability === "INDETERMINADO") {
    missingData.push(
      "Não informado se a operação é de carga-pátio (retirada direta).",
    );
    return base(null, null, null);
  }

  if (applicability === "NAO_APLICAVEL") {
    return base(null, null, null);
  }

  // APLICAVEL: a base de contagem precisa estar resolvida antes de concluir a
  // viabilidade (AJUSTE 7.2 — Opção A: o motor não conclui sem a base).
  const discriminated = context.facilityDiscriminatedInSchedule;
  let countingBasis: string | null = null;
  if (discriminated && isKnown(discriminated)) {
    countingBasis = discriminated.value
      ? WINDOW_48H_RULE.countingFromYardArrival
      : WINDOW_48H_RULE.countingWhenNoFacilityDiscriminated;
  }

  if (countingBasis === null) {
    missingData.push(
      "Não informado se há recinto discriminado no agendamento (base de contagem).",
    );
    return base("INDETERMINADO", null, null);
  }

  const within = context.withinBusinessWindow;
  if (!within || !isKnown(within)) {
    missingData.push(
      "Não informado se a retirada é viável dentro das 48h úteis.",
    );
    return base("INDETERMINADO", countingBasis, null);
  }

  if (within.value) {
    return base("VIAVEL", countingBasis, null);
  }

  // Excedida: evidência de campo sobre a perda da janela (custo não capturado).
  evidence.push(EVID_E28_JANELA, EVID_E31_JANELA);
  return base("INVIAVEL", countingBasis, WINDOW_48H_RULE.consequenceIfExceeded);
}

/** Coleta a evidência dos inputs conhecidos (AJUSTE 7.4). */
function collectInputEvidence(context: Window48hContext): Evidence[] {
  const flags = [
    context.cargoYardWithdrawal,
    context.facilityDiscriminatedInSchedule,
    context.withinBusinessWindow,
  ];
  const result: Evidence[] = [];
  for (const flag of flags) {
    if (flag && isKnown(flag)) {
      result.push(flag.evidence);
    }
  }
  return result;
}
