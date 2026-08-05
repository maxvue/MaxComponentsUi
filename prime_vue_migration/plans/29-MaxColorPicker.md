# Plano 29 — `MaxColorPicker` (substitui `ColorPicker` + `InputText`)

| | |
|---|---|
| **id** | 29 |
| **Arquivo** | `src/components/MaxColorPicker.vue` |
| **Primitivas eliminadas** | `ColorPicker`, `InputText` |
| **Depende de** | 1 (`MaxBaseInput`), 2 (`MaxBaseOverlay`) |
| **Teste existente** | nenhum — **criar do zero** |

⚠️ Sem teste existente. Escreva o baseline **antes** de migrar.

---

## 1. O `ColorPicker` do PrimeVue 4

| Prop | Tipo | Default | Efeito |
|---|---|---|---|
| `modelValue` | `string \| object` | — | cor |
| `format` | `'hex' \| 'rgb' \| 'hsb'` | `'hex'` | formato do valor |
| `inline` | `boolean` | `false` | painel sempre visível |
| `defaultColor` | `string` | `'ff0000'` | cor inicial |
| `disabled`, `inputId`, `appendTo` | | | |

Eventos: `update:modelValue`, `change`, `show`, `hide`.

### Anatomia do painel

```html
<div class="p-colorpicker-panel">
    <div class="p-colorpicker-content">
        <div class="p-colorpicker-color-selector">      <!-- quadrado saturação × brilho -->
            <div class="p-colorpicker-color-background">
                <div class="p-colorpicker-color-handle"></div>
            </div>
        </div>
        <div class="p-colorpicker-hue">                  <!-- barra vertical de matiz -->
            <div class="p-colorpicker-hue-handle"></div>
        </div>
    </div>
</div>
```

Modelo interno: **HSB** (matiz 0–360, saturação 0–100, brilho 0–100). O valor exposto é
convertido para o `format` pedido.

> **Nota:** o `format` do PrimeVue emite hex **sem `#`** (ex.: `"ff0000"`). Verifique o
> que o `MaxColorPicker` atual expõe — se ele já normaliza para `#ff0000`, **preserve o
> comportamento do Max** (regra nº 2 do briefing: o componente existente prevalece).

---

## 2. Conversões (implemente com cuidado e teste)

```ts
// HSB -> RGB
const hsbToRgb = (h: number, s: number, b: number) => {
    s /= 100; b /= 100;
    const k = (n: number) => (n + h / 60) % 6;
    const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
};

// RGB -> HEX
const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
    [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

// HEX -> RGB (aceita 3 e 6 dígitos, com ou sem '#')
const hexToRgb = (hex: string) => {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;         // entrada inválida -> null, nunca NaN
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
};

// RGB -> HSB
const rgbToHsb = ({ r, g, b }: { r: number; g: number; b: number }) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = 60 * (((g - b) / d) % 6);
        else if (max === g) h = 60 * ((b - r) / d + 2);
        else h = 60 * ((r - g) / d + 4);
    }
    return { h: (h + 360) % 360, s: max === 0 ? 0 : (d / max) * 100, b: max * 100 };
};
```

> **Round-trip é o teste que importa.** `hex → hsb → hex` deve devolver o mesmo hex
> (tolerância de ±1 por canal, por causa do arredondamento). Se não devolver, uma das
> conversões está errada.

---

## 3. Estrutura e interação

🔒 **`InputBase` permanece o elemento mais externo, intocado:**

```vue
<InputBase v-bind="props" ...>          <!-- NÃO MUDA -->
    <MaxBaseInput v-model="hexValue" /> <!-- campo hex -->
    <div class="p-colorpicker-preview" @click="toggle"></div>
    <MaxBaseOverlay ...>  <!-- painel HSB -->
</InputBase>
```

`src/components/InputBase.vue` não é alterado por este item.

### Interação

- **Quadrado SB**: `mousedown` inicia arraste, `mousemove` no `document` atualiza,
  `mouseup` no `document` encerra. Registre os listeners no **document**, não no
  elemento — senão o arraste "solta" ao sair do quadrado.
- **Barra de matiz**: mesma mecânica no eixo vertical.
- **Limpeza**: remova os listeners de `document` em `mouseup` **e** em
  `onBeforeUnmount`. Arraste com listener órfão trava a UI da app inteira.
- **Touch**: registre também `touchstart`/`touchmove`/`touchend`.

### Acessibilidade (o `ColorPicker` do PrimeVue é fraco aqui — faça melhor)

- o campo de texto hex é o caminho acessível principal: mantenha-o editável e validado;
- dê ao quadrado e à barra `role="slider"` com `aria-valuenow`, `aria-valuemin`,
  `aria-valuemax` e `aria-label` ("Saturação e brilho", "Matiz");
- suporte setas do teclado para ajuste fino em ambos;
- o preview da cor precisa de um texto associado (o valor hex), não só o quadrado
  colorido — cor sozinha não é informação acessível.

---

## 4. Teste — `tests/components/MaxColorPicker.test.ts` (criar)

Escreva contra a versão atual primeiro, confirme verde, depois migre.

1. renderiza o input de texto com o valor da cor;
2. clicar no gatilho abre o painel;
3. digitar um hex válido emite `update:modelValue`;
4. hex inválido **não** emite (e não gera `NaN`);
5. aceita hex de 3 dígitos (`#f00`);
6. aceita hex com e sem `#`;
7. **round-trip** `hex → hsb → hex` preserva o valor;
8. `hsbToRgb` correto para os casos canônicos: vermelho puro (0,100,100) → `ff0000`,
   verde (120,100,100) → `00ff00`, azul (240,100,100) → `0000ff`, branco (0,0,100) →
   `ffffff`, preto (0,0,0) → `000000`;
9. arrastar no quadrado atualiza saturação/brilho;
10. arrastar na barra atualiza o matiz;
11. `disabled` impede a abertura;
12. listeners de `document` removidos ao desmontar;
13. `format="rgb"` emite no formato certo (se suportado);
14. setas do teclado ajustam os sliders.

---

## 5. Checklist

- [ ] Teste baseline criado e verde **antes** da migração
- [ ] Sem PrimeVue
- [ ] 🔒 `<InputBase>` continua sendo o elemento mais externo, com as mesmas props
- [ ] 🔒 `git diff --stat src/components/InputBase.vue` → vazio (arquivo intocado)
- [ ] Formato de saída idêntico ao atual (com ou sem `#` — o Max prevalece)
- [ ] Conversões validadas nos casos canônicos (teste 8)
- [ ] Round-trip preserva valor (teste 7)
- [ ] Sem vazamento de listeners de document (teste 12)
- [ ] `role="slider"` + teclado
- [ ] `type-check`, `lint`, `test` OK
