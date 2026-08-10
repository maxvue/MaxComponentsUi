# Plano de Migração — MaxInputSwitch

> Plano autossuficiente para remover a dependência do PrimeVue do componente
> `MaxInputSwitch`, substituindo o `ToggleSwitch` do PrimeVue por um toggle em **CSS puro**
> (checkbox nativo estilizado), preservando 100% da API pública, estilos e comportamento.
> Uma IA futura deve conseguir executar este plano lendo apenas este arquivo e o código-fonte
> referenciado.

---

## 1. Componente

- **Nome:** `MaxInputSwitch`
- **Arquivo:** `src/components/MaxInputSwitch.vue`
- **Export/alias:** `src/index.ts` linha `export { default as MaxInputSwitch } from './components/MaxInputSwitch.vue';` (único alias — manter).
- **Nível de dificuldade:** `baixa`
- **Descrição da migração:** Substituir `ToggleSwitch` do PrimeVue por um toggle em CSS puro
  (checkbox estilizado). Manter `InputBase`, o comportamento de `caution`/`isDone` e o `icon-right`.
- **Teste existente:** `tests/components/MaxInputSwitch.test.ts` (será necessário ajustar — ver seção 8).

---

## 2. Dependências do PrimeVue (trechos reais)

Todas as ocorrências de PrimeVue **dentro** de `MaxInputSwitch.vue`:

### 2.1. Import direto (linha 18)
```ts
import ToggleSwitch from 'primevue/toggleswitch';
```

### 2.2. Uso no template (linha 4)
```html
<ToggleSwitch v-bind="attrs" v-model="temp_value" />
```

### 2.3. Estilos que referenciam classes do PrimeVue (bloco `<style lang="scss">`, linhas 97-99)
```scss
.p-toggleswitch {
    grid-column: 1;
}
```

> **Observação importante sobre o DOM real do PrimeVue `ToggleSwitch`.**
> O `ToggleSwitch` do PrimeVue 4 renderiza a seguinte estrutura (verificada em
> `node_modules/primevue/toggleswitch/index.mjs`):
> ```html
> <div class="p-toggleswitch" data-p-checked data-p-disabled>
>     <input type="checkbox" role="switch" class="p-toggleswitch-input" checked tabindex ...>
>     <div class="p-toggleswitch-slider">
>         <div class="p-toggleswitch-handle"></div>
>     </div>
> </div>
> ```
> A classe modificadora quando ligado é `.p-toggleswitch-checked` (usada por `MaxInputToggle.vue`
> como referência de dimensionamento do handle). O componente emite `change`, `focus`, `blur` e
> usa `v-model` (`update:modelValue`). Aceita `trueValue`/`falseValue` (default `true`/`false`),
> `disabled`, `readonly`, `tabindex`, `inputId`.

> **Nota:** `MaxInputSwitch.vue` **não** importa `InputBase` do PrimeVue diretamente — as
> dependências PrimeVue do `InputBase` (FloatLabel/IconField/InputIcon/Message) são tratadas no
> plano separado de `InputBase` (ver seção 10 — ordem).

---

## 3. Dependências internas (preservar)

| Dependência | Origem | Papel | Ação na migração |
|-------------|--------|-------|------------------|
| `InputBase` | `./InputBase.vue` (linha 17) | Wrapper de layout, ícones, mensagens, estados `done`/`caution`/`error`/`required` | **Preservar** o uso exatamente como está. Deve estar migrado ANTES (ver seção 10). |
| `useAttrs` | `vue` (linha 16) | Repassa atributos extras (`disabled`, `tabindex`, `readonly`, classes, `id`, listeners) ao controle | **Preservar** — repassar `attrs` ao novo `<input type="checkbox">`. |
| `ref`, `computed`, `watch` | `vue` | Estado interno `temp_value`/`isDone` e sincronização com `modelValue` | **Preservar** integralmente. |

**Não há** dependência de stores Pinia (`useIconStore`/`usePopoverStore`/`useToastStore`),
helpers próprios, nem de `@maxvue/max-use` **dentro** deste componente. (O `@maxvue/max-use`
`hasContent` é usado apenas por `InputBase`, não por `MaxInputSwitch`.)

---

## 4. API pública a preservar

A migração deve ser **transparente** para consumidores. Nada abaixo pode mudar.

