# Plano de Migração — MaxInputToggle

> Plano autossuficiente para remover a dependência do PrimeVue do componente
> `MaxInputToggle`, substituindo o `ToggleSwitch` do PrimeVue por um toggle em CSS puro.
> Uma IA futura deve conseguir executar este plano lendo apenas este arquivo + o fonte
> referenciado.

---

## 1. Componente

- **Nome:** `MaxInputToggle`
- **Arquivo:** `src/components/MaxInputToggle.vue`
- **Nível de dificuldade:** `baixa`
- **Descrição da migração:** Substituir o `ToggleSwitch` do PrimeVue por um toggle
  implementado em CSS puro (checkbox nativo estilizado ou `<button role="switch">`).
  **NÃO usa `InputBase`.** Deve manter o `v-model` e todo o comportamento observável.
- **Export/aliases (não alterar):** exportado em `src/index.ts` (linha 78) como
  `MaxInputToggle`. Aliases no `src/components-manifest.json`: `MaxInputToggle`,
  `max_input_toggle`, `max-input-toggle`, `InputToggle`, `input_toggle`, `input-toggle`.
  Como não há criação de novo arquivo `.vue`, **não é necessário** rodar
  `generateResolver.ts` (o manifesto permanece válido). Se ainda assim for regenerado, o
  resultado deve ser idêntico.

---

## 2. Dependências do PrimeVue (trechos reais)

Há **uma única** dependência do PrimeVue: o componente `ToggleSwitch`.

### 2.1 Import (linha 26)
```ts
import ToggleSwitch from 'primevue/toggleswitch';
```

### 2.2 Uso no template (linha 14)
```html
<div class="input-toggle-field-input">
    <ToggleSwitch v-model="modelvalue" @change="update_value" />
</div>
```

### 2.3 CSS que estiliza a estrutura interna do PrimeVue (linhas 153–168)
O estilo atual sobrepõe as classes internas do PrimeVue (`.p-toggleswitch`,
`.p-toggleswitch-handle`, `.p-toggleswitch-checked`). **Esses seletores deixarão de
existir** e devem ser substituídos por seletores da nova marcação:
```scss
.p-toggleswitch {
    max-height: 18px;
}

.p-toggleswitch-handle {
    top: 11px;
    width: 12px;
    height: 12px;
    left: 4px;
}

.p-toggleswitch-checked {
    .p-toggleswitch-handle {
        left: calc(100% - 16px);
    }
}
```

> Observação: **não há tokens de tema específicos de toggleswitch** definidos no preset
> `MaxStyle` (`src/styles/style.ts`). A aparência da "trilha" (track) e do "handle" hoje
> vem do preset padrão do PrimeVue + dessas sobreposições. Isso significa que a cor
> exata da trilha ligada/desligada precisa ser **fixada explicitamente** na nova
> implementação em CSS (ver seção 7), pois não havia customização de cor no fonte —
> apenas de tamanho/posição.

---

## 3. Dependências internas

- **`InputBase`:** **NÃO é usado** por este componente (confirmado no template — a raiz
  é uma `<div class="input-toggle-field-main-div">`). Não introduzir `InputBase`.
- **Stores (`src/stores`):** nenhuma.
- **Helpers (`src/helpers`):** nenhum.
- **`@maxvue/max-use` (`../MaxUse`):** nenhuma dependência.
- **Vue APIs usadas (manter):** `ref`, `computed`, `watch`, `useAttrs` de `vue`.
- **Variáveis CSS do tema Max usadas (devem continuar resolvendo):**
  - `--background-0` (fundo) — `src/themes/colors.scss`
  - `--background-600` (label) — `src/themes/colors.scss`
  - `--background-650` (`#74869A`, labels true/false) — `src/themes/colors.scss:751`
  - `--blue-800` (`#004860`, label ativo) — `src/themes/colors.scss:491`
  - `--max-inputtext-border-color` (borda quando `labeled`) — token do preset Max
  - Cores novas para a trilha/handle (ver seção 7): usar `--blue-600` (`#2EA4BC`,
    `colors.scss:483`) para o estado ligado e `--background-300`/`--background-650` para
    o estado desligado, mantendo coerência visual com o resto da lib.

