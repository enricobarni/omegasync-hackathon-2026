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
a simulação. A API correspondente é `POST /api/simulations`.

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
| Logcomex (documental, tracking, mercado) | Adapters/ports + fallback; **integração não ativa** (sem cliente HTTP/credenciais) |

Nada acima é convertido em número inventado: valores ausentes permanecem
desconhecidos ou premissas rotuladas. Estados de informação distinguem
`conhecido`, `desconhecido` e `não aplicável`.

## Integração Logcomex

A arquitetura está **preparada para integração** (DTOs do provedor, ports e
adapters puros, fallback offline com timeout em `src/lib/logcomex/resilient.ts`),
mas o **Logcomex não é chamado pela demo**: não há cliente HTTP, endpoint,
autenticação nem confirmação de moeda/locale/schema real. Falha/timeout caem em
fallback marcado como `degraded`, com fonte `INTERNAL_FALLBACK` — nunca
apresentado como resposta real do provedor. O CIF não é derivado em BRL enquanto
a moeda das parcelas não for confirmada.

## Integração contínua

`.github/workflows/ci.yml` executa `test`, `tsc --noEmit`, `lint` e `build` em
cada push/PR.

## Documentos do projeto

- `PLANEJAMENTO.md` — etapas, escopo e ordem.
- `FONTES.md` — baseline factual, fórmulas, tarifas, evidências.
- `DESIGN.md` — identidade visual e frontend.
- `LACUNAS-REVIEW.md` — lacunas de dados e decisões de review, etapa a etapa.
