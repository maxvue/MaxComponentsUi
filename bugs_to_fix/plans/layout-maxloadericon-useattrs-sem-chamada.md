# MaxLoaderIcon atribui a função useAttrs em vez de chamá-la

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxLoaderIcon.vue:26`, `src/components/MaxLoaderIcon.vue:2`
- **Domínio:** tabela-layout-exibicao

## Problema

```ts
const attrs = useAttrs;   // <- faltam os parênteses
```

`attrs` recebe a **própria função** `useAttrs`, não o objeto de atributos. O template faz `v-bind="attrs"` na linha 2:

```vue
<div class="max-loader-icon-div" v-bind="attrs">
```

Fazer `v-bind` de uma função não espalha atributo algum. Todos os attrs passados ao `MaxLoaderIcon` — `style`, `class`, `color-*` do preset UnoCSS, `data-*`, handlers — são silenciosamente descartados.

O efeito é observável em `MaxLoadScreenTarget.vue:10`, que passa `style="width: 24px; height: 24px;"` ao `MaxLoaderIcon`. Esse style nunca chega ao elemento; o loader mantém os 55x55px fixos do SCSS (linhas 42-45), ignorando o tamanho pedido.

Como o Vue aplica *fallthrough* automático de atributos quando há um único elemento raiz, o `v-bind="attrs"` seria redundante de qualquer forma — mas a atribuição incorreta também não gera erro nem aviso, apenas silêncio.

Há um agravante: com `inheritAttrs` no padrão (`true`), o fallthrough automático **deveria** aplicar o `style`. Ele é neutralizado porque o `v-bind="attrs"` explícito não é o problema — o problema é que o SCSS declara `width: 55px; max-width: 55px` (linhas 42/44) sem `!important`, mas o `max-width` fixo impede que o style inline de 24px produza o resultado esperado em ambas as dimensões.

## Impacto

- Atributos passados ao componente são descartados ou aplicados de forma inconsistente.
- O loader não respeita tamanhos customizados — `MaxLoadScreenTarget` renderiza um spinner fora de escala dentro de uma grid de 20px (`MaxLoadScreenTarget.vue:89`).
- Erro silencioso: sem exceção, sem warning, sem falha de tipo.

## Plano de correção

1. Corrigir a chamada: `const attrs = useAttrs();`
2. Avaliar remover o `v-bind="attrs"` do template, já que o fallthrough automático cobre o caso de raiz única — mantendo apenas se houver intenção explícita.
3. Trocar as dimensões fixas do SCSS por valores que aceitem sobrescrita: remover `max-width`/`max-height` fixos ou expor uma prop `size` seguindo o padrão de `MaxIcon`/`MaxAiIcon` (`sizeStyles`).

## Verificação

- Teste montando `MaxLoaderIcon` com `attrs: { style: 'width: 24px', 'data-test': 'x' }` e asserindo que ambos aparecem no elemento raiz.
- Teste em `MaxLoadScreenTarget` asserindo o tamanho efetivo do loader.
- `npx vitest run tests/components/IconsAndLoaders.test.ts tests/components/MaxLoadScreen.test.ts`.
