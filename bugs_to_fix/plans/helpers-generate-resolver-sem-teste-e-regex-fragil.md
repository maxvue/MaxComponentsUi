# `generateResolver.ts` não tem teste e depende de regex frágil sobre TS/JSONC

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/scripts/generateResolver.ts:19-32`, `:74`
- **Domínio:** helpers-composables

## Problema

Não existe teste para o script. `tests/helpers/resolver.test.ts` testa o **consumidor** (`MaxComponentsUiResolver`) contra o manifesto já gerado (`import manifest from '../../src/components-manifest.json'`, linha 2) — não testa o **gerador**. Se o script produzir um manifesto errado, o teste do resolver continua passando, porque ele valida contra a saída defeituosa.

O script faz dois parses por regex, ambos com limitações reais assumidas nos comentários:

```ts
// src/scripts/generateResolver.ts:20-22
const primeExportNames = new Set(
    [...primeIndexContent.matchAll(/export\s*\{\s*default as (\w+)\s*\}/g)].map((match) => match[1])
);
```

Essa regex só reconhece a forma `export { default as X }`. Formas igualmente válidas em `src/prime/index.ts` — `export { default as A, default as B }` (múltiplos na mesma chave), `export * from`, `export { X }` sem `default as`, ou uma re-exportação quebrada em várias linhas com comentário no meio — não são captadas. Um nome faltando em `primeExportNames` tem efeito duplo e silencioso: (a) o resolver deixa de oferecer o import de `/prime` para aquele nome (`MaxComponentsUiResolver.ts:28`); (b) pior, a proteção anti-colisão da linha 74 do gerador deixa de agir:

```ts
// src/scripts/generateResolver.ts:74
if (noMax !== name && !primeExportNames.has(noMax)) {
```

Ou seja, o alias sem prefixo `Max` passa a ser criado e **esconde silenciosamente o componente PrimeVue cru** — exatamente o cenário que o comentário das linhas 71-73 diz querer evitar.

O segundo parse (linhas 29-32) extrai o `exclude` do `tsconfig.json` por regex sobre JSONC. Ele casa qualquer string `"src/components/*.vue"` **em qualquer lugar do arquivo**, incluindo dentro de um comentário ou do array `include`. Uma entrada em `include` seria tratada como exclusão, removendo um componente do manifesto sem aviso.

Por fim, o script escreve o arquivo (linha 87) sem nenhuma validação da saída — nem contagem mínima, nem verificação de que os nomes-chave continuam presentes.

## Impacto

Um componente sumir do manifesto quebra o auto-import na app consumidora com um erro de "componente não resolvido" a distância do erro real. Um alias colidindo com um nome PrimeVue faz a app renderizar o componente errado — sem erro nenhum.

## Plano de correção

1. Extrair a lógica pura do script para funções exportáveis e testáveis: `extractPrimeExportNames(content: string)`, `extractExcludedComponents(tsconfigContent: string)`, `buildAliases(componentNames, primeExportNames)`.
2. Manter o corpo do script apenas como I/O (leitura, chamada, `writeFileSync`).
3. Trocar o parse do `tsconfig.json` por leitura estruturada (usar um parser JSONC, ou restringir a regex ao bloco `"exclude": [ ... ]`) para não casar entradas de `include`/comentários.
4. Ampliar a regex de `prime/index.ts` para cobrir `export { default as A, default as B }` e nomes em múltiplas linhas, ou substituí-la por importação dinâmica do módulo e leitura de `Object.keys`.
5. Adicionar uma asserção de sanidade antes de escrever: falhar se `componentNames.length` for 0 ou cair abruptamente em relação ao manifesto anterior.
6. Criar `tests/scripts/generateResolver.test.ts` exercitando as funções extraídas com fixtures em string.

## Verificação

- Testes a criar/ajustar: `tests/scripts/generateResolver.test.ts` (novo)
- Comandos: `npx vitest run tests/scripts/generateResolver.test.ts`, `npx tsx src/scripts/generateResolver.ts && git diff --stat src/components-manifest.json` (deve ficar vazio), `npm run type-check`, `npm run lint`
