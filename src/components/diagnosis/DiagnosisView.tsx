"use client";

import { useState } from "react";

import { CARGO_TYPES, CUSTOMS_CHANNELS, OEA_STATUSES } from "@/lib/domain";
import type { SimulationResponseDTO } from "@/lib/api";
import { ResultPanel } from "./ResultPanel";
import styles from "./diagnosis.module.css";

type UiState = "IDLE" | "SUBMITTING" | "RESULT" | "ERROR";
type TriState = "" | "true" | "false";

const TRI_OPTIONS: { value: TriState; label: string }[] = [
  { value: "", label: "Não informado" },
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
];

function triToBool(value: TriState): boolean | undefined {
  return value === "" ? undefined : value === "true";
}

// Labels pt-BR para enums internos (AJUSTE 12.11).
const CARGO_TYPE_LABELS: Record<string, string> = { FCL: "FCL (contêiner completo)", LCL: "LCL (carga consolidada)" };
const OEA_LABELS: Record<string, string> = {
  NAO_OEA: "Não OEA",
  ESSENCIAL: "OEA Essencial",
  QUALIFICADO: "OEA Qualificado",
  EXCELENCIA: "OEA Excelência",
};
const CHANNEL_LABELS: Record<string, string> = {
  NAO_REVELADO: "Não revelado",
  VERDE: "Verde",
  AMARELO: "Amarelo",
  VERMELHO: "Vermelho",
  CINZA: "Cinza",
};

