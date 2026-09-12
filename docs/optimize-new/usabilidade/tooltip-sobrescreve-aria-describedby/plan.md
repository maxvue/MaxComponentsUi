# Plano de implementação — compor aria-describedby no tooltip

## Objetivo e escopo

Adicionar/remover somente o ID pertencente ao tooltip, preservando descrições preexistentes, alterações externas e múltiplos ciclos até unmount.

## Fora de escopo

Não mudar conteúdo, posicionamento, delays ou aparência do tooltip; somente a composição e limpeza de `aria-describedby` serão corrigidas.

## Arquivos

- Alterar `src/directives/tooltip.ts` e `tests/directives/tooltip.test.ts`.
- Criar helper interno de tokenização no mesmo arquivo, salvo reuso comprovado.

## Dependências e passos

1. Adicionar testes de preservação antes da correção.
2. Ao mostrar, ler tokens atuais, deduplicar e acrescentar `tooltipId`.
3. Ao esconder/unmount, reler o atributo e remover somente `tooltipId`; remover atributo apenas se nenhum token restar.
4. Preservar IDs adicionados externamente enquanto tooltip está aberto.
5. Lidar com show/hide atrasado, update da diretiva, duas diretivas em elementos distintos e elemento desconectado.
6. Garantir que tooltip seja removido antes de retirar sua referência e listeners/timers sejam limpos.

## Migração e testes

Sem API nova. A ordem/whitespace dos tokens pode ser normalizada, mas a lista semântica deve permanecer. Unitários cobrem `ajuda erro`, duplicação, atualização concorrente, focus/hover, delays e unmount; integração com InputBase verifica erro+tooltip. A11y valida todos IDs existentes. Benchmark não se aplica.

## Aceite

IDs anteriores e posteriores sobrevivem; somente ID do tooltip entra/sai; nenhum token duplicado; todo ID referenciado existe enquanto ativo; cleanup completo.

## Riscos e rollback

Restaurar snapshot apagaria mudança externa; sempre remover por token atual. Corrida de timers pode recriar tooltip após unmount; cancelar e checar conexão. Rollback mantém helper de composição mesmo se posicionamento for revertido.

## Validação final

Testes da diretiva/InputBase, fake timers, axe/DOM ID check, suíte, type-check, lint e `git diff --check`.
