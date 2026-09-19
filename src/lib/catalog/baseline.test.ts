import { describe, expect, it } from "vitest";

import {
  DEMO_CATALOG,
  OPERATIONAL_CATALOG,
  ROTA_MODELO_PRIMARIA_SECUNDARIA,
} from "./baseline";
import {
  listFacilitiesByZone,
  routeCrossesZones,
  validateCatalog,
} from "./catalog";
import { isKnown } from "../domain";

describe("catálogo operacional (AJUSTE 2.3)", () => {
  it("contém só recintos reais e nenhuma rota fabricada", () => {
    const validation = validateCatalog(
      OPERATIONAL_CATALOG.facilities,
      OPERATIONAL_CATALOG.routes,
    );
    expect(validation.valid).toBe(true);
    expect(OPERATIONAL_CATALOG.routes).toEqual([]);
    expect(OPERATIONAL_CATALOG.facilities.map((f) => f.id)).not.toContain(
      "recinto-zs-generico",
    );
  });
});

describe("catálogo de demonstração", () => {
  it("tem integridade referencial", () => {
    const validation = validateCatalog(
      DEMO_CATALOG.facilities,
      DEMO_CATALOG.routes,
    );
    expect(validation.valid).toBe(true);
  });

  it("todo recinto carrega proveniência", () => {
    for (const facility of DEMO_CATALOG.facilities) {
      expect(facility.source).toBeDefined();
      expect(facility.source?.id).toBeTruthy();
    }
  });

  it("separa recintos por zona e inclui o sintético de simulação", () => {
    const primaria = listFacilitiesByZone(DEMO_CATALOG, "ZONA_PRIMARIA");
    const secundaria = listFacilitiesByZone(DEMO_CATALOG, "ZONA_SECUNDARIA");

    expect(primaria.map((f) => f.id)).toContain("dpworld-santos");
    expect(primaria.map((f) => f.id)).toContain("btp-santos");
    expect(secundaria.map((f) => f.id)).toContain("recinto-zs-generico");
  });
});

describe("rota-modelo Zona Primária → Zona Secundária", () => {
  const rota = ROTA_MODELO_PRIMARIA_SECUNDARIA;

  it("cruza zonas e usa DTA como premissa rastreável", () => {
    expect(routeCrossesZones(rota)).toBe(true);
    expect(rota.requiresDta.status).toBe("REQUIRED");
    if (rota.requiresDta.status === "REQUIRED") {
      expect(rota.requiresDta.evidence.source?.publisher).toBe(
        "Receita Federal do Brasil",
      );
    }
  });

  it("não inventa disponibilidade, distância, prazo, tipos de carga nem custos", () => {
    expect(rota.availability.status).toBe("UNKNOWN");
    expect(rota.distanceKm.status).toBe("UNKNOWN");
    expect(rota.estimatedDurationHours.status).toBe("UNKNOWN");
    expect(isKnown(rota.acceptedCargoTypes)).toBe(false);
    expect(rota.costComponents).toEqual([]);
  });

  it("mantém a fonte da rota", () => {
    expect(rota.source?.id).toBe("mentoria-zona-primaria-secundaria");
  });
});
