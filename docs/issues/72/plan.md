# Plano de Implementação — Issue #72

## Descrição e Causa Raiz

### Problema
No componente `MaxLikeButton.vue`, o clique do usuário dispara uma animação visual no container do ícone (`.max-like-icon-container.animating`), ativando a classe CSS que executa o keyframe `max-like-pop 0.35s ease-in-out`. Para desativar a classe após o término da animação, a aplicação agenda o reset do ref reativo `isAnimating.value = false` via chamada direta a `setTimeout(..., 350)`.
Essa chamada ocorre em dois fluxos distintos dentro do método `handleClick`:
1. Na linha 251: no fluxo com repetição habilitada (`isRepeatEnabled.value === true`);
2. Na linha 277: no fluxo padrão de toggle quando o item é curtido (`nextLiked === true`).

Em ambas as ocorrências, o identificador de timer retornado por `setTimeout` é descartado sem ser salvo em nenhuma variável ou referência de controle (`animationTimer`). Adicionalmente, o componente não importa nem registra o hook de ciclo de vida `onBeforeUnmount` (ou `onUnmounted`) para realizar o cancelamento de timers ativos via `clearTimeout`.

### Agravantes e Impacto
1. **Vazamento de Memória (Memory Leak):** Caso o componente seja desmontado durante a janela de 350ms após o clique (cenário comum em transições rápidas de rota pelo Vue Router, fechamento de modais com `MaxModal`, fechamento de gavetas com `MaxDrawer` ou re-renderização condicional de listas virtuais), o callback assíncrono permanece registrado na fila de macrotasks da engine JavaScript.
2. **Retenção Indevida de Escopo Reativo:** A closure da função de callback anônima `() => { isAnimating.value = false; }` mantém uma referência viva ao ref `isAnimating`, retendo a instância inteira do componente Vue, seu `EffectScope` e event listeners associados, impedindo sua coleta pelo Garbage Collector (GC).
3. **Mutação Órfã de Estado Reativo:** Ao disparar após o desmonte, o callback tenta mutar a reatividade de um componente inativo, violando as práticas de ciclo de vida de componentes Vue 3.
4. **Acúmulo de Timers em Cliques Consecutivos:** A ausência de um handle e de uma função centralizada de disparo de animação faz com que cliques subsequentes antes de 350ms criem múltiplos timers concorrentes, gerando condições de corrida onde um timer anterior pode resetar prematuramente `isAnimating.value = false` durante a execução de uma animação mais recente.

### Causa Raiz Comprovada
- **Localização Exata:**
  - `src/components/MaxLikeButton.vue:34` — Ausência de importação de `onBeforeUnmount` da biblioteca `'vue'`;
  - `src/components/MaxLikeButton.vue:72` — Ref `isAnimating` declarado sem qualquer variável de controle para o identificador do timer;
  - `src/components/MaxLikeButton.vue:250-253` — Disparo de `setTimeout` órfão no fluxo repeat;
  - `src/components/MaxLikeButton.vue:275-280` — Disparo de `setTimeout` órfão no fluxo toggle;
  - `src/components/MaxLikeButton.vue:285-286` — Ausência de hook de ciclo de vida de desmontagem antes do fechamento de `<script setup>`.

- **Trechos do Código com Problema:**
```typescript
// src/components/MaxLikeButton.vue:34
import { ref, computed, watch } from 'vue';

// src/components/MaxLikeButton.vue:72
const isAnimating = ref(false);

// src/components/MaxLikeButton.vue:250-253 (fluxo com repeat)
isAnimating.value = true;
setTimeout(() => {
    isAnimating.value = false;
}, 350);

// src/components/MaxLikeButton.vue:275-280 (fluxo toggle)
if (nextLiked) {
    isAnimating.value = true;
    setTimeout(() => {
        isAnimating.value = false;
    }, 350);
}
```

