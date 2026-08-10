# Falta de teste: `MaxTabPanels` e `MaxAccordionPanel` — a validação de contexto (o `throw`) nunca é exercitada

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTabPanels.vue:11`, `src/components/MaxAccordionPanel.vue:21`, `src/helpers/tabsContext.ts:63-67`, `src/helpers/accordionContext.ts:43-57`
- **Domínio:** overlays-navegacao

## Problema

Verifiquei antes de reportar: `MaxTabPanel`, `MaxTabPanels`, `MaxAccordionPanel`, `MaxAccordionHeader` e `MaxAccordionContent` **estão cobertos indiretamente** — `tests/components/MaxTabs.test.ts:253-306` tem um `describe('MaxTabPanel')` com 8 casos, e `tests/components/MaxAccordion.test.ts:105-176` tem `describe('MaxAccordionHeader')` (8 casos) e `describe('MaxAccordionContent')` (4 casos). Todos montam a árvore completa, então `MaxTabPanels` e `MaxAccordionPanel` são exercitados como contêineres.

O que **não** é coberto em nenhum deles é a razão de existir desses dois componentes-contêiner. Ambos têm como única lógica a validação de contexto:

`src/components/MaxTabPanels.vue:8-11`
```
import { injectTabsContext } from '../helpers/tabsContext';

// Valida que o componente esta dentro de um <MaxTabs>.
injectTabsContext('MaxTabPanels');
```

`src/components/MaxAccordionPanel.vue:21`
```
injectAccordionContext('MaxAccordionPanel');
```

Essas chamadas lançam quando o componente é usado fora do contêiner esperado (`src/helpers/tabsContext.ts:65`, `src/helpers/accordionContext.ts:45,55`), com mensagens específicas:
```
[MaxComponentsUi] <MaxTabPanels> precisa estar dentro de um <MaxTabs>.
[MaxComponentsUi] <MaxAccordionPanel> precisa estar dentro de um <MaxAccordion>.
```

Nenhum teste monta esses componentes **isoladamente** para verificar que o erro é lançado com a mensagem correta. O mesmo vale para `MaxTab`, `MaxTabList`, `MaxTabPanel`, `MaxAccordionHeader` e `MaxAccordionContent` (que também chamam `injectAccordionContext`/`injectTabsContext`) e para `injectPanelContext` (`accordionContext.ts:53`), que valida a presença do `MaxAccordionPanel` intermediário.

Consequência prática: a mensagem de erro é a **única** documentação em runtime da estrutura obrigatória desses componentes. Se alguém alterar a chave de injeção, o nome do componente na mensagem, ou trocar o `throw` por um `console.warn`, nenhum teste falha — e o desenvolvedor consumidor passa a receber um erro genérico de `undefined` em vez da mensagem orientativa.

## Impacto

A rede de proteção da API de composição desses componentes é inexistente. Como a migração para independência do PrimeVue (`CLAUDE.md`) vai mexer exatamente nesses contextos, é o momento em que essas garantias mais importam.

## Plano de correção

1. Adicionar em `tests/components/MaxTabs.test.ts` um `describe('MaxTabs — validação de contexto')` que monte, isoladamente (sem `MaxTabs` ao redor), cada um de `MaxTabList`, `MaxTab`, `MaxTabPanels` e `MaxTabPanel`, afirmando que a montagem lança com a mensagem exata:
   ```
   expect(() => mount(MaxTabPanels)).toThrow('[MaxComponentsUi] <MaxTabPanels> precisa estar dentro de um <MaxTabs>.');
   ```
   Lembrar de silenciar o handler de erro do Vue Test Utils (`config.global.config.errorHandler`) ou usar `shallowMount` com `attachTo` conforme o padrão do projeto.
2. Adicionar o equivalente em `tests/components/MaxAccordion.test.ts` para `MaxAccordionPanel`, `MaxAccordionHeader` e `MaxAccordionContent`.
3. Adicionar o caso intermediário: montar `MaxAccordionHeader` dentro de um `MaxAccordion` **sem** `MaxAccordionPanel`, afirmando a mensagem de `injectPanelContext` (`accordionContext.ts:55`).
4. Considerar extrair as mensagens para constantes exportadas nos arquivos de contexto, para que os testes referenciem a constante em vez de duplicar a string.

## Verificação

- `npx vitest run tests/components/MaxTabs.test.ts tests/components/MaxAccordion.test.ts`
- `npm run test:coverage` — `MaxTabPanels.vue` e `MaxAccordionPanel.vue` devem atingir 100% de statements (são arquivos de poucas linhas), e `tabsContext.ts` / `accordionContext.ts` devem cobrir os ramos de `throw`.
