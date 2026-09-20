# OmegaSync — Planejamento de Integração MCP Logcomex

> **Objetivo:** implementar a Logcomex no protótipo OmegaSync usando **MCP como integração principal**, priorizando um chat explicativo/consultivo e preparando o reaproveitamento do MCP para análise documental e tracking somente quando os retornos forem realmente estruturados e validados.
>
> **Contexto da decisão:** a equipe da Logcomex informou que as Agent APIs HTTP estão instáveis/bugadas. Para o protótipo, não vamos depender delas. O caminho principal será o MCP fornecido pela própria plataforma.
>
> **MCP informado pela plataforma do projeto:**
>
> ```text
> https://mcp.logcomex.ai/
> ```
>
> A documentação pública da Logcomex atualmente também divulga:
>
> ```text
> https://platform.logcomex.ai/mcp
> ```
>
> **Regra:** usar primeiro o endpoint entregue pela plataforma do nosso ambiente (`https://mcp.logcomex.ai/`). Não trocar silenciosamente de endpoint. Se o handshake falhar, registrar o erro e comparar com o endpoint público antes de qualquer mudança.

---

# 1. Resultado esperado para o protótipo

O objetivo desta implementação NÃO é transformar a integração Logcomex em infraestrutura de produção completa.

O protótipo deve conseguir demonstrar:

```text
Usuário
  ↓
Diagnóstico OmegaSync
  ↓
Motor calcula o resultado
  ↓
Usuário abre o chat
  ↓
Chat recebe contexto da simulação
  ↓
Chat explica:
  - por que a rota ficou viável/inviável/indeterminada;
  - quais dados estão faltando;
  - de onde vieram custos/evidências;
  - o que significa DTA, OEA, anuência etc.
  ↓
Quando necessário:
  MCP Logcomex é consultado
  ↓
Resposta externa aparece explicitamente como contexto/orientação
```

Também queremos testar, sem tornar obrigatório para o primeiro fechamento:

```text
MCP → análise documental
MCP → tracking
```

Essas duas capacidades só podem alimentar estruturas internas do OmegaSync se o retorno real do MCP for estruturado e validável.

---

# 2. Decisão arquitetural

## 2.1 MCP substitui a Agent API HTTP nesta rodada

Não implementar agora integração direta com:

```text
POST /v1/agent-api-execute/{agent_id}/{prompt_id}
GET  /v1/agent-api-execute/{request_id}
```

Motivo:

```text
provider informou instabilidade/bugs
+
MCP já foi disponibilizado
+
MCP já foi testado em Claude
```

A Agent API HTTP deve permanecer documentada como alternativa futura.

Não apagar abstrações existentes do projeto apenas porque a implementação HTTP foi adiada.

---

## 2.2 O domínio continua independente

Arquitetura obrigatória:

```text
Presentation / UI
        ↓
Application
        ↓
Domain
        ↑
Integration adapters
        ↑
MCP Logcomex
```

Nunca:

```text
Domain → MCP
Domain → Logcomex
React → MCP diretamente
Browser → credenciais Logcomex
```

A integração deve ficar server-side.

---

# 3. Regras obrigatórias já existentes no OmegaSync

Antes de implementar, ler:

```text
AGENTS.md
PLANEJAMENTO.md
FONTES.md
DESIGN.md
LACUNAS-REVIEW.md
CORRECAO.md (se ainda existir)
```

Também revisar o código atual em:

```text
src/lib/logcomex/
src/lib/application/
src/lib/api/
src/components/diagnosis/
src/app/api/
```

Preservar:

```text
UNKNOWN != false
UNKNOWN != zero
UNKNOWN != NOT_APPLICABLE
NCM sugerida != NCM confirmada
texto livre != fato determinístico
Logcomex fornece contexto/dados; OmegaSync decide
```

Não duplicar regra de negócio no React ou no Route Handler.

---

# 4. Estado já conhecido do MCP

Em teste anterior no Claude, foram observadas as seguintes tools/capacidades:

```text
list_agents
chat_with_agent
chat_free
get_task_status
list_missions
search_missions
get_mission
cancel_task
```

Resultados já observados:

```text
list_agents
→ funcionou

chat_with_agent
→ funcionou
→ execução assíncrona observada
→ retorno por task_id/status

chat_free
→ funcionou

get_task_status
→ funcionou

list_missions
search_missions
→ apresentaram erro do servidor durante os testes

get_mission
→ não testado por ausência de mission_id

cancel_task
→ não precisou ser testado
```

