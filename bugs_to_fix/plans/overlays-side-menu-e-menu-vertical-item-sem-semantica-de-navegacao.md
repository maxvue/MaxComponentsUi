# MaxSideMenu e MaxMenuVerticalItem: sem `<nav>`, sem lista semântica e sem `aria-current` no item ativo

- **Categoria:** acessibilidade
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxSideMenu.vue:2-16`, `src/components/MaxMenuVerticalItem.vue:2-17`, `src/components/MaxMenuVerticalItem.vue:39`
- **Domínio:** overlays-navegacao

## Problema

O menu lateral é a navegação principal da aplicação, mas é construído inteiramente com `<div>`s:

`src/components/MaxSideMenu.vue:2-16`
```
<div class="side-menu" v-bind="attrs">
    <div class="grid-logo-and-menu">
        ...
        <div class="menu">
            <div v-if="items" class="grupo items">
                <MaxMenuVerticalItem :items="items" />
```

`src/components/MaxMenuVerticalItem.vue:2-9`
```
<div v-for="(item, index) in props.items" :key="item.id ?? index" v-tooltip.right="..." :class="`item_menu ${isActive(item) ? 'active' : ''}`" ... @click="clearSearch">
    <MaxIconButton :i="..." size="1.5" light :route="item.details.route?.trim() ?? null" />
```

Lacunas:

1. **Sem landmark `<nav>`.** Usuários de leitor de tela navegam por landmarks; o menu lateral não é um deles. O `MaxBottomMenu` do mesmo escopo **faz certo** (`<nav class="bottom-menu">`, `src/components/MaxBottomMenu.vue:2`), evidenciando a inconsistência.
2. **Sem estrutura de lista.** Itens de navegação deveriam ser `<ul>`/`<li>` (ou ter `role="list"`/`role="listitem"`), permitindo que o leitor anuncie "lista com 8 itens" e navegue item a item.
3. **Estado ativo só visual.** `isActive(item)` (linha 39) aplica apenas a classe `active`, que produz o realce por CSS (linhas 78-124). Não há `aria-current="page"` — o item correspondente à rota atual é indistinguível para quem não vê o destaque. O `MaxBottomMenu` tem exatamente o mesmo problema (`:class="{ active: isActive(tab) }"`, `src/components/MaxBottomMenu.vue:4`).
4. **Estado ativo dependente de um atributo customizado.** O `page_component` é aplicado como atributo HTML cru (`:page_component="item.details.page_component"`, linha 7) — atributo não padronizado, que deveria ser `data-page-component`.
5. **Handler de clique no wrapper e link no filho.** O `@click="clearSearch"` está no `<div>` externo (linha 8), enquanto a navegação real acontece no `MaxIconButton` interno via `:route` (linha 10). Clicar na área do `<div>` fora do botão limpa a busca mas **não navega** — área clicável enganosa.
6. **`aria-label` ausente no `<nav>`** — com dois grupos (`items` e `settings`, `MaxSideMenu.vue:8-13`), cada um precisaria de rótulo distinto.

## Impacto

A navegação principal não é anunciável nem localizável por landmark, e o item da página atual não é comunicado. Áreas clicáveis que não navegam produzem cliques sem efeito.

## Plano de correção

1. Em `src/components/MaxSideMenu.vue`, trocar o `<div class="side-menu">` (linha 2) por `<nav class="side-menu" aria-label="Menu principal">`, e envolver cada grupo com um rótulo próprio: `<div class="grupo items" role="group" aria-label="Seções">` e `aria-label="Configurações"` para o grupo de settings (linhas 8-13).
2. Em `src/components/MaxMenuVerticalItem.vue`, converter o `v-for` para uma estrutura de lista: `<ul class="menu-list">` no pai com `<li class="item_menu">` para cada item. Ajustar o SCSS (linhas 47-125) para os novos elementos (`list-style: none; margin: 0; padding: 0;` no `ul`).
3. Adicionar `:aria-current="isActive(item) ? 'page' : undefined"` no elemento do item — idealmente no `MaxIconButton` que renderiza o link, para que o atributo caia no `<a>` real.
4. Trocar `:page_component` (linha 7) por `:data-page-component`.
5. Mover o `@click="clearSearch"` para o próprio elemento de navegação (o `MaxIconButton`), ou expandir a área do link para preencher o `<li>`, eliminando a região clicável que não navega.
6. Aplicar a correção do item 3 também ao `MaxBottomMenu` (`src/components/MaxBottomMenu.vue:4`): adicionar `:aria-current="isActive(tab) ? 'page' : undefined"` e converter as abas para elementos acionáveis focáveis (hoje também são `<div>` com `@click`, sem `tabindex`).

## Verificação

- Teste em `tests/components/MaxSideMenu.test.ts`: afirmar que a raiz é um `NAV` com `aria-label="Menu principal"`.
- Teste de lista: afirmar que os itens estão dentro de um `<ul>` e que cada um é um `<li>`.
- Teste de `aria-current`: com a rota atual correspondendo ao segundo item, afirmar que apenas ele tem `aria-current="page"`.
- Teste equivalente em `tests/components/MaxBottomMenu.test.ts` (já existe teste de aba ativa na linha 38 — estendê-lo para verificar `aria-current`).
- `npx vitest run tests/components/MaxSideMenu.test.ts tests/components/MaxBottomMenu.test.ts`
