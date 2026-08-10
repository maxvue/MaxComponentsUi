# `MaxTable.test.ts` stuba `DataTable`/`Column` por completo e valida apenas os próprios stubs

- **Categoria:** qualidade-de-teste
- **Severidade:** média
- **Arquivo(s):** `tests/components/MaxTable.test.ts:16-53`, `tests/components/MaxTable.test.ts:95`
- **Domínio:** docs-qualidade-testes

## Problema

`MaxTable.vue` é, hoje, um passthrough fino sobre `DataTable` e `Column` do PrimeVue —
o próprio `migration_executor.md:104-105` descreve assim: *"`MaxTable` é passthrough
sobre `DataTable`/`Column`"*. A suíte substitui **exatamente esses dois componentes**
por stubs (linhas 21-31):

```ts
stubs: {
    DataTable: {
        template: '<div class="p-datatable">...</div>',
        props: ['stripedRows']
    },
    Column: {
        template: '<div class="p-column">...</div>',
        props: ['header', 'style']
    }
}
```

Com isso, três dos cinco casos passam a afirmar apenas que o stub foi montado:

- linha 42: `expect(wrapper.find('.max-table-main-div').exists()).toBe(true);` — a única
  coisa realmente do `MaxTable`, mas ainda assim só "renderizou".
- linha 47: `expect(wrapper.find('.p-datatable').exists()).toBe(true);` — o teste se
  chama *"renderiza DataTable internamente"*, mas `.p-datatable` é a classe **escrita no
  template do stub** na linha 23. A asserção é tautológica: passaria mesmo que
  `MaxTable.vue` não repassasse prop, slot ou atributo algum.
- linha 52: `expect((wrapper.vm as any).width).toBeDefined();` — `toBeDefined()` sobre um
  `defineExpose`; não valida valor nem tipo, e usa `as any`.
- linha 71: `expect(wrapper.find('.custom-slot').exists()).toBe(true);` — verifica que o
  slot default atravessa, mas o stub da linha 64 renderiza `<slot />` incondicionalmente,
  então testa o stub, não o `MaxTable`.

Só o último caso (linhas 74-110) tem substância: valida `.max-table-buttons`, o
`.action-btn` do slot `buttons` e, principalmente, o cálculo de `width` (linhas 104-109),
que confere `mockWidth.value = 50 → vm.width === 60` e que uma segunda atualização
**não** altera o valor. Esse é o único comportamento próprio do componente sob teste.

Problema adicional de fragilidade: as asserções miram `.p-datatable` (linha 47) e
`.p-column` (linha 95) — **classes internas do PrimeVue**. Como a lib está em migração
ativa para remover o PrimeVue (item 31 da fila em `migration_executor.md:145`), essas
classes vão desaparecer, e o teste vai quebrar por motivo alheio ao comportamento.
O mesmo padrão frágil aparece em `tests/components/MaxUserAvatar.test.ts:32,38,44`
(`.p-avatar`), `tests/components/MaxInputSelect.test.ts:77,117` e
`tests/components/MaxTagSelect.test.ts:48` (`.p-select`).

## Impacto

- **Cobertura ilusória:** 4 de 5 casos passariam com um `MaxTable.vue` praticamente
  vazio. Um bug de repasse de props/atributos para o `DataTable` não seria detectado.
- **Migração desprotegida:** justamente o componente `muito_alta` que mais precisa de
  rede de segurança ao trocar `DataTable` por `@tanstack/vue-table` é o que tem os
  testes mais fracos. A migração vai depender de verificação manual.
- **Quebra garantida na migração:** as asserções em `.p-datatable`/`.p-column` vão
  falhar quando o PrimeVue sair, gerando ruído que mascara regressões reais.
- **`as any` (linhas 52 e 99)** contorna a tipagem e some com o erro caso o
  `defineExpose` mude de forma.

## Plano de correção

1. **Trocar as asserções de estrutura por asserções de contrato.** Em vez de verificar
   que o stub renderizou, verificar **o que o `MaxTable` passa para ele**:
   ```ts
   const dt = wrapper.findComponent({ name: 'DataTable' });
   expect(dt.props('stripedRows')).toBe(true);
   expect(dt.attributes('value')).toBe(...); // ou dt.props('value')
   ```
   Isso sobrevive à troca do motor de tabela, porque testa o repasse, não o HTML alheio.
2. **Eliminar as classes `.p-*` das asserções.** Substituir `.p-datatable` (linha 47) e
   `.p-column` (linha 95) por `findComponent` ou por uma classe própria do `MaxTable`
   (`.max-table-main-div`, `.max-table-buttons`). Aplicar a mesma correção nos demais
   arquivos citados (`MaxUserAvatar.test.ts`, `MaxInputSelect.test.ts`,
   `MaxTagSelect.test.ts`), preferindo `data-testid` ou classes `max-*`.
3. **Fortalecer o caso do `width`** (linha 52): trocar `toBeDefined()` por asserção de
   valor (`expect(vm.width).toBe(0)` no estado inicial) e remover o `as any` expondo o
   tipo via `defineExpose` tipado ou via `ComponentPublicInstance` explícito.
4. **Cobrir o que hoje não é coberto:** ordenação, paginação e seleção são repassados ao
   `DataTable` e não têm nenhum caso. Adicionar ao menos um teste de repasse por
   funcionalidade, para que a migração para TanStack Table tenha critério de aceite.
5. **Sequenciar com a migração:** fazer estes ajustes **antes** de executar o item 31 da
   fila, conforme o passo 6 do protocolo em `migration_executor.md:52-60`, que já manda
   ajustar stubs de PrimeVue *"preservando os asserts de comportamento"* — hoje quase não
   há asserts de comportamento a preservar.

## Verificação

- `grep -rn "'\.p-" tests/` não retorna asserções sobre classes internas do PrimeVue.
- `grep -n "as any" tests/components/MaxTable.test.ts` retorna vazio.
- **Teste de mutação manual:** comentar o repasse de `v-bind="attrs"` (ou equivalente)
  em `MaxTable.vue` e rodar `npx vitest run tests/components/MaxTable.test.ts` — a suíte
  **deve falhar**. Hoje ela passa, o que prova o problema.
- `npx vitest run tests/components/MaxTable.test.ts` verde após a refatoração, com
  número de casos maior que os 5 atuais.
