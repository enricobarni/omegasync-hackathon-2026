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

Última atualização: 2026-09-20 — ETAPA FINAL 5 (Freeze do protótipo).

---

## 0. Rodada final de correções (CORRECAO.md)

Estados usados aqui: `RESOLVIDA POR CÓDIGO`, `MITIGADA`,
`BLOQUEADA POR FONTE/PROVEDOR`, `EM USO COMO PREMISSA`.

### Reconciliação das decisões contestadas

- **R06 (restrição × comportamento):** o fator comportamental agora tem estado
  explícito (`PRESENT/ABSENT/NOT_APPLICABLE/UNKNOWN`) e a liberação é aplicada
  **por movimento da rota** (não é mais "sempre não bloqueante" de forma global).
  A avaliação específica por rota depende de a rota carregar `movement`.
  Estado: **MITIGADA** (extensão por rota operacional segue possível).
- **R19/R44/R45/R46/R47/R49:** ver abaixo — corrigidos nesta rodada.
- **R19 — `PREVIA_AO_EMBARQUE`:** modalidade (`state`) separada do cumprimento
  (`fulfillment`); a existência da exigência não é mais tratada como
  descumprimento. Estado: **RESOLVIDA POR CÓDIGO**.
- **R21 — prazos 10/60:** agora carregam `estimateType` (APPROXIMATE /
  UP_TO_APPROXIMATE); o ~60 dias deixou de ser classificado como pesquisa de
  campo. Estado: **RESOLVIDA POR CÓDIGO** (valor real: **BLOQUEADO POR FONTE**).
- **R33 — CIF derivado:** não é mais somado em BRL sem moeda confirmada.
  Estado: **RESOLVIDA POR CÓDIGO**; valor real **BLOQUEADO POR FONTE/PROVEDOR**.
- **R44 — Entreposto ≠ recinto:** `ENTREPOSTO_ADUANEIRO` removido de
  `FacilityType`; virou `CustomsRegime`/habilitação rastreável. A afirmação
  antiga de "já resolvido na ETAPA 1" estava incorreta. Estado: **RESOLVIDA POR
  CÓDIGO**.
- **R45/R46 — evidências:** painel global + **rastreabilidade por saída**
  implementada (cada regra de elegibilidade e a liberação carregam sua evidência
  no contrato/UI; dedupe não colapsa evidências distintas; pesquisa de campo só
  aparece quando o fator está PRESENTE; confiança da fonte chega à `EvidenceView`).
  Estado da L22: **RESOLVIDA POR CÓDIGO**.
- **R47 — resiliência Logcomex:** wrappers de timeout/fallback existem, mas a
  integração **não está ativa** (sem cliente HTTP real; timeout não cancela
  request real). Estado: infraestrutura preparada, **BLOQUEADA POR PROVEDOR**.
- **R49 — "restam apenas fontes":** **INCORRETO e removido.** Havia pendências
  de código (domínio, engine, custos, comparação, API, UI, evidência) tratadas
  nesta rodada; e ainda restam itens (rastreabilidade por saída, E2E de browser,
  vários itens MÉDIA/BAIXA e todo o backlog Logcomex dependente de contrato).

### O que foi corrigido nesta rodada (por fase)

- **FASE 1:** contratos fundamentais — `acceptedCargoTypes` rastreável e
  tri-estado; custo vazio não é completo/zero; entreposto vira regime;
  restrições com proveniência; catálogo canônico/imutável e operacional×
  simulação; fator comportamental com estado explícito; invariantes numéricas.
- **FASE 2:** anuência (modalidade×cumprimento, resolução por atributos/múltiplas
  entradas, NCM normalizada, prazos aproximados, Portal Único como serviço);
  DTA participa da elegibilidade; liberação por movimento; janela de 48h exige
  base de contagem e distingue NOT_APPLICABLE; fonte única da janela.
