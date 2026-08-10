# MaxUserSection: a raiz inteira é um `<div>` clicável sem `role`, `tabindex`, `aria-expanded` nem `aria-haspopup`

- **Categoria:** acessibilidade
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxUserSection.vue:2`, `src/components/MaxUserSection.vue:14-23`, `src/components/MaxUserSection.vue:25-34`
- **Domínio:** overlays-navegacao

## Problema

O componente inteiro é um gatilho de menu:

```
<div class="user-section" @click.stop="toggle" pointer>
```

Nenhum atributo de acessibilidade acompanha esse comportamento:

- Sem `role="button"` — leitores de tela anunciam o nome e a empresa como texto estático, sem indicar que a região é acionável.
- Sem `tabindex="0"` — **o menu do usuário é inalcançável por teclado**. Não há nenhum outro caminho: o `TieredMenu` (linha 14) é `popup`, portanto invisível até o `toggle`.
- Sem `@keydown` para Enter/Espaço.
- Sem `aria-haspopup="menu"` e `aria-expanded` refletindo o estado do popup.
- Sem `aria-controls` apontando para o id do `TieredMenu`.

Adicionalmente, o botão de encerrar impersonação (linhas 25-34) é outro `<div>` clicável (`@click.stop="onEndImpersonate"`), também sem `role`, `tabindex` ou handler de teclado. Ele fica visualmente oculto (`opacity: 0`, linha 218) e só aparece no `:hover` (linha 224) — ou seja, é **exclusivamente acessível por mouse**: não há foco, não há hover por teclado, e o `opacity: 0` não o remove do DOM, então um leitor de tela anuncia um botão invisível e permanentemente inalcançável.

Os itens do menu (linha 16) também são `<div>`s com `@click`, dentro do slot `#item` do `TieredMenu` — nesse caso o PrimeVue costuma aplicar os papéis no wrapper, mas o `<div>` interno com o handler não é focável por si.

## Impacto

O menu principal do usuário — perfil, configurações, modo escuro, **sair** — é totalmente inoperável por teclado. Um usuário que não pode usar mouse não consegue fazer logout pela interface. A saída de impersonação é ainda mais grave: depende de hover, sem nenhuma alternativa.

## Plano de correção

1. Transformar a raiz (linha 2) em um elemento acionável acessível:
   ```
   <div
       class="user-section"
       role="button"
       tabindex="0"
       aria-haspopup="menu"
       :aria-expanded="is_open"
       :aria-controls="menu_id"
       @click.stop="toggle"
       @keydown.enter.prevent="toggle"
       @keydown.space.prevent="toggle"
       pointer
   >
   ```
   Rastrear `is_open` a partir dos eventos `show`/`hide` do `TieredMenu`. Usar o `menu_id` de `useId()` proposto em `overlays-popover-menu-e-user-section-id-dom-hardcoded.md`.
2. Extrair o botão de impersonação (linhas 25-34) do padrão hover-only: transformá-lo em `<button type="button">` real, e revelá-lo também em `:focus-within` / `:focus-visible`, não apenas em `:hover` (ajustar o SCSS da linha 224 para `&:hover, &:focus-visible { opacity: 1; }`). Considerar torná-lo sempre visível quando `isImpersonated` for verdadeiro, já que se trata de um estado excepcional que merece destaque.
3. Adicionar `aria-label` descritivo à raiz (ex.: `:aria-label="'Menu do usuário ' + props.name"`), já que o texto visível é apenas o nome.
4. Trocar os `<div>` dos itens do menu (linha 16) por `<button type="button">` dentro do slot, ou confirmar que o `TieredMenu` do PrimeVue já aplica `role="menuitem"` no wrapper e que o clique é capturado corretamente por teclado.

## Verificação

- Teste em `tests/components/MaxUserSection.test.ts`: afirmar que a raiz tem `role="button"`, `tabindex="0"` e `aria-haspopup="menu"`.
- Teste de teclado: disparar `keydown` com `Enter` na raiz e afirmar que o `toggle` do `TieredMenu` foi chamado (espiar o ref).
- Teste de `aria-expanded`: afirmar `"false"` inicialmente e `"true"` após a abertura.
- Teste do botão de impersonação: afirmar que é um `<button>` e que emite `endImpersonate` ao receber `keydown` com Enter.
- `npx vitest run tests/components/MaxUserSection.test.ts`
