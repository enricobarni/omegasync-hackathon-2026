# OmegaSync — Guia Visual e de Frontend

> **Objetivo deste arquivo:** definir a identidade visual que o agente deve preservar ao construir
> o frontend do novo OmegaSync.
>
> O novo projeto deve **reaproveitar o modelo visual e os padrões de interação do repositório
> OmegaSync anterior**, adaptando-os à nova arquitetura de produto e às novas telas da maratona.
>
> Este arquivo é uma referência de design, não uma autorização para copiar arquivos antigos
> integralmente.

---

# 1. Referência visual principal

Repositório anterior:

```text
https://github.com/enricobarni/porto-hack-2026-omegasync
```

Branch visual de referência:

```text
motor-pre-logcomex
```

Snapshot conhecido durante a elaboração deste guia:

```text
d703bb328c4bc635b639e7e8c5642f6cecee85cf
```

Arquivos prioritários para inspeção visual:

```text
src/app/globals.css
src/app/layout.tsx

src/components/features/home/OmegaMark.tsx

src/components/features/home/story/PortStory.tsx
src/components/features/home/story/Story.module.css
src/components/features/home/story/StoryScene.tsx

src/components/features/home/three/HomeScene.module.css
src/components/features/home/three/HomeSceneClient.tsx
src/components/features/home/three/PortScene.tsx

src/components/features/portal/Portal.module.css
src/components/features/portal/ModuleShell.tsx
src/components/features/portal/ModuleSelector.tsx
src/components/features/portal/AnimatedModuleIcon.tsx
src/components/features/portal/MotorView.tsx
src/components/features/portal/CargoView.tsx
src/components/features/portal/PortfolioView.tsx
```

O agente deve consultar esses arquivos quando precisar reconstruir um padrão visual correspondente.

---

# 2. Intenção visual

O OmegaSync deve transmitir:

```text
confiabilidade
clareza
operação portuária
inteligência de decisão
tecnologia discreta
auditabilidade
```

A interface anterior possui uma estética:

```text
editorial
industrial
portuária
limpa
técnica
sóbria
```

Evitar transformar a aplicação em:

```text
dashboard neon
cyberpunk
gradientes chamativos
glassmorphism pesado
UI excessivamente arredondada
cards flutuantes com sombras fortes
visual genérico de SaaS roxo/azul
```

A interface deve parecer uma ferramenta operacional profissional.

---

# 3. Paleta principal

Tokens visuais observados no portal anterior:

```css
--paper: #eff3f2;
--text: #183b34;
--muted: #647b75;
--border: #cbd7d3;
--accent: #248f85;
```

## 3.1 Fundo

Principal:

```text
#eff3f2
```

É um verde/cinza muito claro.

Não usar branco puro como fundo dominante da aplicação inteira.

## 3.2 Texto principal

```text
#183b34
```

Verde escuro.

É a cor principal para:

- títulos;
- textos importantes;
- ícones técnicos;
- labels de alta prioridade.

## 3.3 Texto secundário

```text
#647b75
```

Usar para:

- descrições;
- metadados;
- labels;
- evidências secundárias;
- breadcrumbs;
- notas.

## 3.4 Accent

```text
#248f85
```

Família teal/verde-água.

Usar com moderação para:

- estado selecionado;
- indicadores ativos;
- barras;
- ícones;
- foco;
- elementos de decisão.

## 3.5 Bordas

```text
#cbd7d3
```

Bordas finas são parte importante da identidade.

Preferir:

```text
1px solid
```

em vez de sombras para separar regiões.

---

# 4. Cores estruturais adicionais

## Sidebar / botões primários

Base:

```text
#183d36
```

Hover primário:

```text
#286253
```

Sidebar hover:

```text
#234d43
```

Sidebar item ativo:

```text
#35584f
```

Texto da sidebar:

```text
#edf5f1
```

Texto secundário da sidebar:

```text
#9bb5ab
#b2c6be
```

## Campos

Background:

```text
#fafcfb
```

## Estado selecionado suave

```text
#dce7e2
```

## Cards escuros da seleção de módulo

Background:

```text
#19423c
```