- **FASE 3:** completude de custo por componentes esperados; comparação com
  escopo (COMPLETE/PARTIAL/UNAVAILABLE), empates, UNKNOWN×NOT_APPLICABLE,
  validação de finitude; Descarga Direta Santos Brasil não consolidada.
- **FASE 4:** API rejeita tipos inválidos; evidência do usuário identifica o
  campo; resposta expõe distância/prazo/movimento; OEA sem default; formulário
  não pergunta a conclusão da janela; aria-invalid; foco do drawer; labels pt-BR.
- **FASE 6 (parcial):** CIF sem moeda confirmada; fallback não é fonte externa.
- **FASE 7:** CI (test/typecheck/lint/build), testes de fluxo essenciais,
  README honesto sobre Logcomex e dados.

### Pendências reais remanescentes (não são só de fonte)

- E2E de browser desktop/mobile (17.1) — pendente (exigiria dependência de
  runner de browser; há testes de fluxo essenciais no nível de API/serviço);
- backlog Logcomex grupos B/C e itens de mercado (14.x) — dependem de contrato
  real do provedor;
- itens MÉDIA/BAIXA remanescentes de custos/tarifas (4.4, 4.9, 5.2, 5.4, 5.6–
  5.10, 6.6–6.9) e de UI documental (12.2).

---

---

## 0.1. Integração MCP Logcomex — chat consultivo (2026-09-20)

Referências: `PLANEJAMENTO-MCP.md` (referência operacional da feature),
`FONTES.md §34`. Branch `feat/logcomex-mcp-assistant`.

Fatos CONFIRMADOS contra o MCP real `https://mcp.logcomex.ai/` (validado
2026-09-20, protocolo 2025-06-18, server `logcomex-ai-mcp v1.1.0`):

- handshake `initialize` e discovery `tools/list` funcionam **sem autenticação**;
- tools reais: `chat_free`, `chat_with_agent`, `list_agents`, `get_task_status`,
  `cancel_task`, `list_missions`, `search_missions`, `get_mission`;
- **`chat_free` (agente público) não requer token** — caminho padrão do protótipo;
- **agentes da empresa exigem OAuth 2.0** (Authorization Code + PKCE, escopo
  `mcp:chat:agents`); confirmado 401 `www-authenticate: Bearer` ao chamar
  `list_agents` sem token. Um agente da empresa existe para a OMEGASYNC
  (`Agente PortoHackSantos26-GP07`), acessível pelo conector OAuth da plataforma;
- respostas de chat retornam `structuredContent {status, reply, conversation_id}`
  — **`reply` é texto livre**, nunca fato determinístico.

O que foi implementado (e validado ponta a ponta com o MCP real, não só mocks):
cliente MCP server-side (SDK oficial + Streamable HTTP), serviço de agentes com
polling assíncrono, `ChatService` com contexto da simulação e guardrails,
`POST /api/assistant/chat` e `ChatPanel`. Falha/timeout → estado `degraded`.

Estados atualizados:

- **L20 — cliente HTTP/endpoint Logcomex:** **MITIGADA (via MCP).** O caminho
  crítico agora é o MCP (endpoint confirmado, agente público sem credencial). O
  agente da empresa continua **BLOQUEADO POR AUTENTICAÇÃO** (OAuth interativo;
  token não fornecido nesta rodada). A Agent API HTTP permanece **ADIADA**.
- **L11/L18 — anuência (NCM → órgão/LPCO):** **ABERTA.** O MCP responde apenas
  em texto livre; **não** promove órgão anuente/LPCO a dado determinístico. O
  motor permanece UNKNOWN/INDETERMINADO (guardrail administrativo no chat).
- **L23 — schema estruturado do tracking:** **ABERTA.** Não exercitado nesta
  rodada; tracking/documental via MCP só avançam após confirmar `structuredContent`.

