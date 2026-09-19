/**
 * DTOs públicos e validação/normalização da API de simulação (ETAPA 10).
 *
 * Separa o contrato público (JSON simples) dos tipos internos do domínio
 * (AGENTS.md — API e contratos). A validação de entrada externa acontece aqui,
 * na borda; a normalização converte o DTO para o domínio antes de chamar o
 * serviço. Nada de regra de negócio: apenas transporte.
 */

import type { Cargo, TrackedValue } from "../domain";
import {
  CARGO_TYPES,
  CUSTOMS_CHANNELS,
  OEA_STATUSES,
  createEvidence,
  known,
  unknownAmount,
} from "../domain";
import type { ComparableDimension, Window48hContext } from "../engine";
import type { SimulationResult } from "../application";
import { toEvidenceViews } from "../evidence";
import type { EvidenceView } from "../evidence";

// --- Contrato de requisição ----------------------------------------------

export interface SimulationRequestDTO {
  cargo: {
    ncm: string;
    cif?: number;
    cargoType: string;
    oeaStatus: string;
    channel: string;
  };
  operation?: {
    necessitaEntrepostagem?: boolean | null;
    /** Sinal FACTUAL: a operação é de carga-pátio (retirada direta)? */
    cargoYardWithdrawal?: boolean | null;
    /** Sinal FACTUAL: há recinto discriminado no agendamento? */
    facilityDiscriminatedInSchedule?: boolean | null;
    possuiCaixaParaAntecipacao?: boolean | null;
    possuiEstruturaSincronizada?: boolean | null;
  };
}

/** Entrada normalizada (sem as rotas, injetadas pelo handler). */
export interface NormalizedSimulationRequest {
  cargo: Cargo;
  necessitaEntrepostagem?: TrackedValue<boolean>;
  behavioral?: {
    possuiCaixaParaAntecipacao?: TrackedValue<boolean>;
    possuiEstruturaSincronizada?: TrackedValue<boolean>;
  };
  window48h?: Window48hContext;
}

export type ValidationResult =
  | { ok: true; value: NormalizedSimulationRequest }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Evidência do usuário identificando o campo de origem (AJUSTE 10.4). */
function userFieldEvidence(field: string) {
  return createEvidence("USUARIO", { reference: `Informado pelo usuário: ${field}` });
}

/** Converte boolean|null|undefined em TrackedValue; ignora ausência. */
function boolToTracked(
  value: unknown,
  field: string,
): TrackedValue<boolean> | undefined {
  return typeof value === "boolean"
    ? known(value, userFieldEvidence(field))
    : undefined;
}

const BOOLEAN_OPERATION_FIELDS = [
  "necessitaEntrepostagem",
  "cargoYardWithdrawal",
  "facilityDiscriminatedInSchedule",
  "possuiCaixaParaAntecipacao",
  "possuiEstruturaSincronizada",
] as const;

/**
 * Valida e normaliza a requisição. Erros de formato retornam a lista de
 * problemas; o sucesso entrega a entrada já em tipos de domínio.
 */
