# Plano de Implementação — Issue #66

## Descrição e Causa Raiz

### Problema
No componente `src/components/MaxPhoneField.vue`, ao abrir o dropdown seletor de DDI/países (`open()`), é registrado um ouvinte global para o evento `scroll` em fase de captura (`window.addEventListener('scroll', updatePosition, true)`), além do ouvinte para `resize` (`window.addEventListener('resize', updatePosition)`).

A função `updatePosition()` executa consultas diretas e síncronas de geometria do DOM:
- `select_el.value.getBoundingClientRect()`
- `overlay_el.value?.offsetHeight`

Como o evento `scroll` é disparado em alta frequência durante a rolagem (dezenas ou centenas de vezes por segundo, agravado pelo modo de captura que intercepta rolagens em qualquer elemento aninhado da página), a execução imediata e desregulada de `updatePosition()` força o navegador a realizar recálculos síncronos de estilo e layout (*Forced Synchronous Layout* / *Layout Thrashing*). Isso sobrecarrega a thread principal do navegador, causando perda de frames (*jank*) e lentidão perceptível na rolagem.

### Causa Raiz Comprovada
- **Localização:** `src/components/MaxPhoneField.vue:202-215` e `src/components/MaxPhoneField.vue:237-238` (com remoção em `src/components/MaxPhoneField.vue:245-246`).
```typescript
202:     function updatePosition() {
203:         const el = select_el.value;
204:         if (!el) return;
205: 
206:         const rect = el.getBoundingClientRect();
207:         const overlay_height = overlay_el.value?.offsetHeight ?? 300;
208:         const openUp = rect.bottom + overlay_height > window.innerHeight && rect.top > overlay_height;
209: 
210:         position.value = {
211:             top: openUp ? rect.top - overlay_height : rect.bottom,
212:             left: rect.left,
213:             width: Math.max(rect.width, 260)
214:         };
215:     }
...
237:         window.addEventListener('scroll', updatePosition, true);
238:         window.addEventListener('resize', updatePosition);
```

- **Fluxo Causal:**
  `Usuário clica no seletor DDI` ➔ `open()` ➔ `window.addEventListener('scroll', updatePosition, true)` ➔ `Disparos de scroll na janela/contêineres` ➔ `updatePosition()` é chamada síncronamente a cada evento ➔ `getBoundingClientRect()` / `offsetHeight` forçam recálculo de layout síncrono a cada microevento ➔ *Layout Thrashing* / *Main Thread Bottleneck*.

---

## Arquivos Afetados

1. `src/components/MaxPhoneField.vue` — Implementação de throttling via `requestAnimationFrame` (`rafId`), desacoplando os eventos de rolagem/redimensionamento dos cálculos síncronos de layout, e cancelamento do frame agendado no fechamento (`close()`) e desmontagem (`onBeforeUnmount`).
2. `tests/components/MaxPhoneField.test.ts` — Adição de casos de teste automatizados para validar que múltiplos disparos de `scroll` são agrupados via `requestAnimationFrame` e que o cancelamento de frames pendentes ocorre corretamente no fechamento e destruição do componente.

---

## Execuções Propostas

### 1. Refatoração em `src/components/MaxPhoneField.vue`
- Declarar o identificador de controle de frame no escopo do componente:
  ```typescript
  let rafId: number | null = null;
  ```
- Criar a função wrapper `onScrollOrResize` (ou `handleScrollOrResize`):
  ```typescript
  function onScrollOrResize() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
          updatePosition();
          rafId = null;
      });
  }
  ```
- No método `open()`:
  - Manter a chamada direta e síncrona `updatePosition()` após `await nextTick()` para posicionamento inicial imediato do overlay sem atraso perceptível.
  - Substituir `updatePosition` por `onScrollOrResize` no registro dos listeners:
    ```typescript
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    ```
- No método `close()`:
  - Cancelar qualquer frame de animação pendente e resetar `rafId`:
    ```typescript
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    ```
  - Remover os listeners utilizando a referência correta:
    ```typescript
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize);
    ```
- Manter o gancho `onBeforeUnmount(close)` existente, que garantirá a limpeza de listeners e cancelamento de qualquer frame pendente quando o componente for desmontado.

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Falha Prévia)
Adicionar os seguintes testes em `tests/components/MaxPhoneField.test.ts`:
```typescript
it('agrupa múltiplos eventos de scroll em um único requestAnimationFrame evitando layout thrashing', async () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    const wrapper = mountPhoneField();

    await wrapper.find('.max-phone-select').trigger('click');
    await wrapper.vm.$nextTick();

    rafSpy.mockClear();

    // Dispara múltiplos eventos de rolagem sucessivos
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));

    // Deve agendar apenas 1 frame de animação enquanto pendente
    expect(rafSpy).toHaveBeenCalledTimes(1);

    rafSpy.mockRestore();
});

it('cancela requestAnimationFrame pendente e remove listeners ao fechar dropdown', async () => {
    const cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const removeListenerSpy = vi.spyOn(window, 'removeEventListener');
    const wrapper = mountPhoneField();

    await wrapper.find('.max-phone-select').trigger('click');
    await wrapper.vm.$nextTick();

    // Dispara scroll para agendar RAF
    window.dispatchEvent(new Event('scroll'));

    // Fecha o overlay (via close / clique na máscara / método)
    const mask = document.querySelector('.max-phone-overlay-mask') as HTMLElement;
    mask?.click();
    await wrapper.vm.$nextTick();

    expect(cancelRafSpy).toHaveBeenCalled();
    expect(removeListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    expect(removeListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    cancelRafSpy.mockRestore();
    removeListenerSpy.mockRestore();
});
```
*Execução Red:* No código original, `rafSpy` não é chamado (0 chamadas) pois `updatePosition` era executado diretamente e síncronamente a cada `scroll`, fazendo o teste falhar.

### 2. Etapa Green (Sucesso Pós-Correção)
Após aplicar o controle com `requestAnimationFrame` e `cancelAnimationFrame` em `src/components/MaxPhoneField.vue`:
*Execução Green:* Os novos testes e todos os 22 testes unitários existentes passam com sucesso.

---

## Banco de Dados

- **Nenhuma** migration necessária (alteração exclusiva de front-end).

---

## Riscos de Quebra e Não-Regressão

- **Contrato de Componente:** Props, eventos emitidos (`update:modelValue`), slots (`#option`) e modelos permanecem 100% inalterados.
- **Fluidez Visual:** O overlay acompanha rolagens e redimensionamentos a 60/120 fps sem delay perceptível, sincronizado ao ciclo de renderização natural do navegador.
- **Vazamento de Memória / Listeners:** O cancelamento de frames pendentes e remoção dos event listeners previne vazamento de memória e chamadas a elementos já desmontados.
- **Não-Regressão:** A suíte de testes de `MaxPhoneField` e de componentes compostos como `MaxInputPhoneMail` continuam passando sem alterações de comportamento funcional.

---

## Validação

- Execução dos testes automatizados de `MaxPhoneField`:
  ```bash
  npx vitest run tests/components/MaxPhoneField.test.ts
  ```
- Execução de testes de componentes correlatos:
  ```bash
  npx vitest run tests/components/MaxInputPhoneMail.test.ts
  ```
- Verificação estática de tipos TypeScript:
  ```bash
  npm run type-check
  ```
- Verificação de formatação e linting:
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
