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
import type { Window48hContext } from "../engine";
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
    cargoYardWithdrawal?: boolean | null;
    facilityDiscriminatedInSchedule?: boolean | null;
    withinBusinessWindow?: boolean | null;
    possuiCaixaParaAntecipacao?: boolean | null;
    possuiEstruturaSincronizada?: boolean | null;
    janela48hViavel?: boolean | null;
  };
}

/** Entrada normalizada (sem as rotas, injetadas pelo handler). */
export interface NormalizedSimulationRequest {
  cargo: Cargo;
  necessitaEntrepostagem?: TrackedValue<boolean>;
  behavioral?: {
    possuiCaixaParaAntecipacao?: TrackedValue<boolean>;
    possuiEstruturaSincronizada?: TrackedValue<boolean>;
    janela48hViavel?: TrackedValue<boolean>;
  };
  window48h?: Window48hContext;
}

export type ValidationResult =
  | { ok: true; value: NormalizedSimulationRequest }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const USER_EVIDENCE = createEvidence("USUARIO");

function boolToTracked(
  value: unknown,
): TrackedValue<boolean> | undefined {
  return typeof value === "boolean" ? known(value, USER_EVIDENCE) : undefined;
}

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

  if (body.operation !== undefined && !isRecord(body.operation)) {
    errors.push("operation, quando informado, deve ser um objeto.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const operation = isRecord(body.operation) ? body.operation : {};

  const normalizedCargo: Cargo = {
    ncm: ncm as string,
    cif:
      typeof cargo.cif === "number"
        ? known(cargo.cif, USER_EVIDENCE)
        : unknownAmount("CIF não informado."),
    cargoType: cargoType as Cargo["cargoType"],
    oeaStatus: oeaStatus as Cargo["oeaStatus"],
    channel: channel as Cargo["channel"],
  };

  const window48h: Window48hContext = {
    cargoYardWithdrawal: boolToTracked(operation.cargoYardWithdrawal),
    facilityDiscriminatedInSchedule: boolToTracked(
      operation.facilityDiscriminatedInSchedule,
    ),
    withinBusinessWindow: boolToTracked(operation.withinBusinessWindow),
  };

  return {
    ok: true,
    value: {
      cargo: normalizedCargo,
      necessitaEntrepostagem: boolToTracked(operation.necessitaEntrepostagem),
      behavioral: {
        possuiCaixaParaAntecipacao: boolToTracked(
          operation.possuiCaixaParaAntecipacao,
        ),
        possuiEstruturaSincronizada: boolToTracked(
          operation.possuiEstruturaSincronizada,
        ),
        janela48hViavel: boolToTracked(operation.janela48hViavel),
      },
      window48h,
    },
  };
}

// --- Contrato de resposta -------------------------------------------------

export interface SimulationResponseDTO {
  clearance: { status: string; reasons: string[]; missingData: string[] };
  anuencia: { status: string; state: string | null };
  routes: Array<{
    routeId: string;
    label: string;
    eligibility: { status: string; summary: string; missingData: string[] };
    cost: { knownSubtotal: number; total: number | null; complete: boolean };
  }>;
  comparison: {
    viable: string[];
    indeterminate: string[];
    inviable: string[];
    lowestCostRouteId: string | null;
    lowestDistanceRouteId: string | null;
    lowestDurationRouteId: string | null;
  };
  window48h: { applicability: string; viability: string | null };
  behavioralFactors: Array<{
    kind: string;
    present: boolean | null;
    tendency?: string;
  }>;
  evidences: EvidenceView[];
  missingData: string[];
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
      eligibility: {
        status: sim.eligibility.status,
        summary: sim.eligibility.summary,
        missingData: sim.eligibility.missingData,
      },
      cost: {
        knownSubtotal: sim.cost.summary.knownSubtotal,
        total: sim.cost.summary.total,
        complete: sim.cost.summary.complete,
      },
    })),
    comparison: {
      viable: result.comparison.viable,
      indeterminate: result.comparison.indeterminate,
      inviable: result.comparison.inviable,
      lowestCostRouteId: result.comparison.cost.lowest?.routeId ?? null,
      lowestDistanceRouteId: result.comparison.distance.lowest?.routeId ?? null,
      lowestDurationRouteId: result.comparison.duration.lowest?.routeId ?? null,
    },
    window48h: {
      applicability: result.window48h.applicability,
      viability: result.window48h.viability,
    },
    behavioralFactors: result.behavioralFactors.map((factor) => ({
      kind: factor.kind,
      present: factor.present,
      tendency: factor.tendency,
    })),
    evidences: toEvidenceViews(result.evidences),
    missingData: result.missingData,
  };
}
