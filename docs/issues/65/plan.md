# Plano de Implementação — Issue #65

## Descrição e Causa Raiz

### Problema
No arquivo de teste `tests/components/MaxIcon.test.ts`, três testes unitários responsáveis por validar a aplicação de estilos visuais no componente `MaxIcon.vue` utilizam condicionais `if (style)` antes de invocar as asserções do Vitest:
1. `it('aplica tamanho via prop size')` (L48-53);
2. `it('aplica cor escura via dark')` (L65-72);
3. `it('aplica cor clara via light')` (L82-89).

Em cada um desses testes, a extração do atributo `style` é feita através de `wrapper.find('.max-icon-div')?.attributes('style')` e colocada sob `if (style) { expect(style)... }`.

Se por qualquer motivo o elemento `.max-icon-div` não for encontrado, não possuir o atributo `style` vinculado (ex.: remoção acidental de `:style="style"` no template), ou se `attributes('style')` retornar `undefined`, o bloco `if` é silenciosamente ignorado. Como o Vitest considera suítes sem asserções executadas e sem exceções lançadas como bem-sucedidas (*passed*), esses testes tornam-se falsos positivos (*false positives*), mascarando regressões críticas de renderização e quebras de contrato de layout/tema.

### Causa Raiz Comprovada
- **Localização Exata:** `tests/components/MaxIcon.test.ts:48-53`, `tests/components/MaxIcon.test.ts:65-72` e `tests/components/MaxIcon.test.ts:82-89`.

```typescript
// tests/components/MaxIcon.test.ts:48-53
it('aplica tamanho via prop size', () => {
    const wrapper = mountIcon({ size: '2rem' });
    const style = wrapper.find('.max-icon-div')?.attributes('style');
    if (style) expect(style).toContain('2rem');

});

// tests/components/MaxIcon.test.ts:65-72
it('aplica cor escura via dark', () => {
    const wrapper = mountIcon({ dark: 0.6 });
    const style = wrapper.find('.max-icon-div')?.attributes('style');
    if (style) {
        expect(style).toContain('0.6');
        expect(style).toContain('0, 0, 0');
    }
});

// tests/components/MaxIcon.test.ts:82-89
it('aplica cor clara via light', () => {
    const wrapper = mountIcon({ light: 0.8 });
    const style = wrapper.find('.max-icon-div')?.attributes('style');
    if (style) {
        expect(style).toContain('0.8');
        expect(style).toContain('255, 255, 255');
    }
});
```

- **Fluxo Causal e Rastreamento Reverso de Dados:**
  `Test Runner (Vitest)` ➔ `mountIcon(props)` ➔ `MaxIcon.vue` (computa `sizeStyles` / `colorStyle` ➔ `style` ➔ `<div class="max-icon-div" :style="style">`) ➔ `wrapper.find('.max-icon-div')?.attributes('style')` ➔ `if (style)` avalia condição de guarda ➔ Se `style` for `undefined`/`null`, a condição avalia para `false` ➔ o fluxo pula o bloco de asserções ➔ 0 asserções executadas ➔ Teste finaliza com status `PASSED` (falso positivo, permitindo regressões silenciosas).

---

## Arquivos Afetados

1. `tests/components/MaxIcon.test.ts` — Remoção das condicionais `if (style)` e garantia de asserções determinísticas e obrigatórias para os três testes afetados (`aplica tamanho via prop size`, `aplica cor escura via dark` e `aplica cor clara via light`).

---

## Execuções Propostas

### 1. Refatoração Cirúrgica em `tests/components/MaxIcon.test.ts`
- **Teste 1 — `aplica tamanho via prop size` (L48-53):**
  - Remover a verificação condicional `if (style)`.
  - Obter o atributo `style` diretamente via `wrapper.find('.max-icon-div').attributes('style')`.
  - Assertar explicitamente que `style` está definido e contém a dimensão informada:
    ```typescript
    it('aplica tamanho via prop size', () => {
        const wrapper = mountIcon({ size: '2rem' });
        const style = wrapper.find('.max-icon-div').attributes('style');

        expect(style).toBeDefined();
        expect(style).toContain('2rem');
    });
    ```

