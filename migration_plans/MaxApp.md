# Plano de Migração — MaxApp (App Shell independente do engeapp)

> Documento autossuficiente. Uma IA futura deve conseguir executar esta migração lendo apenas
> este arquivo + o código-fonte referenciado nos dois repositórios. **Não modificar código-fonte
> fora do escopo da etapa em execução.** Convenções obrigatórias: `<script setup lang="ts">`,
> indentação de 4 espaços, aspas simples, ponto e vírgula, sem trailing commas, ordem de blocos
> **Template → Script → Style**.

---

## 1. Objetivo

Permitir que o `engeapp` substitua todo o seu `resources/App.vue` por um único componente
importado desta biblioteca:

```vue
<template>
    <MaxApp route-login="login" route-providers="social.providers" :allow-user-name="false" />
</template>
```

Hoje o `App.vue` do engeapp ([`resources/App.vue`](../../engeapp/resources/App.vue)) faz o
branching de layout, monta o `PageLayout`, o `LoadScreen`, os singletons de UI
(`MaxPopoverConfirm`, `MaxToast`) e o bloco VoIP. Todo esse shell deve passar a morar aqui.

**Decisão de escopo tomada pelo usuário:** migrar **tudo**, incluindo o `@maxvue/max-pinia`.

---

## 2. Estado atual (ponto de partida)

Existem dois rascunhos **incompletos e não funcionais** no repositório, copiados do engeapp:

### `src/components/MaxApp.vue`
- `<script setup>` **vazio** — nenhuma prop, nenhum `system`/`user`/`route` definido.
- Template com três `<slot>` irmãos, dois deles com o **mesmo nome** (`authenticated`), **sem
  `v-if`** — todos os `RouterView` renderizariam simultaneamente.
- Referencia `PageLayout`, `LoadScreen`, `VoipDialer`, `VoipReverbListener`, `IncomingCallModal`,
  que **não existem** nesta lib.
- O `<style>` estiliza `.app-container`, mas o template usa `.max-app` — seletor morto.

### `src/stores/useApp.Store.ts`
- Exporta `useSystemStore` (nome do arquivo não bate com o da store).
- Referencia símbolos **inexistentes/não importados**: `user`, `loading`, `version`,
  `useChatSettingsStore`, `useUserStore`, `useLoadingStore`, `useWindowSize`, `useBreakpoints`,
  `useRefCached`, `UseWindowSizeReturn`.
- Não está exportado em [`src/stores/index.ts`](../src/stores/index.ts).

### `src/stores/useLogin.Store.ts`
- Referencia `apiPostRoute`, `apiGetRoute`, `toast`, `route` sem importar (dependem de
  auto-import, que **não existe** no build desta lib).
- Rotas `'login'` e `'social.providers'` **hardcoded** — devem virar props/config.

> **Conclusão:** os três arquivos são rascunhos. Nenhum deles compila. A migração parte deles,
> mas praticamente reescreve todos.

---

## 3. Mapa de dependências real (medido)

A árvore transitiva a partir de `App.vue` do engeapp contém **65 arquivos `.vue` locais** e
**22 stores Pinia**.

### 3.1 O fator dominante: `ChatPanel`

`SplitPanesContent.vue` faz `defineAsyncComponent(() => import('@/Vue/Sections/supportChat/ChatPanel.vue'))`.
Essa **única aresta** arrasta as **37 telas de `Sections/supportChat/**`**.

| Escopo | Arquivos `.vue` |
|---|---|
| Árvore **sem** a aresta `ChatPanel` | **23** |
| Árvore **com** a aresta `ChatPanel` | **65** |

O subtree de chat é domínio de negócio puro do engeapp (chat estilo WhatsApp, protocolos,
sugestões de IA, upload de mídia, gravação de áudio). **Recomendação técnica registrada:** manter
`ChatPanel` no engeapp e injetá-lo por slot no `MaxSplitPanesContent`. Isso reduz a migração de
65 para 23 arquivos sem perder a API de uma linha.

### 3.2 Componentes por grupo

| Grupo | Qtd | Arquivos |
|---|---|---|
| Layout | 11 | `PageLayout`, `ContainerApp`, `SplitPanesContent`, `SideMenu`, `TopMenu`, `TopMenu/UserSection`, `TopMenu/TopMenuSearchBar`, `TopMenu/ReportBugs`, `BottomMenu`, `LoadScreen`, `LoadScreenTarget` |
| Componentes de apoio | 11 | `TopToolbar`, `MenuVerticalItem`, `ImportProjectPopover`, `LiveSection`, `LiveStatusIndicator`, `LiveUsersList`, `ArchiveChatPopover`, `BlockContactPopover`, `TransferSupportPopover`, `Popovers/PopoverAddContact`, `Popovers/PopoverSearchChat` |
| VoIP | 5 | `VoipDialer`, `VoipReverbListener`, `IncomingCallModal`, `VoipDialpad`, `VoipCallHistory` |
| supportChat | 37 | `ChatPanel` + todo `Sections/supportChat/**` |

