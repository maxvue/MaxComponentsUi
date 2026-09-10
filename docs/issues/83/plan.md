# Plano de Implementação — Issue #83

## Descrição e Causa Raiz

### Problema
No componente [`src/components/MaxInputCodeToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-83/src/components/MaxInputCodeToolbar.vue), a ação do botão de cópia de código dispara a função `handleCopy()` ([linhas 231-238](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-83/src/components/MaxInputCodeToolbar.vue#L231-L238)):
- Ao ser acionada, ela emite o evento `'copy'`, altera o estado reativo local `isCopied.value = true` (que comuta temporariamente o ícone para `lets-icons:check-fill` e o título do botão para `"Copiado!"`) e agenda um temporizador via `setTimeout` de 1800ms (1,8 segundos) para restaurar `isCopied.value = false`.
- O identificador numérico/objeto do timer é armazenado na variável de escopo local `let copyTimeout: ReturnType<typeof setTimeout> | null = null;` ([linha 219](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-83/src/components/MaxInputCodeToolbar.vue#L219)).
- O componente importa apenas `{ computed, ref }` de `'vue'` ([linha 157](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-83/src/components/MaxInputCodeToolbar.vue#L157)), **não importando nem registrando nenhum hook de ciclo de vida de desmonte** (`onBeforeUnmount` ou `onUnmounted`).

### Agravantes
1. **Memory Leak (Vazamento de Memória) em SPAs:** Em aplicações consumidoras (como o ecossistema Engeapp/MaxVue), editores de código e toolbars são frequentemente renderizados em componentes efêmeros: modais flutuantes (`MaxModal`), gavetas laterais (`MaxDrawer`), abas alternáveis (`MaxTabList`) ou views roteadas via `vue-router`. Se o usuário clica no botão de cópia e fecha o modal ou navega para outra tela antes de 1,8 segundos:
   - A closure anônima do callback passado ao `setTimeout` retém em sua cadeia de escopo a referência para o ref reativo `isCopied`, a variável `copyTimeout` e o escopo do componente Vue.
   - O garbage collector (GC) do motor JavaScript (V8/JavaScriptCore) fica impedido de desalocar a instância do componente, seus nós DOM virtuais e referências associadas até o término do temporizador.
2. **Mutação Reativa Fantasma sobre Instância Destruída:** Ao término dos 1800ms, o timer agendado no event loop é executado no vácuo, realizando a mutação `isCopied.value = false;` em uma referência órfã de um componente que não está mais montado no DOM.
3. **Instabilidade em Testes Automatizados:** Timers pendentes no event loop que não são limpos ao desmontar wrappers de teste podem ocasionar avisos de vazamentos de recursos assíncronos em runners modernos (como Vitest com detecção de vazamentos ativada) ou efeitos colaterais caso fake timers sejam restaurados tardiamente.

### Causa Raiz Comprovada
- **Localização Exata:**
  - Importação de Vue sem hook de ciclo de vida: [`src/components/MaxInputCodeToolbar.vue:157`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-83/src/components/MaxInputCodeToolbar.vue#L157)
    ```typescript
    import { computed, ref } from 'vue';
    ```
  - Declaração do ponteiro do timer sem limpeza associada: [`src/components/MaxInputCodeToolbar.vue:219`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-83/src/components/MaxInputCodeToolbar.vue#L219)
    ```typescript
    let copyTimeout: ReturnType<typeof setTimeout> | null = null;
    ```
  - Agendamento de timer de 1800ms sem cancelamento no ciclo de desmonte do Vue: [`src/components/MaxInputCodeToolbar.vue:231-238`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-83/src/components/MaxInputCodeToolbar.vue#L231-L238)
    ```typescript
    const handleCopy = () => {
        emit('copy');
        isCopied.value = true;
        if (copyTimeout) clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => {
            isCopied.value = false;
        }, 1800);
    };
    ```
- **Fluxo Causal e Rastreamento Reverso de Dados:**
  - **UI / Interação do Usuário:** O usuário clica no botão de cópia `<button class="max-input-code-toolbar__btn" :title="isCopied ? 'Copiado!' : 'Copiar Código'" @click="handleCopy">` (`L98-111`).
  - **Handler do Componente:** `handleCopy()` executa `emit('copy')`, ativa o feedback visual `isCopied.value = true` e registra no event loop do navegador uma chamada a `setTimeout(..., 1800)`, salvando o identificador em `copyTimeout`.
  - **Transição de Tela / Fechamento de Janela na Aplicação:** O componente pai (seja `MaxInputCode` ou uma view consumidora) é destruído pelo Vue devido a navegação, fechamento de modal ou condição `v-if`.
  - **Ciclo de Desmonte do SFC:** O runtime do Vue dispara os hooks de ciclo de vida de desmonte dos componentes filhos.
  - **Falha de Limpeza:** Devido à ausência de `onBeforeUnmount` em `MaxInputCodeToolbar.vue`, nenhum `clearTimeout(copyTimeout)` é invocado.
  - **Event Loop & Retenção de Memória:** O timer permanece na fila do navegador com a closure ativa, mantendo o grafo reativo retido na memória por até 1,8 segundos e disparando a mutação `isCopied.value = false` após o componente já ter sido destruído.

---

## Arquivos Afetados

1. [`src/components/MaxInputCodeToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-83/src/components/MaxInputCodeToolbar.vue):
   - Importação de `onBeforeUnmount` a partir do pacote `'vue'`.
   - Implementação do hook `onBeforeUnmount` para invocar `clearTimeout(copyTimeout)` e resetar `copyTimeout = null`.
