# Plano 07 — Inputs de texto derivados (ids 7–12)

| | |
|---|---|
| **ids** | 7, 8, 9, 10, 11, 12 |
| **Primitiva eliminada** | `InputText` |
| **Depende de** | 1 (`MaxBaseInput`), 6 (`MaxInputText` — padrão validado) |

| id | Componente | Teste existente | Particularidade |
|---|---|---|---|
| 7 | `MaxInputCep` | `MaxInputCep.test.ts` | `v-maska` `'#####-###'` + busca de endereço |
| 8 | `MaxInputCpfCnpj` | `MaxInputCpfCnpj.test.ts` | máscara **dinâmica** CPF↔CNPJ |
| 9 | `MaxInputPhoneMail` | `MaxInputPhoneMail.test.ts` | alterna telefone/e-mail |
| 10 | `MaxInputSearch` | `MaxInputSearch.test.ts` | debounce de busca |
| 11 | `MaxInputCoordinateDecimalLat` | `MaxInputCoordinateDecimalLat.test.ts` | validação -90..90 |
| 12 | `MaxInputCoordinateDecimalLng` | `MaxInputCoordinateDecimalLng.test.ts` | validação -180..180 |

> **11 e 12 migram na mesma passada** (conjunto indivisível — mesmo padrão, testes irmãos,
> e existe `MaxInputCoordinates.test.ts` que exercita os dois juntos).

---

## 1. O padrão (idêntico ao id 6)

🔒 **`InputBase` permanece o elemento mais externo, intocado.** A troca acontece
**apenas dentro** dele:

```vue
<InputBase v-bind="props" :done="..." :error="..." :caution="...">   <!-- NÃO MUDA -->
    <MaxBaseInput ... />                                            <!-- só isto muda -->
</InputBase>
```

`src/components/InputBase.vue` **não é alterado por nenhum item desta migração** — ele já
é PrimeVue-free. É ele que fornece label, ícones, os estados `done`/`error`/`caution`/
`required` e a linha de mensagem. Perder o wrapper é regressão silenciosa: o campo
continua digitável, só perde label, ícones e feedback visual.

Para cada componente:

```diff
- import InputText from 'primevue/inputtext';
+ import MaxBaseInput from './base/MaxBaseInput.vue';
```

```diff
- <InputText v-bind="props" ... />
+ <MaxBaseInput :type="..." :placeholder="..." :disabled="..." v-model="temp_value" fluid ... />
```

**Preserve integralmente**, em cada arquivo:
- todas as diretivas (`v-maska` acima de tudo);
- todos os handlers (`@blur`, `@input`, `@keydown`);
- toda a lógica de validação, máscara e formatação;
- todas as props e emits declarados.

---

## 2. `v-maska` — o ponto crítico desta fase

Quatro dos seis componentes usam `v-maska`. A diretiva **precisa terminar aplicada ao
`<input>` real**, não a um wrapper.

O [plano 01](01-MaxBaseInput.md) exige que a raiz do `MaxBaseInput` seja o próprio
`<input>` justamente por isso. **Confirme antes de começar:**

```bash
grep -A3 "<template>" src/components/base/MaxBaseInput.vue
# a primeira tag depois de <template> deve ser <input, não <div
```

Se for `<div>`, **pare** e corrija o id 1 antes de prosseguir. Máscara quebrada é uma
falha silenciosa: o campo aceita a digitação, só não formata — e nenhum erro aparece.

### Teste específico de máscara (obrigatório em 7, 8, 9)

```ts
it('aplica a máscara ao digitar', async () => {
    const wrapper = mount(MaxInputCep, { props: { modelValue: '' } });
    const input = wrapper.find('input');
    await input.setValue('01310100');
    expect(input.element.value).toBe('01310-100');
});
```

> Se o setup global fizer **stub** da diretiva `v-maska` (o `CLAUDE.md` menciona que faz),
> esse teste não exercita a máscara de verdade. **Verifique `tests/setup.ts`.** Se
> estiver stubada, remova o stub **apenas neste arquivo de teste** importando a diretiva
> real, ou documente em `notas` que a máscara foi validada manualmente no playground.
> Não escreva um teste que finge validar a máscara.

---

## 3. Ordem de execução dentro da fase

Migre um por vez, na ordem dos ids, rodando o teste do componente após cada um. **Não
migre os seis de uma vez** — se algo quebrar, você não saberá qual mudança causou.

Exceção: ids 11 e 12 juntos.

---

## 4. Particularidades por componente

### id 7 — `MaxInputCep`
Faz busca de endereço (provavelmente ViaCEP) ao completar o CEP. Confirme que a busca
continua disparando após a migração — ela costuma estar amarrada ao `@blur` ou a um
`watch` no valor, ambos preservados.

### id 8 — `MaxInputCpfCnpj`
Máscara dinâmica: `'###.###.###-##'` até 11 dígitos, `'##.###.###/####-##'` acima.
Teste **os dois formatos** e a **transição** entre eles (digitar o 12º dígito deve
reformatar tudo).

### id 9 — `MaxInputPhoneMail`
Alterna entre máscara de telefone e campo livre de e-mail. Teste os dois modos e a troca.

### id 10 — `MaxInputSearch`
Debounce. Use fake timers e confirme que o evento de busca dispara **uma vez** após o
intervalo, não a cada tecla.

### ids 11 e 12 — Coordenadas
Validação de faixa numérica. Teste os limites exatos (-90/90 e -180/180), valores fora
da faixa (deve marcar erro) e entrada não numérica.

---

## 5. Checklist por componente

- [ ] `grep -n "primevue" <arquivo>` → vazio
- [ ] 🔒 `<InputBase>` continua sendo o elemento mais externo, com as mesmas props
- [ ] 🔒 `git diff --stat src/components/InputBase.vue` → vazio (arquivo intocado)
- [ ] Diff contém **apenas** troca de import + troca de tag
- [ ] `v-maska` ainda no elemento `<input>` real (inspecione o HTML renderizado)
- [ ] Teste existente passa sem enfraquecimento
- [ ] Teste de máscara real adicionado (7, 8, 9) ou ausência justificada em `notas`
- [ ] Particularidade da seção 4 testada
- [ ] `npm run type-check && npm run lint && npm run test` passam
