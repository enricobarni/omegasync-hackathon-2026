# OmegaSync — Plano de Execução para o Agente

> **Objetivo deste arquivo:** instruir o agente de código sobre **o que fazer, em qual ordem, o que reaproveitar do projeto anterior e quando parar**.
>
> Este documento não é apenas um roadmap humano. O agente deve tratá-lo como **instrução operacional complementar ao `AGENTS.md`**.

---

## 0. Regra principal de execução

O desenvolvimento deve acontecer **uma etapa por vez**.

Cada etapa:

1. usa uma branch própria;
2. pode conter vários commits relevantes;
3. termina com validação completa;
4. termina com `push`;
5. **para após o push**;
6. aguarda o usuário abrir o PR e fazer o merge manualmente;
7. só continua quando o usuário disser explicitamente que o PR foi mergeado e autorizar a próxima etapa.

Nunca iniciar automaticamente a etapa seguinte.

Formato de branch:

```text
feat/<nome-da-etapa>
```

Formato de commit:

```text
<tipo>(<area>): <descrição em português>
```

Exemplos:

```text
feat(domain): define contratos centrais do motor
feat(engine): implementa elegibilidade de rotas
test(engine): adiciona cobertura para estados indeterminados
feat(logcomex): integra análise documental
```

---

# 1. Repositório anterior é referência obrigatória

Antes de implementar qualquer etapa relacionada ao motor, custos, anuência, tarifas, fricção,
simulação ou integração Logcomex, o agente deve **consultar o repositório anterior**:

```text
https://github.com/enricobarni/porto-hack-2026-omegasync
```

Branch de referência:

```text
motor-pre-logcomex
```

Snapshot conhecido em 19/09/2026:

```text
d703bb328c4bc635b639e7e8c5642f6cecee85cf
```

## O que pode ser reaproveitado

O agente deve reaproveitar quando ainda fizer sentido:

- decisões arquiteturais;
- conceitos de domínio;
- fórmulas;
- datasets;
- tarifas;
- estrutura de proveniência;
- estados explícitos de informação;
- cenários A–F como conhecimento de domínio;
- estratégia de fallback;
- separação entre motor e integrações;
- casos de teste conceituais;
- evidências de pesquisa;
- tratamento de `null` versus `0`;
- lógica de custo conhecida;
- enumerações úteis;
- dados e fontes documentados.

## O que NÃO deve ser feito

O novo repositório foi criado durante a maratona.

Portanto:

- não copiar arquivos inteiros do repositório anterior;
- não fazer cherry-pick de commits antigos;
- não preservar histórico Git antigo;
- não colar implementação antiga sem reavaliar;
- não assumir que uma regra antiga continua correta só porque já existia.

O agente deve usar o projeto anterior como **baseline técnico e de conhecimento**, e reimplementar
no novo projeto de acordo com o desafio e a mentoria atual.

## Arquivos prioritários para consulta no repo anterior

```text
FONTES.md

src/lib/engine/types.ts
src/lib/engine/anuencia.ts
src/lib/engine/cascade.ts
src/lib/engine/costs.ts
src/lib/engine/cost-comparison.ts
src/lib/engine/friction.ts
src/lib/engine/premises.ts
src/lib/engine/input.ts
src/lib/engine/engine.ts

src/lib/data/tariffs.json
src/lib/data/tariffs.ts
src/lib/data/friction.ts
src/lib/data/ncm-anuentes.json

src/lib/logcomex/fallback.ts
```

Também consultar, quando disponíveis no contexto de trabalho:

```text
parametros-motor-omegasync.md
mvp-omegasync-atualizado.md
contexto-completo-omegasync.md
ideia_operacao_portuaria_zona_primaria_secundaria.pdf
```

O arquivo `FONTES-CODIGO-OMEGASYNC.md` deste novo projeto é a referência central de dados e fontes.

---

# 2. Direção atual do produto

A mentoria validou o uso do motor, mas ampliou sua função.

