# Mensagem de erro customizada trafega por `attrs: any` em vez de prop declarada

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputText.vue:34,93`, `src/components/MaxInputNumber.vue:18,85`, `src/components/MaxInputCep.vue:20,67`, `src/components/MaxInputCpfCnpj.vue:22,99`, `src/components/MaxInputPhoneMail.vue:16,86`
- **Domínio:** inputs-texto

## Problema

Cinco componentes do domínio permitem sobrescrever a mensagem de erro padrão, mas por um canal não declarado e não tipado. O padrão se repete literalmente:

```ts
const attrs: any = useAttrs();
// ...
const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
```

Três problemas encadeados:

1. **`useAttrs()` anotado como `any`.** `useAttrs()` já retorna um tipo (`Record<string, unknown>`); a anotação `: any` é uma degradação deliberada do tipo, e desliga qualquer checagem sobre tudo que for lido de `attrs` naquele arquivo. Isso contraria a orientação de tipagem estrita do projeto (o `type-check` com `vue-tsc` não tem como ajudar aqui).
2. **API pública invisível.** `errMsg` / `error_message` / `error_msg` são três aliases funcionais que não aparecem em nenhuma interface `defineProps`. Não são autocompletados, não são checados, não aparecem na documentação de props e não são descobríveis por quem lê o componente — só por quem lê o corpo do `error_msg` computed. `src/types/index.ts:114-141` (`InputBaseProps`) documenta as props comuns e **não** inclui nenhum desses.
3. **Fallthrough para o DOM.** Como não são props declaradas, esses atributos participam do fallthrough. Em `MaxInputText` e `MaxInputNumber`, que fazem `v-bind="props"` no `InputBase` (`MaxInputText.vue:10`), o `errMsg` acaba emitido como atributo no `<div>` raiz do `InputBase`. Em `MaxInputPhoneMail.vue:3`, que faz `v-bind="attrs"` no `InputText`, ele vai parar no `<input>`, gerando `<input errMsg="...">` — atributo inválido no HTML.

Os testes reforçam o acoplamento a esse canal informal em vez de questioná-lo: `tests/components/MaxInputCep.test.ts:83-87` e `tests/components/MaxInputPhoneMail.test.ts:132-136` passam `errMsg` via `attrs`.

Além disso, `MaxInputText.vue:94` lê `attrs.target_value ?? attrs.targetValue ?? attrs['target-value']` para compor a mensagem "Valor esperado: ...", **apesar de `targetValue` já ser uma prop declarada** (linha 62). Como prop declarada, ela nunca chega em `attrs` — então `attrs.targetValue` é sempre `undefined` e a mensagem sai como `'Valor esperado: undefined'`. O mesmo defeito está em `MaxInputNumber.vue:86`.

## Impacto

- Mensagem quebrada: `'Valor esperado: undefined'` é exibida ao usuário sempre que `targetValue` não bate, em `MaxInputText` e `MaxInputNumber`.
- API pública indocumentada e sem tipo: consumidores só descobrem `errMsg` lendo o código-fonte, e um erro de digitação (`errmsg`) falha em silêncio.
- Atributos inválidos vazando para o DOM.

## Plano de correção

1. Corrigir primeiro o defeito concreto: em `MaxInputText.vue:94` e `MaxInputNumber.vue:86`, trocar a leitura por `props.targetValue`, que é a prop declarada.
2. Promover a mensagem customizada a prop declarada, adicionando-a a `InputBaseProps` (`src/types/index.ts:114`):
   ```ts
   /** Sobrescreve a mensagem de erro padrão do componente */
   errMsg?: string;
   ```
3. Manter os aliases `error_message` / `error_msg` por compatibilidade durante um ciclo, mas lendo-os de props declaradas (o projeto já usa múltiplos aliases declarados, ver `src/index.ts`), e remover a anotação `: any` do `useAttrs()` nos cinco arquivos.
4. Aplicar componente a componente, rodando `npm run type-check` a cada um — remover o `any` vai expor outros acessos a `attrs` até então não checados (ex.: `attrs.label`, `attrs.phone`, `attrs.email` em `MaxInputPhoneMail.vue:2,192-199`), que precisam ser tratados no mesmo passo.

## Verificação

- Teste novo: montar `MaxInputText` com `targetValue: 'abc'` e um valor diferente, afirmar que a mensagem exibida contém `'abc'` e **não** contém `'undefined'`. Esse teste falha hoje.
- Teste equivalente para `MaxInputNumber`.
- Testes de não-regressão de `errMsg` já existentes (`MaxInputCep.test.ts:83`, `MaxInputPhoneMail.test.ts:132`, `MaxInputCpfCnpj.test.ts:99`) devem continuar passando após a promoção a prop.
- `npm run type-check` limpo e `npm run lint` sem novos avisos.