- **Fluxo Causal e Rastreamento Reverso de Dados:**
  `UI (DOM Event @click="handleClick")` ➔ `handleClick(event)` ➔ `isAnimating.value = true` ➔ Adiciona classe CSS `.animating` ao DOM ➔ Agenda callback anônimo via `setTimeout(..., 350)` sem salvar o handle retornado ➔ **Acontece o evento de desmontagem (Ex: troca de rota/fechamento de modal)** ➔ `Vue Lifecycle (unmount)` ➔ `onBeforeUnmount` ausente (nenhuma limpeza executada) ➔ **Event Loop (350ms decorridos)** ➔ Callback da macrotask executa em componente órfão ➔ Muta `isAnimating.value` ➔ Instância mantida em memória pelo closure do timer até sua expiração (Memory Leak comprovado).

---

## Arquivos Afetados

1. `src/components/MaxLikeButton.vue` — Importação de `onBeforeUnmount`, declaração de constante `ANIMATION_DURATION_MS = 350`, handle `animationTimer`, helpers `clearAnimationTimer` e `triggerAnimation`, substituição dos timers órfãos e registro de `onBeforeUnmount(clearAnimationTimer)`.
2. `tests/components/MaxLikeButton.test.ts` — Adição de suíte de testes com fake timers (`vi.useFakeTimers()`) para comprovar o cancelamento via `clearTimeout` na desmontagem em ambos os modos (toggle e repeat) e a limpeza de timers concorrentes.

---

## Execuções Propostas

### 1. Refatoração Cirúrgica em `src/components/MaxLikeButton.vue`

1. **Importação do Ciclo de Vida:**
   Em `src/components/MaxLikeButton.vue:34`, atualizar a importação de `'vue'` para incluir `onBeforeUnmount`:
   ```typescript
   import { ref, computed, watch, onBeforeUnmount } from 'vue';
   ```

2. **Declaração da Constante e Variável de Controle:**
   Próximo à linha 72, onde `isAnimating` é declarado:
   ```typescript
   const ANIMATION_DURATION_MS = 350;
   let animationTimer: ReturnType<typeof setTimeout> | null = null;
   ```

3. **Criação das Funções de Controle de Timer e Animação:**
   Implementar funções especializadas para limpeza e disparo seguro:
   ```typescript
   const clearAnimationTimer = (): void => {
       if (animationTimer !== null) {
           clearTimeout(animationTimer);
           animationTimer = null;
       }
   };

   const triggerAnimation = (): void => {
       clearAnimationTimer();
       isAnimating.value = true;
       animationTimer = setTimeout(() => {
           isAnimating.value = false;
           animationTimer = null;
       }, ANIMATION_DURATION_MS);
   };
   ```

4. **Registro do Hook de Desmontagem:**
   Registrar a limpeza automática antes do componente ser destruído:
   ```typescript
   onBeforeUnmount(clearAnimationTimer);
   ```

5. **Substituição dos `setTimeout` Órfãos em `handleClick`:**
   - No bloco `isRepeatEnabled.value` (L250-253), substituir:
     ```typescript
     // Antes:
     isAnimating.value = true;
     setTimeout(() => {
         isAnimating.value = false;
     }, 350);

     // Depois:
     triggerAnimation();
     ```
   - No bloco do modo padrão toggle (L275-280), substituir:
     ```typescript
     // Antes:
     if (nextLiked) {
         isAnimating.value = true;
         setTimeout(() => {
             isAnimating.value = false;
         }, 350);
     }

     // Depois:
     if (nextLiked) {
         triggerAnimation();
     }
     ```

### 2. Implementação de Testes Automatizados em `tests/components/MaxLikeButton.test.ts`

Criar um bloco `describe('cancelamento de animação e ciclo de vida (unmount)', () => { ... })` com os seguintes casos de teste:
1. **Cancelamento no unmount (Modo Toggle):**
   - Dispara clique que ativa a animação e agenda o timer de 350ms;
   - Verifica que `.max-like-icon-container` possui a classe `animating`;
   - Espiona `globalThis.clearTimeout`;
   - Desmonta o componente (`wrapper.unmount()`);
   - Assevera que `clearTimeout` foi chamado;
   - Avança os timers (`vi.advanceTimersByTime(350)`) garantindo que não ocorrem erros ou mutações pós-desmonte.