---

## 4. API pública a preservar

A migração deve ser **transparente** para quem consome a lib. Tudo abaixo é observável
e não pode mudar.

### 4.1 Props (`defineProps` + `withDefaults`)
```ts
withDefaults(
    defineProps<{
        modelValue: any;
        trueLabel?: string;
        falseLabel?: string;
        trueValue?: any;
        falseValue?: any;
    }>(),
    { modelValue: false, trueValue: true, falseValue: false }
);
```
- `modelValue: any` — default `false`.
- `trueLabel?: string`, `falseLabel?: string` — rótulos laterais opcionais.
- `trueValue?: any` — default `true`.
- `falseValue?: any` — default `false`.

### 4.2 Emits
```ts
const emit = defineEmits(['update:modelValue']);
```
- Emite `update:modelValue` (para o `v-model`) — **manter exatamente esse nome**.

### 4.3 v-model
- Suporta `v-model` (via `modelValue` + `update:modelValue`).
- Estado interno: `const modelvalue = ref(props.modelValue);` sincronizado nos dois
  sentidos por dois `watch`:
  - `watch(modelvalue, val => emit('update:modelValue', val))`
  - `watch(() => props.modelValue, val => { modelvalue.value = val; })`

> ⚠️ **Detalhe de compatibilidade de testes:** o teste
> `tests/components/MaxInputToggle.test.ts` acessa `(wrapper.vm as any).modelvalue`
> (linha 51) e chama `(wrapper.vm as any).update_value()` (linha 71). Portanto os nomes
> internos `modelvalue` (ref) e `update_value` (função) **devem ser preservados** e
> continuar expostos na instância. Manter os dois `watch` para que
> `setProps({ modelValue })` continue atualizando `modelvalue`.

### 4.4 Attrs consumidos via `useAttrs` (fallthrough) — preservar
```ts
const attrs: any = useAttrs();
```
- `attrs.label` — quando definido, exibe o bloco de label superior e ativa a classe
  `labeled` (marcação e borda). Presença é testada por `!== undefined`.
- `attrs.labelCenter` — quando definido, adiciona a classe `label-center`.
- Fallbacks de rótulo (mantidos nos `computed`):
  ```ts
  const trueLabel  = computed(() => props.trueLabel  ?? attrs.labelTrue  ?? attrs['true-label']  ?? null);
  const falseLabel = computed(() => props.falseLabel ?? attrs.labelFalse ?? attrs['false-label'] ?? null);
  const trueValue  = computed(() => props.trueValue  ?? true);
  const falseValue = computed(() => props.falseValue ?? false);
  ```
- Atributo `leftalign` (usado apenas no CSS via seletor `&[leftalign]`) — como é um
  attr de fallthrough aplicado ao elemento raiz, **manter o seletor CSS**. Não é
  necessário código JS; basta preservar a marcação da raiz e o bloco `&[leftalign]`.

### 4.5 Slots
- Nenhum slot é usado atualmente. Não introduzir slots novos.

### 4.6 Comportamento observável
- Comparação de rótulo ativo: a classe `active` é aplicada ao label lateral quando o
  valor corrente é igual ao `falseValue`/`trueValue`:
  - label falso: `falseValue === modelvalue`
  - label verdadeiro: `trueValue === modelvalue`
  - **Atenção:** no fonte atual a comparação usa `modelvalue` (o ref, valor bruto),
    não `modelValue` prop. Preservar essa semântica (comparar contra o `.value` do ref).
