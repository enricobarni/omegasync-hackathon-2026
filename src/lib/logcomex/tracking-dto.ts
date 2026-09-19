/**
 * DTOs do provedor Logcomex — Tracking & Follow-up (ETAPA 13).
 *
 * Schema recebido na maratona (FONTES.md §26): os dados relevantes são
 * majoritariamente texto/string. Vivem FORA do domínio; o núcleo nunca depende
 * deles. Regra (FONTES §26): NÃO usar parsing ingênuo para derivar regra
 * determinística — o tracking é contexto operacional.
 */

export interface LogcomexTrackingInputDTO {
  container?: string;
  armador?: string;
  tipo?: string;
  mais_informacoes?: string;
}

export interface LogcomexTrackingResponseDTO {
  operacao?: string;
  container?: string;
  armador?: string;
  tipo?: string;
  informacoes_adicionais?: string;
}

/** Porta do cliente de tracking; a implementação HTTP é fiada na borda. */
export interface TrackingPort {
  track(input: LogcomexTrackingInputDTO): Promise<LogcomexTrackingResponseDTO>;
}