O OmegaSync não deve nascer apenas como:

```text
Cenário A vs Cenário C
```

Ele deve evoluir para:

```text
Carga
  ↓
Motor de elegibilidade
  ↓
Quais rotas são possíveis?
  ↓
Motor de comparação
  ↓
Quanto custa cada rota?
Quais restrições existem?
Qual prazo?
Qual distância?
Qual disponibilidade?
```

O motor deve considerar, quando aplicável:

```text
Retirada direta
Permanência em Zona Primária
Transferência por DTA
Recinto alfandegado em Zona Secundária
Retroporto
Entreposto Aduaneiro
```

A arquitetura deve preservar o conhecimento útil do motor anterior sem ficar presa ao modelo
antigo A × C.

---

# 3. Arquitetura obrigatória

Separação mínima:

```text
Presentation / UI
        ↓
Application / orchestration
        ↓
Domain
   ├── eligibility engine
   └── route comparison engine
        ↓
Data / integrations
   ├── tariff datasets
   ├── Logcomex
   ├── official sources
   └── operator/user inputs
```

## Regras arquiteturais

- domínio não importa React;
- domínio não importa Next.js;
- domínio não chama Logcomex;
- domínio não acessa rede;
- frontend não replica regras do motor;
- Route Handler não contém regra de negócio;
- integrações externas fornecem dados, não decidem;
- cada valor externo relevante mantém proveniência;
- resultado incompleto permanece incompleto.

---

# 4. Conhecimento do motor anterior que deve ser preservado

O agente deve considerar estes conceitos como baseline de projeto.

## 4.1 Estados OEA usados anteriormente

```text
NAO_OEA
ESSENCIAL
QUALIFICADO
EXCELENCIA
```

## 4.2 Tipos de carga

```text
FCL
LCL
```

## 4.3 Canais aduaneiros

```text
NAO_REVELADO
VERDE
AMARELO
VERMELHO
CINZA
```

## 4.4 Estados de anuência usados anteriormente

```text
SEM_ANUENCIA
AUTOMATICA
NAO_AUTOMATICA_POSTERIOR
PREVIA_AO_EMBARQUE
IMPEDIMENTO
```

## 4.5 Órgãos tratados

```text
ANVISA
MAPA_VIGIAGRO
INMETRO
IBAMA
ANP
DECEX
OUTRO
```

## 4.6 Cenários A–F anteriores

```text
A — sobre águas + retirada direta
B — poderia retirar diretamente, mas há restrição financeira/caixa
C — falta de estrutura/janela/anuência leva ao uso de recinto/retroporto
D — entrepostagem aduaneira
E — LCL / desconsolidação
F — canal aduaneiro não verde / permanência em terminal
```

Esses cenários continuam úteis como **conhecimento de domínio e explicação**, mas o novo motor
não precisa forçar toda rota operacional a caber exatamente em A–F.

A nova modelagem pode usar:

```text
cenário comportamental
+
rota operacional
```

como conceitos separados.

---

# 5. Dados econômicos do repo anterior que devem ser reaproveitados como baseline

O agente deve consultar `FONTES-CODIGO-OMEGASYNC.md` antes de usar qualquer número.

Baseline usado anteriormente:

```text
Descarga Direta Santos Brasil
alíquota: 0,54% do CIF
mínimo: R$ 1.063,08

DP World Santos — armazenagem
período: 4 dias
1º período: 0,60%
2º período: 1,30%
subsequentes: 2,00%

Ecoporto Santos — armazenagem
período: 8 dias
1º período: 1,20%
2º período: 2,10%
subsequentes: 3,90%
```

Captura original do dataset:

```text
2026-08-31
```

**Atenção:** o material de parâmetros do projeto anterior registra uma ressalva sobre a tabela
Santos Brasil capturada ter relação com Imbituba/SC. O agente deve verificar a origem exata antes
de usar o valor de Descarga Direta como fato aplicável ao Tecon Santos.

