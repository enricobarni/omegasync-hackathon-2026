/**
 * Tratamento administrativo / anuência (ETAPA 8).
 *
 * Preserva a descoberta central do projeto (FONTES.md §13.1): canal verde da
 * Receita NÃO significa, necessariamente, carga liberada — a liberação também
 * depende de anuência/LPCO, que é independente do canal aduaneiro.
 *
 * Padrão preservado do motor anterior: resolver o dado (anuência) ANTES de
 * executar a regra, com fallback explícito quando não há mapeamento.
 *
 * Módulo puro e determinístico (importa apenas o domínio).
 */

import type {
  AnuenciaState,
  CustomsChannel,
  Evidence,
  ResolvedAnuencia,
} from "../domain";
import { createEvidence } from "../domain";
import type { AnuenciaRegistryEntry } from "./anuencia-registry";

// --- Resolução da anuência ------------------------------------------------

export type AnuenciaResolution =
  | { status: "RESOLVED"; anuencia: ResolvedAnuencia }
  | { status: "NOT_FOUND"; ncm: string; reason: string };

/**
 * Resolve a anuência por NCM a partir do registro fornecido. Com o baseline
 * vazio, retorna sempre NOT_FOUND — o que é correto: sem fonte, a anuência
 * permanece não resolvida (unknown != "sem anuência").
 */
export function resolveAnuenciaByNcm(
  ncm: string,
  registry: AnuenciaRegistryEntry[],
): AnuenciaResolution {
  const entry = registry.find((item) => item.ncm === ncm);

  if (!entry) {
    return {
      status: "NOT_FOUND",
      ncm,
      reason:
        "Sem mapeamento de anuência para a NCM. Consultar o Tratamento Administrativo no Portal Único/Siscomex.",
    };
  }

  return {
    status: "RESOLVED",
    anuencia: {
      state: entry.state,
      organs: [...entry.organs],
      evidence: entry.evidence,
    },
  };
}

// --- Predicados de estado (reaproveitados do motor anterior) --------------

export function anuenciaBlocksOperation(state: AnuenciaState): boolean {
  return state === "IMPEDIMENTO";
}

export function anuenciaBlocksBeforeShipment(state: AnuenciaState): boolean {
  return state === "PREVIA_AO_EMBARQUE";
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

export const CLEARANCE_STATUSES = [
  "LIBERADA",
  "BLOQUEADA",
  "PENDENTE",
  "INDETERMINADA",
] as const;
export type ClearanceStatus = (typeof CLEARANCE_STATUSES)[number];

export interface ClearanceInput {
  channel: CustomsChannel;
  anuencia: AnuenciaResolution;
}

export interface ClearanceAssessment {
  status: ClearanceStatus;
  reasons: string[];
  missingData: string[];
}

/**
 * Avalia a liberação combinando canal e anuência. Codifica explicitamente que
 * canal verde não basta: verde com anuência não resolvida é INDETERMINADA, e
 * verde com anuência não automática posterior é PENDENTE — nunca LIBERADA.
 * A anuência impeditiva/prévia bloqueia independentemente do canal.
 */
export function assessClearance(input: ClearanceInput): ClearanceAssessment {
  const reasons: string[] = [];
  const missingData: string[] = [];

  // 1. Anuência não resolvida: não é possível confirmar liberação.
  if (input.anuencia.status === "NOT_FOUND") {
    missingData.push(input.anuencia.reason);
    return { status: "INDETERMINADA", reasons, missingData };
  }

  const state = input.anuencia.anuencia.state;

  // 2. Anuência que bloqueia, independentemente do canal.
  if (anuenciaBlocksOperation(state)) {
    reasons.push("Anuência impede a operação (IMPEDIMENTO).");
    return { status: "BLOQUEADA", reasons, missingData };
  }
  if (anuenciaBlocksBeforeShipment(state)) {
    reasons.push("Anuência prévia ao embarque não atendida.");
    return { status: "BLOQUEADA", reasons, missingData };
  }

  // 3. Canal aduaneiro (com anuência não bloqueante).
  if (input.channel === "NAO_REVELADO") {
    missingData.push("Canal aduaneiro ainda não revelado.");
    return { status: "INDETERMINADA", reasons, missingData };
  }

  if (input.channel !== "VERDE") {
    reasons.push(`Canal ${input.channel} exige conferência aduaneira.`);
    if (anuenciaRequiresPosteriorClearance(state)) {
      reasons.push("Anuência não automática posterior ainda pendente.");
    }
    return { status: "PENDENTE", reasons, missingData };
  }

  // 4. Canal verde: NÃO implica liberação automática (descoberta central).
  if (anuenciaRequiresPosteriorClearance(state)) {
    reasons.push(
      "Canal verde, mas a anuência não automática posterior ainda precisa ser atendida.",
    );
    return { status: "PENDENTE", reasons, missingData };
  }

  reasons.push("Canal verde e anuência satisfeita.");
  return { status: "LIBERADA", reasons, missingData };
}

// --- Prazos: estimativa de pesquisa, não SLA oficial (FONTES §14) ---------

export interface AnuenciaDeadlineEstimate {
  value: number;
  unit: "DIAS_UTEIS" | "DIAS_CORRIDOS";
  evidence: Evidence;
  caveat: string;
}

const DEADLINE_CAVEAT =
  "Estimativa de pesquisa, não SLA oficial; confirmar fonte primária (FONTES §14).";

/**
 * Estimativa de prazo por modalidade de anuência. Retorna null quando não há
 * estimativa registrada. Nunca tratar como prazo oficial.
 */
export function getAnuenciaDeadlineEstimate(
  state: AnuenciaState,
): AnuenciaDeadlineEstimate | null {
  if (state === "NAO_AUTOMATICA_POSTERIOR") {
    return {
      value: 10,
      unit: "DIAS_UTEIS",
      evidence: createEvidence("PESQUISA_CAMPO", {
        reference: "~10 dias úteis observados (FONTES §14)",
        confidence: "C",
      }),
      caveat: DEADLINE_CAVEAT,
    };
  }

  if (state === "PREVIA_AO_EMBARQUE") {
    return {
      value: 60,
      unit: "DIAS_CORRIDOS",
      evidence: createEvidence("PESQUISA_CAMPO", {
        reference: "até ~60 dias corridos (FONTES §14)",
        confidence: "C",
      }),
      caveat: DEADLINE_CAVEAT,
    };
  }

  return null;
}
