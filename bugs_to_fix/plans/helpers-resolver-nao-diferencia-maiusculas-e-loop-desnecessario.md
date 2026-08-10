# `MaxComponentsUiResolver`: loop sobre resolvers descarta o resultado e o alias tem prioridade cega

- **Categoria:** melhoria
- **Severidade:** baixa
- **Arquivo(s):** `src/helpers/MaxComponentsUiResolver.ts:22-46`
- **Domínio:** helpers-composables

## Problema

```ts
// src/helpers/MaxComponentsUiResolver.ts:30-44
for (const resolver of primeVueResolvers) {
    const result = (typeof resolver === 'function' ? resolver(name) : resolver.resolve(name)) as ResultResolver;
    if (result) {
        const return_result = { name: name, from: '@maxvue/max-components-ui/prime' };
        return return_result;
    }
}
```

O comentário das linhas 31-36 explica corretamente que `result` é descartado de propósito, servindo só para confirmar que o PrimeVueResolver reconhece o nome. Mas essa confirmação é **redundante**: a linha 28 já filtrou por `primeExportNames`, que é o conjunto extraído diretamente de `src/prime/index.ts` — a fonte de verdade real sobre o que existe em `@maxvue/max-components-ui/prime`. Se o nome está em `primeExportNames`, o import é válido independentemente do que o PrimeVueResolver ache.

O custo dessa redundância é uma dependência de runtime desnecessária em `@primevue/auto-import-resolver` (linha 3), num pacote cujo objetivo declarado no `CLAUDE.md` é **eliminar a dependência do PrimeVue**. O resolver é uma das quatro entradas de build (`resolver.es.js`), e essa importação atrela a entrada inteira ao PrimeVue.

Efeito prático possível: se o PrimeVueResolver deixar de reconhecer um nome que `prime/index.ts` re-exporta (divergência de versão), o resolver silenciosamente **não resolve** — retornando `undefined` implícito ao fim da função (linha 46), sem `return` explícito nem aviso.

Segundo ponto: a linha 22 dá prioridade incondicional ao alias do manifesto sobre qualquer nome PrimeVue. A proteção contra colisão existe no gerador (`src/scripts/generateResolver.ts:74`), não aqui — o resolver confia cegamente que o manifesto foi gerado com aquela proteção. Se o manifesto for gerado por uma versão antiga do script, a colisão passa.

## Impacto

Baixo hoje (o comportamento observável está correto e testado em `tests/helpers/resolver.test.ts`), mas é dívida direta contra o objetivo de independência do PrimeVue registrado em `CLAUDE.md` e em `status-primevue.migration.yaml`.

## Plano de correção

1. Avaliar remover o loop e o import de `@primevue/auto-import-resolver`, retornando `{ name, from: '@maxvue/max-components-ui/prime' }` assim que `primeExportNames.has(name)` for verdadeiro. Isso desacopla a entrada `resolver.es.js` do PrimeVue.
2. Antes de remover, confirmar em `tests/helpers/resolver.test.ts` que nenhum caso depende do filtro extra do PrimeVueResolver — o mock atual (linhas 5-19) inclui `FloatLabel` e `ColorPicker` justamente para testar a filtragem por `primeExports`, que continua funcionando sem o loop.
3. Adicionar um `return undefined;` explícito ao final da função `resolve` (após a linha 45) — hoje o fallthrough é implícito.
4. Atualizar o comentário `NÃO MODIFICAR ESTE RESOLVER SEM QUE HAJA UMA INSTRUÇÃO DIRETA PARA ISSO` (linha 13) apenas com autorização explícita do mantenedor, já que ele veda alterações não solicitadas neste arquivo.

## Verificação

- Testes a criar/ajustar: `tests/helpers/resolver.test.ts` — adicionar caso assertando `undefined` explícito para um nome desconhecido em ambos os conjuntos.
- Comandos: `npx vitest run tests/helpers/resolver.test.ts`, `npm run build`, `npm run type-check`, `npm run lint`
