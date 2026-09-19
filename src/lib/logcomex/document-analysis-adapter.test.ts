import { describe, expect, it } from "vitest";

import { isKnown } from "../domain";
import {
  adaptDocumentAnalysis,
  buildCargoFromEnrichment,
  deriveCif,
  parseNumber,
} from "./document-analysis-adapter";
import type { LogcomexDocumentAnalysisDTO } from "./document-analysis-dto";

const ACCESSED_AT = "2026-09-19";

const DTO_COMPLETO: LogcomexDocumentAnalysisDTO = {
  resumo_executivo: "Embarque de notebooks.",
  percentual_confianca: 92,
  riscos_aduan_sugest: ["Divergência de peso", "Invoice sem assinatura"],
  dados_embarque: {
    origem: "Shenzhen",
    destino: "Santos",
    incoterm: "CIF",
    peso_bruto: 1200,
    valor_fob: "100000",
    valor_frete: 5000,
    valor_seguro: 500,
    itens: [
      {
        descricao: "Notebook",
        quantidade: "10",
        unidade: "UN",
        pais_origem: "China",
        ncm_sugerido: "84713012",
        nivel_confianca_ncm: 88,
        valor_unitario: 1000,
        valor_total: 10000,
      },
    ],
  },
};

describe("parseNumber", () => {
  it("aceita número e string numérica; rejeita o resto", () => {
    expect(parseNumber(10)).toBe(10);
    expect(parseNumber("10.5")).toBe(10.5);
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
    expect(parseNumber(Infinity)).toBeNull();
  });
});

describe("adaptDocumentAnalysis", () => {
  it("converte campos presentes com proveniência Logcomex", () => {
    const e = adaptDocumentAnalysis(DTO_COMPLETO, ACCESSED_AT);

    expect(e.origin.status).toBe("KNOWN");
    if (isKnown(e.origin)) {
      expect(e.origin.value).toBe("Shenzhen");
      expect(e.origin.evidence.origin).toBe("LOGCOMEX");
    }
    expect(isKnown(e.fob) && e.fob.value).toBe(100000);
    expect(isKnown(e.grossWeightKg) && e.grossWeightKg.value).toBe(1200);
    expect(e.source.kind).toBe("EXTERNAL_API");
    expect(e.source.accessedAt).toBe(ACCESSED_AT);
    expect(e.documentRisks).toHaveLength(2);
  });

  it("preserva campos ausentes como desconhecidos (unknown != zero)", () => {
    const e = adaptDocumentAnalysis({ dados_embarque: {} }, ACCESSED_AT);
    expect(e.fob.status).toBe("UNKNOWN");
    expect(e.origin.status).toBe("UNKNOWN");
    expect(e.items).toEqual([]);
    expect(e.documentRisks).toEqual([]);
  });

  it("normaliza riscos como string única", () => {
    const e = adaptDocumentAnalysis(
      { riscos_aduan_sugest: "Risco único" },
      ACCESSED_AT,
    );
    expect(e.documentRisks).toEqual(["Risco único"]);
  });

  it("traz a NCM apenas como sugestão, com confiança", () => {
    const e = adaptDocumentAnalysis(DTO_COMPLETO, ACCESSED_AT);
    const item = e.items[0];
    expect(isKnown(item.suggestedNcm) && item.suggestedNcm.value).toBe("84713012");
    expect(isKnown(item.ncmConfidence) && item.ncmConfidence.value).toBe(88);
  });
});

describe("deriveCif", () => {
  it("soma FOB + frete + seguro quando todos conhecidos", () => {
    const e = adaptDocumentAnalysis(DTO_COMPLETO, ACCESSED_AT);
    const cif = deriveCif(e);
    expect(cif.status).toBe("KNOWN");
    if (isKnown(cif)) {
      expect(cif.value).toBe(105500);
    }
  });

  it("permanece desconhecido quando falta um componente", () => {
    const e = adaptDocumentAnalysis(
      { dados_embarque: { valor_fob: 100000, valor_frete: 5000 } },
      ACCESSED_AT,
    );
    expect(deriveCif(e).status).toBe("UNKNOWN");
  });
});

describe("buildCargoFromEnrichment — ncm_sugerido != ncm_confirmado", () => {
  it("usa a NCM confirmada pelo usuário, nunca a sugestão", () => {
    const e = adaptDocumentAnalysis(DTO_COMPLETO, ACCESSED_AT);
    const cargo = buildCargoFromEnrichment(e, {
      confirmedNcm: "85287200",
      cargoType: "FCL",
      oeaStatus: "NAO_OEA",
      channel: "VERDE",
    });

    expect(cargo.ncm).toBe("85287200");
    // a sugestão do Logcomex era 84713012 — não foi promovida
    expect(cargo.ncm).not.toBe("84713012");
    // CIF derivado do enriquecimento
    expect(isKnown(cargo.cif) && cargo.cif.value).toBe(105500);
  });

  it("usa o CIF informado quando fornecido", () => {
    const e = adaptDocumentAnalysis({ dados_embarque: {} }, ACCESSED_AT);
    const cargo = buildCargoFromEnrichment(e, {
      confirmedNcm: "85287200",
      cargoType: "LCL",
      oeaStatus: "ESSENCIAL",
      channel: "AMARELO",
      cif: { status: "KNOWN", value: 50000, evidence: { origin: "USUARIO" } },
    });
    expect(isKnown(cargo.cif) && cargo.cif.value).toBe(50000);
  });
});