- Estrutura DOM esperada pelos testes (classes que **devem** continuar existindo):
  - `.input-toggle-field-main-div` (raiz) + classe `labeled` quando `attrs.label`
  - `.input-toggle-field-label-main-div` + classe `label-center` quando `attrs.labelCenter`
  - `.input-toggle-field-label-div` (texto do label superior)
  - `.input-toggle-field-input-div` (+ `labeled`)
  - `.input-toggle-field` (+ `labeled`)
  - `.input-toggle-field-label` (dois nós quando ambos rótulos definidos; classe
    `active` conforme valor)
  - `.input-toggle-field-input` (contêiner do switch)

---

## 5. Estratégia de substituição

**Trocar o `<ToggleSwitch>` do PrimeVue por um toggle em CSS puro**, sem bibliotecas
externas (nível `baixa`). Recomenda-se **checkbox nativo estilizado** por acessibilidade
e por facilitar o binding com `v-model`.

### 5.1 Abordagem recomendada — `<input type="checkbox">` estilizado
- Substituir a linha:
  ```html
  <ToggleSwitch v-model="modelvalue" @change="update_value" />
  ```
  por um checkbox nativo dentro de `.input-toggle-field-input`, por exemplo:
  ```html
  <label class="max-toggleswitch">
      <input
          type="checkbox"
          class="max-toggleswitch-input"
          :checked="modelvalue === trueValue"
          @change="on_toggle(($event.target as HTMLInputElement).checked)"
      />
      <span class="max-toggleswitch-slider"></span>
  </label>
  ```
- O `:checked` deve refletir o estado atual comparando com `trueValue`
  (`modelvalue === trueValue`). Ao trocar, definir `modelvalue.value` para `trueValue`
  ou `falseValue` conforme `checked`, preservando os valores customizados
  (`trueValue`/`falseValue`), e depois emitir.

### 5.2 Por que NÃO usar `v-model` direto no checkbox nativo
O `v-model` de um checkbox nativo grava `true`/`false` booleanos, o que **quebraria**
`trueValue`/`falseValue` customizados. Por isso usa-se `:checked` + `@change` com um
handler que mapeia para `trueValue`/`falseValue`. O ref interno `modelvalue` continua
sendo a "fonte da verdade" e continua guardando o valor bruto (compatível com os `watch`
e com as comparações de `active`).

### 5.3 Handler
Manter `update_value` (compatibilidade com teste) e adicionar mapeamento de valor:
```ts
const on_toggle = (checked: boolean) => {
    modelvalue.value = checked ? trueValue.value : falseValue.value;
    update_value();
};
```
- `update_value` continua fazendo `emit('update:modelValue', modelvalue.value)`.
- O `watch(modelvalue, ...)` também emitirá; para evitar emissão dupla, pode-se **manter
  apenas o `watch`** e chamar `update_value` só para compatibilidade — ou aceitar a
  emissão redundante (comportamento já existente no fonte: havia `@change` + `watch`).
  **Recomendação:** manter o comportamento atual (não otimizar a emissão dupla) para
  reduzir risco de regressão, já que o fonte original também tinha `@change="update_value"`
  + `watch(modelvalue)`.

### 5.4 Acessibilidade (melhoria de baixo risco)
- O checkbox nativo já é focável e navegável por teclado (Espaço) — vantagem sobre a
  versão PrimeVue. Adicionar `role="switch"` não é obrigatório; se adicionar, use
  `:aria-checked`. Opcional: `aria-label` derivado do label. Não é requisito da API.

---

## 6. Passos de implementação

Executar **apenas** em `src/components/MaxInputToggle.vue`. Seguir as convenções do
projeto: `<script setup lang="ts">`, indentação de 4 espaços, aspas simples, ponto e
vírgula, sem vírgula final, ordem Template → Script → Style.

1. **Remover o import do PrimeVue** (linha 26): apagar
   `import ToggleSwitch from 'primevue/toggleswitch';`.

2. **Substituir o nó `<ToggleSwitch>`** (linha 14) pela marcação de toggle CSS puro
   (checkbox nativo + slider), conforme seção 5.1, dentro de
   `.input-toggle-field-input`.

