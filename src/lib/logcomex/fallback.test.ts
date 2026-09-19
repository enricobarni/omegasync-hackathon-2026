import { describe, expect, it } from "vitest";

import { deriveCif } from "./document-analysis-adapter";
import { fallbackEnrichment } from "./fallback";

describe("fallbackEnrichment", () => {
  it("mantém tudo desconhecido, sem inventar dados", () => {
    const e = fallbackEnrichment("2026-09-19");

    expect(e.origin.status).toBe("UNKNOWN");
    expect(e.fob.status).toBe("UNKNOWN");
    expect(e.grossWeightKg.status).toBe("UNKNOWN");
    expect(e.items).toEqual([]);
    expect(e.documentRisks).toEqual([]);
    expect(e.source.id).toBe("logcomex-fallback-offline");
    expect(e.source.accessedAt).toBe("2026-09-19");
  });

  it("CIF permanece desconhecido no fallback (não vira zero)", () => {
    const cif = deriveCif(fallbackEnrichment("2026-09-19"));
    expect(cif.status).toBe("UNKNOWN");
  });
});