Divergência registrada (sem improviso silencioso): o `PLANEJAMENTO-MCP.md`
supôs poder usar o agente da empresa; na prática ele exige **OAuth interativo**
(sem grant headless nem API key). Conforme a contingência do próprio plano (§9),
o protótipo usa o **agente público** como caminho confiável e mantém o agente da
empresa como opção quando um token OAuth real for fornecido — arquitetura e
contrato inalterados. Nota de SDK: o plano citou `@modelcontextprotocol/client`
(v2, recente); foi usado o pacote oficial estável `@modelcontextprotocol/sdk`
(>=1.30), compatível com o stack atual sem upgrades.

Não implementado nesta rodada (fora do escopo do chat): análise documental via
MCP, tracking via MCP, tratamento administrativo estruturado, Agent API HTTP,
persistência de conversa, streaming.

---

## 0.2. ETAPA FINAL 1 — Continuidade do chat (2026-09-20)

Referência: `PLANEJAMENTO-FINALIZACAO.md §4`. Branch `fix/assistant-conversation`.

Implementado: o `ChatPanel` passou a preservar `conversationId` entre mensagens
da sessão (estado no cliente; sem persistência após refresh; nunca guarda token).
O request inclui `conversationId` e a resposta atualiza o estado quando vem um id.
O contrato interno e a API já suportavam o campo; o serviço propaga o id quando
presente e não o inventa em resposta degradada (coberto por teste).

**Divergência confirmada (registrada, sem improviso):** contrário à premissa do
plano, o agente PÚBLICO `chat_free` **rejeita o reuso do próprio
`conversation_id`** (`403 ANONYMOUS_CONVERSATION_FORBIDDEN`), mesmo na mesma
sessão MCP. Um follow-up ingênuo reenviando o id quebraria o chat público. Para
respeitar a DoD ("chat_free continua funcionando", sem regressão) **sem alterar
arquitetura nem contrato**, o adapter NÃO reenvia `conversation_id` ao agente
público — cada mensagem pública inicia conversa nova. A plumbing completa de
`conversationId` fica pronta para o agente da EMPRESA autenticado, onde a
continuidade real deve funcionar (a validar na ETAPA FINAL 3 — OAuth).

Consequência: continuidade de follow-up **não está disponível no agente público**
(limitação do provedor). Não é uma falha do OmegaSync. Ver `FONTES.md §34`.

---

## 0.3. ETAPA FINAL 2 — Diagnóstico como núcleo da demo (2026-09-20)

Referência: `PLANEJAMENTO-FINALIZACAO.md §5`. Branch `feat/prototype-diagnosis`.

Implementado, sem inventar fato/fonte:

- **Segunda rota conceitual** no `DEMO_CATALOG`: `ROTA_RETIRADA_DIRETA`
  (movimento `RETIRADA_DIRETA`, DTA `NOT_REQUIRED`), marcada explicitamente como
  `PREMISSA_SIMULACAO`. Disponibilidade, distância, prazo, tipos de carga e
  custos permanecem `UNKNOWN` (nenhum número fabricado). Contrasta com a
  rota-modelo `TRANSITO_DTA_ZONA_SECUNDARIA` (DTA `REQUIRED`).
- **Contrato/UI**: o DTO passou a expor `requiresDta` e `availability` por rota;
  o `ResultPanel` agora mostra movimento, DTA, disponibilidade, distância, prazo
  e custos faltantes, além de comparação por custo/subtotal/distância/duração
  (com marcação de comparação parcial).
- **Janela de 48h**: mantida `INDETERMINADO` quando aplicável e sem sinal
  operacional; a UI explica o que falta em vez de fabricar conclusão (§5.2).

Verificação manual (HTTP real, `next start`): duas rotas retornadas,
`INDETERMINADA` para ambas (DTA `REQUIRED` não vira `VIAVEL`; disponibilidade
`UNKNOWN` ≠ indisponível; custo total `null` ≠ R$ 0); assistente explicou a
indeterminação usando o resultado como contexto (`source` público, `OK`).