3. **Adicionar o handler `on_toggle`** no `<script setup>` (seção 5.3), mapeando
   `checked` → `trueValue`/`falseValue` e chamando `update_value`.

4. **Preservar** todo o restante do `<script setup>` sem alterações:
   - `const attrs: any = useAttrs();`
   - o bloco `withDefaults(defineProps<{...}>(), {...})`
   - `const emit = defineEmits(['update:modelValue']);`
   - `const modelvalue = ref(props.modelValue);`
   - os dois `watch` (modelvalue → emit; props.modelValue → modelvalue)
   - os `computed` `trueLabel`, `falseLabel`, `trueValue`, `falseValue`
   - a função `update_value`
   > `useAttrs` continua necessário (label/labelCenter). `ref`, `computed`, `watch`
   > permanecem importados.

5. **Atualizar o bloco `<style lang="scss">`:**
   - Manter intactos todos os seletores de layout externo (`.input-toggle-field-main-div`
     e descendentes, `&.labeled`, `&[leftalign]`, `.label-center`, `.input-toggle-field`,
     `.input-toggle-field-label` + `.active`, etc.).
   - **Remover** os três blocos que referenciam classes do PrimeVue
     (`.p-toggleswitch`, `.p-toggleswitch-handle`, `.p-toggleswitch-checked`).
   - **Adicionar** o CSS do novo toggle (`.max-toggleswitch`, `.max-toggleswitch-input`,
     `.max-toggleswitch-slider`) reproduzindo as dimensões antigas (ver seção 7).

6. **Não** rodar `generateResolver.ts` (nenhum arquivo `.vue` novo). Confirmar que o
   manifesto e os aliases permanecem inalterados.

7. **Verificar dependências residuais do PrimeVue no projeto** para este componente:
   `grep -rn "toggleswitch\|ToggleSwitch" src/` deve retornar **apenas** ocorrências
   fora deste componente (se houver) e nenhuma dentro de `MaxInputToggle.vue`.

---

## 7. Estilos

Objetivo: reproduzir a aparência do toggle anterior. As dimensões vêm das sobreposições
do fonte original.

### 7.1 Dimensões-alvo (do CSS antigo do PrimeVue sobreposto)
- Track: altura ~18px (`.p-toggleswitch { max-height: 18px; }`), largura padrão do
  toggle (~34–40px). O container `.input-toggle-field-input` tem `padding: 0 10px;` e
  `height: 17px;`.
- Handle: `12px × 12px`, `top: 11px`, posição desligada `left: 4px`, posição ligada
  `left: calc(100% - 16px)` (mesma matemática do fonte).

### 7.2 CSS puro sugerido (adicionar dentro de `.input-toggle-field-input-div`)
> Substitui os blocos `.p-toggleswitch*`. Ajustar largura da track para ~34px para
> casar com o `left: calc(100% - 16px)` do handle de 12px.
```scss
.max-toggleswitch {
    position: relative;
    display: inline-block;
    width: 34px;
    height: 18px;
    cursor: pointer;

    .max-toggleswitch-input {
        position: absolute;
        opacity: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        cursor: pointer;
    }

    .max-toggleswitch-slider {
        position: absolute;
        inset: 0;
        border-radius: 999px;
        background-color: var(--background-300);
        transition: background-color 0.2s ease;

        &::before {
            content: '';
            position: absolute;
            width: 12px;
            height: 12px;
            top: 3px;
            left: 4px;
            border-radius: 50%;
            background-color: var(--background-0);
            transition: left 0.2s ease;
        }
    }

    .max-toggleswitch-input:checked + .max-toggleswitch-slider {
        background-color: var(--blue-600);

        &::before {
            left: calc(100% - 16px);
        }
    }

    .max-toggleswitch-input:focus-visible + .max-toggleswitch-slider {
        outline: 2px solid var(--blue-600);
        outline-offset: 1px;
    }
}
```