export function validateSimulationRequest(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(body) || !isRecord(body.cargo)) {
    return { ok: false, errors: ["Corpo inválido: 'cargo' é obrigatório."] };
  }

  const cargo = body.cargo;

  const ncm = cargo.ncm;
  if (typeof ncm !== "string" || !/^\d{8}$/.test(ncm)) {
    errors.push("cargo.ncm deve ser uma string de 8 dígitos numéricos.");
  }

  const cargoType = cargo.cargoType;
  if (typeof cargoType !== "string" || !CARGO_TYPES.includes(cargoType as never)) {
    errors.push(`cargo.cargoType deve ser um de: ${CARGO_TYPES.join(", ")}.`);
  }

  const oeaStatus = cargo.oeaStatus;
  if (typeof oeaStatus !== "string" || !OEA_STATUSES.includes(oeaStatus as never)) {
    errors.push(`cargo.oeaStatus deve ser um de: ${OEA_STATUSES.join(", ")}.`);
  }

  const channel = cargo.channel;
  if (typeof channel !== "string" || !CUSTOMS_CHANNELS.includes(channel as never)) {
    errors.push(`cargo.channel deve ser um de: ${CUSTOMS_CHANNELS.join(", ")}.`);
  }

  if (
    cargo.cif !== undefined &&
    (typeof cargo.cif !== "number" || !Number.isFinite(cargo.cif) || cargo.cif < 0)
  ) {
    errors.push("cargo.cif, quando informado, deve ser um número >= 0.");
  }

  const operationValid = body.operation === undefined || isRecord(body.operation);
  if (!operationValid) {
    errors.push("operation, quando informado, deve ser um objeto.");
  }

  // AJUSTE 10.3: campos operacionais com tipo inválido são REJEITADOS, não
  // silenciosamente convertidos em "não informado".
  const operation = isRecord(body.operation) ? body.operation : {};
  for (const field of BOOLEAN_OPERATION_FIELDS) {
    const v = operation[field];
    if (v !== undefined && v !== null && typeof v !== "boolean") {
      errors.push(`operation.${field}, quando informado, deve ser booleano.`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const normalizedCargo: Cargo = {
    ncm: ncm as string,
    cif:
      typeof cargo.cif === "number"
        ? known(cargo.cif, userFieldEvidence("cargo.cif"))
        : unknownAmount("CIF não informado."),
    cargoType: cargoType as Cargo["cargoType"],
    oeaStatus: oeaStatus as Cargo["oeaStatus"],
    channel: channel as Cargo["channel"],
  };

  // A viabilidade da janela (withinBusinessWindow) NÃO é perguntada ao usuário
  // (AJUSTE 12.4): é conclusão que o motor deveria calcular. A UI informa
  // apenas sinais factuais; a janela fica indeterminada sem fonte operacional.
  const window48h: Window48hContext = {
    cargoYardWithdrawal: boolToTracked(
      operation.cargoYardWithdrawal,
      "operation.cargoYardWithdrawal",
    ),
    facilityDiscriminatedInSchedule: boolToTracked(
      operation.facilityDiscriminatedInSchedule,
      "operation.facilityDiscriminatedInSchedule",
    ),
  };

  return {
    ok: true,
    value: {
      cargo: normalizedCargo,
      necessitaEntrepostagem: boolToTracked(
        operation.necessitaEntrepostagem,
        "operation.necessitaEntrepostagem",
      ),
      behavioral: {
        possuiCaixaParaAntecipacao: boolToTracked(
          operation.possuiCaixaParaAntecipacao,
          "operation.possuiCaixaParaAntecipacao",
        ),
        possuiEstruturaSincronizada: boolToTracked(
          operation.possuiEstruturaSincronizada,
          "operation.possuiEstruturaSincronizada",
        ),
      },
      window48h,
    },
  };
}

// --- Contrato de resposta -------------------------------------------------

/** Valor numérico rastreável no contrato público (status + valor). */
export interface TrackedNumberDTO {
  status: string;
  value: number | null;
}

/** Dimensão comparável no contrato público (AJUSTE 6.1/10.1): escopo explícito. */
export interface ComparisonDimensionDTO {
  status: string;
  /** Vencedor(es) — vários ids indicam empate (AJUSTE 6.3). */
  lowestRouteIds: string[];
  lowestValue: number | null;
  fullyComparable: boolean;
}

export interface SimulationResponseDTO {
  clearance: { status: string; reasons: string[]; missingData: string[] };
  anuencia: { status: string; state: string | null };
  routes: Array<{
    routeId: string;
    label: string;
    movement: string;
    eligibility: { status: string; summary: string; missingData: string[] };
    cost: {
      knownSubtotal: number;
      total: number | null;
      complete: boolean;
      missingKinds: string[];
    };
    /** Distância e prazo — dimensões centrais do produto (AJUSTE 10.8). */
    distanceKm: TrackedNumberDTO;
    estimatedDurationHours: TrackedNumberDTO;
  }>;
  comparison: {
    viable: string[];
    indeterminate: string[];
    inviable: string[];
    costTotal: ComparisonDimensionDTO;
    costKnownSubtotal: ComparisonDimensionDTO;
    distance: ComparisonDimensionDTO;
    duration: ComparisonDimensionDTO;
  };
  window48h: { applicability: string; viability: string | null };
  behavioralFactors: Array<{
    kind: string;
    state: string;
    detail: string;
    tendency?: string;
  }>;
  evidences: EvidenceView[];
  missingData: string[];
}

function toTrackedNumber(value: TrackedValue<number>): TrackedNumberDTO {
  return {
    status: value.status,
    value: value.status === "KNOWN" ? value.value : null,
  };
}

function toComparisonDimension(
  dimension: ComparableDimension,
): ComparisonDimensionDTO {
  return {
    status: dimension.status,
    lowestRouteIds: dimension.lowest?.routeIds ?? [],
    lowestValue: dimension.lowest?.value ?? null,
    fullyComparable: dimension.fullyComparable,
  };
}

/** Mapeia o resultado interno para o contrato público estável. */
export function toSimulationResponse(
  result: SimulationResult,
): SimulationResponseDTO {
  return {
    clearance: {
      status: result.clearance.status,
      reasons: result.clearance.reasons,
      missingData: result.clearance.missingData,
    },
    anuencia: {
      status: result.anuencia.status,
      state:
        result.anuencia.status === "RESOLVED"
          ? result.anuencia.anuencia.state
          : null,
    },
    routes: result.routes.map((sim) => ({
      routeId: sim.route.id,
      label: sim.route.label,
      movement: sim.route.movement ?? "OUTRO",
      eligibility: {
        status: sim.eligibility.status,
        summary: sim.eligibility.summary,
        missingData: sim.eligibility.missingData,
      },
      cost: {
        knownSubtotal: sim.cost.summary.knownSubtotal,
        total: sim.cost.summary.total,
        complete: sim.cost.complete,
        missingKinds: sim.cost.missingKinds,
      },
      distanceKm: toTrackedNumber(sim.route.distanceKm),
      estimatedDurationHours: toTrackedNumber(sim.route.estimatedDurationHours),
    })),
    comparison: {
      viable: result.comparison.viable,
      indeterminate: result.comparison.indeterminate,
      inviable: result.comparison.inviable,
      costTotal: toComparisonDimension(result.comparison.costTotal),
      costKnownSubtotal: toComparisonDimension(result.comparison.costKnownSubtotal),
      distance: toComparisonDimension(result.comparison.distance),
      duration: toComparisonDimension(result.comparison.duration),
    },
    window48h: {
      applicability: result.window48h.applicability,
      viability: result.window48h.viability,
    },
    behavioralFactors: result.behavioralFactors.map((factor) => ({
      kind: factor.kind,
      state: factor.state,
      detail: factor.detail,
      tendency: factor.tendency,
    })),
    evidences: toEvidenceViews(result.evidences),
    missingData: result.missingData,
  };
}
