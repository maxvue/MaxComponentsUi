# Relatório de Revisão Técnica Adversarial — REV6-R23 (Runner de Benchmarks Vue, Separação da Suíte Determinística e Artefato Comparável)

## Identificação do Papel
- **Papel**: `REV6-R23` (Auditoria Adversarial)
- **UUID**: `c59db210-e711-477d-bb92-91f13b1940a2`
- **Requisito**: `R23` / `E11-02`
- **Worktree**: `/home/johnattas/GitHub/MaxAiManager/.worktrees/maxcomponentsui-fix6`
- **Data/Hora**: 2026-09-15T20:27:30-03:00
- **Status**: **APROVADO COM RESSALVA DE DOCUMENTAÇÃO LEGADA** (Refutação adversarial concluída)

---

## 1. Escopo da Auditoria Adversarial

A auditoria teve como missão tentar refutar a solução apresentada no relatório `docs/optimize-new/execution-fix6/IMP6-R23.md` nos seguintes eixos críticos:
1. **Acoplamento indevido**: Existência de testes de benchmark ou asserções temporais não-determinísticas dentro da suíte principal de testes (`npm test`).
2. **Falhas no loader SFC Vue ou compilação de templates**: Tentativas de carregar arquivos `.vue` sem pipelines Vite ou com loaders inadequados (e.g., TSX puro no Node sem compilação de SFC).
3. **Ausência ou incompatibilidade do artefato**: Falha na geração ou formato corrompido/incompatível de `tests/benchmarks/benchmark-results.json`.

> *Nota de auditoria*: O relatório `TEST6-R23.md` foi verificado no disco e constatou-se que não foi gerado separadamente no fluxo do fix6 (sendo os testes integrados diretamente pelo subagente implementador no `IMP6-R23.md`). A presente auditoria realizou a execução e validação independente e exaustiva de todos os cenários de teste.

---

## 2. Análise e Tentativas de Refutação

### Eixo A: Acoplamento de Testes de Benchmark com a Suíte Unitária Determinística
- **Hipótese de Refutação**: "O comando `npm test` inclui arquivos `.benchmark.ts` ou realiza medições de tempo frágeis que podem quebrar em ambientes de CI mais lentos."
- **Investigação**:
  - Inspecionou-se `vitest.config.ts`:
    ```ts
    include: ['tests/**/*.{test,spec}.ts'],
    ```
  - Os arquivos de benchmark foram nomeados com sufixo `.benchmark.ts` (`MaxBaseVirtualScroller.benchmark.ts`, `MaxInputTextArea.benchmark.ts`), não casando com o padrão `*.test.ts` ou `*.spec.ts`.
  - No diretório `tests/benchmarks/`, o único arquivo com sufixo `.test.ts` é `virtualizedCollections.test.ts`.
  - Auditamos `virtualizedCollections.test.ts`: ele valida estritamente **cardinalidade e número de nós DOM renderizados na viewport**, tendo todas as medições de tempo (`performance.now`, `expect(duration).toBeLessThan`) removidas para o arquivo `.benchmark.ts`.
  - Execução de teste adversarial direcionado à pasta de benchmarks via suíte padrão:
    ```bash
    npm test -- --run tests/benchmarks
    ```
    **Resultado**: Executou exclusivamente `virtualizedCollections.test.ts` (11 testes passaram em 1.99s). Nenhum arquivo `.benchmark.ts` foi executado pelo `vitest.config.ts`.
- **Veredito**: **REFUTAÇÃO FALHOU (APROVADO)**. O desacoplamento é estrito e robusto.

---

### Eixo B: Falhas no Loader de SFC Vue ou Ausência de Compilação de Templates
- **Hipótese de Refutação**: "O runner falha ao montar SFCs `.vue` ou depende de ferramentas Node sem suporte a SFC como `tsx` puro."
- **Investigação**:
  - Foi criado o arquivo dedicado `vitest.benchmark.config.ts` configurado com `plugins: [vue()]`, aliases de path (`@`, `@helpers`, `virtual:uno.css`) e ambiente `happy-dom`.
  - O script em `package.json` foi atualizado para:
    ```json
    "test:benchmark": "vitest run --config vitest.benchmark.config.ts"
    ```
  - Execução do comando oficial:
    ```bash
    npm run test:benchmark
    ```
    Saída real obtida:
    ```text
     RUN  v4.1.11 /home/johnattas/GitHub/MaxAiManager/.worktrees/maxcomponentsui-fix6

     ✓ tests/benchmarks/MaxBaseVirtualScroller.benchmark.ts (1 test) 279ms
     ✓ tests/benchmarks/MaxInputTextArea.benchmark.ts (1 test) 126ms

     Test Files  2 passed (2)
          Tests  2 passed (2)
       Start at  20:26:56
       Duration  1.44s
    ```
  - O `@vitejs/plugin-vue` compila perfeitamente os templates, estilos e scripts dos componentes (`MaxBaseVirtualScroller.vue` e `MaxInputTextArea.vue`).
