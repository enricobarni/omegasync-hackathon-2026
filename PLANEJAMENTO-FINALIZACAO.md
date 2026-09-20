# OmegaSync — Planejamento Final do Protótipo

> **Objetivo:** fechar o OmegaSync como um **protótipo funcional, demonstrável e coerente**, sem tentar transformá-lo em produto production-ready.
>
> Este documento define o que ainda precisa ser feito a partir do estado atual da `main` após a integração MCP.
>
> Prioridade:
>
> ```text
> funcionalidade da demo
> > coerência da decisão
> > integração real necessária
> > polimento
> > hardening de produção
> ```

---

# 1. Estado atual

O protótipo já possui:

```text
[OK] formulário de Diagnóstico
[OK] POST /api/simulations
[OK] motor determinístico
[OK] elegibilidade de rotas
[OK] comparação
[OK] custos com UNKNOWN explícito
[OK] evidências/proveniência
[OK] UI de resultado
[OK] MCP Logcomex real conectado
[OK] chat público via chat_free
[OK] POST /api/assistant/chat
[OK] ChatPanel
[OK] contexto da simulação enviado ao chat
[OK] CI com test/typecheck/lint/build
```

Ainda faltam os pontos que impedem considerar o protótipo realmente fechado:

```text
[ ] continuidade de conversa do chat (conversationId)
[ ] diagnóstico demonstrando melhor o valor do produto
[ ] rotas/custos/prazo/distância/DTA/disponibilidade visíveis e coerentes
[ ] apresentação/semântica da janela de 48h
[ ] agente Logcomex da empresa via OAuth
[ ] teste ponta a ponta da demo
[ ] roteiro final de demonstração
[ ] freeze do escopo
```

---

# 2. O que NÃO é necessário para fechar o protótipo

Não implementar nesta fase, salvo bloqueio real do fluxo principal:

```text
Carteira completa
tela separada de Rotas
tracking completo
análise documental completa
Análise de Importações completa
Análise de Embarques completa
RAG
vector database
persistência de histórico de chat
streaming de tokens
observabilidade de produção
retry sofisticado
rate limiting avançado
Playwright obrigatório
infraestrutura enterprise
todas as lacunas externas do projeto
```

Esses itens podem ser apresentados como evolução futura.

---

# 3. Regras obrigatórias

Antes de qualquer implementação, revisar:

```text
AGENTS.md
PLANEJAMENTO.md
FONTES.md
DESIGN.md
LACUNAS-REVIEW.md
PLANEJAMENTO-MCP.md
este arquivo
```

Preservar:

```text
UNKNOWN != false
UNKNOWN != zero
UNKNOWN != NOT_APPLICABLE

NCM sugerida != NCM confirmada

texto livre Logcomex != fato determinístico

premissa de demo != fato operacional real

Logcomex fornece contexto/dados
OmegaSync continua decidindo
```

Nunca inventar:

```text
tarifa
recinto
distância
prazo
disponibilidade
DTA
LPCO
órgão anuente
regra aduaneira
dado de Logcomex
```

Quando algo não existir:

```text
UNKNOWN
```

ou:

```text
PREMISSA_SIMULACAO
```

explicitamente rotulada.

---

# 4. ETAPA FINAL 1 — Continuidade do chat

Branch sugerida:

```text
fix/assistant-conversation
```

## Problema atual

O backend já suporta `conversationId` e o MCP retorna `conversation_id`, mas o `ChatPanel` ainda não preserva esse valor entre mensagens.

Hoje:

```text
pergunta 1 → conversa A
pergunta 2 → nova conversa
```

Isso prejudica perguntas de sequência.

Exemplo:

```text
"Liste os 5 maiores importadores da NCM X."
"E quais deles importaram mais da China?"
```

## Implementar

No `ChatPanel`:

```text
state conversationId
```

Enviar no request:

```json
{
  "message": "...",
  "simulation": {},
  "conversationId": "..."
}
```

Quando a resposta devolver `conversationId`, salvar para a próxima mensagem.

## Regras

Não é necessário persistir conversa após refresh da página.

Não usar localStorage para token Logcomex.

## Definition of Done

```text
[ ] primeira mensagem sem conversationId funciona
[ ] segunda mensagem recebe conversationId anterior
[ ] follow-up mantém contexto
[ ] chat_free continua funcionando
[ ] fallback continua funcionando
[ ] npm run test passa
[ ] npx tsc --noEmit passa
[ ] npm run lint passa
[ ] npm run build passa
```

Push e parar para PR.

---

# 5. ETAPA FINAL 2 — Fechar o Diagnóstico como núcleo da demo

Branch sugerida:

```text
feat/prototype-diagnosis
```

Esta é a etapa mais importante.

O fluxo deve demonstrar:

