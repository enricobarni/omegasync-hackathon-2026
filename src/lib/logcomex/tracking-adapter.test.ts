import { describe, expect, it } from "vitest";

import { isKnown } from "../domain";
import { adaptTracking } from "./tracking-adapter";
import { trackingFallback } from "./tracking-fallback";

const ACCESSED_AT = "2026-09-19";

describe("adaptTracking", () => {
  it("converte campos de texto com proveniência LOGCOMEX", () => {
    const ctx = adaptTracking(
      {
        operacao: "Importação",
        container: "MSKU1234567",
        armador: "Maersk",
        tipo: "Marítimo FCL",
        informacoes_adicionais: "ETA revisada",
      },
      ACCESSED_AT,
    );

    expect(isKnown(ctx.container) && ctx.container.value).toBe("MSKU1234567");
    if (isKnown(ctx.carrier)) {
      expect(ctx.carrier.evidence.origin).toBe("LOGCOMEX");
    }
    expect(ctx.source.kind).toBe("EXTERNAL_API");
    expect(ctx.contextOnly).toBe(true);
  });

  it("preserva campos ausentes como desconhecidos", () => {
    const ctx = adaptTracking({ container: "ABC" }, ACCESSED_AT);
    expect(ctx.operation.status).toBe("UNKNOWN");
    expect(ctx.carrier.status).toBe("UNKNOWN");
    expect(isKnown(ctx.container)).toBe(true);
  });
});

describe("trackingFallback", () => {
  it("mantém tudo desconhecido e marcado como contexto", () => {
    const ctx = trackingFallback(ACCESSED_AT);
    expect(ctx.operation.status).toBe("UNKNOWN");
    expect(ctx.additionalInfo.status).toBe("UNKNOWN");
    expect(ctx.contextOnly).toBe(true);
    expect(ctx.source.id).toBe("logcomex-tracking-fallback-offline");
  });
});
