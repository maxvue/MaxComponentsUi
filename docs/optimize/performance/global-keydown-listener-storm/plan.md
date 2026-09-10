# Plano de Implementação: Eliminação da Proliferação de Listeners Globais de Keydown em Dropdowns Fechados

## 1. Diagnóstico e Objetivo

Atualmente, sete componentes de seleção, popovers e pickers da biblioteca registram um ouvinte de eventos global de teclado (`window.addEventListener('keydown', ...)`) imediatamente durante a montagem/setup, mantendo-o ativo ininterruptamente:

- `MaxInputSelect.vue` (L397-L408)
- `MaxInputAutoComplete.vue` (L311-L322)
- `MaxInputAutoCompleteApi.vue` (L249-L260)
- `MaxTagSelect.vue` (L341-L352)
- `MaxInputDatePicker.vue` (L508-L519)
- `MaxPopoverMenu.vue` (L163-L174)
- `MaxUserSection.vue` (L227-L238)

```typescript
// Padrão problemático presente nos 7 componentes:
const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen.value) hide();
};

if (typeof window !== 'undefined') window.addEventListener('keydown', onKeydown);

onBeforeUnmount(() => {
    if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown);
});
```

**Problemas identificados:**
1. **Proliferação de Listeners (Event Storm):** Em formulários densos ou tabelas editáveis com dezenas ou centenas de linhas (`MaxTableFields.vue`), coexistem 100 a 400 instâncias desses componentes montados simultaneamente.
2. **Latência de Digitação (Input Lag):** A cada caractere digitado pelo usuário em qualquer campo de texto da aplicação, o navegador é obrigado a disparar centenas de closures síncronas no `window` apenas para checar `if (event.key === 'Escape' && isOpen.value)`, saturando a thread principal e aumentando o INP (*Interaction to Next Paint*).
3. **Inconsistência Arquitetural:** Componentes modais como `MaxModal.vue` e `MaxDrawer.vue` já conectam seus listeners de Escape exclusivamente enquanto estão visíveis.

**Objetivo:**
Eliminar o registro prematuro de ouvintes de `keydown`, ativando o listener no `window` **somente quando o painel/dropdown estiver aberto** (`isOpen === true`) e removendo-o imediatamente assim que for fechado (`isOpen === false`) ou desmontado.

---

## 2. Arquivos a Modificar

- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputAutoComplete.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputAutoComplete.vue)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputAutoCompleteApi.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputAutoCompleteApi.vue)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPopoverMenu.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPopoverMenu.vue)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserSection.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserSection.vue)

Testes relacionados:
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputSelect.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputSelect.test.ts)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputAutoComplete.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputAutoComplete.test.ts)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputAutoCompleteApi.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputAutoCompleteApi.test.ts)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxTagSelect.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxTagSelect.test.ts)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputDatePicker.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputDatePicker.test.ts)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxPopoverMenu.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxPopoverMenu.test.ts)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxUserSection.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxUserSection.test.ts)

---

## 3. Especificação Técnica Cirúrgica

O padrão a ser adotado em todos os 7 componentes substitui a chamada síncrona `window.addEventListener('keydown', onKeydown)` por um `watch(isOpen, ...)`:

```typescript
// Padrão padronizado e seguro para os 7 componentes

const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') hide();
};

watch(isOpen, (open) => {
    if (typeof window === 'undefined') return;
    if (open) {
        window.addEventListener('keydown', onKeydown);
    } else {
        window.removeEventListener('keydown', onKeydown);
    }
});

onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', onKeydown);
    }
});
```

### 3.1. Aplicação em `MaxInputSelect.vue` (L397-L408)
```typescript
// Substituir:
const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen.value) hide();
};

if (typeof window !== 'undefined') window.addEventListener('keydown', onKeydown);

onBeforeUnmount(() => {
    if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown);
});

// Por:
const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') hide();
};

watch(isOpen, (open) => {
    if (typeof window === 'undefined') return;
    if (open) {
        window.addEventListener('keydown', onKeydown);
    } else {
        window.removeEventListener('keydown', onKeydown);
    }
});

onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', onKeydown);
    }
});
```

### 3.2. Aplicação em `MaxInputAutoComplete.vue` (L310-L322) e `MaxInputAutoCompleteApi.vue` (L249-L260)
Nos autocompletes, o método é nomeado `onGlobalKeydown`:
```typescript
const onGlobalKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') hide();
};

watch(isOpen, (open) => {
    if (typeof window === 'undefined') return;
    if (open) {
        window.addEventListener('keydown', onGlobalKeydown);
    } else {
        window.removeEventListener('keydown', onGlobalKeydown);
    }
});

onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', onGlobalKeydown);
    }
});
```

### 3.3. Aplicação em `MaxTagSelect.vue` (L341-L352)
Mesmo bloco cirúrgico de `MaxInputSelect.vue`.

### 3.4. Aplicação em `MaxInputDatePicker.vue` (L508-L519)
```typescript
const onGlobalKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') hide();
};

watch(isOpen, (open) => {
    if (typeof window === 'undefined') return;
    if (open) {
        window.addEventListener('keydown', onGlobalKeydown);
    } else {
        window.removeEventListener('keydown', onGlobalKeydown);
    }
});

onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', onGlobalKeydown);
    }
});
```

### 3.5. Aplicação em `MaxPopoverMenu.vue` (L163-L174) e `MaxUserSection.vue` (L227-L238)
Mesmo bloco cirúrgico com `onKeydown` e `watch(isOpen)`.

---

## 4. Garantia de Retrocompatibilidade

- **Comportamento Funcional Idêntico:** Quando o usuário clica no componente e o dropdown é exibido, pressionar a tecla `Escape` continua fechando o painel exatamente da mesma forma.
- **Isolamento de Props e Emits:** Nenhuma prop, emit ou método exposto via `defineExpose` é alterado.
- **Resiliência a SSR:** As verificações de segurança `typeof window !== 'undefined'` permanecem garantindo execução segura em SSR.
- **Prevenção de Fugas de Memória:** O `onBeforeUnmount` garante que qualquer listener pendente seja limpo caso o componente seja destruído enquanto o dropdown estiver aberto.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. Enquanto o componente estiver fechado (`isOpen === false`), nenhum ouvinte de `keydown` deve estar anexado a `window`.
2. Ao abrir o painel (`isOpen === true`), o ouvinte deve ser anexado a `window`.
3. Ao pressionar a tecla `Escape` com o painel aberto, `hide()` deve ser disparado e o listener removido.
4. Ao desmontar o componente aberto, o listener deve ser removido sem gerar erros.
5. Validação com o compilador TypeScript:
   ```bash
   npm run type-check
   ```
6. Execução da suíte de testes de todos os 7 componentes:
   ```bash
   npx vitest run tests/components/MaxInputSelect.test.ts tests/components/MaxInputAutoComplete.test.ts tests/components/MaxInputAutoCompleteApi.test.ts tests/components/MaxTagSelect.test.ts tests/components/MaxInputDatePicker.test.ts tests/components/MaxPopoverMenu.test.ts tests/components/MaxUserSection.test.ts
   ```
