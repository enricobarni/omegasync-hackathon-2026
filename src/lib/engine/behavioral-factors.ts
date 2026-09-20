/**
 * Fatores comportamentais (ETAPA 3 + rodada de correção).
 *
 * O PLANEJAMENTO.md exige separar "restrição que inviabiliza uma rota"
 * (motor de elegibilidade) de "fator comportamental que torna outra rota
 * mais provável". Este módulo trata apenas dos fatores comportamentais.
 *
 * Regra dura (FONTES.md §22, AGENTS.md): estas evidências de pesquisa NÃO são
 * probabilidades nem pesos universais. São sinais rotulados como pesquisa de
 * campo, que NUNCA bloqueiam uma rota — apenas indicam tendência.
 *
 * AJUSTE 3.7/12.10: o estado do fator é uma união discriminada explícita
 * (PRESENT/ABSENT/NOT_APPLICABLE/UNKNOWN), sem reusar `false`/`null` para
 * significados diferentes.
 */

import type { Cargo, Evidence, ResolvedAnuencia, TrackedValue } from "../domain";
import { createEvidence, isKnown } from "../domain";

export const BEHAVIORAL_FACTOR_KINDS = [
  "CAIXA",
  "ESTRUTURA",
  "ANUENCIA",
  "CANAL",
  "JANELA_48H",
] as const;
export type BehavioralFactorKind = (typeof BEHAVIORAL_FACTOR_KINDS)[number];

export const BEHAVIORAL_STATES = [
  "PRESENT",
  "ABSENT",
  "NOT_APPLICABLE",
  "UNKNOWN",
] as const;
export type BehavioralState = (typeof BEHAVIORAL_STATES)[number];

export interface BehavioralFactor {
  kind: BehavioralFactorKind;
  state: BehavioralState;
  detail: string;
  /** Tendência sugerida quando o fator está presente. */
  tendency?: string;
  evidence: Evidence;
}

// Evidências de campo, reaproveitadas verbatim de FONTES.md §22.
const EVID_ESTRUTURA: Evidence = createEvidence("PESQUISA_CAMPO", {
  reference:
    "ESTRUTURA: 9 de 17 respostas apontaram falta de estrutura como bloqueio dominante (FONTES.md §22)",
  confidence: "C",
});

const EVID_CAIXA: Evidence = createEvidence("PESQUISA_CAMPO", {
  reference:
    "CAIXA: fluxo de caixa apontado como fator principal por uma fonte institucional, N=1 (FONTES.md §22)",
  confidence: "N1",
});

const EVID_ANUENCIA: Evidence = createEvidence("PESQUISA_CAMPO", {
  reference:
    "ANUÊNCIA (E38): carga sujeita a anuência tende ao retroporto devido ao free time maior (FONTES.md §22)",
  confidence: "N1",
});

const EVID_JANELA: Evidence = createEvidence("PESQUISA_CAMPO", {
  reference:
    "JANELA_48H (E28/E31): perda da janela gerou custo adicional não capturado e reagendamento por veículo, N=1 (FONTES.md §22)",
  confidence: "N1",
});

/**
 * Contexto operacional para os fatores comportamentais. Todos os sinais
 * operacionais são rastreáveis e podem ser desconhecidos (unknown != false).
 */
export interface BehavioralContext {
  cargo: Cargo;
  anuencia?: ResolvedAnuencia;
  possuiCaixaParaAntecipacao?: TrackedValue<boolean>;
  possuiEstruturaSincronizada?: TrackedValue<boolean>;
  janela48hViavel?: TrackedValue<boolean>;
}

/**
 * Presença do fator (bloqueio) a partir de uma condição POSITIVA: o fator está
 * PRESENT quando a condição positiva é falsa, ABSENT quando verdadeira e
 * UNKNOWN quando não informada. `false` e `unknown` nunca são confundidos.
 */
function stateFromPositive(
  flag: TrackedValue<boolean> | undefined,
): BehavioralState {
  if (!flag || !isKnown(flag)) {
    return "UNKNOWN";
  }
  return flag.value ? "ABSENT" : "PRESENT";
}

