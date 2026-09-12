# Plano de implementação — contrato ARIA dos autocompletes

## Objetivo e escopo

Implementar o padrão combobox nos dois autocompletes, mantendo foco no input e sincronizando expansão, lista, opção ativa e seleção. Não adicionar focus trap.

## Fora de escopo

Não adicionar focus trap, mudar busca/API, implementar virtualização ou corrigir duplicidade/concorrência; esses trabalhos pertencem a planos correlatos.

## Arquivos

- Alterar `src/components/MaxInputAutoComplete.vue` e `MaxInputAutoCompleteApi.vue`.
- Alterar seus testes em `tests/components/`.
- Criar helper compartilhado de IDs apenas se evitar duplicação sem esconder estados.

## Dependências e ordem

1. Fixar matriz ARIA em testes.
2. Aplicar ao autocomplete local.
3. Replicar no API.
4. Integrar virtualização/busca duplicada antes da validação final.

## Passos

1. Gerar IDs estáveis por instância para input, listbox e opções usando índice global/chave estável.
2. No input aplicar `role=combobox`, `aria-autocomplete=list`, `aria-expanded`, `aria-controls` quando lista existe e `aria-activedescendant` apenas para opção montada.
3. Nomear o controle via InputBase/`aria-label` conforme contrato.
4. Nas opções aplicar ID, `role=option` e `aria-selected` baseado no valor selecionado; listbox recebe ID/nome contextual.
5. Sincronizar activeIndex ao abrir, filtrar, navegar, selecionar, Escape e mudança externa; nunca apontar para item removido.
6. Com virtualização, rolar/materializar a opção antes de atualizar active descendant.
7. Preservar setas/Enter/Escape, sem mover foco para opções.

## Migração e testes

Mudança ARIA aditiva; classes, props e eventos permanecem. Unitários cobrem duas instâncias, estados e IDs; integração teclado testa filtro/abertura/seleção; axe/leitor valida anúncios. Benchmark não se aplica além de garantir IDs só na janela virtual.

## Aceite

Todos os atributos refletem estado real; IDs são únicos/válidos; leitor anuncia abertura, opção ativa e seleção; teclado atual continua; axe sem violações do widget.

## Riscos e rollback

`aria-activedescendant` para nó não montado é inválido; ordenar scroll/render. `aria-controls` para Teleport continua válido por ID. Rollback remove somente vínculo problemático, mantendo roles válidos, até corrigir.

## Validação final

Testes dos dois componentes, axe/browser com NVDA/VoiceOver quando disponível, suíte, type-check, lint e `git diff --check`.
