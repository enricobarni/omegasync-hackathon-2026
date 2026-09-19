/**
 * Contratos de carga do domínio OmegaSync.
 *
 * Reaproveita enumerações do motor anterior que continuam aplicáveis
 * (OEA, tipo de carga, canal aduaneiro), agora com valores monetários
 * rastreáveis em vez de números crus.
 */

import type { TrackedValue } from "./information";
import type { MonetaryAmount } from "./money";

/** Status OEA do importador (FONTES.md §9). */
export const OEA_STATUSES = [
  "NAO_OEA",
  "ESSENCIAL",
  "QUALIFICADO",
  "EXCELENCIA",
] as const;
export type OeaStatus = (typeof OEA_STATUSES)[number];

/** Tipo de carga. */
export const CARGO_TYPES = ["FCL", "LCL"] as const;
export type CargoType = (typeof CARGO_TYPES)[number];

/**
 * Canal aduaneiro (FONTES.md §11). `NAO_REVELADO` distingue explicitamente
 * "ainda não parametrizado/desconhecido" de um canal já atribuído.
 */
export const CUSTOMS_CHANNELS = [
  "NAO_REVELADO",
  "VERDE",
  "AMARELO",
  "VERMELHO",
  "CINZA",
] as const;
export type CustomsChannel = (typeof CUSTOMS_CHANNELS)[number];

/**
 * Carga normalizada de entrada do domínio.
 *
 * Observações de modelagem:
 * - `ncm` guarda a NCM confirmada; a NCM sugerida (Logcomex) e sua confiança
 *   são tratadas em etapa futura (ncm_sugerido != ncm_confirmado, FONTES §25).
 * - `cif`, `weightKg` e `volumeM3` são rastreáveis e podem ser desconhecidos
 *   enquanto pendentes de confirmação (unknown != zero).
 */
export interface Cargo {
  ncm: string;
  cif: MonetaryAmount;
  cargoType: CargoType;
  oeaStatus: OeaStatus;
  channel: CustomsChannel;
  weightKg?: TrackedValue<number>;
  volumeM3?: TrackedValue<number>;
}
