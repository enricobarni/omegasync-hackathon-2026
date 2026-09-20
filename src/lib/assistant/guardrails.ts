/**
 * Guardrails do assistente (PLANEJAMENTO-MCP.md §5.1/§13/§17/§20).
 *
 * Garante a separação obrigatória: o Logcomex fornece contexto/orientação; o
 * OmegaSync mantém a decisão determinística. Estes helpers:
 *  - montam o prompt com instruções explícitas para o agente NÃO alterar o
 *    resultado do motor nem inventar dados;
 *  - fornecem as ressalvas fixas exibidas ao usuário;
 *  - detectam perguntas administrativas (anuência/órgão/LPCO) para reforçar que
 *    o motor permanece UNKNOWN/INDETERMINADO sem fonte estruturada confiável.
 *
 * IMPORTANTE: nada aqui escreve no domínio. A resposta do agente é texto livre e
 * é sempre apresentada como contexto — nunca promovida a fato determinístico.
 */

/** Ressalva fixa para respostas vindas de fora do motor. */
export const EXTERNAL_DISCLAIMER =
  "Contexto consultivo da Logcomex — não altera automaticamente a decisão do motor do OmegaSync.";

/** Aviso quando não há como confirmar uma informação. */
export const UNCONFIRMED_NOTE =
  "Não foi possível confirmar essa informação com os dados estruturados disponíveis.";

/** Aviso específico para tratamento administrativo textual (§20). */
export const ADMINISTRATIVE_NOTE =
  "Orientação geral sobre órgão anuente/LPCO: enquanto não houver fonte estruturada e rastreável, o motor mantém esse ponto como INDETERMINADO.";

const ADMINISTRATIVE_PATTERNS = [
  "anuen", // anuência, anuente
  "lpco",
  "órgão",
  "orgao",
  "licenciamento",
  "licença de importação",
  "licenca de importacao",
];

/** Heurística leve: a pergunta trata de tratamento administrativo? */
export function isAdministrativeQuestion(message: string): boolean {
  const lowered = message.toLowerCase();
  return ADMINISTRATIVE_PATTERNS.some((p) => lowered.includes(p));
}

/**
 * Monta o prompt enviado ao agente: preâmbulo com as regras de separação +
 * contexto da simulação (quando houver) + a pergunta do usuário.
 */
export function buildAgentPrompt(
  contextBlock: string,
  userMessage: string,
): string {
  const preamble = [
    "Você é um assistente de comércio exterior apoiando o OmegaSync, um motor",
    "determinístico de elegibilidade e comparação de rotas aduaneiras no Porto",
    "de Santos. Regras obrigatórias:",
    "1. NÃO altere nem contradiga o resultado calculado pelo OmegaSync abaixo.",
    "2. NÃO invente dados ausentes (tarifas, prazos, anuência, disponibilidade).",
    "3. Separe claramente o RESULTADO do motor da sua ORIENTAÇÃO externa.",
    "4. Se não houver informação suficiente, diga isso explicitamente.",
    "5. Responda em português (pt-BR), de forma curta, técnica e operacional.",
  ].join(" ");

  const context =
    contextBlock.trim() !== ""
      ? contextBlock
      : "OMEGASYNC_RESULT: nenhuma simulação ativa foi fornecida.";

  return `${preamble}\n\n${context}\n\nUSER_QUESTION:\n${userMessage}`;
}
