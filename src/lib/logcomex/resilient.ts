/**
 * Resiliência das integrações Logcomex (ETAPA 17 — hardening).
 *
 * Envolve as portas do provedor com timeout e fallback explícito: falha de
 * integração ou timeout NÃO viram falsa certeza — retornam o enriquecimento/
 * contexto offline (tudo desconhecido) marcado como degradado.
 */

import {
  adaptDocumentAnalysis,
  type DocumentEnrichment,
} from "./document-analysis-adapter";
import type { DocumentAnalysisPort } from "./document-analysis-dto";
import { fallbackEnrichment } from "./fallback";
import { adaptTracking, type TrackingContext } from "./tracking-adapter";
import type { LogcomexTrackingInputDTO, TrackingPort } from "./tracking-dto";
import { trackingFallback } from "./tracking-fallback";

export interface ResilientOptions {
  accessedAt: string;
  timeoutMs: number;
}

export interface ResilientResult<T> {
  /** Verdadeiro quando houve falha/timeout e caiu no fallback. */
  degraded: boolean;
  reason?: string;
  value: T;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout após ${timeoutMs}ms`)),
      timeoutMs,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Falha de integração.";
}

export async function analyzeDocumentWithFallback(
  port: DocumentAnalysisPort,
  input: { arquivo: string; workflow_operacoes?: string },
  options: ResilientOptions,
): Promise<ResilientResult<DocumentEnrichment>> {
  try {
    const dto = await withTimeout(port.analyze(input), options.timeoutMs);
    return {
      degraded: false,
      value: adaptDocumentAnalysis(dto, options.accessedAt),
    };
  } catch (error) {
    return {
      degraded: true,
      reason: errorMessage(error),
      value: fallbackEnrichment(options.accessedAt),
    };
  }
}

export async function trackWithFallback(
  port: TrackingPort,
  input: LogcomexTrackingInputDTO,
  options: ResilientOptions,
): Promise<ResilientResult<TrackingContext>> {
  try {
    const dto = await withTimeout(port.track(input), options.timeoutMs);
    return { degraded: false, value: adaptTracking(dto, options.accessedAt) };
  } catch (error) {
    return {
      degraded: true,
      reason: errorMessage(error),
      value: trackingFallback(options.accessedAt),
    };
  }
}
