/**
 * Adapter de análise documental Logcomex → enriquecimento OmegaSync (ETAPA 11).
 *
 * Puro e determinístico: converte o DTO do provedor em um modelo de
 * enriquecimento com estados de informação e proveniência. Regras (AGENTS.md /
 * FONTES.md §25):
 *  - campo ausente permanece desconhecido (unknown != zero/false);
 *  - `ncm_sugerido != ncm_confirmado`: a sugestão nunca vira o NCM confirmado
 *    da carga — a confirmação é ação do usuário (ver `buildCargoFromEnrichment`);
 *  - o Logcomex enriquece dados, NÃO decide rota;
 *  - strings livres (riscos, resumo) são preservadas como texto, sem inferir
 *    fatos estruturados.
 */

import type {
  Cargo,
  CargoType,
  CustomsChannel,
  Evidence,
  MonetaryAmount,
  OeaStatus,
  SourceReference,
  TrackedValue,
} from "../domain";
import {
  knownAmount,
  known,
  unknown,
  unknownAmount,
} from "../domain";
import type {
  LogcomexDadosEmbarqueDTO,
  LogcomexDocumentAnalysisDTO,
  LogcomexDocumentItemDTO,
} from "./document-analysis-dto";

// --- Modelo de enriquecimento (lado OmegaSync) ---------------------------

export interface DocumentEnrichmentItem {
  description: TrackedValue<string>;
  quantity: TrackedValue<number>;
  unit: TrackedValue<string>;
  countryOfOrigin: TrackedValue<string>;
  /** NCM sugerida pelo Logcomex — NUNCA confirmada automaticamente. */
  suggestedNcm: TrackedValue<string>;
  /** Nível de confiança da NCM (0–100), como reportado pelo provedor. */
  ncmConfidence: TrackedValue<number>;
  unitValue: MonetaryAmount;
  totalValue: MonetaryAmount;
}

export interface DocumentEnrichment {
  origin: TrackedValue<string>;
  destination: TrackedValue<string>;
  incoterm: TrackedValue<string>;
  grossWeightKg: TrackedValue<number>;
  netWeightKg: TrackedValue<number>;
  fob: MonetaryAmount;
  freight: MonetaryAmount;
  insurance: MonetaryAmount;
  items: DocumentEnrichmentItem[];
  documentRisks: string[];
  summary: TrackedValue<string>;
  /** Confiança global reportada pelo provedor (0–100). */
  overallConfidence: TrackedValue<number>;
  source: SourceReference;
}

// --- Utilitários de parsing seguros --------------------------------------

/**
 * Converte number|string em número finito ou null. Não faz adivinhação de
 * locale: strings não numéricas retornam null (preserva desconhecido).
 */
export function parseNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function trackString(
  value: unknown,
  evidence: Evidence,
): TrackedValue<string> {
  return typeof value === "string" && value.trim() !== ""
    ? known(value, evidence)
    : unknown("Campo não fornecido pelo Logcomex.");
}

function trackNumber(
  value: unknown,
  evidence: Evidence,
): TrackedValue<number> {
  const parsed = parseNumber(value);
  return parsed === null
    ? unknown("Valor numérico não fornecido pelo Logcomex.")
    : known(parsed, evidence);
}

function trackMoney(value: unknown, evidence: Evidence): MonetaryAmount {
  const parsed = parseNumber(value);
  return parsed === null
    ? unknownAmount("Valor monetário não fornecido pelo Logcomex.")
    : knownAmount(parsed, evidence);
}

function normalizeRisks(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim() !== "");
  }
  if (typeof value === "string" && value.trim() !== "") {
    return [value];
  }
  return [];
}

// --- Adapter --------------------------------------------------------------

export function logcomexSource(accessedAt: string): SourceReference {
  return {
    id: "logcomex-analista-documentacao",
    title: "Logcomex — Analista de Documentação",
    publisher: "Logcomex",
    accessedAt,
    kind: "EXTERNAL_API",
  };
}

