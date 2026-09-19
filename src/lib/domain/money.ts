/**
 * Valores monetários rastreáveis do domínio OmegaSync.
 *
 * Evolução de `ValorMonetarioRastreavel` do motor anterior: um valor
 * monetário é um `TrackedValue<number>`, ou seja, pode ser conhecido
 * (com evidência), desconhecido ou não aplicável — nunca um zero implícito.
 *
 * A moeda de referência do domínio é o BRL. Todos os valores são expressos
 * em reais.
 */

import type { TrackedValue } from "./information";
import { known, notApplicable, unknown } from "./information";
import type { Evidence } from "./provenance";

export const CURRENCY = "BRL" as const;
export type Currency = typeof CURRENCY;

/** Valor monetário rastreável em BRL. */
export type MonetaryAmount = TrackedValue<number>;

/** Valor monetário conhecido, com a evidência que o sustenta. */
export function knownAmount(value: number, evidence: Evidence): MonetaryAmount {
  return known(value, evidence);
}

/** Valor monetário desconhecido (não é zero). */
export function unknownAmount(reason?: string): MonetaryAmount {
  return unknown(reason);
}

/** Valor monetário não aplicável a este contexto. */
export function notApplicableAmount(reason?: string): MonetaryAmount {
  return notApplicable(reason);
}
