# Plano 03 — `MaxBaseSpinner` (substitui `primevue/progressspinner`)

| | |
|---|---|
| **id** | 3 |
| **Arquivo a criar** | `src/components/base/MaxBaseSpinner.vue` |
| **Primitiva eliminada** | `ProgressSpinner` |
| **Depende de** | — |
| **Destrava** | ids 22 (`MaxPdfView`), 32 (`MaxInputFileUpload`) |

O item mais simples da migração. Faça-o cedo para ganhar tração.

---

## 1. O `ProgressSpinner` do PrimeVue

É um SVG com `<circle>` e duas animações CSS: rotação do SVG e `stroke-dasharray`
animado no círculo (o efeito de "cobra" que cresce e encolhe).

### Props

| Prop | Tipo | Default | Efeito |
|---|---|---|---|
| `strokeWidth` | `string` | `'2'` | espessura do traço |
| `fill` | `string` | `'none'` | preenchimento do círculo |
| `animationDuration` | `string` | `'2s'` | duração da rotação |

### Markup gerado

```html
<div class="p-progressspinner" role="progressbar" aria-busy="true">
    <svg class="p-progressspinner-spin" viewBox="25 25 50 50">
        <circle class="p-progressspinner-circle"
                cx="50" cy="50" r="20"
                fill="none" stroke-width="2" stroke-miterlimit="10" />
    </svg>
</div>
```

O `viewBox="25 25 50 50"` com `r="20"` é o padrão de spinner circular do Material —
mantenha esses números.

---

## 2. Uso neste repositório

```
MaxPdfView.vue           <ProgressSpinner />   (sem props)
MaxInputFileUpload.vue   <ProgressSpinner />   (sem props)
```

Nenhum dos dois passa props. A superfície real é mínima — mas implemente as três props
mesmo assim (requisito de paridade de API do briefing).

---

## 3. Implementação

```vue
<template>
    <div class="p-progressspinner max-base-spinner" role="progressbar" aria-busy="true" :aria-label="ariaLabel">
        <svg class="p-progressspinner-spin" viewBox="25 25 50 50" :style="{ animationDuration }">
            <circle
                class="p-progressspinner-circle"
                cx="50" cy="50" r="20"
                :fill="fill"
                :stroke-width="strokeWidth"
                stroke-miterlimit="10"
            />
        </svg>
    </div>
</template>

<script setup lang="ts">
    withDefaults(
        defineProps<{
            strokeWidth?: string;
            fill?: string;
            animationDuration?: string;
            ariaLabel?: string;
        }>(),
        { strokeWidth: '2', fill: 'none', animationDuration: '2s', ariaLabel: 'Carregando' }
    );
</script>

<style lang="scss">
.p-progressspinner {
    position: relative;
    display: inline-block;
    width: 100px;
    height: 100px;

    .p-progressspinner-spin {
        width: 100%;
        height: 100%;
        transform-origin: center center;
        animation: p-progressspinner-rotate 2s linear infinite;
    }

    .p-progressspinner-circle {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: 0;
        stroke: var(--max-primary-500);
        animation: p-progressspinner-dash 1.5s ease-in-out infinite;
        stroke-linecap: round;
    }
}

@keyframes p-progressspinner-rotate {
    100% { transform: rotate(360deg); }
}

@keyframes p-progressspinner-dash {
    0%   { stroke-dasharray: 1, 200;   stroke-dashoffset: 0; }
    50%  { stroke-dasharray: 89, 200;  stroke-dashoffset: -35px; }
    100% { stroke-dasharray: 89, 200;  stroke-dashoffset: -124px; }
}

@media (prefers-reduced-motion: reduce) {
    .p-progressspinner .p-progressspinner-spin,
    .p-progressspinner .p-progressspinner-circle {
        animation-duration: 4s;   /* desacelera; não remove — é indicador de progresso */
    }
}
</style>
```

### Diferenças propositais em relação ao PrimeVue

1. **`stroke` fixo em `var(--max-primary-500)`.** O PrimeVue animava a cor ciclando por
   quatro tons (vermelho/azul/amarelo/verde do Material). Isso nunca combinou com o tema
   Max. Cor única é a escolha certa aqui — registre em `notas`.
2. **`prefers-reduced-motion` respeitado** — o PrimeVue não faz isso.
3. **`role="progressbar"` + `aria-label`** explícitos.

---

## 4. Teste — `tests/components/base/MaxBaseSpinner.test.ts` (criar)

1. renderiza `<svg>` com `viewBox="25 25 50 50"`;
2. `role="progressbar"` e `aria-busy="true"` presentes;
3. classes `p-progressspinner` e `p-progressspinner-spin` aplicadas;
4. `strokeWidth` customizado chega ao atributo `stroke-width` do `<circle>`;
5. `fill` customizado é aplicado;
6. `animationDuration` customizado vira `style` inline no `<svg>`;
7. `ariaLabel` customizado é refletido.

---

## 5. Checklist de conclusão

- [ ] Arquivo criado, zero referências a PrimeVue
- [ ] As 7 asserções passam
- [ ] Visual comparado lado a lado com o PrimeVue no playground **antes** de remover
- [ ] Não exportado em `src/index.ts`