Nenhum número deve ser promovido para produção sem conferência de fonte e escopo.

---

# 6. Fórmulas úteis do motor anterior

O agente deve preservar a lógica conceitual, mas pode generalizá-la para múltiplas rotas.

## Caminho A anterior

```text
Custo A =
  custo de capital da antecipação tributária
+ descarga direta
+ transporte cais → destino
```

## Caminho C anterior

```text
Custo C =
  SSE, se aplicável
+ transporte cais → retroporto
+ armazenagem ad valorem
+ custo de anuência, quando conhecido
+ capatazia / movimentação
+ transporte retroporto → destino
+ custo do tempo parado
```

## Regra obrigatória

Se qualquer componente necessário for desconhecido:

```text
total = null
subtotalConhecido = soma dos componentes conhecidos
completo = false
```

Nunca transformar ausência em zero.

---

# 7. Etapas de implementação

---

## ETAPA 1 — Fundação do domínio

Branch:

```text
feat/domain-foundation
```

### O agente deve

1. inspecionar os tipos do motor anterior;
2. listar quais tipos ainda fazem sentido;
3. criar a nova modelagem sem copiar o arquivo antigo;
4. representar explicitamente:
   - carga;
   - zona aduaneira;
   - recinto;
   - rota;
   - proveniência;
   - estado de informação;
   - componente de custo;
   - disponibilidade;
   - possibilidade de DTA;
5. manter distinção entre:
   - conhecido;
   - desconhecido;
   - não aplicável.

### Deve reaproveitar do antigo

- `EvidenciaDado`;
- ideia de `ValorMonetarioRastreavel`;
- enums de OEA, carga, canal e anuência quando ainda aplicáveis;
- discriminated unions;
- `null != 0`.

### Testes mínimos

- zero conhecido;
- valor desconhecido;
- não aplicável;
- proveniência;
- rota sem dado suficiente.

### Final da etapa

Validar, commitar, push e parar.

---

## ETAPA 2 — Catálogo de rotas e recintos

Branch:

```text
feat/route-catalog
```

### O agente deve

Criar estruturas que permitam representar:

```text
Zona Primária
Zona Secundária
Terminal
Recinto alfandegado
Porto seco
Retroporto
Entreposto, quando aplicável
```

Uma rota deve conseguir informar:

```text
origem
destino
necessita DTA?
aceita tipo de carga?
disponibilidade
restrições
fonte dos dados
```

Não inventar disponibilidade.

---

## ETAPA 3 — Motor de elegibilidade

Branch:

```text
feat/eligibility-engine
```

### Pergunta que deve responder

```text
Quais rotas podem ser executadas por esta carga?
```

### Reaproveitar do motor anterior

A lógica de cascata anterior deve ser analisada:

```text
LCL
ANUENCIA
CANAL
ENTREPOSTAGEM
CAIXA
ESTRUTURA
JANELA_48H
```

Mas o agente deve separar:

```text
restrição que inviabiliza uma rota
```

de:

```text
fator comportamental que torna outra rota mais provável
```

A saída preferida é algo como:

```text
VIAVEL
INVIAVEL
INDETERMINADA
```

com:

```text
motivo
evidência
dados faltantes
```

Não decidir simplesmente um cenário A–F se várias rotas continuam possíveis.

---

## ETAPA 4 — Dados tarifários

Branch:

```text
feat/tariff-data
```

### O agente deve

1. consultar os datasets do repo anterior;
2. consultar `FONTES-CODIGO-OMEGASYNC.md`;
3. recriar dataset versionado;
4. preservar proveniência;
5. registrar vigência/captura;
6. não esconder ressalvas.

### Baseline inicial a conferir

```text
DP World Santos
Ecoporto Santos
Descarga Direta Santos Brasil
```

### Não fazer

```ts
const STORAGE = 0.006;
```

sem terminal, vigência, fonte e regra.

---

## ETAPA 5 — Motor de custos por rota

Branch:

```text
feat/route-cost-engine
```

