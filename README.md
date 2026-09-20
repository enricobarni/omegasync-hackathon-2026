# OmegaSync

**Motor de apoio à decisão para operações aduaneiro-portuárias, desenvolvido no Porto Hack Santos 2026.**

O OmegaSync recebe os dados de uma operação de importação, avalia alternativas operacionais e apresenta **elegibilidade, restrições, custos conhecidos, incertezas, evidências e dados faltantes**. A proposta é apoiar a decisão sem transformar ausência de informação em falsa certeza.

> **Status:** protótipo funcional e congelado para demonstração.

## Links públicos

- **Aplicação:** https://omegasync-hackathon-2026.vercel.app/
- **Repositório:** https://github.com/enricobarni/omegasync-hackathon-2026

## O que está funcional

- Diagnóstico de uma operação a partir de NCM, CIF, tipo de carga, OEA, canal aduaneiro e condições operacionais.
- Motor determinístico de elegibilidade de rotas.
- Comparação entre alternativas de retirada direta e transferência para Zona Secundária via DTA.
- Avaliação de liberação aduaneira, anuência, DTA, disponibilidade, distância, prazo, janela de 48h e fatores operacionais.
- Comparação de custos preservando estados de informação desconhecidos.
- Painel de evidências e proveniência.
- Assistente integrado à **Logcomex via MCP**.
- Agente público da Logcomex sem autenticação.
- Agente da equipe `Agente PortoHackSantos26-GP07` via OAuth 2.0 + PKCE.
- Fallback controlado quando a integração Logcomex estiver indisponível.
- Testes automatizados, typecheck, lint e build em CI.

## Como funciona

```text
Usuário
  ↓
Diagnóstico
  ↓
API OmegaSync
  ↓
Motor determinístico
  ├── liberação / anuência
  ├── elegibilidade
  ├── custos
  ├── comparação
  └── janela de 48h
  ↓
Resultado + evidências + dados faltantes

Assistente
  ↓
API interna OmegaSync
  ↓
MCP Logcomex
```

A Logcomex fornece **contexto e dados consultivos**. A decisão continua sendo responsabilidade do motor do OmegaSync.

## Stack

- **Next.js 16.3.5**
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **Vitest**
- **MCP SDK oficial**
- **Logcomex MCP**
- **OAuth 2.0 Authorization Code + PKCE**
- **Vercel**

## Como executar localmente

### 1. Pré-requisitos

- Node.js 24+
- npm
- Git

### 2. Clone o projeto

```bash
git clone https://github.com/enricobarni/omegasync-hackathon-2026.git
cd omegasync-hackathon-2026
```

### 3. Instale as dependências

Como o projeto possui `package-lock.json`, prefira:

```bash
npm ci
```

Também é possível usar:

```bash
npm install
```

### 4. Configure as variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Configuração mínima:

```env
LOGCOMEX_MCP_URL=https://mcp.logcomex.ai/
LOGCOMEX_MCP_TIMEOUT_MS=90000
LOGCOMEX_MCP_POLL_INTERVAL_MS=5000
LOGCOMEX_MCP_POLL_TIMEOUT_MS=120000
```

O agente público da Logcomex funciona sem token.

Para o agente da empresa, o próprio sistema utiliza o fluxo OAuth interativo pelo botão **Conectar Logcomex**.

> Nunca versione tokens ou segredos reais. O `.env.example` contém apenas configuração pública e placeholders.

### 5. Inicie o projeto

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

Para testar como build de produção:

```bash
npm run build
npm run start
```

## Teste rápido do diagnóstico

Um cenário de demonstração disponível no projeto:

| Campo                   | Valor                      |
| ----------------------- | -------------------------- |
| NCM                     | `85171300`                 |
| CIF                     | `100000`                   |
| Tipo de carga           | `FCL (contêiner completo)` |
| Status OEA              | `Não OEA`                  |
| Canal aduaneiro         | `Verde`                    |
| Necessita entrepostagem | `Não`                      |
| Operação carga-pátio    | `Sim`                      |
| Recinto discriminado    | `Não informado`            |
| Caixa para antecipação  | `Não`                      |
| Estrutura sincronizada  | `Não`                      |

Resultado esperado: o motor deve explicitar as incertezas da operação em vez de fabricar valores ou conclusões.

