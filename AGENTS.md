# OmegaSync — Agent Instructions

## Project context

OmegaSync is being developed during Porto Hack Santos 2026.

The implementation submitted in this repository must be produced during the hackathon.
Previous repositories, prototypes, experiments, or pre-hackathon implementations must not
be copied, cherry-picked, or reused as source code.

Previous research, interviews, public sources, domain knowledge, requirements, and technical
lessons may be used as references when explicitly provided by the team.

Do not copy implementation code from older OmegaSync repositories.

---

## Working language

- Source code identifiers: English when appropriate and consistent with the codebase.
- Domain terminology may remain in Portuguese when it represents official Brazilian customs
  or port concepts.
- User-facing product text: Portuguese (pt-BR).
- Commit messages: Portuguese, following the commit convention defined in this file.

---

## General workflow

Development is performed incrementally, one explicit stage at a time.

Before changing code:

1. Inspect the relevant existing files.
2. Understand the current architecture and conventions.
3. Check related types, tests, dependencies, and contracts.
4. Confirm the scope of the current stage.
5. Work only on the feature branch assigned to that stage.
6. Implement the stage incrementally.
7. Commit meaningful implementation checkpoints as they are completed.
8. Run the relevant validation checks.
9. Push the feature branch.
10. Report that the branch is ready for Pull Request.

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

Examples:

```text
feat/engine-foundation
feat/engine-integration
feat/logcomex-integration
feat/simulation-api
feat/frontend-simulation
feat/portfolio-analysis
```

A branch represents a development stage or coherent feature.

Do not implement unrelated roadmap stages in the same branch.

Typical lifecycle:

```text
base branch
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
create next feature branch
```

Example:

```text
feat/engine-integration
```

may contain several commits such as:

```text
feat(engine): adiciona contratos da integração do motor

feat(engine): implementa normalização das entradas

feat(engine): integra execução determinística ao serviço de simulação

test(engine): adiciona testes da integração do motor
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
feat/engine-integration
feat/logcomex-integration
feat/simulation-api
fix/cost-calculation
test/engine-boundaries
docs/technical-documentation
```

Prefer `feat/` for normal product development stages.

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
feat(engine): implementa cascata determinística de decisão

feat(simulation): adiciona serviço de orquestração da simulação

feat(logcomex): adiciona adapter para análise documental

fix(costs): corrige cálculo do período de armazenagem

test(engine): adiciona cobertura para cenários pendentes

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
feat(engine): adiciona resolução explícita de dados pendentes

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
git push -u origin feat/engine-integration
```

After a successful push:

STOP development.

Report to the user:

- branch name;
- commits created;
- files/features implemented;
- validation performed;
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
5. create the branch for the next explicitly authorized stage.

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

Implement only the requested task.

Do not opportunistically:

- refactor unrelated code;
- rename unrelated files;
- change architecture;
- add dependencies;
- modify UI outside the requested feature;
- modify domain rules;
- add speculative abstractions;
- implement future roadmap items.

If another change is necessary for the requested task, explain why before making it when the
impact is significant.

---

## Architecture principles

Keep these responsibilities separated:

```text
Presentation / UI
        ↓
Application / orchestration
        ↓
Domain / deterministic engine
        ↓
External data adapters
```

External services must not contain or determine OmegaSync business rules.

The deterministic motor owns the decision logic.

External integrations such as Logcomex provide or enrich data. They do not decide scenarios.

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

---

## Logcomex integration

Treat Logcomex as an external data provider.

Use adapters/interfaces between Logcomex payloads and OmegaSync domain/application models.

Never make the motor depend directly on Logcomex-specific request or response schemas.

Do not infer structured domain facts from free-form strings unless the task explicitly defines
a reliable parsing strategy.

If Logcomex does not provide a field, preserve it as unknown instead of inventing a value.

External data should retain provenance where relevant.

---

## Data integrity

Important semantic rule:

```text
unknown != zero
```

Examples:

- missing monetary value → `null`
- known monetary value of zero → `0`

Do not silently substitute missing information with:

- zero;
- `false`;
- an empty value that changes domain meaning;
- assumed business rules.

Do not invent NCM mappings, tariffs, customs rules, probabilities, or external API data.

---

## Evidence and assumptions

Keep clear separation between:

- public/official data;
- research/interview evidence;
- external-provider data;
- operator input;
- simulation assumptions.

Simulation assumptions must be explicitly identifiable as assumptions.

Small samples such as N=1 or survey counts must not be converted into probabilities unless a
real statistical model explicitly supports that interpretation.

---

## Frontend

Frontend responsibilities:

- collect user input;
- perform basic presentation/format validation;
- call application/API boundaries;
- display returned decisions, costs, evidence, warnings, and pending states.

Frontend must not:

- calculate A–F scenarios;
- duplicate cascade rules;
- infer customs clearance;
- infer anuência from NCM;
- calculate business costs independently from the backend/domain;
- silently transform missing values into zero.

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

Tests must validate behavior rather than implementation details when possible.

Important cases should include:

- happy path;
- pending/missing data;
- blocked/invalid state;
- relevant boundary cases.

Do not delete or weaken existing tests to make a new implementation pass.

---

## Validation before completion

For changes affecting TypeScript/Next.js, run the relevant available checks:

```bash
npm run test
npx tsc --noEmit
npm run lint
npm run build
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
- tests/checks executed;
- relevant limitations or pending issues;
- confirmation that the branch was pushed and is ready for Pull Request.

Example:

```text
Etapa concluída: integração do motor

Branch:
feat/engine-integration

Commits:
- feat(engine): adiciona contratos da integração
- feat(engine): implementa normalização das entradas
- feat(engine): integra motor ao serviço de simulação
- test(engine): adiciona testes da integração

Validações:
- npm run test
- npx tsc --noEmit
- npm run lint
- npm run build

Push realizado.

A branch está pronta para você abrir o Pull Request.
Aguardando confirmação explícita do merge antes de iniciar a próxima etapa.
```

Do not proceed beyond this point until explicitly authorized by the user.
