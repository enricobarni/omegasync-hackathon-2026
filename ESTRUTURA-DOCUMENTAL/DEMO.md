# OmegaSync — Roteiro de Demonstração

> Cenário oficial único da demo (ETAPA FINAL 4, `PLANEJAMENTO-FINALIZACAO.md`
> §16–§22). Contém apenas informação **real**, **documentada** ou
> **explicitamente marcada como premissa**. Nada de número inventado: custos,
> distância, prazo, disponibilidade e anuência permanecem **desconhecidos** por
> falta de fonte — e é justamente isso que a demo mostra com honestidade.
>
> Validado ponta a ponta em 2026-09-20 (`next start`, MCP real
> `https://mcp.logcomex.ai/`).

---

## 1. Mensagem da demo

```text
OmegaSync decide.
Logcomex contextualiza.
O usuário entende o porquê.
```

O motor determinístico conclui a elegibilidade e a comparação; o assistente
Logcomex (MCP) explica o resultado sem alterá-lo. Ausência de dado nunca vira
zero/false/falsa certeza.

---

## 2. Preparação

```bash
npm install
npm run dev        # ou: npm run build && npm run start
# abrir http://localhost:3000
```

Nenhum token é necessário: o chat usa o **agente público** por padrão. Para
exercitar o **agente da empresa**, use o botão **Conectar Logcomex** (OAuth
interativo — ver §7).

---

## 3. A carga (cenário oficial)

| Campo | Valor | Natureza |
| --- | --- | --- |
| NCM | `85171300` (telefones inteligentes / smartphones) | **Real** — NCM oficial |
| Tipo de carga | FCL (contêiner completo) | Entrada do usuário |
| Status OEA | Não OEA | Entrada do usuário |
| Canal aduaneiro | Verde | Entrada do usuário |
| CIF | `100000` (BRL) | **Exemplo** de entrada — não é fato de fonte |
| Necessita entrepostagem? | Não | Premissa do cenário |
| Operação carga-pátio (retirada direta)? | Sim | Premissa do cenário |
| Recinto discriminado no agendamento? | Não informado | — |
| Possui caixa para antecipação? | Não | Premissa do cenário |
| Estrutura sincronizada? | Não | Premissa do cenário |

> Por que este cenário: canal verde **não basta** para liberar (a anuência não
> está resolvida), e a NCM não tem mapeamento de órgão anuente na base (registro
> vazio, sem invenção). O resultado é uma **INDETERMINAÇÃO honesta**, ideal para
> mostrar o motor e as evidências.

---

## 4. Roteiro (o que fazer ao vivo)

```text
1.  Abrir o OmegaSync (Diagnóstico).
2.  Apresentar a carga (§3).
3.  Preencher o formulário com os valores acima.
4.  Clicar em "Simular operação".
5.  Mostrar a LIBERAÇÃO: INDETERMINADA (anuência não resolvida).
6.  Mostrar as ROTAS: duas alternativas conceituais
      - "DP World Santos → Retirada direta" (movimento RETIRADA_DIRETA, sem DTA)
      - "DP World Santos → Recinto de Zona Secundária (via DTA)" (DTA REQUIRED)
7.  Mostrar CUSTOS: sem custo conhecido → total "Indeterminado" (nunca R$ 0,00).
8.  Mostrar DADOS FALTANTES por rota (anuência, tipos de carga, disponibilidade,
      distância, prazo, DTA quando aplicável).
9.  Abrir "Evidências": origem, confiança e proveniência (inclui premissas
      rotuladas como PREMISSA_SIMULACAO, confiança C).
10. Abrir o "Assistente".
11. Perguntar: "Por que esta rota ficou indeterminada?"
12. Mostrar a resposta usando o resultado como contexto (rótulo de origem
      Logcomex + ressalva "não altera a decisão do motor").
13. (Opcional) Conectar Logcomex e perguntar ao agente da empresa (§7/§8).
```

