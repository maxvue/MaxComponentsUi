# `type-check` ignora `tests/`, `vite.config.ts` e `vitest.config.ts`

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `tsconfig.json:2-8`, `package.json:37`
- **Domínio:** build-config

## Problema

O `include` do `tsconfig.json` cobre apenas `env.d.ts`, `./src/**/*` e `scripts`:

```json
"include": [
    "env.d.ts",
    "./src/**/*",
    "./src/**/*.vue",
    "./src/**/*.json",
    "scripts"
]
```

Ficam de fora, portanto, do `npm run type-check` (`vue-tsc --noEmit`) e do `vue-tsc` que roda
no `build`:

- **`tests/`** — a suíte inteira, incluindo `tests/setup.ts`.
- **`vite.config.ts`** e **`vitest.config.ts`** — os próprios arquivos de configuração.
- **`playground/`** — tem tooling próprio, então a exclusão aqui é defensável.

Verificado empiricamente: um arquivo `tests/__probe.test.ts` contendo
`const x: number = 'isto e uma string, nao number';` passa por `npx vue-tsc --noEmit` sem
nenhum diagnóstico. O erro de tipo é real e óbvio, e mesmo assim o `type-check` sai limpo.

O impacto disso é maior do que parece porque os testes usam bastante `any` deliberado (ex.:
`tests/preset/presetMaxUno.test.ts` faz `preset.rules.forEach((rule: any) => ...)`). Sem
checagem de tipos, não há como distinguir um `any` intencional de um erro de tipo genuíno
que ninguém percebeu — e mocks de teste que divergiram da assinatura real do código de
produção não são detectados até o teste falhar em runtime (ou pior, passar por acidente).

Notar também que `tsconfig.json:10` exclui `src/**/__tests__/*`, um diretório que não existe
neste repositório — os testes vivem todos em `tests/`. É uma regra herdada de outro layout,
sem efeito hoje.

## Impacto

- Erros de tipo em `tests/` e nos arquivos de config nunca são detectados por
  `npm run type-check` nem pelo `npm run build`.
- Mocks desatualizados em relação às assinaturas reais passam despercebidos.
- A falsa sensação de que "o type-check está verde" cobre menos do que o esperado.

## Plano de correção

1. Como o `tsconfig.json` atual é o config de **build** (tem `composite`, `declaration`,
   `outDir`, `rootDir: "./src"`), não dá para simplesmente adicionar `tests/` ao `include` —
   isso faria o `vue-tsc` tentar emitir declarações dos testes e conflitaria com o `rootDir`.

   A estrutura correta é separar as responsabilidades, usando project references:

   - `tsconfig.json` — solution file, apenas `references`.
   - `tsconfig.app.json` — o conteúdo atual (build de `src/` + `scripts`).
   - `tsconfig.test.json` — `include: ["tests/**/*", "vite.config.ts", "vitest.config.ts"]`,
     com `noEmit: true` e `types: ["vitest/globals", "node"]`.

2. Ajustar os scripts para que o type-check cubra ambos:

   ```json
   "type-check": "vue-tsc --build --force",
   "build": "vue-tsc --build && vite build"
   ```

3. Corrigir os erros de tipo que aparecerem em `tests/` nessa primeira passada — espere um
   volume não trivial, já que a pasta nunca foi checada.

4. Remover o `exclude` morto `src/**/__tests__/*` (`tsconfig.json:10`), que não corresponde a
   nenhum diretório existente.

## Verificação

- Recriar o arquivo-sonda com o erro deliberado e confirmar que `npm run type-check` **falha**
  apontando `tests/__probe.test.ts`:

  ```ts
  const x: number = 'isto e uma string, nao number';
  ```

- Remover a sonda e confirmar que `npm run type-check` volta a passar limpo.
- `npm run build` continua gerando as quatro entradas e os `.d.ts` em `dist/` sem incluir
  nenhum arquivo de teste (`ls dist/ | grep -i test` deve retornar vazio).
