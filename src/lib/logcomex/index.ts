/**
 * API pública da integração Logcomex (ETAPAs 11 e 13).
 *
 * Provedor externo de dados: DTOs do provedor, adapters e fallbacks. O Logcomex
 * enriquece/contextualiza dados, nunca decide rota. O tracking é apenas
 * contexto operacional (sem derivar fato determinístico de texto livre).
 */

export * from "./document-analysis-dto";
export * from "./document-analysis-adapter";
export * from "./fallback";
export * from "./tracking-dto";
export * from "./tracking-adapter";
export * from "./tracking-fallback";
