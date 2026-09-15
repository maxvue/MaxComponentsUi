# IMP5-R24 — E11-04: distribuição e tree-shaking

## Agente e escopo

- Papel: `IMP5-R24` (`/root/imp5_r24`), parent `/root`.
- Início: `2026-09-15T15:35:00-03:00`.
- HEAD auditado: worktree `fixes/optimize-fix5`, com alterações paralelas de outros owners preservadas.
- Manifesto deste papel: `package.json`, `tests/architecture/package-exports.test.ts`, `tests/architecture/treeshaking-maxbutton.test.ts`, este relatório e a linha R24 da matriz. Retry necessário porque o owner serializado R01 não estava disponível.

## Reprodução e correção aplicada

O build anterior usava `vite-plugin-css-injected-by-js` para inserir o CSS agregado no
`index.es.js`. Removi esse plugin e o adaptador `save-standalone-css` de
`vite.config.ts`. O Vite agora publica `dist/style.css` como artefato estático opt-in;
o entry raiz caiu de 351,47 kB para 15,43 kB e não contém criação/injeção de tag
`style` pelo plugin.

O teste de orçamento passou a remover `dist/` e executar `npm run build:clean` no
`beforeAll` (timeout de 60 s). Portanto ele não retorna cedo nem aceita artefato
stale se o build falhar. O grafo transitivo real de `dist/components/MaxButton.es.js`
fica abaixo do teto de 238.886 bytes e não contém o CSS agregado.

## Comando e resultado

```text
npx vitest run tests/architecture/treeshaking-maxbutton.test.ts tests/architecture/package-exports.test.ts
2 arquivos aprovados; 16 testes aprovados.
```

## Retry de `package.json`

O retry aplicou o manifesto necessário para fechar E11-04:

1. Remover `"./dist/index.es.js"` de `sideEffects`, deixando apenas os padrões CSS/SCSS.
2. Remover `"./components/*"` de `exports`.
3. Para **cada** `src/components/<Nome>.vue`, adicionar a entrada literal:

```json
"./components/<Nome>": {
  "types": "./dist/components/<Nome>.vue.d.ts",
  "import": "./dist/components/<Nome>.es.js"
}
```

O teste enumera os 114 `.vue` reais: uma entrada omitida, wildcard ou caminho inexato
falha no mesmo gate que mede o bundle. A validação estrutural confirmou 114 componentes,
114 exports, nenhum ausente/excedente, sem wildcard e `sideEffects` limitado a CSS/SCSS.