2. **Cancelamento no unmount (Modo Repeat):**
   - Monta componente com `repeat: true`;
   - Dispara clique para curtir;
   - Desmonta o componente antes de 350ms;
   - Assevera que `clearTimeout` foi chamado.
3. **Cancelamento de animação anterior em múltiplos cliques rápidos:**
   - Dispara clique inicial;
   - Antes de 350ms (ex: 150ms depois), dispara um segundo clique;
   - Assevera que `clearTimeout` foi chamado para descartar o timer da animação anterior antes de iniciar o novo.

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Comprovação da Falha / Falso Positivo)
- **Cenário Red:**
  Executando o teste abaixo contra o código atual sem a correção:
  ```typescript
  it('cancela o timer de animação ao desmontar o componente antes de 350ms', async () => {
      vi.useFakeTimers();
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      const wrapper = mountLikeButton();

      await wrapper.trigger('click');
      expect(wrapper.find('.max-like-icon-container').classes()).toContain('animating');

      wrapper.unmount();
      expect(clearTimeoutSpy).toHaveBeenCalled();

      vi.useRealTimers();
      clearTimeoutSpy.mockRestore();
  });
  ```
- **Resultado Red:**
  O teste falha com `AssertionError: expected "clearTimeout" to have been called at least once, but got 0 times`, comprovando de forma conclusiva a existência da falha e a ausência do cancelamento no desmonte.

### 2. Etapa Green (Validação Pós-Correção)
- Ao introduzir `animationTimer`, `clearAnimationTimer`, `triggerAnimation` e `onBeforeUnmount(clearAnimationTimer)`:
  - O spy `clearTimeoutSpy` confirma que `clearTimeout` é chamado no exato instante de `wrapper.unmount()`;
  - Todos os 30 testes pré-existentes de `MaxLikeButton.test.ts` e os novos testes de ciclo de vida passam com 100% de sucesso (GREEN).

---

## Banco de Dados

- **Nenhuma** migration necessária (alteração restrita a componente de interface frontend e sua suíte de testes unitários).

---

## Riscos de Quebra e Não-Regressão

- **Contrato de Props e Eventos:** Nenhuma prop ou emit sofre alteração de tipo, assinatura ou comportamento público (`modelValue`, `liked`, `click`, etc.).
- **Comportamento Visual e CSS:** A duração da animação (`350ms`), a classe `.animating` e o keyframe CSS `max-like-pop` continuam estritamente idênticos.
- **Prevenção de Condições de Corrida:** A chamada a `clearAnimationTimer()` dentro de `triggerAnimation()` agrega benefício adicional de robustez, prevenindo sobreposição de timeouts em cliques rápidos sucessivos.
- **Compatibilidade com SSR / Browser:** `clearAnimationTimer()` checa se `animationTimer !== null` antes de chamar `clearTimeout`, sendo seguro em qualquer ambiente de renderização.
- **Garantia de Não-Regressão:**
  - Execução de todos os testes de `MaxLikeButton.test.ts`;
  - Execução de toda a suíte de testes do projeto (`npm test`);
  - Verificação de tipagem estática com `npm run type-check`;
  - Verificação de estilo e linting com `npm run lint`.

---

## Validação

1. **Execução dos testes unitários de `MaxLikeButton`:**
   ```bash
   npx vitest run tests/components/MaxLikeButton.test.ts
   ```
2. **Execução de toda a suíte de testes:**
   ```bash
   npm test
   ```
3. **Checagem estática de tipos TypeScript:**
   ```bash
   npm run type-check
   ```
4. **Validação de Lint e Padrões de Código:**
   ```bash
   npm run lint
   ```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices`
- `planning-with-files`
- `vue-debugging-best-practices`
- `vue-vitest-testing-best-practices`
- `vue-max-stack-frontend-best-practices`
- `tdd`
- `code-review`
- `production-code-audit`
