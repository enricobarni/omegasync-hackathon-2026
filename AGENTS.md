# OmegaSync — Agent Instructions

## Project context

OmegaSync is being developed during Porto Hack Santos 2026.

The implementation submitted in this repository must be produced during the hackathon.

Previous repositories, prototypes, experiments, or pre-hackathon implementations may be used
as **technical and research references** when explicitly allowed by the project planning, but
their source code must not be copied, cherry-picked, or imported as implementation history.

Previous research, interviews, public sources, domain knowledge, requirements, formulas,
datasets, architectural decisions, and technical lessons may be reused when they remain valid
and are supported by the project documentation.

---

## Mandatory project references

Three files in the repository are mandatory references for development:

```text
PLANEJAMENTO.md
FONTES.md
DESIGN.md
```

The agent MUST read all three files before starting the first implementation task in a new session.

For backend/domain-only tasks, `DESIGN.md` may not materially affect the implementation, but it
must still be known because it defines product-level frontend consistency.

For any frontend, UI, UX, visual, layout, component, responsive, accessibility, or interaction
task, `DESIGN.md` is a mandatory active reference and MUST be consulted before editing code.

### `PLANEJAMENTO.md`

`PLANEJAMENTO.md` defines:

- the development stages;
- the expected branch for each stage;
- the scope of each stage;
- the implementation order;
- what may be reused conceptually from the previous OmegaSync repository;
- which previous files should be inspected;
- the architecture expected for the new implementation;
- the Definition of Done for each stage.

Before starting a new development stage, the agent MUST:

1. read the relevant section of `PLANEJAMENTO.md`;
2. confirm the stage explicitly authorized by the user;
3. inspect the current repository;
4. inspect the previous OmegaSync repository when the planning file says it is relevant;
5. implement only the authorized stage.

Do not skip ahead in the roadmap.

Do not start a future stage because it appears technically convenient.

If the user explicitly changes the roadmap, follow the user's latest instruction and keep the
change limited to the requested scope.

### `FONTES.md`

`FONTES.md` is the authoritative project reference for:

- tariffs;
- formulas;
- regulatory rules;
- customs concepts;
- OEA data;
- customs-channel data;
- anuência / LPCO assumptions;
- the 48-hour rule;
- DTA;
- Zona Primária and Zona Secundária;
- Entreposto Aduaneiro;
- SSE;
- field-research evidence;
- known gaps;
- Logcomex schemas;
- provenance and confidence levels;
- data inherited from the previous OmegaSync repository.

Before implementing any code that uses an external fact, number, tariff, rule, probability,
regulatory condition, customs concept, or external API behavior, the agent MUST consult
`FONTES.md`.

If a value or rule is not supported by `FONTES.md`:

- do not invent it;
- do not silently replace the gap with general knowledge;
- do not convert an unknown value into zero or false;
- do not treat an unsupported assumption as fact.

Instead:

- preserve it as unknown;
- model it as an explicit simulation assumption when appropriate;
- or report the gap to the user.

### `DESIGN.md`

`DESIGN.md` defines the visual identity and frontend interaction baseline for the new OmegaSync.

It documents the visual model that should be preserved from the previous OmegaSync repository,
including:

- brand identity;
- color palette;
- typography;
- layout proportions;
- navigation shell;
- module cards;
- forms;
- result panels;
- tables;
- route/cost visualization;
- responsive behavior;
- accessibility behavior;
- motion principles;
- frontend files from the previous repository that should be inspected as visual references.

Before implementing or changing any frontend/UI feature, the agent MUST:

1. read `DESIGN.md`;
2. inspect the current frontend implementation;
3. inspect the visual-reference files from the previous OmegaSync repository listed in
   `DESIGN.md` when relevant;
4. preserve the OmegaSync visual language unless the user explicitly requests a redesign;
5. adapt the previous visual model to the new domain and information architecture rather than
   blindly copying outdated screens.

The previous repository may be used as a **visual and interaction reference**, but its frontend
source files must not simply be copied wholesale into the marathon repository.

Reuse:

- visual tokens;
- brand language;
- proportions;
- information hierarchy;
- interaction patterns;
- responsive behavior;
- component concepts.

Reimplement them coherently in the new repository.

### Precedence between project files

Use the files according to their responsibility:

