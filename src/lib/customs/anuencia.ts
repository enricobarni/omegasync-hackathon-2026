/**
 * Tratamento administrativo / anuência (ETAPA 8 + rodada de correção).
 *
 * Preserva a descoberta central (FONTES.md §13.1): canal verde não significa
 * carga liberada — a liberação depende de anuência/LPCO, independente do canal.
 *
 * Correções desta rodada:
 * - modalidade (state) != status de cumprimento (fulfillment) (AJUSTE 8.2/8.3);
 * - resolução por NCM considera atributos e múltiplas entradas (AJUSTE 8.1);
 * - estados de resolução ricos (AJUSTE 8.8);
 * - NCM normalizada no boundary (AJUSTE 8.9);
 * - estimativas de prazo preservam natureza aproximada e origem (AJUSTE 8.4/8.5);
 * - liberação carrega evidência auditável (AJUSTE 8.7).
 *
 * Módulo puro e determinístico (importa apenas o domínio).
 */

import type {
  AnuenciaState,
  ClearanceStatus,
  CustomsChannel,
  Evidence,
  ResolvedAnuencia,
} from "../domain";
import { createEvidence } from "../domain";
import type { AnuenciaRegistryEntry } from "./anuencia-registry";

// --- Normalização de NCM (AJUSTE 8.9) ------------------------------------

/** Normaliza NCM para 8 dígitos (remove pontos/espaços). null se inválida. */
export function normalizeNcm(ncm: string): string | null {
  const digits = ncm.replace(/[^\d]/g, "");
  return /^\d{8}$/.test(digits) ? digits : null;
}

// --- Resolução da anuência (AJUSTE 8.1/8.8) ------------------------------

export type AnuenciaResolution =
  | { status: "RESOLVED"; anuencia: ResolvedAnuencia }
  | { status: "REQUIRES_ATTRIBUTES"; ncm: string; required: string[] }
  | { status: "AMBIGUOUS"; ncm: string; matches: number }
  | { status: "INVALID_NCM"; ncm: string; reason: string }
  | { status: "NOT_FOUND"; ncm: string; reason: string };

function attributesSatisfied(
  required: string[] | undefined,
  provided: string[],
): boolean {
  if (!required || required.length === 0) {
    return true;
  }
  return required.every((attr) => provided.includes(attr));
}

/**
 * Resolve a anuência por NCM. A NCM é normalizada; entradas com
 * `requiredAttributes` só resolvem quando os atributos da operação são
 * fornecidos e compatíveis. Nunca retorna RESOLVED prematuro (FONTES §13.5).
 */
export function resolveAnuenciaByNcm(
  ncm: string,
  registry: AnuenciaRegistryEntry[],
  operationAttributes: string[] = [],
): AnuenciaResolution {
  const normalized = normalizeNcm(ncm);
  if (normalized === null) {
    return {
      status: "INVALID_NCM",
      ncm,
      reason: "NCM inválida: esperado 8 dígitos.",
    };
  }

  const matches = registry.filter(
    (entry) => normalizeNcm(entry.ncm) === normalized,
  );

  if (matches.length === 0) {
    return {
      status: "NOT_FOUND",
      ncm: normalized,
      reason:
        "Sem mapeamento de anuência para a NCM. Consultar o Tratamento Administrativo no Portal Único/Siscomex.",
    };
  }

  const compatible = matches.filter((entry) =>
    attributesSatisfied(entry.requiredAttributes, operationAttributes),
  );

  if (compatible.length === 0) {
    // Há entradas, mas exigem atributos não fornecidos/incompatíveis.
    const required = Array.from(
      new Set(matches.flatMap((entry) => entry.requiredAttributes ?? [])),
    );
    return { status: "REQUIRES_ATTRIBUTES", ncm: normalized, required };
  }

  if (compatible.length > 1) {
    return { status: "AMBIGUOUS", ncm: normalized, matches: compatible.length };
  }

  const entry = compatible[0];
  return {
    status: "RESOLVED",
    anuencia: {
      state: entry.state,
      // O registro dá a modalidade, não o cumprimento nesta operação.
      fulfillment: "UNKNOWN",
      organs: [...entry.organs],
      evidence: entry.evidence,
    },
  };
}

// --- Predicados de estado -------------------------------------------------

export function anuenciaBlocksOperation(state: AnuenciaState): boolean {
  return state === "IMPEDIMENTO";
}

export function anuenciaRequiresPosteriorClearance(
  state: AnuenciaState,
): boolean {
  return state === "NAO_AUTOMATICA_POSTERIOR";
}

export function anuenciaAllowsContinuation(state: AnuenciaState): boolean {
  return state === "SEM_ANUENCIA" || state === "AUTOMATICA";
}

// --- Liberação: canal + anuência (a descoberta central) -------------------

export interface ClearanceInput {
  channel: CustomsChannel;
  channelEvidence?: Evidence;
  anuencia: AnuenciaResolution;
}

export interface ClearanceAssessment {
  status: ClearanceStatus;
  reasons: string[];
  missingData: string[];
  /** Evidências dos inputs determinantes (AJUSTE 8.7). */
  evidence: Evidence[];
}