### 4.1. Props (de `defineProps`, linhas 22-56)
| Prop | Tipo | Default | Observação |
|------|------|---------|------------|
| `modelValue` | `boolean` | `false` | v-model principal |
| `question` | `string?` | — | rótulo exibido ao lado do switch (`.rotulo`) |
| `icon` | `string \| undefined` | — | repassado como `:icon-right` ao `InputBase` |
| `i` | `string \| undefined` | — | alias de ícone |
| `disabled` | `boolean \| undefined` | — | |
| `float` | `boolean \| undefined` | — | |
| `msg` | `string \| undefined` | — | |
| `message` | `string \| undefined` | — | |
| `iconMessage` | `string \| undefined` | — | |
| `label` | `string \| undefined` | — | |
| `done` | `boolean \| undefined` | `undefined` | estado de validação manual |
| `error` | `string \| boolean \| undefined` | — | |
| `targetValue` | `string` | — | mantido na assinatura mesmo sem uso interno |
| `caution` | `string \| boolean \| undefined` | `undefined` | |
| `required` | `boolean` | `false` | |

> Todas essas props (exceto as consumidas explicitamente: `modelValue`, `question`, `icon`,
> `caution`, `done`) são repassadas ao `InputBase` via `v-bind="props"`. **Manter esse
> `v-bind="props"` intacto.**

### 4.2. Emits
```ts
const emit = defineEmits(['update:modelValue']);
```
- Emite **`update:modelValue`** com o valor booleano de `temp_value`.
- **Comportamento observável a preservar (linhas 67-74):** o `watch(temp_value, ..., { immediate: true })`
  emite `update:modelValue` **imediatamente na montagem** e a cada alteração de `temp_value`.
  Também reseta `isDone.value = props.done ?? null` a cada mudança.

### 4.3. v-model
- v-model sobre `modelValue` (boolean). Bidirecional: mudança externa de `modelValue`
  atualiza `temp_value` (linhas 76-81); mudança interna emite `update:modelValue`.

### 4.4. Slots
- **Nenhum slot próprio** é exposto por `MaxInputSwitch`. Não adicionar slots novos.

### 4.5. Comportamento visual observável
- Renderiza um grid `auto 1fr`: switch à esquerda, texto `question` (`.rotulo`) à direita.
- Estado `caution` computado (linhas 62-65): usa `props.caution` se definido; senão `true`
  quando `isDone === false`.
- `:icon-right="icon ?? ''"` e `:done="isDone ?? undefined"` repassados ao `InputBase`.

---

## 5. Estratégia de substituição

**100% CSS puro / HTML nativo — nenhuma biblioteca headless necessária.** Este é o caso mais
simples da migração.

### 5.1. Substituir `<ToggleSwitch>` por um `<label>` com `<input type="checkbox">` estilizado
Padrão recomendado (checkbox nativo + slider CSS), que preserva acessibilidade (`role`/estado
nativos do checkbox) e o `v-model` do Vue:

```html
<label class="p-toggleswitch" :class="{ 'p-toggleswitch-checked': temp_value }">
    <input
        type="checkbox"
        class="p-toggleswitch-input"
        role="switch"
        v-bind="attrs"
        v-model="temp_value"
    />
    <span class="p-toggleswitch-slider">
        <span class="p-toggleswitch-handle"></span>
    </span>
</label>
```

### 5.2. Por que manter as classes `p-toggleswitch*`
- O SCSS atual do componente e do tema Max referenciam `.p-toggleswitch` (linha 97 deste
  componente) e `MaxInputToggle.vue` referencia `.p-toggleswitch-handle` /
  `.p-toggleswitch-checked`. **Reutilizar exatamente esses nomes de classe** garante que
  qualquer regra de tema/consumidor que os alveje continue funcionando e evita regressão visual.
- Alternativa (opcional, mais limpa): prefixar com `.max-switch`. **Não recomendado nesta fase**
  para não quebrar seletores externos; adiar para uma etapa de renomeação global após todos os
  componentes migrados.

### 5.3. v-model
- `v-model="temp_value"` num `<input type="checkbox">` já liga ao `checked` booleano — mantém a
  lógica interna (`temp_value: ref(props.modelValue)`) intacta. **Não alterar** o `<script setup>`.