**Não hardcodar essa lista como contrato eterno.**

Na implementação, executar descoberta real das tools disponibilizadas pelo servidor.

---

# 5. Capacidades Logcomex relevantes ao OmegaSync

## 5.1 Chat explicativo — IMPLEMENTAR AGORA

Objetivo:

```text
explicar resultado do OmegaSync
+
responder dúvidas de comércio exterior
+
consultar agente Logcomex quando necessário
```

Exemplos:

```text
"Por que essa rota ficou indeterminada?"

"Quais dados estão faltando?"

"O que significa DTA?"

"Por que o custo total não aparece?"

"Meu produto pode precisar de anuência?"

"Essa NCM normalmente se relaciona a algum órgão?"
```

Regra importante para as últimas perguntas:

Se a Logcomex devolver apenas resposta textual/genérica:

```text
pode aparecer no CHAT
não pode alterar o MOTOR
```

A UI deve distinguir:

```text
RESULTADO OMEGASYNC
CONTEXTO LOGCOMEX
ORIENTAÇÃO GERAL
```

---

## 5.2 Análise documental — TESTAR APÓS CHAT FUNCIONAR

O projeto já possui:

```text
DocumentAnalysisPort
DocumentEnrichment
adaptDocumentAnalysis(...)
fallbackEnrichment(...)
analyzeDocumentWithFallback(...)
```

Não substituir esses contratos cegamente.

Primeiro testar pelo MCP:

```text
BL
Invoice
Packing List
```

Descobrir:

```text
como anexar arquivo pelo MCP;
qual tool aceita arquivo;
qual schema de entrada;
qual schema de saída;
se retorna structuredContent;
se retorna JSON;
ou se retorna somente texto.
```

### Se retorno for estruturado

Criar adapter:

```text
LogcomexMcpDocumentAnalysisAdapter
        ↓
DocumentAnalysisPort
```

ou evoluir a porta se o schema real exigir.

### Se retorno for texto livre

Não converter com regex/heurística para alimentar o motor.

Usar somente como:

```text
contexto documental no chat
```

até existir contrato estruturado confiável.

---

## 5.3 Tracking — TESTAR APÓS CHAT FUNCIONAR

O projeto já possui:

```text
TrackingPort
TrackingContext
adaptTracking(...)
trackingFallback(...)
trackWithFallback(...)
```

Testar via MCP com identificador real/sanitizado quando disponível:

```text
container
BL
booking
AWB
```

Descobrir o schema real.

Mesma regra:

```text
retorno estruturado confiável
→ adapter pode alimentar TrackingContext

texto livre
→ contexto de chat apenas
```

Tracking não deve decidir elegibilidade de rota nesta fase.

---

## 5.4 Tratamento administrativo / anuência

Este é o ponto crítico.

Até agora NÃO foi confirmada uma tool estruturada que entregue diretamente:

```text
NCM
→ órgão anuente
→ LPCO
→ modalidade
→ atributos obrigatórios
```

Portanto:

```text
MCP em texto livre
→ pode orientar o usuário

MCP em texto livre
→ NÃO pode escrever automaticamente
   "orgaoAnuente = X"
   no domínio
```

Só promover para dado determinístico se a descoberta das tools demonstrar uma fonte estruturada e rastreável.

Se não houver:

```text
status permanece UNKNOWN / INDETERMINADO
```

---

# 6. SDK MCP

Preferir o SDK oficial TypeScript atual.

Em 19/09/2026, a documentação oficial do MCP apresenta a linha v2 estável com:

```text
@modelcontextprotocol/client
```

e conexão HTTP por:

```text
Client
StreamableHTTPClientTransport
```

Antes de instalar:

1. verificar versão Node atual do projeto;
2. verificar TypeScript atual;
3. verificar peer dependencies;
4. confirmar compatibilidade com Next.js 16.3.5;
5. NÃO atualizar TypeScript/Next apenas para satisfazer uma escolha de SDK.

O projeto atualmente usa TypeScript 5.

Se a versão atual do SDK exigir upgrade incompatível/desnecessário:

```text
usar uma versão oficial compatível
```

e registrar a decisão.

Não instalar pacotes MCP de terceiros sem necessidade.

---

