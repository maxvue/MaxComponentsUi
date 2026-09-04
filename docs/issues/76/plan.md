# Plano de Implementação — Issue #76

## Descrição e Causa Raiz

### Problema
Durante a auditoria automatizada do ecossistema de utilitários de estilização, foram identificadas inconsistências críticas e ausência total de documentação nos módulos utilitários `gap` (`src/helpers/gap.ts`) e `paddingMargin` (`src/helpers/paddingMargin.ts`). Ambos os módulos são exportados e formam os blocos fundamentais das regras do preset UnoCSS oficial da biblioteca (`presetMaxUno` em `src/presetMaxUno.ts`).

Os agravantes detectados são:
1. **Ausência total de JSDoc/TSDoc:** Nenhum dos dois arquivos possui comentários de cabeçalho ou anotações JSDoc para as funções públicas exportadas (`gap` e `paddingMargin`). Não há especificação sobre o formato do array de entrada (`@param params`), tipagem semântica dos índices capturados pela regex do UnoCSS, nem sobre o contrato das propriedades CSS retornadas (`@returns`).
2. **Desconexão de contrato e bug funcional em `gap.ts`:** 
   - No preset UnoCSS (`src/presetMaxUno.ts:42`), a regra de atalho é definida como:
     `[/^(?:(row|col|column))?-gap-(.+)$/i, (params) => (hasContent(params[1]) ? gap(params) : { gap: getCssSize(params[2]) + ' !important' })]`
     A regex captura no grupo 1 (`params[1]`) os prefixos direcionais `"row"`, `"col"` ou `"column"`.
   - Porém, em `src/helpers/gap.ts:11-12`, a lógica de resolução de direção é:
     ```typescript
     if (params[1] && String(params[1]).toLowerCase() === 'row') return { 'row-gap': getCssSize(gap_value) + ' !important' };
     else if (params[1] && String(params[1]).toLowerCase() === 'gap') return { 'column-gap': getCssSize(gap_value) + ' !important' };
     ```
   - Como `gap.ts` compara estritamente `params[1]` com `'gap'`, ao utilizar as classes utilitárias previstas no preset (`col-gap-*` ou `column-gap-*`), `params[1]` recebe `"col"` ou `"column"`. Como nenhum dos dois é `'row'` nem `'gap'`, a função cai silenciosamente no fallback genérico `return { gap: getCssSize(gap_value) };` (sem o `!important` e com a propriedade errada `gap` em vez de `column-gap`).
   - Simultaneamente, a string literal `'gap'` é mapeada para `'column-gap'`, comportamento não intuitivo, sem justificativa semântica nem documentação para desenvolvedores consumidores.
3. **Ambiguidade não documentada no modificador `'h'` em `paddingMargin.ts`:**
   - Em `src/helpers/paddingMargin.ts:13-16`, o modificador `'h'` é mapeado para vertical (`top` e `bottom`):
     ```typescript
     const top = fullClass.includes('t') || fullClass.includes('y') || fullClass.includes('h');
     const bottom = fullClass.includes('b') || fullClass.includes('y') || fullClass.includes('h');
     const left = fullClass.includes('l') || fullClass.includes('x') || fullClass.includes('w');
     const right = fullClass.includes('r') || fullClass.includes('x') || fullClass.includes('w');
     ```
   - Em convenções comuns de utilitários CSS (e em inglês), a letra `'h'` é frequentemente associada a *horizontal* por engano (ou confundida com a propriedade de dimensão *height* de caixas), enquanto `'w'` é associado a *width*.
   - Embora `presetMaxUno.ts:21-23` mencione em um comentário interno que `w`/`h` são aliases de largura (eixo X) e altura (eixo Y), a função utilitária `paddingMargin.ts` não documenta esse contrato em sua assinatura. Desenvolvedores que consomem o helper isoladamente ou leem seu código fonte são induzidos ao erro, imaginando que `'h'` operaria horizontalmente, podendo introduzir regressões ou uso incorreto em classes utilitárias como `ph-` e `mh-`.

---

### Causa Raiz Comprovada