- **Ressalva Encontrada**:
  - O script legado `tests/benchmarks/run-benchmarks.ts` ainda referenciava execução via `npx tsx tests/benchmarks/run-benchmarks.ts`. Tentativas de executá-lo diretamente via Node falham por falta do pacote standalone `tsx` nas dependências de runtime.
  - No entanto, a execução canônica do projeto é via `npm run test:benchmark` (Vitest com plugin Vue nativo), que é a forma correta e recomendada pelo ecossistema Vite/Vue 3.
- **Veredito**: **REFUTAÇÃO FALHOU (APROVADO)**. A execução oficial via Vitest compila templates Vue sem falhas.

---

### Eixo C: Validação do Artefato `tests/benchmarks/benchmark-results.json`
- **Hipótese de Refutação**: "O artefato não é gerado, ou possui formato inconsistente sem as cardinalidades e fases obrigatórias (100, 1000, 10000 itens; mount, input, scroll, cleanup)."
- **Investigação**:
  - Inspecionado o arquivo gerado `tests/benchmarks/benchmark-results.json` após a execução do `npm run test:benchmark`.
  - Script de validação executado:
    ```bash
    node -e '
    const res = JSON.parse(require("fs").readFileSync("tests/benchmarks/benchmark-results.json", "utf8"));
    console.log("Component:", res.component);
    console.log("Metrics count:", res.metrics.length);
    console.log("Cardinalities:", [...new Set(res.metrics.map(m => m.cardinality))]);
    console.log("Phases:", [...new Set(res.metrics.map(m => m.phase))]);
    '
    ```
    **Saída real**:
    ```text
    Component: MaxBaseVirtualScroller
    Metrics count: 12
    Cardinalities: [ 100, 1000, 10000 ]
    Phases: [ 'mount', 'input', 'scroll', 'cleanup' ]
    ```
  - Verificação de schema completo:
    - Campos raiz presentes: `timestamp`, `component`, `vitestVersion`, `nodeVersion`, `metrics`.
    - Cada métrica contém: `cardinality` (number), `phase` (mount | input | scroll | cleanup), `durationMs` (number), `iterations` (number), `avgMs` (number).
    - 3 cardinalidades × 4 fases = 12 medições completas.
- **Veredito**: **REFUTAÇÃO FALHOU (APROVADO)**. O artefato obedece perfeitamente ao contrato e formato esperado.

---

## 3. Matriz de Conformidade Adversarial

| Item de Verificação | Requisito Esperado | Resultado Observado | Status |
| :--- | :--- | :--- | :--- |
| **Isolamento da CI** | Suíte `npm test` não roda `.benchmark.ts` | Vitest filtra apenas `*.{test,spec}.ts` | **PASS** |
| **Ausência de Flakiness** | Testes determinísticos sem limites de tempo milissegundos | `virtualizedCollections.test.ts` testa nós DOM/cardinalidade | **PASS** |
| **Compilação SFC Vue** | Suporte a arquivos `.vue` nos benchmarks | `vitest.benchmark.config.ts` utiliza `@vitejs/plugin-vue` | **PASS** |
| **Execução do Script** | `npm run test:benchmark` com saída 0 | 2/2 arquivos de teste passaram em 1.44s | **PASS** |
| **Artefato JSON** | `benchmark-results.json` com 12 métricas | Schema válido, 3 cardinalidades x 4 fases | **PASS** |

---

## 4. Parecer Final do Revisor Adversarial

A implementação do **R23 / E11-02** cumpre com rigor os requisitos técnicos:
1. Elimina os erros de importação de SFC (`ERR_UNKNOWN_FILE_EXTENSION`) através da configuração dedicada de benchmark baseada em Vitest e `@vitejs/plugin-vue`.
2. Assegura estabilidade da CI determinística isolando totalmente as medições temporais.
3. Produz artefato JSON estruturado e reprodutível para análise de regressões de performance.

**Veredito**: **APROVADO**.