# 7. Estrutura de arquivos proposta

Não criar todos os arquivos cegamente. Ajustar após inspecionar os padrões reais do repositório.

Estrutura conceitual:

```text
src/
  lib/
    logcomex/
      mcp/
        client.ts
        config.ts
        types.ts
        tool-discovery.ts
        agent-service.ts

    assistant/
      chat-service.ts
      chat-types.ts
      context-builder.ts
      guardrails.ts

  app/
    api/
      assistant/
        chat/
          route.ts

  components/
    assistant/
      ChatPanel.tsx
      ChatMessage.tsx
      assistant.module.css
```

Se o projeto já tiver uma convenção melhor, seguir a existente.

---

# 8. FASE 0 — Descoberta real do servidor MCP

## Objetivo

Antes de construir o chat, provar a conexão programática a:

```text
https://mcp.logcomex.ai/
```

## Implementar

Criar um cliente mínimo server-side que:

```text
1. inicializa MCP Client
2. conecta via Streamable HTTP
3. executa handshake initialize
4. lista capabilities
5. lista tools
6. encerra/limpa conexão corretamente
```

Não expor esse endpoint de diagnóstico em produção pública sem proteção.

## Registrar

Para cada tool:

```text
name
description
inputSchema
outputSchema/structuredContent quando houver
```

Salvar apenas em log de desenvolvimento/documentação.

Não versionar respostas contendo dados sensíveis.

## Critério de sucesso

Temos uma execução local que confirma:

```text
servidor alcançável
+
handshake MCP válido
+
tools reais conhecidas
```

---

# 9. FASE 1 — Autenticação

A documentação pública da Logcomex indica:

```text
free/public agent
→ sem login

company agents
→ OAuth 2.0
```

O protótipo deve preferir o agente da empresa se a autenticação puder ser feita de forma segura.

## Regras

Não inventar:

```text
client_id
client_secret
authorization endpoint
token endpoint
scope
```

O cliente deve usar o fluxo real exposto pelo servidor/SDK.

Se o servidor responder com desafio OAuth:

```text
seguir metadata/discovery oficial do MCP
```

Credenciais/tokens:

```text
server-side
não expor no browser
não versionar
não imprimir em logs
```

Se a autenticação company-agent impedir o protótipo:

```text
permitir modo público SOMENTE para o chat consultivo
```

e deixar claro na UI/documentação que é agente público.

Não usar agente público como fonte determinística do motor.

---

# 10. FASE 2 — Serviço MCP Logcomex

Criar uma abstração de infraestrutura.

Exemplo conceitual:

```text
LogcomexMcpClient
  connect()
  listTools()
  callTool()
  close()
```

e por cima:

```text
LogcomexAgentService
  listAgents()
  askCompanyAgent()
  askPublicAgent()
  getTaskStatus()
```

Os nomes reais devem refletir as tools descobertas.

Não acoplar o restante do OmegaSync diretamente a nomes de tools se for simples encapsular.

---

# 11. Execução assíncrona

`chat_with_agent` já foi observado retornando task/status assíncrono.

O serviço deve suportar:

```text
call chat_with_agent
      ↓
resposta final?
  sim → retorna
  não → task_id
             ↓
       get_task_status
             ↓
       pending → aguardar
             ↓
       completed → retornar
```

Para o protótipo:

```text
polling simples
intervalo controlado
timeout total controlado
```

Não fazer loop infinito.

Exemplo de limites conceituais:

```text
poll interval configurável
timeout total configurável
```

Os valores devem ficar em config/env, não espalhados pelo código.

Se exceder:

```text
degraded = true
mensagem amigável
não inventar resposta
```

---

# 12. FASE 3 — Contexto do OmegaSync para o chat

O maior diferencial do chat não é conversar genericamente com a Logcomex.

Ele deve entender a simulação atual.

Criar `context-builder.ts` para transformar o resultado em um contexto enxuto:

```text
cargo
clearance
routes
eligibility
cost
comparison
window48h
missingData
evidences
```

Não enviar objetos gigantes sem necessidade.

Não enviar:

```text
segredos
tokens
dados internos irrelevantes
stack traces
```

Exemplo conceitual:

```text
OMEGASYNC_RESULT
- rota A: INDETERMINADA
- motivo: ...
- custo conhecido: ...
- dados faltantes: ...
- evidências: ...

USER_QUESTION
"Por que essa rota ficou indeterminada?"
```

