# ListBox não nomeia o widget nem anuncia estados e foco inicial

## Resumo
`MaxListBox` implementa navegação robusta, mas seu título não nomeia o listbox, o filtro depende de placeholder, loading/vazio são apresentação e o foco inicial pode ficar sem indicador.

## Severidade e prioridade
Média/alta — P1.

## Evidências
- `src/components/MaxListBox.vue:3-29`: título separado; listbox sem `aria-label/labelledby`; filtro sem label.
- `src/components/MaxListBox.vue:72-82`: loading/vazio como presentation e erro sem live region.
- `src/components/MaxListBox.vue:650-683`: filtro/listbox removem outline; o filtro troca só borda.

## Afetados
Todas as instâncias, sobretudo assíncronas e com filtro.

## Causa-raiz
Estados e título foram implementados visualmente, enquanto a boa máquina de teclado não ganhou contrato de nome/status/foco.

## Impacto e reprodução
Tabular para o widget vazio: propósito e foco podem não ser perceptíveis; carregar/falhar não é anunciado.

## Direção de correção
Ligar título por `aria-labelledby`, nomear filtro, oferecer focus-visible por token e live status/alert.

## Critérios de aceite
Widget e filtro têm nomes, foco visível sem depender de item, e loading/erro/vazio são anunciados sem excesso.

## Contraevidências
Setas, disabled options, seleção e active descendant estão bem implementados e testados; não devem regredir.
