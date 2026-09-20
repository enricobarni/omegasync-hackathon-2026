import { describe, expect, it } from "vitest";

import { createEvidence, known, notApplicable } from "../domain";
import {
  WINDOW_48H_RULE,
  assessWindow48h,
} from "./window-48h";
import type { Window48hContext } from "./window-48h";

const EVID = createEvidence("USUARIO");

function ctx(overrides: Partial<Window48hContext> = {}): Window48hContext {
  return { ...overrides };
}

describe("regra documentada da janela de 48h", () => {
  it("preserva fontes e a correção conceitual sobre a DUIMP", () => {
    expect(WINDOW_48H_RULE.retrievalBusinessHours).toBe(48);
    expect(WINDOW_48H_RULE.retrievalUnit).toBe("horas úteis");
    expect(WINDOW_48H_RULE.conceptualNote).toContain("não nasceu com a DUIMP");
    const sourceTitles = WINDOW_48H_RULE.sources.map((s) => s.title);
    expect(sourceTitles.some((t) => t.includes("IN RFB nº 248/2002"))).toBe(true);
    expect(sourceTitles.some((t) => t.includes("209/2026"))).toBe(true);
    const p209 = WINDOW_48H_RULE.sources.find((s) => s.id === "portaria-alf-sts-209-2026");
    expect(p209?.effectiveFrom).toBe("2026-09-01");
  });
});

describe("assessWindow48h — aplicabilidade antes da viabilidade", () => {
  it("INDETERMINADO quando não se sabe se é carga-pátio", () => {
    const r = assessWindow48h(ctx());
    expect(r.applicability).toBe("INDETERMINADO");
    expect(r.viability).toBeNull();
    expect(r.missingData.length).toBeGreaterThan(0);
  });

  it("NAO_APLICAVEL quando não é operação de carga-pátio", () => {
    const r = assessWindow48h(ctx({ cargoYardWithdrawal: known(false, EVID) }));
    expect(r.applicability).toBe("NAO_APLICAVEL");
    expect(r.viability).toBeNull();
    expect(r.consequenceIfExceeded).toBeNull();
  });

  it("APLICAVEL e VIAVEL quando a retirada cabe nas 48h úteis", () => {
    const r = assessWindow48h(
      ctx({
        cargoYardWithdrawal: known(true, EVID),
        facilityDiscriminatedInSchedule: known(true, EVID),
        withinBusinessWindow: known(true, EVID),
      }),
    );
    expect(r.applicability).toBe("APLICAVEL");
    expect(r.viability).toBe("VIAVEL");
    expect(r.countingBasis).toContain("chegada da carga ao pátio");
  });

  it("APLICAVEL e INVIAVEL: expõe consequência e evidência de campo, sem tarifa fictícia", () => {
    const r = assessWindow48h(
      ctx({
        cargoYardWithdrawal: known(true, EVID),
        facilityDiscriminatedInSchedule: known(true, EVID),
        withinBusinessWindow: known(false, EVID),
      }),
    );
    expect(r.applicability).toBe("APLICAVEL");
    expect(r.viability).toBe("INVIAVEL");
    expect(r.consequenceIfExceeded).toContain("perde o status de carga-pátio");
    expect(r.evidence.length).toBeGreaterThan(0);
    // evidência é pesquisa de campo rotulada, nunca um valor monetário inventado
    for (const e of r.evidence) {
      expect(e.origin).toBe("PESQUISA_CAMPO");
      expect(e.confidence).toBe("N1");
    }
    // inputs conhecidos são preservados como evidência (AJUSTE 7.4)
    expect(r.inputEvidence.length).toBeGreaterThan(0);
    expect(r.ruleSources.length).toBeGreaterThan(0);
  });

  it("APLICAVEL e viabilidade INDETERMINADA quando a janela não é informada", () => {
    const r = assessWindow48h(
      ctx({
        cargoYardWithdrawal: known(true, EVID),
        facilityDiscriminatedInSchedule: known(true, EVID),
      }),
    );
    expect(r.applicability).toBe("APLICAVEL");
    expect(r.viability).toBe("INDETERMINADO");
    expect(r.missingData.some((m) => m.includes("48h úteis"))).toBe(true);
  });

  it("base desconhecida => INDETERMINADO mesmo com withinBusinessWindow conhecido (AJUSTE 7.2)", () => {
    const r = assessWindow48h(
      ctx({
        cargoYardWithdrawal: known(true, EVID),
        withinBusinessWindow: known(true, EVID),
      }),
    );
    expect(r.applicability).toBe("APLICAVEL");
    expect(r.viability).toBe("INDETERMINADO");
    expect(r.countingBasis).toBeNull();
  });

  it("carga-pátio NOT_APPLICABLE => NAO_APLICAVEL, distinto de UNKNOWN (AJUSTE 7.3)", () => {
    const r = assessWindow48h(ctx({ cargoYardWithdrawal: notApplicable() }));
    expect(r.applicability).toBe("NAO_APLICAVEL");
  });

  it("base de contagem varia com recinto discriminado no agendamento", () => {
    const comRecinto = assessWindow48h(
      ctx({
        cargoYardWithdrawal: known(true, EVID),
        facilityDiscriminatedInSchedule: known(true, EVID),
        withinBusinessWindow: known(true, EVID),
      }),
    );
    expect(comRecinto.countingBasis).toContain("pátio");

    const semRecinto = assessWindow48h(
      ctx({
        cargoYardWithdrawal: known(true, EVID),
        facilityDiscriminatedInSchedule: known(false, EVID),
        withinBusinessWindow: known(true, EVID),
      }),
    );
    expect(semRecinto.countingBasis).toContain("fim da operação da embarcação");

    const semInfo = assessWindow48h(
      ctx({
        cargoYardWithdrawal: known(true, EVID),
        withinBusinessWindow: known(true, EVID),
      }),
    );
    expect(semInfo.countingBasis).toBeNull();
    expect(semInfo.missingData.some((m) => m.includes("base de contagem"))).toBe(true);
  });
});