---

# 13. FASE 4 — Chat Service

Criar o serviço de aplicação responsável por decidir quando usar:

```text
somente contexto OmegaSync
ou
MCP Logcomex
```

Para o protótipo, NÃO construir um roteador de IA complexo.

Pode usar estratégia simples:

```text
a pergunta sempre recebe contexto OmegaSync
+
é enviada ao agente Logcomex quando o usuário abriu o chat
```

Mas o prompt/contexto deve dizer explicitamente:

```text
não altere o resultado calculado pelo OmegaSync
não invente dados ausentes
separe resultado do motor de orientação externa
se não houver informação suficiente, diga isso
```

---

# 14. Contrato interno do chat

Criar contrato próprio do OmegaSync.

Request conceitual:

```json
{
  "message": "Por que essa rota ficou indeterminada?",
  "simulation": {}
}
```

Response conceitual:

```json
{
  "answer": "...",
  "source": "LOGCOMEX_COMPANY_AGENT",
  "degraded": false,
  "warnings": []
}
```

Não devolver o payload bruto do MCP ao frontend.

Possíveis `source`:

```text
OMEGASYNC
LOGCOMEX_COMPANY_AGENT
LOGCOMEX_PUBLIC_AGENT
FALLBACK
```

Ajustar nomes aos padrões atuais do projeto.

---

# 15. Route Handler

Criar:

```text
POST /api/assistant/chat
```

Responsabilidades:

```text
validar JSON
validar message
limitar tamanho
normalizar contexto
chamar ChatService
mapear erros
retornar DTO
```

Não colocar:

```text
regra de negócio
decisão de rota
parsing aduaneiro
heurística NCM
```

no Route Handler.

---

# 16. FASE 5 — UI do chat

Consultar `DESIGN.md` antes de editar UI.

Criar um chat compatível com o visual OmegaSync.

Para o protótipo, funcionalidades mínimas:

```text
abrir/fechar painel
campo de mensagem
enviar
estado "consultando..."
resposta
erro
retry manual
```

Acessibilidade:

```text
label no input
botão acessível
aria-live para novas respostas
focus visível
Escape se for drawer/modal
restauração de foco quando aplicável
mobile utilizável
```

Não precisa:

```text
streaming de tokens
markdown avançado
histórico persistente
multi-chat
upload no chat já na primeira entrega
```

---

# 17. Como apresentar a origem das respostas

Toda resposta deve deixar claro o tipo de informação.

Exemplos de labels:

```text
OmegaSync
Logcomex
Orientação geral
```

Se a resposta for externa e não estruturada:

```text
"Contexto consultivo — não altera automaticamente a decisão do motor."
```

Se não houver confirmação:

```text
"Não foi possível confirmar essa informação com os dados disponíveis."
```

Evitar linguagem de falsa certeza.

---

# 18. FASE 6 — Testar análise documental via MCP

Somente depois do chat básico estar funcionando.

Usar documento real autorizado ou documento sanitizado:

```text
BL
Invoice
Packing List
```

Descobrir se o MCP/tool aceita:

```text
attachment
URL
resource
base64
outro mecanismo
```

Não presumir.

Registrar o schema observado.

## Critério A — resposta estruturada

Se houver algo semelhante a:

```json
{
  "origem": "...",
  "destino": "...",
  "peso_bruto": 0,
  "valor_fob": 0,
  "itens": []
}
```

validado por schema:

```text
criar adapter MCP
→ DocumentAnalysisPort
→ DocumentEnrichment
```

## Critério B — somente texto

Se retornar texto:

```text
não converter automaticamente para domínio
não usar regex
não confiar em JSON embutido em texto sem contrato
```

Usar como contexto do chat e registrar:

```text
integração documental determinística adiada
```

---

# 19. FASE 7 — Testar tracking via MCP

Mesmo procedimento.

Usar identificador autorizado:

```text
container
BL
booking
AWB
```

Se estruturado:

```text
MCP adapter
→ TrackingPort
→ TrackingContext
```

Se texto:

```text
chat/context only
```

---

# 20. Tratamento administrativo / órgão anuente

Durante a descoberta MCP, procurar tools relacionadas a:

```text
NCM
DUIMP
Siscomex
Portal Único
tratamento administrativo
LPCO
anuência
órgão anuente
catálogo de produtos
```

