import { describe, expect, it } from "vitest";

import { createEvidence } from "../domain";
import {
  ENTREPOSTO_CONDITIONS,
  assessEntrepostoRegime,
  baselineEntrepostoRegime,
} from "./entreposto";
import type { EntrepostoConditionStatus } from "./entreposto";

const EVID = createEvidence("USUARIO", { reference: "validação de teste" });

function allValidated(): EntrepostoConditionStatus[] {
  return ENTREPOSTO_CONDITIONS.map((condition) => ({
    condition,
    state: "VALIDADA" as const,
    detail: "validada",
    evidence: EVID,
  }));
}

describe("regime de entreposto — baseline", () => {
  it("todas as condições começam não validadas, fonte a consultar", () => {
    const regime = baselineEntrepostoRegime();
    expect(regime.conditions).toHaveLength(ENTREPOSTO_CONDITIONS.length);
    expect(regime.conditions.every((c) => c.state === "NAO_VALIDADA")).toBe(true);
    expect(regime.source.consulted).toBe(false);
    expect(regime.source.accessedAt).toBeUndefined();
    expect(regime.source.kind).toBe("OFFICIAL_GUIDANCE");
  });

  it("prontidão é PENDENTE_VALIDACAO com todas pendentes; assessment carrega a fonte", () => {
    const assessment = assessEntrepostoRegime(baselineEntrepostoRegime());
    expect(assessment.readiness).toBe("PENDENTE_VALIDACAO");
    expect(assessment.integrity).toBe("OK");
    expect(assessment.pendingConditions).toHaveLength(ENTREPOSTO_CONDITIONS.length);
    expect(assessment.source.id).toBe("rfb-manual-entreposto-aduaneiro");
    expect(assessment.note).toContain("não se confunde com retroporto");
  });
});

describe("assessEntrepostoRegime — evidência e integridade", () => {
  it("fica PRONTO só com todas VALIDADA (com evidência) e conjunto íntegro", () => {
    const regime = { ...baselineEntrepostoRegime(), conditions: allValidated() };
    const assessment = assessEntrepostoRegime(regime);
    expect(assessment.readiness).toBe("PRONTO");
    expect(assessment.pendingConditions).toEqual([]);
  });

  it("NAO_APLICAVEL exige evidência e não é pendente", () => {
    const conditions = allValidated();
    conditions[0] = {
      condition: conditions[0].condition,
      state: "NAO_APLICAVEL",
      detail: "não incide neste cenário",
      evidence: EVID,
    };
    const assessment = assessEntrepostoRegime({
      ...baselineEntrepostoRegime(),
      conditions,
    });
    expect(assessment.readiness).toBe("PRONTO");
  });

  it("INDETERMINADO quando falta uma condição canônica (nunca PRONTO)", () => {
    const conditions = allValidated().slice(1); // remove ADMISSAO
    const assessment = assessEntrepostoRegime({
      ...baselineEntrepostoRegime(),
      conditions,
    });
    expect(assessment.readiness).toBe("INDETERMINADO");
    expect(assessment.integrity).toBe("CONDICAO_AUSENTE");
  });

  it("INDETERMINADO quando há condição duplicada", () => {
    const conditions = [...allValidated(), allValidated()[0]];
    const assessment = assessEntrepostoRegime({
      ...baselineEntrepostoRegime(),
      conditions,
    });
    expect(assessment.readiness).toBe("INDETERMINADO");
    expect(assessment.integrity).toBe("CONDICAO_DUPLICADA");
  });

  it("INDETERMINADO quando não há condições", () => {
    const assessment = assessEntrepostoRegime({
      ...baselineEntrepostoRegime(),
      conditions: [],
    });
    expect(assessment.readiness).toBe("INDETERMINADO");
  });
});
