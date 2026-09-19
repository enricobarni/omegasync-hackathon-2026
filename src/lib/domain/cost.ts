/**
 * Componentes de custo do domínio OmegaSync e a regra estrutural de
 * custos incompletos.
 *
 * Reaproveita a lógica conceitual de `resumirCustos` do motor anterior
 * (subtotalConhecido / total null quando incompleto), generalizada para
 * qualquer conjunto de componentes e estendida ao estado NOT_APPLICABLE.
 *
 * Regra obrigatória (FONTES.md §8, PLANEJAMENTO.md §6):
 *   - componente KNOWN soma ao subtotal e ao total;
 *   - componente UNKNOWN torna o total indeterminado (null) e incompleto;
 *   - componente NOT_APPLICABLE não soma e NÃO bloqueia o total.
 */

import { isKnown, isUnknown } from "./information";
import type { MonetaryAmount } from "./money";

/** Componentes de custo potenciais de uma rota (PLANEJAMENTO.md ETAPA 5). */
export const COST_COMPONENT_KINDS = [
  "DESCARGA",
  "ARMAZENAGEM",
  "MOVIMENTACAO",
  "TRANSPORTE",
  "DTA",
  "SSE",
  "ANUENCIA",
  "CAPATAZIA",
  "CUSTO_CAPITAL",
  "TEMPO_PARADO",
  "OUTRO",
] as const;
export type CostComponentKind = (typeof COST_COMPONENT_KINDS)[number];

/** Um componente de custo rastreável de uma rota. */
export interface CostComponent {
  kind: CostComponentKind;
  label: string;
  /** Valor em BRL: conhecido, desconhecido ou não aplicável. */
  amount: MonetaryAmount;
}

/** Resumo de custos preservando a distinção null != 0. */
export interface CostSummary {
  /** Soma dos componentes conhecidos. NOT_APPLICABLE contribui com 0. */
  knownSubtotal: number;
  /** Total apenas quando não há componente desconhecido; caso contrário null. */
  total: number | null;
  /** Verdadeiro quando nenhum componente necessário está desconhecido. */
  complete: boolean;
  /** Indica se há ao menos um componente desconhecido. */
  hasUnknown: boolean;
}

function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Cria um componente de custo. */
export function createCostComponent(
  kind: CostComponentKind,
  label: string,
  amount: MonetaryAmount,
): CostComponent {
  return { kind, label, amount };
}

/**
 * Resume um conjunto de componentes de custo aplicando a regra estrutural
 * de custos incompletos.
 *
 * Um conjunto vazio produz subtotal 0 e total 0 (não há desconhecidos entre
 * os componentes fornecidos); a completude reflete apenas os componentes
 * efetivamente informados.
 */
export function summarizeCosts(components: CostComponent[]): CostSummary {
  let knownSubtotal = 0;
  let hasUnknown = false;

  for (const component of components) {
    const { amount } = component;
    if (isKnown(amount)) {
      knownSubtotal += amount.value;
    } else if (isUnknown(amount)) {
      hasUnknown = true;
    }
    // NOT_APPLICABLE: não soma e não bloqueia o total.
  }

  knownSubtotal = roundCents(knownSubtotal);

  return {
    knownSubtotal,
    total: hasUnknown ? null : knownSubtotal,
    complete: !hasUnknown,
    hasUnknown,
  };
}
