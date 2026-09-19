/**
 * Adapter — Análise de Importações → agregado de mercado OmegaSync (ETAPA 14).
 *
 * Puro e determinístico. As colunas são confirmadas (FONTES.md §27), então as
 * linhas são estruturadas. Regra (PLANEJAMENTO.md ETAPA 14, FONTES §27): este é
 * um AGREGADO DE MERCADO e NÃO substitui os dados da carga individual — por isso
 * `scope: "MARKET_AGGREGATE"` e o módulo não alimenta o motor de simulação.
 */

import type {
  Evidence,
  MonetaryAmount,
  SourceReference,
  TrackedValue,
} from "../domain";
import { known, knownAmount, unknown, unknownAmount } from "../domain";
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
  fobTotal: MonetaryAmount;
  fobUnit: MonetaryAmount;
  freightTotal: MonetaryAmount;
}

export interface MarketImportAnalysis {
  rows: MarketImportRow[];
  source: SourceReference;
  /** Agregado de mercado — nunca substitui a carga individual. */
  scope: "MARKET_AGGREGATE";
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

function trackMoney(value: unknown, evidence: Evidence): MonetaryAmount {
  const parsed = parseNumber(value);
  return parsed === null
    ? unknownAmount("Valor monetário não fornecido.")
    : knownAmount(parsed, evidence);
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
    fobTotal: trackMoney(row.fob_total, evidence),
    fobUnit: trackMoney(row.fob_unitario, evidence),
    freightTotal: trackMoney(row.frete_total, evidence),
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
  };
}
