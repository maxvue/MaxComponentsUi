# Plano de Implementação — Issue #77

## Descrição e Causa Raiz

### Problema e Agravantes
No componente `MaxDrawer` (`src/components/MaxDrawer.vue`), o controle de retenção de foco acessível (WAI-ARIA Dialog/Drawer focus trap) é gerenciado pelo composable `useFocusTrap` (`src/helpers/useFocusTrap.ts`), associado à referência do painel (`panel_el`).

Quando o drawer é aberto (`props.visible` torna-se `true`), o watcher imediato executa `trap.activate()`, que registra em sua closure interna o elemento que possuía o foco ativo no documento antes da abertura:
```typescript
previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
```
Em seguida, move o foco para o primeiro elemento interativo dentro do painel do drawer. Ao fechar normalmente via fluxo reativo (`props.visible` alternado para `false`), o watcher executa `trap.deactivate()`, que restaura o foco ao elemento original (`if (previous?.isConnected) previous.focus()`) e zera a referência (`previous = null`).

No entanto, no hook de ciclo de vida `onBeforeUnmount` (`src/components/MaxDrawer.vue:210-216`), o componente realiza apenas a limpeza do listener de teclado e do travamento de scroll:
```typescript
onBeforeUnmount(() => {
    document.removeEventListener('keydown', onEscape);
    if (has_scroll_lock) {
        scroll_lock.unlock();
        has_scroll_lock = false;
    }
});
```
A chamada a `trap.deactivate()` foi **completamente omitida** em `onBeforeUnmount`.

#### Agravantes
1. **Perda de Foco e Desorientação Acessível (WAI-ARIA):** Se o drawer for desmontado enquanto estiver aberto — cenário frequente em SPAs durante transições de rota (Vue Router), alternância de abas, desmontagem condicional (`v-if`) do componente pai, ou destruição imediata de telas modais — o foco nunca é devolvido ao elemento acionador original (trigger). O foco do navegador fica perdido no `document.body` ou retido em nós virtuais desconectados, desorientando completamente usuários que utilizam leitores de tela ou navegação exclusiva por teclado.
2. **Retenção de Nós DOM na Closure (Memory Leak Front-end):** A variável privada `previous` do `useFocusTrap` mantém uma referência direta forte ao elemento DOM (`HTMLElement`) que abriu o drawer. Como `trap.deactivate()` não é chamado no desmonte, `previous` não é limpo (`previous = null`), retendo elementos DOM da tela anterior na memória da closure se houver referências residuais à instância ou listeners no escopo.
3. **Inconsistência Arquitetural com os Demais Overlays do Projeto:** Todos os demais componentes de overlay do projeto que utilizam `useFocusTrap` realizam a chamada a `trap.deactivate()` no hook `onBeforeUnmount`:
   - `src/components/MaxModal.vue:185`: `trap.deactivate();`
   - `src/components/MaxPopover.vue:191`: `trap.deactivate();`
   - `src/components/MaxPopoverConfirm.vue:75`: `trap.deactivate();`
   - `src/components/MaxPdfView.vue:113`: `trap.deactivate();`
   Apenas `MaxDrawer.vue` permaneceu com a chamada de desativação omitida no desmonte.

---

### Causa Raiz Comprovada
- **Arquivo e Linhas Exatos:** `src/components/MaxDrawer.vue:210-216`
```typescript
// src/components/MaxDrawer.vue:210-216
onBeforeUnmount(() => {
    document.removeEventListener('keydown', onEscape);
    if (has_scroll_lock) {
        scroll_lock.unlock();
        has_scroll_lock = false;
    }
});
```

- **Fluxo Causal e Rastreamento Reverso de Dados:**
  1. **UI / Elemento Acionador:** O usuário foca em um botão ou gatilho da página (`<button id="open-drawer">Abrir</button>`) e o ativa. O elemento torna-se o `document.activeElement`.
  2. **Reatividade do Componente (`props.visible = true`):** O watcher em `MaxDrawer.vue:184-208` executa o bloco `if (value)`, chamando `trap.activate()` (`L191`).
  3. **Captura no Trap (`src/helpers/useFocusTrap.ts:48-54`):** `trap.activate()` captura `previous = document.activeElement` e agenda a transferência do foco para o primeiro elemento focável dentro de `panel_el`.
  4. **Desmontagem do Drawer Aberto:** Antes que a prop `visible` passe para `false` (ex.: navegação do Vue Router mudando de rota, destruição do componente pai via `v-if`, ou fechamento síncrono com desmontagem do container), o componente entra no ciclo de destruição.
  5. **Execução de `onBeforeUnmount` (`MaxDrawer.vue:210-216`):** O Vue dispara `onBeforeUnmount`. O listener `'keydown'` de escape é removido e o scroll do body é liberado, mas `trap.deactivate()` **não** é chamado.
  6. **Falha Silenciosa:** O bloco `else` do watcher (`MaxDrawer.vue:201`) nunca é executado porque a prop `visible` não sofreu mutação reativa de `true` para `false` antes da destruição. Logo, `previous.focus()` e `previous = null` (`src/helpers/useFocusTrap.ts:56-63`) nunca ocorrem.

---

## Arquivos Afetados

1. `src/components/MaxDrawer.vue`
   - Inserção da chamada defensiva e idempotente a `trap.deactivate()` no hook `onBeforeUnmount` (linha 211), alinhando o ciclo de vida com `MaxModal.vue`, `MaxPopover.vue`, `MaxPopoverConfirm.vue` e `MaxPdfView.vue`.

