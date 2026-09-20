/**
 * Construtor de contexto da simulação para o chat (PLANEJAMENTO-MCP.md §12).
 *
 * Transforma o resultado da simulação (DTO público) em um bloco de texto ENXUTO
 * `OMEGASYNC_RESULT`, que o assistente usa como contexto. Regras:
 *  - não enviar objetos gigantes, segredos, tokens ou stack traces;
 *  - preservar a semântica de desconhecido/indeterminado (não vira zero/false);
 *  - o contexto é apenas informativo — a decisão continua sendo do motor.
 *
 * Lê o DTO de forma defensiva: o objeto chega do cliente e pode estar parcial.
 */

import type { SimulationResponseDTO } from "../api";

function rec(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function costLine(cost: unknown): string {
  const c = rec(cost);
  if (!c) {
    return "custo desconhecido";
  }
  if (c.total === null || c.total === undefined) {
    const subtotal = typeof c.knownSubtotal === "number" ? c.knownSubtotal : null;
    return subtotal !== null
      ? `custo total INDETERMINADO (subtotal conhecido R$ ${subtotal})`
      : "custo total INDETERMINADO";
  }
  return `custo total R$ ${c.total}`;
}

/**
 * Monta o bloco de contexto textual da simulação. Retorna string vazia quando
 * não há simulação (o chamador informa a ausência ao assistente).
 */
export function buildSimulationContext(
  simulation: SimulationResponseDTO | null | undefined,
): string {
  const sim = rec(simulation);
  if (!sim) {
    return "";
  }

  const lines: string[] = ["OMEGASYNC_RESULT (calculado pelo motor determinístico):"];

  const clearance = rec(sim.clearance);
  if (clearance) {
    lines.push(`- Liberação (canal+anuência): ${str(clearance.status) ?? "desconhecida"}`);
  }

  const anuencia = rec(sim.anuencia);
  if (anuencia) {
    const state = str(anuencia.state);
    lines.push(
      `- Anuência: ${str(anuencia.status) ?? "desconhecida"}${state ? ` (${state})` : ""}`,
    );
  }

  const window = rec(sim.window48h);
  if (window) {
    lines.push(
      `- Janela de 48h: ${str(window.applicability) ?? "desconhecida"}${
        str(window.viability) ? ` / ${str(window.viability)}` : ""
      }`,
    );
  }

  const routes = Array.isArray(sim.routes) ? sim.routes : [];
  if (routes.length > 0) {
    lines.push("- Rotas avaliadas:");
    for (const route of routes) {
      const r = rec(route);
      if (!r) {
        continue;
      }
      const eligibility = rec(r.eligibility);
      const label = str(r.label) ?? str(r.routeId) ?? "rota";
      const movement = str(r.movement);
      const status = str(eligibility?.status) ?? "desconhecida";
      lines.push(
        `  • ${label}${movement ? ` [${movement}]` : ""}: ${status}; ${costLine(r.cost)}`,
      );
    }
  }

  const comparison = rec(sim.comparison);
  if (comparison) {
    const viable = Array.isArray(comparison.viable) ? comparison.viable.length : 0;
    const indeterminate = Array.isArray(comparison.indeterminate)
      ? comparison.indeterminate.length
      : 0;
    const inviable = Array.isArray(comparison.inviable)
      ? comparison.inviable.length
      : 0;
    lines.push(
      `- Comparação: ${viable} viável(is), ${indeterminate} indeterminada(s), ${inviable} inviável(is).`,
    );
  }

  const missing = Array.isArray(sim.missingData) ? sim.missingData : [];
  if (missing.length > 0) {
    const shown = missing.slice(0, 8).filter((m): m is string => typeof m === "string");
    lines.push(`- Dados faltantes: ${shown.join("; ")}${missing.length > 8 ? "; …" : ""}`);
  }

  return lines.join("\n");
}
