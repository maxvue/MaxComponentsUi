# Três suítes sobrepostas para o `useIconStore`, com convenções de nome divergentes

- **Categoria:** qualidade-de-teste
- **Severidade:** média
- **Arquivo(s):** `tests/stores/useIcon.Store.test.ts:1-233`, `tests/stores/useIconStore.test.ts:1-69`, `tests/stores/useIconStore.cache-sanitize.test.ts:1-92`
- **Domínio:** docs-qualidade-testes

## Problema

O mesmo módulo (`src/stores/useIcon.Store.ts`) é testado por **três** arquivos distintos,
com dois problemas independentes: sobreposição real de casos e incoerência de nomenclatura.

### 1. Convenção de nomes incoerente

Os três arquivos não seguem a mesma regra:

| Arquivo | Convenção |
|---|---|
| `tests/stores/useIcon.Store.test.ts` | espelha o nome do fonte (`useIcon.Store.ts`) |
| `tests/stores/useIconStore.test.ts` | espelha o nome do **composable** (`useIconStore`) |
| `tests/stores/useIconStore.cache-sanitize.test.ts` | nome do composable + sufixo de tema |

Pior: **dois deles declaram o mesmo `describe`** — `describe('useIconStore', ...)` em
`useIcon.Store.test.ts:17` e em `useIconStore.test.ts:5`. Na saída do Vitest os dois
blocos aparecem com rótulo idêntico, e só o caminho do arquivo os distingue.

O diretório inteiro é inconsistente: convivem `useIcon.Store.test.ts`,
`useLoading.Store.test.ts`, `useLogin.Store.test.ts`, `useSystem.Store.test.ts`,
`useUser.Store.test.ts` (estilo "arquivo-fonte") com `useConfirmStore.test.ts`,
`useModalStore.test.ts`, `usePopoverStore.test.ts`, `useToastStore.test.ts`
(estilo "composable"). Não há regra única.

### 2. Sobreposição real de casos

`useIconStore.test.ts` é quase inteiramente um **subconjunto** de `useIcon.Store.test.ts`:

| Comportamento | `useIconStore.test.ts` | `useIcon.Store.test.ts` |
|---|---|---|
| ícone novo → `null` + `'waiting'` | linhas 12-18 | linhas 55-61 |
| ícone já carregado → retorna SVG | linhas 20-26 | linhas 47-53 |
| carrega cache do `localStorage` | linhas 44-54 | linhas 36-45 |
| `list_icons_waiting_request` filtra | linhas 56-68 | linha 33 (parcial) |

Sobram apenas dois casos exclusivos em `useIconStore.test.ts`:
retorno `null` para sentinela `'waiting'` (linhas 28-34) e **trim** do nome do ícone
(linhas 36-42) — este último é o único genuinamente único e vale preservar.

`useIconStore.cache-sanitize.test.ts`, por outro lado, é **complementar e legítimo**:
está pinado em `jsdom` via `// @vitest-environment jsdom` (linha 1) com uma
justificativa explícita nas linhas 3-5 — sob `happy-dom` o DOMPurify vira no-op e um
teste de sanitização passaria mesmo sem sanitização alguma. Esse arquivo **não deve ser
fundido** com os outros dois, porque perderia o ambiente `jsdom`.

Há ainda duplicação de setup: o mock de `watchDebounced` é repetido byte a byte em
`useIcon.Store.test.ts:7-15` e `useIconStore.cache-sanitize.test.ts:12-20`, ambos
usando `importOriginal() as any`.

## Impacto

- **Manutenção dobrada:** uma mudança no contrato do `getIcon` exige editar dois
  arquivos que testam a mesma coisa.
- **Diagnóstico confuso:** dois `describe('useIconStore')` idênticos na saída do
  Vitest; ao ver uma falha é preciso conferir o caminho para saber qual suíte quebrou.
- **Risco de divergência silenciosa:** os dois arquivos já divergem no comentário sobre
  re-sanitização do cache (`useIcon.Store.test.ts:41-42` vs `useIconStore.test.ts:51-52`),
  sinal de que foram atualizados em momentos diferentes.
- **Ambiguidade para quem escreve teste novo:** não há como saber em qual dos três
  arquivos um caso novo deveria entrar.

## Plano de correção

1. **Fixar a convenção de nomenclatura** do diretório `tests/stores/`. Recomendado:
   espelhar o arquivo-fonte (`useIcon.Store.test.ts`), que é o padrão majoritário
   (5 arquivos contra 4) e o que a documentação de arquitetura usa. Registrar a regra
   no `CONTRIBUTING.md`.
2. **Consolidar `useIconStore.test.ts` em `useIcon.Store.test.ts`:**
   - migrar o caso de **trim** do nome do ícone (linhas 36-42) — é exclusivo;
   - migrar o caso do sentinela `'waiting'` retornando `null` (linhas 28-34) se não
     estiver coberto;
   - migrar a asserção completa de `list_icons_waiting_request` (linhas 56-68), que é
     mais forte que a do arquivo grande;
   - **deletar** `tests/stores/useIconStore.test.ts`.
3. **Renomear** `useIconStore.cache-sanitize.test.ts` → `useIcon.Store.cache-sanitize.test.ts`
   para alinhar com a convenção, **preservando** o `// @vitest-environment jsdom` da
   linha 1 e o comentário explicativo das linhas 3-5. Não fundir com o arquivo principal.
4. **Extrair o mock duplicado de `watchDebounced`** para um helper compartilhado
   (ex.: `tests/helpers/mockWatchDebounced.ts`), tipando `importOriginal()` com
   `importOriginal<typeof import('@maxvue/max-use')>()` em vez de `as any` — padrão
   que `tests/components/MaxTable.test.ts:9` já usa corretamente.
5. **Diferenciar os `describe`** restantes: usar rótulos que digam o recorte
   (ex.: `describe('useIconStore — cache e fetch', ...)` e
   `describe('useIconStore — sanitização do cache do localStorage', ...)`, este último
   já correto na linha 24 do arquivo de sanitização).

## Verificação

- `ls tests/stores/` mostra uma única convenção de nomes.
- `grep -rn "describe('useIconStore'" tests/` retorna no máximo uma ocorrência.
- `npx vitest run tests/stores/` continua verde e a contagem total de casos
  **não diminui** (os casos exclusivos foram migrados, não perdidos).
- `npx vitest run tests/stores/useIcon.Store.cache-sanitize.test.ts` continua rodando
  sob `jsdom` — confirmar que o teste de SVG malicioso **falha** se a chamada de
  sanitização for removida do fonte (prova de que o ambiente ainda é o correto).
- `grep -rn "as any" tests/stores/` não retorna mais os `importOriginal() as any`.