2. `tests/components/MaxDrawer.test.ts`
   - Adição de testes unitários automatizados validando:
     - Devolução de foco ao elemento anterior (`document.activeElement`) ao desmontar o drawer enquanto aberto (`visible: true`).
     - Idempotência e segurança ao desmontar o drawer quando já estiver fechado (`visible: false`).
     - Tolerância a elementos anteriores desconectados do DOM ao desmontar (garantindo ausência de erros).

---

## Execuções Propostas

### 1. Correção Cirúrgica em `src/components/MaxDrawer.vue`

No arquivo `src/components/MaxDrawer.vue`, atualizar o hook `onBeforeUnmount` localizado nas linhas 210-216:

```typescript
// ANTES (src/components/MaxDrawer.vue:210-216):
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
- Se o drawer foi fechado normalmente via `props.visible = false` antes de ser desmontado, o watcher já executou `trap.deactivate()`, tornando `previous = null`.
- Quando `onBeforeUnmount` executar `trap.deactivate()`, `previous` já será `null`, executando um no-op seguro e sem qualquer efeito colateral.
- Se o drawer for desmontado enquanto visível (`props.visible = true`), `previous` conterá o elemento anterior conectado, que receberá o foco de volta via `previous.focus()`, e a referência será liberada com `previous = null`.

---

## Especificação de Teste TDD (Red-Green)

### 1. Teste de Reprodução da Falha (Fase Vermelha / Red)
Criar casos de teste no bloco `describe('MaxDrawer')` em `tests/components/MaxDrawer.test.ts`:

```typescript
it('restaura o foco ao elemento anterior ao desmontar o drawer enquanto visivel', async () => {
    // 1. Cria e foca no botao acionador
    const botaoOrigem = document.createElement('button');
    botaoOrigem.id = 'trigger-abrir';
    document.body.appendChild(botaoOrigem);
    botaoOrigem.focus();
    expect(document.activeElement).toBe(botaoOrigem);

    // 2. Monta o MaxDrawer com visible: true
    const wrapper = mount(MaxDrawer, {
        props: { visible: true },
        slots: { default: '<button id="btn-interno">Acao Interna</button>' },
        attachTo: document.body
    });

    // 3. Aguarda o focus trap mover o foco para o primeiro elemento focavel do painel
    await nextTick();
    expect(document.activeElement?.id).toBe('btn-interno');

    // 4. Desmonta o drawer sem alterar props.visible previamente (simulando destruicao de rota ou v-if)
    wrapper.unmount();
    await nextTick();

    // 5. RED: Sem a chamada a trap.deactivate() em onBeforeUnmount, document.activeElement NÃO retorna ao botaoOrigem
    // GREEN: Com trap.deactivate(), o foco é restaurado com sucesso para botaoOrigem
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

---

## Banco de Dados

**Nenhuma** migration ou alteração em banco de dados necessária (trata-se exclusivamente de correção de ciclo de vida e acessibilidade em componente front-end Vue 3 / TypeScript).

---

## Riscos de quebra e Não-Regressão

| Área de Risco | Avaliação | Medida Mitigatória |
| :--- | :--- | :--- |
| **Quebra de Contrato de Props/Emits** | Nulo | A assinatura de props, eventos e métodos expostos (`open`, `close`, `toggle`, `is_show`) permanece intacta. |
| **Dupla Desativação (Fechamento Normal + Unmount)** | Nulo | A função `deactivate()` de `useFocusTrap` é puramente idempotente (`previous = null` na primeira execução; execuções subsequentes operam sobre `null` e não realizam ações). |
| **Elemento Anterior Desconectado** | Nulo | `useFocusTrap` já possui a guarda defensiva `if (previous?.isConnected) previous.focus()`, prevenindo exceções caso o trigger original tenha sido removido do DOM durante a vida do drawer. |
| **Regressão de Testes Existentes** | Nulo | Os 21 testes unitários existentes em `tests/components/MaxDrawer.test.ts` validam posicionamento, classes, escopo de eventos e scroll lock, sem depender de ausência de restauração no unmount. |

---

## Validação

### Testes e Verificações Automatizadas:
1. **Execução dos Testes Unitários:**
   ```bash
   npm test -- tests/components/MaxDrawer.test.ts
   ```
   Valida que todos os testes da suíte do `MaxDrawer`, incluindo os novos testes de restauração de foco no unmount, passam com 100% de sucesso.

2. **Checagem de Tipagem Estrita TypeScript:**
   ```bash
   npm run type-check
   ```
   Garante conformidade com `vue-tsc --noEmit` sem regressões ou erros de tipos.

3. **Validação de Linting e Estilo:**
   ```bash
   npm run lint
   ```
   Garante conformidade com as regras do ESLint e Stylelint estabelecidas no projeto.

---

## Skills Aplicáveis

- `systematic-debugging-best-practices` (Análise sistemática de causa raiz, isolamento e reprodução de falhas de foco e ciclo de vida)
- `vue-debugging-best-practices` (Diagnóstico de ciclo de vida Vue 3, watchers imediatos e hooks `onBeforeUnmount`)
- `vue-max-stack-frontend-best-practices` (Padrões de SFC com `<script setup lang="ts">`, helpers e convenções de componentes de overlay)
- `test-driven-development` (Ciclo Red-Green para validação de restauração de foco em cenários de desmontagem)
- `vitest-skill` (Construção de testes unitários com Vitest e `@vue/test-utils`)
- `code-review-and-quality` (Auditoria de qualidade, memory leaks e não-regressão)
