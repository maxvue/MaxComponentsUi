# MaxTabs, MaxAccordion e MaxDrawer — Design

Data: 2026-08-04
Status: aprovado

## Objetivo

Adicionar três famílias de componentes à `@maxvue/max-components-ui` — Tabs, Accordion e Drawer — replicando a API pública e o comportamento do PrimeVue 4, porém **implementados do zero**, sem importar `primevue/tabs`, `primevue/accordion` ou `primevue/drawer`.

Hoje esses componentes só existem como re-exports crus em [`src/prime/index.ts`](../../../src/prime/index.ts). Como há um esforço ativo de independência do PrimeVue (ver [`CLAUDE.md`](../../../CLAUDE.md) e [`status-primevue.migration.yaml`](../../../status-primevue.migration.yaml)), criar wrappers hoje geraria três novas dívidas de migração amanhã. Implementação própria com API idêntica entrega o "copiar funcionamento do PrimeVue" sem a dependência.

## Decisões tomadas

| Questão | Decisão |
|---|---|
| Wrapper ou implementação própria? | **Implementação própria**, zero import de `primevue/*` |
| Formato da API | **Composta, idêntica ao PrimeVue v4** (drop-in por troca de nome de tag) |
| Estado do Drawer | **`v-model:visible` e também `:visible`** (two-way e controlado one-way) |
| `activeIndex` (depreciada na v4) | **Não implementar** |
| `unstyled` / pass-through | **Não implementar** (infra interna do PrimeVue) |
| Re-exports em `src/prime/index.ts` | **Remover** os substituídos (breaking change, ver abaixo) |
| Escopo | **Os três de uma vez** |

## Componentes

13 componentes novos em `src/components/`:

| Família | Componentes |
|---|---|
| Tabs | `MaxTabs`, `MaxTabList`, `MaxTab`, `MaxTabPanels`, `MaxTabPanel` |
| Accordion | `MaxAccordion`, `MaxAccordionPanel`, `MaxAccordionHeader`, `MaxAccordionContent` |
| Drawer | `MaxDrawer` |

Mais três peças de suporte em `src/composables/`:

- `useMaxTabs.ts` — `InjectionKey` tipada + contexto do Tabs
- `useMaxAccordion.ts` — `InjectionKey` tipada + contexto do Accordion
- `useFocusTrap.ts` — trap de foco e restauração, consumido pelo `MaxDrawer`

## Arquitetura

### Comunicação pai ↔ filho

Cada componente-raiz (`MaxTabs`, `MaxAccordion`) faz `provide` de um contexto reativo; os filhos fazem `inject`. Filhos nunca conversam entre si.

O contexto expõe:

- valor ativo (`value`) e o callback de seleção
- flags de comportamento: `lazy`, `multiple` (accordion), `selectOnFocus`, `tabindex`
- registro/desregistro de headers, para navegação por setas saber a ordem e quais estão `disabled`

Um `MaxTab` montado fora de um `MaxTabs` lança erro explícito em desenvolvimento em vez de falhar silenciosamente. O mesmo vale para os filhos do Accordion.

Nenhuma das três famílias usa store global do Pinia — o estado é local ao componente, como no PrimeVue. Isso é uma diferença deliberada em relação ao `MaxModal`, que usa `useModalStore` com um único `show_id` global; um `show_id` global impediria drawer e modal abertos ao mesmo tempo.

### API pública

Props verificadas diretamente no código-fonte do PrimeVue v4 (`BaseTabs.vue`, `BaseAccordion.vue`, `BaseDrawer.vue`), não reconstruídas de memória.

**MaxTabs**
| Prop | Tipo | Default |
|---|---|---|
| `value` | `string` | `undefined` |
| `lazy` | `boolean` | `false` |
| `scrollable` | `boolean` | `false` |
| `showNavigators` | `boolean` | `true` |
| `tabindex` | `number` | `0` |
| `selectOnFocus` | `boolean` | `false` |

Emit: `update:value`.

**MaxTab:** `value`, `disabled`, `as`, `asChild`
**MaxTabPanel:** `value`, `as`, `asChild`
**MaxTabList / MaxTabPanels:** sem props próprias além de `as`/`asChild`.

**MaxAccordion**
| Prop | Tipo | Default |
|---|---|---|
| `value` | `string \| string[]` | `undefined` |
| `multiple` | `boolean` | `false` |
| `lazy` | `boolean` | `false` |
| `tabindex` | `number` | `0` |
| `selectOnFocus` | `boolean` | `false` |
| `expandIcon` | `string` | `undefined` |
| `collapseIcon` | `string` | `undefined` |

Emits: `update:value`, `tab-open`, `tab-close`.

**MaxAccordionPanel:** `value`, `disabled`, `as`, `asChild`
**MaxAccordionHeader:** `as`, `asChild`, e `headerAriaLevel` (default `2`)
**MaxAccordionContent:** `as`, `asChild`

**MaxDrawer**
| Prop | Tipo | Default |
|---|---|---|
| `visible` | `boolean` | `false` |
| `position` | `'left' \| 'right' \| 'top' \| 'bottom' \| 'full'` | `'left'` |
| `header` | `string \| null` | `null` |
| `dismissable` | `boolean` | `true` |
| `showCloseIcon` | `boolean` | `true` |
| `modal` | `boolean` | `true` |
| `blockScroll` | `boolean` | `false` |
| `closeIcon` | `string` | `undefined` |
| `closeButtonProps` | `object` | `{ severity: 'secondary', text: true, rounded: true }` |
| `baseZIndex` | `number` | `0` |
| `autoZIndex` | `boolean` | `true` |

