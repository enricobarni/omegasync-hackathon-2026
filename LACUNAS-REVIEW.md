# OmegaSync — Lacunas e Pontos de Review

> **Objetivo deste arquivo:** registrar, de forma acumulada, todas as **lacunas
> de dados/fonte** e os **pontos de review/decisão** encontrados durante o
> desenvolvimento, etapa a etapa.
>
> **Manutenção:** este arquivo deve ser atualizado a cada etapa concluída
> (ver `PLANEJAMENTO.md`). Cada lacuna traz o tratamento atual e a fonte a
> confirmar; cada ponto de review traz a decisão tomada e o que depende do
> usuário.
>
> Convenções de estado:
> `ABERTA` (pendente) · `EM USO COMO PREMISSA` · `MITIGADA` · `RESOLVIDA`.

Última atualização: 2026-09-19 — após a ETAPA 12.

---

## 1. Lacunas de dados / fonte

Baseadas em `FONTES.md` §24 e nas decisões de cada etapa. Nada aqui foi
inventado: valores ausentes permanecem `null`/desconhecidos ou premissas
explícitas.

| # | Lacuna | Etapa | Tratamento atual | Estado | Fonte a confirmar |
|---|--------|-------|------------------|--------|-------------------|
| L01 | Tarifa correta do Tecon Santos (Descarga Direta Santos Brasil pode ser de Imbituba/SC) | 4 | Mantida como baseline histórico, confiança **C**, ressalva de Imbituba viaja junto | EM USO COMO PREMISSA | Tabela oficial Santos Brasil/Tecon Santos (FONTES §3.1) |
| L02 | Tabela consolidada da BTP (2º período e subsequentes; 1º só faixa 0,65–0,90%) | 4 | Registro `consolidated: false`, alíquotas `null`, faixa em ressalva; não usado em cálculo | ABERTA | Tabela exata BTP (FONTES §6) |
| L03 | Custo real por km (transporte) | 5 | Premissa explícita (`PREMISSA_SIMULACAO`); ausente → componente UNKNOWN | EM USO COMO PREMISSA | Coleta/integração (FONTES §7.3/§24) |
| L04 | Taxa de custo de capital da antecipação | 5 | Premissa explícita; ausente → componente UNKNOWN | EM USO COMO PREMISSA | Definição de taxa (FONTES §7.4/§24) |
| L05 | Custo e tempo reais de DTA | 2, 5 | Rota-modelo com DTA `REQUIRED` (premissa §17); custo/tempo desconhecidos | ABERTA | Manual de Trânsito Aduaneiro / coleta (FONTES §17/§24) |
| L06 | Custos de movimentação, capatazia, anuência, tempo parado | 5 | Sem fórmula/fonte: só entram se o chamador fornecer explicitamente | ABERTA | Coleta operacional (FONTES §24) |
| L07 | Recintos reais de Zona Secundária / retroporto | 2 | Recinto genérico de premissa (mentoria) para expressar a rota entre zonas | EM USO COMO PREMISSA | Recintos reais habilitados (FONTES §18/§19) |
| L08 | Disponibilidade real de recinto/rota | 2, 3 | Mantida `UNKNOWN`; nunca inventada | ABERTA | Fonte dinâmica de disponibilidade (FONTES §24) |
| L09 | Distâncias reais das rotas | 2 | `distanceKm` desconhecida na rota-modelo | ABERTA | Coleta/geodados |
| L10 | Tipos de carga aceitos por recinto/rota | 2 | `acceptedCargoTypes` vazio; comparação não assume aceitação | ABERTA | Fonte operacional do recinto |
| L11 | Resolução de anuência (NCM → órgão) | 3, 8 | Mecanismo `resolveAnuenciaByNcm` + registro **vazio** (não inventado); sem entrada → NOT_FOUND | ABERTA | Portal Único/Siscomex (FONTES §13) |
| L12 | Prazos oficiais por modalidade de anuência | 8 | Expostos como **estimativa de pesquisa** (confiança C) com caveat "não SLA oficial"; não hardcodados como oficiais | EM USO COMO PREMISSA | Fonte primária (FONTES §14) |
| L18 | Atributos do tratamento administrativo além da NCM | 8 | Campo `requiredAttributes` previsto no registro; NCM sozinha não determina órgão (FONTES §13.5) | ABERTA | Portal Único/Siscomex |
| L19 | Mapeamento rota → tarifa/distância/prazo na simulação | 9 | O serviço recebe `routeCostComponents` do chamador; sem custo informado → componente UNKNOWN (total null, nunca zero) | ABERTA | Catálogo real + tarifas (ETAPAs 2/4) |
| L20 | Cliente HTTP real do Logcomex (endpoint + credenciais) | 11 | Só a porta `DocumentAnalysisPort` + adapter puro + fallback; sem chamada de rede no núcleo, sem segredos versionados | ABERTA | Endpoint/credenciais via variável de ambiente (borda) |
| L21 | Parsing de números em locale (ex.: "1.234,56") do Logcomex | 11 | `parseNumber` não adivinha locale: string não numérica → desconhecido | ABERTA | Confirmar formato real do provedor |
| L22 | Painel de evidências detalhado (fonte/confiança/vigência) na UI | 12 | A resposta da API expõe motivos/faltantes/tendências, mas não o array de evidências completo (DESIGN §19) | ABERTA | Estender `SimulationResponseDTO` com evidências (ETAPA 16) |
| L13 | Mínimos de armazenagem (DP World/Ecoporto) | 4 | Não documentados → `minimumValue: null` (não zero) | ABERTA | Tabelas dos terminais |
| L14 | Fração de carga anuente em Santos; canal pós-DUIMP específico de Santos | — | Não usados como probabilidade individual | ABERTA | Estatística oficial (FONTES §24) |
| L15 | SSE — situação não pacificada | 5 | `sseAtivo = false` por padrão; OFF → componente NOT_APPLICABLE | EM USO COMO PREMISSA | STJ/TCU/Cade (FONTES §20) |
| L16 | Custo real da perda da janela de 48h (no-show) | 7 | Não modelado como valor; só consequência textual + evidência de campo E28/E31 (N=1), sem tarifa fictícia | ABERTA | Coleta operacional (FONTES §16) |
| L17 | Vínculo dos inputs operacionais da janela (carga-pátio? recinto discriminado? retirada em 48h?) a dados reais | 7 | `assessWindow48h` recebe sinais rastreáveis; ausentes → INDETERMINADO, nunca assumidos | ABERTA | Agendamento/operação (FONTES §15) |

