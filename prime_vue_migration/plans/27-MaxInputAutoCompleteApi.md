# Plano 27 — `MaxInputAutoCompleteApi`

| | |
|---|---|
| **id** | 27 |
| **Arquivo** | `src/components/MaxInputAutoCompleteApi.vue` |
| **Primitiva eliminada** | `AutoComplete` (+ o **type** `AutoCompleteProps`) |
| **Depende de** | 26 (`MaxInputAutoComplete`) |
| **Teste existente** | `tests/components/MaxInputAutoCompleteApi.test.ts` |

---

## 1. Particularidade: dois imports, não um

```ts
// linha 25
import AutoComplete from 'primevue/autocomplete';
// linha 26
import type { AutoCompleteProps } from 'primevue/autocomplete';
```

O **import de tipo** é fácil de esquecer — ele não aparece no HTML renderizado e o
componente funciona em runtime mesmo com ele presente. Só o `grep` e o `type-check`
pegam.

```bash
grep -n "AutoComplete" src/components/MaxInputAutoCompleteApi.vue
# ambas as linhas devem sumir
```

---

## 2. A mudança

```diff
- import AutoComplete from 'primevue/autocomplete';
- import type { AutoCompleteProps } from 'primevue/autocomplete';
+ import MaxInputAutoComplete from './MaxInputAutoComplete.vue';
+ import type { MaxAutoCompleteProps } from '../types';
```

Onde `MaxAutoCompleteProps` é o tipo que você declara no [plano 26](26-MaxInputAutoComplete.md)
(ou em `src/types/index.ts`) espelhando as props da seção 1 daquele plano.

> Se `AutoCompleteProps` era usado em `defineProps<... extends AutoCompleteProps>` ou
> num `as`, o substituto precisa ter as mesmas propriedades — senão o `type-check`
> reprova ou, pior, passa e some com props do tipo público.

## 3. O que este componente adiciona

Ele é a versão "com API": em vez de o pai preencher `suggestions`, ele **busca sozinho**
num endpoint. Toda essa lógica (a função de fetch, a montagem da URL, o mapeamento da
resposta, o tratamento de erro) **permanece intacta** — ela apenas passa a alimentar
`MaxInputAutoComplete` em vez do `AutoComplete`.

Confirme lendo o arquivo: o handler de `@complete` provavelmente chama a API e atribui o
resultado a um ref local passado como `:suggestions`.

## 4. Pontos de atenção

- **Cancelamento de requisição**: se houver `AbortController` ou descarte de respostas
  fora de ordem, preserve. Sem isso, uma resposta lenta de uma busca antiga sobrescreve
  uma busca nova (race clássica de autocomplete).
- **Estado de `loading`**: deve continuar refletindo no painel.
- **Tratamento de erro**: a falha da API não pode deixar o componente travado em loading.

## 5. Teste

1. digitar dispara a chamada à API com a query correta;
2. a resposta preenche as sugestões exibidas;
3. `loading` fica `true` durante e `false` depois;
4. erro na API não trava o loading e não quebra o componente;
5. resposta fora de ordem é descartada (se houver cancelamento);
6. `minLength` respeitado antes de chamar a API;
7. debounce: digitar rápido gera **uma** chamada, não uma por tecla;
8. selecionar uma sugestão emite `update:modelValue`.

> Use `vi.mock` no cliente HTTP (ou no `fetch`, que o `tests/setup.ts` já mocka).

## 6. Checklist

- [ ] **Ambos** os imports removidos (runtime **e** type)
- [ ] `grep -n "primevue" <arquivo>` → vazio
- [ ] Tipo substituto declarado e com as mesmas propriedades
- [ ] `npm run type-check` passa (é o que valida o import de tipo)
- [ ] Lógica de API/cancelamento/erro intacta
- [ ] `lint`, `test` OK
