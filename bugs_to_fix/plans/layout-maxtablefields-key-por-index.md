# MaxTableFields usa o índice como :key das linhas

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxTableFields.vue:24`
- **Domínio:** tabela-layout-exibicao

## Problema

```vue
<tr v-for="(row, index) in normalizedList" :key="index" ...>
```

A chave da linha é o índice posicional. Como cada `<td>` pode conter um **input com estado interno** (`MaxInputText`, `MaxInputSelect`, `MaxInputDatePicker`, `MaxInputAutoComplete`, `MaxPhoneField`, etc. — linhas 36-66), o Vue reaproveita a instância do componente na posição N quando a lista muda.

Cenários que quebram:
- Remover uma linha do meio: todas as linhas abaixo deslocam uma posição, mas mantêm as instâncias de input anteriores — foco, valor sendo digitado, estado de máscara e estado de dropdown ficam associados à linha errada.
- Reordenar/filtrar a lista: idem.
- Inserir no início: todas as linhas são patchadas em vez de uma única inserção — custo O(n) desnecessário em listas grandes.

Agrava-se pelo fato de `props.list` também aceitar um `Record` (linha 116) normalizado com `Object.values` (linha 154): a chave natural do registro é descartada.

## Impacto

- Perda/troca de valores digitados ao remover ou reordenar linhas — corrupção silenciosa de dados do formulário.
- Foco pulando para a linha errada.
- Re-render desnecessário de toda a cauda da lista em inserções/remoções.

## Plano de correção

1. Derivar uma chave estável da linha, com fallback controlado:
   ```ts
   const rowKey = (row: any, index: number): string | number => row?.id ?? row?.uuid ?? row?.ulid ?? index;
   ```
2. Usar `:key="rowKey(row, index)"` no `<tr>`.
3. Opcionalmente expor uma prop `dataKey?: string` (mesmo vocabulário do `DataTable` do PrimeVue) para o consumidor indicar o campo identificador, caindo no fallback quando ausente.
4. Ao normalizar um `Record`, preservar a chave do objeto como identidade da linha (`Object.entries`), em vez de descartá-la.

## Verificação

- Teste: montar com 3 linhas contendo `col.input === 'text'`, digitar na linha 2, remover a linha 1 e asserir que o valor exibido na (agora) linha 1 corresponde ao registro correto.
- `npx vitest run tests/components/MaxTableFields.test.ts`.
