# `MaxTabPanel.vue` termina com uma barra invertida solta após `</style>`

- **Categoria:** bug
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxTabPanel.vue:46`
- **Domínio:** overlays-navegacao

## Problema

O arquivo `src/components/MaxTabPanel.vue` termina com um caractere `\` isolado logo após o fechamento do bloco `</style>`. Verificação em bytes do fim do arquivo:

```
</style>\n\
```

Ou seja, a última linha (46) contém apenas `\`. É conteúdo de nível superior de um SFC que não pertence a nenhum bloco (`<template>`, `<script>`, `<style>`) — provavelmente resíduo de uma edição por heredoc ou por escape de shell.

O compilador de SFC do Vue tolera texto fora dos blocos e o ignora, então o componente funciona. Mas:

- É um caractere sem nenhuma função semântica.
- ESLint com o parser de Vue pode sinalizá-lo dependendo da regra ativa, e futuras ferramentas de análise podem reclamar.
- Sinaliza que o arquivo foi escrito por um processo que corrompeu o conteúdo final, valendo verificar se algo mais foi truncado.

Note que outros arquivos do escopo têm um defeito parecido, porém mais grave: `MaxUserSection.vue:38-43` e `MaxUserAvatar.vue:6-11` têm blocos de comentário JSDoc entre `</template>` e `<script setup>` (ver `overlays-user-section-e-avatar-jsdoc-fora-de-bloco-sfc.md`).

## Impacto

Baixo em runtime. É higiene de código e um sinal de corrupção de escrita a ser conferido.

## Plano de correção

1. Remover a última linha de `src/components/MaxTabPanel.vue`, deixando o arquivo terminando em `</style>` seguido de uma única quebra de linha.
2. Rodar `npm run lint` para confirmar que nenhuma outra ocorrência do padrão existe no repositório: `grep -rn '^\\\\$' src/components/`.

## Verificação

- `tail -c 20 src/components/MaxTabPanel.vue | xxd` — deve terminar em `</style>\n` sem o `\`.
- `npm run lint`
- `npm run type-check`
- `npx vitest run tests/components/MaxTabs.test.ts` (os testes de `MaxTabPanel` vivem nesse arquivo, linhas 253-306) para garantir nenhuma regressão.
