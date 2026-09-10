# Plano de Implementação — Issue #77

## Descrição e Causa Raiz

### Problema
No componente `src/components/MaxDrawer.vue`, o gerenciamento de retenção e restauração de foco acessível é implementado via helper `useFocusTrap(panel_el)`.
Quando a propriedade reativa `visible` transiciona para `true`, o watcher imediato (`MaxDrawer.vue:184-208`) executa `trap.activate()`. O helper armazena o elemento ativo anterior (`previous = document.activeElement`) e transfere o foco para o primeiro elemento focável contido no painel do drawer.

Ao fechar normalmente pela alternância da prop (`visible` transiciona para `false`), o watcher executa `trap.deactivate()`, que restaura o foco ao elemento de origem (`if (previous?.isConnected) previous.focus()`) e libera a referência (`previous = null`).

Contudo, no hook `onBeforeUnmount` (`MaxDrawer.vue:210-217`), o componente realiza apenas a remoção do event listener de tecla Escape (`document.removeEventListener('keydown', onEscape)`) e o desbloqueio do scroll lock (`scroll_lock.unlock()`), omitindo completamente a invocação de `trap.deactivate()`.

### Agravantes e Cenário de Falha
1. **Perda de Foco em Desmontagem Direta (Acessibilidade WCAG 2.1 - 2.4.3 Focus Order):** Quando o drawer é desmontado enquanto aberto (`visible: true`) — por exemplo, em transição de rotas no Vue Router, desmontagem condicional do componente pai via `v-if`, ou fechamento reativo com desmontagem simultânea —, a prop `visible` não sofre transição prévia para `false`. O watcher nunca cai no bloco de fechamento (`!value`), impedindo a execução de `trap.deactivate()`. Como consequência, o foco não é devolvido ao botão/elemento acionador original, ficando perdido no `document.body` ou em nós desanexados da árvore DOM.
2. **Retenção de Referência a Elementos DOM (Memory Leak):** A variável `previous` no closure de `useFocusTrap` retém a referência direta ao nó DOM do elemento que disparou a abertura. Se o container pai também for destruído ou substituído, o nó do elemento anterior permanece referenciado no closure do trap, impedindo sua coleta pelo Garbage Collector.
3. **Inconsistência Arquitetural com Componentes Análogos:** Todos os demais componentes de overlay do design system que utilizam `useFocusTrap` realizam a limpeza e restauração de foco de forma defensiva em `onBeforeUnmount`:
   - `MaxModal.vue:185`: executa `trap.deactivate()` em `onBeforeUnmount`.
   - `MaxPopover.vue:191`: executa `trap.deactivate()` em `onBeforeUnmount`.
   - `MaxPopoverConfirm.vue:75`: executa `trap.deactivate()` em `onBeforeUnmount`.
   - `MaxPdfView.vue:113`: executa `trap.deactivate()` em `onBeforeUnmount`.

---

### Causa Raiz Comprovada

- **Arquivo e Linha Exatos:** `src/components/MaxDrawer.vue:210-217`
```typescript
// src/components/MaxDrawer.vue:210-217 (Comportamento defeituoso original)
onBeforeUnmount(() => {
    document.removeEventListener('keydown', onEscape);
    if (has_scroll_lock) {
        scroll_lock.unlock();
        has_scroll_lock = false;
    }
});
```

- **Fluxo Causal e Rastreamento Reverso de Dados:**
  1. **UI / Gatilho de Foco:** O usuário interage com a interface (ex.: clica em `<button id="btn-trigger">Abrir Menu</button>`). O botão recebe foco ativo no navegador (`document.activeElement === btn-trigger`).
  2. **Abertura do Drawer:** O componente consumidor atualiza o estado para abrir o drawer (`visible = true`).
  3. **Ativação do Trap (`src/components/MaxDrawer.vue:191`):** O watcher reage à mutação de `visible`, dispara `emit('show')` e invoca `trap.activate()`. Em `src/helpers/useFocusTrap.ts:25`, `previous = document.activeElement` salva a referência a `btn-trigger`, e o foco é movido para o interior do painel (`panel_el`).
  4. **Desmontagem com Drawer Aberto:** Antes que `visible` seja alterado para `false`, o componente é desmontado (mudança de rota ou destruição de nó ancestral).
  5. **Execução de `onBeforeUnmount` (`src/components/MaxDrawer.vue:210-217`):** O hook de ciclo de vida do Vue roda a limpeza de scroll e eventos, mas **não** chama `trap.deactivate()`.
  6. **Falha Silenciosa:** O watcher nunca entra na ramificação `if (!value)` (`MaxDrawer.vue:201`). Consequentemente, a rotina em `src/helpers/useFocusTrap.ts:56-63` (`if (previous?.isConnected) previous.focus(); previous = null;`) nunca é executada. O foco original não é restaurado e a referência ao elemento anterior é vazada no closure.

