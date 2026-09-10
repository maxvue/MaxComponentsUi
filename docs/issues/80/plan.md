# Plano de Implementação — Issue #80

## Descrição e Causa Raiz

### Problema
Durante a auditoria automatizada do ecossistema de testes unitários do repositório, identificou-se a presença de um teste de cobertura artificial (*sham test* / *cobertura falsa*) no arquivo `tests/preset/presetMaxUno.test.ts:233-256`.

O bloco é intitulado explicitamente como:
```typescript
describe('coverage evaluation', () => {
    it('evaluates shortcuts and rules to increase coverage', async () => {
        const mod = await import('../../src/presetMaxUno');
        const preset = mod.presetMaxUno()() as any;

        // Execute shortcut functions
        preset.shortcuts.forEach((shortcut: any) => {
            if (typeof shortcut[1] === 'function') try { shortcut[1](['match', '10', '10']); } catch(_e) {}
        });

        // Execute rules functions
        preset.rules.forEach((rule: any) => {
            if (typeof rule[1] === 'function') try { rule[1](['match', '10', '10']); } catch(_e) {}
        });

        // Execute preflights
        if (preset.preflights && preset.preflights[0]) preset.preflights[0].getCSS();

        expect(preset.name).toBe('max-css-preset');
    });
});
```

