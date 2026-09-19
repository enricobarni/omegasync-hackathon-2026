import { describe, expect, it } from "vitest";

import type { Cargo, ResolvedAnuencia } from "../domain";
import { createEvidence, known, unknownAmount } from "../domain";
import { assessBehavioralFactors } from "./behavioral-factors";
import type { BehavioralContext } from "./behavioral-factors";

const CARGA_BASE: Cargo = {
  ncm: "84713012",
  cif: unknownAmount(),
  cargoType: "FCL",
  oeaStatus: "NAO_OEA",
  channel: "VERDE",
};

const EVID = createEvidence("USUARIO");

function ctx(overrides: Partial<BehavioralContext> = {}): BehavioralContext {
  return { cargo: CARGA_BASE, ...overrides };
}

function factor(factors: ReturnType<typeof assessBehavioralFactors>, kind: string) {
  const found = factors.find((f) => f.kind === kind);
  if (!found) {
    throw new Error(`fator ${kind} ausente`);
  }
  return found;
}

describe("assessBehavioralFactors", () => {
  it("retorna sinais rotulados como pesquisa de campo, com confiança explícita", () => {
    const factors = assessBehavioralFactors(ctx());
    const estrutura = factor(factors, "ESTRUTURA");
    expect(estrutura.evidence.origin).toBe("PESQUISA_CAMPO");
    expect(estrutura.evidence.confidence).toBeDefined();
  });

  it("ESTRUTURA presente quando não há estrutura sincronizada", () => {
    const factors = assessBehavioralFactors(
      ctx({ possuiEstruturaSincronizada: known(false, EVID) }),
    );
    const estrutura = factor(factors, "ESTRUTURA");
    expect(estrutura.present).toBe(true);
    expect(estrutura.tendency).toContain("recinto");
  });

  it("ESTRUTURA desconhecida quando não informada (unknown != false)", () => {
    const estrutura = factor(assessBehavioralFactors(ctx()), "ESTRUTURA");
    expect(estrutura.present).toBeNull();
  });

  it("CAIXA não se aplica a OEA Excelência", () => {
    const factors = assessBehavioralFactors(
      ctx({ cargo: { ...CARGA_BASE, oeaStatus: "EXCELENCIA" } }),
    );
    expect(factor(factors, "CAIXA").present).toBe(false);
  });

  it("CAIXA presente quando não há caixa para antecipação", () => {
    const factors = assessBehavioralFactors(
      ctx({ possuiCaixaParaAntecipacao: known(false, EVID) }),
    );
    expect(factor(factors, "CAIXA").present).toBe(true);
  });

  it("ANUENCIA presente para não automática posterior, com tendência a retroporto", () => {
    const anuencia: ResolvedAnuencia = {
      state: "NAO_AUTOMATICA_POSTERIOR",
      organs: ["ANVISA"],
      evidence: createEvidence("USUARIO"),
    };
    const anu = factor(assessBehavioralFactors(ctx({ anuencia })), "ANUENCIA");
    expect(anu.present).toBe(true);
    expect(anu.tendency).toContain("retroporto");
  });

  it("CANAL: verde ausente, não verde presente, não revelado desconhecido", () => {
    expect(factor(assessBehavioralFactors(ctx()), "CANAL").present).toBe(false);
    expect(
      factor(
        assessBehavioralFactors(ctx({ cargo: { ...CARGA_BASE, channel: "AMARELO" } })),
        "CANAL",
      ).present,
    ).toBe(true);
    expect(
      factor(
        assessBehavioralFactors(ctx({ cargo: { ...CARGA_BASE, channel: "NAO_REVELADO" } })),
        "CANAL",
      ).present,
    ).toBeNull();
  });

  it("JANELA_48H desconhecida quando não informada; presente quando inviável", () => {
    expect(factor(assessBehavioralFactors(ctx()), "JANELA_48H").present).toBeNull();
    expect(
      factor(
        assessBehavioralFactors(ctx({ janela48hViavel: known(false, EVID) })),
        "JANELA_48H",
      ).present,
    ).toBe(true);
  });
});