export function DiagnosisView() {
  const [ncm, setNcm] = useState("");
  const [cargoType, setCargoType] = useState<string>(CARGO_TYPES[0]);
  // OEA sem default: ausência de escolha não vira NAO_OEA (AJUSTE 12.3).
  const [oeaStatus, setOeaStatus] = useState<string>("");
  const [channel, setChannel] = useState<string>(CUSTOMS_CHANNELS[0]);
  const [cif, setCif] = useState("");

  const [necessitaEntrepostagem, setNecessitaEntrepostagem] = useState<TriState>("");
  const [cargoYardWithdrawal, setCargoYardWithdrawal] = useState<TriState>("");
  const [facilityDiscriminated, setFacilityDiscriminated] = useState<TriState>("");
  const [possuiCaixa, setPossuiCaixa] = useState<TriState>("");
  const [possuiEstruturaSincronizada, setPossuiEstrutura] = useState<TriState>("");

  const [uiState, setUiState] = useState<UiState>("IDLE");
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{ ncm?: string; oeaStatus?: string }>({});
  const [result, setResult] = useState<SimulationResponseDTO | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Validação por campo com aria-invalid (AJUSTE 12.7).
    const nextFieldErrors: { ncm?: string; oeaStatus?: string } = {};
    if (!/^\d{8}$/.test(ncm)) {
      nextFieldErrors.ncm = "NCM deve ter 8 dígitos numéricos.";
    }
    if (oeaStatus === "") {
      nextFieldErrors.oeaStatus = "Selecione o status OEA.";
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      setUiState("ERROR");
      setErrors(["Corrija os campos destacados."]);
      return;
    }

    setUiState("SUBMITTING");
    setErrors([]);

    const payload: Record<string, unknown> = {
      cargo: {
        ncm,
        cargoType,
        oeaStatus,
        channel,
        ...(cif.trim() !== "" ? { cif: Number(cif) } : {}),
      },
      operation: {
        necessitaEntrepostagem: triToBool(necessitaEntrepostagem),
        cargoYardWithdrawal: triToBool(cargoYardWithdrawal),
        facilityDiscriminatedInSchedule: triToBool(facilityDiscriminated),
        possuiCaixaParaAntecipacao: triToBool(possuiCaixa),
        possuiEstruturaSincronizada: triToBool(possuiEstruturaSincronizada),
      },
    };

    try {
      const response = await fetch("/api/simulations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(Array.isArray(data?.errors) ? data.errors : ["Erro na simulação."]);
        setUiState("ERROR");
        return;
      }
      setResult(data as SimulationResponseDTO);
      setUiState("RESULT");
    } catch {
      setErrors(["Falha de comunicação com o serviço de simulação."]);
      setUiState("ERROR");
    }
  }

  return (
    <div className={styles.layout}>
      <form onSubmit={onSubmit} aria-label="Dados da operação">
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Dados da carga</p>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ncm">
                NCM (8 dígitos)
              </label>
              <input
                id="ncm"
                className={styles.input}
                inputMode="numeric"
                value={ncm}
                onChange={(e) => setNcm(e.target.value)}
                placeholder="84713012"
                aria-invalid={fieldErrors.ncm ? true : undefined}
                aria-describedby={fieldErrors.ncm ? "ncm-error" : undefined}
                required
              />
              {fieldErrors.ncm ? (
                <span id="ncm-error" className={styles.fieldError} role="alert">
                  {fieldErrors.ncm}
                </span>
              ) : null}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cif">
                CIF (BRL, opcional)
              </label>
              <input
                id="cif"
                className={styles.input}
                inputMode="decimal"
                value={cif}
                onChange={(e) => setCif(e.target.value)}
                placeholder="100000"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cargoType">
                Tipo de carga
              </label>
              <select
                id="cargoType"
                className={styles.select}
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
              >
                {CARGO_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CARGO_TYPE_LABELS[t] ?? t}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="oeaStatus">
                Status OEA
              </label>
              <select
                id="oeaStatus"
                className={styles.select}
                value={oeaStatus}
                onChange={(e) => setOeaStatus(e.target.value)}
                aria-invalid={fieldErrors.oeaStatus ? true : undefined}
                aria-describedby={fieldErrors.oeaStatus ? "oea-error" : undefined}
              >
                <option value="">Selecione…</option>
                {OEA_STATUSES.map((t) => (
                  <option key={t} value={t}>
                    {OEA_LABELS[t] ?? t}
                  </option>
                ))}
              </select>
              {fieldErrors.oeaStatus ? (
                <span id="oea-error" className={styles.fieldError} role="alert">
                  {fieldErrors.oeaStatus}
                </span>
              ) : null}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="channel">
                Canal aduaneiro
              </label>
              <select
                id="channel"
                className={styles.select}
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                {CUSTOMS_CHANNELS.map((t) => (
                  <option key={t} value={t}>
                    {CHANNEL_LABELS[t] ?? t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Condições operacionais</p>
          <div className={styles.grid2}>
            <TriField
              id="entrepostagem"
              label="Necessita entrepostagem?"
              value={necessitaEntrepostagem}
              onChange={setNecessitaEntrepostagem}
            />
            <TriField
              id="cargaPatio"
              label="É operação de carga-pátio (retirada direta)?"
              value={cargoYardWithdrawal}
              onChange={setCargoYardWithdrawal}
            />
            <TriField
              id="recintoDiscriminado"
              label="Recinto discriminado no agendamento?"
              value={facilityDiscriminated}
              onChange={setFacilityDiscriminated}
            />
            <TriField
              id="caixa"
              label="Possui caixa para antecipação?"
              value={possuiCaixa}
              onChange={setPossuiCaixa}
            />
            <TriField
              id="estrutura"
              label="Estrutura sincronizada?"
              value={possuiEstruturaSincronizada}
              onChange={setPossuiEstrutura}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={uiState === "SUBMITTING"}
          >
            {uiState === "SUBMITTING" ? "Simulando…" : "Simular operação"}
          </button>
        </div>
      </form>

      <div className={styles.resultColumn} aria-live="polite">
        {uiState === "IDLE" ? (
          <p className={styles.placeholder}>
            Preencha os dados da carga e execute a simulação para ver o
            diagnóstico das rotas.
          </p>
        ) : null}

        {uiState === "SUBMITTING" ? (
          <p className={styles.placeholder}>Processando diagnóstico…</p>
        ) : null}

        {uiState === "ERROR" ? (
          <div className={styles.errorBox} role="alert">
            Não foi possível concluir a simulação.
            <ul>
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {uiState === "RESULT" && result ? <ResultPanel result={result} /> : null}
      </div>
    </div>
  );
}

function TriField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: TriState;
  onChange: (value: TriState) => void;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value as TriState)}
      >
        {TRI_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