### 7.3 Variáveis CSS a usar (não hardcodar hex quando houver token)
- Fundo geral / handle: `var(--background-0)`
- Trilha desligada: `var(--background-300)` (fallback `var(--background-650)`)
- Trilha ligada / foco: `var(--blue-600)`
- Labels laterais: `var(--background-650)`; ativo: `var(--blue-800)`
- Label superior: `var(--background-600)`; borda `labeled`: `var(--max-inputtext-border-color)`

> Se o time preferir fidelidade máxima à cor original do preset PrimeVue, comparar
> visualmente no playground e ajustar o token da trilha ligada (a lib não define cor de
> toggle no `MaxStyle`, então a cor anterior era o padrão do PrimeVue; usar `--blue-600`
> mantém coerência com a identidade Max).

### 7.4 UnoCSS
Não é necessário. O componente usa exclusivamente SCSS escopado + variáveis de tema.
Manter no bloco `<style lang="scss">`.

---

## 8. Testes / verificação

### 8.1 Arquivo de teste existente
`tests/components/MaxInputToggle.test.ts` — **deve continuar passando**. Pontos que o
teste depende (e que este plano preserva):
- Monta o componente e verifica `.input-toggle-field-label-div`,
  `.input-toggle-field-label-main-div.label-center`, `.input-toggle-field-label`
  (2 nós), classe `active`.
- Resolve `trueLabel`/`falseLabel` de props e de attrs (`true-label`/`false-label`).
- Acessa `(wrapper.vm as any).modelvalue` após `setProps({ modelValue: 'test' })`
  → exige o ref `modelvalue` e o `watch(() => props.modelValue)`.
- Chama `(wrapper.vm as any).update_value()` → exige a função `update_value` exposta.

### 8.2 ⚠️ Testes que precisam de atualização
Dois testes usam `stubs: { ToggleSwitch: true }` e
`wrapper.findComponent({ name: 'ToggleSwitch' })` (linhas 9, 27, 39, 43, 58, 69). Após a
migração o `ToggleSwitch` **não existe mais**. É necessário:
- Remover `global: { stubs: { ToggleSwitch: true } }` de todos os casos.
- No teste "sincroniza prop modelValue..." (linha 36–52): substituir a simulação
  `toggle.vm.$emit('update:modelValue', true)` por interação com o checkbox nativo, por
  exemplo:
  ```ts
  const input = wrapper.find('input[type="checkbox"]');
  await input.setValue(true);
  expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe(true);
  ```
  Manter a segunda parte do teste (`setProps` + `modelvalue === 'test'`) inalterada.
- Os demais casos (labels, active, update_value) não dependem do `ToggleSwitch` e só
  precisam da remoção do stub.

### 8.3 Comandos de verificação
```bash
npx vitest run tests/components/MaxInputToggle.test.ts   # testes do componente
npm run type-check                                        # vue-tsc
npm run lint                                              # ESLint + Stylelint
grep -rn "toggleswitch\|ToggleSwitch" src/components/MaxInputToggle.vue  # deve ser vazio
```

### 8.4 Checklist manual (playground: `npm run dev:playground`)
- [ ] `v-model` reflete cliques (ligar/desligar) e navegação por teclado (Tab + Espaço).
- [ ] `trueValue`/`falseValue` customizados (ex.: `'sim'`/`'nao'`) gravam o valor certo
      no `v-model`.
- [ ] Rótulos laterais aparecem e a classe `active` acompanha o valor.
- [ ] Label superior (`label`) e `labelCenter` renderizam como antes; borda no modo
      `labeled`.
- [ ] Atributo `leftalign` continua alinhando à esquerda.
- [ ] Aparência (tamanho da trilha, handle, transição) equivalente à anterior.

---

## 9. Skills necessárias

