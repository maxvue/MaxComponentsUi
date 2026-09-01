Nova tentativa após a reprovação, **reaproveitando a branch** `fix/gh-7` (`git worktree add .worktrees/wt-fix-gh-7 fix/gh-7`). A revisão foi explícita: a abordagem estava correta na raiz, o defeito era a *natureza* da guarda, e mandou preservar todo o resto. Recomeçar do zero descartaria trabalho já aprovado pela própria revisão.

Correção implementada em `fix/gh-7` (`486cace816978547d468e3f2ff895cd327bb3191`), aguardando revisão do /bugs-check.

### O que mudou nesta tentativa

**Proteção por origem do valor, não por momento** — exatamente a decisão de design que a revisão apontou como faltante. O flag `auto_filled` responde "quem escreveu o valor atual?":

```ts
// no watch(street)
if (!props.autoDetect) return;
// Valor já definido por origem externa (usuário ou pai) nunca é sobrescrito —
// a qualquer momento, não só no mount. Só um valor vazio ou auto-detectado cede.
if (inputValue.value && !auto_filled.value) return;
```

- a auto-detecção **liga** `auto_filled` ao escrever → o valor continua redetectável;
- `onUserSelect` (usuário) e `watch(() => props.modelValue)` (pai) **zeram** o flag → o valor passa a ser intocável, sem prazo de validade.

`first_run` e `user_touched` foram removidos: a revisão observou que ficariam redundantes, e ficaram. A guarda do eco em `onUserSelect` foi **mantida** — sem ela o eco do `MaxInputSelect` marcaria o valor como de origem do usuário sem interação humana, e a auto-detecção voltaria a funcionar uma única vez.

Isso resolve o conflito que a revisão levantou entre "não sobrescrever valor definido" e "redetectar em CEPs sucessivos": as duas exigências convivem porque a distinção passou a ser de **origem**, não de momento.

### Testes (item 2 da revisão), todos com o `MaxInputSelect` real
- `preserva o modelValue do pai quando street muda DEPOIS do mount` → cenário **A1**;
- `preserva o modelValue do pai enquanto o usuário digita a rua` (`'V'`→`'Vi'`→`'Vila'`→`'Vila N'`→`'Vila Nova'`) → cenário **A3**, o mais cotidiano;
- `o valor trocado pelo pai depois de uma auto-detecção passa a ser protegido` → cobre o `watch(() => props.modelValue)` zerando o flag.

Dois testes **da tentativa anterior** (não dos 10 preexistentes) liam `user_touched` diretamente; passaram a ler `auto_filled`, preservando a intenção original de cada um. A revisão autorizou explicitamente a remoção de `user_touched`. Os **10 testes preexistentes seguem sem alteração** (item 3).

### Prova de que os testes não são vacuosos
Removendo apenas a linha da guarda de origem: **6 testes falham** — os 3 novos acima e os 3 que já protegiam escolha manual/valor persistido. Com a guarda, 21/21 passam.

### Validação (executada de dentro do worktree)
- `npx vitest run tests/components/MaxInputTypeAddress.test.ts` → **21 passed**
- `npx vitest run tests/components/MaxInputTypeAddress.test.ts tests/components/MaxInputSelect.test.ts` → **30 passed**
- `npm run test` → **113 arquivos, 1414 testes, todos passando**
- `npm run type-check` → sem erros
- `npm run lint` → sem erros

### Item 4 — plano de migração
`migration_plans/MaxInputTypeAddress.md` atualizado para a lógica final: descreve a proteção por origem, registra por que a guarda de "primeira execução" **não** basta (expira após o mount), e mantém a guarda do eco como obrigatória para a reimplementação do select (item 26 da fila).

### Observação
`features.productionLogs` está desligado neste projeto: nenhuma verificação por log de produção. Toda a evidência é local (Vitest com o `MaxInputSelect` real).