### Reaproveitar do antigo

Conceitos de:

```text
calcularArmazenagemAdValorem
calcularCustoTransporte
calcularCustoCapitalAntecipacao
subtotalConhecido
total null quando incompleto
```

### Generalizar

Em vez de apenas:

```text
Caminho A
Caminho C
```

permitir:

```text
RouteCostResult
```

para qualquer rota cadastrada.

### Componentes potenciais

```text
descarga
armazenagem
movimentação
transporte
DTA
SSE
anuência
capatazia
custo de capital
tempo parado
outros componentes explícitos
```

---

## ETAPA 6 — Comparador de rotas

Branch:

```text
feat/route-comparison
```

### O agente deve

Comparar apenas informações comparáveis.

Pode produzir:

```text
menor custo conhecido
menor custo total, se todos completos
menor distância
menor prazo
rotas indisponíveis
rotas indeterminadas
```

Não criar score arbitrário.

Não esconder custo incompleto.

---

## ETAPA 7 — Regra de 48h

Branch:

```text
feat/cargo-yard-window
```

### O agente deve

Consultar primeiro as fontes históricas usadas no repo anterior:

```text
IN RFB nº 248/2002, art. 71 §3º
Portaria ALF/STS nº 209/2026
Portaria ALF/STS nº 210/2026
```

Reaproveitar os detalhes já pesquisados apenas após conferir a fonte.

Não tratar a regra como universal para toda carga.

Modelar explicitamente:

```text
aplicavel
não aplicavel
indeterminado
```

quando necessário.

---

## ETAPA 8 — Tratamento administrativo / anuência

Branch:

```text
feat/customs-treatment
```

### O agente deve

Preservar a descoberta central do projeto anterior:

```text
canal verde da Receita != carga necessariamente liberada
```

Anuência é independente do canal aduaneiro.

### Reaproveitar

- estados de anuência;
- lista de órgãos;
- status pendente;
- padrão de resolver dado antes de executar regra;
- fallback explícito.

### Não reaproveitar como verdade

O arquivo antigo:

```text
src/lib/data/ncm-anuentes.json
```

está vazio.

Não inventar mapeamentos NCM → órgão.

A fonte oficial preferida é Portal Único/Siscomex.

---

## ETAPA 9 — Serviço de simulação

Branch:

```text
feat/simulation-service
```

### O agente deve orquestrar

```text
input
→ normalização
→ enriquecimento
→ elegibilidade
→ cálculo das rotas
→ comparação
→ evidências
→ response
```

A aplicação coordena.

O domínio decide.

Integrações fornecem dados.

---

## ETAPA 10 — API de simulação

Branch:

```text
feat/simulation-api
```

### O agente deve

Criar Route Handler fina para:

```text
POST /api/simulations
```

Responsabilidades:

- validar;
- normalizar;
- chamar application service;
- retornar status HTTP;
- não duplicar domínio.

---

## ETAPA 11 — Logcomex: análise documental

Branch:

```text
feat/logcomex-document-analysis
```

### Prioridade

Alta.

### O agente deve usar a API para enriquecer

```text
origem
destino
peso
FOB
frete
seguro
itens
NCM sugerida
confiança da NCM
divergências
riscos documentais
```

### Regra

```text
ncm_sugerido != ncm_confirmado
```

A UI deve permitir confirmação/correção.

Logcomex não decide rota.

---

## ETAPA 12 — Frontend do diagnóstico

Branch:

```text
feat/diagnosis-ui
```

### O agente deve mostrar

- dados da carga;
- dados enriquecidos;
- rotas;
- motivo da elegibilidade;
- custos;
- subtotal conhecido;
- total quando completo;
- dados faltantes;
- fontes;
- avisos;
- disponibilidade;
- DTA;
- prazo/distância.

Não duplicar regra no React.

---

## ETAPA 13 — Tracking Logcomex

Branch:

```text
feat/logcomex-tracking
```

### Prioridade

Média.

