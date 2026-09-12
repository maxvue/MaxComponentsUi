# Plano de implementação — virtual scroller semanticamente neutro

## Objetivo e escopo

Tornar `MaxBaseVirtualScroller` neutro por padrão. Semântica de listbox/opção só será aplicada pelo consumidor que também implementar nome, foco, seleção e teclado.

## Fora de escopo

Não implementar seleção dentro da infraestrutura genérica, substituir o motor TanStack ou mudar cálculos de janela/overscan.

## Arquivos

- Alterar `src/components/base/MaxBaseVirtualScroller.vue`.
- Alterar `tests/components/base/MaxBaseVirtualScroller.test.ts`.
- Ajustar consumidores reais encontrados por `rg 'MaxBaseVirtualScroller'` e seus testes.
- Atualizar tipos/documentação da base.

## Dependências e ordem

1. Inventariar consumidores e comportamento.
2. Definir API semântica opt-in.
3. Tornar defaults neutros.
4. Migrar consumidores selecionáveis.
5. Integrar com plano geral de virtualização.

## Passos

1. Remover `role=listbox/option` incondicionais.
2. Aceitar attrs/props opcionais de container e item, ou expô-los por slot, incluindo role e funções ARIA por item.
3. Preservar `aria-setsize/posinset` somente quando itemRole for `option`/`listitem` apropriado.
4. Para consumidor listbox, exigir owner nomeado/focável, `aria-selected`, active descendant e handlers; a base não deve fingir implementar seleção.
5. Para conteúdo informativo, usar div neutra ou `role=list`/`listitem` somente se solicitado.
6. Testar virtualização, scroll events e API exposta sem acoplar domínio.

## Migração e testes

Mudança do DOM acessível pode exigir major se base for pública; verificar exportação/uso. Oferecer props explícitas para preservar semântica em consumidores válidos. Unitários cobrem default neutro e modos list/listbox; integração de acessibilidade com teclado/axe cobre consumidor selecionável. Benchmark confirma virtualização inalterada.

## Aceite

Default não anuncia listbox; todo modo listbox testado tem nome/foco/seleção/teclado; ARIA posicional só aparece com papel compatível; scroll/render mantêm métricas.

## Riscos e rollback

Consumidor externo pode depender dos roles atuais; documentar migração e versionar. API genérica excessiva pode aceitar combinação inválida; validar em dev/types. Rollback oferece modo legacy opt-in, sem restaurar default enganoso.

## Validação final

Inventário de consumidores, testes base+integração/axe, benchmark de janela, suíte, type-check, lint e `git diff --check`.
