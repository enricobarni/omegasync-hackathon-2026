/**
 * API pública do tratamento administrativo / anuência (ETAPA 8).
 *
 * Domínio de regras administrativas: resolve anuência, avalia liberação
 * (canal + anuência) e expõe estimativas de prazo. Determinístico; não decide
 * rota nem calcula custo.
 */

export * from "./anuencia-registry";
export * from "./anuencia";
