# Plano de implementação — ciclo de foco em overlays especializados

## Objetivo e escopo

Completar foco inicial, contenção, Escape e retorno nas superfícies realmente modais de IconPicker, Markdown, Image e busca móvel. Para DatePicker, implementar popup modeless alcançável e relacionado ao input, sem focus trap.

## Fora de escopo

Não aplicar focus trap a popups modeless, alterar regras de negócio dos componentes ou refazer posicionamento e ARIA de combobox; esses pontos permanecem nos achados correlatos.

## Arquivos

- Alterar `src/helpers/useFocusTrap.ts` e seus testes.
- Alterar `MaxInputIconPicker.vue`, `MaxInputMarkdown.vue`, `MaxImage.vue`, `MaxTopMenuSearchBar.vue` e `MaxInputDatePicker.vue`, com testes correspondentes.
- Reusar gerenciadores de scroll/stack existentes; não criar listeners globais paralelos.

## Dependências e ordem

1. Corrigir casos-limite do helper.
2. Integrar os quatro modais.
3. Implementar contrato modeless do calendário.
4. Testar stack/retorno. Coordenar com achados de ARIA e eventos globais.

## Passos

1. No helper, excluir elemento com qualquer ancestral hidden/`aria-hidden`/`display:none`/`visibility:hidden`.
2. Sem descendentes focáveis, impedir Tab e manter foco no container com `tabindex=-1`.
3. Tornar ativação/desativação idempotente e restaurar somente originador conectado.
4. Em cada modal, declarar `role=dialog`, `aria-modal=true`, nome, ref do container, foco inicial e `@keydown` do trap; fechar por Escape e devolver foco ao gatilho.
5. Respeitar pilha: apenas overlay superior contém foco/desbloqueia scroll.
6. No DatePicker, adicionar ID/papel, `aria-expanded/controls/haspopup` no input e mover foco à data ativa por comando documentado; Escape retorna ao input, Tab segue fluxo modeless.

## Migração e testes

Sem alterar eventos. Autofoco pode mudar o ponto inicial de usuários atuais, de forma intencional. Unitários cobrem helper/sem focáveis/ancestral oculto; browser cobre Tab reverso, Escape, nested stack e retorno. A11y automatizada valida nomes/papéis. Benchmark não se aplica, pois não há meta de desempenho neste achado.

## Aceite

Tab nunca alcança fundo nos quatro modais; todos têm nome/foco inicial/retorno; calendário é anunciado e operável sem mouse; zero listener/scroll lock após fechamento/unmount.

## Riscos e rollback

Stack incorreto pode restaurar foco cedo; centralizar ownership. Autofoco móvel pode abrir teclado; escolher alvo deliberado. Rollback por overlay mantendo semântica e Escape, com issue para trap.

## Validação final

Testes focados, matriz teclado/leitor em overlays simples/aninhados, suíte, type-check, lint e `git diff --check`.
