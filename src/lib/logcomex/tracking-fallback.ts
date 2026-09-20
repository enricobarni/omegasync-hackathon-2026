/**
 * Fallback offline do tracking (ETAPA 13). Sem inventar contexto: todos os
 * campos permanecem desconhecidos quando o provedor está indisponível.
 */

import type { SourceReference } from "../domain";
import { unknown } from "../domain";
import type { TrackingContext } from "./tracking-adapter";

export function trackingFallbackSource(accessedAt: string): SourceReference {
  return {
    id: "logcomex-tracking-fallback-offline",
    title: "Fallback offline (tracking Logcomex indisponível)",
    publisher: "OmegaSync",
    accessedAt,
    kind: "INTERNAL_FALLBACK",
  };
}

export function trackingFallback(accessedAt: string): TrackingContext {
  const source = trackingFallbackSource(accessedAt);
  const reason = "Tracking Logcomex indisponível.";

  return {
    operation: unknown(reason),
    container: unknown(reason),
    carrier: unknown(reason),
    type: unknown(reason),
    additionalInfo: unknown(reason),
    source,
    contextOnly: true,
  };
}
