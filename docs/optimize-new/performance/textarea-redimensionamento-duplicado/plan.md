# Plano de implementação — redimensionamento único do textarea

## Objetivo e resultado esperado

Centralizar o auto-resize de `MaxInputTextArea` após a atualização do DOM. Cada alteração lógica deve provocar no máximo um ciclo de medição, atendendo mudanças internas e externas sem loop.

## Escopo e fora de escopo

- Escopo: gatilhos de resize, ordem leitura/escrita, mudanças de valor e props de dimensionamento, cleanup e testes de contagem.
- Fora: redesenho visual, mudança de validação/InputBase ou virtualização de formulários.

## Arquivos-alvo

- `src/components/MaxInputTextArea.vue`.
- `tests/components/MaxInputTextArea.test.ts`.
- Criar `tests/performance/MaxInputTextArea.performance.test.ts` para cardinalidade 1/20/50.

## Dependências e ordem

1. Adicionar teste que reproduz as duas medições atuais.
2. Remover o gatilho imperativo do `onInput` e centralizar agendamento pós-render.
3. Reduzir leituras duplicadas dentro de `resize`.
4. Cobrir props e valor externo; depois executar regressões visuais.

## Passos detalhados

1. Fazer `onInput` apenas atualizar `temp_value`; não chamar `resize` diretamente.
2. Separar emissão de `update:modelValue` do efeito de layout e manter a compatibilidade da emissão inicial existente.
3. Observar `temp_value`, `autoResize`, `minRows`/`minLines`, `maxRows` e `rows` com `flush: 'post'`, chamando um agendador coalescente.
4. O agendador deve manter no máximo um callback pendente por componente e ignorá-lo após unmount; usar o mesmo caminho no mount.
5. Dentro de `resize`, escrever altura `auto`, ler `scrollHeight` uma única vez, obter `getComputedStyle` uma vez e então escrever altura/overflow finais.
6. Se `autoResize=false`, limpar altura e restaurar overflow sem fazer leituras geométricas.
7. Preservar fallback de line-height, limites mínimo/máximo e comportamento quando o ambiente de teste retorna `scrollHeight=0`.

## Migração e compatibilidade

- Props, emit, valor renderizado e método `resize` exposto pelo setup permanecem compatíveis.
- Mudanças externas de `modelValue` continuam redimensionando após o DOM refletir o valor.
- Não há estado persistido ou migração de dados.

## Testes e benchmark

- Espionar getter de `scrollHeight` e `getComputedStyle`: um input + flush executa uma leitura de cada e um ciclo final.
- Múltiplas mudanças no mesmo tick resultam em um resize.
- Cobrir valor externo, mount, troca de limites, `autoResize=false`, vazio, maxHeight/overflow e unmount antes do callback.
- Montar 1/20/50 textareas e afirmar uma medição por componente por alteração; registrar trace real apenas como evidência auxiliar.
- A11y: nenhuma semântica muda; manter attrs, disabled e foco nos testes existentes.

## Critérios de aceite

- Uma alteração lógica executa no máximo um `resize`, um `getComputedStyle` e uma leitura de `scrollHeight`.
- Atualização externa não produz eco infinito nem emissão adicional além do contrato vigente.
- Altura mínima/máxima e overflow permanecem iguais aos casos testados.
- Após unmount não há escrita tardia.
- Testes focados, type-check, suíte e build passam.

## Riscos, rollback e validação final

- Riscos: medir antes do DOM, perder resize em props e alterar emissão inicial. Mitigar com watcher pós-render e testes separados de emissão/layout.
- Rollback: restaurar o watcher anterior, mas manter removida uma das duas chamadas; não há migração reversa.
- Validar contagens 1/20/50, limites visuais, atualizações interna/externa, unmount, type-check e build.
