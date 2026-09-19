/**
 * Registro de anuência por NCM (ETAPA 8).
 *
 * Regra obrigatória (FONTES.md §13.5/§13.6, PLANEJAMENTO.md ETAPA 8): NÃO
 * inventar mapeamentos NCM → órgão. O tratamento administrativo depende de
 * atributos além da NCM; a fonte oficial preferida é o Portal Único/Siscomex.
 *
 * O baseline é VAZIO por decisão de projeto — o arquivo equivalente do repo
 * anterior (`ncm-anuentes.json`) também estava vazio. Deve ser populado a
 * partir de fonte oficial, nunca de suposição.
 */

import type {
  AnuenciaState,
  AnuenteOrgan,
  Evidence,
  SourceReference,
} from "../domain";

/**
 * Fonte oficial preferida para o tratamento administrativo (FONTES §13.4).
 * É um SERVIÇO/simulador oficial, não norma jurídica, e ainda A CONSULTAR
 * (AJUSTE 8.6): sem accessedAt/confiança fictícios.
 */
export const SOURCE_PORTAL_UNICO: SourceReference = {
  id: "portal-unico-siscomex-tratamento-administrativo",
  title: "Tratamento Administrativo na Importação — Simulador (fonte a consultar)",
  publisher: "Portal Único Siscomex",
  consulted: false,
  kind: "OFFICIAL_SERVICE",
};

export interface AnuenciaRegistryEntry {
  ncm: string;
  state: AnuenciaState;
  organs: AnuenteOrgan[];
  evidence: Evidence;
  /**
   * Atributos que o tratamento administrativo exige além da NCM
   * (FONTES §13.5). A resolução só por NCM é incompleta quando estes existem.
   */
  requiredAttributes?: string[];
}

/**
 * Baseline VAZIO (FONTES §13.6). Não preencher com dados inventados.
 * Popular a partir do Portal Único/Siscomex.
 */
export const ANUENCIA_REGISTRY_BASELINE: AnuenciaRegistryEntry[] = [];