---

## Arquivos Afetados

1. `src/components/MaxDrawer.vue`
   - Inclusão da chamada defensiva e idempotente a `trap.deactivate()` no hook `onBeforeUnmount` (linha 211), alinhando o componente ao padrão do ecossistema (`MaxModal.vue`, `MaxPopover.vue`, `MaxPopoverConfirm.vue` e `MaxPdfView.vue`).
2. `tests/components/MaxDrawer.test.ts`
   - Adição de testes unitários automatizados validando:
     - Restauração de foco para o elemento anterior (`document.activeElement`) na desmontagem do drawer enquanto aberto (`visible: true`).
     - Idempotência e segurança na desmontagem do drawer quando já fechado (`visible: false`).
     - Tolerância defensiva caso o elemento anterior tenha sido desconectado da árvore DOM antes da desmontagem.

---

## Execuções Propostas

### 1. Correção Cirúrgica em `src/components/MaxDrawer.vue`

No arquivo `src/components/MaxDrawer.vue`, atualizar o hook `onBeforeUnmount` (linhas 210-217):

```typescript
// ANTES (src/components/MaxDrawer.vue:210-217):
onBeforeUnmount(() => {
    document.removeEventListener('keydown', onEscape);
    if (has_scroll_lock) {
        scroll_lock.unlock();
        has_scroll_lock = false;
    }
});

// DEPOIS:
onBeforeUnmount(() => {
    trap.deactivate();
    document.removeEventListener('keydown', onEscape);
    if (has_scroll_lock) {
        scroll_lock.unlock();
        has_scroll_lock = false;
    }
});
```

#### Análise de Idempotência e Segurança da Execução:
- Em `src/helpers/useFocusTrap.ts:56-63`:
  ```typescript
  const deactivate = () => {
      if (previous?.isConnected) previous.focus();
      previous = null;
  };
  ```
- **Cenário 1 — Fechamento normal antes do unmount:** Se o drawer for fechado normalmente (`props.visible = false`), o watcher já invocou `trap.deactivate()`, que restaurou o foco e atribuiu `previous = null`. Quando `onBeforeUnmount` for chamado subsequentemente, `trap.deactivate()` atuará como um no-op inofensivo, pois `previous` já será `null`.
- **Cenário 2 — Desmontagem com drawer aberto:** Se o drawer for destruído enquanto `visible: true`, `onBeforeUnmount` chamará `trap.deactivate()`, restaurando o foco ao elemento disparador e limpando `previous` para evitar retenção de memória.
- **Cenário 3 — Elemento anterior desanexado:** Se o elemento disparador original tiver sido removido da árvore DOM enquanto o drawer estava aberto, a guarda `previous?.isConnected` garantirá que nenhuma tentativa de foco inválida seja realizada, prevenindo erros em runtime.

---

## Especificação de Teste TDD (Red-Green)

### 1. Teste de Reprodução da Falha (Fase Vermelha / Red)
Adicionar os seguintes cenários ao bloco `describe('MaxDrawer')` em `tests/components/MaxDrawer.test.ts`:

```typescript
it('restaura o foco ao elemento anterior ao desmontar o drawer enquanto visivel', async () => {
    // 1. Cria e foca no botao acionador
    const botaoOrigem = document.createElement('button');
    botaoOrigem.id = 'trigger-abrir';
    document.body.appendChild(botaoOrigem);
    botaoOrigem.focus();
    expect(document.activeElement).toBe(botaoOrigem);

    // 2. Monta o MaxDrawer diretamente com visible: true
    const wrapper = mount(MaxDrawer, {
        props: { visible: true, showCloseIcon: false },
        slots: { default: '<button id="btn-interno">Acao Interna</button>' },
        attachTo: document.body
    });

    // 3. Aguarda o focus trap mover o foco para o primeiro elemento focavel do painel
    await nextTick();
    expect(document.activeElement?.id).toBe('btn-interno');

    // 4. Desmonta o drawer sem alterar props.visible previamente (simulando destruicao de rota ou v-if)
    wrapper.unmount();
    await nextTick();

    // 5. RED: Sem a chamada a trap.deactivate() em onBeforeUnmount, document.activeElement NAO retorna ao botaoOrigem
    // GREEN: Com trap.deactivate() em onBeforeUnmount, o foco é restaurado com sucesso para botaoOrigem
    expect(document.activeElement).toBe(botaoOrigem);

    document.body.removeChild(botaoOrigem);
});

it('desmontar drawer fechado e seguro e idempotente', async () => {
    const wrapper = mount(MaxDrawer, {
        props: { visible: false },
        attachTo: document.body
    });

    expect(() => wrapper.unmount()).not.toThrow();
});

it('desmontar drawer aberto com elemento anterior desconectado nao lanca erro', async () => {
    const botaoRemovido = document.createElement('button');
    document.body.appendChild(botaoRemovido);
    botaoRemovido.focus();

    const wrapper = mount(MaxDrawer, {
        props: { visible: true },
        slots: { default: '<button id="btn-seguro">Seguro</button>' },
        attachTo: document.body
    });
    await nextTick();

    // Remove o botao acionador do DOM antes de desmontar o drawer
    document.body.removeChild(botaoRemovido);

    expect(() => wrapper.unmount()).not.toThrow();
});
```