---

## 2. Pontos de review / decisões por etapa

Decisões que valem confirmação do usuário ou que representam trade-offs.

### ETAPA 1 — Fundação do domínio
- **R01 — Dependência de teste adicionada:** incluído `vitest` (devDependency) e
  ajustado `@types/node` de `^20` para `^24` (runtime Node 24 + peer do vitest).
  *Motivo:* não havia runner e o DoD exige `npm run test`; é o runner do repo de
  referência. **Estado:** aceito na prática (etapas seguintes usam).
- **R02 — Modelo de estado de informação:** introduzida união
  `KNOWN | UNKNOWN | NOT_APPLICABLE` (evolução do `T | null` antigo), base de
  todo o `unknown != zero`.

### ETAPA 2 — Catálogo de rotas e recintos
- **R03 — Recinto de Zona Secundária genérico:** criado como **premissa da
  mentoria** para viabilizar a rota entre zonas (FONTES não nomeia recinto de ZS
  com fonte). **Depende do usuário:** substituir por recinto real (ver L07) ou
  optar por não trazer rota-modelo até haver fonte.
- **R04 — Ecoporto fora do catálogo:** não incluído como recinto por classificação
  de zona/tipo incerta em FONTES (sua tarifa é usada na ETAPA 4).
- **R05 — DTA da rota-modelo `REQUIRED`:** modelada como premissa ancorada no
  conceito oficial de trânsito aduaneiro (FONTES §17), não como número.

### ETAPA 3 — Motor de elegibilidade
- **R06 — Separação restrição × comportamento:** viabilidade só considera
  restrições duras; caixa/estrutura/canal/janela ficam em
  `behavioral-factors.ts` (não bloqueiam), como exige o PLANEJAMENTO.
- **R07 — Semântica de rota ausente:** não há distinção "retirada direta" vs
  "via recinto" nas rotas, então canal/janela **não** foram aplicados como
  bloqueio por rota. **Futuro:** se rotas ganharem esse tipo operacional, o motor
  pode passar a aplicá-los como restrição.
- **R08 — Pureza do motor:** recebe `Route[]` do domínio; não importa o catálogo.