Texto:

```text
#edf5f1
```

Hover/focus border:

```text
#56b5a8
```

---

# 5. Tipografia

O projeto anterior utiliza:

```text
Geist
Geist Mono
```

via `next/font/google`.

Preferência:

```text
font-family: Geist, sans-serif
```

Geist Mono pode ser usado apenas quando fizer sentido para:

- códigos;
- identificadores;
- dados técnicos;
- números tabulares.

Não trocar a família tipográfica sem solicitação explícita.

---

# 6. Hierarquia tipográfica

## Workspace

Título principal:

```text
~32px
font-weight: 500
line-height: ~1.18
```

Eyebrow:

```text
9–11px
uppercase
letter-spacing: ~1–1.5px
muted
```

Texto de apoio:

```text
12–14px
```

## Homepage / storytelling

Título:

```text
40–46px desktop
~32px mobile
font-weight: 500
```

## Cards de módulo

Título:

```text
~23px
font-weight: 500
```

Descrição:

```text
~14px
line-height: 1.6
```

## Métricas

Valor:

```text
~29–32px
font-weight: 500
```

A estética não deve depender de bold pesado.

---

# 7. Geometria

A interface anterior usa cantos pequenos.

Preferir:

```text
3px
4px
5px
8px no máximo para cards maiores
```

Evitar:

```text
16px
20px
24px
```

como raio padrão.

A identidade visual depende mais de:

```text
bordas
espaçamento
tipografia
hierarquia
```

do que de sombras.

---

# 8. Botões

## Primário

Visual:

```text
background: #183d36
color: white
border-radius: 4px
altura mínima: ~42px
```

Deve parecer sólido e operacional.

## Secundário

Visual:

```text
background: transparent
border: 1px solid #cbd7d3
color: #183b34
```

Hover suave:

```text
#e0e9e5
```

Evitar botões excessivamente grandes ou arredondados.

---

# 9. Inputs

Padrão anterior:

```text
border: 1px solid #cbd7d3
background: #fafcfb
border-radius: 4px
min-height: ~43px
padding: ~11px 12px
```

Labels:

```text
12px
muted
```

Erro:

- manter erro legível;
- não depender apenas de cor;
- `aria-invalid`;
- mensagem textual;
- contraste suficiente.

---

# 10. Application Shell

Este é um dos elementos mais importantes a reaproveitar visualmente.

## Desktop

Sidebar fixa:

```text
width: 236px
background: #183d36
```

Workspace:

```text
margin-left: 236px
```

Header do workspace:

```text
height: 88px
margin-inline: 36px
border-bottom: 1px solid border
```

Main:

```text
padding: 38px 36px 48px
max-width: 1500px
margin: auto
```

## Sidebar

Estrutura:

```text
OmegaSync brand
↓
label "ESPAÇO DE TRABALHO"
↓
navegação dos módulos
↓
status/ambiente no rodapé
```

Ícones lineares.

Preferência:

```text
lucide-react
strokeWidth ~1.5
```

## Mobile

A sidebar deve virar menu/drawer.

Preservar:

- botão de abertura;
- overlay;
- botão de fechar;
- Escape para fechar;
- retorno de foco;
- navegação por teclado.

---

# 11. Marca OmegaSync

O símbolo Omega anterior deve ser mantido conceitualmente.

Referência:

```text
src/components/features/home/OmegaMark.tsx
```

Características:

- símbolo linear;
- teal;
- simples;
- reconhecível;
- sem fundo decorativo.

Wordmark:

```text
OmegaSync
```

A parte de destaque pode usar teal, como no projeto anterior.

Não substituir a identidade por logo genérico sem solicitação.

---

# 12. Cabeçalho das páginas

Padrão:

```text
EYEBROW
Título principal.
Descrição curta.
                         badge/status
```

Exemplo visual anterior:

```text
01 / MOTOR

Diagnóstico da carga.
Decisão operacional e comparação econômica.

                         [Demonstração]
```

No novo produto, adaptar o conteúdo, mas manter a hierarquia.

Exemplos futuros:

```text
01 / DIAGNÓSTICO
Elegibilidade da operação.
Quais rotas permanecem possíveis.

02 / ROTAS
Comparação operacional.
Custos, prazo e restrições.

03 / CARTEIRA
Operações em perspectiva.
Exposição e oportunidades do conjunto.
```

---

# 13. Layout de diagnóstico

O padrão anterior de duas colunas deve ser reaproveitado.

Desktop:

```text
┌─────────────────────────┬─────────────────────────┐
│                         │                         │
│ Entrada / configuração  │ Resultado / decisão     │
│                         │                         │
└─────────────────────────┴─────────────────────────┘
```

CSS conceitual:

```text
grid-template-columns: 1fr 1fr
gap: ~32px
```

Resultado:

```text
border-left
padding-left
```

Em viewport menor:

```text
uma coluna
resultado abaixo
border-top
```

Breakpoint aproximado usado anteriormente:

```text
1250px
```

---

# 14. Formulários

Formulários devem ser divididos por seções.

Exemplo:

```text
Dados da carga
Dados aduaneiros
Condições operacionais
Premissas econômicas
Integração documental
```

Grid desktop:

```text
2 colunas
```

Mobile:

```text
1 coluna
```

Evitar formulário como um card branco enorme flutuando sobre o fundo.

Usar:

```text
seções
linhas
borders
espaçamento
```

---

# 15. Visualização de resultados

O resultado deve parecer uma explicação auditável, não uma caixa de resposta de chatbot.

Prioridade visual:

```text
1. conclusão
2. rotas viáveis
3. custos/trade-offs
4. motivo
5. dados ausentes
6. evidências
```

---

# 16. Rotas

O novo motor trabalha mais fortemente com rotas do que o anterior.

Preservar a ideia visual de linha operacional utilizada em `CargoView`.

Exemplo:

```text
Terminal
    ●──────────────●──────────────●
             DTA             Recinto
```

Cada nó pode apresentar:

```text
nome
zona
status
tempo
distância
```

Estados devem ser visualmente distinguíveis:

```text
VIÁVEL
INVIÁVEL
INDETERMINADA
```

Não depender somente da cor.

Usar também:

- ícone;
- texto;
- label/badge;
- descrição.

---

# 17. Comparação de rotas

A comparação econômica anterior usava dois painéis lado a lado.

A nova versão deve generalizar o conceito.

Exemplo:

```text
┌───────────────────┐
│ Retirada direta   │
│ R$ ...            │
│ 23 km             │
│ 4h                │
└───────────────────┘

┌───────────────────┐
│ Recinto A via DTA │
│ R$ ...            │
│ 17 km             │
│ 8h                │
└───────────────────┘
```

Para muitas rotas:

- grid;
- tabela comparativa;
- cards compactos;
- ou combinação de overview + detalhes.

Não criar um ranking visual chamativo com score arbitrário.

Mostrar diretamente:

```text
menor custo
menor prazo
menor distância
disponibilidade
restrições
```

quando a comparação for válida.

---

# 18. Breakdown de custos

Preservar o padrão anterior de componentes separados.

Exemplo:

```text
Armazenagem                    R$ ...
Transporte                     R$ ...
Movimentação                   R$ ...
DTA                            R$ ...
SSE                            Não aplicável
Tempo parado                   Não informado
─────────────────────────────────────
Subtotal conhecido             R$ ...
Total                          Indeterminado
```

`null` deve aparecer como:

```text
Não informado
Indisponível
Indeterminado
```

conforme o contexto.

Nunca exibir:

```text
R$ 0,00
```

para valor desconhecido.

---

# 19. Evidências

Evidências devem continuar discretas, mas acessíveis.

Visual recomendado:

```text
Fonte
Origem
Confiança
Data/vigência
Referência
```

Podem aparecer em:

- disclosure;
- lista;
- tooltip acessível;
- seção expandível.

Evitar poluir a conclusão principal.

---

# 20. Tabelas

Padrão anterior:

- sem card externo pesado;
- `border-collapse`;
- linhas separadas por border;
- labels pequenos;
- whitespace controlado;
- scroll horizontal em mobile.

Cabeçalho:

```text
10–11px
muted
font-weight: 500
```

Conteúdo:

```text
12px
```

Usar tabela quando comparação tabular realmente facilitar leitura.

---

# 21. Métricas

Padrão de carteira:

```text
4 métricas em linha
border-top
border-bottom
divisores verticais
```

Exemplo futuro:

```text
Rotas analisadas
Operações viáveis
Operações indeterminadas
Economia potencial conhecida
```

Não usar cards independentes para cada KPI se uma faixa linear funcionar melhor.

---

# 22. Module Selector

A home anterior apresenta três módulos em cards escuros.

Preservar o conceito se os módulos continuarem relevantes.

Visual:

```text
3 cards desktop
background #19423c
texto claro
ícone ilustrativo
número da seção
seta
hover teal
```

Os nomes dos módulos podem mudar conforme o novo produto.

Não manter:

```text
Motor
Carga Individual
Carteira
```

apenas por nostalgia se a arquitetura final exigir outro agrupamento.

A linguagem visual deve permanecer; a arquitetura da informação pode evoluir.

---

# 23. Homepage e storytelling

O projeto anterior possui uma apresentação portuária visual com:

```text
header sticky
cena portuária
movimentação / storytelling
timeline de etapas
module selector
```

Esse modelo pode ser reaproveitado para explicar o novo problema.

Nova narrativa possível:

```text
1. Carga chega à Zona Primária
2. Rotas aduaneiras são avaliadas
3. OmegaSync compara alternativas
```

Isso combina melhor com o motor atual do que copiar a história antiga literalmente.

---

# 24. 3D e animação

O repo anterior possui cena 3D/portuária.

Referências:

```text
src/components/features/home/three/
src/components/features/home/story/
```

A cena 3D é:

```text
elemento de apresentação
```

e não requisito funcional do motor.

Prioridade:

```text
motor funcionando > integração real > clareza da interface > efeitos 3D
```

Se reutilizada:

- manter leve;
- não bloquear interação;
- não prejudicar mobile;
- oferecer fallback estático;
- não exigir GPU para acessar funcionalidade;
- respeitar `prefers-reduced-motion` quando houver movimento relevante.

---

# 25. Microinterações

Permitidas:

- hover discreto;
- mudança de border;
- preenchimento de progresso;
- rotação suave de ícone;
- animação pequena no module selector;
- mudança de estado ao selecionar rota;
- loading claro.

Evitar:

- bounce;
- glow excessivo;
- parallax agressivo;
- transições longas;
- animação em todo componente.

---

# 26. Sombras

A interface antiga quase não depende de sombras.

Preferência:

```text
sem shadow
```

ou:

```text
shadow muito sutil apenas quando necessário
```

Separação visual deve vir principalmente de:

```text
border
background
spacing
typography
```

---

# 27. Responsividade

O design deve funcionar em:

```text
desktop de apresentação
notebook
tablet
mobile
```

Regras herdadas:

```text
2 colunas → 1 coluna
4 métricas → layout adaptado
sidebar fixa → drawer
cards de módulo 3 → 1
tabelas → overflow horizontal
forms 2 colunas → 1
cost cards 2+ → 1
```

Não considerar a demo desktop como desculpa para quebrar mobile.

---

# 28. Acessibilidade

O repo anterior já utiliza bons padrões que devem ser preservados.

Obrigatório:

- `lang="pt-BR"`;
- foco visível;
- skip link quando shell possuir navegação persistente;
- `aria-current`;
- `aria-selected`;
- `aria-expanded`;
- `aria-controls`;
- `aria-invalid`;
- labels reais;
- `aria-live` para estados dinâmicos relevantes;
- navegação por teclado;
- contraste suficiente.

Focus ring de referência:

```text
3px teal
offset de ~4px
```

---

# 29. Estados de UI

A aplicação deve ter estados explícitos.

Exemplos:

```text
IDLE
VALIDATING
SUBMITTING
RESULT
PENDING_DATA
ERROR
```

Visualmente diferenciar:

```text
erro
pendência
indeterminação
resultado
```

sem transformar pendência em erro.

---

# 30. Linguagem de texto

Tom:

```text
curto
técnico
operacional
explicável
```

Preferir:

```text
Rota inviável
Disponibilidade não informada
Custo total indeterminado
Fonte: tabela pública
```

Evitar:

```text
Oops!
Algo deu errado :(
Descobrimos a rota perfeita para você!
```

O produto deve soar profissional.

---

# 31. Ícones

Preferência:

```text
lucide-react
```

Estilo:

```text
linear
stroke fino
sem preenchimento excessivo
```

Ícone complementa texto; não substitui label em ações importantes.

---

# 32. Visual da nova arquitetura do produto

O novo frontend deve conseguir representar:

```text
Carga
  ↓
Elegibilidade
  ↓
Rotas possíveis
  ↓
Comparação econômica
  ↓
Evidências
```

Sugestão de hierarquia:

```text
/diagnostico
  formulário + resultado

/operacoes/[id]
  detalhe de uma operação

/carteira
  visão agregada

/fontes ou evidências
  opcional, se útil

/configuração/premissas
  somente se necessário
```

As rotas reais do Next.js podem ser diferentes.

---

# 33. Prioridade de reaproveitamento visual

Quando houver pouco tempo, o agente deve priorizar nesta ordem:

```text
1. palette/tokens
2. typography
3. brand/OmegaMark
4. application shell
5. headings
6. buttons/inputs
7. result layout
8. route comparison
9. tables
10. responsive behavior
11. module selector
12. storytelling/3D
```

Assim, mesmo sem toda a home animada, o produto continua reconhecivelmente OmegaSync.

---

# 34. O que deve mudar em relação ao frontend antigo

O agente NÃO deve preservar cegamente elementos ligados ao domínio antigo.

Reavaliar:

```text
"A vs C" como única comparação
"Uma carga. Dois caminhos."
cenários A–F como única forma de resultado
portfolio limitado a Custo A / Custo C
formulário baseado só na cascata antiga
```

O novo visual deve suportar:

```text
N rotas
DTA
Zona Primária
Zona Secundária
recintos múltiplos
elegibilidade
custos incompletos
disponibilidade
prazo
distância
restrições
```

A identidade permanece.

O modelo de informação evolui.

---

# 35. Regra para reutilizar o frontend anterior

Antes de construir um componente visual importante:

```text
1. localizar equivalente no repo anterior
2. entender por que ele funciona visualmente
3. consultar este DESIGN.md
4. verificar os novos requisitos em PLANEJAMENTO.md
5. reimplementar para o novo domínio
6. validar responsividade e acessibilidade
```

Não fazer:

```text
cp Portal.module.css
cp MotorView.tsx
cp PortfolioView.tsx
```

como estratégia de implementação.

Pode reaproveitar:

```text
paleta
medidas
grid
proporções
hierarquia
estados
interações
ideias de componentes
```

---

# 36. Checklist visual antes do push

Para qualquer branch com frontend:

```text
[ ] DESIGN.md foi consultado
[ ] visual continua reconhecível como OmegaSync
[ ] paleta está coerente
[ ] Geist continua como tipografia principal
[ ] nenhuma regra de negócio foi movida para a UI
[ ] desktop está funcional
[ ] mobile está funcional
[ ] teclado está funcional
[ ] focus-visible está presente
[ ] estados vazios existem
[ ] estados de erro existem
[ ] valores desconhecidos não aparecem como zero
[ ] tabelas possuem overflow quando necessário
[ ] não há sombras/gradientes decorativos destoantes
[ ] componentes novos seguem espaçamento e raios existentes
[ ] conteúdo antigo incompatível com o novo motor foi adaptado
```

---

# 37. Resultado esperado

Um usuário que conheceu o OmegaSync anterior deve olhar para o novo produto e reconhecer:

```text
"é o mesmo OmegaSync"
```

pela:

- marca;
- paleta;
- tipografia;
- estrutura;
- linguagem;
- forma de apresentar dados.

Ao mesmo tempo, deve perceber que o produto evoluiu de:

```text
comparação A × C
```

para:

```text
motor de elegibilidade e comparação de rotas aduaneiro-operacionais.
```
