/**
 * Adapter de tracking Logcomex → contexto operacional OmegaSync (ETAPA 13).
 *
 * Puro e determinístico. Converte a resposta de tracking em um contexto de
 * TEXTO rastreável, com proveniência LOGCOMEX. Deliberadamente NÃO deriva
 * fatos estruturados/decisões a partir de texto livre (FONTES §26): o tracking
 * é apenas contexto operacional e NUNCA alimenta o motor de decisão.
 */

import type { Evidence, SourceReference, TrackedValue } from "../domain";
import { known, unknown } from "../domain";
import type { LogcomexTrackingResponseDTO } from "./tracking-dto";

export interface TrackingContext {
  operation: TrackedValue<string>;
  container: TrackedValue<string>;
  carrier: TrackedValue<string>;
  type: TrackedValue<string>;
  additionalInfo: TrackedValue<string>;
  source: SourceReference;
  /** Marca explícita: contexto, não fato determinístico. */
  contextOnly: true;
}

export function trackingSource(accessedAt: string): SourceReference {
  return {
    id: "logcomex-tracking-follow-up",
    title: "Logcomex — Tracking & Follow-up",
    publisher: "Logcomex",
    accessedAt,
    kind: "EXTERNAL_API",
  };
}

function trackText(value: unknown, evidence: Evidence): TrackedValue<string> {
  return typeof value === "string" && value.trim() !== ""
    ? known(value, evidence)
    : unknown("Campo não fornecido pelo tracking Logcomex.");
}

export function adaptTracking(
  dto: LogcomexTrackingResponseDTO,
  accessedAt: string,
): TrackingContext {
  const source = trackingSource(accessedAt);
  const evidence: Evidence = {
    origin: "LOGCOMEX",
    reference: "Logcomex — Tracking & Follow-up (contexto operacional)",
    source,
  };

  return {
    operation: trackText(dto.operacao, evidence),
    container: trackText(dto.container, evidence),
    carrier: trackText(dto.armador, evidence),
    type: trackText(dto.tipo, evidence),
    additionalInfo: trackText(dto.informacoes_adicionais, evidence),
    source,
    contextOnly: true,
  };
}