### 3.3 Stores (22)

`useBugsReportStore`, `useChatActiveSupportStore`, `useChatAiSuggestionsStore`,
`useChatSettingsStore`, `useChatStore`, `useClientStore`, `useListChatRoomsStore`,
`useListMenusStore`, `useListsToSelectStore`, `useLiveRoomsStore`, `useLoadingStore`,
`useLocationStore`, `useNotificationsStore`, `usePlannerListsStore`, `useProjectStore`,
`useSearchBarStore`, `useStationElementsStore`, `useSystemStore`, `useTopToolbarStore`,
`useUserStore`, `useViewFileStore`, `useVoipStore`.

### 3.4 Dependências externas a resolver

| Dependência | Onde | Tratamento |
|---|---|---|
| `@maxvue/max-pinia` | plugin de cache/sync; provê `status.server.get.is_success` | **Virar pacote irmão** (§4) |
| `ziggy-js` / `route()` | TopMenu, ReportBugs, `useVoip.Store` | Injetar via `setRouteResolver` do MaxUse — **nunca importar Ziggy aqui** |
| `@laravel/echo-vue` | `VoipReverbListener`, `ReverbComponent`, TopMenu | `peerDependency` opcional + guard `echoIsConfigured()` |
| `livekit-client` | `useVoip.Store` (WebRTC real) | `peerDependency` opcional, import dinâmico |
| `splitpanes` | `SplitPanesContent` | `dependency` |
| `pdfjs-dist`, `vue3-emoji-picker`, `color` | subtree supportChat | Só se o chat for migrado |
| `vue3-toastify` | vários | Substituir pelo `MaxToast`/`useToastStore` já existente na lib |
| `axios` | chat + voip | já é `dependency` desta lib |
| Browser APIs | `new Audio()`, `AudioContext` | Guardar com `typeof window !== 'undefined'` |

---

## 4. Pré-requisito bloqueante: `@maxvue/max-pinia`

O `useUserStore` **não busca dados sozinho**. Ele apenas declara:

```ts
const options = computed(() => ({ get: { route: 'user.data' }, save: 'user.save', key: 'user' }));
```

