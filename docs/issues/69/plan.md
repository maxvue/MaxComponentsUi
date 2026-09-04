# Plano de Implementação — Issue #69

## Descrição e Causa Raiz

### Problema
Durante a auditoria de ciclo de vida e gerenciamento de memória no componente `src/components/MaxImage.vue`, foram identificados dois problemas críticos relacionados ao registro e limpeza de ouvintes de eventos no objeto global `window`:

1. **Vazamento de Memória por Listeners de Ponteiro sem Limpeza no Desmonte / Cancelamento:**
   Durante a operação de recorte (crop), ao iniciar o arraste da caixa de recorte (`onCropBoxPointerDown`) ou o redimensionamento por alças de canto (`onHandlePointerDown`), ouvintes globais para `pointermove`, `pointerup` e `pointercancel` são anexados a `window`. Se o componente for desmontado antes de um evento de término de arraste (`pointerup`/`pointercancel`) — por exemplo, através de desmontagem por fechamento externo, navegação por rota SPA ou destruição condicional de template (`v-if`) — ou se o recorte/preview for cancelado/fechado durante o arraste, os ouvintes de ponteiro não são removidos no hook `onBeforeUnmount` nem nas rotinas de cancelamento (`cancelCrop`/`closePreview`), mantendo referências ativas a handlers do componente no objeto global `window`.

2. **Registro Incondicional e Prematuro do Listener Global `keydown`:**
   No hook `onMounted`, o listener `window.addEventListener('keydown', onKeydown)` é registrado incondicionalmente em todas as instâncias de `MaxImage`, independentemente de a imagem estar com o modal de visualização aberto (`isOpen = true`) ou fechado (`isOpen = false`). Em telas que exibem dezenas ou centenas de imagens (galerias, listagens, feeds ou tabelas de dados com miniaturas), dezenas/centenas de listeners `keydown` permanecem permanentemente ativos no `window`, interceptando e processando desnecessariamente todos os eventos de teclado da aplicação.

### Causa Raiz Comprovada
- **Localização dos Listeners de Ponteiro:**
  - `src/components/MaxImage.vue:350-361` (`onCropBoxPointerDown`)
  - `src/components/MaxImage.vue:389-398` (`onHandlePointerDown`)
  - Ausência de limpeza no `onBeforeUnmount` (`src/components/MaxImage.vue:516-519`) e em `cancelCrop()` (`src/components/MaxImage.vue:313-316`).

- **Localização do Listener `keydown`:**
  - `src/components/MaxImage.vue:508-519`:
  ```typescript
  const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen.value) closePreview();
  };

  onMounted(() => {
      window.addEventListener('keydown', onKeydown);
  });

  onBeforeUnmount(() => {
      window.removeEventListener('keydown', onKeydown);
      if (isOpen.value) scrollLock.unlock();
  });
  ```

- **Fluxo Causal:**
  1. *Listeners de Ponteiro:* `Usuário inicia arraste (crop box ou handle)` ➔ `pointerdown` registra `pointermove`, `pointerup`, `pointercancel` em `window` ➔ `Componente desmontado antes do pointerup` ➔ `onBeforeUnmount` não remove os listeners de ponteiro ➔ Handlers e closures retêm o componente em memória (*Memory Leak*).
  2. *Listener Global Keydown:* `MaxImage é montado com isOpen=false` ➔ `onMounted` executa `window.addEventListener('keydown', onKeydown)` ➔ N instâncias de `MaxImage` criam N ouvintes globais em `window` sem nenhuma visualização ativa ➔ Overhead no event dispatching da janela global do navegador.

---

## Arquivos Afetados

1. `src/components/MaxImage.vue` — Centralização do cleanup de listeners de ponteiro no cancelamento e desmonte (`onBeforeUnmount`), e migração do listener `keydown` para ativação sob demanda apenas quando `isOpen === true` (via `watch(isOpen)` e rotinas de ciclo de vida).
2. `tests/components/MaxImage.test.ts` — Adição de casos de teste automatizados para validar que:
   - Nenhum listener `keydown` é anexado ao montar o componente com `isOpen = false`.
   - O listener `keydown` é adicionado ao abrir o preview (`openPreview`) e removido ao fechar (`closePreview`).
   - Todos os listeners de ponteiro (`pointermove`, `pointerup`, `pointercancel`) são removidos ao desmontar o componente durante o arraste da crop box ou de alças de redimensionamento.
   - Os listeners de ponteiro são devidamente limpos ao cancelar o recorte ou fechar o preview durante o arraste.

---

## Execuções Propostas

### 1. Refatoração em `src/components/MaxImage.vue`

1. **Criação de função auxiliar de limpeza de listeners de ponteiro:**
   ```typescript
   const cleanupPointerListeners = () => {
       isDraggingBox = false;
       activeHandle = null;
       window.removeEventListener('pointermove', onCropBoxPointerMove);
       window.removeEventListener('pointerup', onCropBoxPointerUp);
       window.removeEventListener('pointercancel', onCropBoxPointerUp);
       window.removeEventListener('pointermove', onHandlePointerMove);
       window.removeEventListener('pointerup', onHandlePointerUp);
       window.removeEventListener('pointercancel', onHandlePointerUp);
   };
   ```