Usar como contexto operacional.

Não interpretar texto livre para gerar fatos determinísticos sem contrato estruturado.

---

## ETAPA 14 — Inteligência de mercado

Branch:

```text
feat/portfolio-intelligence
```

Usar, se os endpoints reais confirmarem retorno estruturado:

```text
Brasil | Análise de Importações
Brasil | Análise de Embarques
```

Objetivo:

```text
mercado
volume
NCM
FOB
frete
origem
porto
players
TEUs
evolução
```

Esses dados não substituem dados individuais da carga.

---

## ETAPA 15 — Entreposto Aduaneiro

Branch:

```text
feat/customs-warehouse-route
```

Modelar somente depois de validar:

- condições de admissão;
- suspensão tributária;
- DTA;
- recintos habilitados;
- custos;
- prazo;
- destinação/nacionalização posterior.

Não tratar entreposto como sinônimo de retroporto.

---

## ETAPA 16 — Evidência e explicabilidade

Branch:

```text
feat/decision-evidence
```

Cada saída importante deve indicar:

```text
origem
referência
confiança
vigência/data
premissa, se for premissa
```

Reaproveitar o conceito anterior:

```text
TABELA_PUBLICA
PESQUISA_CAMPO
PREMISSA_SIMULACAO
LOGCOMEX
USUARIO
FALLBACK_OFFLINE
```

e evoluir se necessário.

---

## ETAPA 17 — Hardening da demo

Branch:

```text
feat/demo-hardening
```

Adicionar:

- falha de integração;
- timeout;
- dados ausentes;
- estados vazios;
- testes E2E essenciais;
- responsividade;
- revisão de fontes;
- revisão dos dados reais usados na demo;
- documentação da execução.

---

# 8. Ordem mínima recomendada

Se o prazo estiver apertado, priorizar:

```text
1. domain-foundation
2. route-catalog
3. eligibility-engine
4. tariff-data
5. route-cost-engine
6. route-comparison
7. simulation-service
8. simulation-api
9. logcomex-document-analysis
10. diagnosis-ui
11. decision-evidence
12. demo-hardening
```

Depois:

```text
tracking
portfolio
entreposto completo
outras integrações
```

---

# 9. Dados de pesquisa do motor anterior que podem ser reutilizados como evidência

O agente pode reaproveitar estes dados **como evidência identificada**, nunca como probabilidade universal:

```text
ESTRUTURA:
9 de 17 respostas da survey indicaram falta de estrutura como bloqueio dominante.

CAIXA:
há evidência institucional N=1 de fluxo de caixa como fator principal.

ANUÊNCIA:
pesquisa observou aproximadamente 10 dias em um contexto de análise de órgão anuente;
há evidência qualitativa de que cargas sujeitas à anuência tendem ao retroporto devido ao free time.

JANELA_48H:
há N=1 indicando problema com veículo de retirada como causa de reagendamento;
há N=1 indicando custo adicional após perda da janela, sem valor capturado.
```

Esses dados devem continuar rotulados como pesquisa de campo.

---

# 10. Definition of Done de qualquer etapa

Antes de push:

```text
[ ] escopo da branch cumprido
[ ] repo anterior consultado quando relevante
[ ] FONTES-CODIGO-OMEGASYNC.md consultado quando há regra/dado externo
[ ] nenhum dado inventado
[ ] nenhum segredo versionado
[ ] testes relevantes passando
[ ] npx tsc --noEmit passando
[ ] lint passando
[ ] build passando quando aplicável
[ ] git diff --check passando
[ ] commits relevantes e legíveis
[ ] branch enviada ao remoto
```

Depois do push:

```text
PARAR
```

Informar ao usuário:

- branch;
- commits;
- arquivos principais;
- o que foi implementado;
- o que foi reaproveitado conceitualmente do repo antigo;
- testes;
- limitações;
- pontos ainda pendentes de fonte.

Aguardar explicitamente o merge e autorização para a próxima etapa.
