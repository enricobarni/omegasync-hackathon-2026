/**
 * DTOs do provedor — Logcomex "Brasil | Análise de Importações" (ETAPA 14).
 *
 * Colunas confirmadas em FONTES.md §27. Provedor externo, fora do domínio.
 * Uso: carteira/mercado/contexto — NÃO substitui dados da carga individual.
 */

export interface LogcomexImportRowDTO {
  ano_mes?: string;
  provavel_importador?: string;
  provavel_exportador?: string;
  provavel_fabricante?: string;
  pais_origem?: string;
  provavel_marca?: string;
  provavel_modelo?: string;
  ncm?: string;
  fob_total?: number | string;
  fob_unitario?: number | string;
  quantidade?: number | string;
  porto_entrada?: string;
  frete_total?: number | string;
}

export interface LogcomexImportAnalysisDTO {
  linhas?: LogcomexImportRowDTO[];
}

export interface ImportAnalysisPort {
  analyze(filters: Record<string, unknown>): Promise<LogcomexImportAnalysisDTO>;
}
