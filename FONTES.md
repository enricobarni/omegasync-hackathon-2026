# OmegaSync — Fontes, Dados e Baseline do Motor

> **Objetivo deste arquivo:** ser a referência obrigatória do agente para qualquer número, regra,
> tarifa, evidência ou integração usada no novo OmegaSync.
>
> Este documento incorpora os **mesmos dados e fontes utilizados no repositório anterior**,
> acrescentando as recomendações da mentoria atual.
>
> Regra: **nenhum dado externo deve aparecer no código sem origem rastreável.**

Última revisão: 19/09/2026.

---

# 1. Repositório anterior usado como baseline

Repositório:

```text
https://github.com/enricobarni/porto-hack-2026-omegasync
```

Branch principal de referência técnica:

```text
motor-pre-logcomex
```

Snapshot conhecido em 19/09/2026:

```text
d703bb328c4bc635b639e7e8c5642f6cecee85cf
```

Arquivos relevantes:

```text
FONTES.md
src/lib/data/tariffs.json
src/lib/data/tariffs.ts
src/lib/data/friction.ts
src/lib/engine/types.ts
src/lib/engine/anuencia.ts
src/lib/engine/cascade.ts
src/lib/engine/costs.ts
src/lib/engine/cost-comparison.ts
src/lib/engine/friction.ts
src/lib/engine/premises.ts
src/lib/engine/input.ts
src/lib/logcomex/fallback.ts
```

Documentos de pesquisa/baseline:

```text
parametros-motor-omegasync.md
mvp-omegasync-atualizado.md
contexto-completo-omegasync.md
ideia_operacao_portuaria_zona_primaria_secundaria.pdf
```

---

# 2. Escala de confiança herdada

## A

Fonte primária verificada:

- norma;
- DOU;
- tabela pública datada;
- estatística oficial;
- documentação oficial.

Uso:

```text
pode alimentar diretamente o motor, respeitando escopo e vigência
```

## B

Fonte secundária corroborada ou material oficial da organização.

Uso:

```text
usar com rótulo
```

## C

Fonte única ainda não verificada em primária.

Uso:

```text
não transformar em verdade rígida;
usar como premissa/alavanca quando necessário
```

## N=1

Um único relato de campo.

Uso:

```text
nunca extrapolar como número de mercado
```

---

# 3. Baseline tarifário usado no repo anterior

Arquivo anterior:

```text
src/lib/data/tariffs.json
```

Data registrada de captura:

```text
2026-08-31
```

## 3.1 Descarga Direta — baseline anterior

```json
{
  "aliquota": 0.0054,
  "valorMinimo": 1063.08
}
```

Representação humana:

```text
0,54% do CIF
mínimo R$ 1.063,08
```

No repo anterior estava identificado como:

```text
Santos Brasil — Descarga Direta
```

### Ressalva obrigatória

O documento `parametros-motor-omegasync.md` registra que a tabela Santos Brasil capturada
na pesquisa era de **Imbituba/SC**, não do Tecon Santos.

Portanto:

```text
NÃO assumir automaticamente que 0,54% / R$ 1.063,08 é tarifa vigente do Tecon Santos.
```

O agente pode manter esse valor como **baseline histórico do projeto anterior**, mas deve verificar
a tabela correta antes de rotulá-lo como tarifa real aplicável a Santos.

---

# 4. DP World Santos — armazenagem usada no repo anterior

Baseline:

```json
{
  "diasPorPeriodo": 4,
  "aliquotaPrimeiroPeriodo": 0.006,
  "aliquotaSegundoPeriodo": 0.013,
  "aliquotaSubsequente": 0.02
}
```

Representação:

| Período                |        Valor |
| ---------------------- | -----------: |
| 1º período de 4 dias   | 0,60% do CIF |
| 2º período de 4 dias   | 1,30% do CIF |
| subsequentes de 4 dias | 2,00% do CIF |

Fonte usada no projeto anterior:

```text
Tabela pública DP World Santos
capturada em 31/08/2026
```

O novo código deve guardar:

```text
terminal
vigência
data de captura
base de cálculo
percentual
duração do período
mínimos/adicionais aplicáveis
fonte
```

Não guardar apenas as alíquotas.

---

# 5. Ecoporto Santos — armazenagem usada no repo anterior

Baseline:

```json
{
  "diasPorPeriodo": 8,
  "aliquotaPrimeiroPeriodo": 0.012,
  "aliquotaSegundoPeriodo": 0.021,
  "aliquotaSubsequente": 0.039
}
```

Representação:

| Período                |        Valor |
| ---------------------- | -----------: |
| 1º período de 8 dias   | 1,20% do CIF |
| 2º período de 8 dias   | 2,10% do CIF |
| subsequentes de 8 dias | 3,90% do CIF |

Fonte anterior:

```text
Ecoporto Santos — Tabela Geral de Preços
vigência registrada: 10/01/2026
```

Exemplo auditável usado na pesquisa:

```text
2 períodos:
1,20% + 2,10% = 3,30% do CIF
```

---

# 6. Outros dados tarifários pesquisados anteriormente

O documento de parâmetros também registrou:

| Recinto                  | 1º período |      2º período |     subsequente |   base |
| ------------------------ | ---------: | --------------: | --------------: | -----: |
| DP World Santos          |      0,60% |           1,30% |           2,00% | 4 dias |
| Ecoporto Santos          |      1,20% |           2,10% |           3,90% | 8 dias |
| BTP                      | 0,65–0,90% | não consolidado | não consolidado | 7 dias |
| Santos Brasil / Imbituba |      0,54% |       0,29%/dia |               — | 5 dias |

### Regra

BTP e Santos Brasil/Imbituba **não devem virar constantes do novo motor** sem a tabela exata e
o escopo correto.

---

# 7. Fórmulas econômicas do projeto anterior

## 7.1 Caminho A

```text
Custo Caminho A =
  imposto antecipado × dias × custo de capital
+ descarga direta
+ frete direto até o destino
```

## 7.2 Caminho C

```text
Custo Caminho C =
  SSE, se aplicável
+ transporte cais → retroporto
+ armazenagem ad valorem
+ custo de anuência, quando conhecido
+ capatazia / movimentação
+ frete retroporto → destino
+ custo do tempo parado
```

## 7.3 Custo de transporte

Modelo anterior:

```text
distância_km × custo_por_km
```

`custo_por_km` era premissa, não dado confirmado.

## 7.4 Custo de capital

Modelo anterior:

```text
taxa_diaria = taxa_mensal / dias_base_mes

custo =
  valor_tributos
× dias_antecipacao
× taxa_diaria
```

Taxa de capital era lacuna/premissa.

---

# 8. Regra estrutural de custos incompletos

Regra do repo anterior que deve ser preservada:

```text
null = desconhecido
0 = conhecido e igual a zero
```

Resultado:

```text
subtotalConhecido = soma do que é conhecido

total =
  subtotalConhecido, se todos os componentes necessários forem conhecidos
  null, se houver componente necessário desconhecido

completo =
  true ou false
```

Essa regra é obrigatória no novo motor.

---

# 9. Estados OEA usados anteriormente

Código anterior:

```text
NAO_OEA
ESSENCIAL
QUALIFICADO
EXCELENCIA
```

Fonte regulatória registrada:

```text
IN RFB nº 2.318/2026
```

Pesquisa anterior registrou:

| Nível       | Observação                     |
| ----------- | ------------------------------ |
| Essencial   | nível OEA-C                    |
| Qualificado | nível OEA-C                    |
| Excelência  | nível com benefícios ampliados |

O material anterior também relacionava Excelência a diferimento tributário pleno e tratamento
diferenciado de parametrização.

Antes de hardcodar benefício específico, conferir novamente a IN vigente.

---

# 10. Estatísticas OEA usadas como contexto

Fonte registrada:

```text
Receita Federal / ReceitaData
Estatísticas do Programa OEA
08/01/2026
```

Dados de 2025 registrados:

| Métrica                              |     OEA |  Não-OEA |
| ------------------------------------ | ------: | -------: |
| seleção para conferência             |   0,32% |   23,15% |
| canal verde equivalente              |  99,68% |        — |
| tempo médio marítimo                 | 1h13min | 24h22min |
| tempo médio aéreo                    |   43min | 18h43min |
| participação no valor total de comex |  28,55% |        — |

Uso:

```text
contexto/calibração
```

Não usar como probabilidade individual automática de uma carga.

---

# 11. Canal aduaneiro — baseline antigo

Estados:

```text
NAO_REVELADO
VERDE
AMARELO
VERMELHO
CINZA
```

Dados históricos usados:

| Métrica                          |          Valor | Natureza           |
| -------------------------------- | -------------: | ------------------ |
| consumo em canal verde em Santos | 92,95% em 2016 | oficial, pré-DUIMP |
| canal verde OEA-C                | 99,68% em 2025 | oficial            |
| seleção não-OEA                  | 23,15% em 2025 | oficial            |
| sobre águas com canal não verde  |            ~5% | material ABTRA     |

Tempos históricos registrados para Santos:

| Canal    |     2016 |  2017 |
| -------- | -------: | ----: |
| Verde    |    17,1h | 12,4h |
| Amarelo  |   217,2h |     — |
| Vermelho |   354,7h |     — |
| Cinza    | 1.159,8h |     — |

Fonte antiga:

```text
Receita Federal
“Variabilidade dos tempos de despacho aduaneiro de importação — Alfândega do Porto de Santos”
```

São dados históricos, não usar como tempo atual de 2026.

---

# 12. Sobre águas em Santos

Fonte registrada anteriormente:

```text
Notícia Siscomex Importação nº 038/2026
```

Marco usado:

```text
04/05/2026 — entrada de Santos no desembaraço sobre águas
```

Outro marco citado:

```text
27/04/2026 — DUIMP obrigatória no contexto usado pelo material ABTRA
```

A pesquisa anterior também registrou:

```text
sobre águas = 17,9% das declarações marítimas
nos 12 meses até jan/2026
```

e:

```text
255 de 436 empresas OEA-C elegíveis já haviam usado o benefício
```

Esses valores são contexto, não regra da carga individual.

---

# 13. Anuência / tratamento administrativo

## 13.1 Regra conceitual central

Descoberta preservada:

```text
canal verde da Receita não significa necessariamente carga liberada
```

A carga pode depender de órgão anuente/LPCO.

## 13.2 Estados usados no motor anterior

```text
SEM_ANUENCIA
AUTOMATICA
NAO_AUTOMATICA_POSTERIOR
PREVIA_AO_EMBARQUE
IMPEDIMENTO
```

## 13.3 Órgãos principais modelados

```text
ANVISA
MAPA_VIGIAGRO
INMETRO
IBAMA
ANP
DECEX
OUTRO
```

## 13.4 Fonte preferida

```text
Portal Único Siscomex
Tratamento Administrativo na Importação
Simulador de Tratamento Administrativo
```

## 13.5 Regra obrigatória

Não criar:

```text
NCM → órgão
```

como tabela universal sem considerar os atributos exigidos pelo tratamento administrativo.

## 13.6 Fallback anterior

Arquivo:

```text
src/lib/data/ncm-anuentes.json
```

Estado atual do repo anterior:

```json
[]
```

Ou seja:

```text
não havia mapeamento real de NCM no fallback
```

Não preencher com dados inventados.

---

# 14. Prazos de anuência encontrados na pesquisa antiga

O baseline anterior registrou:

```text
NAO_AUTOMATICA_POSTERIOR:
~10 dias úteis

PREVIA_AO_EMBARQUE:
até ~60 dias corridos
```

O próprio documento classificava os **prazos** com confiança inferior à definição da modalidade.

Uso:

```text
não hardcodar como SLA oficial sem fonte primária específica
```

Pesquisa de campo também registrou aproximadamente 10 dias em um caso/contexto de órgão anuente.

---

# 15. Janela de 48 horas

Fontes registradas no repo anterior:

```text
IN RFB nº 248/2002, art. 71 §3º
Portaria ALF/STS nº 209/2026
Portaria ALF/STS nº 210/2026
```

Data de vigência registrada para a Portaria 209:

```text
01/09/2026
```

Detalhes pesquisados:

| Regra                                                | Baseline anterior                                  |
| ---------------------------------------------------- | -------------------------------------------------- |
| solicitação para atracação 13h30–18h59               | até 10h30                                          |
| solicitação para atracação 19h–13h29 do dia seguinte | até 16h                                            |
| solicitação complementar                             | uma, até 2 dias corridos                           |
| retirada                                             | 48h úteis a partir da chegada ao pátio             |
| sem recinto discriminado no agendamento              | contagem a partir do fim da operação da embarcação |
| permanência adicional                                | operador pode manter por segurança/conveniência    |
| excedido o prazo                                     | vai para armazenagem e perde status de carga-pátio |

Correção conceitual preservada:

```text
a regra de 48h não nasceu com a DUIMP;
a pesquisa a vincula ao art. 71 §3º da IN RFB 248/2002
```

### Regra para o novo motor

Não aplicar universalmente a toda carga.

Modelar:

```text
APLICAVEL
NAO_APLICAVEL
INDETERMINADO
```

antes de avaliar viabilidade da janela.

---

# 16. Evidências de campo sobre a janela

Baseline anterior:

```text
E31 — N=1:
reagendamento observado principalmente por problema com veículo de retirada,
não por falta de capacidade interna do terminal.

E28 — N=1:
perda da janela de 48h gerou custo adicional;
valor não foi capturado.
```

Uso:

```text
evidência de pesquisa
```

Nunca criar tarifa de no-show fictícia.

---

# 17. DTA — Declaração de Trânsito Aduaneiro

A mentoria atual reforçou DTA como peça central.

Conceito a manter:

```text
Terminal / recinto de Zona Primária
→ trânsito aduaneiro
→ recinto alfandegado de Zona Secundária
```

A carga permanece sob controle aduaneiro durante o trânsito.

DTA:

```text
não é operador
não é recinto
é declaração/instrumento do trânsito aduaneiro
```

Fontes oficiais que devem ser priorizadas:

```text
Receita Federal
Manual de Trânsito Aduaneiro
serviço “Declarar Trânsito Aduaneiro”
```

O novo motor deve separar:

```text
rota aceita DTA?
DTA é aplicável?
custo DTA conhecido?
tempo conhecido?
```

---

# 18. Zona Primária e Zona Secundária

Mentoria atual:

```text
Zona Primária:
área alfandegada de porto/aeroporto/fronteira,
onde a carga normalmente chega e permanece inicialmente sob controle aduaneiro.

Zona Secundária:
restante do território aduaneiro fora da Zona Primária;
pode conter recintos alfandegados, inclusive portos secos.
```

Critérios recomendados para comparação:

```text
armazenagem
movimentação
transporte
distância
tempo
disponibilidade
infraestrutura
acesso
tipo de carga aceito
possibilidade de DTA
```

Regra:

```text
não assumir que Zona Primária é sempre mais barata
não assumir que Zona Secundária é sempre mais barata
```

Comparar custo total e restrições.

---

# 19. Entreposto Aduaneiro

A mentoria reforçou a possibilidade de permanência em recinto alfandegado sem nacionalização imediata,
dependendo do regime aplicável.

Fonte preferida:

```text
Receita Federal
Manual de Entreposto Aduaneiro
```

O novo motor só deve modelar regras detalhadas depois de validar:

```text
admissão
suspensão tributária
prazo
recinto habilitado
movimentação
saída
nacionalização/destinação
custos
```

Não confundir:

```text
retroporto
porto seco
recinto alfandegado
entreposto aduaneiro
```

---

# 20. SSE — Serviço de Segregação e Entrega

Tratamento do repo anterior:

```text
toggle
OFF por padrão
nunca constante obrigatória
```

Fontes registradas:

```text
STJ — REsp 1.899.040-SP
julgado em 27/08/2024

TCU — Acórdão 1.448/2022-Plenário

Ecoporto — tabela 10/01/2026
registrava SSE como suspenso

Cade — sessão 10/06/2026
Marimex × BTP
processo 08700.005723/2018-57
desfecho não localizado no baseline
```

Pesquisa de campo:

```text
E01 e E04:
duas fontes independentes indicaram ausência de cobrança na prática
```

Regra:

```text
situação não tratada como pacificada
```

Se utilizado:

```text
sseAtivo = false por padrão
```

e a origem deve ficar explícita.

---

# 21. Free time — pesquisa de campo antiga

Baseline N=1:

| Parâmetro        | terminal primário |            retroporto |
| ---------------- | ----------------: | --------------------: |
| free time        |           ~5 dias | 10–15 dias negociados |
| custo            |   ~R$ 2.200–2.500 |             ~R$ 3.000 |
| rebate           |                 — |               ~R$ 500 |
| líquido estimado |                 — |             ~R$ 2.500 |

Também foi registrada variação de 5–10 dias em terminal primário conforme terminal.

Uso:

```text
apenas contexto / estimativa de campo
```

Não usar como tarifa universal.

---

# 22. Fricção de pesquisa reaproveitável

Arquivo anterior:

```text
src/lib/data/friction.ts
```

## Estrutura

### ESTRUTURA

```text
9 ocorrências em 17 respostas
```

Descrição anterior:

```text
falta de estrutura apareceu como bloqueio dominante, à frente de falta de caixa
```

### CAIXA

```text
N=1
```

Descrição:

```text
fluxo de caixa apontado como fator principal por uma fonte institucional
```

### ANUÊNCIA

Evidências anteriores:

```text
E26 — aproximadamente 10 dias em contexto observado
E38 — carga sujeita a anuência tende ao retroporto devido ao free time maior
```

### JANELA_48H

```text
E31 — N=1 — veículo de retirada como causa observada de reagendamento
E28 — N=1 — custo adicional após perda da janela, sem valor capturado
```

## Regra

Esses dados:

```text
não são probabilidades
não são pesos estatísticos universais
```

Devem aparecer como evidência/calibração de campo.

---

# 23. Dados de mercado usados no pitch anterior

Não entram diretamente na fórmula.

Baseline:

| Dado                             |                 Valor | Confiança no material antigo |
| -------------------------------- | --------------------: | ---------------------------- |
| Porto de Santos 1º semestre 2026 |      92,8 Mt (+5,05%) | B números / C narrativa      |
| 2025 fechado                     |              186,6 Mt | B                            |
| projeção de contêineres          | 5,5 → 8,7 milhões TEU | B                            |
| capacidade instalada até 2040    |              240,6 Mt | B                            |
| redução de tempo com DUIMP       |         ~17 → ~9 dias | B                            |
| migração de retroportos          |             ~20–30 km | C                            |

Regra registrada:

```text
não atribuir crescimento do porto à DUIMP sem fonte que sustente causalidade
```

---

# 24. Lacunas herdadas do projeto anterior

O novo motor não deve fingir que estas lacunas desapareceram.

| Lacuna                                     | Tratamento                      |
| ------------------------------------------ | ------------------------------- |
| custo real por km                          | premissa/integração futura      |
| tarifa Tecon Santos correta                | validar tabela oficial          |
| custo de capital                           | premissa explícita              |
| taxa/no-show real da janela                | desconhecido                    |
| fração de carga anuente em Santos          | desconhecida                    |
| prazos oficiais por modalidade de anuência | validar fonte primária          |
| canal pós-DUIMP específico para Santos     | validar dado atual              |
| custo do tempo parado                      | desconhecido                    |
| disponibilidade real de recinto            | desconhecida até fonte dinâmica |
| custo real de DTA                          | coletar                         |
| tempo real de DTA                          | coletar                         |

---

# 25. Logcomex — Analista de Documentação

Schema recebido durante a maratona.

Entrada conhecida:

```text
arquivo
workflow_operacoes
```

Saída pode conter:

```text
validacao_cruzada_campos
resumo_executivo
riscos_aduan_sugest
percentual_confianca
dados_embarque
notificacao_email
```

Dados úteis em `dados_embarque`:

```text
exportador
importador
consignee
modal
incoterm
origem
destino
bl_awb
invoice
datas_relevantes
peso_bruto
peso_liquido
valor_fob
valor_frete
valor_seguro
itens[]
```

Itens podem conter:

```text
descricao
marca
modelo
quantidade
unidade
valor_unitario
valor_total
pais_origem
ncm_sugerido
nivel_confianca_ncm
```

Regra:

```text
ncm_sugerido != ncm_confirmado
```

---

# 26. Logcomex — Tracking & Follow-up

Entrada conhecida:

```text
container
armador
tipo
mais_informacoes
```

Saída conhecida:

```text
operacao
container
armador
tipo
informacoes_adicionais
```

Todos os dados relevantes são majoritariamente texto/string no schema analisado.

Uso:

```text
contexto operacional
```

Não usar parsing ingênuo para derivar regra determinística.

---

# 27. Logcomex — Brasil | Análise de Importações

Filtros conhecidos:

```text
centro_da_analise
tipo_de_analise
descricao_produto
empresa_alvo
empresa_comparacao
recorte
janela
mes_ano_inicio
mes_ano_fim
api
mais_informacoes
colunas
```

Colunas disponíveis:

```text
Ano e mês
Provável Importador
Provável Exportador
Provável Fabricante
País de origem
Provável Marca
Provável Modelo
NCM
FOB Total
FOB Unitário
Quantidade
Porto de entrada
Frete Total
```

Uso preferido:

```text
carteira
mercado
contexto
```

Não substituir dados da carga individual por agregados de mercado.

---

# 28. Logcomex — Brasil | Análise de Embarques

Entregáveis declarados:

```text
KPIs de embarques e TEUs
Ranking dos top players na rota
Evolução mensal
Insights e tendências para prospecção
```

Uso:

```text
carteira
contexto de rota
mercado
pitch
```

O schema recebido não demonstrou ainda um array estruturado de KPIs.

Confirmar resposta real antes de desenvolver processamento automático.

---

# 29. Proveniência usada no motor anterior

Valores anteriores:

```text
USUARIO
LOGCOMEX
FALLBACK_OFFLINE
CACHE
TABELA_PUBLICA
PESQUISA_CAMPO
PREMISSA_SIMULACAO
```

O novo domínio pode evoluir a enumeração, mas deve preservar a ideia.

Todo componente externo importante precisa ser rastreável.

---

# 30. Fonte de pesquisa da mentoria atual

Documento:

```text
ideia_operacao_portuaria_zona_primaria_secundaria.pdf
```

Pontos trazidos:

- comparar Zona Primária e Zona Secundária;
- usar DTA como parte do fluxo;
- comparar custo total;
- verificar disponibilidade;
- verificar capacidade;
- verificar tipo de carga aceito;
- considerar distância;
- considerar tempo;
- investigar quem escolhe o recinto;
- investigar APIs e bases públicas;
- tratar nacionalização e Entreposto com cuidado.

Uso:

```text
direção de produto e hipóteses operacionais
```

Não substituir norma oficial.

---

# 31. Estrutura recomendada para fonte no código

```ts
interface SourceReference {
  id: string;
  title: string;
  publisher: string;
  url?: string;
  accessedAt: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  confidence?: "A" | "B" | "C" | "N1";
  kind:
    | "OFFICIAL_REGULATION"
    | "OFFICIAL_STATISTICS"
    | "OFFICIAL_TARIFF"
    | "OPERATOR_PROCEDURE"
    | "EXTERNAL_API"
    | "FIELD_RESEARCH"
    | "USER_INPUT"
    | "SIMULATION_ASSUMPTION";
}
```

---

# 32. Checklist obrigatório antes de codificar uma regra

