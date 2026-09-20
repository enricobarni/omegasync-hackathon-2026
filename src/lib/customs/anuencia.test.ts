import { describe, expect, it } from "vitest";

import { createEvidence } from "../domain";
import type { AnuenciaFulfillment, AnuenciaState } from "../domain";
import {
  anuenciaAllowsContinuation,
  anuenciaBlocksOperation,
  anuenciaRequiresPosteriorClearance,
  assessClearance,
  getAnuenciaDeadlineEstimate,
  normalizeNcm,
  resolveAnuenciaByNcm,
} from "./anuencia";
import type { AnuenciaResolution } from "./anuencia";
import {
  ANUENCIA_REGISTRY_BASELINE,
  type AnuenciaRegistryEntry,
} from "./anuencia-registry";

const EVID = createEvidence("USUARIO");

function resolucao(
  state: AnuenciaState,
  fulfillment: AnuenciaFulfillment = "UNKNOWN",
): AnuenciaResolution {
  return {
    status: "RESOLVED",
    anuencia: { state, fulfillment, organs: [], evidence: EVID },
  };
}

const NAO_ENCONTRADA: AnuenciaResolution = {
  status: "NOT_FOUND",
  ncm: "00000000",
  reason: "sem mapeamento",
};

describe("normalizeNcm", () => {
  it("normaliza para 8 dígitos e rejeita inválidos", () => {
    expect(normalizeNcm("8471.30.12")).toBe("84713012");
    expect(normalizeNcm(" 84713012 ")).toBe("84713012");
    expect(normalizeNcm("123")).toBeNull();
  });
});

describe("registro de anuência", () => {
  it("baseline é vazio (não inventa NCM → órgão)", () => {
    expect(ANUENCIA_REGISTRY_BASELINE).toEqual([]);
  });
});

describe("resolveAnuenciaByNcm", () => {
  it("NOT_FOUND quando não há mapeamento (baseline vazio)", () => {
    const r = resolveAnuenciaByNcm("84713012", ANUENCIA_REGISTRY_BASELINE);
    expect(r.status).toBe("NOT_FOUND");
  });

  it("INVALID_NCM para NCM fora do formato", () => {
    expect(resolveAnuenciaByNcm("123", []).status).toBe("INVALID_NCM");
  });

  it("resolve quando há entrada única sem atributos exigidos", () => {
    const registry: AnuenciaRegistryEntry[] = [
      { ncm: "84713012", state: "AUTOMATICA", organs: ["ANVISA"], evidence: EVID },
    ];
    const r = resolveAnuenciaByNcm("8471.30.12", registry);
    expect(r.status).toBe("RESOLVED");
    if (r.status === "RESOLVED") {
      expect(r.anuencia.state).toBe("AUTOMATICA");
      expect(r.anuencia.fulfillment).toBe("UNKNOWN");
    }
  });

  it("REQUIRES_ATTRIBUTES quando a entrada exige atributos não fornecidos (AJUSTE 8.1)", () => {
    const registry: AnuenciaRegistryEntry[] = [
      {
        ncm: "84713012",
        state: "NAO_AUTOMATICA_POSTERIOR",
        organs: ["ANVISA"],
        evidence: EVID,
        requiredAttributes: ["uso_medico"],
      },
    ];
    expect(resolveAnuenciaByNcm("84713012", registry).status).toBe(
      "REQUIRES_ATTRIBUTES",
    );
    expect(
      resolveAnuenciaByNcm("84713012", registry, ["uso_medico"]).status,
    ).toBe("RESOLVED");
  });

  it("AMBIGUOUS quando há múltiplas entradas compatíveis", () => {
    const registry: AnuenciaRegistryEntry[] = [
      { ncm: "84713012", state: "AUTOMATICA", organs: ["ANVISA"], evidence: EVID },
      { ncm: "84713012", state: "NAO_AUTOMATICA_POSTERIOR", organs: ["INMETRO"], evidence: EVID },
    ];
    expect(resolveAnuenciaByNcm("84713012", registry).status).toBe("AMBIGUOUS");
  });
});