```text
AGENTS.md
→ workflow, Git rules, coding discipline, agent behavior

PLANEJAMENTO.md
→ stage scope, implementation order, architecture evolution, reuse strategy

FONTES.md
→ factual baseline, formulas, tariffs, evidence, confidence, regulatory and external-data sources

DESIGN.md
→ visual identity, frontend layout, UI behavior, responsive rules and visual reuse strategy
```

If two files appear to conflict in a way that materially changes implementation, do not guess.
Report the conflict before proceeding.

The most recent explicit instruction from the user overrides an older planning instruction for
the current task.

---

## Previous OmegaSync repository

The previous repository is a reference source, not the implementation repository for the
marathon.

Reference repository:

```text
https://github.com/enricobarni/porto-hack-2026-omegasync
```

Reference branch identified in `PLANEJAMENTO.md`:

```text
motor-pre-logcomex
```

When `PLANEJAMENTO.md` requires inspecting the previous repository, use it to recover:

- domain concepts;
- formulas;
- datasets;
- evidence structures;
- tests and edge cases;
- architectural decisions;
- naming that remains useful;
- fallback strategies;
- research-derived behavior.

Do NOT:

- cherry-pick previous commits;
- copy entire previous source files into the new repository;
- preserve the old Git history;
- assume an old implementation is automatically correct for the new architecture.

The correct workflow is:

```text
inspect previous implementation
        ↓
understand the useful decision/data
        ↓
check PLANEJAMENTO.md
        ↓
check FONTES.md
        ↓
reimplement coherently in the new repository
```

---

## Working language

- Source code identifiers: English when appropriate and consistent with the codebase.
- Domain terminology may remain in Portuguese when it represents official Brazilian customs
  or port concepts.
- User-facing product text: Portuguese (pt-BR).
- Commit messages: Portuguese descriptions following the convention defined in this file.

---

## General workflow

Development is performed incrementally, one explicit stage at a time.

Before changing code:

1. Read `PLANEJAMENTO.md`.
2. Read `FONTES.md` when the task touches domain rules, external data, tariffs, regulations,
   evidence, Logcomex, or formulas.
3. Read `DESIGN.md` when the task touches frontend, UI, UX, layout, visual components,
   responsiveness, accessibility, interaction, or presentation.
4. Inspect the relevant existing files.
5. Inspect the previous OmegaSync repository when required by `PLANEJAMENTO.md` or `DESIGN.md`.
6. Understand the current architecture and conventions.
7. Check related types, tests, dependencies, and contracts.
8. Confirm the scope of the current stage.
9. Work only on the feature branch assigned to that stage.
10. Implement the stage incrementally.
11. Commit meaningful implementation checkpoints as they are completed.
12. Run the relevant validation checks.
13. Push the feature branch.
14. Report that the branch is ready for Pull Request.

After pushing the branch, STOP.

The user will manually:

1. create the Pull Request;
2. review it;
3. merge it.

Do not start the next stage automatically.

Only continue after the user explicitly confirms that the Pull Request was merged
and explicitly authorizes the next stage.

Never speculate about code that has not been inspected.

Do not rewrite working code merely to match personal preferences.

---

## Development stages and branches

Each development stage must use its own feature branch.

The branch name should follow the stage defined in `PLANEJAMENTO.md`.

Examples:

```text
feat/domain-foundation
feat/eligibility-engine
feat/route-catalog
feat/tariff-data
feat/route-cost-engine
feat/route-comparison
feat/simulation-service
feat/simulation-api
feat/logcomex-document-analysis
feat/diagnosis-ui
```

A branch represents a development stage or coherent feature.

Do not implement unrelated roadmap stages in the same branch.

Typical lifecycle:

```text
base branch
    ↓
read PLANEJAMENTO.md
    ↓
read FONTES.md when relevant
    ↓
create feature branch
    ↓
implement part 1
    ↓
commit
    ↓
implement part 2
    ↓
commit
    ↓
tests / adjustments
    ↓
commit when meaningful
    ↓
validation
    ↓
push feature branch
    ↓
STOP
    ↓
user creates PR manually
    ↓
user reviews and merges manually
    ↓
user explicitly authorizes next stage
    ↓
update local base branch
    ↓
read next stage in PLANEJAMENTO.md
    ↓
create next feature branch
```

Do not force one commit per branch.

Do not create a commit for every tiny edit either.

Create commits whenever a meaningful, coherent implementation checkpoint has been completed.

A commit should represent a logical unit that can be understood independently in the Git history.

---

## Git rules

The agent is allowed to:

- create feature branches;
- switch between branches;
- create commits;
- push feature branches to the configured remote;
- fetch remote changes;
- update the local base branch after the user confirms a merge.