O roteiro completo está em [`DEMO.md`](./DEMO.md).

## Assistente Logcomex

O painel **Assistente** consulta a Logcomex por MCP.

### Sem login

Usa:

```text
chat_free
```

O agente público funciona sem credenciais.

### Agente da equipe

Clique em:

```text
Conectar Logcomex
```

O fluxo utiliza:

```text
OAuth 2.0
→ Authorization Code
→ PKCE S256
→ sessão server-side
→ list_agents
→ Agente PortoHackSantos26-GP07
→ chat_with_agent
```

Tokens não são enviados para o frontend.

O agente da equipe é selecionado explicitamente por nome/ID; o sistema não escolhe outro agente silenciosamente.

## Perguntas para testar o assistente

Com uma simulação já executada:

```text
Por que esta rota ficou indeterminada?
```

```text
Quais dados estão faltando?
```

```text
O que significa DTA?
```

Com o agente da empresa conectado:

```text
Liste os 5 maiores importadores brasileiros da NCM 8517.13.00 nos últimos 12 meses, ordenados pelo valor FOB total.
```

## Arquitetura

```text
src/
├── app/
│   └── api/
│       ├── simulations/
│       ├── assistant/
│       └── logcomex/auth/
├── components/
│   ├── diagnosis/
│   └── assistant/
└── lib/
    ├── domain/
    ├── engine/
    ├── application/
    ├── api/
    ├── catalog/
    ├── tariffs/
    ├── customs/
    ├── evidence/
    └── logcomex/
```

Princípio arquitetural:

```text
UI → Application → Domain
                    ↑
             integrações externas
```

Nunca:

```text
Browser → MCP diretamente
Domain → Logcomex
```

## Regras de confiabilidade

O OmegaSync foi construído para preservar explicitamente estados de informação:

```text
UNKNOWN != false
UNKNOWN != zero
UNKNOWN != NOT_APPLICABLE
```

Também:

```text
NCM sugerida != NCM confirmada
texto livre != fato determinístico
premissa de demonstração != fato real
```

Se não houver fonte suficiente, o sistema apresenta o dado como **desconhecido ou indeterminado**.

## Dados reais e premissas

O protótipo combina:

- tabelas tarifárias públicas documentadas;
- regras e referências aduaneiras pesquisadas;
- evidências de pesquisa de campo;
- premissas explícitas para demonstração;
- dados consultivos da Logcomex.

Nenhuma ausência de dado é silenciosamente convertida em valor real.

Para rastreabilidade completa:

- [`FONTES.md`](./FONTES.md)
- [`LACUNAS-REVIEW.md`](./LACUNAS-REVIEW.md)

## Validação técnica

Execute:

```bash
npm run test
npx tsc --noEmit
npm run lint
npm run build
```

O repositório também possui CI executando essas verificações em pushes e Pull Requests.

## Estrutura documental

- [`DEMO.md`](./DEMO.md) — roteiro oficial da demonstração.
- [`FONTES.md`](./FONTES.md) — fontes, dados e evidências.
- [`LACUNAS-REVIEW.md`](./LACUNAS-REVIEW.md) — limitações, decisões e lacunas conhecidas.
- [`PLANEJAMENTO.md`](./PLANEJAMENTO.md) — planejamento técnico.
- [`PLANEJAMENTO-MCP.md`](./PLANEJAMENTO-MCP.md) — integração Logcomex/MCP.
- [`DESIGN.md`](./DESIGN.md) — diretrizes de interface.

## Limitações conhecidas

Este é um **protótipo de hackathon**, não um sistema de produção.

Alguns dados operacionais permanecem desconhecidos quando não existe fonte estruturada confiável, incluindo, dependendo do cenário:

- disponibilidade real de recintos;
- distância e prazo de determinadas rotas;
- custo real de DTA;
- tratamento administrativo completo por NCM/atributos;
- alguns componentes de custo operacional.

Isso é intencional: o motor prefere retornar **INDETERMINADO** a apresentar uma conclusão sem sustentação.

## Porto Hack Santos 2026

Projeto desenvolvido para o **Porto Hack Santos 2026**, com foco em apoio à decisão e sincronização de operações de importação no ecossistema portuário.

**OmegaSync**

```text
Decidir com os dados disponíveis.
Mostrar o que falta.
Explicar o porquê.
```
