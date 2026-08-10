# `MaxInputFile` é exportado na API pública mas é um componente vazio

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputFile.vue:1-7`, `src/index.ts:94`, `src/components-manifest.json:40`
- **Domínio:** inputs-selecao-arquivo

## Problema

`src/components/MaxInputFile.vue` tem template e script completamente vazios:

```vue
<template>

</template>
<script setup lang="ts">


</script>

<style lang="scss">
    .input-file-main-div { ... }
</style>
```

Restam apenas ~100 linhas de SCSS descrevendo uma estrutura (`.input-file-content`, `.files-list-mini`, `.files-list-preview`, `.drop-zone-div`, `.dropping`) que **nenhum** markup do repositório produz — o componente que geraria essas classes foi removido, o estilo ficou.

Apesar disso, o componente é exportado como API pública:

- `src/index.ts:94` — `export { default as MaxInputFile } from './components/MaxInputFile.vue';`
- `src/components-manifest.json:40` e linhas 339-344 — registrado no resolver com seis aliases (`MaxInputFile`, `max_input_file`, `max-input-file`, `InputFile`, `input_file`, `input-file`).

O próprio teste documenta a situação sem questioná-la (`tests/components/MaxInputFile.test.ts:11`): *"não renderiza nenhum conteúdo (template vazio, componente sem lógica)"*.

Ou seja: uma app consumidora pode escrever `<InputFile />` (ou qualquer um dos seis aliases), o auto-import resolve com sucesso, o build passa, e o resultado é um componente que não renderiza absolutamente nada — sem erro, sem aviso.

Como agravante, o SCSS órfão é injetado no bundle `index.es.js` (o CSS é injetado por `vite-plugin-css-injected-by-js` conforme o CLAUDE.md), então todas as apps consumidoras carregam regras mortas.

## Impacto

API pública enganosa: um nome genérico e atraente (`InputFile`) que qualquer desenvolvedor tentaria usar primeiro para um campo de arquivo, e que falha silenciosamente. Peso morto de CSS no bundle de toda app consumidora. E ruído na migração do PrimeVue, já que o componente aparece na lista de exports como se fosse algo a preservar.

## Plano de correção

Decidir entre duas rotas (a escolha é do time, mas o estado atual não é aceitável):

**Rota A — remover (recomendada se não há plano de reimplementar):**
1. Deletar `src/components/MaxInputFile.vue` e `tests/components/MaxInputFile.test.ts`.
2. Remover o export de `src/index.ts:94`.
3. Rodar `npx tsx src/scripts/generateResolver.ts` para regenerar `src/components-manifest.json` sem as entradas e aliases.
4. Confirmar que nenhum outro componente da biblioteca depende das classes SCSS órfãs antes de removê-las (grep por `input-file-main-div`, `files-list-preview`, `drop-zone-div`).

**Rota B — implementar:** reconstruir o componente para produzir o markup que o SCSS já descreve (área clicável, drop zone, lista de preview de arquivos), reaproveitando `useFileDialog`/`useDropZone` como fazem `MaxInputFileUploadBig` e `MaxInputFileProject`, e envolvendo tudo em `InputBase` conforme a regra do CLAUDE.md.

Em qualquer caso, enquanto a decisão não for tomada, o export não deve permanecer anunciando um componente inexistente.

## Verificação

- Rota A: `npm run build` e `npm run type-check` passam; `grep -rn "MaxInputFile\b" src/` não retorna nada além de eventuais menções em documentação; o manifesto regenerado não contém `input-file`.
- Rota B: novo suite de testes cobrindo seleção por clique, drop, preview e remoção de arquivo; o componente usa `InputBase` como raiz.
- `npm run test` verde em ambos os casos.
