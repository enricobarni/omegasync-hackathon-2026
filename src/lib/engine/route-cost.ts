/**
 * Motor de custos por rota (ETAPA 5).
 *
 * Generaliza a lógica do motor anterior (Caminho A / Caminho C) para um
 * `RouteCostResult` de qualquer rota: em vez de dois caminhos fixos, o motor
 * monta componentes de custo e os resume com a regra estrutural do domínio
 * (`summarizeCosts`, ETAPA 1): componente desconhecido torna o total null.
 *
 * Reaproveita as fórmulas de FONTES.md §7:
 *   - armazenagem ad valorem por período;
 *   - descarga direta com mínimo;
 *   - custo de transporte (distância × custo/km — premissa);
 *   - custo de capital da antecipação (premissa).
 *
 * O motor é puro e determinístico: importa apenas o domínio. Não importa o
 * dataset tarifário nem a rede — quem tem a tarifa passa alíquotas e a
 * evidência correspondente (a integração é feita pela aplicação/ETAPA 9).
 * Componentes sem fórmula/fonte (movimentação, DTA, capatazia, anuência,
 * tempo parado) NÃO são inventados: o chamador os fornece explicitamente.
 */

import type {
  CostComponent,
  CostSummary,
  Evidence,
  MonetaryAmount,
} from "../domain";
import {
  createCostComponent,
  knownAmount,
  notApplicableAmount,
  summarizeCosts,
  unknownAmount,
} from "../domain";

function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Invariante numérica (AJUSTE 5.5): valor finito e não negativo. */
function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/** Alíquotas de armazenagem por período (fields null = desconhecido). */
export interface StorageRates {
  daysPerPeriod: number;
  firstPeriodRate: number | null;
  secondPeriodRate: number | null;
  subsequentRate: number | null;
}

/**
 * Armazenagem ad valorem acumulada por período. Retorna null quando uma
 * alíquota necessária é desconhecida (unknown != 0). Dias 0 ou CIF 0 => 0.
 */
export function calculateStorageAdValorem(
  cif: number,
  daysOfStay: number,
  rates: StorageRates,
): number | null {
  if (daysOfStay <= 0 || cif === 0) {
    return 0;
  }
  if (rates.firstPeriodRate === null) {
    return null;
  }

  const periods = Math.ceil(daysOfStay / rates.daysPerPeriod);
  let accumulated = rates.firstPeriodRate;

  if (periods >= 2) {
    if (rates.secondPeriodRate === null) {
      return null;
    }
    accumulated += rates.secondPeriodRate;
  }

  if (periods >= 3) {
    if (rates.subsequentRate === null) {
      return null;
    }
    accumulated += rates.subsequentRate * (periods - 2);
  }

  return roundCents(cif * accumulated);
}

/** Descarga direta: percentual do CIF, respeitando o mínimo quando conhecido. */
export function calculateDirectDischarge(
  cif: number,
  rate: number,
  minimumValue: number | null,
): number {
  const value = cif * rate;
  return roundCents(minimumValue === null ? value : Math.max(value, minimumValue));
}

/** Custo de transporte: distância × custo/km (premissa). */
export function calculateTransportCost(
  distanceKm: number,
  costPerKm: number,
): number {
  return roundCents(distanceKm * costPerKm);
}

/** Custo de capital da antecipação tributária (premissa). */
export function calculateCapitalCost(
  taxableAmount: number,
  daysAnticipated: number,
  monthlyRate: number,
  monthDays: number,
): number {
  const dailyRate = monthlyRate / monthDays;
  return roundCents(taxableAmount * daysAnticipated * dailyRate);
}

// ---------------------------------------------------------------------------
// Construtores de componente: transformam entradas (possivelmente ausentes)
// em CostComponent com o estado de informação correto.
// ---------------------------------------------------------------------------

export interface StorageComponentInput {
  cif: number | null;
  daysOfStay: number | null;
  rates: StorageRates;
  /** Evidência/proveniência da tarifa (ex.: tabela pública do terminal). */
  evidence: Evidence;
  /** false quando a tarifa não é consolidada e não deve ser usada. */
  consolidated?: boolean;
  label?: string;
}

export function buildStorageComponent(input: StorageComponentInput): CostComponent {
  const label = input.label ?? "Armazenagem";
  let amount: MonetaryAmount;

  if (input.consolidated === false) {
    amount = unknownAmount("Tarifa de armazenagem não consolidada.");
  } else if (input.cif === null || input.daysOfStay === null) {
    amount = unknownAmount("CIF ou dias de permanência não informados.");
  } else if (
    !isFiniteNonNegative(input.cif) ||
    !isFiniteNonNegative(input.daysOfStay)
  ) {
    amount = unknownAmount("CIF ou dias de permanência com valor inválido.");
  } else {
    const value = calculateStorageAdValorem(input.cif, input.daysOfStay, input.rates);
    amount =
      value === null
        ? unknownAmount("Alíquota de armazenagem necessária desconhecida.")
        : knownAmount(value, input.evidence);
  }

  return createCostComponent("ARMAZENAGEM", label, amount);
}