Sem novas lacunas: as ausências (distância/prazo/custo/disponibilidade/anuência)
seguem as lacunas L03–L19 já registradas, agora apenas mais visíveis na UI.

---

## 0.4. ETAPA FINAL 3 — OAuth Logcomex e agente da empresa (2026-09-20)

Referência: `PLANEJAMENTO-FINALIZACAO.md §6–§15`. Branch
`feat/logcomex-company-agent-oauth`.

Implementado (sem hardcodar endpoints, client_id, secret ou scope — tudo via
discovery real do SDK oficial):

- **Fluxo OAuth 2.0 Authorization Code + PKCE (S256)** server-side, usando o
  orquestrador `auth()` do `@modelcontextprotocol/sdk`: discovery RFC 9728,
  Dynamic Client Registration (cliente público, sem secret), `state` (CSRF) e
  troca `code` → token. Tokens vivem em **sessão server-side** (Map de processo);
  o browser recebe só um cookie httpOnly com id opaco — nunca token, nunca
  `localStorage`/`sessionStorage`/`NEXT_PUBLIC_*`.
- **Rotas internas:** `GET /api/logcomex/auth/start`, `GET .../callback`,
  `GET .../status` (devolve apenas `{ authenticated, agentName }`),
  `POST .../logout`.
- **Seleção explícita do agente (§13):** `resolveCompanyAgent` escolhe o agente
  por id configurado ou por NOME esperado (`Agente PortoHackSantos26-GP07`),
  nunca "o primeiro"; sem correspondência → **fallback público** (`chat_free`),
  sem usar outro agente silenciosamente.
- **Renovação (§14):** com `refresh_token`, o transporte do SDK renova o token
  automaticamente (authProvider) e regrava na sessão; sem ele, a sessão expira e
  o usuário reconecta.
- **UI (`ChatPanel`):** barra "Logcomex" com estado (agente público × agente da
  empresa), botão **Conectar Logcomex**, badge **Conectado** + **Sair**, e aviso
  amigável quando o OAuth falha ("Continuando com orientação pública"). O chat
  nunca deixa de funcionar por falha do agente da empresa.

Validação real (2026-09-20, servidor `https://mcp.logcomex.ai/`,
`logcomex-ai-mcp v1.1.0`), **não-interativa**, exercitando o caminho exato do
SDK: handshake + `tools/list`; discovery RFC 9728 (endpoints `/authorize`,
`/token`, `/register`, escopos `mcp:chat:free mcp:chat:agents offline_access`,
PKCE S256 — batendo com `FONTES.md §34`); `auth()` retornando `REDIRECT` com DCR
emitindo `client_id`, PKCE `code_verifier` salvo, `state` casando na URL de
autorização.

**Limitação honesta (não é falha do OmegaSync):** o login/consentimento
interativo na Logcomex e a troca final `code` → `access_token`/`refresh_token`
exigem um usuário humano autenticando no provedor; **não foi possível exercitar
headless** nesta rodada. O código está pronto para completar o fluxo assim que um
login real ocorrer (a demo deve validar esse último passo com um operador).

Estados atualizados:

- **L20 — cliente HTTP/endpoint + credenciais Logcomex:** o agente da empresa
  deixa de estar **BLOQUEADO POR AUTENTICAÇÃO**: o fluxo OAuth real está
  implementado e validado até a URL de autorização. Permanece **pendente apenas o
  login interativo** (passo humano). Fora isso, MITIGADA via MCP.
- **L11/L18 — anuência (NCM → órgão/LPCO):** seguem **ABERTAS.** Mesmo com o
  agente da empresa, o `reply` é texto livre e não promove fato ao motor.

---

## 0.5. ETAPA FINAL 4 — Readiness da demo (2026-09-20)

Referência: `PLANEJAMENTO-FINALIZACAO.md §16–§22`. Branch
`chore/prototype-demo-readiness`. Sem features novas.

