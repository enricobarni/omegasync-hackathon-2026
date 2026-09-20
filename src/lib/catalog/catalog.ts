/**
 * Catálogo de recintos e rotas: coleção com integridade referencial e
 * consultas. Pertence à camada de dados (PLANEJAMENTO.md §3): representa e
 * organiza os dados, sem decidir elegibilidade nem calcular custos.
 */

import type { CargoType, CustomsZone, Facility, FacilityType, Route } from "../domain";
import { cargoTypeAcceptance } from "../domain";

/** Catálogo de recintos e rotas (imutável após validado — AJUSTE 2.4). */
export interface Catalog {
  readonly facilities: readonly Facility[];
  readonly routes: readonly Route[];
}

export const CATALOG_ISSUE_KINDS = [
  "DUPLICATE_FACILITY_ID",
  "DUPLICATE_ROUTE_ID",
  "ROUTE_ORIGIN_NOT_FOUND",
  "ROUTE_DESTINATION_NOT_FOUND",
  "ROUTE_FACILITY_DIVERGENT",
] as const;
export type CatalogIssueKind = (typeof CATALOG_ISSUE_KINDS)[number];

export interface CatalogIssue {
  kind: CatalogIssueKind;
  detail: string;
}

export type CatalogValidation =
  | { valid: true }
  | { valid: false; issues: CatalogIssue[] };

/**
 * Verifica a integridade referencial: ids únicos de recintos e rotas e
 * rotas que só referenciam recintos existentes. Função pura.
 */
export function validateCatalog(
  facilities: readonly Facility[],
  routes: readonly Route[],
): CatalogValidation {
  const issues: CatalogIssue[] = [];

  const facilityById = new Map<string, Facility>();
  const facilityIds = new Set<string>();
  const duplicateFacilityIds = new Set<string>();
  for (const facility of facilities) {
    if (facilityIds.has(facility.id)) {
      duplicateFacilityIds.add(facility.id);
    }
    facilityIds.add(facility.id);
    facilityById.set(facility.id, facility);
  }
  for (const id of duplicateFacilityIds) {
    issues.push({
      kind: "DUPLICATE_FACILITY_ID",
      detail: `Recinto com id duplicado: ${id}`,
    });
  }

  const routeIds = new Set<string>();
  const duplicateRouteIds = new Set<string>();
  for (const route of routes) {
    if (routeIds.has(route.id)) {
      duplicateRouteIds.add(route.id);
    }
    routeIds.add(route.id);
  }
  for (const id of duplicateRouteIds) {
    issues.push({
      kind: "DUPLICATE_ROUTE_ID",
      detail: `Rota com id duplicado: ${id}`,
    });
  }

  for (const route of routes) {
    checkRouteEndpoint(route, route.origin, "origin", facilityById, issues);
    checkRouteEndpoint(route, route.destination, "destination", facilityById, issues);
  }

  return issues.length === 0 ? { valid: true } : { valid: false, issues };
}

/**
 * Verifica que o recinto embutido na rota existe no catálogo E corresponde à
 * identidade canônica (id + zona + tipo + nome). Impede que a rota use uma
 * versão divergente do mesmo id (AJUSTE 2.1).
 */
function checkRouteEndpoint(
  route: Route,
  embedded: Facility,
  role: "origin" | "destination",
  facilityById: Map<string, Facility>,
  issues: CatalogIssue[],
): void {
  const canonical = facilityById.get(embedded.id);
  if (!canonical) {
    issues.push({
      kind:
        role === "origin" ? "ROUTE_ORIGIN_NOT_FOUND" : "ROUTE_DESTINATION_NOT_FOUND",
      detail: `Rota ${route.id} referencia ${role} inexistente: ${embedded.id}`,
    });
    return;
  }
  if (
    canonical.zone !== embedded.zone ||
    canonical.type !== embedded.type ||
    canonical.name !== embedded.name
  ) {
    issues.push({
      kind: "ROUTE_FACILITY_DIVERGENT",
      detail: `Rota ${route.id} usa uma versão divergente do recinto ${embedded.id} (${role}): zona/tipo/nome não conferem com o catálogo`,
    });
  }
}

/**
 * Cria um catálogo validando a integridade referencial. Lança erro quando o
 * conjunto é estruturalmente inconsistente — apropriado para dados fixos de
 * baseline, que devem estar corretos em tempo de construção.
 */
export function createCatalog(
  facilities: readonly Facility[],
  routes: readonly Route[],
): Catalog {
  const validation = validateCatalog(facilities, routes);
  if (!validation.valid) {
    const detalhes = validation.issues.map((issue) => issue.detail).join("; ");
    throw new Error(`Catálogo inválido: ${detalhes}`);
  }
  // Congela cópias para impedir mutação após a validação (AJUSTE 2.4).
  return {
    facilities: Object.freeze([...facilities]),
    routes: Object.freeze([...routes]),
  };
}

export function getFacility(
  catalog: Catalog,
  facilityId: string,
): Facility | null {
  return catalog.facilities.find((facility) => facility.id === facilityId) ?? null;
}

export function listFacilitiesByZone(
  catalog: Catalog,
  zone: CustomsZone,
): Facility[] {
  return catalog.facilities.filter((facility) => facility.zone === zone);
}

export function listFacilitiesByType(
  catalog: Catalog,
  type: FacilityType,
): Facility[] {
  return catalog.facilities.filter((facility) => facility.type === type);
}

export function getRoute(catalog: Catalog, routeId: string): Route | null {
  return catalog.routes.find((route) => route.id === routeId) ?? null;
}

export function listRoutesFrom(
  catalog: Catalog,
  facilityId: string,
): Route[] {
  return catalog.routes.filter((route) => route.origin.id === facilityId);
}

export function listRoutesTo(catalog: Catalog, facilityId: string): Route[] {
  return catalog.routes.filter((route) => route.destination.id === facilityId);
}

/**
 * Rotas que aceitam explicitamente um tipo de carga (aceitação = ACCEPTED).
 * Rota com aceitação desconhecida ou rejeitada não entra (ver
 * `cargoTypeAcceptance`): desconhecido não vira compatível.
 */
export function listRoutesAcceptingCargo(
  catalog: Catalog,
  cargoType: CargoType,
): Route[] {
  return catalog.routes.filter(
    (route) => cargoTypeAcceptance(route, cargoType) === "ACCEPTED",
  );
}

/**
 * Fato estrutural: a rota parte de uma zona e chega a outra. Não é uma
 * inferência de negócio — apenas compara as zonas de origem e destino.
 */
export function routeCrossesZones(route: Route): boolean {
  return route.origin.zone !== route.destination.zone;
}
