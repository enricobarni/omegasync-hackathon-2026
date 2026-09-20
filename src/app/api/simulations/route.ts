/**
 * Route Handler da API de simulação (ETAPA 10): POST /api/simulations.
 *
 * Fino por definição (PLANEJAMENTO.md ETAPA 10): valida, normaliza, chama o
 * serviço de aplicação e devolve o status HTTP. Não duplica domínio.
 */

import { DEMO_CATALOG } from "@/lib/catalog";
import { runSimulation } from "@/lib/application";
import {
  toSimulationResponse,
  validateSimulationRequest,
} from "@/lib/api";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { errors: ["Corpo da requisição não é JSON válido."] },
      { status: 400 },
    );
  }

  const validation = validateSimulationRequest(body);
  if (!validation.ok) {
    return Response.json({ errors: validation.errors }, { status: 400 });
  }

  const result = runSimulation({
    ...validation.value,
    routes: DEMO_CATALOG.routes,
  });

  return Response.json(toSimulationResponse(result), { status: 200 });
}