Feito:

- **`DEMO.md`**: cenário oficial único (NCM real `85171300`; demais valores como
  entrada do usuário ou premissa rotulada), roteiro 1–13, perguntas de teste e
  matriz de testes de falha. Nenhum número inventado.
- **README.md**: seção Logcomex atualizada para o **OAuth interativo** do agente
  da empresa (rotas `/api/logcomex/auth/*`, sessão server-side, seleção por nome)
  e ponteiro para `DEMO.md`.
- **Verificação ponta a ponta ao vivo** (`next start`, MCP real, 2026-09-20):
  simulação do cenário → liberação e ambas as rotas **INDETERMINADAS**, custo
  total `null` ("Indeterminado", nunca R$ 0,00), anuência `NOT_FOUND` (nenhum
  órgão inventado), evidências com proveniência/confiança; assistente público
  (`LOGCOMEX_PUBLIC_AGENT`, `OK`) explicou a indeterminação usando o resultado
  como contexto; **teste de falha** com MCP inexistente → `FALLBACK`/`UNAVAILABLE`
  `degraded`, app segue utilizável; `/api/logcomex/auth/status` devolve só
  `{ authenticated, agentName }`.

Sem novas lacunas. As ausências (custo/distância/prazo/disponibilidade/anuência)
seguem L01–L25; o produto as mostra como desconhecidas/premissas, sem invenção.
Único passo pendente para a demo completa é o **login OAuth interativo** do
agente da empresa (operador humano), já previsto em `FONTES.md §34`.

---

## 0.6. ETAPA FINAL 5 — Freeze do protótipo (2026-09-20)

Referência: `PLANEJAMENTO-FINALIZACAO.md §23–§25`. As Etapas Finais 1–5 estão
concluídas e mergeadas na `main`. **Desenvolvimento de features encerrado.**

Política de freeze (só serão feitas correções, nunca features):

```text
permitido corrigir:  bug que quebra a demo · bug visual grave · erro de build ·
                     erro de autenticação · erro de MCP · erro factual crítico
proibido adicionar:  nova tela · nova API · novo módulo · novo dashboard ·
                     nova integração
```

Baseline congelada verde (2026-09-20, commit de `main` `bff1f4f`):
`npm run test` (210), `npx tsc --noEmit`, `npm run lint`, `npm run build`,
`git diff --check` — e o CI (`.github/workflows/ci.yml`) executa os mesmos
passos em cada push/PR.

Checklist definitivo (`PLANEJAMENTO-FINALIZACAO §24`) — estado no freeze:

- **Diagnóstico:** formulário, API, simulação, resultado, rotas, DTA,
  disponibilidade, distância, prazo, custos conhecidos/desconhecidos, dados
  faltantes, evidências e janela de 48h sem falsa certeza — **OK** (verificado ao
  vivo na Etapa 4, seção 0.5).
- **Assistente:** ChatPanel, `conversationId`, contexto da simulação, `chat_free`
  sem login, OAuth do agente da empresa, seleção do `Agente PortoHackSantos26-GP07`,
  `chat_with_agent`, fallback público, origem/ressalva na resposta e guardrail
  (texto externo não altera o motor) — **OK**, com a ressalva única abaixo.
- **Demo:** cenário principal (`DEMO.md`), perguntas testadas, MCP real testado,
  fallback testado, CI/build verdes, documentação coerente — **OK**.