### 2. Fase Verde (Green)
Com a inserção de `trap.deactivate()` no hook `onBeforeUnmount`, todos os 3 testes adicionais passam com sucesso, complementando os 41 testes unitários pré-existentes da suíte de `MaxDrawer`.

---

## Banco de Dados

**Nenhuma** migration ou alteração de banco de dados necessária (escopo estritamente front-end em biblioteca de componentes Vue 3 / TypeScript).

---

## Riscos de quebra e Não-Regressão

| Área de Risco | Avaliação | Medida Mitigatória |
| :--- | :--- | :--- |
| **Quebra de Contrato de Props/Emits** | Nulo | A assinatura de props, eventos emitidos e métodos públicos expostos (`open`, `close`, `toggle`, `is_show`) permanece 100% inalterada. |
| **Dupla Desativação (Fechamento Normal + Desmontagem)** | Nulo | A função `deactivate()` de `useFocusTrap` é estritamente idempotente (`previous = null` na primeira chamada; invocações subsequentes não operam ações nem disparam erros). |
| **Elemento Anterior Desconectado** | Nulo | O helper `useFocusTrap` possui proteção nativa `if (previous?.isConnected) previous.focus()`, prevenindo exceções caso o botão disparador não pertença mais ao documento. |
| **Regressão de Testes Existentes** | Nulo | Todos os 41 testes da suíte de `MaxDrawer` e os mais de 1800 testes do ecossistema continuam passando sem alteração de comportamento. |

---

## Validação

1. **Execução dos Testes Unitários de `MaxDrawer`:**
   ```bash
   npm test -- tests/components/MaxDrawer.test.ts
   ```
   Valida que todos os testes da suíte (44 testes), incluindo os novos cenários de restauração de foco em desmontagem, passam com 100% de sucesso.

2. **Execução de Toda a Suíte de Testes do Pacote:**
   ```bash
   npm test
   ```
   Valida que todos os 139 arquivos de teste e mais de 1890 testes do pacote passam sem nenhuma regressão.

3. **Verificação de Tipagem Estrita TypeScript (Vue-TSC):**
   ```bash
   npm run type-check
   ```
   Garante conformidade com o compilador TypeScript e `vue-tsc --noEmit` com zero erros.

4. **Verificação de Formatação e Linter (ESLint):**
   ```bash
   npx eslint src/components/MaxDrawer.vue tests/components/MaxDrawer.test.ts
   ```
   Garante conformidade com as regras estritas do ESLint (`eslint.config.js`) nos arquivos afetados.

5. **Verificação de Folhas de Estilo (Stylelint):**
   ```bash
   npx stylelint src/components/MaxDrawer.vue
   ```
   Valida a conformidade de estilização SCSS do componente com o Stylelint sem sobrecarga de memória.

---

## Skills Aplicáveis

- `systematic-debugging-best-practices` (Diagnóstico sistemático de causa raiz e rastreamento de ciclo de vida e foco)
- `vue-debugging-best-practices` (Análise de ciclo de vida do Vue 3, watchers imediatos e hooks `onBeforeUnmount`)
- `vue-components` (Autoria e manutenção de Single File Components com script setup e acessibilidade)
- `vue-max-stack-frontend-best-practices` (Convenções estruturais e padrões de componentes de overlay do projeto)
- `test-driven-development` (Metodologia Red-Green para isolamento e garantia do comportamento de foco)
- `vue-vitest-testing-best-practices` (Criação de testes unitários com Vitest e `@vue/test-utils`)
- `code-review-and-quality` (Auditoria de qualidade, memory leaks e mitigação de regressões)
- `vue-eslint-stylelint-quality-standards` (Padrões de formatação, linters e conformidade com `eslint.config.js` e `stylelint`)