### 5.4. `useAttrs`
- Continuar usando `v-bind="attrs"` **no `<input>`** (não no `<label>`), para que `disabled`,
  `tabindex`, `readonly`, `id`, `name` e listeners nativos (`@change`, `@focus`, `@blur`) caiam
  no controle real. Se preferir separar classes/estilo do container, use `inheritAttrs: false`
  — **porém** o componente atual não define `inheritAttrs`, então mantenha o comportamento
  padrão e apenas garanta que `attrs` vá ao `<input>`.

---

## 6. Passos de implementação

Execute na ordem. **Não** tocar no `<script setup>` além do import removido.

1. **Pré-requisito:** confirmar que `InputBase.vue` já foi migrado e não depende mais do PrimeVue
   (ver seção 10). Se não, **parar** — este componente renderiza dentro do `InputBase`.

2. **Remover o import do PrimeVue** em `MaxInputSwitch.vue`:
   - Apagar a linha 18: `import ToggleSwitch from 'primevue/toggleswitch';`.

3. **Substituir o elemento no template** (linha 4) pelo bloco de checkbox estilizado da seção 5.1.
   - Manter `v-bind="attrs"` e `v-model="temp_value"` **no `<input>`**.
   - Manter o wrapper `<div class="input-grid-switch">` e o `<div class="rotulo">{{ props.question }}</div>` inalterados.
   - Manter o `<InputBase v-bind="props" ...>` da linha 2 exatamente como está.

4. **Manter o `<script setup>` intacto**, exceto pela remoção do import (passo 2):
   - `temp_value`, `isDone`, `caution` computed, os dois `watch` e o `emit` **não mudam**.

5. **Adicionar o CSS do toggle** ao bloco `<style lang="scss">` (ver seção 7), preservando a
   regra `.p-toggleswitch { grid-column: 1; }` já existente e o `.rotulo`.

6. **Regenerar o resolver/manifest** apenas se o nome do arquivo mudar (não muda aqui). Como o
   arquivo continua `MaxInputSwitch.vue`, **não é necessário** rodar `generateResolver.ts`.
   (Rodar `npx tsx src/scripts/generateResolver.ts` só se houver dúvida.)

7. **Rodar verificações** (seção 8): type-check, lint, teste do componente, checagem visual no
   playground.

---

## 7. Estilos

### 7.1. Estilos a preservar (já existem no componente, linhas 84-107)
Manter integralmente:
```scss
.input-switch {
    outline: none !important;
}

.input-grid-switch {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    width: 100%;
    height: 100%;
    align-items: center;

    .p-toggleswitch {
        grid-column: 1;
    }

    .rotulo {
        text-align: left;
        width: 100%;
        font-size: 0.8rem;
        color: var(--background-700);
    }
}
```

### 7.2. CSS puro do toggle a adicionar (dentro de `.input-grid-switch`)
Reproduz a aparência do `ToggleSwitch` do PrimeVue. Dimensões alinhadas ao que
`MaxInputToggle.vue` usa como referência (handle ~12px, deslocamento `left: calc(100% - 16px)`
quando ligado). Ajustar se a comparação visual no playground divergir do original.

```scss
.p-toggleswitch {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: 34px;
    height: 18px;
    cursor: pointer;

    // checkbox nativo escondido (mas acessível)
    .p-toggleswitch-input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        opacity: 0;
        cursor: pointer;
        z-index: 1;
    }

    .p-toggleswitch-slider {
        position: absolute;
        inset: 0;
        border-radius: 999px;
        background: var(--background-300);
        transition: background-color 0.2s ease;
    }

    .p-toggleswitch-handle {
        position: absolute;
        top: 3px;
        left: 4px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--background-0, #fff);
        transition: left 0.2s ease, background-color 0.2s ease;
    }

    // estado ligado (via classe no label OU via :checked no input)
    &.p-toggleswitch-checked,
    &:has(.p-toggleswitch-input:checked) {
        .p-toggleswitch-slider {
            background: var(--max-primary-500);
        }

        .p-toggleswitch-handle {
            left: calc(100% - 16px);
        }
    }

    // desabilitado
    &:has(.p-toggleswitch-input:disabled) {
        opacity: 0.6;
        cursor: not-allowed;

        .p-toggleswitch-input {
            cursor: not-allowed;
        }
    }

    // foco por teclado (acessibilidade)
    .p-toggleswitch-input:focus-visible + .p-toggleswitch-slider {
        outline: 2px solid var(--max-primary-500);
        outline-offset: 2px;
    }
}
```