#### 1. Módulo `gap`: `src/helpers/gap.ts:4-16`
- **Arquivo e Linhas Exatos:** `src/helpers/gap.ts:6-16`
```typescript
// src/helpers/gap.ts:6-16
export function gap(params: Params): Record<string, string> | {} {
    if (params.length < 3 || !hasContent(params[2])) return {};


    const gap_value = String(params[2]).replace(':', '');
    if (params[1] && String(params[1]).toLowerCase() === 'row') return { 'row-gap': getCssSize(gap_value) + ' !important' };
    else if (params[1] && String(params[1]).toLowerCase() === 'gap') return { 'column-gap': getCssSize(gap_value) + ' !important' };


    return { gap: getCssSize(gap_value) };
}
```

- **Fluxo Causal e Rastreamento Reverso de Dados:**
  1. **Template/UI:** Desenvolvedor declara `<div class="col-gap-4">` ou `<div class="column-gap-6">`.
  2. **UnoCSS Engine (`presetMaxUno`):** A regra shortcut `/^(?:(row|col|column))?-gap-(.+)$/i` casa com o token de classe. O grupo 1 captura `'col'` ou `'column'` (`params[1]`), e o grupo 2 captura o valor `'4'` ou `'6'` (`params[2]`). Como `hasContent(params[1])` é verdadeiro, invoca `gap(params)`.
  3. **Helper `gap.ts`:** A função avalia `params[1].toLowerCase() === 'row'` (falso) e `params[1].toLowerCase() === 'gap'` (falso, pois o valor é `'col'` ou `'column'`).
  4. **Falha Silenciosa:** O fluxo atinge `return { gap: getCssSize(gap_value) };`. O CSS gerado aplica a propriedade genérica `gap: 4px` (sem `!important`), em vez de `column-gap: 4px !important`, quebrando a especificidade CSS dos shortcuts e o layout esperado em colunas flex/grid.
  5. **Mapeamento Ambíguo:** O teste existente em `tests/helpers/gap.test.ts:25` força `gap(['class', 'gap', '15'])` para retornar `column-gap`, consolidando a checagem literal `'gap'` sem nenhuma documentação formalizando o motivo ou o contrato suportado.

#### 2. Módulo `paddingMargin`: `src/helpers/paddingMargin.ts:3-28`
- **Arquivo e Linhas Exatos:** `src/helpers/paddingMargin.ts:5-17`
```typescript
// src/helpers/paddingMargin.ts:5-17
export function paddingMargin(params: Params): Record<string, string> | undefined {
    const fullClass = String(params[0]);
    const value = getCssSize(params[1]);

    if (!fullClass.includes('p') && !fullClass.includes('m')) return undefined;

    const operation = fullClass.includes('p') ? 'padding' : 'margin';

    const top = fullClass.includes('t') || fullClass.includes('y') || fullClass.includes('h');
    const bottom = fullClass.includes('b') || fullClass.includes('y') || fullClass.includes('h');
    const left = fullClass.includes('l') || fullClass.includes('x') || fullClass.includes('w');
    const right = fullClass.includes('r') || fullClass.includes('x') || fullClass.includes('w');
```

- **Fluxo Causal e Rastreamento Reverso de Dados:**
  1. **Template/UI:** Desenvolvedor ou componente utiliza classes com eixos direcionais compostos, ex.: `ph-4` ou `mh-2`.
  2. **UnoCSS Engine (`presetMaxUno`):** A shortcut `/^[pm][tblrwhyx]?-?(\d+)$/` casa a classe e despacha para `paddingMargin(params)`.
  3. **Helper `paddingMargin.ts`:** As flags booleanas utilizam `'h'` como determinante de `top` e `bottom` (altura vertical = Y), e `'w'` como determinante de `left` e `right` (largura horizontal = X).
  4. **Ambiguidade de Contrato:** Sem documentação JSDoc formal, desenvolvedores não possuem referência direta no helper de que `'h'` significa *height* (eixo vertical: topo + base) e não *horizontal*. Alterar o comportamento de código causaria regressão em classes existentes no projeto; logo, o problema é a ausência de especificação rigorosa do contrato de modificadores aceitos, suas convenções dimensionais e a blindagem contra suposições incorretas.

---

## Arquivos Afetados

