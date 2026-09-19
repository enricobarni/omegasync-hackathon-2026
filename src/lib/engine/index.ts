/**
 * API pública do motor determinístico do OmegaSync (ETAPA 3).
 *
 * Domínio de decisão: independente de React, Next.js, HTTP, Logcomex e rede.
 * O motor de elegibilidade decide viabilidade de rota; os fatores
 * comportamentais apenas indicam tendência, sem bloquear.
 */

export * from "./eligibility";
export * from "./behavioral-factors";
export * from "./route-cost";
export * from "./route-comparison";
