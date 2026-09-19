import { describe, expect, it } from "vitest";

import {
  isKnown,
  isNotApplicable,
  isUnknown,
  known,
  notApplicable,
  unknown,
  valueOr,
  valueOrNull,
} from "./information";
import { createEvidence } from "./provenance";

const EVIDENCIA_USUARIO = createEvidence("USUARIO");

describe("estado de informação", () => {
  it("distingue zero conhecido de valor desconhecido", () => {
    const zeroConhecido = known(0, EVIDENCIA_USUARIO);
    const desconhecido = unknown();

    // zero conhecido é um valor legítimo, não ausência
    expect(isKnown(zeroConhecido)).toBe(true);
    expect(valueOrNull(zeroConhecido)).toBe(0);

    // desconhecido nunca vira zero
    expect(isUnknown(desconhecido)).toBe(true);
    expect(valueOrNull(desconhecido)).toBeNull();
    expect(valueOrNull(zeroConhecido)).not.toBe(valueOrNull(desconhecido));
  });

  it("representa 'não aplicável' como estado próprio, distinto de desconhecido", () => {
    const naoAplicavel = notApplicable("SSE desativado na simulação");

    expect(isNotApplicable(naoAplicavel)).toBe(true);
    expect(isUnknown(naoAplicavel)).toBe(false);
    expect(valueOrNull(naoAplicavel)).toBeNull();
    if (naoAplicavel.status === "NOT_APPLICABLE") {
      expect(naoAplicavel.reason).toBe("SSE desativado na simulação");
    }
  });

  it("preserva a evidência de um valor conhecido", () => {
    const evidencia = createEvidence("TABELA_PUBLICA", {
      reference: "descarga direta",
      confidence: "B",
    });
    const valor = known(1063.08, evidencia);

    expect(valor.value).toBe(1063.08);
    expect(valor.evidence).toBe(evidencia);
    expect(valor.evidence.origin).toBe("TABELA_PUBLICA");
    expect(valor.evidence.confidence).toBe("B");
  });

  it("valueOr retorna o fallback apenas quando não há valor conhecido", () => {
    expect(valueOr(known(42, EVIDENCIA_USUARIO), 0)).toBe(42);
    expect(valueOr(unknown(), 7)).toBe(7);
    expect(valueOr(notApplicable(), 7)).toBe(7);
  });
});
