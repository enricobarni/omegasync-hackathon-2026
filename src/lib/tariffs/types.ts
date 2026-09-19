/**
 * Tipos do dataset tarifário versionado (ETAPA 4).
 *
 * Regra de FONTES.md §4: um registro tarifário NÃO guarda apenas a alíquota.
 * Guarda terminal/recinto, base de cálculo, vigência, data de captura,
 * mínimos, duração do período, fonte, confiança e ressalvas.
 *
 * Regra de FONTES.md §8: null = desconhecido, nunca zero. Alíquotas ou
 * mínimos ausentes permanecem null.
 */

import type { ConfidenceLevel, CustomsZone, SourceReference } from "../domain";

/** Base de cálculo das tarifas conhecidas até aqui. */
export const CALCULATION_BASES = ["CIF"] as const;
export type CalculationBase = (typeof CALCULATION_BASES)[number];

/** Alíquotas ad valorem de armazenagem por período. */
export interface StorageAdValoremRates {
  base: CalculationBase;
  daysPerPeriod: number;
  firstPeriodRate: number | null;
  secondPeriodRate: number | null;
  subsequentRate: number | null;
  /** Valor mínimo em BRL, quando documentado; null = não documentado. */
  minimumValue: number | null;
}

/** Tarifa de descarga direta. */
export interface DirectDischargeRates {
  base: CalculationBase;
  rate: number | null;
  /** Valor mínimo em BRL, quando documentado; null = não documentado. */
  minimumValue: number | null;
}

export const TARIFF_KINDS = ["STORAGE_AD_VALOREM", "DIRECT_DISCHARGE"] as const;
export type TariffKind = (typeof TARIFF_KINDS)[number];

interface TariffRecordBase {
  id: string;
  /** Terminal/recinto ao qual a tarifa se refere. */
  terminal: string;
  zone?: CustomsZone;
  currency: "BRL";
  /** Início de vigência, quando registrado. */
  effectiveFrom?: string;
  /** Data de captura do dataset. */
  capturedAt: string;
  confidence: ConfidenceLevel;
  source: SourceReference;
  /**
   * `true` quando as alíquotas estão consolidadas e utilizáveis para cálculo;
   * `false` quando o valor é documentado mas NÃO deve virar constante do motor
   * (ex.: BTP não consolidado, escopo de terminal a verificar — FONTES §6).
   */
  consolidated: boolean;
  /**
   * Ressalvas que NÃO podem ser removidas até verificação de fonte
   * (FONTES.md §3.1/§6/§20). Viajam junto com o dado.
   */
  caveats: string[];
}

export interface StorageTariffRecord extends TariffRecordBase {
  kind: "STORAGE_AD_VALOREM";
  rates: StorageAdValoremRates;
}

export interface DirectDischargeTariffRecord extends TariffRecordBase {
  kind: "DIRECT_DISCHARGE";
  rates: DirectDischargeRates;
}

export type TariffRecord = StorageTariffRecord | DirectDischargeTariffRecord;
