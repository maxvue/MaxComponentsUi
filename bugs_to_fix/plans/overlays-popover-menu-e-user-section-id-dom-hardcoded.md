# MaxPopoverMenu e MaxUserSection usam `id` de DOM fixo — duplicado em toda instância montada

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxPopoverMenu.vue:9`, `src/components/MaxUserSection.vue:14`
- **Domínio:** overlays-navegacao

## Problema

Ambos os componentes passam um `id` **literal** ao overlay do PrimeVue:

`src/components/MaxPopoverMenu.vue:9`
```
<Menu ref="menu" id="overlay_menu" :model="props.items ?? props.model" :popup="true">
```

`src/components/MaxUserSection.vue:14`
```
<TieredMenu ref="menu" id="overlay_tmenu" :model="menuItems" popup>
```

Como `id` deve ser único no documento, qualquer página com **duas ou mais instâncias** do mesmo componente produz ids duplicados. `MaxPopoverMenu` é um componente de linha de tabela/card por natureza (menu de ações "⋮"), então múltiplas instâncias são o caso **normal**, não a exceção.

Consequências concretas:

1. **HTML inválido.** Ids duplicados violam a especificação e são sinalizados por validadores e por ferramentas de auditoria de acessibilidade.
2. **`document.getElementById` e seletores `#overlay_menu` resolvem para o primeiro.** Qualquer código (do PrimeVue, de testes E2E, ou da aplicação consumidora) que localize o overlay por id encontra sempre o mesmo elemento, independentemente de qual menu foi aberto.
3. **Relações ARIA quebradas.** O PrimeVue usa o `id` do popup para montar o `aria-controls`/`aria-owns` do gatilho. Com ids duplicados, leitores de tela seguem a referência para o overlay errado.
4. **Testes frágeis.** Um teste que monte dois `MaxPopoverMenu` e busque por `#overlay_menu` testa sempre o primeiro.

O restante da biblioteca já resolve isso corretamente com `useId()` (`src/components/MaxModal.vue:109`, `src/components/MaxPopover.vue:94`) ou `Random()` (`src/components/MaxAccordion.vue:56`, `src/components/MaxTabs.vue:185`), o que torna o literal uma divergência clara do padrão do projeto.

## Impacto

Menus de ação em listas — o caso de uso principal do `MaxPopoverMenu` — geram dezenas de elementos com o mesmo id. Acessibilidade degradada e comportamento imprevisível de qualquer consulta por id.

## Plano de correção

1. Em `src/components/MaxPopoverMenu.vue`, importar `useId` de `vue` e substituir o literal:
   ```
   const menu_id = useId();
   ...
   <Menu ref="menu" :id="menu_id" ... >
   ```
2. Fazer o mesmo em `src/components/MaxUserSection.vue:14` para o `TieredMenu`.
3. Verificar se algum CSS do projeto ou dos temas depende de `#overlay_menu` / `#overlay_tmenu` como seletor: `grep -rn "overlay_menu\|overlay_tmenu" src/ src/themes/`. Se depender, migrar o seletor para uma classe (`.max-popover-menu-overlay`) aplicada via `class` no mesmo elemento.
4. Aplicar a mesma verificação nos apps consumidores antes do release, já que o id era efetivamente parte da superfície pública.

## Verificação

- Teste em `tests/components/MaxPopoverMenu.test.ts`: montar **duas** instâncias e afirmar que `document.querySelectorAll('[id^="v-"]').length` (ou os ids capturados dos dois `Menu`) são distintos.
- Teste equivalente em `tests/components/MaxUserSection.test.ts` para o `TieredMenu`.
- `npx vitest run tests/components/MaxPopoverMenu.test.ts tests/components/MaxUserSection.test.ts`
- `npm run lint`