Se existir tool estruturada:

```text
capturar schema
executar caso real/teste autorizado
avaliar provenance
criar contrato separado
```

Não encaixar à força em `DocumentAnalysisPort`.

Criar porta própria caso necessário, por exemplo conceitualmente:

```text
AdministrativeTreatmentPort
```

SOMENTE após confirmar o contrato.

Se não existir:

```text
chat pode orientar
motor permanece UNKNOWN
```

---

# 21. Fallback

Hoje já existem fallbacks de análise documental e tracking.

Não confundir:

```text
falha MCP
```

com:

```text
Logcomex retornou "nenhum resultado"
```

Estados desejáveis:

```text
SUCCESS
NO_RESULTS
UNAVAILABLE
TIMEOUT
UNAUTHORIZED
PROVIDER_ERROR
INVALID_RESPONSE
```

Para o protótipo não é necessário criar uma infraestrutura gigantesca, mas pelo menos distinguir:

```text
sem resultado
vs
integração indisponível
```

---

# 22. Segurança

Obrigatório:

```text
MCP server-side
tokens server-side
sem segredos em NEXT_PUBLIC_*
sem token no localStorage
sem token em response
sem token em console
sem payload sensível em logs
```

Se houver OAuth:

```text
armazenar token somente no mecanismo seguro definido
pelo fluxo real utilizado
```

Não criar um sistema de autenticação próprio se o MCP já fornece o fluxo.

---

# 23. Configuração sugerida

Somente depois de descobrir o fluxo real.

Pode haver algo conceitual como:

```env
LOGCOMEX_MCP_URL=https://mcp.logcomex.ai/
LOGCOMEX_MCP_TIMEOUT_MS=...
LOGCOMEX_MCP_POLL_INTERVAL_MS=...
```

Não criar variáveis de credenciais fictícias.

Se OAuth não exigir chave manual:

```text
não inventar LOGCOMEX_API_KEY
```

---

# 24. Dependências existentes que NÃO devem ser descartadas

Preservar a intenção de:

```text
DocumentAnalysisPort
TrackingPort
DocumentEnrichment
TrackingContext
fallbackEnrichment
trackingFallback
resilient wrappers
```

O MCP é um novo adapter de infraestrutura.

Não reescrever domínio por causa do fornecedor.

---

# 25. Agent API HTTP — estado

Manter documentado como:

```text
DEFERRED / FALLBACK FUTURO
```

Motivo:

```text
provider relatou instabilidade
```

Não apagar informações já levantadas sobre:

```text
agent_id
prompt_ids
Swagger
Bearer API key
async/replay
```

Mas não usar isso como caminho crítico do protótipo.

---

# 26. O que NÃO implementar nesta rodada

```text
Carteira completa
Análise de Importações completa
Análise de Embarques completa
dashboard de tracking
observabilidade de produção
rate limit sofisticado
retry exponencial complexo
Playwright apenas por completude
CI avançado
persistência de chats
streaming de tokens
RAG próprio
vector database
cópia local de dados Logcomex
```

Só fazer algo dessa lista se surgir necessidade objetiva para o protótipo funcionar.

---

# 27. Branch proposta

Criar após sincronizar `main`:

```text
feat/logcomex-mcp-assistant
```

Antes:

```bash
git checkout main
git pull
git status
```

Não iniciar se houver alterações locais não compreendidas.

---

# 28. Commits sugeridos

Não fazer commit gigante.

Sequência sugerida:

```text
feat(logcomex): adiciona cliente MCP e descoberta de tools

feat(logcomex): integra agente da empresa via MCP

feat(assistant): adiciona serviço de chat com contexto da simulação

feat(api): expõe endpoint do assistente

feat(ui): adiciona painel de chat ao diagnóstico

test(logcomex): cobre cliente e estados degradados

test(assistant): cobre contrato e contexto do chat

docs(logcomex): documenta capacidades MCP confirmadas
```

Ajustar conforme o que realmente for implementado.

---

# 29. Testes mínimos

## Unitários

Cobrir:

```text
context builder
validação do DTO do chat
erro do MCP
timeout
NO_RESULTS
UNAVAILABLE
resposta final
task pending → complete
```

Mockar a borda MCP.

Não exigir Logcomex real para `npm run test`.

## Integração manual

Executar separadamente com MCP real:

