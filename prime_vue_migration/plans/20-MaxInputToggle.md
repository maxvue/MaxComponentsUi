# Plano 20 — `MaxInputToggle` (substitui `primevue/toggleswitch`)

| | |
|---|---|
| **id** | 20 |
| **Arquivo** | `src/components/MaxInputToggle.vue` |
| **Primitiva eliminada** | `ToggleSwitch` |
| **Depende de** | — |
| **Teste existente** | `tests/components/MaxInputToggle.test.ts` |

> **Este é o item mais fácil da Fase 2.** `src/components/MaxInputSwitch.vue` **já
> implementa exatamente este controle sem PrimeVue** — markup, SCSS, animação e lógica
> de `trueValue`/`falseValue` prontos. Reaproveite.

---

## 1. O `ToggleSwitch` do PrimeVue 4

| Prop | Tipo | Default |
|---|---|---|
| `modelValue` | `any` | — |
| `trueValue` | `any` | `true` |
| `falseValue` | `any` | `false` |
| `disabled` | `boolean` | `false` |
| `readonly` | `boolean` | `false` |
| `invalid` | `boolean` | `false` |
| `inputId` | `string` | — |

Slot: `handle` — `{ checked }` (conteúdo dentro do botão deslizante).
Eventos: `update:modelValue`, `change`, `focus`, `blur`.

### Markup

```html
<div class="p-toggleswitch p-component">
    <input type="checkbox" role="switch" class="p-toggleswitch-input" :aria-checked="..." />
    <span class="p-toggleswitch-slider">
        <div class="p-toggleswitch-handle"></div>
    </span>
</div>
```

**`role="switch"`** (não `checkbox`) — é o papel ARIA correto para um interruptor.

---

## 2. Estratégia

1. Leia `MaxInputSwitch.vue` inteiro.
2. Leia `MaxInputToggle.vue` atual e liste **as diferenças** de API entre os dois.
3. Se as APIs forem compatíveis, reescreva `MaxInputToggle.vue` no molde do
   `MaxInputSwitch`, ajustando apenas o que difere.
4. Registre em `notas` as diferenças encontradas.

### O que o `MaxInputSwitch` já resolve

- alternância `trueValue` ↔ `falseValue`;
- labels esquerda/direita com múltiplos aliases;
- `watch` sincronizando `modelValue`;
- SCSS completo do toggle (background, handle, transição de `left`);
- integração com `InputBase`.

### O que precisa ser **adicionado** (o `MaxInputSwitch` não tem)

⚠️ O `MaxInputSwitch` usa `<div @click>` — **não é acessível por teclado** e não tem
papel ARIA. Não copie esse defeito. Na sua implementação:

```vue
<input
    type="checkbox"
    role="switch"
    class="p-toggleswitch-input"
    :checked="isChecked"
    :aria-checked="isChecked"
    :disabled="props.disabled"
    @change="onChange"
/>
```

com o input transparente sobre o controle visual (mesmo padrão do
[plano 19](19-MaxInputCheckbox.md)).

> Considere abrir uma nota sugerindo o mesmo reforço em `MaxInputSwitch.vue` — é uma
> melhoria fora do escopo deste item, mas vale registrar em `notas` para o usuário decidir.

---

## 3. Teste

1. renderiza input com `role="switch"`;
2. clicar alterna entre `trueValue` e `falseValue`;
3. valores customizados de `trueValue`/`falseValue` (ex.: `'S'`/`'N'`) funcionam;
4. `disabled` impede a alternância;
5. `readonly` impede a alternância;
6. `Space` alterna (teclado);
7. `aria-checked` acompanha o estado;
8. slot `handle` recebe `{ checked }`;
9. mudança externa de `modelValue` atualiza o visual;
10. estados do `InputBase` refletem.

---

## 4. Checklist

- [ ] Sem PrimeVue
- [ ] Diferenças de API vs. `MaxInputSwitch` registradas em `notas`
- [ ] `role="switch"` + `aria-checked`
- [ ] Acessível por teclado (teste 6)
- [ ] `type-check`, `lint`, `test` OK
