# useSearchBar.Store sem arquivo de teste unitário dedicado

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `src/stores/useSearchBar.Store.ts:12-43` (nenhum `tests/stores/useSearchBar*.test.ts`)
- **Domínio:** stores-barrel

## Problema

Não existe `tests/stores/useSearchBar.Store.test.ts`. A store só é exercitada **indiretamente** por testes de componente (`tests/components/MaxSideMenu.test.ts:114,165` e `tests/components/MaxTopMenu.test.ts:284`), que apenas escrevem em `input_value` e observam o efeito na árvore renderizada.

Isso explica a cobertura reportada de **76,9% de statements e 0% de branches**: o `watchDebounced` de `src/stores/useSearchBar.Store.ts:31-34` contém um `if/else` cujas duas pernas nunca são medidas por um teste que aguarde o debounce:

```ts
watchDebounced(input_value, () => {
    if (hasContent(input_value.value) && input_value.value.length >= 2) search_value.value = normalizeToSearch(input_value.value);
    else search_value.value = '';
}, { debounce: 200 });
```

Regras não testadas:
- `search_value` só é preenchido a partir de **2 caracteres** (limiar `>= 2`).
- `search_value` é **normalizado** por `normalizeToSearch` (acentos/caixa) — nada garante hoje que a normalização seja aplicada.
- `search_value` volta a `''` quando o texto encolhe abaixo do limiar.
- `is_filtering` (`:26`) é `true` durante a janela de debounce e volta a `false` depois — é o que controla o ícone de loading em `src/components/MaxTopMenuSearchBar.vue:10`.
- `is_visible` e `is_load_filter` nunca são exercitados diretamente.

## Impacto

Uma regressão no limiar de 2 caracteres, no debounce de 200 ms ou na normalização passaria despercebida pela suíte. O sintoma em produção seria busca global filtrando com 1 caractere (custo de performance em listas grandes), ou deixando de casar termos acentuados — ambos silenciosos, sem erro de console.

## Plano de correção

Criar `tests/stores/useSearchBar.Store.test.ts` usando `vi.useFakeTimers()` (padrão já adotado em `tests/stores/useToastStore.test.ts`), cobrindo:

1. Estado inicial: `is_visible === false`, `input_value === ''`, `search_value === ''`, `is_load_filter === false`.
2. `input_value = 'a'` + avanço de 200 ms → `search_value` permanece `''` (perna do `else`, limiar).
3. `input_value = 'ab'` + avanço de 200 ms → `search_value === normalizeToSearch('ab')` (perna do `if`).
4. Normalização: `input_value = 'Ação'` + debounce → `search_value` sem acento e em caixa baixa (asseverar contra `normalizeToSearch('Ação')` importado de `@maxvue/max-use`, não contra literal, para não duplicar a regra).
5. Encolhimento: após preencher com `'abc'`, voltar para `'a'` e avançar o timer → `search_value === ''`.
6. `is_filtering` é `true` imediatamente após escrever em `input_value` e `false` após o debounce liquidar.
7. `is_visible` e `is_load_filter` são graváveis e refletem o valor atribuído.

## Verificação

```bash
npx vitest run tests/stores/useSearchBar.Store.test.ts
npm run test:coverage
```

Meta: `src/stores/useSearchBar.Store.ts` com 100% de statements e 100% de branches (o arquivo tem um único `if/else`).
