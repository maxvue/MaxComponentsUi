# Autocompletes visuais não expõem o contrato ARIA de combobox

## Resumo
Os dois autocompletes possuem teclado e lista visual, mas o input não informa expansão, lista controlada ou opção ativa; opções também não têm IDs/seleção semântica.

## Severidade e prioridade
Alta — P1. WCAG 1.3.1 e 4.1.2.

## Evidências
- `src/components/MaxInputAutoComplete.vue:4-21` e `MaxInputAutoCompleteApi.vue:4-19`: inputs sem `role=combobox`, `aria-autocomplete`, `aria-expanded`, `aria-controls` e `aria-activedescendant`.
- `MaxInputAutoComplete.vue:24-54` e versão API `:22-49`: listbox/opções sem IDs e `aria-selected`.
- `MaxInputAutoComplete.vue:248-262` e API `:227-245`: `activeIndex` só altera classe visual.

## Afetados
`MaxInputAutoComplete`, `MaxInputAutoCompleteApi` e formulários/tabelas que os embutem.

## Causa-raiz
Comportamento de teclado foi migrado sem modelar no DOM acessível o estado interno do widget composto.

## Impacto e reprodução
Digitar e navegar sugestões por setas com leitor de tela: abertura e mudança da opção destacada não são anunciadas.

## Direção de correção
Adotar padrão combobox com IDs estáveis, expansão/controle, autocomplete e active descendant; refletir seleção nas opções.

## Critérios de aceite
Leitor anuncia abertura, quantidade/contexto, opção ativa e seleção; Escape/Enter/setas mantêm estado ARIA sincronizado; testes cobrem isso.

## Contraevidências
A operação por teclado básica existe e o foco permanecer no input é correto; não é necessário focus trap.