---

## 5. Resultado esperado (verificado em 2026-09-20)

`POST /api/simulations` com o cenário do §3 retorna:

```text
clearance.status              = INDETERMINADA
anuencia.status               = NOT_FOUND   (nenhum órgão inventado)
routes[0] Retirada direta     = INDETERMINADA
  DTA           = NOT_REQUIRED (premissa C, rotulada)
  disponibilidade = UNKNOWN     (≠ indisponível)
  faltando: anuência não resolvida; tipos de carga; disponibilidade;
            liberação ainda não concluída
routes[1] Trânsito via DTA    = INDETERMINADA
  DTA           = REQUIRED  (premissa ancorada em trânsito aduaneiro — FONTES §17)
custo total por rota          = null → "Indeterminado" (nunca R$ 0,00)
```

O DTA `REQUIRED` **não** vira VIÁVEL sem resolução; disponibilidade `UNKNOWN`
**não** é tratada como indisponível; custo desconhecido **não** vira zero.

---

## 6. Perguntas de teste no chat

Com a simulação como contexto (agente público ou da empresa):

```text
"Por que esta rota ficou indeterminada?"
"Quais dados estão faltando?"
"O que significa DTA?"
```

Consulta de comércio exterior (melhor no agente da empresa, quando conectado):

```text
"Liste os 5 maiores importadores brasileiros da NCM 8517.13.00 nos últimos
 12 meses, ordenados pelo valor FOB total."
```

Se o agente não tiver o dado/capacidade, ele mostra a limitação — isso **não** é
falha do OmegaSync. Perguntas sobre órgão anuente/LPCO recebem ressalva: o motor
permanece INDETERMINADO enquanto não houver fonte estruturada.

---

## 7. Conectar o agente da empresa (OAuth) — opcional

```text
1. No painel do Assistente, clicar em "Conectar Logcomex".
2. Autenticar na Logcomex (OAuth 2.0 Authorization Code + PKCE).
3. Ao voltar, o painel mostra "Agente PortoHackSantos26-GP07" + "Conectado".
4. As perguntas passam a usar o agente da empresa (chat_with_agent).
5. "Sair" encerra a sessão; o chat volta ao agente público.
```

O token vive **apenas no servidor** (sessão + cookie httpOnly). O frontend só
recebe `{ authenticated, agentName }`. Discovery, DCR e PKCE foram validados
contra o servidor real; o login interativo depende de um operador (ver
`FONTES.md §34`).

---

## 8. Teste de falha (ensaiar antes da demo)

O aplicativo deve continuar utilizável em cada caso:

| Situação | Comportamento observado |
| --- | --- |
| MCP indisponível | Chat responde `degraded`/`UNAVAILABLE` com mensagem amigável; o diagnóstico continua válido (verificado com URL MCP inexistente). |
| OAuth falha/expira | Aviso "Não foi possível conectar… Continuando com orientação pública"; fallback público ativo. |
| Resultado sem custo completo | Total "Indeterminado", subtotal conhecido separado; nunca R$ 0,00. |
| Anuência não resolvida | Liberação INDETERMINADA com dado faltante explícito; motor não inventa órgão. |
| Rota indeterminada | Estado INDETERMINADA com ícone + texto + badge (não só cor) e lista de dados faltantes. |

Reproduzir "MCP indisponível" localmente:

```bash
LOGCOMEX_MCP_URL=https://mcp-nao-existe.invalid/ LOGCOMEX_MCP_TIMEOUT_MS=4000 \
  npm run start
# perguntar no chat → resposta degradada, app segue utilizável
```

---

## 9. Critério de conclusão

A demo está pronta quando, ao vivo e sem editar código/terminal, é possível:

```text
abrir → preencher → simular → entender as alternativas → ver custos/incertezas
→ ver evidências → abrir o assistente → perguntar sobre a decisão → receber
explicação → (opcional) consultar o agente Logcomex da equipe.
```
