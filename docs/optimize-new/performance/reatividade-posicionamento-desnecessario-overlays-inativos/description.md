# Medição geométrica permanece ativa em overlays fechados

## Resumo

Diversos overlays instanciam `useElementBounding` durante o setup. Pelos defaults do VueUse reexportado por `@maxvue/max-use`, cada instância registra listeners globais de scroll/resize e lê `getBoundingClientRect()` a cada scroll, mesmo com o painel fechado.

## Severidade e prioridade

- Severidade: alta em telas densas; média isoladamente.
- Prioridade: P1.

## Evidências

- `src/components/MaxInputSelect.vue:337-339`, `MaxInputAutoComplete.vue:119-121`, `MaxInputAutoCompleteApi.vue:119-121` e `MaxInputDatePicker.vue:302-304` instanciam bounding, size e window size incondicionalmente.
- `src/components/MaxButtonConfirm.vue:63`, `MaxIconConfirm.vue:67` e `MaxTogglePopover.vue:91` instanciam bounding no setup.
- `rg -n "useElementBounding|useElementSize|useWindowSize" src` encontrou 22, 24 e 22 ocorrências textuais, respectivamente, incluindo imports.
- Inspeção da implementação instalada do VueUse 14.4 confirma defaults `windowScroll: true`, `windowResize: true`, atualização síncrona e listener de scroll capture/passive; o handler atualiza via `getBoundingClientRect`.

## Componentes afetados

Selects, autocompletes, date picker, confirmações, popovers e outros overlays que usam os mesmos composables no setup.

## Causa-raiz

O posicionamento foi acoplado ao ciclo de vida do componente hospedeiro, não ao ciclo aberto/fechado do overlay. A abstração compartilhada existente (`MaxBaseOverlay`) já possui listeners condicionais, mas componentes legados mantêm o padrão eager.

## Impacto quantificado

Cada instância com `useElementBounding` representa pelo menos um listener global de scroll e uma leitura geométrica por evento. Uma tela com 26 instâncias executa, portanto, 26 handlers/leitura de bounding por evento, mesmo que todos os overlays estejam fechados. Não há profiler rastreável nesta auditoria para sustentar percentuais de CPU ou milissegundos absolutos.

## Reprodução e benchmark

Montar 1, 10 e 30 instâncias fechadas; instrumentar `Element.prototype.getBoundingClientRect`; disparar scroll e contar chamadas. Registrar Performance trace antes/depois da ativação condicional e repetir com um overlay aberto.

## Direção de solução

Consolidar o posicionamento em uma base comum e registrar medição/listeners apenas enquanto aberto, com coalescência por `requestAnimationFrame`. Desligar opções do composable que não sejam necessárias e atualizar a posição imediatamente na abertura.

## Critérios de aceite

- Zero leitura geométrica causada por overlays fechados durante scroll/resize.
- Um overlay aberto se reposiciona no máximo uma vez por frame.
- Listeners e observers são removidos no fechamento e unmount.
- Teste automatizado mede chamadas em 1/10/30 instâncias.

## Contraevidências

- Isto não é polling: o custo é orientado a eventos.
- O `computed` de posição é lazy e, quando o subtree fechado não o lê, não há razão para afirmar recomputação do `computed` a cada scroll.
- `MaxBaseOverlay.vue:120-135` registra e remove listeners conforme abertura, e `MaxInputPhone.vue:202-225,247-261` limita o trabalho ao estado aberto com `requestAnimationFrame` e cleanup.