The agent must NOT:

- create Pull Requests;
- merge Pull Requests;
- close Pull Requests;
- approve Pull Requests;
- modify remote repository settings;
- continue to the next development stage without explicit user authorization.

Pull Request creation and merge are always performed manually by the user.

### Branch convention

Use lowercase kebab-case.

Preferred format:

```text
<type>/<feature-name>
```

Examples:

```text
feat/domain-foundation
feat/engine-integration
feat/logcomex-integration
feat/simulation-api
fix/cost-calculation
test/engine-boundaries
docs/technical-documentation
```

Prefer `feat/` for normal product development stages.

Use the exact stage branch from `PLANEJAMENTO.md` when one is specified.

A new roadmap stage normally requires a new branch.

Do not reuse a branch from a completed and merged stage for the next feature.

### Commit convention

Use Conventional Commits with an explicit scope.

Format:

```text
<type>(<area>): <descrição em português>
```

Examples:

```text
feat(domain): define contratos centrais de carga e rota

feat(engine): implementa elegibilidade determinística das rotas

feat(simulation): adiciona serviço de orquestração da simulação

feat(logcomex): adiciona adapter para análise documental

fix(costs): corrige cálculo do período de armazenagem

test(engine): adiciona cobertura para rotas indeterminadas

refactor(simulation): separa mapeamento do contrato público

docs(api): documenta endpoint de simulação

chore(docker): ajusta ambiente de desenvolvimento
```

The description after `:` must be written in Portuguese.

Keep:

- commit type in English;
- scope in English when it matches the technical area of the project;
- description in Portuguese.

Common types:

```text
feat
fix
test
refactor
docs
chore
build
ci
perf
```

Commit messages must describe what was actually implemented.

Avoid vague messages such as:

```text
feat(engine): atualizações
fix(api): ajustes
chore: mudanças
```

Prefer:

```text
feat(engine): adiciona resolução explícita de rotas indeterminadas

fix(api): valida NCM antes de iniciar a simulação
```

### Commit granularity

A feature branch should normally contain multiple commits when the implementation has multiple
meaningful checkpoints.

Good:

```text
feat(logcomex): define contratos do cliente externo

feat(logcomex): implementa adapter de análise documental

feat(simulation): integra dados documentais ao diagnóstico

test(logcomex): adiciona testes do adapter documental
```

Avoid creating one giant commit containing an entire complex stage when the work naturally
contains independent implementation milestones.

Also avoid creating noisy commits for trivial intermediate edits such as:

```text
chore: salva arquivo
fix: typo
chore: continua implementação
```

Commit when a coherent implementation step is complete and the repository is in a reasonable state.

Whenever practical, run the relevant tests for that checkpoint before committing.

### Push workflow

Push the feature branch after the current stage is complete and validated.

Example:

```bash
git push -u origin feat/eligibility-engine
```

After a successful push:

STOP development.

Report to the user:

- stage completed;
- branch name;
- commits created;
- files/features implemented;
- what was reused conceptually from the previous repository, when applicable;
- which relevant project references were consulted;
- validation performed;
- remaining gaps or unsupported data;
- that the branch is ready for a Pull Request.

Do not create the Pull Request.

Do not begin another feature branch.

Wait for the user to explicitly say that the PR was merged and that development may continue.

### After a Pull Request is merged

Only after explicit user confirmation:

1. switch to the project's base/integration branch;
2. fetch the remote;
3. update the local branch from the remote;
4. verify the merged changes are present;
5. read the next authorized stage in `PLANEJAMENTO.md`;
6. create the branch for that stage.

Example:

```bash
git switch main
git pull --ff-only
git switch -c feat/next-feature
```

Use the actual base branch configured by the repository. Do not assume it is always `main`
without inspecting the repository first.

### Attribution

Never add:

- `Co-Authored-By`;
- `Generated with Claude`;
- `Claude-Session`;
- AI attribution trailers;
- AI attribution in commit messages or Pull Request content.

Commits should contain only the project's normal Git metadata.

---

## Scope control

Implement only the requested stage/task.

`PLANEJAMENTO.md` defines the normal scope of each development stage.

Do not opportunistically:

- implement a later stage;
- refactor unrelated code;
- rename unrelated files;
- change architecture outside the authorized scope;
- add dependencies;
- modify UI outside the requested feature;
- change domain rules not required by the stage;
- add speculative abstractions;
- fill factual gaps with guesses.

