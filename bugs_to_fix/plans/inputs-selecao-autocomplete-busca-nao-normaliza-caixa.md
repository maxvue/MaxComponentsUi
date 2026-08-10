# Filtro dos autocompletes compara caixas diferentes e ignora `optionLabel`

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputAutoComplete.vue:77-82`, `src/components/MaxInputAutoCompleteApi.vue:107-112`
- **Domínio:** inputs-selecao-arquivo

## Problema

Os dois componentes têm a mesma função `search` com o mesmo defeito:

`MaxInputAutoComplete.vue:77-82`
```ts
const search = () => {
    filtered_values.value = list.value.filter((item: any) => {
        const search = (item.value ?? '') + (item.label ?? '') + (item.name ?? '') + (item[props.optionValue ?? 'value'] ?? '');
        return toSearchableString(search).toLowerCase().includes(toSearchableString(temp_value_string.value));
    });
};
```

**1. Comparação de caixa assimétrica.** O lado esquerdo aplica `.toLowerCase()` após `toSearchableString`; o lado direito (o termo digitado) **não**. Se `toSearchableString` não normalizar a caixa por conta própria, digitar `"JOÃO"` ou `"João"` não casa com o item `"joão"` — o `includes` compara `"joão"` contra `"JOÃO"`/`"João"`. O usuário digita corretamente e não vê resultado.

**2. `optionLabel` ignorado na concatenação.** A string de busca concatena `value`, `label`, `name` e `item[props.optionValue]` — mas nunca `item[props.optionLabel]`. Como `optionLabel` tem default `'name'` no `MaxInputAutoComplete` (linha 43) e `'label'` no `MaxInputAutoCompleteApi` (linha 53), os defaults acabam cobertos por acidente. Porém, uma app que passe `option-label="descricao"` verá o texto de `descricao` renderizado nas opções (o template usa `slotProps.option[props.optionLabel ?? 'label']`, linha 6) e **não conseguirá buscar por ele** — busca-se por campos que a UI nem exibe.

**3. Campos duplicados.** `item[props.optionValue ?? 'value']` repete `item.value` sempre que `optionValue` é o default, inflando a string de busca sem ganho.

Nota: no `MaxInputAutoCompleteApi` a `search` é chamada pelo watch de `temp_value` (linha 101) além do `@complete`, então o defeito se manifesta nos dois caminhos.

## Impacto

Buscas que deveriam casar retornam vazio quando o usuário usa maiúsculas — comportamento natural ao digitar nomes próprios, exatamente o dado mais comum nesses campos. Com `optionLabel` customizado, o campo exibido é inbuscável, o que faz o autocomplete parecer quebrado. Como `forceSelection: true` está ativo no `MaxInputAutoComplete` (linha 3), o usuário que não encontra a opção fica impedido de preencher o campo.

## Plano de correção

1. Normalizar os dois lados da comparação de forma idêntica. Extrair um helper local:
   ```ts
   const norm = (v: any) => toSearchableString(String(v ?? '')).toLowerCase();
   ```
   e usar `norm(searchStr).includes(norm(temp_value_string.value))`.
2. Incluir `item[props.optionLabel]` na string de busca e remover a duplicata de `optionValue`, construindo a lista de campos a partir de um `Set` para evitar repetição:
   ```ts
   const fields = [...new Set([props.optionLabel, props.optionValue, 'value', 'label', 'name', 'sub_label'])];
   const searchStr = fields.map((f) => item?.[f] ?? '').join(' ');
   ```
   (o `sub_label` já é considerado no `MaxInputAutoCompleteApi`, linha 109 — unificar os dois componentes no mesmo conjunto de campos).
3. Aplicar a correção idêntica nos dois arquivos; a lógica é duplicada e deve permanecer em paridade.

## Verificação

- Novo teste em `tests/components/MaxInputAutoComplete.test.ts`: com opções `[{ value: 1, name: 'joão' }]`, chamar `search` com `temp_value` = `'JOÃO'` deve retornar 1 resultado (hoje retorna 0).
- Teste de `optionLabel` customizado: com `optionLabel: 'descricao'` e opção `{ value: 1, descricao: 'Contrato Social' }`, buscar por `'contrato'` deve casar.
- Teste equivalente em `tests/components/MaxInputAutoCompleteApi.test.ts`.
- Teste de regressão: busca minúscula existente continua funcionando.
- `npx vitest run tests/components/MaxInputAutoComplete.test.ts tests/components/MaxInputAutoCompleteApi.test.ts`.
