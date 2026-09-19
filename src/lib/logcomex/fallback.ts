/**
 * Fallback offline da análise documental (ETAPA 11).
 *
 * Quando o Logcomex está indisponível, o enriquecimento não é inventado: todos
 * os campos permanecem desconhecidos e a proveniência fica explícita como
 * fallback offline (FONTES.md §29). Preserva o padrão do repo anterior de
 * fallback explícito, sem transformar indisponibilidade em falsa certeza.
 */

import type { SourceReference } from "../domain";
import { unknown, unknownAmount } from "../domain";
import type { DocumentEnrichment } from "./document-analysis-adapter";

export function fallbackSource(accessedAt: string): SourceReference {
  return {
    id: "logcomex-fallback-offline",
    title: "Fallback offline (Logcomex indisponível)",
    publisher: "OmegaSync",
    accessedAt,
    kind: "INTERNAL_FALLBACK",
  };
}

/** Enriquecimento vazio (tudo desconhecido) para uso quando o provedor falha. */
export function fallbackEnrichment(accessedAt: string): DocumentEnrichment {
  const source = fallbackSource(accessedAt);
  const reason = "Logcomex indisponível: enriquecimento não disponível.";

  return {
    origin: unknown(reason),
    destination: unknown(reason),
    incoterm: unknown(reason),
    grossWeightKg: unknown(reason),
    netWeightKg: unknown(reason),
    fob: unknownAmount(reason),
    freight: unknownAmount(reason),
    insurance: unknownAmount(reason),
    items: [],
    documentRisks: [],
    summary: unknown(reason),
    overallConfidence: unknown(reason),
    source,
  };
}