### Agravantes
1. **Supressão Silenciosa de Erros (*Error Swallowing*):** O teste percorre dinamicamente todos os shortcuts e rules do preset UnoCSS passando argumentos dummy estáticos arbitrários (`['match', '10', '10']`) e suprimindo qualquer erro através de blocos vazios `try { ... } catch(_e) {}`. Se qualquer função lançar exceção em tempo de execução ao receber parâmetros incompatíveis com sua assinatura ou desestruturação, o erro é mascarado.
2. **Ausência Absoluta de Asserções Funcionais:** Não existe nenhuma asserção sobre o retorno CSS gerado, classes capturadas, seletores, regras de preflight ou validade dos estilos emitidos.
3. **Asserção Trivial Única:** A única verificação efetuada em todo o teste é `expect(preset.name).toBe('max-css-preset')`.
4. **Falsa Sensação de Segurança (*Coverage Shamming*):** Esse padrão infla artificialmente os relatórios de cobertura de código do Vitest / v8 para `src/presetMaxUno.ts`, gerando métricas enganosas de 100% de cobertura de linhas enquanto mais de duas dezenas de regras, atalhos complexos e preflights de estilo permanecem desprovidos de asserções unitárias reais de contrato.
5. **Dificuldade na Prevenção de Quebras de Estilo:** Bugs reais de CSS inválido (como o reportado na Issue #76 e na correção do seletor `color-mix()`) não são prevenidos por testes vazios desse tipo.

---

### Causa Raiz Comprovada

- **Arquivo e Linhas Exatos:** `tests/preset/presetMaxUno.test.ts:233-256`
- **Fluxo Causal e Rastreamento Reverso de Dados:**
  1. **Origem da Implementação:** O bloco foi inserido historicamente com a intenção literal descrita em seu identificador (`'evaluates shortcuts and rules to increase coverage'`) com o propósito de atingir limiares de cobertura sem implementar asserções para cada regra do preset.
  2. **Camada de Testes Unitários (`tests/preset/presetMaxUno.test.ts`):** 
     - As seções anteriores do arquivo (L34-96 e L98-208) testavam apenas as expressões regulares isoladamente (ex.: `regex.test(...)` ou `'...'.match(...)`), sem executar as funções de fábrica (*handlers*) retornadas pelo `presetMaxUno`.
     - Para suprir a falta de execução das funções declaradas em `preset.shortcuts` e `preset.rules`, o bloco `describe('coverage evaluation')` invocou cegamente os callbacks.
     - As funções `shortcut[1]` e `rule[1]` recebem desestruturações posicionais específicas (ex.: `([, s])`, `([, tp, vl])`, `([, first, second])`, `([, color, shade])`).
     - Ao passar estaticamente `['match', '10', '10']`, regras com comportamentos condicionais ou que esperam estruturas diferentes foram silenciadas pelo bloco vazio `catch(_e) {}`.
  3. **Camada de Integração e Build (`src/presetMaxUno.ts` ⇄ UnoCSS Engine ⇄ Aplicações Consumidoras):**
     - O UnoCSS compila classes em CSS utilizando as regras do preset. Se um handler retornar propriedades com valores indefinidos, incorretos ou tipos inválidos, o teste unitário não falha.
     - Apenas as regras introduzidas recentemente nas linhas 257-290 (`min-w`, `max-w`, `min-h`, `max-h`, `s-`) continham testes unitários reais com asserções sobre os objetos CSS retornados. Todo o restante dependia do sham test.

---

## Arquivos Afetados

1. `tests/preset/presetMaxUno.test.ts` — Remoção definitiva do sham test em `tests/preset/presetMaxUno.test.ts:233-256` e substituição por suítes unitárias robustas com asserções explícitas (`toEqual`) para cada handler de `shortcuts`, `rules` e `preflights`.

---

## Execuções Propostas

### 1. Remoção do Bloco de Cobertura Artificial
Excluir cirurgicamente o teste `'evaluates shortcuts and rules to increase coverage'` e seus blocos `try/catch` vazios em `tests/preset/presetMaxUno.test.ts:234-255`.

### 2. Implementação de Testes Reais com Asserções Explícitas para Handlers de Shortcuts
Criar testes unitários exercitando diretamente os callbacks de cada entrada de `preset.shortcuts`:
- **`hFull` / `hFlex` (`/^h[-_]?[fF](?:ull|lex)$/`):**
  - Executar o handler e validar retorno `{ height: '100% !important' }`.
- **`wFull` / `wFlex` (`/^w[-_]?[fF](?:ull|lex)$/`):**
  - Executar o handler e validar retorno `{ width: '100% !important' }`.
- **`font-size-X` (`/^font-size-(.+)$/`):**
  - Executar com `[, '1.5']` e validar retorno `{ 'font-size': '1.5rem !important' }`.
- **`fs-X` (`/^fs-(.+)$/`):**
  - Executar com `[, '0.875']` e validar retorno `{ 'font-size': '0.875rem !important' }`.
- **`color-X` (`/^color-([\w-]+)$/`):**
  - Executar com `[, 'blue-500']` e validar retorno `{ color: 'var(--blue-500) !important' }`.
  - Executar com valor vazio `[, '']` e validar retorno `undefined`.
- **`text-(center|left|right)`:**
  - Executar com `[, 'center']` e validar retorno `{ 'text-align': 'center !important' }`.
  - Executar com `[, 'left']` e validar retorno `{ 'text-align': 'left !important' }`.
- **`bg-X` (`/^bg-(.+)$/`):**
  - Validar descarte de palavras reservadas de background CSS: `'cover'`, `'contain'`, `'center'`, `'transparent'`, `'none'` retornam `undefined`.
  - Validar descarte de seletores com colchetes arbitrários (ex.: `'[#fff]'`) retornando `undefined`.
  - Validar descarte de valores contendo barras de opacidade (ex.: `'red-500/50'`) retornando `undefined`.
  - Validar suporte a cores diretas sem wrapping em `var`: `'#ff0000'`, `'rgb(0,0,0)'`, `'hsl(0,0%,0%)'` e `'var(--custom)'` retornam `{ 'background-color': valor }`.
  - Validar suporte a variáveis nomeadas: `'blue-500'` retorna `{ 'background-color': 'var(--blue-500)' }`.
- **`gap` (`/^(?:(row|col|column))?-gap-(.+)$/i`):**
  - Executar sem modificador direcional (`[, undefined, '16']`) e validar retorno `{ gap: '16px !important' }`.
  - Executar com modificador de coluna (`[, 'col', '8']`) e validar retorno `{ 'column-gap': '8px !important' }`.
  - Executar com modificador de linha (`[, 'row', '12']`) e validar retorno `{ 'row-gap': '12px !important' }`.
- **`paddingMargin` (`/^[pm][tblrwhyx]?-?(\d+)$/`):**
  - Executar repassando match e validar que delega corretamente ao helper `paddingMargin`.

### 3. Implementação de Testes Reais com Asserções Explícitas para Handlers de Rules
Criar testes unitários exercitando diretamente os callbacks de cada entrada de `preset.rules`:
- **Dimensões Máximas e Mínimas:**
  - `w-max-(.+)` e `w-min-(.+)`: validar retornos `{ 'max-width': ... }` e `{ 'min-width': ... }` com sufixo `!important`.
  - `h-max-(.+)` e `h-min-(.+)`: validar retornos `{ 'max-height': ... }` e `{ 'min-height': ... }` com sufixo `!important`.
- **Tipografia:**
  - `font-weight-(.+)`: executar com `[, '700']` e validar `{ 'font-weight': '700' }`.
- **Hover Dinâmico com Seletor Composto (`/^hover-(.+)$/`):**
  - Executar com `[, 'primary-500']` e validar que retorna a tupla esperada pelo UnoCSS:
    - Elemento 0: declaração CSS `{ color: 'var(--primary-500) !important' }`.
    - Elemento 1: objeto com função geradora de seletor. Executar `selector('.btn')` e validar retorno `'.btn:hover, .btn:hover .max-icon-div, .btn:hover .max-icon, .btn:hover svg'`.
- **Barra de Rolagem (`/^no-scrollbar/`):**
  - Executar e validar retorno da regra contendo `{ 'scrollbar-width': 'none', '-ms-overflow-style': 'none', 'overflow-y': 'auto' }`.
- **Grid Layout:**
  - `grid-(cols|rows)-(.+)`: validar `grid-template-columns` com substituição de hífen por espaço (`'1fr-2fr'` → `'1fr 2fr'`) e `grid-template-rows`.
  - `grid-(center|end|start)-(center|end|start)?`: validar retorno com 1 parâmetro (`'place-items': 'center'`) e com 2 parâmetros (`'place-items': 'center end'`).
- **Utilitários Adicionais:**
  - `elipsis`: validar retorno `{ 'white-space': 'nowrap', 'text-overflow': 'ellipsis', 'max-width': '100%', overflow: 'hidden' }`.
  - `s-(\d+)`: validar retorno da fórmula de flexbox: `{ flex: '1 0 calc(50% - 8px)' }`.
  - `opacity-?(\d+(?:\.\d+)?)$`:
    - Validar normalização de percentual inteiro (`50` → `'0.5'`).
    - Validar preservação de decimal (`0.8` → `'0.8'`).
    - Validar limitação no teto (*clamp*) (`150` → `'1'`).
    - Validar limitação no piso (`-10` → `'0'`).
    - Validar retorno `undefined` para valores inválidos / `NaN`.
  - `noClick`: validar retorno `{ 'pointer-events': 'none' }`.
- **Paleta de Cores Predefinidas:**
  - `(color)-(shade)`: executar com `[, 'blue', '500']` e validar `{ color: 'var(--blue-500)' }`.
  - `bg-(color)-(shade)`: executar com `[, 'red', '600']` e validar `{ 'background-color': 'var(--red-600)' }`.

### 4. Implementação de Testes Reais para Preflights (`preset.preflights`)
- Validar a execução de `preflights[0].getCSS()` com verificação do CSS gerado pelo compilador SCSS mockado (`expect(css).toBe('/* compiled css */')`).
- Validar resiliência e tratamento de exceção:
  - Testar cenário em que o arquivo SCSS não existe em nenhum caminho, validando que retorna string vazia `''`.
  - Testar cenário em que `sass.compile` lança erro, validando que a falha é tratada internamente e retorna string vazia `''` sem interromper a execução do preset.

---

## Especificação de Teste TDD (Red-Green)

### Cenário Red (Demonstração da Falha do Teste Atual)
O teste atual em `tests/preset/presetMaxUno.test.ts:234-255` não valida falhas reais:
- Se qualquer handler de shortcut ou rule for alterado em `src/presetMaxUno.ts` para retornar `{ color: 'invalid-css' }` ou lançar uma exceção não tratada, o teste existente passará ileso devido ao `catch(_e) {}`.
- A especificação Red substitui a chamada permissiva por asserções rígidas sobre cada objeto de regra retornado, que falhariam imediatamente se qualquer regra estivesse incorreta.

### Cenário Green (Validação Pós-Refatoração dos Testes)
A suíte `tests/preset/presetMaxUno.test.ts` executa sem nenhum bloco vazio `catch`, com 100% de asserções funcionais determinísticas:
```bash
npx vitest run tests/preset/presetMaxUno.test.ts
```
Todos os casos de teste devem apresentar status `PASS` comprovando cobertura funcional legítima de todas as funções do preset.

---

## Banco de Dados
**Nenhuma.** A alteração é restrita à suíte de testes unitários do preset UnoCSS no frontend.

---

## Riscos de Quebra e Não-Regressão

| Risco Identificado | Probabilidade | Impacto | Estratégia de Mitigação |
| :--- | :--- | :--- | :--- |
| **Queda Artificial na Cobertura:** Alguma branch secundária de `presetMaxUno.ts` deixar de ser exercitada após a remoção do laço genérico. | Média | Baixo | Mapeamento exaustivo de todos os branches (`bg` guards, `opacity` clamp, `color` vazio, `gap` direcional e preflights) em casos de teste unitário dedicados. |
| **Interferência com os Mocks Globais:** O mock de `sass` ou `node:fs` ser modificado indevidamente afetando outros testes. | Baixa | Médio | Manter a estrutura de mocks de alto nível no arquivo de testes, utilizando mocks locais ou spies apenas quando necessário. |
| **Regressão no Código de Produção:** Nenhuma. O arquivo `src/presetMaxUno.ts` não sofrerá alteração lógica; a intervenção é puramente na suíte de testes. | Nula | Nulo | Restrição estrita de modificações ao arquivo `tests/preset/presetMaxUno.test.ts`. |

---

## Validação

A comprovação do sucesso da implementação será obtida através da execução dos seguintes comandos:

1. **Execução dos Testes Unitários do Preset:**
   ```bash
   npx vitest run tests/preset/presetMaxUno.test.ts
   ```
2. **Execução dos Testes de Integração com Geração Real UnoCSS + PostCSS:**
   ```bash
   npx vitest run tests/preset/presetMaxUno.generate.test.ts
   ```
3. **Checagem Estática de Tipagem (TypeScript):**
   ```bash
   npm run type-check
   ```
4. **Validação de Estilo e Linter (ESLint / Stylelint):**
   ```bash
   npm run lint
   ```

---

## Skills Aplicáveis

- `test-driven-development` — Metodologia Red-Green e estruturação de testes unitários determinísticos com asserções reais.
- `vitest-skill` — Padrões de asserção, spies, mocks e execução de suítes de teste com Vitest.
- `vue-vitest-testing-best-practices` — Boas práticas para estruturação de testes, isolamento de escopo e clareza descritiva de suítes.
- `vue-unocss-styling-best-practices` — Conhecimento aprofundado da arquitetura de shortcuts, rules, seletores compostos e preflights no UnoCSS.
- `vue-eslint-stylelint-quality-standards` — Padrões de formatação e linting estrito aderentes ao `eslint.config.js`.
- `code-review-and-quality` — Revisão multidimensional contra sham tests, verificando ausência de swallowings de exceções e métricas de qualidade.
