import { describe, expect, it } from "vitest";

import { isKnown } from "../domain";
import { adaptImportAnalysis } from "./import-analysis-adapter";

const ACCESSED_AT = "2026-09-19";

describe("adaptImportAnalysis", () => {
  it("converte linhas estruturadas como agregado de mercado", () => {
    const analysis = adaptImportAnalysis(
      {
        linhas: [
          {
            ano_mes: "2026-06",
            provavel_importador: "Empresa X",
            pais_origem: "China",
            ncm: "84713012",
            fob_total: "1000000",
            quantidade: 500,
            porto_entrada: "Santos",
            frete_total: 40000,
          },
        ],
      },
      ACCESSED_AT,
    );

    expect(analysis.scope).toBe("MARKET_AGGREGATE");
    expect(analysis.source.kind).toBe("EXTERNAL_API");
    const row = analysis.rows[0];
    expect(isKnown(row.ncm) && row.ncm.value).toBe("84713012");
    expect(isKnown(row.fobTotal) && row.fobTotal.value).toBe(1000000);
    expect(isKnown(row.quantity) && row.quantity.value).toBe(500);
    if (isKnown(row.entryPort)) {
      expect(row.entryPort.evidence.origin).toBe("LOGCOMEX");
    }
  });

  it("preserva colunas ausentes como desconhecidas", () => {
    const analysis = adaptImportAnalysis({ linhas: [{ ncm: "84713012" }] }, ACCESSED_AT);
    const row = analysis.rows[0];
    expect(row.fobTotal.status).toBe("UNKNOWN");
    expect(row.probableImporter.status).toBe("UNKNOWN");
  });

  it("lida com resposta sem linhas", () => {
    const analysis = adaptImportAnalysis({}, ACCESSED_AT);
    expect(analysis.rows).toEqual([]);
  });
});
