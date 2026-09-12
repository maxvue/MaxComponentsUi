# Textarea mede e redimensiona duas vezes por digitação

## Resumo

Cada evento de input chama `resize()` imediatamente e, ao alterar a ref, agenda um segundo `resize()` no próximo tick. Ambos misturam escritas e leituras de layout.

## Severidade e prioridade

- Severidade: média.
- Prioridade: P2.

## Evidências

- `src/components/MaxInputTextArea.vue:80-123`: cada resize escreve `height`, lê `scrollHeight`, chama `getComputedStyle` e escreve altura/overflow.
- `src/components/MaxInputTextArea.vue:126-143`: `onInput` chama resize diretamente e o watcher de `temp_value` agenda outro no `nextTick`.
- Instrumentação Node 24/jsdom após um input e dois ticks registrou duas chamadas de `getComputedStyle` e quatro leituras de `scrollHeight`, confirmando dois ciclos completos.
- `tests/components/MaxInputTextArea.test.ts:95-135` valida o resultado isolado, não a contagem de medições.

## Componentes afetados

`MaxInputTextArea`, sobretudo formulários densos e conteúdo digitado rapidamente.

## Causa-raiz

O resize possui dois gatilhos para a mesma mutação: handler imperativo e watcher reativo. Não existe coalescência por tick/frame nem separação clara entre mudanças internas e externas.

## Impacto quantificado

Uma tecla provoca dois ciclos de resize, duas consultas de estilo e quatro leituras de `scrollHeight` na instrumentação. Para `K` teclas, o componente realiza `2K` ciclos em vez de `K`.

## Reprodução e benchmark

Espionar `getComputedStyle` e o getter de `scrollHeight`; disparar input; aguardar dois ticks; comparar contagens. Em navegador, registrar layout/recalculate style com 1/20/50 textareas.

## Direção de solução

Centralizar o gatilho em watcher pós-render ou agendar/coalescer no máximo um resize por frame, preservando atualização para mudanças externas.

## Critérios de aceite

- Uma alteração lógica agenda no máximo um resize.
- Não há loop ao receber `modelValue` externo.
- Altura, limites e overflow continuam corretos.
- Teste afirma contagem de medições além do resultado visual.

## Contraevidências

- jsdom não modela o custo real de layout; as contagens são confiáveis, os tempos não.
- Um textarea isolado e curto pode não produzir impacto perceptível.
