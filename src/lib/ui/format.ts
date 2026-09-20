/**
 * Helpers de apresentação (ETAPA 12).
 *
 * Funções puras de formatação/rotulagem usadas pela UI. Não contêm regra de
 * negócio — apenas convertem valores do contrato público em texto pt-BR.
 * Regra de DESIGN.md §18: valor desconhecido NUNCA é exibido como R$ 0,00.
 */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrencyBRL(value: number): string {
  return BRL.format(value);
}

/** Total de custo: null => "Indeterminado" (nunca R$ 0,00). */
export function formatCostTotal(total: number | null): string {
  return total === null ? "Indeterminado" : formatCurrencyBRL(total);
}

/** Subtotal conhecido: 0 sem completude => "Sem custo conhecido". */
export function formatKnownSubtotal(
  knownSubtotal: number,
  complete: boolean,
): string {
  if (!complete && knownSubtotal === 0) {
    return "Sem custo conhecido";
  }
  return formatCurrencyBRL(knownSubtotal);
}

export function eligibilityLabel(status: string): string {
  switch (status) {
    case "VIAVEL":
      return "Viável";
    case "INVIAVEL":
      return "Inviável";
    case "INDETERMINADA":
      return "Indeterminada";
    default:
      return status;
  }
}

export function clearanceLabel(status: string): string {
  switch (status) {
    case "LIBERADA":
      return "Liberada";
    case "BLOQUEADA":
      return "Bloqueada";
    case "PENDENTE":
      return "Pendente";
    case "INDETERMINADA":
      return "Indeterminada";
    default:
      return status;
  }
}

export function windowLabel(status: string | null): string {
  switch (status) {
    case "VIAVEL":
      return "Viável";
    case "INVIAVEL":
      return "Inviável";
    case "INDETERMINADO":
      return "Indeterminado";
    case null:
      return "Não avaliada";
    default:
      return status;
  }
}

export function applicabilityLabel(status: string): string {
  switch (status) {
    case "APLICAVEL":
      return "Aplicável";
    case "NAO_APLICAVEL":
      return "Não aplicável";
    case "INDETERMINADO":
      return "Indeterminado";
    default:
      return status;
  }
}

/** Estado de fator comportamental (AJUSTE 3.7): PRESENT/ABSENT/NOT_APPLICABLE/UNKNOWN. */
export function behavioralStateLabel(state: string): string {
  switch (state) {
    case "PRESENT":
      return "Presente";
    case "ABSENT":
      return "Ausente";
    case "NOT_APPLICABLE":
      return "Não aplicável";
    case "UNKNOWN":
      return "Não informado";
    default:
      return state;
  }
}

export function anuenciaLabel(status: string, state: string | null): string {
  if (status === "RESOLVED") {
    return state ?? "Resolvida";
  }
  return "Não resolvida";
}