export interface DirectDischargeComponentInput {
  cif: number | null;
  rate: number | null;
  minimumValue: number | null;
  evidence: Evidence;
  label?: string;
}

export function buildDirectDischargeComponent(
  input: DirectDischargeComponentInput,
): CostComponent {
  const label = input.label ?? "Descarga direta";
  const invalid =
    input.cif !== null &&
    input.rate !== null &&
    (!isFiniteNonNegative(input.cif) || !isFiniteNonNegative(input.rate));
  const amount: MonetaryAmount =
    input.cif === null || input.rate === null
      ? unknownAmount("CIF ou alíquota de descarga direta não informados.")
      : invalid
        ? unknownAmount("CIF ou alíquota de descarga direta com valor inválido.")
        : knownAmount(
            calculateDirectDischarge(input.cif, input.rate, input.minimumValue),
            input.evidence,
          );

  return createCostComponent("DESCARGA", label, amount);
}

export interface TransportComponentInput {
  distanceKm: number | null;
  costPerKm: number | null;
  reference: string;
  label?: string;
}

export function buildTransportComponent(
  input: TransportComponentInput,
): CostComponent {
  const label = input.label ?? "Transporte";
  const invalid =
    input.distanceKm !== null &&
    input.costPerKm !== null &&
    (!isFiniteNonNegative(input.distanceKm) || !isFiniteNonNegative(input.costPerKm));
  const amount: MonetaryAmount =
    input.distanceKm === null || input.costPerKm === null
      ? unknownAmount("Distância ou custo por km não informados.")
      : invalid
        ? unknownAmount("Distância ou custo por km com valor inválido.")
        : knownAmount(calculateTransportCost(input.distanceKm, input.costPerKm), {
            origin: "PREMISSA_SIMULACAO",
            reference: input.reference,
          });

  return createCostComponent("TRANSPORTE", label, amount);
}

export interface CapitalComponentInput {
  taxableAmount: number | null;
  daysAnticipated: number;
  monthlyRate: number | null;
  monthDays: number;
  reference: string;
  label?: string;
}

export function buildCapitalComponent(
  input: CapitalComponentInput,
): CostComponent {
  const label = input.label ?? "Custo de capital";
  const invalid =
    input.taxableAmount !== null &&
    input.monthlyRate !== null &&
    (!isFiniteNonNegative(input.taxableAmount) ||
      !isFiniteNonNegative(input.monthlyRate) ||
      !isFiniteNonNegative(input.daysAnticipated) ||
      !Number.isFinite(input.monthDays) ||
      input.monthDays <= 0);
  const amount: MonetaryAmount =
    input.taxableAmount === null || input.monthlyRate === null
      ? unknownAmount("Valor de tributos ou taxa de capital não informados.")
      : invalid
        ? unknownAmount("Parâmetros de custo de capital com valor inválido.")
        : knownAmount(
            calculateCapitalCost(
              input.taxableAmount,
              input.daysAnticipated,
              input.monthlyRate,
              input.monthDays,
            ),
            { origin: "PREMISSA_SIMULACAO", reference: input.reference },
          );

  return createCostComponent("CUSTO_CAPITAL", label, amount);
}

export interface SseComponentInput {
  /** SSE OFF por padrão (FONTES §20). */
  active: boolean;
  amountWhenActive: number | null;
  label?: string;
}

export function buildSseComponent(input: SseComponentInput): CostComponent {
  const label = input.label ?? "SSE";
  let amount: MonetaryAmount;

  if (!input.active) {
    amount = notApplicableAmount("SSE desativado na simulação (FONTES §20).");
  } else if (input.amountWhenActive === null) {
    amount = unknownAmount("Valor do SSE não informado.");
  } else if (!isFiniteNonNegative(input.amountWhenActive)) {
    amount = unknownAmount("Valor do SSE inválido.");
  } else {
    amount = knownAmount(input.amountWhenActive, {
      origin: "PREMISSA_SIMULACAO",
      reference: "SSE ativado na simulação",
    });
  }

  return createCostComponent("SSE", label, amount);
}

// ---------------------------------------------------------------------------
// Agregador genérico
// ---------------------------------------------------------------------------

export interface RouteCostResult {
  routeId: string;
  components: CostComponent[];
  summary: CostSummary;
}

/**
 * Calcula o custo de uma rota a partir dos componentes montados para ela.
 * Aplica a regra estrutural do domínio: qualquer componente desconhecido
 * torna o total indeterminado (null), preservando o subtotal conhecido.
 */
export function computeRouteCost(
  routeId: string,
  components: CostComponent[],
): RouteCostResult {
  return {
    routeId,
    components,
    summary: summarizeCosts(components),
  };
}
