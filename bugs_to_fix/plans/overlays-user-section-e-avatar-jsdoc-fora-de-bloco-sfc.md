# MaxUserSection e MaxUserAvatar têm blocos JSDoc entre `</template>` e `<script>` (fora de qualquer bloco SFC)

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxUserSection.vue:38-43`, `src/components/MaxUserAvatar.vue:6-11`
- **Domínio:** overlays-navegacao

## Problema

Ambos os arquivos posicionam um comentário de documentação **fora de qualquer bloco do SFC**, entre o `</template>` e o `<script setup>`:

`src/components/MaxUserSection.vue:37-44`
```
</template>

/**
 * Seção de usuário para o cabeçalho.
 * ...
 */
<script setup lang="ts">
```

`src/components/MaxUserAvatar.vue:4-12`
```
</template>

/**
 * Componente de avatar do usuário.
 * ...
 */
<script setup lang="ts">
```

Isso é texto de nível superior do SFC, não um comentário: o compilador de SFC do Vue trata blocos desconhecidos/texto solto fora dos blocos reconhecidos e os descarta silenciosamente, então não quebra a compilação — mas:

1. **A documentação é invisível às ferramentas.** Não aparece em IDE hover, não é extraída por geradores de documentação de componentes, e não está associada ao `defineProps` como um comentário de bloco JSDoc dentro do `<script>` estaria.
2. **Viola a convenção de ordem de blocos** documentada no `CLAUDE.md` (Template → Script → Style): há conteúdo não classificado entre Template e Script.
3. Se uma futura versão do compilador ou do parser de ESLint/Stylelint passar a ser mais estrita quanto a conteúdo de nível superior, os arquivos quebram.

Nenhum outro componente do escopo auditado (Modal, Drawer, Popover, Accordion, Tabs, menus) usa esse padrão — os que documentam o fazem com JSDoc dentro do `<script setup>` ou nas próprias props.

## Impacto

Documentação perdida para os dois componentes, e divergência de convenção que pode se propagar por cópia para novos componentes.

## Plano de correção

1. Em `src/components/MaxUserSection.vue`, mover o bloco das linhas 38-43 para **dentro** do `<script setup lang="ts">`, imediatamente após a abertura da tag (antes dos imports), como um comentário `/** ... */` normal.
2. Fazer o mesmo em `src/components/MaxUserAvatar.vue` para o bloco das linhas 6-11.
3. Garantir que a estrutura resultante seja estritamente `<template>` → `<script setup>` → `<style>`, sem nada entre os blocos.
4. Manter a indentação de 4 espaços dentro do script.

## Verificação

- `npm run lint` (ESLint com `vue/block-order`).
- `npm run type-check`.
- `npx vitest run tests/components/MaxUserSection.test.ts tests/components/MaxUserAvatar.test.ts` — devem continuar passando sem alteração.
- Inspeção manual: confirmar que nada renderiza como texto solto no DOM montado (`wrapper.text()` não deve conter "Seção de usuário para o cabeçalho").