```text
entrada
→ avaliação
→ rotas
→ custos/trade-offs
→ dados faltantes
→ evidências
→ explicação
```

---

## 5.1 Formulário

O formulário atual já está alinhado com o contrato atual da API.

Campos existentes:

```text
NCM
CIF
tipo de carga
status OEA
canal aduaneiro

necessita entrepostagem
operação carga-pátio
recinto discriminado no agendamento
caixa para antecipação
estrutura sincronizada
```

Não adicionar campos apenas por completude.

Adicionar campo novo SOMENTE se for indispensável para uma decisão que precisa aparecer na demo.

---

## 5.2 Janela de 48h

Problema atual:

`withinBusinessWindow` continua necessário para concluir `VIAVEL / INVIAVEL`, mas o formulário não deve perguntar diretamente:

```text
"A retirada é viável em 48h?"
```

como se o usuário calculasse a própria conclusão.

### Decisão para o protótipo

Antes de codificar, verificar se é possível derivar a janela com dados já disponíveis.

Se NÃO for possível sem implementar calendário operacional complexo:

```text
manter INDETERMINADO
```

e melhorar a explicação na UI.

Exemplo:

```text
Janela de 48h
Aplicável
Viabilidade: indeterminada

Falta:
- informação operacional sobre execução da retirada dentro da janela
```

Isso é aceitável para o protótipo.

Se existir no `FONTES.md` um sinal factual suficiente já validado, usar somente esse dado documentado.

Não criar conclusão artificial.

---

## 5.3 Rotas da demo

Problema atual:

o `DEMO_CATALOG` está muito limitado para demonstrar comparação de alternativas.

### Objetivo

O Diagnóstico deve apresentar pelo menos duas alternativas conceituais quando o modelo atual permitir:

```text
RETIRADA_DIRETA
versus
PERMANENCIA / TRANSFERENCIA
```

### Regra crítica

Não inventar recintos reais nem números.

Se uma rota precisar ser sintética:

```text
marcar como PREMISSA_SIMULACAO
```

e deixar isso explícito na evidência/UI.

Se não houver dados suficientes para criar uma segunda rota coerente sem inventar fatos:

```text
não fabricar a rota
```

Nesse caso, a UI deve deixar claro que a demo está mostrando o motor sobre as rotas atualmente modeladas.

---

## 5.4 Custos

Revisar:

```text
Route.costComponents
routeCostComponents
requiredCostKinds
tariffs
DEMO_CATALOG
```

Objetivo:

quando houver componentes conhecidos:

```text
mostrar subtotal conhecido
mostrar total apenas quando completo
```

Nunca:

```text
UNKNOWN → R$ 0
```

Se uma rota tiver custo incompleto:

```text
Subtotal conhecido
Custos faltantes
Total indeterminado
```

---

## 5.5 Dados que já existem no DTO e devem aparecer na UI

Exibir no `ResultPanel`:

```text
movement
distanceKm
estimatedDurationHours
cost.missingKinds
```

Também revisar comparação de:

```text
custo total
subtotal conhecido
distância
duração
```

Pode usar `details`, badges e linhas compactas para não poluir a tela.

---

## 5.6 DTA

O usuário deve conseguir entender:

```text
a rota exige DTA?
a DTA está resolvida?
a DTA está impedindo conclusão?
```

O DTO/UI precisa expor isso claramente.

Não transformar:

```text
REQUIRED
```

em:

```text
VIAVEL
```

sem resolução.

---

## 5.7 Disponibilidade

A UI deve mostrar:

```text
AVAILABLE
UNAVAILABLE
UNKNOWN
```

em pt-BR.

Se desconhecida:

```text
Disponibilidade não confirmada
```

---

## 5.8 Resultado mínimo esperado

Cada rota deve apresentar conceitualmente:

```text
Nome da rota
Tipo de movimento
Status
DTA
Disponibilidade
Distância
Prazo
Subtotal conhecido
Custo total
Custos faltantes
Motivos
Dados faltantes
Evidências
```

---

## 5.9 Teste manual obrigatório

Executar ao menos um cenário completo:

```text
1. preencher formulário
2. simular
3. obter resultado
4. verificar liberação
5. verificar rota(s)
6. verificar custo
7. verificar dados faltantes
8. verificar evidências
9. abrir assistente
10. perguntar por que uma rota ficou indeterminada
11. confirmar que a resposta usa o resultado como contexto
```

## Definition of Done

```text
[ ] formulário envia todos os campos atuais corretamente
[ ] resultado não apresenta falsa certeza
[ ] janela 48h não inventa conclusão
[ ] DTA aparece
[ ] disponibilidade aparece
[ ] distância aparece
[ ] prazo aparece
[ ] custos faltantes aparecem
[ ] comparação parcial é explicitamente parcial
[ ] evidências continuam auditáveis
[ ] chat consegue explicar o resultado
[ ] npm run test passa
[ ] npx tsc --noEmit passa
[ ] npm run lint passa
[ ] npm run build passa
```

