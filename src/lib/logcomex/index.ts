/**
 * API pública da integração Logcomex — análise documental (ETAPA 11).
 *
 * Provedor externo de dados: DTOs do provedor, adapter para o enriquecimento
 * OmegaSync e fallback offline. O Logcomex enriquece dados, nunca decide rota.
 */

export * from "./document-analysis-dto";
export * from "./document-analysis-adapter";
export * from "./fallback";
