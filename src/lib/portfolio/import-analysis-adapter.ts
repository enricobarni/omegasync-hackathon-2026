/**
 * Adapter — Análise de Importações → agregado de mercado OmegaSync (ETAPA 14).
 *
 * Puro e determinístico. As colunas são confirmadas (FONTES.md §27), então as
 * linhas são estruturadas. Regra (PLANEJAMENTO.md ETAPA 14, FONTES §27): este é
 * um AGREGADO DE MERCADO e NÃO substitui os dados da carga individual — por isso
 * `scope: "MARKET_AGGREGATE"` e o módulo não alimenta o motor de simulação.
 */

import type { Evidence, SourceReference, TrackedValue } from "../domain";
import { known, unknown } from "../domain";
import type {
  LogcomexImportAnalysisDTO,
  LogcomexImportRowDTO,
} from "./import-analysis-dto";

export interface MarketImportRow {
  period: TrackedValue<string>;
  probableImporter: TrackedValue<string>;
  probableExporter: TrackedValue<string>;
  countryOfOrigin: TrackedValue<string>;
  ncm: TrackedValue<string>;
  entryPort: TrackedValue<string>;
  quantity: TrackedValue<number>;
  // Valores numéricos crus (AJUSTE 14.1): a MOEDA não está confirmada, então
  // NÃO são promovidos a MonetaryAmount/BRL.
  fobTotal: TrackedValue<number>;
  fobUnit: TrackedValue<number>;
  freightTotal: TrackedValue<number>;
}

export interface MarketImportAnalysis {
  rows: MarketImportRow[];
  source: SourceReference;
  /** Agregado de mercado — nunca substitui a carga individual. */
  scope: "MARKET_AGGREGATE";
  /** false: moeda dos valores não confirmada (AJUSTE 14.1). */
  currencyConfirmed: false;
  /** false quando `linhas` não veio na resposta (distinto de zero registros — AJUSTE 14.2). */
  rowsProvided: boolean;
}

/** Converte number|string em número finito ou null (sem adivinhar locale). */
function parseNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function trackString(value: unknown, evidence: Evidence): TrackedValue<string> {
  return typeof value === "string" && value.trim() !== ""
    ? known(value, evidence)
    : unknown("Coluna não fornecida pela Análise de Importações.");
}

function trackNumber(value: unknown, evidence: Evidence): TrackedValue<number> {
  const parsed = parseNumber(value);
  return parsed === null
    ? unknown("Valor numérico não fornecido.")
    : known(parsed, evidence);
}

export function importAnalysisSource(accessedAt: string): SourceReference {
  return {
    id: "logcomex-brasil-analise-importacoes",
    title: "Logcomex — Brasil | Análise de Importações",
    publisher: "Logcomex",
    accessedAt,
    kind: "EXTERNAL_API",
  };
}

function adaptRow(
  row: LogcomexImportRowDTO,
  evidence: Evidence,
): MarketImportRow {
  return {
    period: trackString(row.ano_mes, evidence),
    probableImporter: trackString(row.provavel_importador, evidence),
    probableExporter: trackString(row.provavel_exportador, evidence),
    countryOfOrigin: trackString(row.pais_origem, evidence),
    ncm: trackString(row.ncm, evidence),
    entryPort: trackString(row.porto_entrada, evidence),
    quantity: trackNumber(row.quantidade, evidence),
    fobTotal: trackNumber(row.fob_total, evidence),
    fobUnit: trackNumber(row.fob_unitario, evidence),
    freightTotal: trackNumber(row.frete_total, evidence),
  };
}

export function adaptImportAnalysis(
  dto: LogcomexImportAnalysisDTO,
  accessedAt: string,
): MarketImportAnalysis {
  const source = importAnalysisSource(accessedAt);
  const evidence: Evidence = {
    origin: "LOGCOMEX",
    reference: "Logcomex — Brasil | Análise de Importações (agregado de mercado)",
    source,
  };

  return {
    rows: (dto.linhas ?? []).map((row) => adaptRow(row, evidence)),
    source,
    scope: "MARKET_AGGREGATE",
    currencyConfirmed: false,
    rowsProvided: Array.isArray(dto.linhas),
  };
}
