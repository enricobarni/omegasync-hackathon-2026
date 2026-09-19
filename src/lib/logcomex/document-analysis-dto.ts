/**
 * DTOs do provedor Logcomex — Analista de Documentação (ETAPA 11).
 *
 * Schema recebido durante a maratona (FONTES.md §25). Estes tipos refletem o
 * formato do PROVEDOR e vivem FORA do domínio (AGENTS.md — Logcomex): campos
 * majoritariamente opcionais e possivelmente string, como o provedor entrega.
 * O domínio nunca depende destes tipos; a conversão é feita por adapter.
 */

export interface LogcomexDocumentItemDTO {
  descricao?: string;
  marca?: string;
  modelo?: string;
  quantidade?: number | string;
  unidade?: string;
  valor_unitario?: number | string;
  valor_total?: number | string;
  pais_origem?: string;
  ncm_sugerido?: string;
  nivel_confianca_ncm?: number | string;
}

export interface LogcomexDadosEmbarqueDTO {
  exportador?: string;
  importador?: string;
  consignee?: string;
  modal?: string;
  incoterm?: string;
  origem?: string;
  destino?: string;
  bl_awb?: string;
  invoice?: string;
  datas_relevantes?: unknown;
  peso_bruto?: number | string;
  peso_liquido?: number | string;
  valor_fob?: number | string;
  valor_frete?: number | string;
  valor_seguro?: number | string;
  itens?: LogcomexDocumentItemDTO[];
}

export interface LogcomexDocumentAnalysisDTO {
  validacao_cruzada_campos?: unknown;
  resumo_executivo?: string;
  riscos_aduan_sugest?: string | string[];
  percentual_confianca?: number | string;
  dados_embarque?: LogcomexDadosEmbarqueDTO;
  notificacao_email?: unknown;
}

/**
 * Porta (interface) do cliente de análise documental. A implementação HTTP
 * concreta (com autenticação por variável de ambiente) é fiada na borda da
 * aplicação; o núcleo determinístico não faz chamadas de rede.
 */
export interface DocumentAnalysisPort {
  analyze(input: {
    arquivo: string;
    workflow_operacoes?: string;
  }): Promise<LogcomexDocumentAnalysisDTO>;
}