### 7.3. Variáveis de tema Max a usar (do preset `MaxStyle`)
- `var(--background-300)` — trilho desligado.
- `var(--max-primary-500)` — trilho ligado (cor primária). Alternativa: `var(--blue-600)`.
- `var(--background-0)` — cor do handle (branco). Se indefinida no tema, o fallback `#fff` cobre.
- `var(--background-700)` — cor do texto `.rotulo` (já existente, não mudar).

### 7.4. Fidelidade visual
- Comparar lado a lado com a versão anterior no `npm run dev:playground` (procurar a página que
  usa `MaxInputSwitch`). Ajustar `width`/`height`/`handle` até casar. As dimensões acima são um
  ponto de partida coerente com `MaxInputToggle.vue` (handle 12px, offset `calc(100% - 16px)`).
- `:has()` tem suporte amplo em navegadores modernos; se o alvo exigir compatibilidade legada,
  ligar/desligar via classe `.p-toggleswitch-checked` no `<label>` (`:class="{ 'p-toggleswitch-checked': temp_value }"`)
  já cobre o estado — o seletor `:has(...:checked)` é apenas reforço.

---

## 8. Testes / verificação

### 8.1. Teste existente a ajustar — `tests/components/MaxInputSwitch.test.ts`
O teste atual depende do PrimeVue de duas formas que **quebrarão** após a migração:

1. `global: { stubs: { ToggleSwitch: true } }` — o `ToggleSwitch` deixa de existir; o stub vira
   inócuo (pode ser removido, mas não quebra).
2. O caso **"emite update:modelValue ao clicar"** (linhas 21-30) faz:
   ```ts
   const toggle = wrapper.findComponent({ name: 'ToggleSwitch' });
   await toggle.vm.$emit('update:modelValue', true);
   ```
   Isso **falhará**, pois não haverá mais componente `ToggleSwitch`. **Substituir** por interação
   com o checkbox nativo:
   ```ts
   const checkbox = wrapper.find('input[type="checkbox"]');
   await checkbox.setValue(true);
   expect(wrapper.emitted('update:modelValue')).toBeTruthy();
   // índice [1] porque o watch immediate emite [0] na montagem (preservar essa expectativa)
   expect(wrapper.emitted('update:modelValue')?.[1][0]).toBe(true);
   ```
   > Atenção ao índice `[1]`: o teste original já contava com a emissão inicial do
   > `watch({ immediate: true })`. Preservar esse detalhe.

3. Os demais casos **continuam válidos** e não precisam de mudança:
   - "deve montar o componente corretamente"
   - "renderiza o question se fornecido" (`.rotulo`)
   - "computa caution corretamente" (props do `InputBase`)
   - "sincroniza prop modelValue com temp_value" (`setProps` + `temp_value`)

### 8.2. Comandos de verificação
```bash
npm run type-check
npm run lint
npx vitest run tests/components/MaxInputSwitch.test.ts
```

### 8.3. Checklist manual (playground)
- [ ] Clicar no toggle liga/desliga e o handle desliza.
- [ ] `v-model` externo reflete no toggle (mudar valor no pai atualiza o visual).
- [ ] `question` aparece à direita.
- [ ] `disabled` deixa o toggle inerte e esmaecido.
- [ ] `caution` (ou `done === false`) aciona o estilo de atenção do `InputBase` (label laranja).
- [ ] `icon` aparece à direita via `icon-right` do `InputBase`.
- [ ] Navegação por teclado: `Tab` foca, `Espaço` alterna (comportamento nativo do checkbox).
- [ ] Aparência visual idêntica (ou muito próxima) à versão PrimeVue.

### 8.4. Casos de borda
- `modelValue` inicial `true` → toggle já ligado na montagem.
- Emissão inicial de `update:modelValue` na montagem (watch immediate) — não deve ser removida.
- `attrs` extras (`tabindex`, `id`, `@change`) devem cair no `<input>`.

---

## 9. Skills necessárias

Skills selecionadas de `.claude/skills` (priorizando as `vue-`). Justificativa em uma linha cada.