```text
[ ] Qual é a fonte?
[ ] É a mesma fonte usada no repo anterior ou uma atualização dela?
[ ] A fonte é aplicável a Santos?
[ ] A fonte é aplicável a esse terminal/recinto?
[ ] Está vigente?
[ ] O valor é oficial, pesquisa de campo ou premissa?
[ ] Existe exceção?
[ ] O código preserva proveniência?
[ ] Ausência está virando null, e não zero?
[ ] A regra pertence ao domínio ou ao adapter?
[ ] A informação é individual ou agregada?
```

Se o agente não conseguir responder, não deve inventar.

---

# 33. Regra final para o agente

Ao precisar de uma regra já tratada no OmegaSync anterior:

1. consultar este arquivo;
2. consultar o arquivo correspondente no repo anterior;
3. verificar se a mentoria atual alterou o entendimento;
4. verificar se existe fonte mais recente;
5. reutilizar o conhecimento/dado se continuar válido;
6. reimplementar no novo projeto;
7. testar;
8. registrar a proveniência.

O novo OmegaSync deve aproveitar todo o aprendizado anterior sem carregar cegamente as limitações
da implementação anterior.

---

# 34. Logcomex — MCP (chat consultivo)

Integração principal com a Logcomex nesta rodada (a Agent API HTTP foi adiada
por instabilidade relatada pelo provedor).

Endpoint efetivamente usado e validado:

```text
https://mcp.logcomex.ai/
data da validação: 2026-09-20
protocolo MCP: 2025-06-18 · serverInfo: logcomex-ai-mcp v1.1.0
```

Tools observadas via discovery real (`tools/list`):

```text
chat_free           · funcionou · SEM autenticação
chat_with_agent     · requer OAuth (escopo mcp:chat:agents)
list_agents         · requer OAuth (escopo mcp:chat:agents)
get_task_status     · polling de execução assíncrona
cancel_task
list_missions       · não exercitado nesta rodada
search_missions     · não exercitado nesta rodada
get_mission         · não exercitado nesta rodada
```

Modo de autenticação observado:

```text
free/public agent (chat_free)  → sem login
company agents                 → OAuth 2.0 Authorization Code + PKCE (S256)
  authorization_endpoint: /authorize
  token_endpoint:         /token
  registration_endpoint:  /register (Dynamic Client Registration)
  scopes: mcp:chat:free, mcp:chat:agents, offline_access
  bearer_methods_supported: header
```

Não há grant client_credentials/headless nem API key manual: o agente da empresa
depende de um token obtido pelo fluxo interativo real de OAuth. No protótipo, o
token (quando existir) é fornecido server-side por `LOGCOMEX_MCP_ACCESS_TOKEN` —
nunca inventado, nunca exposto ao browser.

Formato das respostas (confirmado):

```text
chat_free / chat_with_agent devolvem:
  structuredContent = { status, reply, conversation_id }
  (ou, assíncrono, { status: "pending", task_id })
  reply = TEXTO LIVRE (markdown)
```

Regra de uso (crítica):

```text
o reply é CONTEXTO/ORIENTAÇÃO, nunca fato determinístico
texto livre != dado estruturado
resposta genérica sobre órgão anuente/LPCO NÃO altera o motor
  → o motor permanece UNKNOWN/INDETERMINADO
```

Continuidade de conversa (confirmado 2026-09-20): o agente PÚBLICO (`chat_free`)
**rejeita o reuso do próprio `conversation_id`** — mesmo dentro da mesma sessão
MCP —, retornando `403 ANONYMOUS_CONVERSATION_FORBIDDEN` ("Conversa anônima
inválida para esta sessão."). Portanto NÃO há continuidade de follow-up no agente
público; cada mensagem inicia uma conversa nova. A continuidade real depende do
agente da EMPRESA autenticado (a ser exercitado na etapa de OAuth).

Provenance para o código: `EXTERNAL_API`, publisher Logcomex, confiança não
elevada (texto consultivo). Só há evidência estruturada quando o agente da
empresa for exercitado e devolver `structuredContent` validável por schema — o
que NÃO foi confirmado nesta rodada. Análise documental, tracking e tratamento
administrativo permanecem como contexto até essa confirmação.
