# IMP5-R24 — E11-04: distribuição e tree-shaking

## Agente e escopo

- Papel: `IMP5-R24` (`/root/imp5_r24`), parent `/root`.
- Início: `2026-09-15T15:35:00-03:00`.
- HEAD auditado: worktree `fixes/optimize-fix5`, com alterações paralelas de outros owners preservadas.
- Manifesto deste papel: `vite.config.ts`, `tests/architecture/treeshaking-maxbutton.test.ts`, este relatório e a linha R24 da matriz. `package.json` não foi editado por determinação explícita do coordenador: ele pertence ao owner serializado R01.

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
npx vitest run tests/architecture/treeshaking-maxbutton.test.ts
8 testes: 6 aprovados; 2 falharam deliberadamente no contrato de manifest.

Falha 1: sideEffects ainda contém ./dist/index.es.js.
Falha 2: exports ainda contém ./components/* em vez de entradas explícitas.
```

## Bloqueio indispensável: patch de `package.json`

Para fechar E11-04, o owner do manifesto deve:

1. Remover `"./dist/index.es.js"` de `sideEffects`, deixando apenas os padrões CSS/SCSS.
2. Remover `"./components/*"` de `exports`.
3. Para **cada** `src/components/<Nome>.vue`, adicionar a entrada literal:

```json
"./components/<Nome>": {
  "types": "./dist/components/<Nome>.vue.d.ts",
  "import": "./dist/components/<Nome>.es.js"
}
```

O teste alterado enumera os `.vue` reais, de modo que uma entrada omitida, um wildcard
ou um caminho inexato falham no mesmo gate que mede o bundle. Não há correção correta
para essas duas condições fora de `package.json`; por isso o bloco não pode receber
aceite até o owner R01 aplicar o patch e a suíte ficar verde.