2. [`tests/components/MaxInputCodeToolbar.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-83/tests/components/MaxInputCodeToolbar.test.ts) (novo arquivo):
   - Criação da suíte de testes unitários dedicada para `MaxInputCodeToolbar` (seguindo o padrão já estabelecido pelo componente irmão `MaxInputMarkdownToolbar` em `tests/components/MaxInputMarkdownToolbar.test.ts`).
   - Testes unitários para:
     - Cancelamento de `copyTimeout` no desmonte (`wrapper.unmount()`) com espionagem via `vi.spyOn(window, 'clearTimeout')`.
     - Preservação do ciclo de feedback visual (ativação imediata de `isCopied` e desativação após 1800ms se permanecer montado).
     - Reset de temporizador em cliques sucessivos rápidos antes dos 1800ms.
     - Emissão correta de todos os eventos da toolbar (`format`, `toggle-comment`, `indent`, `outdent`, `undo`, `redo`, `toggle-wrap`, `toggle-minimap`, `toggle-fullscreen`, `update:language`, `copy`).

---

## Execuções Propostas

A correção é cirúrgica e preserva integralmente a API pública, os estilos SCSS e a experiência do usuário.

### Passo 1: Atualização dos imports em `src/components/MaxInputCodeToolbar.vue`
Substituir a linha 157:
```typescript
import { computed, ref } from 'vue';
```
Por:
```typescript
import { computed, onBeforeUnmount, ref } from 'vue';
```

### Passo 2: Registro do hook de ciclo de vida `onBeforeUnmount`
Adicionar imediatamente após a definição da função `handleCopy`:
```typescript
    onBeforeUnmount(() => {
        if (copyTimeout) {
            clearTimeout(copyTimeout);
            copyTimeout = null;
        }
    });
```

### Passo 3: Criação da suíte de testes dedicada `tests/components/MaxInputCodeToolbar.test.ts`
Criar a suíte cobrindo todas as ações da toolbar e especificamente o teste TDD de cancelamento do timer no desmonte, isolando o componente de dependências externas não relacionadas (como Monaco Editor).

---

## Especificação de Teste TDD (Red-Green)

### Cenário de Teste: Cancelamento do timer no desmonte (Memory Leak Prevention)

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputCodeToolbar from '../../src/components/MaxInputCodeToolbar.vue';

describe('MaxInputCodeToolbar - Gerenciamento de Ciclo de Vida e Timers', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('cancela o timer copyTimeout ao desmontar o componente antes de 1800ms', async () => {
        const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

        const wrapper = mount(MaxInputCodeToolbar, {
            props: {
                language: 'typescript'
            },
            global: {
                stubs: {
                    MaxIcon: true
                }
            }
        });

        const copyButton = wrapper.find('button[title="Copiar Código"]');
        expect(copyButton.exists()).toBe(true);

        // 1. Clica no botão de cópia agendando o timer de 1800ms
        await copyButton.trigger('click');
        expect(wrapper.emitted('copy')).toBeTruthy();

        const callsBeforeUnmount = clearTimeoutSpy.mock.calls.length;

        // 2. Desmonta o componente enquanto o timer ainda está ativo (< 1800ms)
        wrapper.unmount();

        // 3. Asserção do Red/Green: clearTimeout deve ter sido invocado para limpar o timer
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(callsBeforeUnmount + 1);

        // 4. Avança o tempo além de 1800ms para garantir que nenhuma mutação tardia dispare
        vi.advanceTimersByTime(2000);
    });

    it('reseta e agenda novo timer ao clicar em cópia repetidamente antes de 1800ms', async () => {
        const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

        const wrapper = mount(MaxInputCodeToolbar, {
            props: {
                language: 'typescript'
            },
            global: {
                stubs: {
                    MaxIcon: true
                }
            }
        });

        const copyButton = wrapper.find('button[title="Copiar Código"]');

        // Primeiro clique
        await copyButton.trigger('click');
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(0);

        // Segundo clique aos 500ms
        vi.advanceTimersByTime(500);
        await copyButton.trigger('click');
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

        wrapper.unmount();
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
    });
});
```

- **Fase Red:** Sem a adição do `onBeforeUnmount`, ao executar `wrapper.unmount()`, `clearTimeoutSpy` não é chamado no desmonte (`callsBeforeUnmount + 1` falha, recebendo `callsBeforeUnmount`).
- **Fase Green:** Com a inclusão do `onBeforeUnmount` limpando `copyTimeout`, `clearTimeout` é acionado durante o desmonte, fazendo o teste passar com 100% de conformidade.

---

## Banco de dados

Nenhuma migration necessária (componente exclusivamente front-end / UI).

---

## Riscos de quebra e Não-Regressão

### Análise de Riscos
- **Quebra de Contrato de Props/Emits:** Risco ZERO. Nenhuma interface de prop ou evento emitido sofre qualquer alteração.
- **Alteração Visual ou de Estilos:** Risco ZERO. O template HTML, os seletores e o bloco `<style lang="scss" scoped>` permanecem idênticos.
- **Comportamento para o Usuário Final:** O feedback visual ("Copiado!" por 1,8 segundos) permanece inalterado para navegação e uso normal do componente na tela.
- **Regressão em Cliques Rápidos:** O comportamento de reset ao clicar novamente antes de 1800ms (`if (copyTimeout) clearTimeout(copyTimeout);`) continua ativo e garantido.

### Testes de Não-Regressão
1. Validar que o feedback visual comuta para "Copiado!" e retorna ao estado inicial após 1800ms quando o componente permanece montado.
2. Validar que a emissão de todos os 11 eventos da toolbar (`update:language`, `format`, `toggle-comment`, `indent`, `outdent`, `undo`, `redo`, `copy`, `toggle-wrap`, `toggle-minimap`, `toggle-fullscreen`) continua funcionando normalmente.
3. Executar a suíte de testes unitários completa via `npm run test`.
4. Executar checagem de tipagem estrita com `npm run type-check`.
5. Executar lint com `npm run lint` para garantir conformidade com as regras de estilo `@stylistic` e `eslint.config.js`.

---

## Validação

A implementação será conclusivamente comprovada através da execução bem-sucedida dos seguintes comandos:

```bash
# 1. Execução do teste unitário focado e comprovação do comportamento Red -> Green
npx vitest run tests/components/MaxInputCodeToolbar.test.ts

# 2. Verificação de tipos TypeScript sem emissão de erros
npm run type-check

# 3. Verificação de lint e formatação (ESLint + Stylelint)
npm run lint
```

---

## Skills Aplicáveis

As seguintes skills curadas do projeto devem orientar o desenvolvedor durante a execução:
- `vue-debugging-best-practices` — Diagnóstico e resolução de ciclo de vida de componentes Vue 3 e prevenção de vazamentos de memória.
- `vue-components` — Padrões arquiteturais de SFCs Vue 3 com Composition API, `<script setup lang="ts">` e manipulação de estado local.
- `test-driven-development` — Disciplina do ciclo Red-Green-Refactor para verificação prévia da falha e validação da correção cirúrgica.
- `vitest-skill` — Padrões para testes unitários em Vitest utilizando `vi.useFakeTimers()`, `vi.spyOn` e manipulação de wrappers do Vue Test Utils.
- `code-review-and-quality` — Revisão de código multi-eixo e auditoria de qualidade antes do fechamento da issue.
- `superpowers` — Rigor metodológico em execução, verificação e integridade do repositório.