Quem faz o GET, o cache em LocalForage e popula `status.server.get.is_success` — a condição que
governa **todo** o branching do `App.vue` — é o plugin `createMaxPinia`, configurado em
[`engeapp/resources/app.ts:42-54`](../../engeapp/resources/app.ts#L42-L54).

**Boa notícia:** o `@maxvue/max-pinia` (v0.2.0, em `engeapp/storage/libs/MaxPinia`) **já é
totalmente desacoplado** — toda a configuração entra por injeção (`resolveRoute`,
`getSessionToken`, `isAppStarted`, `onActivity`, `loading`). Não precisa ser reescrito.

> ✅ **ETAPA 1 CONCLUÍDA.** Registro do que foi encontrado e feito:
>
> O `MaxPinia` **já era** um repositório git próprio em `~/GitHub/MaxPinia` — o caminho
> `engeapp/storage/libs/MaxPinia` é apenas um **symlink** para ele. Nada precisou ser
> clonado ou movido; bastou referenciá-lo.
>
> Mudanças aplicadas:
> 1. `MaxPinia/package.json`: peer range → `"pinia": "^3.0.0 || ^4.0.0"` (commit `8b2694a`).
> 2. `MaxPinia/package.json`: **`@vue/devtools-api` adicionado como devDependency**. O pinia 3
>    o trazia como `dependency` direta; o pinia 4 o moveu para peer opcional, mas o runtime
>    ainda o importa — sem ele, `test/config.test.ts` falha ao carregar.
> 3. `MaxComponentsUi/package.json`: `"@maxvue/max-pinia": "file:../MaxPinia"` (commit `560284c8`).
>
> Evidências: MaxPinia com pinia 4.0.2 → type-check limpo, **23/23 testes**, build ok
> (`dist/index.es.js`, 21.65 kB). MaxComponentsUi → `createMaxPinia` e `useAsyncStatus`
> resolvem; type-check limpo (com os rascunhos §2 fora); suíte **sem regressões**
> (18 falhas pré-existentes de componentes de input vs. 33 no baseline da `main`).

**Ação (histórico):** ter o `MaxPinia` como **pacote irmão**, ao lado de `MaxUse`:

```
~/GitHub/
├── MaxComponentsUi/
├── MaxUse/
└── MaxPinia/          ← novo
```

E declarar em `package.json` desta lib:

```json
"dependencies": {
    "@maxvue/max-pinia": "file:../MaxPinia"
}
```

> ✅ **Compatibilidade com pinia 4 — já verificada.** O `MaxPinia` declara
> `peerDependency "pinia": "^3.0.0"`, enquanto esta lib está em **`pinia 4.0.2`** (commit
> `52d64d9c`). A verificação mostrou que o `MaxPinia` consome o pinia **apenas por dois imports
> de tipo** em `src/plugin.ts:2` — `PiniaPlugin` e `PiniaPluginContext` — sem nenhuma API de
> runtime. Ambos continuam exportados em `pinia@4.0.2`
> (`node_modules/pinia/dist/pinia.d.ts:552`, `:580`, `:955`).
>
> **Portanto a etapa 1 é apenas ampliar o range para `"pinia": "^3.0.0 || ^4.0.0"`** — não há
> quebra de API a resolver.

---

## 5. API pública do `MaxApp`

```ts
interface MaxAppProps {
    /** Nome da rota de login (ex.: 'login'). */
    routeLogin?: string;
    /** Nome da rota que lista os provedores sociais (ex.: 'social.providers'). */
    routeProviders?: string;
    /** Nome da rota que devolve os dados do usuário. Padrão: 'user.data'. */
    routeUser?: string;
    /** Habilita login por nome de usuário. Padrão: true. */
    allowUserName?: boolean;
    /** Habilita login por e-mail. Padrão: true. */
    allowEmail?: boolean;
    /** Habilita login por telefone. Padrão: true. */
    allowPhone?: boolean;
    /** Nomes de rota que devem renderizar sem layout (blank). */
    blankPages?: string[];
}
```

### Slots (escape hatches)

| Slot | Props | Uso |
|---|---|---|
| `layout` | `{ screen }` | Substituir o `MaxPageLayout` padrão |
| `login` | — | Substituir a tela de login |
| `extras` | — | Injetar VoIP ou qualquer singleton do app |

### Branching (preservar exatamente o do `App.vue` atual)

```
route.name existe?
├── meta.layout === 'site'                          → <RouterView/> puro
├── meta.layout === 'blank' || page ∈ blankPages    → <RouterView/> puro
├── user carregado && !user.data.id                 → <RouterView/> (login)
└── user carregado && user.data.id                  → <MaxPageLayout :screen> <RouterView/>
```

> O `blankPages` substitui o hardcode atual
> (`'Page'`, `'contatos'`, `'Contract'`, `'Wire'`, `'SolarCompanySubdomain'`), que é domínio do
> engeapp e **não pode** ficar na lib.

---

## 6. Etapas de execução (uma por invocação)

> Cada etapa é uma invocação do agente. **Não executar mais de uma por vez.** Ao final de cada
> etapa: `npm run type-check`, `npm run lint`, `npm run test` e atualizar o status na tabela §7.

| # | Etapa | Entrega | Depende de |
|---|---|---|---|
| 1 | **MaxPinia como pacote irmão** | `../MaxPinia` criado, `pinia@4` compatível, `file:../MaxPinia` no `package.json`, `npm install` limpo | — |
| 2 | ✅ **Stores base** | `useLoading.Store.ts` + `useUser.Store.ts` na lib, com rotas configuráveis via `configureMaxApp()` | 1 |
| 3 | **`useSystem.Store.ts`** | Reescrever o rascunho `useApp.Store.ts`: imports explícitos, remover `useChatSettingsStore`, `split_panel` opcional, exportar em `stores/index.ts` | 2 |
| 4 | **`useLogin.Store.ts`** | Corrigir imports (`apiGetRoute`/`apiPostRoute` do MaxUse), trocar `vue3-toastify` pelo `useToastStore`, rotas via config | 3 |
| 5 | **`MaxLoadScreen`** | `LoadScreen.vue` + `LoadScreenTarget.vue` → `MaxLoadScreen.vue` + `MaxLoadScreenTarget.vue` | 2 |
| 6 | **`MaxContainerApp` + `MaxBottomMenu`** | Ambos são folhas, sem stores complexas | 3 |
| 7 | **`MaxSideMenu`** | `SideMenu.vue` + `MenuVerticalItem.vue`; store `useListMenus` configurável | 3 |
| 8 | **`MaxTopMenu`** | 13 arquivos; a etapa mais pesada. Reverb via guard, Ziggy via `setRouteResolver` | 3, 7 |
| 9 | **`MaxSplitPanesContent`** | `splitpanes` + **slot** para o painel lateral (evita arrastar o `ChatPanel`) | 3 |
| 10 | **`MaxPageLayout`** | Compõe 6→9 | 6, 7, 8, 9 |
| 11 | **VoIP** | `useVoip.Store` (LiveKit dinâmico) + 5 componentes | 3 |
| 12 | **`MaxApp.vue`** | Reescrever o rascunho com props §5, branching §5 e slots | 10, 11 |
| 13 | **Resolver + exports** | `npx tsx src/scripts/generateResolver.ts`, exports em `index.ts` | 12 |
| 14 | **Integração no engeapp** | Trocar `App.vue` pelo `<MaxApp/>`, validar em dev | 13 |
| 15 | *(opcional)* **supportChat** | 37 arquivos — só se decidido migrar o chat | 9 |

---

## 7. Painel de status

| # | Etapa | Status |
|---|---|---|
| 1 | MaxPinia como pacote irmão | ✅ `done` |
| 2 | Stores base (loading, user) | ✅ `done` |
| 3 | useSystem.Store | `waiting` |
| 4 | useLogin.Store | `waiting` |
| 5 | MaxLoadScreen | `waiting` |
| 6 | MaxContainerApp + MaxBottomMenu | `waiting` |
| 7 | MaxSideMenu | `waiting` |
| 8 | MaxTopMenu | `waiting` |
| 9 | MaxSplitPanesContent | `waiting` |
| 10 | MaxPageLayout | `waiting` |
| 11 | VoIP | `waiting` |
| 12 | MaxApp.vue | `waiting` |
| 13 | Resolver + exports | `waiting` |
| 14 | Integração no engeapp | `waiting` |
| 15 | supportChat (opcional) | `waiting` |

---

## 8. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| ~~`pinia@4` vs peer `^3.0.0` do MaxPinia~~ | ~~Bloqueia a etapa 1~~ | **Resolvido:** só imports de tipo, presentes no pinia 4. Ampliar o range |
| Ziggy dentro da lib | Acopla a lib ao Laravel | Usar só `setRouteResolver` do MaxUse |
| Reverb/LiveKit obrigatórios | Quebra consumidores sem VoIP | `peerDependencies` opcionais + guards |
| `ChatPanel` (37 arquivos) | Triplica o escopo | Manter no engeapp via slot (etapa 9) |
| Migração em paralelo com a do PrimeVue | Conflito nos mesmos arquivos | Worktree separado (`feat/max-app`) |
| Tamanho do bundle | `index.es.js` cresce muito | Avaliar entrada `./app` separada |

---

## 8.1 Achado da etapa 2 — instância dupla de Vue/VueUse nos testes

> ✅ **Corrigido no commit `eb8f95c7`.** Registrado aqui porque afeta todas as etapas seguintes.

O `vitest.config.ts` aliasa `@maxvue/max-use` para o **fonte** do MaxUse
(`../MaxUse/src/index.ts`). O `import '@vueuse/core'` de lá resolvia para a cópia aninhada em
`../MaxUse/node_modules`, carregando uma **segunda instância do Vue**. Consequência: todo watcher
reexportado do VueUse (`watchDebounced`, `refAutoReset`, `useWindowSize`, …) **nunca disparava**
sobre refs criados nos testes — e falhava **em silêncio**, sem erro.

Comprovado por teste-sonda: com o mesmo padrão de mutação, o `@vueuse/core` direto disparava
**1** vez e o re-export do MaxUse, **0**. Após a correção, ambos disparam 1.

Correção: `@vueuse/core` como devDependency + alias fixo de `vue` e `@vueuse/core` +
`dedupe: ['vue', '@vueuse/core', 'pinia']`.

**Impacto nas próximas etapas:** mais de 10 arquivos já existentes em `src/` usam esses
re-exports (`MaxModal`, `MaxPopover`, `MaxInputSelect`, `useIcon.Store`, …). A etapa 5
(`MaxLoadScreen`) depende diretamente do `watchDebounced` e teria falhado silenciosamente sem
esta correção. Se algum watcher parecer inerte em teste, **suspeite primeiro de instância dupla**.

---

## 9. Convenções

- Todo componente migrado ganha o prefixo `Max` e vai para `src/components/`.
- Nada de auto-import: **todo símbolo importado explicitamente**.
- Nenhuma rota hardcoded — sempre via prop ou `configureMaxApp()`.
- Após novos `.vue`: `npx tsx src/scripts/generateResolver.ts`.
- Testes em `tests/components/`, seguindo `tests/setup.ts`.
