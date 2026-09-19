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

Última atualização: 2026-09-19 — após a ETAPA 6.

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
| L11 | Resolução de anuência (NCM → órgão) | 3, 8 | Não modelada; motor trata anuência como entrada opcional; `ncm-anuentes` do repo antigo estava vazio | ABERTA | Portal Único/Siscomex (FONTES §13) |
| L12 | Prazos oficiais por modalidade de anuência | 8 | Não hardcodados | ABERTA | Fonte primária (FONTES §14) |
| L13 | Mínimos de armazenagem (DP World/Ecoporto) | 4 | Não documentados → `minimumValue: null` (não zero) | ABERTA | Tabelas dos terminais |
| L14 | Fração de carga anuente em Santos; canal pós-DUIMP específico de Santos | — | Não usados como probabilidade individual | ABERTA | Estatística oficial (FONTES §24) |
| L15 | SSE — situação não pacificada | 5 | `sseAtivo = false` por padrão; OFF → componente NOT_APPLICABLE | EM USO COMO PREMISSA | STJ/TCU/Cade (FONTES §20) |

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

---

## 3. Histórico de atualizações

- **2026-09-19 — ETAPA 6:** criação do arquivo consolidando lacunas L01–L15 e
  pontos de review R01–R15 das ETAPAS 1 a 6.