/**
 * Avalia a liberação combinando canal e anuência. Canal verde NÃO basta:
 * anuência não confirmada (fulfillment != SATISFIED) mantém PENDENTE; anuência
 * impeditiva ou não atendida bloqueia independentemente do canal. A modalidade
 * (ex.: AUTOMATICA/PREVIA_AO_EMBARQUE) NÃO é convertida em cumprimento.
 */
export function assessClearance(input: ClearanceInput): ClearanceAssessment {
  const reasons: string[] = [];
  const missingData: string[] = [];
  const evidence: Evidence[] = [];
  if (input.channelEvidence) {
    evidence.push(input.channelEvidence);
  }

  if (input.anuencia.status !== "RESOLVED") {
    missingData.push(resolutionReason(input.anuencia));
    return { status: "INDETERMINADA", reasons, missingData, evidence };
  }

  const { state, fulfillment, evidence: anuenciaEvidence } =
    input.anuencia.anuencia;
  evidence.push(anuenciaEvidence);

  if (anuenciaBlocksOperation(state)) {
    reasons.push("Anuência impede a operação (IMPEDIMENTO).");
    return { status: "BLOQUEADA", reasons, missingData, evidence };
  }

  // Se há anuência (state != SEM_ANUENCIA), o cumprimento precisa ser confirmado.
  if (state !== "SEM_ANUENCIA") {
    if (fulfillment === "NOT_SATISFIED") {
      reasons.push(`Anuência (${state}) não atendida.`);
      return { status: "BLOQUEADA", reasons, missingData, evidence };
    }
    if (fulfillment !== "SATISFIED") {
      reasons.push(
        `Anuência (${state}) ainda não confirmada como atendida nesta operação.`,
      );
      missingData.push("Status de cumprimento da anuência não confirmado.");
      return { status: "PENDENTE", reasons, missingData, evidence };
    }
  }

  // Anuência satisfeita ou inexistente: aplica o gate do canal.
  if (input.channel === "NAO_REVELADO") {
    missingData.push("Canal aduaneiro ainda não revelado.");
    return { status: "INDETERMINADA", reasons, missingData, evidence };
  }
  if (input.channel !== "VERDE") {
    reasons.push(`Canal ${input.channel} exige conferência aduaneira.`);
    return { status: "PENDENTE", reasons, missingData, evidence };
  }

  reasons.push("Canal verde e anuência satisfeita/inexistente.");
  return { status: "LIBERADA", reasons, missingData, evidence };
}

function resolutionReason(resolution: AnuenciaResolution): string {
  switch (resolution.status) {
    case "NOT_FOUND":
      return resolution.reason;
    case "INVALID_NCM":
      return resolution.reason;
    case "REQUIRES_ATTRIBUTES":
      return `Anuência exige atributos não fornecidos: ${resolution.required.join(", ") || "(não especificados)"}.`;
    case "AMBIGUOUS":
      return "Há múltiplos tratamentos possíveis para a NCM; atributos adicionais são necessários.";
    default:
      return "Anuência não resolvida.";
  }
}

// --- Prazos: estimativa aproximada, não SLA (AJUSTE 8.4/8.5) -------------

export const DEADLINE_ESTIMATE_TYPES = [
  "APPROXIMATE",
  "UP_TO_APPROXIMATE",
] as const;
export type DeadlineEstimateType = (typeof DEADLINE_ESTIMATE_TYPES)[number];

export interface AnuenciaDeadlineEstimate {
  estimateType: DeadlineEstimateType;
  value: number;
  unit: "DIAS_UTEIS" | "DIAS_CORRIDOS";
  evidence: Evidence;
  caveat: string;
}

const DEADLINE_CAVEAT =
  "Estimativa aproximada, não SLA oficial; confirmar fonte primária (FONTES §14).";

export function getAnuenciaDeadlineEstimate(
  state: AnuenciaState,
): AnuenciaDeadlineEstimate | null {
  if (state === "NAO_AUTOMATICA_POSTERIOR") {
    return {
      estimateType: "APPROXIMATE",
      value: 10,
      unit: "DIAS_UTEIS",
      // ~10 dias tem observação de campo N=1 associada (FONTES §14).
      evidence: createEvidence("PESQUISA_CAMPO", {
        reference: "~10 dias úteis observados, N=1 (FONTES §14)",
        confidence: "N1",
      }),
      caveat: DEADLINE_CAVEAT,
    };
  }

  if (state === "PREVIA_AO_EMBARQUE") {
    return {
      estimateType: "UP_TO_APPROXIMATE",
      value: 60,
      unit: "DIAS_CORRIDOS",
      // ~60 dias vem do baseline documental anterior, NÃO de pesquisa de campo.
      evidence: createEvidence("PREMISSA_SIMULACAO", {
        reference:
          "até ~60 dias corridos — baseline documental anterior, a validar em fonte primária (FONTES §14)",
        confidence: "C",
      }),
      caveat: DEADLINE_CAVEAT,
    };
  }

  return null;
}
