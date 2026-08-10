# Uso disseminado de `as any` em testes para acessar internals via `wrapper.vm`

- **Categoria:** qualidade-de-teste
- **Severidade:** média
- **Arquivo(s):** `tests/components/MaxInputCpfCnpj.test.ts:41-161`, `tests/components/MaxPopoverMenu.test.ts:58-109`, `tests/components/SelectionInputs.test.ts:35-133`, `tests/stores/useUser.Store.test.ts:68-83`
- **Domínio:** docs-qualidade-testes

## Problema

O projeto adota TypeScript estrito e tem uma skill dedicada com regra de "no-any"
(`typescript-best-practices`), mas os testes usam `any` em larga escala. O grep
`grep -rn ": any\|as any\|<any>" tests/` retorna dezenas de ocorrências, concentradas em
dois padrões distintos.

### Padrão 1 — `(wrapper.vm as any).<internal>` para ler/escrever estado interno

O caso mais extremo é `tests/components/MaxInputCpfCnpj.test.ts`, com **mais de 20**
ocorrências. O teste manipula diretamente o estado interno do componente em vez de
interagir pelo DOM:

- linha 55: `(wrapper.vm as any).temp_value = '52998224725';`
- linha 57: `expect((wrapper.vm as any).done).toBe(true);`
- linha 83: `expect((wrapper.vm as any).maskValue.mask).toContain('##.###.###/####-##');`
- linhas 113, 121, 130, 135, 144, 153, 157, 161: mesma manipulação de `temp_value`.

O mesmo padrão em:

- `tests/components/MaxPopoverMenu.test.ts:58,74,91,109` — `const vm = wrapper.vm as any;`
- `tests/components/SelectionInputs.test.ts:35,106,119,133` — inclusive
  `(wrapper.vm as any).button = null;` (linha 106), que **escreve** em um ref interno
- `tests/components/MaxInputToggle.test.ts:51,71` — chama `update_value()` diretamente
- `tests/components/MaxInputSwitch.test.ts:93` — lê `temp_value`
- `tests/components/MaxInputTypeAddress.test.ts:73,78`
- `tests/components/MaxButton.test.ts:72,82,89` — invoca `onClick(new MouseEvent('click'))`
  em vez de disparar `trigger('click')` no DOM
- `tests/components/MaxPdfView.test.ts:47`, `tests/components/MaxTable.test.ts:52,99`

### Padrão 2 — `importOriginal() as any` e mocks sem tipo

- `tests/stores/useIcon.Store.test.ts:8` e
  `tests/stores/useIconStore.cache-sanitize.test.ts:13`: `await importOriginal() as any`
- `tests/stores/useLogin.Store.test.ts:10-12`: `(...args: any[]) => apiPostRoute(...args)`
- `tests/components/MaxInputCpfCnpj.test.ts:11`: `(source: any, cb: any) => watch(...)`
- `tests/components/MaxApp.test.ts:16` e `MaxPageLayout.test.ts:15`: `ref<any>(null)`
- `tests/components/MaxInputCoordinates.test.ts:8`:
  `function mountCoord(component: any, props: Record<string, any> = {})`

Existe o padrão correto no próprio repositório para comparação:
`tests/components/MaxTable.test.ts:9` usa
`await importOriginal<typeof import('@maxvue/max-use')>()`, sem `any`.

Caso especialmente frágil — `tests/stores/useUser.Store.test.ts:68-83`:

```ts
(store as any).status = { server: { get: { is_success: true } } };
...
(store as any).status.server.get.is_success = true;
```

Isso força um formato de estado interno da store; qualquer refatoração da forma de
`status` quebra o teste sem que o comportamento público tenha mudado.

## Impacto

- **Acoplamento a detalhe de implementação:** testes que leem `temp_value`, `maskValue`,
  `done` ou chamam `onClick`/`update_value` diretamente quebram em qualquer renomeação
  interna, mesmo com o comportamento observável idêntico. Isso é especialmente grave
  agora: a migração de independência do PrimeVue vai reescrever o interior de dezenas de
  componentes, e o próprio `migration_executor.md:52-60` exige rodar os testes de cada
  componente como critério de aceite.
- **Testes que não provam o que importa:** invocar `onClick` diretamente
  (`MaxButton.test.ts:72`) não prova que o handler está **ligado** ao `<button>`. Um
  `@click` removido do template passaria despercebido.
- **Perda da rede de segurança do compilador:** `as any` desliga a checagem justamente
  onde ela detectaria contratos quebrados. `npm run type-check` não acusa nada.
- **Contradição com as normas do projeto:** o repositório declara padrão estrito de
  tipagem, mas a suíte de testes é a maior concentração de `any` do código.

## Plano de correção

1. **Priorizar por risco.** Corrigir primeiro os componentes que estão na fila de
   migração com status `waiting` e cujos testes serão usados como critério de aceite:
   `MaxInputCpfCnpj` (item 7), `MaxInputToggle` (item 16), `MaxButton` (item 19),
   `MaxPopoverMenu` (item 22). São os que vão quebrar durante a migração.
2. **Substituir manipulação de internals por interação de DOM.** Onde o teste hoje
   escreve `temp_value`, passar a usar `input.setValue(...)`; onde chama `onClick`,
   usar `await wrapper.find('button').trigger('click')`; e assertar via
   `wrapper.emitted('update:modelValue')` ou via o DOM renderizado, em vez de ler refs.
3. **Quando o estado interno realmente precisar ser inspecionado**, expô-lo de forma
   tipada com `defineExpose` no componente e tipar o wrapper
   (`mount<InstanceType<typeof MaxInputCpfCnpj>>(...)`), eliminando o `as any`. Isso
   torna o acesso um **contrato explícito** em vez de um furo.
4. **Tipar todos os `importOriginal()`** com
   `importOriginal<typeof import('<modulo>')>()`, replicando o padrão já correto de
   `tests/components/MaxTable.test.ts:9`.
5. **Tipar os helpers de mount:** `mountCoord(component: any, ...)`
   (`MaxInputCoordinates.test.ts:8`) recebe `Component` do `vue`; os `ref<any>(null)` de
   `MaxApp.test.ts:16` e `MaxPageLayout.test.ts:15` recebem o tipo real do menu.
6. **Impedir reincidência:** habilitar a regra de lint que proíbe `any` explícito também
   em `tests/` (hoje aparentemente não aplicada ali), com exceções pontuais e
   justificadas por comentário.

## Verificação

- `grep -rn "as any" tests/ | wc -l` cai substancialmente a cada arquivo tratado; a meta
  é zero fora de exceções comentadas.
- `npm run type-check` continua limpo (as correções não podem introduzir erro de tipo).
- `npm run lint` acusa `any` novo em `tests/` após a regra ser habilitada.
- **Teste de mutação decisivo:** remover o `@click` do `<button>` em `MaxButton.vue` e
  rodar `npx vitest run tests/components/MaxButton.test.ts` — deve **falhar**. Com o
  teste atual (que chama `onClick` diretamente na linha 72) ele passa, o que demonstra
  o furo.
- `npx vitest run` verde ao final, com a mesma quantidade ou mais de casos.
