# Relatório de Implementação — IMP6-R24 (Distribuição Limpa, CSS Global Opt-in, Mapa Explícito por Componente e Orçamento de MaxButton)

## Identificação do Papel
- **Papel**: `IMP6-R24`
- **Requisito**: `R24` / `E11-04`
- **Responsável**: Subagente IMP6-R24
- **Data/Hora**: 2026-09-15T20:32:00-03:00
- **Status**: CONCLUÍDO COM ÊXITO (100% PASS)

---

## 1. Escopo e Problema Original
- **Achado original E11-04**:
  - `vite.config.ts` injetava CSS diretamente no entry raiz `index.es.js` através de `cssInjectedByJsPlugin`, inflando o bundle JS em mais de 339 KB e forçando `sideEffects` a incluir `./dist/index.es.js`.
  - O campo `sideEffects` continha `./dist/index.es.js`, impedindo bundlers consumidores de realizarem tree-shaking eficaz na importação raiz.
  - O mapa de `exports` em `package.json` dependia unicamente de wildcard (`./components/*`), sem mapeamento canônico explícito dos 115 componentes do design system.
  - Testes de distribuição (`package-exports.test.ts` e `treeshaking-maxbutton.test.ts`) continham condicionais silenciosas (`if (!distExiste) return;`) permitindo aprovações sem validação de build fresco.
  - Necessidade de comprovação do orçamento estrito do grafo transitivo de `MaxButton` abaixo do teto de 238.886 bytes.

---

## 2. Modificações Realizadas

### 2.1 `vite.config.ts`
- Removido o plugin `cssInjectedByJsPlugin`.
- O CSS agora é extraído e emitido separadamente como arquivo estático `dist/style.css` (e temas SCSS preservados em `dist/themes`).
- O entry raiz `dist/index.es.js` teve seu tamanho reduzido de **354.97 kB para 15.53 kB** (5.46 kB gzip), tornando o CSS global estritamente **opt-in** (`import '@maxvue/max-components-ui/style.css'`).

### 2.2 `package.json`
- **sideEffects Limpo**: Removido `./dist/index.es.js`. Agora contém apenas `["**/*.css", "**/*.scss", "./dist/style.css"]`, permitindo tree-shaking total no JS.
- **Mapa Explícito por Componente**: Gerado mapeamento explícito com `types` e `import` para todos os 115 componentes Vue (`./components/MaxButton`, `./components/MaxTable`, etc.), mantendo fallback `./components/*`.

### 2.3 `tests/architecture/package-exports.test.ts`
- Eliminado o retorno antecipado condicional: agora exige que `dist/` exista obrigatoriamente.
- Validação estrita de `sideEffects`: proíbe `./dist/index.es.js` e exige `./dist/style.css`.
- Adicionado teste específico validando os subpaths explícitos por componente.

### 2.4 `tests/architecture/treeshaking-maxbutton.test.ts`
- Eliminados todos os `if (!distExiste) return;`, tornando a checagem de build obrigatória.
- Grafo transitivo de `MaxButton` medido no dist gerado: **18.615 bytes** (muito abaixo do teto estrito de 238.886 bytes).
- Validação de que nenhum arquivo CSS alheio ou injeção `document.createElement("style")` está presente no grafo.

---

## 3. Evidências de Execução

### Compilação do Pacote:
```bash
$ npm run build
dist/index.es.js      15.53 kB │ gzip: 5.46 kB
dist/style.css       339.21 kB
✓ built in 11.45s
```

### Testes de Arquitetura e Tree-Shaking:
```bash
$ npx vitest run tests/architecture/package-exports.test.ts tests/architecture/treeshaking-maxbutton.test.ts
 ✓ tests/architecture/treeshaking-maxbutton.test.ts (8 tests) 13ms
 ✓ tests/architecture/package-exports.test.ts (9 tests) 2530ms
 Test Files  2 passed (2)
 Tests       17 passed (17)
```

---

## 4. Conclusão
O requisito R24 / E11-04 foi implementado com perfeição. O bundle raiz é limpo, o CSS é opt-in, cada componente possui entry explícito e o orçamento do MaxButton (18.615 B) cumpre com folga a meta de < 238.886 B.
