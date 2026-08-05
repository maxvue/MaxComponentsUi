# Plano 13 — Trio de cartão de crédito (ids 13, 14, 15)

| | |
|---|---|
| **ids** | 13 (`MaxInputCreditCard`), 14 (`MaxInputCreditCardCvv`), 15 (`MaxInputCreditCardDate`) |
| **Primitiva eliminada** | `InputText` |
| **Depende de** | 1 (`MaxBaseInput`), 6 (padrão validado) |
| **Teste existente** | `tests/components/MaxCreditCard.test.ts` (cobre os três) |

> **Conjunto indivisível.** Os três compartilham um único arquivo de teste e são
> compostos por `MaxCreditCard.vue`. Migre os três na mesma passada e marque os três
> como Concluído juntos.

---

## 1. Contexto

Os três são inputs de texto com máscara, consumidos por `MaxCreditCard.vue` (que já é
PrimeVue-free). As bibliotecas `card-validator` e `@polvo-labs/card-type` estão
instaladas e fazem a detecção de bandeira — **nada disso muda**.

| Componente | Máscara | Validação |
|---|---|---|
| `MaxInputCreditCard` | `'#### #### #### ####'` (varia por bandeira) | Luhn via `card-validator` |
| `MaxInputCreditCardCvv` | `'###'` / `'####'` (Amex) | comprimento por bandeira |
| `MaxInputCreditCardDate` | `'##/##'` | mês 01–12, data não expirada |

---

## 2. A mudança (idêntica em cada arquivo)

🔒 **`InputBase` permanece o elemento mais externo, intocado** — a troca é só do que está
dentro dele:

```vue
<InputBase v-bind="props" ...>      <!-- NÃO MUDA -->
    <MaxBaseInput ... v-maska ... /> <!-- só isto muda -->
</InputBase>
```

```diff
- import InputText from 'primevue/inputtext';
+ import MaxBaseInput from './base/MaxBaseInput.vue';
```

```diff
- <InputText v-bind="props" ... v-maska ... />
+ <MaxBaseInput :placeholder="..." :disabled="..." v-model="temp_value" fluid v-maska ... />
```

Preserve integralmente máscaras, `v-maska`, detecção de bandeira, validação e emits.

---

## 3. Riscos específicos

### Máscara dinâmica por bandeira
`MaxInputCreditCard` troca a máscara conforme a bandeira detectada (Amex usa
`'#### ###### #####'`, 15 dígitos). Uma máscara reativa depende de o `v-maska` receber a
atualização — confirme que o binding continua reativo após a troca de tag.

### Composição com `MaxCreditCard.vue`
`MaxCreditCard.vue` (o preview visual do cartão) consome os três e reage aos valores.
Após migrar, **rode `MaxCreditCard.test.ts` inteiro** e valide no playground que o
preview do cartão continua atualizando conforme a digitação.

### CVV e Amex
O comprimento do CVV muda com a bandeira (3 → 4 para Amex). Teste a transição.

---

## 4. Teste

Rode o baseline antes:

```bash
npx vitest run tests/components/MaxCreditCard.test.ts
```

Asserções a adicionar:

1. máscara de número de cartão aplica no formato padrão (16 dígitos);
2. máscara muda para o formato Amex ao digitar um BIN de Amex (`34…`/`37…`);
3. CVV aceita 3 dígitos no padrão e 4 em Amex;
4. data rejeita mês `13`;
5. data rejeita ano passado;
6. os três emitem `update:modelValue` corretamente;
7. o preview de `MaxCreditCard.vue` reflete os valores digitados nos três.

Sobre o stub de `v-maska` no `tests/setup.ts`, vale a mesma advertência do
[plano 07](07-inputs-texto-derivados.md): se a diretiva estiver stubada, os testes 1–3
não validam nada. Verifique e trate.

---

## 5. Checklist de conclusão

- [ ] Os **três** arquivos sem referência a PrimeVue
- [ ] 🔒 `<InputBase>` continua sendo o elemento mais externo nos três, com as mesmas props
- [ ] 🔒 `git diff --stat src/components/InputBase.vue` → vazio (arquivo intocado)
- [ ] `MaxCreditCard.test.ts` passa integralmente
- [ ] Máscara dinâmica por bandeira validada (teste 2)
- [ ] Preview do cartão validado manualmente no playground
- [ ] Os três marcados Concluído **juntos** no `status.yaml`
- [ ] `npm run type-check && npm run lint && npm run test` passam
