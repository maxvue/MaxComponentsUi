# Rótulos, mensagens e estados do `InputBase` não chegam ao controle operável

## Resumo
O `InputBase` cria IDs para controle e mensagem, mas os expõe apenas no slot; nenhum dos 25 consumidores captura esses valores. O `label[for]` aponta para elemento inexistente, a mensagem não é referenciada, `aria-invalid` fica na moldura e `required` é apenas visual. No mesmo limite arquitetural, attrs nativos como `name`, `autocomplete`, `maxlength`, `disabled`, `inputmode` e `aria-*` são desviados para o wrapper em parte da família.

## Severidade e prioridade
Crítica — P0. WCAG 1.3.1, 3.3.1, 3.3.2 e 4.1.2.

## Evidências
- `src/components/InputBase.vue:30-52`: o próprio comentário reconhece a adoção futura; label, estado e slot estão desconectados.
- `src/components/InputBase.vue:68-94`: obrigatoriedade é ocultada e a mensagem não é ligada ao campo.
- `src/components/InputBase.vue:201-209`: IDs são somente expostos.
- `src/components/MaxInputText.vue:2-20`, `MaxInputNumber.vue:2-14`, `MaxInputDatePicker.vue:2-24` e `MaxChips.vue:2-58`: filhos não consomem `inputId/messageId`.
- `src/components/MaxInputText.vue:2-20`: comentário explicita que attrs extras permanecem no wrapper; `maxlength` e `autocomplete` não chegam ao input.
- `src/components/MaxInputToggle.vue:18-25`: checkbox não recebe `disabled`, `name` ou `required`; `MaxInputPhone.vue:25,86,235-236` bloqueia o seletor de país, mas não o input do número.
- `tests/components/InputBase.test.ts:135-148`: testa exposição, não integração final.

## Afetados
Os 25 consumidores de `InputBase`, especialmente famílias Text, Number, CEP/CPF/CNPJ/coordenadas/cartão, Phone, DatePicker, AutoComplete, Select/TagSelect, Chips, OTP, Switch e Markdown. `MaxTableFields` herda o defeito ao embuti-los.

## Causa-raiz
Wrapper e controle focável dividem responsabilidade sem contrato obrigatório de propagação. O fallthrough também não distingue attrs de layout/raiz dos atributos pertencentes ao elemento form-associated.

## Impacto e reprodução
Montar `<MaxInputText label="CPF" required error="CPF inválido" />`; o label não foca o input e o campo não possui `aria-describedby`, `aria-invalid` ou `aria-required`. Leitores de tela perdem nome, contexto e erro.

## Direção de correção
Consumir os slot props em cada filho, adotar `inheritAttrs: false` quando necessário, separar `rootAttrs` de `controlAttrs` e aplicar ID, ARIA e atributos HTML no elemento que efetivamente opera. Em controles compostos, declarar um único dono do papel interativo.

## Critérios de aceite
- Todo label aponta para ID existente e exclusivo e ativa o controle.
- Ajuda/erro são ligados por `aria-describedby`.
- Invalidade e obrigatoriedade ficam no controle.
- `disabled`, `name`, `autocomplete`, limites e demais attrs suportados chegam ao controle nativo, enquanto attrs de layout permanecem na raiz.
- Testes cobrem o DOM final de cada família pública.

## Contraevidências
`MaxInputCheckbox` e `MaxInputRadio` têm associação nativa própria. `MaxInputTextArea`, `MaxInputTextList`, `MaxInputPhoneMail`, `MaxInputCheckbox` e `MaxBaseInput` já encaminham parte dos attrs e servem de referência. `MaxInputSearch` tem `aria-label`, mas ainda não liga feedback do wrapper.
