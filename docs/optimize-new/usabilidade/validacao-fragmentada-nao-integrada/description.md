# Validação compartilhada não é integrada e produz momentos de erro divergentes

## Resumo
O composable de validação não possui consumidores e seu blur é vazio; componentes duplicam regras e exibem/recolhem erro em momentos diferentes.

## Severidade e prioridade
Média — P2. WCAG 3.3.1 e 3.3.3.

## Evidências
`src/helpers/useInputValidation.ts:50-79` não tem consumidores e `onBlur` não age. Regras duplicadas aparecem em `MaxInputText.vue:81-107`, `MaxInputNumber.vue:111-149`, `MaxChips.vue:168-181,356-361` e `MaxColorPicker.vue:126-146`. `MaxInputCpfCnpj.vue:154-176` avalia required antes de interação, enquanto `MaxInputCep.vue:62-72` torna a mensagem required inalcançável para valor vazio; cartão e data de cartão adotam outro ciclo após blur. `tests/helpers/useInputValidation.test.ts:112-125` não testa integração.

## Afetados
Famílias de formulário com `done`, `caution`, `error`, `required` e `targetValue`.

## Causa-raiz
Foi criada abstração sem migração dos consumidores; cada input manteve seu ciclo histórico.

## Impacto e reprodução
Comparar campos required: alguns mostram estado no mount, outros no blur e outros após alteração, tornando prevenção/recuperação imprevisível.

## Direção de correção
Definir política única touched/dirty/submitted e integrar o composable gradualmente.

## Critérios de aceite
Campos equivalentes exibem e removem erro nos mesmos eventos; helper tem consumidores e testes integrados.

## Contraevidências
Regras locais funcionam em cenários felizes; o defeito é consistência e previsibilidade, não ausência absoluta de validação.
