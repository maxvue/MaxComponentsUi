# Plano 24 — `MaxPhoneField` (substitui `Select` + `InputText`)

| | |
|---|---|
| **id** | 24 |
| **Arquivo** | `src/components/MaxPhoneField.vue` |
| **Primitivas eliminadas** | `Select`, `InputText` |
| **Depende de** | 1 (`MaxBaseInput`), 23 (`MaxInputSelect`) |
| **Teste existente** | `tests/components/MaxPhoneField.test.ts` |

---

## 1. Estrutura

Campo composto: um `Select` de país (bandeira + DDI) colado a um `InputText` de número.
A biblioteca `libphonenumber-js` está instalada e cuida de validação/formatação por país
— **nada disso muda**.

## 2. A mudança

```diff
- import Select from 'primevue/select';
- import InputText from 'primevue/inputtext';
+ import MaxInputSelect from './MaxInputSelect.vue';
+ import MaxBaseInput from './base/MaxBaseInput.vue';
```

E as tags correspondentes no template.

> **Decisão a tomar e registrar em `notas`:** o seletor de país deve usar
> `MaxInputSelect` (que traz `InputBase`, labels e estados) ou apenas o
> `MaxBaseOverlay` diretamente (mais leve, sem o wrapper de input)?
>
> Como o select de país fica **dentro** do `InputBase` do `MaxPhoneField`, aninhar outro
> `InputBase` provavelmente quebra o layout. Leia o template atual: se o `Select` estiver
> dentro de um `InputBase`, prefira construir um dropdown enxuto com `MaxBaseOverlay` em
> vez de reusar o `MaxInputSelect` inteiro.

## 3. Pontos de atenção

- **Layout colado**: o select e o input formam visualmente um único campo. Preserve os
  `border-radius` assimétricos e a ausência de borda entre os dois.
- **Bandeiras**: se forem renderizadas via `MaxIcon` ou emoji, nada muda; se dependiam de
  algum slot do `Select`, replique.
- **DDI + número**: o `v-model` provavelmente emite o número completo em formato E.164.
  Teste o round-trip.
- **Máscara por país**: se houver máscara dinâmica conforme o país selecionado, ela é o
  ponto mais frágil — teste a troca de país com número já digitado.

## 4. Teste

1. renderiza o select de país e o input de número;
2. selecionar um país atualiza o DDI exibido;
3. digitar o número emite o valor combinado correto;
4. trocar o país reformata/revalida o número existente;
5. validação via `libphonenumber-js` continua funcionando (número válido vs. inválido);
6. `disabled` desabilita **ambos** os controles;
7. estados do `InputBase` (`error`, `required`) refletem;
8. navegação por teclado: Tab passa do select para o input.

## 5. Checklist

- [ ] Sem PrimeVue
- [ ] Decisão sobre reuso de `MaxInputSelect` registrada em `notas`
- [ ] Layout colado preservado (validado no playground)
- [ ] `libphonenumber-js` intacto
- [ ] Troca de país com número digitado testada
- [ ] `type-check`, `lint`, `test` OK
