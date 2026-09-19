import { describe, expect, it } from "vitest";

import { createEvidence } from "../domain";
import {
  anuenciaAllowsContinuation,
  anuenciaBlocksOperation,
  anuenciaRequiresPosteriorClearance,
  assessClearance,
  getAnuenciaDeadlineEstimate,
  resolveAnuenciaByNcm,
} from "./anuencia";
import type { AnuenciaResolution } from "./anuencia";
import {
  ANUENCIA_REGISTRY_BASELINE,
  type AnuenciaRegistryEntry,
} from "./anuencia-registry";

const EVID = createEvidence("USUARIO");

function resolucao(state: AnuenciaRegistryEntry["state"]): AnuenciaResolution {
  return {
    status: "RESOLVED",
    anuencia: { state, organs: [], evidence: EVID },
  };
}

const NAO_ENCONTRADA: AnuenciaResolution = {
  status: "NOT_FOUND",
  ncm: "00000000",
  reason: "sem mapeamento",
};

describe("registro de anuência", () => {
  it("baseline é vazio (não inventa NCM → órgão)", () => {
    expect(ANUENCIA_REGISTRY_BASELINE).toEqual([]);
  });
});

describe("resolveAnuenciaByNcm", () => {
  it("retorna NOT_FOUND quando não há mapeamento (baseline vazio)", () => {
    const r = resolveAnuenciaByNcm("84713012", ANUENCIA_REGISTRY_BASELINE);
    expect(r.status).toBe("NOT_FOUND");
    if (r.status === "NOT_FOUND") {
      expect(r.reason).toContain("Portal Único");
    }
  });

  it("resolve quando há entrada no registro", () => {
    const registry: AnuenciaRegistryEntry[] = [
      { ncm: "84713012", state: "AUTOMATICA", organs: ["ANVISA"], evidence: EVID },
    ];
    const r = resolveAnuenciaByNcm("84713012", registry);
    expect(r.status).toBe("RESOLVED");
    if (r.status === "RESOLVED") {
      expect(r.anuencia.state).toBe("AUTOMATICA");
      expect(r.anuencia.organs).toEqual(["ANVISA"]);
    }
  });
});

describe("predicados de anuência", () => {
  it("classificam os estados corretamente", () => {
    expect(anuenciaBlocksOperation("IMPEDIMENTO")).toBe(true);
    expect(anuenciaRequiresPosteriorClearance("NAO_AUTOMATICA_POSTERIOR")).toBe(true);
    expect(anuenciaAllowsContinuation("SEM_ANUENCIA")).toBe(true);
    expect(anuenciaAllowsContinuation("AUTOMATICA")).toBe(true);
    expect(anuenciaAllowsContinuation("IMPEDIMENTO")).toBe(false);
  });
});

describe("assessClearance — canal verde não basta", () => {
  it("verde + anuência satisfeita => LIBERADA", () => {
    const r = assessClearance({ channel: "VERDE", anuencia: resolucao("AUTOMATICA") });
    expect(r.status).toBe("LIBERADA");
  });

  it("verde + anuência não automática posterior => PENDENTE (não liberada)", () => {
    const r = assessClearance({
      channel: "VERDE",
      anuencia: resolucao("NAO_AUTOMATICA_POSTERIOR"),
    });
    expect(r.status).toBe("PENDENTE");
    expect(r.reasons.join(" ")).toContain("Canal verde");
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
    const r = assessClearance({ channel: "NAO_REVELADO", anuencia: resolucao("AUTOMATICA") });
    expect(r.status).toBe("INDETERMINADA");
  });

  it("canal não verde => PENDENTE (conferência)", () => {
    const r = assessClearance({ channel: "AMARELO", anuencia: resolucao("AUTOMATICA") });
    expect(r.status).toBe("PENDENTE");
  });
});

describe("getAnuenciaDeadlineEstimate", () => {
  it("retorna estimativa rotulada, não SLA oficial", () => {
    const posterior = getAnuenciaDeadlineEstimate("NAO_AUTOMATICA_POSTERIOR");
    expect(posterior?.value).toBe(10);
    expect(posterior?.unit).toBe("DIAS_UTEIS");
    expect(posterior?.evidence.confidence).toBe("C");
    expect(posterior?.caveat).toContain("não SLA oficial");

    const previa = getAnuenciaDeadlineEstimate("PREVIA_AO_EMBARQUE");
    expect(previa?.value).toBe(60);
    expect(previa?.unit).toBe("DIAS_CORRIDOS");
  });

  it("retorna null quando não há estimativa para a modalidade", () => {
    expect(getAnuenciaDeadlineEstimate("SEM_ANUENCIA")).toBeNull();
    expect(getAnuenciaDeadlineEstimate("AUTOMATICA")).toBeNull();
  });
});