describe("predicados de anuência", () => {
  it("classificam os estados corretamente", () => {
    expect(anuenciaBlocksOperation("IMPEDIMENTO")).toBe(true);
    expect(anuenciaRequiresPosteriorClearance("NAO_AUTOMATICA_POSTERIOR")).toBe(true);
    expect(anuenciaAllowsContinuation("SEM_ANUENCIA")).toBe(true);
    expect(anuenciaAllowsContinuation("IMPEDIMENTO")).toBe(false);
  });
});

describe("assessClearance — canal verde não basta", () => {
  it("verde + SEM_ANUENCIA => LIBERADA", () => {
    const r = assessClearance({ channel: "VERDE", anuencia: resolucao("SEM_ANUENCIA") });
    expect(r.status).toBe("LIBERADA");
    expect(r.evidence.length).toBeGreaterThan(0);
  });

  it("verde + anuência não confirmada (fulfillment UNKNOWN) => PENDENTE (AJUSTE 8.2/8.3)", () => {
    const r = assessClearance({ channel: "VERDE", anuencia: resolucao("AUTOMATICA") });
    expect(r.status).toBe("PENDENTE");
  });

  it("verde + PREVIA_AO_EMBARQUE não confirmada => PENDENTE, não BLOQUEADA", () => {
    const r = assessClearance({
      channel: "VERDE",
      anuencia: resolucao("PREVIA_AO_EMBARQUE"),
    });
    expect(r.status).toBe("PENDENTE");
  });

  it("verde + anuência SATISFIED => LIBERADA", () => {
    const r = assessClearance({
      channel: "VERDE",
      anuencia: resolucao("AUTOMATICA", "SATISFIED"),
    });
    expect(r.status).toBe("LIBERADA");
  });

  it("anuência NOT_SATISFIED => BLOQUEADA", () => {
    const r = assessClearance({
      channel: "VERDE",
      anuencia: resolucao("NAO_AUTOMATICA_POSTERIOR", "NOT_SATISFIED"),
    });
    expect(r.status).toBe("BLOQUEADA");
  });

  it("verde + anuência não resolvida => INDETERMINADA", () => {
    const r = assessClearance({ channel: "VERDE", anuencia: NAO_ENCONTRADA });
    expect(r.status).toBe("INDETERMINADA");
    expect(r.missingData.length).toBeGreaterThan(0);
  });

  it("anuência impeditiva bloqueia independentemente do canal", () => {
    const r = assessClearance({ channel: "VERDE", anuencia: resolucao("IMPEDIMENTO") });
    expect(r.status).toBe("BLOQUEADA");
  });

  it("canal não revelado => INDETERMINADA", () => {
    const r = assessClearance({ channel: "NAO_REVELADO", anuencia: resolucao("SEM_ANUENCIA") });
    expect(r.status).toBe("INDETERMINADA");
  });

  it("canal não verde => PENDENTE (conferência)", () => {
    const r = assessClearance({ channel: "AMARELO", anuencia: resolucao("SEM_ANUENCIA") });
    expect(r.status).toBe("PENDENTE");
  });
});

describe("getAnuenciaDeadlineEstimate", () => {
  it("preserva natureza aproximada e origem (AJUSTE 8.4/8.5)", () => {
    const posterior = getAnuenciaDeadlineEstimate("NAO_AUTOMATICA_POSTERIOR");
    expect(posterior?.estimateType).toBe("APPROXIMATE");
    expect(posterior?.value).toBe(10);
    expect(posterior?.evidence.origin).toBe("PESQUISA_CAMPO");

    const previa = getAnuenciaDeadlineEstimate("PREVIA_AO_EMBARQUE");
    expect(previa?.estimateType).toBe("UP_TO_APPROXIMATE");
    expect(previa?.value).toBe(60);
    // ~60 dias NÃO é pesquisa de campo (AJUSTE 8.5)
    expect(previa?.evidence.origin).not.toBe("PESQUISA_CAMPO");
  });

  it("retorna null quando não há estimativa", () => {
    expect(getAnuenciaDeadlineEstimate("SEM_ANUENCIA")).toBeNull();
  });
});
