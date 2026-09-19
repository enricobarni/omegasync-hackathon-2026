import { describe, expect, it } from "vitest";

import {
  ENTREPOSTO_CONDITIONS,
  assessEntrepostoRegime,
  baselineEntrepostoRegime,
} from "./entreposto";
import type { ValidationState } from "./entreposto";

describe("regime de entreposto — baseline", () => {
  it("todas as condições começam não validadas", () => {
    const regime = baselineEntrepostoRegime();
    expect(regime.conditions).toHaveLength(ENTREPOSTO_CONDITIONS.length);
    expect(regime.conditions.every((c) => c.state === "NAO_VALIDADA")).toBe(true);
    expect(regime.source.title).toBe("Manual de Entreposto Aduaneiro");
  });

  it("prontidão é PENDENTE_VALIDACAO com todas as condições pendentes", () => {
    const assessment = assessEntrepostoRegime(baselineEntrepostoRegime());
    expect(assessment.readiness).toBe("PENDENTE_VALIDACAO");
    expect(assessment.pendingConditions).toHaveLength(ENTREPOSTO_CONDITIONS.length);
    expect(assessment.note).toContain("não deve ser confundido com retroporto");
  });
});

describe("assessEntrepostoRegime", () => {
  it("fica PRONTO quando nada está pendente", () => {
    const regime = baselineEntrepostoRegime();
    const validado = {
      ...regime,
      conditions: regime.conditions.map((c) => ({ ...c, state: "VALIDADA" as const })),
    };
    const assessment = assessEntrepostoRegime(validado);
    expect(assessment.readiness).toBe("PRONTO");
    expect(assessment.pendingConditions).toEqual([]);
  });

  it("condição NAO_APLICAVEL não conta como pendente", () => {
    const regime = baselineEntrepostoRegime();
    const conditions = regime.conditions.map((c, i) => {
      const state: ValidationState = i === 0 ? "NAO_APLICAVEL" : "VALIDADA";
      return { ...c, state };
    });
    const assessment = assessEntrepostoRegime({ ...regime, conditions });
    expect(assessment.readiness).toBe("PRONTO");
  });

  it("INDETERMINADO quando não há condições", () => {
    const regime = baselineEntrepostoRegime();
    expect(assessEntrepostoRegime({ ...regime, conditions: [] }).readiness).toBe(
      "INDETERMINADO",
    );
  });
});