Ressalva pendente (não bloqueia o freeze; é passo humano): o **login/consentimento
OAuth interativo** e a troca final `code → token` do agente da empresa dependem de
um operador autenticar na Logcomex — discovery/DCR/PKCE já validados contra o
servidor real (`FONTES.md §34`). Fora isso, o protótipo está fechado.

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
| L22 | Painel de evidências detalhado (fonte/confiança/vigência) na UI | 12→16 | RESOLVIDA: `SimulationResponseDTO.evidences` (origem, referência, confiança, fonte/vigência, premissa) e disclosure de Evidências na UI | RESOLVIDA | — |
| L23 | Resposta real do tracking (schema estruturado além de texto) | 13 | Tratado só como contexto de texto; sem derivar fato determinístico (FONTES §26) | ABERTA | Confirmar payload real do provedor |
| L24 | Estrutura de KPIs da Análise de Embarques | 14 | Não processada: resposta preservada bruta com `structuredConfirmed: false` e ressalva (FONTES §28) | ABERTA | Confirmar resposta real do endpoint |
| L25 | Regras detalhadas do Entreposto Aduaneiro (admissão, suspensão, DTA, recinto habilitado, movimentação, saída, nacionalização, custo, prazo) | 15 | Modeladas como condições `NAO_VALIDADA`; regime fica PENDENTE_VALIDACAO, sem inventar regra (FONTES §19) | ABERTA | Manual de Entreposto Aduaneiro/RFB |
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

### ETAPA 13 — Tracking Logcomex
- **R39 — Tracking é contexto, não decisão:** `adaptTracking` converte a resposta
  em texto rastreável (`TrackingContext`, `contextOnly: true`) com proveniência
  LOGCOMEX; nunca deriva fato determinístico de texto livre (FONTES §26) e não
  alimenta o motor de decisão.
- **R40 — DTO do provedor fora do domínio + fallback:** schema de tracking em
  `src/lib/logcomex`; fallback offline mantém tudo desconhecido (ver L23).

### ETAPA 14 — Inteligência de mercado
- **R41 — Agregado ≠ carga individual:** `MarketImportAnalysis` e a análise de
  embarques carregam `scope: "MARKET_AGGREGATE"`; o módulo `src/lib/portfolio`
  não alimenta o motor de simulação (FONTES §27).
- **R42 — Importações estruturadas; Embarques não:** colunas de Importações são
  confirmadas (§27) → adapter estruturado. KPIs de Embarques não confirmados
  (§28) → resposta preservada bruta com ressalva, sem processamento automático
  (ver L24).

### ETAPA 15 — Entreposto Aduaneiro
- **R43 — Modelar só após validar:** o regime é um contrato com estado de
  validação por condição; no baseline tudo é `NAO_VALIDADA` e a prontidão é
  `PENDENTE_VALIDACAO`. Nenhuma regra de admissão/custo/prazo inventada (§19,
  ver L25).
- **R44 — Entreposto ≠ retroporto:** o assessment carrega nota explícita de que
  entreposto não se confunde com retroporto/porto seco/recinto (FONTES §19); o
  `FacilityType` já distingue os tipos desde a ETAPA 1.

### ETAPA 16 — Evidência e explicabilidade
- **R45 — Evidências no contrato e na UI (resolve L22):** `toEvidenceView`
  converte `Evidence` em visão com origem, referência, confiança rotulada,
  fonte/vigência e flag de premissa; `SimulationResponseDTO.evidences` expõe
  isso e a UI mostra um disclosure "Evidências".
- **R46 — Agregação enriquecida:** a simulação passou a incluir a proveniência
  dos componentes de custo conhecidos (além de anuência, janela e fatores), sem
  duplicar evidências (dedupe por origem+referência).

### ETAPA 17 — Hardening da demo
- **R47 — Resiliência de integração:** `analyzeDocumentWithFallback` e
  `trackWithFallback` (`src/lib/logcomex/resilient.ts`) aplicam timeout e caem
  no fallback offline em falha/timeout, marcando `degraded: true` — nunca falsa
  certeza.
- **R48 — Estados vazios/documentação:** guarda de "nenhuma rota" na UI; README
  com execução, arquitetura e revisão de dados reais x premissas da demo.
