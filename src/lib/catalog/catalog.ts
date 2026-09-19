/**
 * Catálogo de recintos e rotas: coleção com integridade referencial e
 * consultas. Pertence à camada de dados (PLANEJAMENTO.md §3): representa e
 * organiza os dados, sem decidir elegibilidade nem calcular custos.
 */

import type { CargoType, CustomsZone, Facility, FacilityType, Route } from "../domain";
import { acceptsCargoType } from "../domain";

/** Catálogo de recintos e rotas. */
export interface Catalog {
  facilities: Facility[];
  routes: Route[];
}

export const CATALOG_ISSUE_KINDS = [
  "DUPLICATE_FACILITY_ID",
  "DUPLICATE_ROUTE_ID",
  "ROUTE_ORIGIN_NOT_FOUND",
  "ROUTE_DESTINATION_NOT_FOUND",
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
  facilities: Facility[],
  routes: Route[],
): CatalogValidation {
  const issues: CatalogIssue[] = [];

  const facilityIds = new Set<string>();
  const duplicateFacilityIds = new Set<string>();
  for (const facility of facilities) {
    if (facilityIds.has(facility.id)) {
      duplicateFacilityIds.add(facility.id);
    }
    facilityIds.add(facility.id);
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
    if (!facilityIds.has(route.origin.id)) {
      issues.push({
        kind: "ROUTE_ORIGIN_NOT_FOUND",
        detail: `Rota ${route.id} referencia origem inexistente: ${route.origin.id}`,
      });
    }
    if (!facilityIds.has(route.destination.id)) {
      issues.push({
        kind: "ROUTE_DESTINATION_NOT_FOUND",
        detail: `Rota ${route.id} referencia destino inexistente: ${route.destination.id}`,
      });
    }
  }

  return issues.length === 0 ? { valid: true } : { valid: false, issues };
}

/**
 * Cria um catálogo validando a integridade referencial. Lança erro quando o
 * conjunto é estruturalmente inconsistente — apropriado para dados fixos de
 * baseline, que devem estar corretos em tempo de construção.
 */
export function createCatalog(
  facilities: Facility[],
  routes: Route[],
): Catalog {
  const validation = validateCatalog(facilities, routes);
  if (!validation.valid) {
    const detalhes = validation.issues.map((issue) => issue.detail).join("; ");
    throw new Error(`Catálogo inválido: ${detalhes}`);
  }
  return { facilities, routes };
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
 * Rotas que aceitam explicitamente um tipo de carga. Rota sem tipos
 * confirmados não é assumida como compatível (ver `acceptsCargoType`).
 */
export function listRoutesAcceptingCargo(
  catalog: Catalog,
  cargoType: CargoType,
): Route[] {
  return catalog.routes.filter((route) => acceptsCargoType(route, cargoType));
}

/**
 * Fato estrutural: a rota parte de uma zona e chega a outra. Não é uma
 * inferência de negócio — apenas compara as zonas de origem e destino.
 */
export function routeCrossesZones(route: Route): boolean {
  return route.origin.zone !== route.destination.zone;
}
