# Proliferação de Listeners Globais de Keydown em Dropdowns Fechados

## Categoria
Memory Leaks / Event Listener Proliferation / Overhead na Thread Principal

## Severidade
Alta

## Componentes Envolvidos
- [MaxInputSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue#L397-L408)
- [MaxInputAutoComplete.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputAutoComplete.vue#L311-L322)
- [MaxInputAutoCompleteApi.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputAutoCompleteApi.vue#L249-L260)
- [MaxTagSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue#L341-L352)
- [MaxInputDatePicker.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue#L508-L519)
- [MaxPopoverMenu.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPopoverMenu.vue#L163-L174)
- [MaxUserSection.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserSection.vue#L227-L238)

## Descrição do Problema
Sete componentes de seleção/dropdown registram um listener global de `keydown` no objeto `window` imediatamente na avaliação do setup / montagem do componente, **mesmo quando o dropdown/overlay está totalmente fechado**:

```typescript
// Exemplo em MaxInputSelect.vue L397-L408
const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen.value) hide();
};

if (typeof window !== 'undefined') window.addEventListener('keydown', onKeydown);

onBeforeUnmount(() => {
    if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown);
});
```

Esse mesmo padrão idêntico se repete em `MaxInputAutoComplete`, `MaxInputAutoCompleteApi`, `MaxTagSelect`, `MaxInputDatePicker`, `MaxPopoverMenu` e `MaxUserSection`.

## Causa Raiz
O único propósito desse listener é fechar o dropdown quando a tecla `Escape` for pressionada e `isOpen.value === true`.
No entanto, o listener fica permanentemente anexado a `window` durante todo o ciclo de vida do componente, inclusive enquanto `isOpen` é `false` (99.9% do tempo de uso da tela).

Em telas com tabelas editáveis (como `MaxTableFields.vue`), formulários cadastrais extensos ou listas de itens com seletores, podem coexistir simultaneamente 100 a 300 instâncias desses componentes montados.

## Impacto na Performance
1. **Storm de Event Listeners**: A cada caractere digitado pelo usuário em **qualquer** campo de texto da página, o navegador é obrigado a disparar centenas de funções JavaScript síncronas registradas no `window`.
2. **Degradação de Digitação (Input Latency)**: A execução de centenas de closures avaliando `if (event.key === 'Escape' && isOpen.value)` a cada frame de digitação satura a thread principal do navegador, causando atraso perceptível de digitação (*typing lag*), aumento do INP (Interaction to Next Paint) e desperdício de bateria do dispositivo.
3. **Contraste de Arquitetura**: Outros componentes da mesma biblioteca, como `MaxModal.vue`, `MaxDrawer.vue` e `MaxInputPhone.vue`, adotam a prática recomendada: registrar o listener somente quando `isOpen` se torna `true` e removê-lo assim que for fechado.

## Solução Recomendada
Substituir o registro estático e permanente de `window.addEventListener` por ativação sob demanda via `watch(isOpen, ...)`:

```typescript
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