- **Teste 2 — `aplica cor escura via dark` (L65-72):**
  - Remover o bloco condicional `if (style) { ... }`.
  - Obter o atributo `style` diretamente via `wrapper.find('.max-icon-div').attributes('style')`.
  - Executar as asserções incondicionalmente:
    ```typescript
    it('aplica cor escura via dark', () => {
        const wrapper = mountIcon({ dark: 0.6 });
        const style = wrapper.find('.max-icon-div').attributes('style');

        expect(style).toBeDefined();
        expect(style).toContain('0.6');
        expect(style).toContain('0, 0, 0');
    });
    ```

- **Teste 3 — `aplica cor clara via light` (L82-89):**
  - Remover o bloco condicional `if (style) { ... }`.
  - Obter o atributo `style` diretamente via `wrapper.find('.max-icon-div').attributes('style')`.
  - Executar as asserções incondicionalmente:
    ```typescript
    it('aplica cor clara via light', () => {
        const wrapper = mountIcon({ light: 0.8 });
        const style = wrapper.find('.max-icon-div').attributes('style');

        expect(style).toBeDefined();
        expect(style).toContain('0.8');
        expect(style).toContain('255, 255, 255');
    });
    ```

- **Padronização e Estilo:**
  - Garantir indentação de 4 espaços conforme `eslint.config.js`.
  - Eliminar linhas em branco desnecessárias.

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Comprovação da Falha / Falso Positivo)
- **Cenário de Quebra / Falso Positivo Atual:**
  Caso a ligação `:style="style"` seja removida temporariamente de `MaxIcon.vue:2` (`<div class="max-icon-div" v-if="icon_name" ref="icon_ref">`), os três testes atuais continuam passando (Green indevido com 0 asserções executadas).
- **Comportamento Red Desejado:**
  Com a refatoração das asserções incondicionais, a simulação da ausência do atributo `style` ou de valores incorretos faz os três testes falharem imediatamente com `AssertionError: expected undefined to be defined` (ou `expected undefined to contain '...'`).

### 2. Etapa Green (Validação Pós-Refatoração)
- Ao executar os testes refatorados com a implementação normal de `MaxIcon.vue`, todos os 19 testes de `tests/components/MaxIcon.test.ts` executam com sucesso, assegurando que as asserções de `size`, `dark` e `light` foram de fato validadas.

---

## Banco de Dados

- **Nenhuma** migration necessária (alteração exclusiva na suíte de testes de componente frontend).

---

## Riscos de Quebra e Não-Regressão

- **Riscos de Contrato / Componente:** Nenhum. A alteração afeta unicamente o arquivo de testes unitários `tests/components/MaxIcon.test.ts`, sem qualquer modificação no código de produção de `MaxIcon.vue`.
- **Garantia de Não-Regressão:**
  - Todos os 19 testes do arquivo `tests/components/MaxIcon.test.ts` devem ser executados e passar.
  - Toda a suíte de testes do projeto deve continuar verde (`npm test`).
  - Verificação de integridade de tipos com `npm run type-check`.
  - Verificação de estilo com `npm run lint`.

---

## Validação

- **Execução dos Testes do Componente:**
  ```bash
  npm test -- tests/components/MaxIcon.test.ts
  ```
- **Execução de Toda a Suíte de Testes:**
  ```bash
  npm test
  ```
- **Checagem de Tipos TypeScript:**
  ```bash
  npm run type-check
  ```
- **Checagem de Linter e Estilo:**
  ```bash
  npm run lint
  ```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices`
- `planning-with-files`
- `vue-debugging-best-practices`
- `tdd`
- `code-review`
- `production-code-audit`
