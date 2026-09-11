# Vazamento de Atributos Utilitários de Estilo no Template via `params.scss` e UnoCSS Attributify Residual

## Severidade: Alta

## Componentes Impactados
- `src/themes/params.scss` (Arquivo de origem com mais de 30 regras baseadas em seletores de atributos utilitários)
- `src/components/MaxButtonConfirm.vue` (Atributo `pointer` no template)
- `src/components/MaxIconConfirm.vue` (Atributo `pointer` no template)
- `src/components/MaxTogglePopover.vue` (Atributos `pointer` em `<MaxIconButton>` e `<MaxButton>`)
- `src/components/MaxIconButton.vue` (Atributo `pointer` em tag de botão)
- `src/components/MaxUserSection.vue` (Atributo `pointer` em `<div>`)
- `src/components/MaxSideMenuMobile.vue` (Atributo `no-padding` em `<MaxDrawer>`)
- `src/components/MaxTitle1.vue` (Atributo `center` em `<div>`)
- `src/components/MaxInputFile.vue` (Atributo `flex` em `<slot>`)
- `src/components/MaxTopToolbar.vue` (Atributo `transparent` em `<MaxButton>`)
- `src/components/MaxTopToolbarSubmenu.vue` (Atributo `transparent` em `<MaxButton>`)

---

## Sintoma Observado vs Causa Raiz Profunda

### Sintoma Observado
Vários componentes SFC contêm atributos estilísticos nus aplicados diretamente nas tags do `<template>`, tais como:
```html
<MaxButton ... pointer />
<MaxIconButton ... pointer />
<div center>
<slot name="button" flex>
<MaxButton ... transparent />
<MaxDrawer no-padding ... />
```
Ao inspecionar o DOM, esses atributos permanecem impressos no HTML gerado (`<button pointer="" ...>`) e são capturados por seletores globais como `[pointer]` e `[transparent]`.

### Causa Raiz Profunda
1. **Existência de um Mini-Framework Utilitário em `src/themes/params.scss`**: O arquivo `params.scss` define explicitamente dezenas de regras utilizando seletores de atributos:
   ```scss
   [pointer] { cursor: pointer !important; }
   [full],[flex] { width: 100% !important; height: 100% !important; }
   [center], [center-center] { place-items: center center; }
   [transparent] { background-color: transparent; border-color: transparent; ... }
   [no-padding] { padding: 0 !important; }
   [white] { color: var(--primary-0) !important; }
   ```
   Essa herança vem do histórico de suporte ao modo *UnoCSS Attributify*.
2. **Conflito Direto com a Diretriz Canônica Canônica**: O documento `GEMINI.md` proíbe expressamente:
   > "- É ESTRITAMENTE PROIBIDO utilizar atributos de utilitários no modo UnoCSS Attributify diretamente nas tags do template (ex.: `<div flex>`, `<div s100>`, `<div w-full>`, `<div gap-4>`, `<div pb-15>`, `<MaxIcon ml-5 />` são terminantemente proibidos).
   > - Nenhum elemento deve carregar utilitários de margem, padding, tipografia, dimensionamento, posicionamento, alinhamento ou flexbox/grid através de classes utilitárias ou atributos no template. Todo o estilo deve ser semântico."
3. **Ambiguidade Sintática Crítica no Vue 3**: Quando um desenvolvedor escreve `<MaxButton pointer ...>`, o Vue 3 trata `pointer` como uma prop booleana (ou atributo não declarado repassado via `$attrs`). Se o componente não declara a prop `pointer`, o atributo "vaza" para o elemento raiz do subcomponente (`fallthrough attribute`), alterando seu comportamento estético sem que o autor do componente tenha controle local.

---

## Evidência Técnica

### 1. Declarações Globais em `src/themes/params.scss`
```scss
// Linhas 3-8: Estilo transparente via atributo
[transparent] {
    background-color: transparent;
    border-color: transparent;
    outline-color: transparent;
    color: var(--background-700);
}

// Linha 90: Utilitário de espaçamento
[no-padding] { padding: 0 !important; }

// Linhas 103 e 110: Alinhamento e dimensões
[center], [center-center] { place-items: center center; }
[full],[flex] { width: 100% !important; height: 100% !important; }

// Linha 113: Cursor de ponteiro
[pointer] { cursor: pointer !important; }
```

### 2. Uso Ilegítimo nos Templates SFC
Em `src/components/MaxButtonConfirm.vue`:
```vue
<!-- Linha 2 -->
<MaxButton class="max-button-confirm" :label="props.label" ... v-tooltip="null" pointer />
```

Em `src/components/MaxIconConfirm.vue`:
```vue
<!-- Linha 2 -->
<MaxIconButton class="max-icon-confirm" :icon="props.icon" ... v-tooltip="null" pointer />
```

Em `src/components/MaxTogglePopover.vue`:
```vue
<!-- Linhas 2 e 8 -->
<MaxIconButton :icon="props.i ?? props.icon" pointer ... />
<MaxButton :label="props.label" :icon="props.i ?? props.icon" v-tooltip="null" pointer />
```

Em `src/components/MaxTitle1.vue`:
```vue
<!-- Linha 2 -->
<div center>
```

Em `src/components/MaxInputFile.vue`:
```vue
<!-- Linhas 17 e 43 -->
<slot name="button" flex></slot>
<slot name="filesPreview" flex></slot>
```

Em `src/components/MaxTopToolbar.vue`:
```vue
<!-- Linhas 8 e 20 -->
<MaxButton ... transparent />
```

---

## Impacto na Consistência Visual do Design System

1. **Quebra de Encapsulamento e Poluição Global**: Seletores baseados em atributos como `[transparent]` ou `[pointer]` são aplicados globalmente com `!important`. Qualquer elemento no DOM que possua esses atributos (inclusive elementos de terceiros ou de bibliotecas externas) tem seu estilo violentamente sobrescrito.
2. **Imprevisibilidade em Testes Unitários e TypeScript**: `vue-tsc` emite alertas e inconsistências ao lidar com attrs não tipados em props de componentes (`MaxButton` não tem a prop `pointer` tipada na sua interface `ButtonProps`).
3. **Manutenção Fragmentada**: A regra de que "o único meio permitido é `<style lang="scss" scoped>`" é sabotada por esse ecossistema paralelo de atributos mágicos, forçando desenvolvedores a consultar múltiplos arquivos para entender por que um botão tem ou não cursor pointer ou fundo transparente.
