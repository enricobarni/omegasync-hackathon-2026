/**
 * Referências de fonte reutilizáveis para o catálogo de recintos e rotas.
 *
 * Todas as fontes têm origem rastreável em FONTES.md. Nenhuma tarifa é
 * carregada aqui — dados tarifários são tratados na ETAPA 4. Estas fontes
 * apenas identificam os recintos citados no baseline e o conceito de
 * trânsito aduaneiro (DTA) que sustenta a transferência entre zonas.
 */

import type { SourceReference } from "../domain";

/** DP World Santos — recinto citado no baseline tarifário (FONTES.md §4). */
export const SOURCE_DPWORLD_SANTOS: SourceReference = {
  id: "dpworld-santos-armazenagem-2026-08-31",
  title: "Tabela pública de armazenagem — DP World Santos",
  publisher: "DP World Santos",
  // Data de CAPTURA (FONTES §4), não vigência: effectiveFrom fica ausente
  // porque o baseline não sustenta início de vigência (AJUSTE 2.2).
  accessedAt: "2026-08-31",
  consulted: true,
  confidence: "B",
  kind: "OFFICIAL_TARIFF",
};

/** BTP — recinto citado no baseline tarifário (FONTES.md §6, não consolidado). */
export const SOURCE_BTP_SANTOS: SourceReference = {
  id: "btp-santos-armazenagem",
  title: "Baseline de armazenagem — BTP (Brasil Terminal Portuário)",
  publisher: "BTP",
  accessedAt: "2026-08-31",
  consulted: true,
  confidence: "C",
  kind: "OFFICIAL_TARIFF",
};

/**
 * Conceito de trânsito aduaneiro (DTA) como instrumento de transferência de
 * carga sob controle aduaneiro da Zona Primária para a Zona Secundária
 * (FONTES.md §17). Fonte oficial preferida A CONSULTAR — não foi efetivamente
 * acessada; é orientação administrativa, não norma (AJUSTE 2.2).
 */
export const SOURCE_DTA_MANUAL: SourceReference = {
  id: "rfb-manual-transito-aduaneiro",
  title: "Manual de Trânsito Aduaneiro (fonte a consultar)",
  publisher: "Receita Federal do Brasil",
  consulted: false,
  kind: "OFFICIAL_GUIDANCE",
};

/**
 * Direção de produto da mentoria: comparação Zona Primária × Zona Secundária
 * com uso de DTA (FONTES.md §30). É hipótese operacional/premissa, não norma,
 * e sustenta apenas a existência conceitual da rota-modelo, nunca seus números.
 */
export const SOURCE_MENTORIA_ZONAS: SourceReference = {
  id: "mentoria-zona-primaria-secundaria",
  title: "ideia_operacao_portuaria_zona_primaria_secundaria.pdf",
  publisher: "OmegaSync — mentoria Porto Hack Santos 2026",
  accessedAt: "2026-09-19",
  confidence: "C",
  kind: "SIMULATION_ASSUMPTION",
};
