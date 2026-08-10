# Uso disseminado de `any` nos componentes de overlay e navegação

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxModal.vue:113`, `src/components/MaxPopover.vue:103-104`, `src/components/MaxPopover.vue:107`, `src/components/MaxPopoverConfirm.vue:34`, `src/components/MaxPopoverMenu.vue:38-40`, `src/components/MaxPopoverMenu.vue:74`, `src/components/MaxPopoverMenu.vue:80`, `src/components/MaxTabItem.vue:34`, `src/components/MaxTopMenu.vue:73`, `src/components/MaxTopMenu.vue:97`, `src/components/MaxTopToolbar.vue:38`, `src/components/MaxTopToolbar.vue:50`, `src/components/MaxUserSection.vue:66`, `src/components/MaxUserSection.vue:99`, `src/components/MaxUserSection.vue:137`, `src/components/MaxTogglePopover.vue:32-33`
- **Domínio:** overlays-navegacao

## Problema

O guia de TypeScript do projeto proíbe `any`, mas o domínio de overlays/navegação o utiliza em quantidade. Levantamento por arquivo:

| Arquivo:linha | Uso |
|---|---|
| `MaxModal.vue:113` | `const style: any = useDefaultReset({...})` |
| `MaxPopover.vue:103-104` | `useElementBounding(btn_el as any)`, `useElementSize(el as any)` |
| `MaxPopover.vue:107` | `const style: any = useDefaultReset({...})` |
| `MaxPopoverConfirm.vue:34` | `useElementSize(el as any)` |
| `MaxPopoverMenu.vue:38-40` | `items?: any[]`, `model?: any[]` |
| `MaxPopoverMenu.vue:74` | `toggle = (event?: any)` |
| `MaxPopoverMenu.vue:80` | `onClick = (event: any, item: any)` |
| `MaxTabItem.vue:34` | `const tabs_info: any = inject('tabs_info')` |
| `MaxTopMenu.vue:73` | `addItems?: Array<Record<string, any>>` |
| `MaxTopMenu.vue:97` | `Boolean((user as any).isImpersonated)` |
| `MaxTopToolbar.vue:38` | `const attrs: any = useAttrs()` |
| `MaxTopToolbar.vue:50` | `handleItemClick = (item: any)` |
| `MaxUserSection.vue:66` | `items?: any[]` |
| `MaxUserSection.vue:99` | `const list: any[] = [...]` |
| `MaxUserSection.vue:137` | `toggle = (event: any)` |
| `MaxTogglePopover.vue:32-33` | `data?: any`, `params?: any` |
| `MaxButtonConfirm.vue:26-27`, `MaxIconConfirm.vue:26-27` | `data?: any`, `params?: any` |

Casos particularmente problemáticos:

- **`MaxTabItem.vue:34`** — o contexto legado inteiro é `any`, então `tabs_info.selectTab(...)`, `.add_count_tabs()` e `.active_tab` não têm nenhuma verificação. Contraste com o sistema novo, que tem a interface `TabsContext` completa em `src/helpers/tabsContext.ts`.
- **`MaxTopMenu.vue:97`** — `(user as any).isImpersonated` contorna a tipagem da store com um comentário explicando que a propriedade é "injetada pelo `@maxvue/max-pinia`". O correto é declarar a extensão de tipo da store (module augmentation), não silenciar o compilador no ponto de uso.
- **`MaxTopToolbar.vue:38`** — `useAttrs()` já tem tipo próprio; o cast para `any` só serve para permitir `attrs.plus` (linhas 2 e 44) sem declarar `plus` como prop. O correto é declarar `plus?: boolean` como prop.
- **`items` / `model` como `any[]`** em `MaxPopoverMenu` e `MaxUserSection` — são a API pública desses componentes; consumidores não recebem nenhuma ajuda do editor sobre a forma esperada dos itens (`label`, `icon`, `i`, `route`, `action`, `data`, `separator`, `exec`...), que hoje só pode ser descoberta lendo o template (`MaxPopoverMenu.vue:12-15`, `MaxUserSection.vue:16-22`).

## Impacto

Erros de forma nos itens de menu só aparecem em runtime (item sem `label` renderiza vazio; `action` com assinatura errada quebra ao clicar). Refatorações no contexto legado de tabs não são checadas. A migração planejada para independência do PrimeVue (`CLAUDE.md`) é mais arriscada sem tipos nas fronteiras.

## Plano de correção

1. Criar em `src/types/` (ou estender o que já existe lá) uma interface pública `MaxMenuItem`:
   ```
   export interface MaxMenuItem {
       label?: string;
       icon?: string;
       i?: string;
       route?: string;
       data?: Record<string, unknown>;
       params?: Record<string, unknown>;
       query?: Record<string, unknown>;
       separator?: boolean;
       divider?: boolean;
       subLabel?: string;
       tooltip?: string;
       action?: (payload: { event?: Event; data: Record<string, unknown> }) => void;
       command?: (payload: { item: MaxMenuItem }) => void;
       exec?: () => void;
       items?: MaxMenuItem[];
   }
   ```
   Aplicar em `MaxPopoverMenu` (linhas 38-40, 80), `MaxUserSection` (linhas 66, 99), `MaxTopMenu` (linha 73) e `MaxTopToolbar` (linha 50).
2. Tipar o contexto legado de tabs: criar `LegacyTabsContext` em `src/helpers/tabsContext.ts` e usá-la no `inject` de `MaxTabItem.vue:34` — ou eliminar o legado conforme `overlays-tabs-dois-sistemas-de-contexto-coexistindo.md`.
3. Declarar `plus?: boolean` como prop em `MaxTopToolbar.vue` e remover o `any` do `useAttrs` (linha 38).
4. Fazer module augmentation para `isImpersonated` na store de usuário, removendo o cast de `MaxTopMenu.vue:97`.
5. Trocar `data?: any` / `params?: any` por `Record<string, unknown>` em `MaxTogglePopover`, `MaxButtonConfirm` e `MaxIconConfirm`.
6. Para os casts `as any` em `useElementBounding`/`useElementSize` (`MaxPopover.vue:103-104`, `MaxPopoverConfirm.vue:34`), verificar a assinatura real do helper em `@maxvue/max-use` e usar o tipo de ref correto (provavelmente `Ref<HTMLElement | null>`), eliminando o cast.
7. Para `useDefaultReset` (`MaxModal.vue:113`, `MaxPopover.vue:107`), tipar o retorno genericamente: `useDefaultReset<{ isTop: boolean; isLeft: boolean; opacity: number }>({...})`.

## Verificação

- `npm run type-check` deve passar sem os `any`.
- `npm run lint` com a regra `@typescript-eslint/no-explicit-any` ativa (verificar se está habilitada no flat config; se não, habilitá-la ao menos como `warn` para este diretório).
- `npm run test` para garantir que a tipagem mais estrita não quebrou nenhum consumidor de teste.
- Busca de confirmação: `grep -n ": any\|as any\|any\[\]" src/components/Max{Modal,Popover,PopoverConfirm,PopoverMenu,TabItem,TopMenu,TopToolbar,UserSection,TogglePopover,ButtonConfirm,IconConfirm}.vue` deve retornar vazio.
