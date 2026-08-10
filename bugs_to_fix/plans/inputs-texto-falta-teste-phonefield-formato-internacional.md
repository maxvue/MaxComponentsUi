# Falta de teste: MaxPhoneField não cobre emissão do v-model nem formato internacional

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `tests/components/MaxPhoneField.test.ts`, `src/components/MaxPhoneField.vue:61-105`
- **Domínio:** inputs-texto

## Problema

A cobertura conhecida deste componente é de 64,7% de functions, e a leitura da suíte explica o porquê: os 11 testes existentes só verificam **entrada** (`modelValue` → `country`/`phone`) e o formato da máscara. Nenhum verifica **saída**.

Não coberto:

1. **Emissão de `update:modelValue`.** O caminho de saída é `watchDebounced(temp_value, ...)` com 500ms de debounce (`MaxPhoneField.vue:103-105`). Nenhum teste digita no input e afirma o valor emitido; nenhum teste usa fake timers para atravessar o debounce. É o contrato principal do componente e está inteiramente sem teste. Compare com `tests/components/MaxInputCpfCnpj.test.ts:7-13`, que mocka `watchDebounced` para torná-lo síncrono — a mesma técnica se aplica aqui.
2. **Troca de país pelo `Select`.** O `Select` é stubado (`Select: true`, linha 13), então mudar `country` e verificar que o DDI novo entra no valor emitido nunca acontece. `temp_value` é `country.value.value + phone` (linha 61) — trocar de país deve reemitir.
3. **Formato internacional.** Só há um teste de país não-BR (DDI 1, linhas 36-42) e ele apenas confere que a máscara vira `'%'` (linha 72-77). Não há teste de round-trip: setar um número de Portugal/EUA, confirmar que `phone` e `country` são reconstruídos e que o valor reemitido é igual ao original. Verifiquei manualmente que `'351912345678'` resolve corretamente para DDI 351 + `912345678`, mas isso não está travado por teste.
4. **Ambiguidade de prefixo de DDI.** O laço da linha 87-95 tenta 3, 2 e 1 dígito nessa ordem. Números cujo prefixo casa em mais de um comprimento dependem inteiramente dessa ordem e da composição de `src/constants/ddiFlags.ts`. Nenhum teste documenta a precedência escolhida.
5. **`noMask` via ctrl+V.** O teste da linha 93-102 atribui `noMask` diretamente, contornando `useMagicKeys` e o `watch` da linha 75 — o mecanismo real (incluindo o `refAutoReset` de 50ms da linha 67) fica sem cobertura.
6. **Remoção do `0` inicial.** O teste da linha 65-70 cobre o watch da linha 70-72, mas afirma um resultado já mascarado (`'(11) 9 9999 - 999'`) que mistura duas responsabilidades.

## Impacto

O componente que produz o número de telefone final não tem nenhum teste sobre o número que ele produz. Uma regressão no debounce, na concatenação DDI+número ou na troca de país passaria despercebida — e telefone é dado usado para contato e login em aplicações consumidoras.

## Plano de correção

1. Mockar `watchDebounced` para execução síncrona (copiar o padrão de `tests/components/MaxInputCpfCnpj.test.ts:7-13`) ou usar `vi.useFakeTimers()` + avanço de 500ms.
2. Adicionar teste de emissão: montar vazio, setar `phone`, afirmar o último `update:modelValue` igual a `'55' + digitos`.
3. Adicionar teste de troca de país: montar com número BR, alterar `country` para outro DDI, afirmar que o valor reemitido usa o DDI novo.
4. Adicionar round-trip internacional: `modelValue: '351912345678'` → afirmar `country.ddi === 351` e `phone === '912345678'` → afirmar que o valor reemitido volta a ser `'351912345678'`.
5. Adicionar teste explicitando a precedência de prefixo (3 antes de 2 antes de 1), com um vetor real de `ddiFlags` que exercite a ambiguidade.
6. Substituir o stub `Select: true` por um stub que permita emitir `update:modelValue`, para que a troca de país seja testável pelo componente e não só pela ref interna.

## Verificação

- `npx vitest run tests/components/MaxPhoneField.test.ts` com os novos casos.
- `npm run test:coverage` e confirmar que functions de `MaxPhoneField.vue` sobem dos 64,7% atuais — a meta mínima é cobrir o `watchDebounced` e o `maskValue` em todos os seus branches.