Emits: `update:visible`, `show`, `hide`, `after-hide`.
Slots: `header`, `default`, `footer`, `closeicon`, `container`.

O `visible` funciona tanto com `v-model:visible` (two-way) quanto como prop controlada one-way: o componente nunca muta o próprio estado diretamente, apenas emite `update:visible`, deixando o consumidor decidir. Adicionalmente, e seguindo o padrão do `MaxModal`, o `MaxDrawer` expõe via `defineExpose`: `open()`, `close()`, `toggle()` e `is_show`.

### Comportamento e acessibilidade

É aqui que mora a maior parte do trabalho real — é o que faz "funcionar igual ao PrimeVue".

**ARIA**
- Tabs: `role="tablist"` / `role="tab"` / `role="tabpanel"`, com `aria-selected`, `aria-controls`, `aria-labelledby`
- Accordion: header como `button` com `aria-expanded` e `aria-controls`; conteúdo como `role="region"` com `aria-labelledby`; headers desabilitados recebem `aria-disabled` e saem da navegação por teclado
- Drawer: `role="complementary"` e `aria-modal`

**Teclado**
- Tabs: `←`/`→` navegam entre headers pulando os `disabled`; `Home`/`End` vão ao primeiro/último; `Enter`/`Espaço` ativam; `PageUp`/`PageDown` vão ao primeiro/último
- Accordion: `↑`/`↓` navegam; `Home`/`End`; `Enter`/`Espaço` alternam o painel
- Ambos: com `selectOnFocus`, focar já ativa
- Drawer: `Tab`/`Shift+Tab` ciclam dentro do painel (trap), `Escape` fecha quando permitido

**Outros comportamentos**
- `lazy`: o conteúdo do painel só monta quando ativa pela primeira vez, permanecendo montado depois
- Tabs `scrollable`: botões de navegação aparecem no overflow (controlados por `showNavigators`) e o tab ativo é rolado para dentro da viewport
- Drawer: teleport para `body`; clique no backdrop fecha se `dismissable`; `blockScroll` trava o scroll do body enquanto aberto; o foco retorna ao elemento-gatilho ao fechar; a máscara só desmonta ao fim da transição, momento em que `after-hide` dispara
- Animações: transição CSS por posição (slide a partir de cada borda), respeitando `prefers-reduced-motion`

### Estilização

SCSS com escopo por componente, usando as variáveis do tema Max (`var(--background-0)`, `var(--surface-border)`, `var(--max-primary-500)`) e seguindo o vocabulário visual já estabelecido no `MaxModal` — bordas, sombra, raio e espaçamento — para que os três pareçam nativos da biblioteca, não portes de outra lib. Utilitários do UnoCSS via `presetMaxUno` onde couber.

## Testes

TDD, seguindo o padrão existente em `tests/components/` (Vitest + `@vue/test-utils` + happy-dom, com o setup global de `tests/setup.ts`). Um arquivo por família:

- `MaxTabs.test.ts` — seleção, `v-model:value`, navegação por setas/Home/End, `disabled` pulado, `lazy`, `selectOnFocus`, atributos ARIA
- `MaxAccordion.test.ts` — expandir/colapsar, `multiple`, `v-model:value` com string e array, emits `tab-open`/`tab-close`, teclado, `lazy`, ARIA
- `MaxDrawer.test.ts` — `v-model:visible` e modo controlado one-way, cada `position`, `Escape`, clique no backdrop com e sem `dismissable`, trap de foco, restauração de foco ao fechar, `blockScroll`, ordem dos emits (`show` → `hide` → `after-hide`), API imperativa exposta

## Integração

1. **`src/index.ts`** — exportar os 13 componentes com os aliases sem prefixo (`Tabs`, `TabList`, `Tab`, `TabPanels`, `TabPanel`, `Accordion`, `AccordionPanel`, `AccordionHeader`, `AccordionContent`, `Drawer`), conforme a convenção de múltiplos aliases da biblioteca.
2. **`src/prime/index.ts`** — remover os re-exports agora substituídos: `Tabs`, `TabList`, `Tab`, `TabPanels`, `TabPanel`, `Accordion`, `AccordionPanel`, `AccordionHeader`, `AccordionContent`, `Drawer`. O arquivo declara no topo que contém apenas o que *não* tem equivalente Max.
3. **`npx tsx src/scripts/generateResolver.ts`** — regenerar `src/components-manifest.json` para o auto-import.
4. **Playground** — uma página por família em `npm run dev:playground` para validação manual.
5. **Verificação** — `npm run type-check`, `npm run lint`, `npm run test` devem passar.

### Breaking change

Remover os re-exports do `src/prime/index.ts` muda a implementação por trás dos nomes `Accordion`, `Drawer`, `Tabs` etc. para quem os importava de `@maxvue/max-components-ui/prime`. A API pública é a mesma, mas o componente por trás passa a ser o Max. Isso precisa ser registrado no changelog e comunicado na nota de versão.

## Fora de escopo

- `activeIndex` (depreciada no PrimeVue v4 em favor de `value`)
- Modo `unstyled` e o sistema de pass-through (`pt`) do PrimeVue
- API declarativa por dados (`:tabs="[...]"`) — descartada em favor da API composta idêntica ao PrimeVue
- Qualquer alteração nos demais componentes já existentes da biblioteca

## Processo

Conforme a regra de worktree no [`CLAUDE.md`](../../../CLAUDE.md), toda a implementação ocorre em worktree isolado:

```bash
git worktree add ../MaxComponentsUi-wt-tabs-accordion-drawer -b feat/tabs-accordion-drawer
```

Validação completa no worktree e merge para `main` só depois.