1. `src/helpers/gap.ts` — Adicionar cabeçalho JSDoc completo com anotações `@param`, `@returns` e `@example`, e refatorar a checagem condicional para suportar formalmente `'col'`, `'column'` e `'gap'` (compatibilidade retroativa), gerando `'column-gap'` com `!important`.
2. `src/helpers/paddingMargin.ts` — Adicionar cabeçalho JSDoc completo com anotações `@param`, `@returns`, `@remarks` e `@example`, documentando detalhadamente o contrato de todos os eixos (`t`, `b`, `l`, `r`, `y`, `x`, `h` [height = vertical], `w` [width = horizontal]) e o tratamento de `!important`.
3. `tests/helpers/gap.test.ts` — Adicionar casos de teste unitário comprovando a resolução de `'col'` e `'column'` para `column-gap` com `!important` (case-insensitive) e a manutenção da compatibilidade com `'gap'`.
4. `tests/preset/presetMaxUno.generate.test.ts` — Adicionar testes de integração PostCSS/UnoCSS validando a geração correta de CSS para classes `col-gap-*`, `column-gap-*`, `row-gap-*`, `ph-*` e `pw-*`.

---

## Execuções Propostas

### 1. Refatoração e Documentação de `src/helpers/gap.ts`

- Inserir documentação JSDoc/TSDoc formal acima da função `gap`:
  - Descrever o papel do helper na resolução de espaçamentos flex/grid para regras de CSS do preset UnoCSS.
  - `@param params` — Tuple/array contendo `[match, direction, size]`, onde:
    - `params[0]` é a classe CSS completa matched (ex.: `'col-gap-4'`).
    - `params[1]` é o prefixo de direção opcional (`'row'`, `'col'`, `'column'` ou alias legado `'gap'`).
    - `params[2]` é o valor de espaçamento numérico ou com unidade CSS (ex.: `'10'`, `'1rem'`).
  - `@returns` — Objeto de estilo CSS contendo `'row-gap'`, `'column-gap'` ou `'gap'` com `!important` para modificadores direcionais.
  - `@remarks` — Esclarecer que a variante `'gap'` é mantida para compatibilidade histórica com testes e regras antigas onde `'gap'` mapeia para `'column-gap'`.
  - `@example` — Exemplos práticos de chamadas e retornos.

- Refatorar cirurgicamente a resolução condicional da direção:
  ```typescript
  import { getCssSize } from './getCssSize';
  import { hasContent } from '@maxvue/max-use';

  type Params = (number | string)[];

  /**
   * Resolve propriedades CSS de espaçamento (gap, row-gap, column-gap)
   * para o preset UnoCSS e utilitários de layout flex/grid.
   *
   * @param params - Vetor de captura regex do UnoCSS ou argumentos posicionais:
   *   - `params[0]`: Classe completa combinada (ex.: `'col-gap-4'`, `'row-gap-2'`).
   *   - `params[1]`: Identificador de direção (`'row'` para row-gap; `'col'`, `'column'` ou alias `'gap'` para column-gap).
   *   - `params[2]`: Valor dimensional numérico ou com unidade (ex.: `'10'`, `':10'`, `'2rem'`).
   * @returns Declaração CSS contendo `row-gap`, `column-gap` ou `gap`, ou objeto vazio caso inválido.
   *
   * @remarks
   * O modificador direcional `'gap'` é mantido como alias compatível para `column-gap`,
   * enquanto `'col'` e `'column'` são os identificadores canônicos gerados pelo preset.
   *
   * @example
   * ```typescript
   * gap(['row-gap-10', 'row', '10']); // { 'row-gap': '10px !important' }
   * gap(['col-gap-15', 'col', '15']); // { 'column-gap': '15px !important' }
   * gap(['column-gap-15', 'column', '15']); // { 'column-gap': '15px !important' }
   * gap(['gap-20', undefined, '20']); // { gap: '20px' }
   * ```
   */
  export function gap(params: Params): Record<string, string> | {} {
      if (params.length < 3 || !hasContent(params[2])) return {};

      const gap_value = String(params[2]).replace(':', '');
      const direction = params[1] ? String(params[1]).toLowerCase() : '';

      if (direction === 'row') return { 'row-gap': getCssSize(gap_value) + ' !important' };
      if (direction === 'col' || direction === 'column' || direction === 'gap') {
          return { 'column-gap': getCssSize(gap_value) + ' !important' };
      }

      return { gap: getCssSize(gap_value) };
  }
  ```