2. **Atualização de métodos de ciclo de vida e ações de recorte:**
   - Invocar `cleanupPointerListeners()` em:
     - `cancelCrop()`: garante que se o cancelamento ocorrer durante um arraste ativo, os listeners em `window` sejam desanexados.
     - `closePreview()`: garante limpeza integral de arraste ao fechar o modal.
     - `onBeforeUnmount()`: garante que se o componente for destruído pelo Vue enquanto um arraste estiver em andamento, os listeners de ponteiro não vazem no `window`.
   - Manter as chamadas de remoção nos métodos convencionais `onCropBoxPointerUp` e `onHandlePointerUp`.

3. **Gerenciamento dinâmico do listener `keydown` via reatividade de `isOpen`:**
   - Remover o registro incondicional em `onMounted(() => { window.addEventListener('keydown', onKeydown); })`.
   - Adicionar listener de teclado quando `isOpen.value === true` e remover quando `isOpen.value === false`. Pode ser gerenciado via `watch(isOpen, (open) => { ... })` ou diretamente nos métodos `openPreview()` / `closePreview()`:
     ```typescript
     watch(isOpen, (value) => {
         if (value) {
             window.addEventListener('keydown', onKeydown);
         } else {
             window.removeEventListener('keydown', onKeydown);
         }
     });
     ```
   - No hook `onBeforeUnmount()`:
     ```typescript
     onBeforeUnmount(() => {
         cleanupPointerListeners();
         if (isOpen.value) {
             window.removeEventListener('keydown', onKeydown);
             scrollLock.unlock();
         }
     });
     ```

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Falha Prévia)
Adicionar os seguintes testes em `tests/components/MaxImage.test.ts`:

```typescript
it('não registra listener keydown no window ao montar com isOpen=false', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const wrapper = mountImage();

    const keydownCalls = addEventListenerSpy.mock.calls.filter(([event]) => event === 'keydown');
    expect(keydownCalls.length).toBe(0);

    addEventListenerSpy.mockRestore();
});

it('registra listener keydown no window ao abrir preview e remove ao fechar', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const wrapper = mountImage({ preview: true });
    await wrapper.find('.max-image__preview-trigger').trigger('click');

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    await wrapper.find('.max-image-modal').trigger('click');
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
});

it('remove listeners de ponteiro no window ao desmontar componente durante arraste de crop', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const wrapper = mountImage({ preview: true, allowEdit: true });
    await wrapper.find('.max-image__preview-trigger').trigger('click');

    const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
        .find((btn) => btn.attributes('title') === 'Recortar imagem');
    await editBtn!.trigger('click');

    // Simula carregamento da imagem de crop
    const cropImg = wrapper.find('.max-image-crop-stage__img');
    Object.defineProperty(cropImg.element, 'clientWidth', { value: 300, configurable: true });
    Object.defineProperty(cropImg.element, 'clientHeight', { value: 200, configurable: true });
    await cropImg.trigger('load');

    // Inicia arraste da crop box
    const cropBoxEl = wrapper.find('.max-image-crop-box');
    expect(cropBoxEl.exists()).toBe(true);
    await cropBoxEl.trigger('pointerdown', { clientX: 100, clientY: 100 });

    removeEventListenerSpy.mockClear();

    // Desmonta o componente durante o arraste
    wrapper.unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointercancel', expect.any(Function));

    removeEventListenerSpy.mockRestore();
});
```

*Execução Red:*
- No código anterior, `mountImage()` registra imediatamente `keydown` no `onMounted`, fazendo o primeiro teste falhar com `expected 1 to be 0`.
- Desmontar durante o arraste não invoca `removeEventListener` para `pointermove`/`pointerup`/`pointercancel`, fazendo o terceiro teste falhar.

### 2. Etapa Green (Sucesso Pós-Correção)
Após aplicar a limpeza sob demanda e a centralização em `cleanupPointerListeners()`:
*Execução Green:* Todos os testes novos e os 12 testes unitários existentes passam com sucesso.

---

## Banco de Dados

- **Nenhuma** migration necessária (alteração restrita a componentes front-end Vue 3 / TypeScript).

---

## Riscos de Quebra e Não-Regressão

- **Contrato de Componente:** Props (`src`, `preview`, `allowEdit`, etc.), eventos emitidos (`show`, `hide`, `update:src`, `edit`, `crop`) e métodos expostos via `defineExpose` (`openPreview`, `closePreview`, `startCrop`, `confirmCrop`, `cancelCrop`) permanecem 100% idênticos e compatíveis.
- **Acessibilidade e Usabilidade:** A tecla `Escape` continua fechando a modal de visualização perfeitamente quando aberta, sem interferir no comportamento quando fechada.
- **Prevenção de Memory Leaks:** A destruição segura de instâncias remove 100% dos event listeners anexados a `window`.
- **Não-Regressão:** A suíte de testes de `MaxImage` e componentes dependentes continuará íntegra.

---

## Validação

- Execução dos testes automatizados de `MaxImage`:
  ```bash
  npx vitest run tests/components/MaxImage.test.ts
  ```
- Verificação estática de tipos TypeScript:
  ```bash
  npm run type-check
  ```
- Verificação de conformidade de lint e estilo:
  ```bash
  npm run lint
  ```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices`
- `planning-with-files`
- `vue-debugging-best-practices`
- `vue-vitest-testing-best-practices`
- `tdd`
- `code-review`
- `production-code-audit`