Push e parar para PR.

---

# 6. ETAPA FINAL 3 — OAuth Logcomex e agente da empresa

Branch sugerida:

```text
feat/logcomex-company-agent-oauth
```

## Objetivo

Substituir o uso padrão:

```text
chat_free
```

por:

```text
chat_with_agent
→ Agente PortoHackSantos26-GP07
```

quando houver sessão autenticada.

Sem autenticação:

```text
chat_free
```

continua disponível como fallback.

---

# 7. Fluxo OAuth desejado

```text
Usuário
  ↓
Conectar Logcomex
  ↓
OAuth 2.0 Authorization Code + PKCE
  ↓
Logcomex
  ↓
callback OmegaSync
  ↓
access_token
refresh_token (se fornecido)
  ↓
sessão server-side
  ↓
list_agents
  ↓
Agente PortoHackSantos26-GP07
  ↓
chat_with_agent
```

---

# 8. Discovery OAuth

Não hardcodar endpoints antes de confirmar metadata real.

Usar discovery/metadata real do servidor MCP/OAuth.

Confirmar novamente no ambiente real:

```text
Authorization Code
PKCE S256
```

Não inventar:

```text
client_id
client_secret
token URL
authorization URL
scope
```

---

# 9. Dynamic Client Registration

Se houver `registration_endpoint`, usar o fluxo padrão compatível com MCP/OAuth.

Não criar credenciais fictícias.

Registrar apenas o necessário:

```text
client metadata
redirect URI
PKCE
state
```

---

# 10. Sessão e armazenamento

Tokens devem permanecer server-side.

Nunca usar:

```text
localStorage
sessionStorage do browser para tokens
NEXT_PUBLIC_*
query string permanente
console.log(token)
```

O frontend pode receber apenas algo como:

```json
{
  "authenticated": true,
  "agentName": "Agente PortoHackSantos26-GP07"
}
```

---

# 11. Rotas internas sugeridas

Conceitualmente:

```text
GET /api/logcomex/auth/start
GET /api/logcomex/auth/callback
POST /api/logcomex/auth/logout
GET /api/logcomex/auth/status
```

Ajustar aos padrões reais do projeto.

---

# 12. Estado visual no ChatPanel

Sem login:

```text
Logcomex
Agente público
[ Conectar Logcomex ]
```

Com login:

```text
Logcomex
Agente PortoHackSantos26-GP07
[ Conectado ]
```

Se OAuth falhar:

```text
Não foi possível conectar à conta Logcomex.
Continuando com orientação pública.
```

O chat nunca deve deixar de funcionar apenas porque o agente da empresa falhou.

---

# 13. Seleção do agente

Após autenticar:

```text
list_agents
```

Não pegar cegamente o primeiro agente.

Selecionar explicitamente:

```text
Agente PortoHackSantos26-GP07
```

por ID/nome confirmado.

Se não encontrar:

```text
não usar outro agente silenciosamente
```

usar fallback público.

---

# 14. Refresh token

Se a Logcomex fornecer `refresh_token`, implementar renovação mínima.

Se não fornecer:

```text
sessão expira
→ solicitar reconexão
```

Para o protótipo isso é suficiente.

---

# 15. Definition of Done OAuth

```text
[ ] botão Conectar Logcomex
[ ] OAuth real funciona
[ ] PKCE funciona
[ ] state é validado
[ ] callback recebe token
[ ] token não chega ao frontend
[ ] list_agents funciona
[ ] agente PortoHackSantos26-GP07 é selecionado explicitamente
[ ] chat_with_agent funciona
[ ] UI identifica agente da empresa
[ ] logout funciona
[ ] sessão expirada é tratada
[ ] chat_free continua como fallback
[ ] npm run test passa
[ ] npx tsc --noEmit passa
[ ] npm run lint passa
[ ] npm run build passa
```

Testar com MCP real antes de declarar concluído.

Push e parar para PR.

---

# 16. ETAPA FINAL 4 — Readiness da demo

Branch sugerida:

```text
chore/prototype-demo-readiness
```

Não adicionar features grandes.

Objetivo:

```text
executar tudo como o avaliador verá
```

---

# 17. Cenário oficial de demonstração

Definir UM cenário principal.

O cenário deve conter somente informações:

```text
reais
documentadas
ou explicitamente marcadas como premissa
```

Registrar em:

```text
README.md
ou
DEMO.md
```

Roteiro sugerido:

