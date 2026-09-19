/**
 * API pública das regras administrativas aduaneiras (ETAPAs 8 e 15).
 *
 * Resolve anuência, avalia liberação (canal + anuência), expõe estimativas de
 * prazo e modela o regime de entreposto aduaneiro (com estado de validação).
 * Determinístico; não decide rota nem calcula custo.
 */

export * from "./anuencia-registry";
export * from "./anuencia";
export * from "./entreposto";
