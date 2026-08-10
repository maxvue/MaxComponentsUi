# Diretiva `v-tooltip`: hook `updated` não reanexa listeners quando o modificador `focus` muda

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/directives/tooltip.ts:157-171`, `:192-206`
- **Domínio:** helpers-composables

## Problema

Os listeners são escolhidos com base no modificador `focus` e anexados **apenas uma vez**, no `mounted`:

```ts
// src/directives/tooltip.ts:165-170
if (binding.modifiers.focus) listeners.push(['focus', onFocus], ['blur', onBlur]);
else listeners.push(['mouseenter', onEnter], ['mouseleave', onLeave], ['focus', onFocus], ['blur', onBlur]);

for (const [type, listener] of listeners) el.addEventListener(type, listener);
state.listeners = listeners;
```

O hook `updated` (linhas 192-206) atualiza `state.options` e `state.position`, mas **não** chama `detachListeners`/`attachListeners`. Ele nem sequer recebe os modificadores em consideração além de `parsePosition`.

Isso deixa uma incoerência: `parsePosition(binding)` é reexecutado no `updated` (linha 196), tratando os modificadores como potencialmente dinâmicos, enquanto `binding.modifiers.focus` é tratado como estático. Os dois vêm da mesma fonte.

Há ainda um segundo defeito no mesmo hook. As linhas 197-202:

```ts
if (!state.tooltipEl) return;

if (state.options.disabled || !state.options.value) {
    destroyTooltip(el, state);
    return;
}
```

O `return` da linha 197 sai antes de qualquer tratamento quando não há tooltip visível. Consequência: se um `showTimer` estiver pendente (agendado por `show()`, linha 142) e o binding for atualizado para `disabled: true`, o timer não é cancelado — ele dispara depois e `createTooltip` só então verifica `state.options.disabled` (linha 101). Nesse caso específico o guard salva, mas o timer segue pendente até o timeout, e um `updated` que reabilite o tooltip no intervalo produz criação em momento inesperado.

## Impacto

- Na prática, `binding.modifiers` raramente muda em Vue (modificadores são estáticos no template), então o defeito dos listeners é de baixa probabilidade — mas a incoerência com `parsePosition` indica que a intenção era suportar atualização, e um leitor futuro assumirá que suporta.
- O timer não cancelado é observável: alternar `disabled` durante um `showDelay` longo deixa comportamento dependente de timing.

## Plano de correção

1. No hook `updated`, chamar `clearTimers(state)` (função já existente, linha 134) quando `state.options.disabled` passar a `true` ou `state.options.value` ficar vazio — antes do `return` da linha 197.
2. Decidir e documentar explicitamente se modificadores são estáticos: ou (a) reanexar listeners no `updated` comparando o modificador `focus` anterior com o novo, ou (b) adicionar comentário afirmando que modificadores só são lidos no `mounted`, e então parar de reexecutar `parsePosition` no `updated` para manter coerência.
3. Guardar os modificadores no `state` para permitir a comparação do passo 2 (a).

## Verificação

- Testes a criar/ajustar: `tests/directives/tooltip.test.ts` — caso "alterar o binding para `disabled: true` durante um `showDelay` pendente não cria tooltip e não deixa timer" (usando `vi.useFakeTimers` e `vi.getTimerCount()`).
- Comandos: `npx vitest run tests/directives/tooltip.test.ts`, `npm run type-check`, `npm run lint`
