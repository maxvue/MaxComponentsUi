# MaxLoader e MaxLoaderAi usam attrs não tipados como props e vazam `show`/`label` para o DOM

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxLoader.vue:2-5`, `src/components/MaxLoader.vue:13`, `src/components/MaxLoaderAi.vue:3-6`
- **Domínio:** tabela-layout-exibicao

## Problema

Ambos os loaders leem sua configuração de `attrs` em vez de props declaradas:

```vue
<div v-bind="attrs" v-if="attrs.show !== undefined ? attrs.show : true" class="max-loader-main-div">
    <div class="items">
        <LoaderIcon />
        <div v-if="attrs.label" class="item-label">{{ attrs.label }}</div>
```

Quatro problemas decorrem disso:

1. **Sem tipagem nem autocompletar.** `const attrs: any = useAttrs();` (`MaxLoader.vue:13`) descarta o tipo. `show` e `label` são a API pública real do componente, mas não aparecem em nenhuma interface — o consumidor não tem como descobri-los senão lendo o código-fonte. Contraria a convenção do projeto (`defineProps<Interface>()` tipado) e a regra de não usar `any`.

2. **`show` e `label` vazam para o DOM.** Como não são props declaradas, permanecem em `attrs` e são espalhados pelo `v-bind="attrs"` do mesmo elemento. O DOM final recebe `show="false"` e `label="Carregando"` como atributos HTML inválidos. Props declaradas são automaticamente removidas de `attrs`; attrs não declarados não são.

3. **`show` como atributo string.** Em uso via template sem binding (`<MaxLoader show="false" />`), o valor chega como a **string** `'false'`, que é truthy — o loader aparece quando deveria sumir. Uma prop declarada como `boolean` receberia a coerção correta do Vue.

4. **`LoaderIcon` depende de resolução por auto-import.** `MaxLoader.vue:4` usa `<LoaderIcon />`, mas o `<script setup>` (linhas 10-14) importa apenas `useAttrs`. O nome resolve porque `LoaderIcon` é um alias registrado de `MaxLoaderIcon` no manifesto do resolver (`src/components-manifest.json:487`) — ou seja, **funciona apenas em aplicações que configurem o `MaxComponentsUiResolver`**. Um componente interno da biblioteca não deveria depender do mecanismo de auto-import do consumidor para resolver sua própria dependência interna: todos os demais componentes importam explicitamente (ex.: `MaxLoadScreenTarget.vue:33` faz `import MaxLoaderIcon from './MaxLoaderIcon.vue'`).

O ponto 4 é uma fragilidade de acoplamento, não uma falha em runtime nas configurações suportadas hoje.

## Impacto

- `MaxLoader` só renderiza o ícone em apps com o resolver configurado; um consumidor que importe o componente diretamente perde o ícone silenciosamente.
- `show="false"` sem binding não oculta o loader.
- Atributos inválidos no DOM.
- API pública indescobrível e sem tipos.

## Plano de correção

1. Importar explicitamente o ícone em `MaxLoader.vue`, alinhando com o padrão dos demais componentes:
   ```ts
   import MaxLoaderIcon from './MaxLoaderIcon.vue';
   ```
   e usar `<MaxLoaderIcon />` no template — elimina a dependência do resolver para uma referência interna.
2. Declarar props tipadas em ambos os componentes, substituindo o acesso via attrs:
   ```ts
   const props = withDefaults(defineProps<{
       /** Exibe o loader. */
       show?: boolean;
       /** Texto exibido abaixo do ícone. */
       label?: string;
   }>(), { show: true, label: '' });
   ```
3. Trocar as leituras do template para `props.show` / `props.label`, mantendo o `v-bind="attrs"` apenas para os attrs genuinamente residuais.
4. Remover o `: any` da anotação de `useAttrs()`.
5. Aplicar o mesmo tratamento a `MaxLoaderAi.vue` (linhas 3-6), que replica o padrão.

## Verificação

- Teste asserindo que `MaxLoader` renderiza o `MaxLoaderIcon` sem depender do resolver (montagem direta, sem registro global).
- Teste com `show: false` (boolean) e `show="false"` (string), asserindo ocultação em ambos.
- Teste asserindo que `show` e `label` **não** aparecem como atributos do elemento raiz.
- `npx vitest run tests/components/IconsAndLoaders.test.ts tests/components/MaxLoaderAi.test.ts` e `npm run type-check`.