Selecionadas de `.claude/skills` (apenas as pertinentes a este componente de nível
`baixa`, sem InputBase, sem stores, sem libs externas):

- `.claude/skills/vue-max-components-ui-development-best-practices` — convenções da
  própria lib (estrutura `.vue`, exports/aliases, padrões de componente Max). Base.
- `.claude/skills/vue-typescript-best-practices` — tipagem em
  `<script setup lang="ts">` (`defineProps`/`defineEmits`, `any`, handler tipado do
  evento do checkbox).
- `.claude/skills/vue-unocss-styling-best-practices` — variáveis CSS do tema Max e
  convenções de estilo (mesmo usando SCSS, garante uso correto dos tokens `--blue-600`,
  `--background-*`).
- `.claude/skills/vue-eslint-stylelint-quality-standards` — padrões de lint/estilo
  (4 espaços, aspas simples, sem vírgula final) exigidos pelo `npm run lint`.
- `.claude/skills/vue-vitest-testing-best-practices` — necessária para reescrever os
  testes que hoje usam `stub`/`findComponent({ name: 'ToggleSwitch' })` para interagir
  com o checkbox nativo.
- `.claude/skills/vue-inputs-masks-validation-best-practices` — padrões de componentes
  de input com `v-model` na lib (mapeamento `trueValue`/`falseValue`, sincronização de
  estado).
- `.claude/skills/frontend-design-best-practices` — fidelidade visual do toggle CSS
  puro (dimensões, transição, estados ligado/desligado/foco).

---

## 10. Riscos e pontos de atenção

1. **Emissão dupla de `update:modelValue`.** O fonte original já tinha `@change` +
   `watch(modelvalue)`. Ao manter `update_value` + o `watch`, pode haver duas emissões
   por clique. Isso **já existia**; não "corrigir" agressivamente para evitar regressão.
   Se optar por unificar, garantir que os testes de emissão continuem válidos.

2. **`trueValue`/`falseValue` customizados.** NÃO usar `v-model` direto no checkbox
   nativo (gravaria booleano). Usar `:checked="modelvalue === trueValue"` + handler que
   mapeia para `trueValue`/`falseValue`. Este é o ponto mais fácil de quebrar.

3. **Nomes internos expostos.** Os testes acessam `modelvalue` (ref) e `update_value`
   (função) via `wrapper.vm`. Renomear qualquer um deles quebra os testes. Preservar.

4. **Semântica de `active`.** A comparação usa o ref `modelvalue` (valor bruto) contra
   `trueValue`/`falseValue`. Manter exatamente (`falseValue === modelvalue` /
   `trueValue === modelvalue`).

5. **Cor da trilha.** Não existe token de toggle no `MaxStyle`; a cor anterior vinha do
   preset padrão do PrimeVue. A nova cor (`--blue-600`) é uma decisão de fidelidade —
   validar visualmente no playground e alinhar com o time se houver marca específica.

6. **Seletores `.p-toggleswitch*` removidos.** Confirmar que nenhum outro componente ou
   app consumidor depende dessas classes especificamente para este toggle (busca
   `grep -rn "p-toggleswitch" src/`). São classes globais do PrimeVue; ao migrar este
   componente, elas deixam de ser geradas por ele.

7. **Testes com `stub: ToggleSwitch`.** Vão falhar silenciosamente ou dar falso-positivo
   se não forem atualizados (o stub de um componente inexistente não renderiza nada).
   Atualizar conforme seção 8.2 é **obrigatório** para a migração ser considerada
   completa.

8. **Ordem recomendada:** este componente é **independente** (não depende de `InputBase`
   nem de outros componentes migrados), portanto pode ser migrado a qualquer momento,
   inclusive em paralelo com os demais. Sem dependências transitivas.

9. **Acessibilidade — ganho colateral.** O checkbox nativo melhora navegação por teclado
   e leitores de tela em relação à versão anterior; não alterar a API por isso, apenas
   documentar como benefício.
