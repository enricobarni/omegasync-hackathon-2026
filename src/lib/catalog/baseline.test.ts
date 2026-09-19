import { describe, expect, it } from "vitest";

import {
  BASELINE_CATALOG,
  ROTA_MODELO_PRIMARIA_SECUNDARIA,
} from "./baseline";
import {
  listFacilitiesByZone,
  routeCrossesZones,
  validateCatalog,
} from "./catalog";

describe("catálogo baseline", () => {
  it("tem integridade referencial", () => {
    const validation = validateCatalog(
      BASELINE_CATALOG.facilities,
      BASELINE_CATALOG.routes,
    );
    expect(validation.valid).toBe(true);
  });

  it("todo recinto carrega proveniência", () => {
    for (const facility of BASELINE_CATALOG.facilities) {
      expect(facility.source).toBeDefined();
      expect(facility.source?.id).toBeTruthy();
    }
  });

  it("separa recintos por zona", () => {
    const primaria = listFacilitiesByZone(BASELINE_CATALOG, "ZONA_PRIMARIA");
    const secundaria = listFacilitiesByZone(
      BASELINE_CATALOG,
      "ZONA_SECUNDARIA",
    );

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

  it("não inventa disponibilidade, distância, prazo nem custos", () => {
    expect(rota.availability.status).toBe("UNKNOWN");
    expect(rota.distanceKm.status).toBe("UNKNOWN");
    expect(rota.estimatedDurationHours.status).toBe("UNKNOWN");
    expect(rota.acceptedCargoTypes).toEqual([]);
    expect(rota.costComponents).toEqual([]);
  });

  it("mantém a fonte da rota", () => {
    expect(rota.source?.id).toBe("mentoria-zona-primaria-secundaria");
  });
});
