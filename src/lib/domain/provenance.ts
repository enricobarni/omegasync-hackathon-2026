/**
 * Proveniência e evidência do domínio OmegaSync.
 *
 * Regra central do projeto (AGENTS.md / FONTES.md): nenhum dado externo
 * relevante deve existir no domínio sem origem rastreável. Este módulo
 * define os contratos mínimos de rastreabilidade reaproveitados e evoluídos
 * a partir do motor anterior (`EvidenciaDado`, `OrigemDado`).
 */

/** Escala de confiança herdada da pesquisa (FONTES.md §2). */
export const CONFIDENCE_LEVELS = ["A", "B", "C", "N1"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

/** Natureza da fonte de um dado (FONTES.md §31; AJUSTE 2.2). */
export const SOURCE_KINDS = [
  "OFFICIAL_REGULATION",
  "OFFICIAL_GUIDANCE",
  "OFFICIAL_SERVICE",
  "OFFICIAL_STATISTICS",
  "OFFICIAL_TARIFF",
  "OPERATOR_PROCEDURE",
  "EXTERNAL_API",
  "FIELD_RESEARCH",
  "USER_INPUT",
  "SIMULATION_ASSUMPTION",
] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

/**
 * Origem operacional de um dado no fluxo do produto.
 * Evolução de `OrigemDado` do motor anterior (FONTES.md §29).
 */
export const DATA_ORIGINS = [
  "USUARIO",
  "LOGCOMEX",
  "FALLBACK_OFFLINE",
  "CACHE",
  "TABELA_PUBLICA",
  "PESQUISA_CAMPO",
  "PREMISSA_SIMULACAO",
] as const;
export type DataOrigin = (typeof DATA_ORIGINS)[number];

/**
 * Referência de fonte estruturada, conforme o formato recomendado em
 * FONTES.md §31. Preserva escopo, vigência e confiança.
 */
export interface SourceReference {
  id: string;
  title: string;
  publisher: string;
  url?: string;
  /**
   * Data de acesso/captura (ISO-8601). Preenchida SOMENTE quando a fonte foi
   * realmente consultada (AJUSTE 2.2/15.1); ausente para "fonte a consultar".
   */
  accessedAt?: string;
  /**
   * `false` quando é uma fonte preferida/planejada ainda NÃO consultada. Uma
   * fonte não consultada não deve parecer efetivamente verificada.
   */
  consulted?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  confidence?: ConfidenceLevel;
  kind: SourceKind;
}

/**
 * Evidência mínima anexada a um dado conhecido.
 * Evolução de `EvidenciaDado` do motor anterior: mantém origem/referência/
 * confiança e, opcionalmente, aponta para uma `SourceReference` completa.
 */
export interface Evidence {
  origin: DataOrigin;
  reference?: string;
  confidence?: ConfidenceLevel;
  source?: SourceReference;
}

/** Cria uma evidência preservando a proveniência informada. */
export function createEvidence(
  origin: DataOrigin,
  details?: {
    reference?: string;
    confidence?: ConfidenceLevel;
    source?: SourceReference;
  },
): Evidence {
  return { origin, ...details };
}
