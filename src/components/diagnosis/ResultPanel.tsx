import { CheckCircle2, CircleHelp, XCircle } from "lucide-react";

import type { SimulationResponseDTO } from "@/lib/api";
import {
  anuenciaLabel,
  applicabilityLabel,
  clearanceLabel,
  eligibilityLabel,
  formatCostTotal,
  formatKnownSubtotal,
  presenceLabel,
  windowLabel,
} from "@/lib/ui/format";
import styles from "./diagnosis.module.css";

function badgeClass(kind: "ok" | "blocked" | "pending"): string {
  if (kind === "ok") return `${styles.badge} ${styles.badgeOk}`;
  if (kind === "blocked") return `${styles.badge} ${styles.badgeBlocked}`;
  return `${styles.badge} ${styles.badgePending}`;
}

function StatusBadge({
  kind,
  label,
}: {
  kind: "ok" | "blocked" | "pending";
  label: string;
}) {
  const Icon = kind === "ok" ? CheckCircle2 : kind === "blocked" ? XCircle : CircleHelp;
  return (
    <span className={badgeClass(kind)}>
      <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
      {label}
    </span>
  );
}

function eligibilityKind(status: string): "ok" | "blocked" | "pending" {
  if (status === "VIAVEL") return "ok";
  if (status === "INVIAVEL") return "blocked";
  return "pending";
}

function clearanceKind(status: string): "ok" | "blocked" | "pending" {
  if (status === "LIBERADA") return "ok";
  if (status === "BLOQUEADA") return "blocked";
  return "pending";
}

export function ResultPanel({ result }: { result: SimulationResponseDTO }) {
  return (
    <div>
      <section className={styles.resultBlock}>
        <h2>Conclusão</h2>
        <div className={styles.conclusion}>
          <div className={styles.routeHead}>
            <strong>Liberação aduaneira</strong>
            <StatusBadge
              kind={clearanceKind(result.clearance.status)}
              label={clearanceLabel(result.clearance.status)}
            />
          </div>
          <p className={styles.routeSummary}>
            Anuência: {anuenciaLabel(result.anuencia.status, result.anuencia.state)}
          </p>
          {result.clearance.reasons.length > 0 ? (
            <ul className={styles.reasons}>
              {result.clearance.reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className={styles.resultBlock}>
        <h2>Rotas</h2>
        {result.routes.length === 0 ? (
          <p className={styles.placeholder}>Nenhuma rota disponível no catálogo.</p>
        ) : null}
        {result.routes.map((route) => (
          <article key={route.routeId} className={styles.routeCard}>
            <div className={styles.routeHead}>
              <span className={styles.routeLabel}>{route.label}</span>
              <StatusBadge
                kind={eligibilityKind(route.eligibility.status)}
                label={eligibilityLabel(route.eligibility.status)}
              />
            </div>
            <p className={styles.routeSummary}>{route.eligibility.summary}</p>
            <div className={styles.costRow}>
              <span className={styles.costLabel}>Subtotal conhecido</span>
              <span>
                {formatKnownSubtotal(route.cost.knownSubtotal, route.cost.complete)}
              </span>
            </div>
            <div className={styles.costRow}>
              <span className={styles.costLabel}>Custo total</span>
              <span>{formatCostTotal(route.cost.total)}</span>
            </div>
            {route.eligibility.missingData.length > 0 ? (
              <details className={styles.disclosure} style={{ marginTop: 8 }}>
                <summary>Dados faltantes ({route.eligibility.missingData.length})</summary>
                <ul className={styles.list}>
                  {route.eligibility.missingData.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </article>
        ))}
      </section>

      <section className={styles.resultBlock}>
        <h2>Comparação</h2>
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <div className={styles.metricValue}>{result.comparison.viable.length}</div>
            <div className={styles.metricLabel}>Viáveis</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricValue}>
              {result.comparison.indeterminate.length}
            </div>
            <div className={styles.metricLabel}>Indeterminadas</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricValue}>{result.comparison.inviable.length}</div>
            <div className={styles.metricLabel}>Inviáveis</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricValue}>
              {result.comparison.lowestCostRouteId ?? "—"}
            </div>
            <div className={styles.metricLabel}>Menor custo (rota)</div>
          </div>
        </div>
      </section>

      <section className={styles.resultBlock}>
        <h2>Janela de 48h</h2>
        <p className={styles.routeSummary}>
          Aplicabilidade: {applicabilityLabel(result.window48h.applicability)} · Viabilidade:{" "}
          {windowLabel(result.window48h.viability)}
        </p>
      </section>

      <section className={styles.resultBlock}>
        <h2>Fatores comportamentais</h2>
        {result.behavioralFactors.map((factor) => (
          <div key={factor.kind} className={styles.factor}>
            <span>{factor.kind}</span>
            <span>
              {presenceLabel(factor.present)}
              {factor.tendency ? (
                <span className={styles.factorTendency}> — {factor.tendency}</span>
              ) : null}
            </span>
          </div>
        ))}
      </section>

      {result.missingData.length > 0 ? (
        <section className={styles.resultBlock}>
          <h2>Dados faltantes</h2>
          <ul className={styles.list}>
            {result.missingData.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.evidences.length > 0 ? (
        <section className={styles.resultBlock}>
          <h2>Evidências</h2>
          <details className={styles.disclosure}>
            <summary>Fontes e proveniência ({result.evidences.length})</summary>
            <ul className={styles.list} style={{ marginTop: 8 }}>
              {result.evidences.map((e, i) => (
                <li key={i}>
                  <strong>{e.originLabel}</strong>
                  {e.isPremise ? " · premissa" : ""}
                  {e.confidenceLabel ? ` · ${e.confidenceLabel}` : ""}
                  {e.reference ? ` — ${e.reference}` : ""}
                  {e.source ? (
                    <div className={styles.factorTendency}>
                      {e.source.title} · {e.source.publisher}
                      {e.source.effectiveFrom
                        ? ` · vigência ${e.source.effectiveFrom}`
                        : e.source.accessedAt
                          ? ` · acesso ${e.source.accessedAt}`
                          : ""}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>
        </section>
      ) : null}
    </div>
  );
}
