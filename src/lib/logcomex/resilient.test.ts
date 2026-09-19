import { describe, expect, it } from "vitest";

import type { DocumentAnalysisPort } from "./document-analysis-dto";
import type { TrackingPort } from "./tracking-dto";
import {
  analyzeDocumentWithFallback,
  trackWithFallback,
} from "./resilient";

const OPTS = { accessedAt: "2026-09-19", timeoutMs: 30 };

describe("analyzeDocumentWithFallback", () => {
  it("retorna o enriquecimento quando o provedor responde", async () => {
    const port: DocumentAnalysisPort = {
      analyze: async () => ({ dados_embarque: { valor_fob: 100000 } }),
    };
    const r = await analyzeDocumentWithFallback(port, { arquivo: "a.pdf" }, OPTS);
    expect(r.degraded).toBe(false);
    expect(r.value.fob.status).toBe("KNOWN");
  });

  it("cai no fallback quando o provedor falha", async () => {
    const port: DocumentAnalysisPort = {
      analyze: async () => {
        throw new Error("500 do provedor");
      },
    };
    const r = await analyzeDocumentWithFallback(port, { arquivo: "a.pdf" }, OPTS);
    expect(r.degraded).toBe(true);
    expect(r.reason).toContain("500");
    expect(r.value.fob.status).toBe("UNKNOWN");
  });

  it("cai no fallback quando estoura o timeout", async () => {
    const port: DocumentAnalysisPort = {
      analyze: () => new Promise(() => {}), // nunca resolve
    };
    const r = await analyzeDocumentWithFallback(port, { arquivo: "a.pdf" }, {
      accessedAt: "2026-09-19",
      timeoutMs: 20,
    });
    expect(r.degraded).toBe(true);
    expect(r.reason).toContain("Timeout");
    expect(r.value.origin.status).toBe("UNKNOWN");
  });
});

describe("trackWithFallback", () => {
  it("retorna contexto quando o provedor responde", async () => {
    const port: TrackingPort = {
      track: async () => ({ container: "MSKU1234567" }),
    };
    const r = await trackWithFallback(port, { container: "MSKU1234567" }, OPTS);
    expect(r.degraded).toBe(false);
    expect(r.value.container.status).toBe("KNOWN");
  });

  it("cai no fallback quando o provedor falha", async () => {
    const port: TrackingPort = {
      track: async () => {
        throw new Error("indisponível");
      },
    };
    const r = await trackWithFallback(port, { container: "X" }, OPTS);
    expect(r.degraded).toBe(true);
    expect(r.value.contextOnly).toBe(true);
    expect(r.value.container.status).toBe("UNKNOWN");
  });
});
