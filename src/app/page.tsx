import { AppShell } from "@/components/shell/AppShell";
import { DiagnosisView } from "@/components/diagnosis/DiagnosisView";

export default function Home() {
  return (
    <AppShell
      eyebrow="01 / Diagnóstico"
      title="Elegibilidade da operação."
      description="Quais rotas permanecem possíveis, com custos, restrições e dados faltantes."
      badge="Demonstração"
    >
      <DiagnosisView />
    </AppShell>
  );
}
