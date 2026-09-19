/**
 * Modelo explícito de estado de informação do domínio OmegaSync.
 *
 * O motor anterior representava ausência apenas como `T | null`, o que
 * confundia "desconhecido" com "não aplicável". A mentoria atual e o
 * PLANEJAMENTO.md (ETAPA 1) exigem a distinção explícita entre três estados:
 *
 *   KNOWN          -> valor conhecido e rastreável até uma evidência
 *   UNKNOWN        -> informação ainda não conhecida (NUNCA equivale a zero)
 *   NOT_APPLICABLE -> regra/valor não incide neste contexto
 *
 * Regra semântica obrigatória (FONTES.md §8):
 *   unknown != zero
 *   unknown != false
 *   not applicable != false
 */

import type { Evidence } from "./provenance";

export const INFORMATION_STATUSES = [
  "KNOWN",
  "UNKNOWN",
  "NOT_APPLICABLE",
] as const;
export type InformationStatus = (typeof INFORMATION_STATUSES)[number];

/** Valor conhecido e rastreável até uma evidência. */
export interface KnownValue<T> {
  status: "KNOWN";
  value: T;
  evidence: Evidence;
}

/** Valor cuja informação ainda não é conhecida. Não deve virar zero. */
export interface UnknownValue {
  status: "UNKNOWN";
  reason?: string;
}

/** Valor que não se aplica a este contexto (regra não incidente). */
export interface NotApplicableValue {
  status: "NOT_APPLICABLE";
  reason?: string;
}

/**
 * União discriminada de um valor rastreável de tipo `T`.
 * O discriminante é `status`.
 */
export type TrackedValue<T> = KnownValue<T> | UnknownValue | NotApplicableValue;

/** Constrói um valor conhecido, exigindo a evidência que o sustenta. */
export function known<T>(value: T, evidence: Evidence): KnownValue<T> {
  return { status: "KNOWN", value, evidence };
}

/** Constrói um valor desconhecido, com motivo opcional. */
export function unknown(reason?: string): UnknownValue {
  return { status: "UNKNOWN", reason };
}

/** Constrói um valor não aplicável, com motivo opcional. */
export function notApplicable(reason?: string): NotApplicableValue {
  return { status: "NOT_APPLICABLE", reason };
}

export function isKnown<T>(value: TrackedValue<T>): value is KnownValue<T> {
  return value.status === "KNOWN";
}

export function isUnknown<T>(value: TrackedValue<T>): value is UnknownValue {
  return value.status === "UNKNOWN";
}

export function isNotApplicable<T>(
  value: TrackedValue<T>,
): value is NotApplicableValue {
  return value.status === "NOT_APPLICABLE";
}

/** Retorna o valor conhecido ou o fallback informado. */
export function valueOr<T>(value: TrackedValue<T>, fallback: T): T {
  return value.status === "KNOWN" ? value.value : fallback;
}

/**
 * Retorna o valor conhecido ou `null`.
 * Preserva a distinção `null != 0`: um `KnownValue<number>` de 0 retorna 0,
 * enquanto UNKNOWN e NOT_APPLICABLE retornam null.
 */
export function valueOrNull<T>(value: TrackedValue<T>): T | null {
  return value.status === "KNOWN" ? value.value : null;
}