### ETAPA 4 — Dados tarifários
- **R09 — Confiança das tabelas:** DP World/Ecoporto marcados **A** ("tabela
  pública datada", FONTES §2). **Atenção/alinhar:** o `SourceReference` do
  **catálogo** (ETAPA 2) usa **B** para os mesmos terminais (fins de recinto).
  São objetos distintos por camada; alinhar se desejado. **Estado:** ABERTA (a
  alinhar).
- **R10 — Correções sobre o repo antigo:** dataset agora guarda proveniência
  completa (não só alíquotas); Descarga Direta Santos Brasil rebaixada de "A"
  (erro antigo) para **C** com ressalva.

### ETAPA 5 — Motor de custos por rota
- **R11 — Pureza vs integração tarifária:** o motor de custos importa **apenas o
  domínio**; a ligação tarifa→motor fica para a aplicação (ETAPA 9). Um teste de
  integração prova o encaixe (DP World consolidado; BTP não consolidado → UNKNOWN).
- **R12 — Correção de teste:** uma expectativa de teste tinha aritmética errada
  (custo de capital 166,67, não 1.666,67); o motor estava correto. **Estado:**
  RESOLVIDA.

### ETAPA 6 — Comparador de rotas
- **R13 — "Rotas indisponíveis":** disponibilidade `UNAVAILABLE` já vira
  `INVIAVEL` na ETAPA 3, então rotas indisponíveis caem no bucket `inviable`.
  **Depende do usuário:** criar lista dedicada de indisponíveis, se desejado.
- **R14 — Sem score arbitrário:** comparação só por dimensões comparáveis
  (custo total completo, distância, prazo), reportando o que ficou de fora.
- **R15 — Orquestração pendente:** o comparador recebe candidatos já montados; a
  junção ETAPA 3 + ETAPA 5 + rota do catálogo é do serviço de simulação (ETAPA 9).

### ETAPA 7 — Regra de 48h
- **R16 — Aplicabilidade antes de viabilidade:** `assessWindow48h` decide
  primeiro APLICAVEL/NAO_APLICAVEL/INDETERMINADO e só então avalia a viabilidade,
  como exige o PLANEJAMENTO — a regra não é universal.
- **R17 — Inputs operacionais dependem da aplicação:** carga-pátio, recinto
  discriminado no agendamento e retirada dentro das 48h são sinais rastreáveis
  fornecidos pelo contexto (ETAPA 9). Ausentes → INDETERMINADO (ver L17).
  Relaciona-se ao fator comportamental `JANELA_48H` da ETAPA 3 (R07): a janela
  agora tem avaliação própria, sourced, que a aplicação pode usar para alimentar
  aquele fator.
- **R18 — Sem tarifa de no-show:** a perda da janela expõe apenas a consequência
  regulatória (perde status de carga-pátio) e evidência de campo E28/E31; nenhum
  valor monetário foi inventado (ver L16, FONTES §16).

### ETAPA 8 — Tratamento administrativo / anuência
- **R19 — Descoberta central codificada:** `assessClearance` combina canal +
  anuência e deixa explícito que **canal verde não basta**: verde com anuência
  não resolvida → INDETERMINADA; verde com anuência não automática posterior →
  PENDENTE; anuência impeditiva/prévia → BLOQUEADA independentemente do canal.
- **R20 — Registro NCM → órgão vazio:** `ANUENCIA_REGISTRY_BASELINE = []`; sem
  fonte, `resolveAnuenciaByNcm` retorna NOT_FOUND. Nada inventado (ver L11/L18).
- **R21 — Prazos como estimativa, não SLA:** `getAnuenciaDeadlineEstimate`
  retorna valores de pesquisa (confiança C) com caveat explícito; nunca tratados
  como prazo oficial (ver L12).
- **R22 — Placement:** módulo em `src/lib/customs/` (regras administrativas +
  registro de dados), consumido pela aplicação (ETAPA 9), que resolve a anuência
  antes de alimentar o motor de elegibilidade (ETAPA 3).

### ETAPA 9 — Serviço de simulação
- **R23 — Orquestração pura:** `runSimulation` só encadeia módulos
  (enriquecimento → liberação → elegibilidade → custo → comparação → janela →
  evidências). Nenhuma regra de negócio nova na aplicação; resolve os seams
  deixados em R08/R11/R15/R22.
- **R24 — Custo não informado ≠ zero:** rota sem `routeCostComponents` recebe um
  componente UNKNOWN explícito ("Custo não informado"), tornando o total `null`
  em vez de 0 (ver L19). Decisão da aplicação, não do domínio.
- **R25 — Entrada já normalizada:** o serviço assume domínio normalizado; a
  validação/normalização de entrada crua e a integração Logcomex ficam para as
  ETAPAs 10/11. O mapeamento rota→tarifa também é responsabilidade do chamador
  (ver L19), para não inventar tarifa/distância por rota.

### ETAPA 10 — API de simulação
- **R26 — Handler fino + DTOs separados:** `POST /api/simulations` só valida,
  normaliza, chama `runSimulation` e retorna HTTP; DTOs públicos em `src/lib/api`
  separados do domínio. Nenhuma regra duplicada.
- **R27 — Validação de NCM na borda:** NCM exigido como 8 dígitos numéricos
  (formato oficial), enums e CIF validados; erros → HTTP 400 com lista. CIF
  ausente → desconhecido (não zero).
- **R28 — Rotas e custo na API:** o handler usa `BASELINE_CATALOG.routes` e não
  recebe custo do cliente nesta etapa → custo por rota fica UNKNOWN (ver L19).
  Enriquecimento tarifário/Logcomex e envio de premissas via API são evolução
  posterior (ETAPA 11+).
- **R29 — Config de teste:** adicionado `vitest.config.mts` resolvendo o alias
  `@` para `src`, permitindo testar o Route Handler. Sem impacto em runtime.

### ETAPA 11 — Logcomex: análise documental
- **R30 — DTOs do provedor fora do domínio:** o schema Logcomex (FONTES §25)
  vive em `src/lib/logcomex`; o domínio nunca depende dele. Adapter puro
  converte DTO → enriquecimento com proveniência LOGCOMEX (ver R25/R08).
- **R31 — `ncm_sugerido != ncm_confirmado` no tipo:** `buildCargoFromEnrichment`
  exige `confirmedNcm` do usuário; a sugestão do Logcomex nunca vira a NCM
  confirmada da carga. Logcomex enriquece, não decide rota.
- **R32 — Ausência preservada:** campos faltantes viram desconhecido; risco/
  resumo ficam como texto (sem inferir fato estruturado). Fallback offline
  mantém tudo desconhecido (ver L20).
- **R33 — CIF derivado:** `deriveCif` = FOB+frete+seguro (Incoterms) só quando os
  três são conhecidos; caso contrário desconhecido. Definição, não invenção.

### ETAPA 12 — Frontend do diagnóstico
- **R34 — UI só consome a API:** o React não replica regra; o formulário chama
  `POST /api/simulations` e renderiza o DTO. Nenhuma decisão no cliente.
- **R35 — Dependência lucide-react:** adicionada para ícones lineares (DESIGN
  §31, strokeWidth ~1.5). Necessidade concreta do guia visual.
- **R36 — Home = diagnóstico:** por prioridade do DESIGN §33, foi implementado o
  shell + diagnóstico. Module selector, storytelling e 3D ficam adiados; nav
  "Rotas"/"Carteira" aparecem como placeholders "Em breve".
- **R37 — Teste de UI via helpers puros:** cobertura por `format.ts` (puro) +
  `tsc`/`build`; não adicionei jsdom/RTL (UI presentacional, sem regra) — pode
  ser incluído se quiser testes de componente.
- **R38 — Valores desconhecidos na UI:** total `null` → "Indeterminado",
  subtotal 0 incompleto → "Sem custo conhecido"; nunca R$ 0,00 (DESIGN §18).
  Estados VIÁVEL/INVIÁVEL/INDETERMINADA usam ícone + texto + badge (não só cor).

---

## 3. Histórico de atualizações

- **2026-09-19 — ETAPA 6:** criação do arquivo consolidando lacunas L01–L15 e
  pontos de review R01–R15 das ETAPAS 1 a 6.
- **2026-09-19 — ETAPA 7:** adicionadas lacunas L16–L17 (custo de no-show e
  vínculo dos inputs da janela) e pontos de review R16–R18 (regra de 48h).
- **2026-09-19 — ETAPA 8:** atualizadas L11–L12 e adicionada L18 (atributos do
  tratamento administrativo); pontos de review R19–R22 (anuência/liberação).
- **2026-09-19 — ETAPA 9:** adicionada L19 (mapeamento rota→tarifa) e pontos de
  review R23–R25 (serviço de simulação/orquestração).
- **2026-09-19 — ETAPA 10:** pontos de review R26–R29 (API de simulação, DTOs,
  validação de borda e config de teste).
- **2026-09-19 — ETAPA 11:** adicionadas L20–L21 (cliente HTTP e parsing de
  locale do Logcomex) e pontos de review R30–R33 (análise documental).
- **2026-09-19 — ETAPA 12:** adicionada L22 (painel de evidências na UI) e
  pontos de review R34–R38 (frontend do diagnóstico).