If another change is necessary for the requested task, explain why before making it when the
impact is significant.

---

## Architecture principles

Follow the architecture described in `PLANEJAMENTO.md`.

Keep these responsibilities separated:

```text
Presentation / UI
        ↓
Application / orchestration
        ↓
Domain
   ├── eligibility engine
   └── route comparison / cost engine
        ↓
Data / external adapters
```

External services must not contain or determine OmegaSync business rules.

The deterministic domain owns the decision logic.

External integrations such as Logcomex provide or enrich data. They do not decide scenarios
or routes.

UI components must not reproduce business rules.

API/transport concerns must not leak into the deterministic domain.

---

## Deterministic motor

The core decision engine must remain:

- deterministic;
- testable;
- independent from React;
- independent from HTTP;
- independent from Logcomex;
- independent from database infrastructure;
- auditable.

Given the same normalized input, it must produce the same result.

Do not call external APIs from inside the deterministic engine.

When reusing concepts from the previous engine, re-evaluate them against the current architecture
defined in `PLANEJAMENTO.md`.

---

## Logcomex integration

Before implementing any Logcomex integration:

1. read the relevant Logcomex section in `FONTES.md`;
2. inspect the actual schema available to the team;
3. preserve provider-specific DTOs outside the domain;
4. create explicit adapters to OmegaSync application/domain models.

Treat Logcomex as an external data provider.

Never make the motor depend directly on Logcomex-specific request or response schemas.

Do not infer structured domain facts from free-form strings unless the task explicitly defines
a reliable parsing strategy.

If Logcomex does not provide a field, preserve it as unknown instead of inventing a value.

External data should retain provenance where relevant.

---

## Data integrity

`FONTES.md` defines the factual baseline and known gaps.

Important semantic rules:

```text
unknown != zero
unknown != false
not applicable != false
```

Examples:

- missing monetary value → `null`
- known monetary value of zero → `0`
- unknown availability → explicit unknown state
- non-applicable rule → explicit non-applicable state

Do not silently substitute missing information with:

- zero;
- `false`;
- an empty value that changes domain meaning;
- assumed business rules.

Do not invent:

- NCM mappings;
- tariffs;
- customs rules;
- regulatory deadlines;
- probabilities;
- route availability;
- external API data;
- DTA costs;
- transport costs.

When a required value is missing from `FONTES.md`, preserve the gap or model it as an explicit
simulation/user premise when the product design allows it.

---

## Evidence and assumptions

Use the confidence/provenance model described in `FONTES.md`.

Keep clear separation between:

- official regulation;
- official statistics;
- official tariffs;
- operator procedures;
- Logcomex/external-provider data;
- field research;
- operator/user input;
- simulation assumptions.

Research evidence such as:

```text
9 de 17
N=1
```

must not be converted into a general probability unless a valid statistical model explicitly
supports that interpretation.

Never remove caveats from data imported from `FONTES.md`.

---

## Tariffs and external numeric data

Before implementing or modifying a tariff:

1. consult `FONTES.md`;
2. identify terminal/recinto;
3. identify effective date or capture date;
4. identify calculation base;
5. identify period/fraction rules;
6. preserve minimums/additional charges when applicable;
7. preserve the source reference.

Do not spread raw tariff constants through domain/application code.

Prefer versioned datasets with explicit provenance.

If `FONTES.md` contains a warning that a historical value may refer to another terminal or
location, the warning MUST be preserved until the correct source is verified.

---

## Frontend

`DESIGN.md` is the mandatory visual reference for frontend work.

The new frontend should preserve the recognizable OmegaSync visual model from the previous
repository while adapting screens to the new routing/eligibility/cost-comparison product model.

Before significant frontend changes, inspect the previous visual implementation referenced in
`DESIGN.md`, especially when recreating:

- the OmegaSync brand;
- application shell/sidebar;
- page headings;
- module navigation;
- forms;
- result cards;
- tables;
- portfolio views;
- responsive behavior;
- interactive states.

Do not redesign the product into an unrelated visual language unless explicitly requested by
the user.

Do not copy old components blindly when their information architecture no longer matches the
current domain.

Frontend responsibilities:

- collect user input;
- perform basic presentation/format validation;
- call application/API boundaries;
- display returned routes, decisions, costs, evidence, warnings, unknown states, and pending data.

Frontend must not:

