# OmegaSync

Motor de elegibilidade e comparação de rotas aduaneiro-operacionais, construído
durante o Porto Hack Santos 2026.

Dada uma carga, o OmegaSync responde:

```text
Quais rotas podem ser executadas?  →  Quanto custa cada uma?
Quais restrições existem?  →  Qual o prazo/distância?  →  Com quais evidências?
```

## Como executar

Requer Node 24+.

```bash
npm install
npm run dev      # ambiente de desenvolvimento em http://localhost:3000
```

A tela principal (`/`) é o **Diagnóstico**: preencha os dados da carga e execute
a simulação. A API correspondente é `POST /api/simulations`. O botão
**Assistente** abre um chat consultivo (`POST /api/assistant/chat`) que recebe a
simulação atual como contexto e consulta a Logcomex via MCP.

### Validação

```bash
npm run test        # testes (vitest)
npx tsc --noEmit    # checagem de tipos
npm run lint        # eslint
npm run build       # build de produção
```

## Arquitetura

```text
Apresentação / UI            src/app, src/components
        ↓
Aplicação / orquestração     src/lib/application (serviço de simulação)
        ↓                    src/lib/api (DTOs, validação de borda)
Domínio (determinístico)     src/lib/domain (contratos, estados de informação)
   ├── elegibilidade         src/lib/engine (eligibility, custos, comparação, 48h)
   └── comparação/custos
        ↓
Dados / integrações          src/lib/catalog, src/lib/tariffs, src/lib/customs,
                             src/lib/logcomex, src/lib/portfolio
```

Princípios (ver `AGENTS.md`):

- o **domínio é determinístico** e não acessa rede, React, HTTP ou Logcomex;
- integrações **fornecem dados**, não decidem rota;
- `unknown != zero`, `unknown != false`, `não aplicável != false`;
- todo dado externo relevante mantém **proveniência**.

## Dados reais x premissas na demo

O detalhe completo está em [`LACUNAS-REVIEW.md`](./LACUNAS-REVIEW.md) e em
[`FONTES.md`](./FONTES.md). Resumo do que a demo usa:

| Dado | Estado |
| --- | --- |
| Armazenagem DP World Santos / Ecoporto | Tabela pública datada (confiança A) |
| Descarga Direta "Santos Brasil" | Baseline histórico, **não consolidado** e com ressalva de Imbituba (confiança C) — não gera custo real |
| BTP | **Não consolidado** — não usado como constante |
| Registro NCM → órgão anuente | **Vazio** — sem mapeamento inventado; resolução considera atributos e múltiplas entradas |
| Disponibilidade, distância, prazo, custo/km, capital, DTA | Desconhecidos / premissas explícitas |
| Entreposto aduaneiro | **Regime** (não tipo de recinto), pendente de validação com evidência por condição (Manual RFB) |
| Logcomex — chat consultivo (MCP) | **Ativo** via MCP `https://mcp.logcomex.ai/`, agente público `chat_free` (sem token); texto livre = contexto, não altera o motor |
| Logcomex — documental, tracking, mercado | Adapters/ports + fallback; **integração não ativa** (depende de contrato/schema real via MCP) |

Nada acima é convertido em número inventado: valores ausentes permanecem
desconhecidos ou premissas rotuladas. Estados de informação distinguem
`conhecido`, `desconhecido` e `não aplicável`.

## Integração Logcomex

### Chat consultivo via MCP (ativo)

O assistente do OmegaSync é integrado à Logcomex pelo **MCP** (Model Context
Protocol) fornecido pela plataforma:

```text
Browser → POST /api/assistant/chat → ChatService → adapter MCP → mcp.logcomex.ai
```

O browser **nunca** fala com o MCP diretamente e o domínio **nunca** depende do
provedor. Validado em 2026-09-20 contra `https://mcp.logcomex.ai/`:

- handshake MCP (`initialize`) e discovery (`tools/list`) reais;
- tools observadas: `chat_free`, `chat_with_agent`, `list_agents`,
  `get_task_status`, `cancel_task`, `list_missions`, `search_missions`,
  `get_mission`;
- **`chat_free` (agente público) não requer autenticação** — é o caminho padrão
  do protótipo;
- **agentes da empresa** (`list_agents`/`chat_with_agent`) exigem **OAuth 2.0**
  (escopo `mcp:chat:agents`); habilitados quando um token Bearer real é fornecido
  via `LOGCOMEX_MCP_ACCESS_TOKEN` (server-side). Sem token, o chat usa o agente
  público;
- execução assíncrona (`task_id` → `get_task_status`) é suportada com polling
  controlado (intervalo/timeout configuráveis; sem loop infinito).

O texto do agente é sempre apresentado como **contexto/orientação** (rótulo de
origem + ressalva "não altera automaticamente a decisão do motor"). Perguntas
sobre órgão anuente/LPCO recebem ressalva explícita: **o motor permanece
INDETERMINADO** enquanto não houver fonte estruturada e rastreável. Falha/timeout
do MCP viram estado `degraded` com mensagem amigável — nunca falsa certeza.

Configuração (server-side, ver `.env.example`):

```env
LOGCOMEX_MCP_URL=https://mcp.logcomex.ai/
LOGCOMEX_MCP_TIMEOUT_MS=90000
LOGCOMEX_MCP_POLL_INTERVAL_MS=5000
LOGCOMEX_MCP_POLL_TIMEOUT_MS=120000
# LOGCOMEX_MCP_ACCESS_TOKEN=   # opcional: token OAuth real p/ agente da empresa
# LOGCOMEX_MCP_AGENT_ID=       # opcional: agente da empresa preferido
```

### Documental, tracking e mercado (não ativos)

A arquitetura está **preparada para integração** (DTOs do provedor, ports e
adapters puros, fallback offline com timeout em `src/lib/logcomex/resilient.ts`),
mas análise documental, tracking e inteligência de mercado **ainda não são
alimentados pelo MCP**: falta confirmar o schema real de entrada/saída (structured
vs. texto). Enquanto o retorno for texto livre, serve apenas como contexto de
chat — nunca deriva fato determinístico. O CIF não é derivado em BRL enquanto a
moeda das parcelas não for confirmada. A Agent API HTTP permanece **adiada**
(provedor relatou instabilidade).

## Integração contínua

`.github/workflows/ci.yml` executa `test`, `tsc --noEmit`, `lint` e `build` em
cada push/PR.

## Documentos do projeto

- `PLANEJAMENTO.md` — etapas, escopo e ordem.
- `FONTES.md` — baseline factual, fórmulas, tarifas, evidências.
- `DESIGN.md` — identidade visual e frontend.
- `LACUNAS-REVIEW.md` — lacunas de dados e decisões de review, etapa a etapa.
