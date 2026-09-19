/**
 * Fontes das tarifas (FONTES.md §3–§6). Cada tarifa aponta para a sua
 * `SourceReference`, com confiança segundo a escala de FONTES.md §2
 * (tabela pública datada = A; escopo não verificado / não consolidado = C).
 */

import type { SourceReference } from "../domain";

/** DP World Santos — tabela pública datada de armazenagem (FONTES.md §4). */
export const TARIFF_SOURCE_DPWORLD: SourceReference = {
  id: "dpworld-santos-armazenagem-tabela-2026-08-31",
  title: "Tabela pública de armazenagem — DP World Santos",
  publisher: "DP World Santos",
  accessedAt: "2026-08-31",
  confidence: "A",
  kind: "OFFICIAL_TARIFF",
};

/** Ecoporto Santos — Tabela Geral de Preços, vigência 10/01/2026 (FONTES.md §5). */
export const TARIFF_SOURCE_ECOPORTO: SourceReference = {
  id: "ecoporto-santos-tabela-geral-2026-01-10",
  title: "Tabela Geral de Preços — Ecoporto Santos",
  publisher: "Ecoporto Santos",
  accessedAt: "2026-08-31",
  effectiveFrom: "2026-01-10",
  confidence: "A",
  kind: "OFFICIAL_TARIFF",
};

/**
 * Descarga Direta atribuída a Santos Brasil (FONTES.md §3.1). Confiança C:
 * a tabela capturada pode se referir a Imbituba/SC, não ao Tecon Santos.
 */
export const TARIFF_SOURCE_SANTOS_BRASIL_DESCARGA: SourceReference = {
  id: "santos-brasil-descarga-direta-captura-2026-08-31",
  title: "Descarga Direta — Santos Brasil (captura de pesquisa)",
  publisher: "Santos Brasil",
  accessedAt: "2026-08-31",
  confidence: "C",
  kind: "OFFICIAL_TARIFF",
};

/** BTP — armazenagem não consolidada (FONTES.md §6). */
export const TARIFF_SOURCE_BTP: SourceReference = {
  id: "btp-santos-armazenagem-nao-consolidada",
  title: "Armazenagem — BTP (Brasil Terminal Portuário), não consolidada",
  publisher: "BTP",
  accessedAt: "2026-08-31",
  confidence: "C",
  kind: "OFFICIAL_TARIFF",
};