- calculate route eligibility independently;
- duplicate cascade/domain rules;
- infer customs clearance;
- infer anuência from NCM;
- calculate business costs independently from the backend/domain;
- silently transform missing values into zero;
- hide source/confidence caveats defined by `FONTES.md`;
- introduce a visual system inconsistent with `DESIGN.md` without explicit user approval.

---

## API and contracts

Public API DTOs should be separated from internal domain types when appropriate.

Do not expose internal implementation details merely because they already exist in TypeScript.

Validate external input at the application/API boundary.

Normalize external-provider responses before passing them into the domain.

Return explicit states for incomplete or unresolved information rather than fabricating a result.

---

## TypeScript

- Keep strict typing.
- Avoid `any`.
- Prefer discriminated unions for meaningful state transitions.
- Prefer explicit domain types over arbitrary strings when the set of values is known.
- Do not use unsafe type assertions to bypass a modeling problem.
- Keep functions focused.
- Prefer pure functions for deterministic transformations.

---

## React / Next.js

- Keep client components only where client behavior is required.
- Do not move domain logic into React components.
- Reuse existing components before creating duplicates.
- Preserve accessibility behavior.
- Preserve responsive behavior.
- Avoid unnecessary state duplication.

---

## Tests

Every new domain or application behavior should have appropriate tests.

When a concept existed in the previous repository, inspect its previous tests for useful edge
cases, but rewrite the tests for the new implementation and architecture.

Tests must validate behavior rather than implementation details when possible.

Important cases should include:

- happy path;
- pending/missing data;
- blocked/invalid state;
- unknown values;
- non-applicable rules;
- relevant boundary cases;
- provenance preservation where important.

Do not delete or weaken existing tests to make a new implementation pass.

---

## Validation before completion

For changes affecting TypeScript/Next.js, run the relevant available checks:

```bash
npm run test
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

When the project is running through Docker, prefer the equivalent commands inside the app
container.

Do not claim a command passed unless it was actually executed successfully.

If a check cannot be executed, report that clearly.

---

## Dependencies

Do not install a new package without a concrete need.

Before adding a dependency:

- check whether the platform or current dependencies already solve the problem;
- confirm compatibility with the current stack;
- explain why it is needed.

Never introduce a dependency just to avoid writing a small straightforward function.

---

## Secrets and external APIs

Never commit:

- API keys;
- tokens;
- passwords;
- private credentials;
- real secrets.

Use environment variables for sensitive configuration.

Example files such as `.env.example` must contain placeholders only.

Never print secrets to logs or test snapshots.

---

## Error handling

Do not swallow errors silently.

At external integration boundaries, distinguish when useful between:

- invalid input;
- external service failure;
- data not found;
- unresolved information;
- internal failure.

Fallback behavior must not convert uncertainty into false certainty.

---

## Code quality

Prefer:

- simple;
- explicit;
- testable;
- auditable;
- domain-correct code.

Avoid premature abstractions.

During the hackathon, optimize for a reliable working product and clear architecture rather
than unnecessary generalization.

---

## Completion report

When the current stage is finished:

1. run all relevant validation checks;
2. review `git status`;
3. review the commits created for the stage;
4. push the current feature branch;
5. stop development.

Report:

- stage completed;
- branch name;
- commits created;
- main files changed;
- functionality implemented;
- relevant sections of `PLANEJAMENTO.md` followed;
- relevant data/rules from `FONTES.md` used;
- relevant visual/UX rules from `DESIGN.md` followed when frontend work was involved;
- concepts reused from the previous OmegaSync repository, when applicable;
- tests/checks executed;
- factual gaps or assumptions that remain;
- relevant limitations or pending issues;
- confirmation that the branch was pushed and is ready for Pull Request.

Example:

```text
Etapa concluída: motor de elegibilidade

Branch:
feat/eligibility-engine

Referências consultadas:
- PLANEJAMENTO.md — Etapa 3
- FONTES.md — anuência, canal, janela de 48h e DTA
- DESIGN.md — quando aplicável à interface
- repositório anterior — implementação relevante como referência conceitual/visual

Commits:
- feat(engine): define contratos de elegibilidade das rotas
- feat(engine): implementa avaliação determinística de elegibilidade
- test(engine): adiciona testes para rotas viáveis e indeterminadas

Validações:
- npm run test
- npx tsc --noEmit
- npm run lint
- npm run build
- git diff --check

Push realizado.

A branch está pronta para você abrir o Pull Request.
Aguardando confirmação explícita do merge antes de iniciar a próxima etapa.
```

Do not proceed beyond this point until explicitly authorized by the user.