---

### 2. Documentação Rigorosa de `src/helpers/paddingMargin.ts`

- Inserir documentação JSDoc/TSDoc formal acima da função `paddingMargin`:
  - Descrever o papel do helper na decomposição de classes de padding e margin com eixos direcionais compostos e aplicação de `!important`.
  - `@param params` — Tuple/array contendo `[fullClass, value]`, onde `params[0]` é a classe de padding/margin e `params[1]` é a dimensão CSS.
  - `@returns` — Objeto de estilo CSS com as propriedades aplicadas ou `undefined` caso não seja uma regra de padding/margin.
  - `@remarks` — **Seção de disambiguação explícita de eixos:**
    - `t`: topo (`padding-top` / `margin-top`)
    - `b`: fundo (`padding-bottom` / `margin-bottom`)
    - `l`: esquerda (`padding-left` / `margin-left`)
    - `r`: direita (`padding-right` / `margin-right`)
    - `y`: vertical (topo + fundo)
    - `x`: horizontal (esquerda + direita)
    - `h`: **altura (height = vertical / topo + fundo)** — alias dimensional de `y`. Não representa horizontal.
    - `w`: **largura (width = horizontal / esquerda + direita)** — alias dimensional de `x`.
  - `@example` — Exemplos práticos demonstrando o comportamento dos eixos e aliases dimensionais.

```typescript
import { getCssSize } from './getCssSize';

type Params = (number | string)[];

/**
 * Resolve regras e atalhos de padding e margin para o preset UnoCSS (`presetMaxUno`).
 *
 * Suporta direções atômicas, eixos ortogonais padrão (`x`, `y`) e aliases dimensionais
 * de caixa (`w` para largura/horizontal, `h` para altura/vertical).
 *
 * @param params - Vetor de parâmetros fornecido pelo motor de regras do UnoCSS:
 *   - `params[0]`: Classe ou identificador contendo os modificadores de prefixo e eixo (ex.: `'p'`, `'pt'`, `'mx'`, `'ph'`, `'mw'`).
 *   - `params[1]`: Tamanho ou valor dimensional a ser processado por `getCssSize` (ex.: `10`, `'2rem'`).
 * @returns Objeto Record com as propriedades CSS e sufixo `!important`, ou `undefined` se a classe não contiver `'p'` nem `'m'`.
 *
 * @remarks
 * **Atenção aos modificadores dimensionais:**
 * - `'h'` refere-se a **Height (Altura / Vertical)**: aplica estilos simultâneos para `top` e `bottom` (equivalente ao eixo `y`). **Não** representa horizontal.
 * - `'w'` refere-se a **Width (Largura / Horizontal)**: aplica estilos simultâneos para `left` e `right` (equivalente ao eixo `x`).
 *
 * @example
 * ```typescript
 * paddingMargin(['p', 10]); // { padding: '10px !important' }
 * paddingMargin(['pt', 5]); // { 'padding-top': '5px !important' }
 * paddingMargin(['py', 8]); // { 'padding-top': '8px !important', 'padding-bottom': '8px !important' }
 * paddingMargin(['ph', 8]); // { 'padding-top': '8px !important', 'padding-bottom': '8px !important' }
 * paddingMargin(['pw', 8]); // { 'padding-left': '8px !important', 'padding-right': '8px !important' }
 * ```
 */
export function paddingMargin(params: Params): Record<string, string> | undefined {
    // ... corpo da função mantido intacto ...
}
```

---

### 3. Expansão de Testes Unitários e Integração

1. Em `tests/helpers/gap.test.ts`:
   - Adicionar teste para `params[1] === 'col'`:
     `expect(gap(['class', 'col', '10'])).toEqual({ 'column-gap': '10px !important' });`
   - Adicionar teste para `params[1] === 'column'`:
     `expect(gap(['class', 'column', '10'])).toEqual({ 'column-gap': '10px !important' });`
   - Adicionar teste case-insensitive para `'COL'` e `'COLUMN'`.
   - Garantir preservação de todos os 9 testes existentes (incluindo o suporte legado a `'gap'`).