```text
1. connect
2. list tools
3. list agents
4. chat_with_agent
5. task polling se necessário
6. chat_free se aplicável
```

Não colocar credenciais reais em fixtures.

---

# 30. Validação obrigatória

Antes do push:

```bash
npm run test
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Também realizar manualmente:

```text
abrir Diagnóstico
rodar simulação
abrir chat
perguntar sobre a simulação
receber resposta
simular indisponibilidade MCP
confirmar fallback/erro amigável
```

Não declarar integração funcionando sem testar o MCP real pelo menos uma vez.

---

# 31. Definition of Done — protótipo MCP

A feature pode ser considerada pronta quando:

```text
[ ] cliente conecta ao MCP real
[ ] discovery lista tools reais
[ ] agente Logcomex real pode ser consultado
[ ] async/polling funciona quando necessário
[ ] /api/assistant/chat existe
[ ] frontend nunca acessa MCP diretamente
[ ] chat recebe contexto da simulação
[ ] chat explica resultado sem alterar decisão
[ ] resposta externa é identificada como Logcomex/contexto
[ ] falha do MCP não quebra a simulação
[ ] ausência de dado não vira false/zero
[ ] tratamento administrativo textual não altera motor
[ ] secrets/tokens não chegam ao frontend
[ ] testes locais passam
[ ] build passa
[ ] documentação foi atualizada
```

Análise documental e tracking MCP NÃO são obrigatórios para marcar o chat básico como funcional.

Eles viram extensão da mesma branch apenas se o usuário autorizar após o primeiro fluxo funcionar.

---

# 32. Ponto de parada obrigatório

Após concluir:

```text
MCP client
+
agent connection
+
chat service
+
API route
+
ChatPanel
```

PARAR.

Mostrar ao usuário:

```text
tools descobertas
agente utilizado
modo de autenticação
exemplo de resposta
limitações encontradas
arquivos alterados
testes executados
```

Somente depois continuar para:

```text
document analysis via MCP
tracking via MCP
treatment/anuência discovery
```

---

# 33. Atualização documental ao final

Atualizar:

```text
LACUNAS-REVIEW.md
README.md
FONTES.md
```

somente com fatos realmente confirmados.

Registrar claramente:

```text
MCP endpoint efetivamente usado
data da validação
tools observadas
modo de autenticação observado
quais respostas são estruturadas
quais são texto livre
quais integrações alimentam motor
quais servem apenas ao chat
```

Não registrar capacidade declarada como capacidade comprovada.

---

# 34. Fontes externas de implementação

## Endpoint fornecido diretamente pela plataforma Logcomex do projeto

```text
https://mcp.logcomex.ai/
```

## Página pública Logcomex MCP

```text
https://logcomex.ai/mcp
```

A página pública informa o uso do MCP em clientes compatíveis, free/public agent e acesso autenticado por OAuth 2.0 para company agents.

## SDK oficial TypeScript MCP

```text
https://ts.sdk.modelcontextprotocol.io/v2/
```

Cliente:

```text
@modelcontextprotocol/client
```

Transporte HTTP:

```text
StreamableHTTPClientTransport
```

---

# 35. Resumo operacional para o Claude

```text
1. Não implemente Agent API HTTP agora.
2. Leia AGENTS/PLANEJAMENTO/FONTES/DESIGN.
3. Inspecione o código atual inteiro relacionado à Logcomex.
4. Crie branch feat/logcomex-mcp-assistant.
5. Teste handshake em https://mcp.logcomex.ai/.
6. Faça discovery real das tools.
7. Descubra o fluxo real de auth; não invente OAuth.
8. Implemente cliente MCP server-side.
9. Encapsule list_agents/chat_with_agent/get_task_status conforme tools reais.
10. Crie ChatService.
11. Passe contexto da simulação para o chat.
12. Crie POST /api/assistant/chat.
13. Crie ChatPanel seguindo DESIGN.md.
14. Trate falhas sem quebrar o motor.
15. Não use texto livre do MCP para alterar elegibilidade.
16. Rode todos os testes/build.
17. Pare e mostre o resultado antes de integrar documentos/tracking.
```

---

# 36. Princípio final

O objetivo da integração é:

```text
Logcomex amplia o contexto.
OmegaSync mantém a decisão.
```

No protótipo:

```text
MCP = assistente + contexto externo
Motor OmegaSync = decisão determinística
```

Não misturar essas responsabilidades.
