/**
 * Fatores comportamentais (ETAPA 3 — separação obrigatória).
 *
 * O PLANEJAMENTO.md exige separar "restrição que inviabiliza uma rota"
 * (motor de elegibilidade) de "fator comportamental que torna outra rota
 * mais provável". Este módulo trata apenas dos fatores comportamentais.
 *
 * Regra dura (FONTES.md §22, AGENTS.md): estas evidências de pesquisa NÃO são
 * probabilidades nem pesos universais. São sinais rotulados como pesquisa de
 * campo, que NUNCA bloqueiam uma rota — apenas indicam tendência. A decisão
 * de viabilidade permanece no motor de elegibilidade.
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

/** Presença do fator: true (presente), false (ausente) ou null (desconhecido). */
export interface BehavioralFactor {
  kind: BehavioralFactorKind;
  present: boolean | null;
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

function presenceFromNegative(
  flag: TrackedValue<boolean> | undefined,
): boolean | null {
  // O fator (bloqueio) está presente quando a condição positiva é FALSA.
  if (!flag || !isKnown(flag)) {
    return null;
  }
  return flag.value === false;
}

function factorCaixa(ctx: BehavioralContext): BehavioralFactor {
  // OEA Excelência dispensa a antecipação; senão depende de caixa.
  if (ctx.cargo.oeaStatus === "EXCELENCIA") {
    return {
      kind: "CAIXA",
      present: false,
      detail:
        "Importador OEA Excelência: restrição de caixa para antecipação não se aplica.",
      evidence: EVID_CAIXA,
    };
  }

  const present = presenceFromNegative(ctx.possuiCaixaParaAntecipacao);
  return {
    kind: "CAIXA",
    present,
    detail:
      present === null
        ? "Condição de caixa para antecipação não informada."
        : present
          ? "Sem caixa para antecipação tributária."
          : "Há caixa para antecipação tributária.",
    tendency: present
      ? "Restrição de caixa favorece permanência/uso de recinto."
      : undefined,
    evidence: EVID_CAIXA,
  };
}

function factorEstrutura(ctx: BehavioralContext): BehavioralFactor {
  const present = presenceFromNegative(ctx.possuiEstruturaSincronizada);
  return {
    kind: "ESTRUTURA",
    present,
    detail:
      present === null
        ? "Estrutura logística sincronizada não informada."
        : present
          ? "Sem estrutura logística sincronizada para retirada direta."
          : "Há estrutura logística sincronizada.",
    tendency: present
      ? "Falta de estrutura favorece o uso de recinto/retroporto."
      : undefined,
    evidence: EVID_ESTRUTURA,
  };
}

function factorAnuencia(ctx: BehavioralContext): BehavioralFactor {
  if (!ctx.anuencia) {
    return {
      kind: "ANUENCIA",
      present: null,
      detail: "Anuência não resolvida.",
      evidence: EVID_ANUENCIA,
    };
  }

  const present = ctx.anuencia.state === "NAO_AUTOMATICA_POSTERIOR";
  return {
    kind: "ANUENCIA",
    present,
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
      present: null,
      detail: "Canal aduaneiro ainda não revelado.",
      evidence,
    };
  }

  const present = canal !== "VERDE";
  return {
    kind: "CANAL",
    present,
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
  const present = presenceFromNegative(ctx.janela48hViavel);
  return {
    kind: "JANELA_48H",
    present,
    detail:
      present === null
        ? "Viabilidade da janela de 48h não informada."
        : present
          ? "Janela de 48h comprometida."
          : "Janela de 48h viável.",
    tendency: present
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