2. Em `tests/preset/presetMaxUno.generate.test.ts`:
   - Adicionar asserções de geração real PostCSS para:
     ```html
     <div class="col-gap-4 column-gap-8 row-gap-12 ph-16 pw-20"></div>
     ```
   - Validar que o CSS gerado contém:
     - `column-gap: 4px !important;`
     - `column-gap: 8px !important;`
     - `row-gap: 12px !important;`
     - `padding-top: 16px !important;` e `padding-bottom: 16px !important;` (para `ph-16`)
     - `padding-left: 20px !important;` e `padding-right: 20px !important;` (para `pw-20`)

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Reprodução Comprovada da Falha)
Criar teste unitário em `tests/helpers/gap.test.ts`:
```typescript
it('retorna column-gap quando segundo parâmetro é "col"', () => {
    expect(gap(['class', 'col', '10'])).toEqual({ 'column-gap': '10px !important' });
});

it('retorna column-gap quando segundo parâmetro é "column"', () => {
    expect(gap(['class', 'column', '10'])).toEqual({ 'column-gap': '10px !important' });
});
```
- **Resultado Red:** No código atual de `src/helpers/gap.ts:11-16`, a função avalia `params[1] === 'gap'` e falha ao reconhecer `'col'` e `'column'`, retornando `{ gap: '10px' }`.
- **Erro emitido:** `AssertionError: expected { gap: '10px' } to deeply equal { 'column-gap': '10px !important' }`.

### 2. Etapa Green (Validação Pós-Correção)
Após a alteração cirúrgica de `src/helpers/gap.ts` reconhecendo `'col'`, `'column'` e `'gap'`:
- Os novos testes passam com status `PASSED`.
- Os testes existentes continuam passando com status `PASSED`.
- Teste de geração real do UnoCSS gera `column-gap` válido com `!important` para `col-gap-4` e `column-gap-8`.

---

## Banco de Dados

- **Nenhuma** migration necessária (alteração exclusiva na biblioteca de estilização e utilitários frontend).

---

## Riscos de Quebra e Não-Regressão

- **Compatibilidade Retroativa Total:**
  - Manter o suporte a `'gap'` mapeando para `'column-gap'` assegura que nenhuma suíte de teste pré-existente ou chamada interna quebre.
  - A manutenção da semântica de `'h'` como altura (vertical: top + bottom) e `'w'` como largura (horizontal: left + right) em `paddingMargin.ts` previne quebras visuais em telas que dependem dessas classes já ativas em produção.
- **Garantia de Não-Regressão:**
  - Execução de 100% da suíte de testes unitários do projeto (`npm test` — 139 arquivos de teste e 1878 testes).
  - Verificação de conformidade com TypeScript estrito (`npm run type-check`).
  - Verificação de lint e formatação de estilo de código (`npm run lint`).

---

## Validação

1. **Testes Unitários dos Helpers:**
   ```bash
   npx vitest run tests/helpers/gap.test.ts tests/helpers/paddingMargin.test.ts
   ```
2. **Testes de Integração com Geração CSS Real UnoCSS / PostCSS:**
   ```bash
   npx vitest run tests/preset/presetMaxUno.generate.test.ts tests/preset/presetMaxUno.test.ts
   ```
3. **Suíte Completa de Testes:**
   ```bash
   npm test
   ```
4. **Checagem de Tipagem TypeScript:**
   ```bash
   npm run type-check
   ```
5. **Checagem de Linter e Estilo:**
   ```bash
   npm run lint
   ```

---

## Skills Aplicáveis

- `technical-documentation-best-practices` — Padrões para escrita e estruturação de JSDoc/TSDoc em TypeScript com `@param`, `@returns`, `@remarks` e `@example`.
- `test-driven-development` — Metodologia Red-Green para reprodução estrita de falhas de contrato antes da refatoração.
- `vue-unocss-styling-best-practices` — Normas de configuração de regras e shortcuts no preset customizado `presetMaxUno`.
- `vue-eslint-stylelint-quality-standards` — Padrões de formatação, indentação de 4 espaços e conformidade com `eslint.config.js`.
- `code-review-and-quality` — Checklist de integridade semântica e prevenção de regressões antes do encerramento.