function factorCaixa(ctx: BehavioralContext): BehavioralFactor {
  // OEA Excelência: a restrição de caixa NÃO SE APLICA (distinto de ausente).
  if (ctx.cargo.oeaStatus === "EXCELENCIA") {
    return {
      kind: "CAIXA",
      state: "NOT_APPLICABLE",
      detail:
        "Importador OEA Excelência: restrição de caixa para antecipação não se aplica.",
      evidence: EVID_CAIXA,
    };
  }

  const state = stateFromPositive(ctx.possuiCaixaParaAntecipacao);
  return {
    kind: "CAIXA",
    state,
    detail:
      state === "UNKNOWN"
        ? "Condição de caixa para antecipação não informada."
        : state === "PRESENT"
          ? "Sem caixa para antecipação tributária."
          : "Há caixa para antecipação tributária.",
    tendency:
      state === "PRESENT"
        ? "Restrição de caixa favorece permanência/uso de recinto."
        : undefined,
    evidence: EVID_CAIXA,
  };
}

function factorEstrutura(ctx: BehavioralContext): BehavioralFactor {
  const state = stateFromPositive(ctx.possuiEstruturaSincronizada);
  return {
    kind: "ESTRUTURA",
    state,
    detail:
      state === "UNKNOWN"
        ? "Estrutura logística sincronizada não informada."
        : state === "PRESENT"
          ? "Sem estrutura logística sincronizada para retirada direta."
          : "Há estrutura logística sincronizada.",
    tendency:
      state === "PRESENT"
        ? "Falta de estrutura favorece o uso de recinto/retroporto."
        : undefined,
    evidence: EVID_ESTRUTURA,
  };
}

function factorAnuencia(ctx: BehavioralContext): BehavioralFactor {
  if (!ctx.anuencia) {
    return {
      kind: "ANUENCIA",
      state: "UNKNOWN",
      detail: "Anuência não resolvida.",
      evidence: EVID_ANUENCIA,
    };
  }

  const present = ctx.anuencia.state === "NAO_AUTOMATICA_POSTERIOR";
  return {
    kind: "ANUENCIA",
    state: present ? "PRESENT" : "ABSENT",
    detail: present
      ? "Anuência não automática posterior."
      : `Estado de anuência: ${ctx.anuencia.state}.`,
    tendency: present
      ? "Anuência não automática tende ao retroporto pelo free time maior."
      : undefined,
    evidence: EVID_ANUENCIA,
  };
}

function factorCanal(ctx: BehavioralContext): BehavioralFactor {
  const canal = ctx.cargo.channel;
  const evidence = createEvidence("USUARIO", {
    reference: `Canal aduaneiro informado: ${canal}`,
  });

  if (canal === "NAO_REVELADO") {
    return {
      kind: "CANAL",
      state: "UNKNOWN",
      detail: "Canal aduaneiro ainda não revelado.",
      evidence,
    };
  }

  const present = canal !== "VERDE";
  return {
    kind: "CANAL",
    state: present ? "PRESENT" : "ABSENT",
    detail: present
      ? `Canal ${canal} exige conferência aduaneira.`
      : "Canal verde.",
    tendency: present
      ? "Canal não verde prolonga a permanência e favorece o uso de recinto."
      : undefined,
    evidence,
  };
}

function factorJanela(ctx: BehavioralContext): BehavioralFactor {
  const state = stateFromPositive(ctx.janela48hViavel);
  return {
    kind: "JANELA_48H",
    state,
    detail:
      state === "UNKNOWN"
        ? "Viabilidade da janela de 48h não informada."
        : state === "PRESENT"
          ? "Janela de 48h comprometida."
          : "Janela de 48h viável.",
    tendency:
      state === "PRESENT"
        ? "Janela comprometida favorece armazenagem/uso de recinto."
        : undefined,
    evidence: EVID_JANELA,
  };
}

/**
 * Avalia os fatores comportamentais do contexto. Retorna sinais rotulados,
 * nunca decisões de viabilidade.
 */
export function assessBehavioralFactors(
  ctx: BehavioralContext,
): BehavioralFactor[] {
  return [
    factorCaixa(ctx),
    factorEstrutura(ctx),
    factorAnuencia(ctx),
    factorCanal(ctx),
    factorJanela(ctx),
  ];
}