- **R49 — Lacunas remanescentes são de FONTE, não de código:** o roadmap está
  concluído; as lacunas L01–L25 abertas dependem de dados/credenciais externos
  (tarifas oficiais, disponibilidade, DTA, anuência real, cliente HTTP Logcomex),
  todas modeladas como desconhecido/premissa, sem invenção.

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
- **2026-09-19 — ETAPA 13:** adicionada L23 (schema real do tracking) e pontos
  de review R39–R40 (tracking como contexto).
- **2026-09-19 — ETAPA 14:** adicionada L24 (KPIs de embarques) e pontos de
  review R41–R42 (inteligência de mercado).
- **2026-09-19 — ETAPA 15:** adicionada L25 (regras do entreposto) e pontos de
  review R43–R44 (regime de entreposto aduaneiro).
- **2026-09-19 — ETAPA 16:** L22 marcada RESOLVIDA (evidências no DTO e na UI);
  pontos de review R45–R46 (explicabilidade).
- **2026-09-19 — ETAPA 17:** pontos de review R47–R49 (resiliência, estados
  vazios, documentação); roadmap do PLANEJAMENTO.md concluído.
- **2026-09-19 — Rodada final de correções (CORRECAO.md):** aplicadas as
  FASES 1–7 no que é implementável sem inventar dado/fonte nem depender de
  contrato externo. Ver a seção "0. Rodada final de correções" para o detalhe e
  os estados. Itens ainda em aberto: E2E de browser (requer runner/dependência a
  autorizar) e o backlog Logcomex bloqueado por contrato/credenciais do provedor
  (grupos C/D) — por isso `CORRECAO.md` é mantido.
- **2026-09-20 — Integração MCP Logcomex (chat consultivo):** cliente MCP
  server-side, serviço de agentes, `ChatService`, `POST /api/assistant/chat` e
  `ChatPanel`. Endpoint e tools reais confirmados; agente público sem auth;
  agente da empresa via OAuth. Ver seção "0.1". L20 MITIGADA (via MCP); L11/L18/
  L23 seguem ABERTAS (só texto livre, sem fonte estruturada).
- **2026-09-20 — ETAPA FINAL 1 (continuidade do chat):** `ChatPanel` preserva
  `conversationId` na sessão. Divergência confirmada: `chat_free` rejeita reuso
  do `conversation_id` (403 ANONYMOUS_CONVERSATION_FORBIDDEN); continuidade real
  fica para o agente da empresa (OAuth). Ver seção "0.2" e `FONTES.md §34`.
- **2026-09-20 — ETAPA FINAL 2 (Diagnóstico como núcleo da demo):** segunda rota
  conceitual (retirada direta, PREMISSA_SIMULACAO); DTA e disponibilidade
  expostos no DTO e na UI; comparação e janela de 48h com explicação honesta.
  Ver seção "0.3".
- **2026-09-20 — ETAPA FINAL 3 (OAuth Logcomex e agente da empresa):** fluxo
  OAuth 2.0 Authorization Code + PKCE server-side (discovery RFC 9728 + DCR via
  SDK), rotas `/api/logcomex/auth/*`, sessão server-side (token nunca no
  browser), seleção explícita do agente `Agente PortoHackSantos26-GP07` com
  fallback público, e UI de conexão no ChatPanel. Discovery/DCR/PKCE validados
  contra o servidor real; login interativo pendente (passo humano). Ver seção
  "0.4" e `FONTES.md §34`.
- **2026-09-20 — ETAPA FINAL 4 (Readiness da demo):** `DEMO.md` (cenário oficial,
  roteiro e testes de falha), README atualizado (OAuth do agente da empresa) e
  verificação ponta a ponta ao vivo (simulação, assistente e teste de falha).
  Ver seção "0.5".
- **2026-09-20 — ETAPA FINAL 5 (Freeze do protótipo):** desenvolvimento de
  features encerrado; política de freeze e checklist definitivo registrados;
  baseline `main` verde. Ver seção "0.6".