| Skill (caminho) | Justificativa |
|-----------------|---------------|
| `.claude/skills/vue-max-components-ui-development-best-practices` | Convenções da própria lib (InputBase, ordem Template→Script→Style, aliases em `src/index.ts`) — base obrigatória. |
| `.claude/skills/vue-unocss-styling-best-practices` | Reproduzir a aparência com classes utilitárias e variáveis CSS do tema Max no toggle CSS puro. |
| `.claude/skills/frontend-design-best-practices` | Garantir fidelidade visual pixel-a-pixel do slider/handle em relação ao `ToggleSwitch` original. |
| `.claude/skills/vue-typescript-best-practices` | Manter a tipagem de `defineProps`/`defineEmits` em `<script setup lang="ts">` inalterada. |
| `.claude/skills/vue-eslint-stylelint-quality-standards` | Cumprir indentação de 4 espaços, aspas simples, sem trailing commas — passa em `npm run lint`. |
| `.claude/skills/vue-vitest-testing-best-practices` | Ajustar `MaxInputSwitch.test.ts` para interagir com o checkbox nativo em vez do stub `ToggleSwitch`. |

**Skills consideradas e descartadas:**
- `.claude/skills/vue-inputs-masks-validation-best-practices` — trata de **máscaras** (CPF, CEP,
  telefone, cartão) com Maska; um switch booleano não tem máscara. **Não aplicável.**
- `.claude/skills/vue-pinia-state-management-best-practices` — o componente não usa stores. **Não aplicável.**
- `.claude/skills/vue-keyboard-shortcuts-navigation-best-practices` — o checkbox nativo já provê
  navegação por teclado (Tab/Espaço); não há navegação customizada. **Não aplicável.**
- `.claude/skills/vue-floating-vue-tooltips-popovers-best-practices` — sem popover/tooltip. **Não aplicável.**

---

## 10. Riscos e pontos de atenção

1. **Ordem — `InputBase` primeiro (bloqueante).** `MaxInputSwitch` renderiza dentro de
   `<InputBase>` (linha 2). O `InputBase` ainda depende de PrimeVue (FloatLabel, IconField,
   InputIcon, Message). **Migrar `InputBase` ANTES** deste componente; caso contrário a
   independência do PrimeVue não é alcançada de fato (o import PrimeVue sobreviverá via
   `InputBase`). Este plano assume `InputBase` já migrado.

2. **Emissão inicial via `watch({ immediate: true })`.** É comportamento observável (o teste conta
   com o índice `[1]` das emissões). Não remover nem "otimizar" esse watch — pode quebrar
   consumidores que reagem à emissão inicial.

3. **Nomes de classe `p-toggleswitch*`.** São classes do PrimeVue reutilizadas propositalmente
   para preservar seletores de tema/consumidor (inclusive `MaxInputToggle.vue` referencia
   `.p-toggleswitch-handle`/`.p-toggleswitch-checked`). **Não renomear** nesta fase. Renomeação
   global (para `.max-switch`) deve ser uma etapa posterior coordenada.

4. **`MaxInputToggle.vue` é um componente separado** que **também** usa `ToggleSwitch` do PrimeVue
   (`import ToggleSwitch from 'primevue/toggleswitch'`) e tem seu próprio plano. **Não** confundir
   com `MaxInputSwitch`. Esta migração **não** deve alterar `MaxInputToggle.vue`, mas o CSS puro
   aqui pode servir de referência para o plano dele.

5. **`useAttrs` no elemento certo.** Repassar `v-bind="attrs"` ao `<input type="checkbox">`, não ao
   `<label>` container, para que `disabled`/`tabindex`/`id`/listeners nativos funcionem.

6. **`:has()` e compatibilidade.** O CSS usa `:has(...:checked)` como reforço; o estado principal
   é garantido pela classe `.p-toggleswitch-checked` ligada a `temp_value`. Se o alvo suportar
   apenas navegadores muito antigos, confiar na classe (funciona sem `:has`).

7. **Fidelidade de cor/tamanho.** As variáveis `--max-primary-500`, `--background-300`,
   `--background-0` e as dimensões (34x18, handle 12px) são estimativas coerentes com
   `MaxInputToggle.vue`; **validar visualmente** no playground e ajustar antes de concluir.

8. **Não alterar aliases/manifest.** O arquivo mantém o nome `MaxInputSwitch.vue`; não é preciso
   rodar `generateResolver.ts` nem tocar em `src/index.ts`.

9. **`prime/index.ts` continua reexportando `ToggleSwitch`.** A linha
   `export { default as ToggleSwitch } from 'primevue/toggleswitch';` em `src/prime/index.ts`
   pertence à camada de reexport raw do PrimeVue e **não** é responsabilidade deste plano —
   deixá-la intacta.
