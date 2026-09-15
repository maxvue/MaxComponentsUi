# REV5-R24 — E11-04: distribuição e tree-shaking

## Identificação

- Papel: `REV5-R24` (`/root/rev5_r24`), parent `/root`.
- Início: `2026-09-15T17:54:00-03:00`.
- Fim: `2026-09-15T17:55:01-03:00`.
- HEAD auditado: `f6b506641b6834d1d609b1441be75647802c7a8f`.
- Referência adversarial: `aac16bca`.
- Modo: somente leitura quanto à implementação; este relatório e a matriz são a evidência do papel.

## Caso adversarial contra a referência

Foi lido diretamente `package.json` de `aac16bca` por `git show` e aplicado o
mesmo predicado estrutural do contrato R24. A referência falha nos dois pontos
causais: contém `exports["./components/*"]` e declara
`"./dist/index.es.js"` em `sideEffects`.

```text
aac16bca falha no caso adversarial: wildcard de componentes presente; index.es.js declarado side effect
```

Assim, o caso não é apenas compatível com a correção: ele distingue o commit de
referência do HEAD auditado.

## Validação independente no HEAD

Comando:

```text
npx vitest run tests/architecture/treeshaking-maxbutton.test.ts tests/architecture/package-exports.test.ts --reporter=verbose
```

Resultado:

```text
Test Files  2 passed (2)
Tests       16 passed (16)
Duration    20.10s
```

O primeiro arquivo remove `dist/` antes de chamar `npm run build:clean`, logo a
medição é de um artefato produzido nesta execução e não retorna cedo usando
distribuição stale. Ele aprovou o teto R24/F29, a ausência de `style-*.js` no
grafo de MaxButton, a ausência de injeção de `<style>` e a cobertura dos
subpaths individuais.

Inspeção posterior do `dist` recém-gerado:

```json
{
  "srcComponents": 114,
  "explicitExports": 114,
  "exportMapExact": true,
  "wildcard": null,
  "sideEffects": ["**/*.css", "**/*.scss"],
  "indexBytes": 15439,
  "maxButtonBytes": 61,
  "styleBytes": 336135,
  "indexInjectsCss": false,
  "buttonInjectsCss": false,
  "indexReferencesCss": false,
  "distStyleExists": true
}
```

`npm pack --dry-run --json` também listou `dist/style.css`, confirmando que o
CSS continua disponível como artefato explícito de pacote, sem injeção pelo
entry raiz ou pelo subpath de componente.

## Veredito

**ACEITO.** O mapa literal cobre exatamente os 114 componentes, sem wildcard;
`sideEffects` restringe-se a CSS/SCSS; `style.css` é opt-in; e o build limpo
mantém o grafo do MaxButton sob o teto de 238.886 bytes (o gate registrou
22.240 bytes transitivos).
