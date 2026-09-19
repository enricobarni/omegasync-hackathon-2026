/**
 * Explicabilidade (ETAPA 16).
 *
 * Converte uma `Evidence` do domínio em uma visão apresentável, garantindo que
 * cada saída importante indique origem, referência, confiança, vigência/data e
 * se é premissa (PLANEJAMENTO.md ETAPA 16). Reaproveita e rotula a enumeração
 * de proveniência anterior (FONTES §29). Puro; sem regra de negócio.
 */

import type { ConfidenceLevel, DataOrigin, Evidence } from "../domain";

export interface EvidenceSourceView {
  title: string;
  publisher: string;
  kind: string;
  accessedAt?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  url?: string;
}

export interface EvidenceView {
  origin: string;
  originLabel: string;
  reference?: string;
  confidence?: string;
  confidenceLabel?: string;
  /** Verdadeiro quando a evidência é uma premissa de simulação. */
  isPremise: boolean;
  source?: EvidenceSourceView;
}

const ORIGIN_LABEL: Record<DataOrigin, string> = {
  USUARIO: "Usuário",
  LOGCOMEX: "Logcomex",
  FALLBACK_OFFLINE: "Fallback offline",
  CACHE: "Cache",
  TABELA_PUBLICA: "Tabela pública",
  PESQUISA_CAMPO: "Pesquisa de campo",
  PREMISSA_SIMULACAO: "Premissa de simulação",
};

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  A: "Alta — fonte primária",
  B: "Média — fonte secundária",
  C: "Baixa — não verificada",
  N1: "Relato único (N=1)",
};

export function originLabel(origin: DataOrigin): string {
  return ORIGIN_LABEL[origin] ?? origin;
}

export function confidenceLabel(confidence: ConfidenceLevel): string {
  return CONFIDENCE_LABEL[confidence] ?? confidence;
}

export function toEvidenceView(evidence: Evidence): EvidenceView {
  const view: EvidenceView = {
    origin: evidence.origin,
    originLabel: originLabel(evidence.origin),
    isPremise: evidence.origin === "PREMISSA_SIMULACAO",
  };

  if (evidence.reference !== undefined) {
    view.reference = evidence.reference;
  }
  if (evidence.confidence !== undefined) {
    view.confidence = evidence.confidence;
    view.confidenceLabel = confidenceLabel(evidence.confidence);
  }
  if (evidence.source) {
    const s = evidence.source;
    view.source = {
      title: s.title,
      publisher: s.publisher,
      kind: s.kind,
      ...(s.accessedAt ? { accessedAt: s.accessedAt } : {}),
      ...(s.effectiveFrom ? { effectiveFrom: s.effectiveFrom } : {}),
      ...(s.effectiveTo ? { effectiveTo: s.effectiveTo } : {}),
      ...(s.url ? { url: s.url } : {}),
    };
  }

  return view;
}

export function toEvidenceViews(evidences: Evidence[]): EvidenceView[] {
  return evidences.map(toEvidenceView);
}