function adaptItem(
  item: LogcomexDocumentItemDTO,
  evidence: Evidence,
): DocumentEnrichmentItem {
  return {
    description: trackString(item.descricao, evidence),
    quantity: trackNumber(item.quantidade, evidence),
    unit: trackString(item.unidade, evidence),
    countryOfOrigin: trackString(item.pais_origem, evidence),
    suggestedNcm: trackString(item.ncm_sugerido, evidence),
    ncmConfidence: trackNumber(item.nivel_confianca_ncm, evidence),
    unitValue: trackMoney(item.valor_unitario, evidence),
    totalValue: trackMoney(item.valor_total, evidence),
  };
}

/**
 * Converte a resposta do Analista de Documentação em enriquecimento OmegaSync.
 */
export function adaptDocumentAnalysis(
  dto: LogcomexDocumentAnalysisDTO,
  accessedAt: string,
): DocumentEnrichment {
  const source = logcomexSource(accessedAt);
  const evidence: Evidence = {
    origin: "LOGCOMEX",
    reference: "Logcomex — Analista de Documentação",
    source,
  };

  const dados: LogcomexDadosEmbarqueDTO = dto.dados_embarque ?? {};
  const items = (dados.itens ?? []).map((item) => adaptItem(item, evidence));

  return {
    origin: trackString(dados.origem, evidence),
    destination: trackString(dados.destino, evidence),
    incoterm: trackString(dados.incoterm, evidence),
    grossWeightKg: trackNumber(dados.peso_bruto, evidence),
    netWeightKg: trackNumber(dados.peso_liquido, evidence),
    fob: trackMoney(dados.valor_fob, evidence),
    freight: trackMoney(dados.valor_frete, evidence),
    insurance: trackMoney(dados.valor_seguro, evidence),
    items,
    documentRisks: normalizeRisks(dto.riscos_aduan_sugest),
    summary: trackString(dto.resumo_executivo, evidence),
    overallConfidence: trackNumber(dto.percentual_confianca, evidence),
    source,
  };
}

// --- Derivações e confirmação --------------------------------------------

/**
 * CIF = FOB + frete + seguro (definição Incoterms) — porém a MOEDA das parcelas
 * do Logcomex NÃO está confirmada (AJUSTE R33/LOG-05). Somar valores em moeda
 * possivelmente estrangeira e tratá-los como BRL produziria falsa certeza.
 * Portanto NÃO derivamos um CIF operacional em BRL até a moeda ser confirmada:
 * o valor permanece desconhecido, sem inventar conversão.
 */
export function deriveCif(): MonetaryAmount {
  return unknownAmount(
    "CIF não derivado: moeda das parcelas (FOB/frete/seguro) do Logcomex não confirmada (R33/LOG-05).",
  );
}

export interface CargoConfirmation {
  /** NCM confirmada pelo usuário — obrigatória; nunca a sugestão do Logcomex. */
  confirmedNcm: string;
  cargoType: CargoType;
  oeaStatus: OeaStatus;
  channel: CustomsChannel;
  /** CIF opcional; se ausente, é derivado do enriquecimento (FOB+frete+seguro). */
  cif?: MonetaryAmount;
}

/**
 * Monta a carga de domínio a partir do enriquecimento e da confirmação do
 * usuário. Exige `confirmedNcm` explicitamente: a NCM sugerida do Logcomex
 * nunca é promovida a confirmada (FONTES §25).
 */
export function buildCargoFromEnrichment(
  enrichment: DocumentEnrichment,
  confirmation: CargoConfirmation,
): Cargo {
  return {
    ncm: confirmation.confirmedNcm,
    cif: confirmation.cif ?? deriveCif(),
    cargoType: confirmation.cargoType,
    oeaStatus: confirmation.oeaStatus,
    channel: confirmation.channel,
    weightKg: enrichment.grossWeightKg,
  };
}