```text
1. abrir OmegaSync
2. apresentar a carga
3. preencher formulário
4. executar simulação
5. mostrar liberação
6. mostrar rotas
7. mostrar custos conhecidos
8. mostrar dados faltantes
9. mostrar evidências
10. abrir assistente
11. perguntar sobre uma decisão
12. mostrar resposta com contexto
13. fazer pergunta via agente Logcomex
```

---

# 18. Perguntas de teste

Com contexto da simulação:

```text
"Por que esta rota ficou indeterminada?"
```

Consulta Logcomex:

```text
"Liste os 5 maiores importadores brasileiros da NCM 8517.13.00 nos últimos 12 meses, ordenados pelo valor FOB total."
```

Se o agente não tiver capacidade/dado:

```text
mostrar limitação
```

não tratar como falha do OmegaSync.

---

# 19. Teste de falha

Antes da apresentação, testar:

```text
MCP indisponível
OAuth expirado
resultado sem custo completo
anuência não resolvida
rota indeterminada
```

A aplicação deve continuar utilizável.

---

# 20. UI final

Revisar somente pontos visíveis na demo:

```text
textos cortados
labels internos
scroll
mobile básico
drawer
focus
loading
erro
estado vazio
contraste
```

Não iniciar redesign.

---

# 21. Documentação final

Atualizar:

```text
README.md
LACUNAS-REVIEW.md
FONTES.md
```

Registrar:

```text
o que funciona
o que é premissa
o que está bloqueado por fonte
o que é futuro
```

Não apresentar tracking/documental/Carteira como ativos se não estiverem.

---

# 22. Validação técnica final

Executar:

```bash
npm run test
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Confirmar CI verde.

---

# 23. ETAPA FINAL 5 — Freeze do protótipo

Após merge da etapa de readiness:

```text
PARAR DESENVOLVIMENTO DE FEATURES
```

Só corrigir:

```text
bug que quebra demo
bug visual grave
erro de build
erro de autenticação
erro de MCP
erro factual crítico
```

Não adicionar:

```text
nova tela
nova API
novo módulo
novo dashboard
nova integração
```

---

# 24. Checklist definitivo

## Diagnóstico

```text
[ ] formulário funciona
[ ] API funciona
[ ] simulação funciona
[ ] resultado aparece
[ ] rotas são compreensíveis
[ ] DTA aparece
[ ] disponibilidade aparece
[ ] distância aparece
[ ] prazo aparece
[ ] custos conhecidos aparecem
[ ] custos desconhecidos permanecem desconhecidos
[ ] dados faltantes aparecem
[ ] evidências aparecem
[ ] janela 48h não produz falsa certeza
```

## Assistente

```text
[ ] ChatPanel funciona
[ ] conversationId funciona
[ ] simulação atual entra como contexto
[ ] chat_free funciona sem login
[ ] OAuth funciona
[ ] agente PortoHackSantos26-GP07 funciona
[ ] chat_with_agent funciona
[ ] fallback público funciona
[ ] origem da resposta aparece
[ ] texto externo não altera o motor
```

## Demo

```text
[ ] cenário principal definido
[ ] roteiro ensaiado
[ ] perguntas do chat testadas
[ ] MCP real testado
[ ] OAuth real testado
[ ] fallback testado
[ ] CI verde
[ ] build verde
[ ] documentação coerente
```

---

# 25. Critério de conclusão

O protótipo está concluído quando conseguimos fazer ao vivo:

```text
abrir aplicação
↓
preencher uma operação
↓
simular
↓
entender as alternativas
↓
ver custos/restrições/incertezas
↓
ver evidências
↓
abrir assistente
↓
perguntar sobre a decisão
↓
receber explicação
↓
consultar o agente Logcomex da equipe
↓
receber resposta
```

sem precisar:

```text
editar código
abrir terminal
alterar banco
inserir token manual
reiniciar serviço
explicar erro técnico
```

---

# 26. Ordem final de execução

Executar exatamente nesta ordem:

```text
1. fix/assistant-conversation
2. feat/prototype-diagnosis
3. feat/logcomex-company-agent-oauth
4. chore/prototype-demo-readiness
5. freeze
```

Cada etapa:

```text
branch própria
→ implementação
→ testes
→ push
→ PR manual
→ merge manual
→ próxima etapa
```

Não pular diretamente para Carteira, tracking ou documental.

---

# 27. Prioridade absoluta

Se houver conflito de tempo:

```text
1. Diagnóstico funcionar
2. resultado ser coerente
3. chat funcionar
4. agente Logcomex da empresa funcionar
5. demo estar ensaiada
6. polimento
```

O objetivo final não é ter todas as features possíveis.

É ter um protótipo que demonstre claramente:

```text
OmegaSync decide.
Logcomex contextualiza.
O usuário entende o porquê.
```
