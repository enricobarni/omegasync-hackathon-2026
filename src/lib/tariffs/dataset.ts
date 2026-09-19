/**
 * Dataset tarifário versionado do OmegaSync (ETAPA 4).
 *
 * Reaproveita o baseline do repo anterior (FONTES.md §3–§6), mas corrige o
 * que a implementação antiga fazia mal:
 *  - não guarda apenas alíquotas (guarda terminal, base, vigência, captura,
 *    mínimos, fonte, confiança, ressalvas);
 *  - não promove a Descarga Direta Santos Brasil a confiança "A" (a ressalva
 *    de Imbituba é preservada, confiança C);
 *  - não transforma BTP em constante (marcado como não consolidado).
 */

import type {
  DirectDischargeTariffRecord,
  StorageTariffRecord,
  TariffRecord,
} from "./types";
import {
  TARIFF_SOURCE_BTP,
  TARIFF_SOURCE_DPWORLD,
  TARIFF_SOURCE_ECOPORTO,
  TARIFF_SOURCE_SANTOS_BRASIL_DESCARGA,
} from "./sources";

/** Versão do dataset: baseline capturado em 31/08/2026, revisado em 19/09/2026. */
export const TARIFF_DATASET_VERSION = "2026-08-31";
export const TARIFF_DATASET_REVISED_AT = "2026-09-19";

/** DP World Santos — armazenagem ad valorem (FONTES.md §4). */
export const TARIFF_DPWORLD_SANTOS_STORAGE: StorageTariffRecord = {
  id: "dpworld-santos-storage",
  kind: "STORAGE_AD_VALOREM",
  terminal: "DP World Santos",
  zone: "ZONA_PRIMARIA",
  currency: "BRL",
  capturedAt: "2026-08-31",
  confidence: "A",
  source: TARIFF_SOURCE_DPWORLD,
  consolidated: true,
  rates: {
    base: "CIF",
    daysPerPeriod: 4,
    firstPeriodRate: 0.006,
    secondPeriodRate: 0.013,
    subsequentRate: 0.02,
    minimumValue: null,
  },
  caveats: [
    "Vigência exata não registrada; apenas data de captura (31/08/2026).",
  ],
};

/** Ecoporto Santos — armazenagem ad valorem (FONTES.md §5). */
export const TARIFF_ECOPORTO_SANTOS_STORAGE: StorageTariffRecord = {
  id: "ecoporto-santos-storage",
  kind: "STORAGE_AD_VALOREM",
  terminal: "Ecoporto Santos",
  currency: "BRL",
  effectiveFrom: "2026-01-10",
  capturedAt: "2026-08-31",
  confidence: "A",
  source: TARIFF_SOURCE_ECOPORTO,
  consolidated: true,
  rates: {
    base: "CIF",
    daysPerPeriod: 8,
    firstPeriodRate: 0.012,
    secondPeriodRate: 0.021,
    subsequentRate: 0.039,
    minimumValue: null,
  },
  caveats: [
    "A tabela Ecoporto (10/01/2026) registrava o SSE como suspenso (FONTES §20).",
  ],
};

/**
 * Descarga Direta atribuída a Santos Brasil (FONTES.md §3.1).
 * Mantida como baseline histórico, com confiança C e ressalva de escopo:
 * a tabela capturada pode ser de Imbituba/SC, não do Tecon Santos.
 */
export const TARIFF_SANTOS_BRASIL_DIRECT_DISCHARGE: DirectDischargeTariffRecord = {
  id: "santos-brasil-direct-discharge",
  kind: "DIRECT_DISCHARGE",
  terminal: "Santos Brasil (escopo a verificar)",
  currency: "BRL",
  capturedAt: "2026-08-31",
  confidence: "C",
  source: TARIFF_SOURCE_SANTOS_BRASIL_DESCARGA,
  consolidated: true,
  rates: {
    base: "CIF",
    rate: 0.0054,
    minimumValue: 1063.08,
  },
  caveats: [
    "A tabela Santos Brasil capturada pode referir-se a Imbituba/SC, não ao Tecon Santos (FONTES §3.1).",
    "Não usar como tarifa vigente de Santos sem verificar a tabela correta.",
  ],
};

/**
 * BTP — armazenagem NÃO consolidada (FONTES.md §6). As alíquotas permanecem
 * null: o 1º período está registrado apenas como faixa (0,65–0,90%) e os
 * demais períodos não foram consolidados. Não deve virar constante do motor.
 */
export const TARIFF_BTP_SANTOS_STORAGE: StorageTariffRecord = {
  id: "btp-santos-storage",
  kind: "STORAGE_AD_VALOREM",
  terminal: "BTP — Brasil Terminal Portuário",
  zone: "ZONA_PRIMARIA",
  currency: "BRL",
  capturedAt: "2026-08-31",
  confidence: "C",
  source: TARIFF_SOURCE_BTP,
  consolidated: false,
  rates: {
    base: "CIF",
    daysPerPeriod: 7,
    firstPeriodRate: null,
    secondPeriodRate: null,
    subsequentRate: null,
    minimumValue: null,
  },
  caveats: [
    "1º período registrado apenas como faixa (0,65–0,90%); 2º período e subsequentes não consolidados (FONTES §6).",
    "Não usar como constante sem a tabela exata e o escopo correto.",
  ],
};

/** Todos os registros tarifários do dataset. */
export const TARIFF_RECORDS: TariffRecord[] = [
  TARIFF_DPWORLD_SANTOS_STORAGE,
  TARIFF_ECOPORTO_SANTOS_STORAGE,
  TARIFF_SANTOS_BRASIL_DIRECT_DISCHARGE,
  TARIFF_BTP_SANTOS_STORAGE,
];

/** Dataset versionado. */
export const TARIFF_DATASET = {
  version: TARIFF_DATASET_VERSION,
  revisedAt: TARIFF_DATASET_REVISED_AT,
  records: TARIFF_RECORDS,
} as const;

export function findTariff(id: string): TariffRecord | null {
  return TARIFF_RECORDS.find((record) => record.id === id) ?? null;
}

/** Registros utilizáveis para cálculo (consolidados). */
export function listConsolidatedTariffs(): TariffRecord[] {
  return TARIFF_RECORDS.filter((record) => record.consolidated);
}
