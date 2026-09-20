import { describe, expect, it } from "vitest";

import {
  anuenciaLabel,
  applicabilityLabel,
  behavioralStateLabel,
  clearanceLabel,
  eligibilityLabel,
  formatCostTotal,
  formatCurrencyBRL,
  formatKnownSubtotal,
  windowLabel,
} from "./format";

describe("formatação de moeda", () => {
  it("formata em BRL", () => {
    expect(formatCurrencyBRL(1063.08)).toContain("1.063,08");
    expect(formatCurrencyBRL(1063.08).startsWith("R$")).toBe(true);
  });

  it("total null => Indeterminado (nunca R$ 0,00)", () => {
    expect(formatCostTotal(null)).toBe("Indeterminado");
    expect(formatCostTotal(1900)).toContain("1.900,00");
  });

  it("subtotal 0 incompleto => Sem custo conhecido", () => {
    expect(formatKnownSubtotal(0, false)).toBe("Sem custo conhecido");
    expect(formatKnownSubtotal(1900, true)).toContain("1.900,00");
  });
});

describe("rótulos", () => {
  it("mapeia estados para pt-BR", () => {
    expect(eligibilityLabel("VIAVEL")).toBe("Viável");
    expect(eligibilityLabel("INVIAVEL")).toBe("Inviável");
    expect(clearanceLabel("LIBERADA")).toBe("Liberada");
    expect(windowLabel(null)).toBe("Não avaliada");
    expect(applicabilityLabel("NAO_APLICAVEL")).toBe("Não aplicável");
  });

  it("estado de fator comportamental", () => {
    expect(behavioralStateLabel("PRESENT")).toBe("Presente");
    expect(behavioralStateLabel("ABSENT")).toBe("Ausente");
    expect(behavioralStateLabel("NOT_APPLICABLE")).toBe("Não aplicável");
    expect(behavioralStateLabel("UNKNOWN")).toBe("Não informado");
  });

  it("anuência: resolvida mostra o estado; senão não resolvida", () => {
    expect(anuenciaLabel("RESOLVED", "AUTOMATICA")).toBe("AUTOMATICA");
    expect(anuenciaLabel("NOT_FOUND", null)).toBe("Não resolvida");
  });
});
