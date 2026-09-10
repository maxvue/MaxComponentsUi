# Violação do Padrão WAI-ARIA Menu e Falta de Navegação por Teclado em MaxPopoverMenu, MaxUserSection e MaxTopToolbar

## Descrição e Causa Raiz

### Problema
O padrão WAI-ARIA Menu and Menubar define contratos rígidos de acessibilidade quando os atributos `role="menu"`, `role="menubar"` e `role="menuitem"` são atribuídos no DOM:
- Foco inicial ao abrir o menu deve ir para o primeiro item do menu.
- As teclas `ArrowDown` e `ArrowUp` devem circular o foco entre os itens do menu.
- As teclas `Home` e `End` devem levar para o primeiro e último item, respectivamente.
- A tecla `Escape` deve fechar o menu e retornar o foco para o elemento de disparo (gatilho).
- Os itens do menu devem poder ser ativados com `Enter` ou `Espaço`.

Entretanto, nos componentes `MaxPopoverMenu.vue`, `MaxUserSection.vue` e `MaxTopToolbar.vue`:

#### 1. Em MaxPopoverMenu.vue ([`src/components/MaxPopoverMenu.vue:1-38`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPopoverMenu.vue#L1-L38))
- O gatilho do menu é uma `<div class="botao">` que não possui `role="button"`, `tabindex="0"`, `aria-haspopup="menu"`, nem `aria-expanded="isOpen"`.
- O menu overlay recebe `role="menu"` e cada item recebe `role="menuitem"`, porém os itens são simples `<div>`s sem `tabindex` (`tabindex="-1"` com roving tabindex).
- Não há qualquer ouvinte para `ArrowDown` ou `ArrowUp` no menu. O foco nunca é movido para dentro do menu quando ele abre, deixando o usuário cego e o usuário de teclado completamente desorientados.
- O ID `id="overlay_menu"` é estático no template, gerando IDs duplicados quando múltiplos menus existem na mesma página.

#### 2. Em MaxUserSection.vue ([`src/components/MaxUserSection.vue:2-9, 41-63`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserSection.vue#L2-L9))
- O gatilho do perfil do usuário é uma `<div class="max-user-section user-section" @click.stop="toggle">` sem `role="button"`, sem `tabindex="0"`, sem ouvintes de teclado (`Enter`/`Espaço`) e sem `aria-expanded`. Um usuário que usa teclado não consegue sequer focalizar o menu do usuário no topo da tela.
- Os itens dentro do overlay (`role="menu"`) têm `role="menuitem"` mas não possuem `tabindex` e não respondem às setas direcionais.

#### 3. Em MaxTopToolbar.vue ([`src/components/MaxTopToolbar.vue:3-48`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopToolbar.vue#L3-L48))
- A barra declara `role="menubar"`, mas seus itens não possuem `role="menuitem"`, não suportam navegação horizontal por setas (`ArrowLeft`/`ArrowRight`), e a abertura de submenus depende exclusivamente do evento do mouse `@mouseenter="openSubmenu(index)"`. Usuários de teclado e dispositivos touch não conseguem abrir submenus na barra.

## Localização no Código
- [`src/components/MaxPopoverMenu.vue:1-38, 125-181`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPopoverMenu.vue#L1-L38)
- [`src/components/MaxUserSection.vue:2-9, 41-64`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserSection.vue#L2-L9)
- [`src/components/MaxTopToolbar.vue:3-48, 80-92`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopToolbar.vue#L3-L48)

## Proposta de Solução
1. Tornar os botões de disparo acessíveis adicionando `role="button"`, `tabindex="0"`, `:aria-expanded="isOpen"`, `aria-haspopup="menu"` e ouvintes de teclado para `Enter`/`Espaço`.
2. No menu overlay, implementar roving tabindex (`tabindex="0"` no item selecionado/focado e `-1` nos demais) e navegação com as setas para baixo/cima.
3. Ao abrir o menu, mover o foco programaticamente para o primeiro item (`focus()`).
4. Ao fechar com `Escape` ou seleção, restaurar o foco para o botão de disparo.
5. Em `MaxTopToolbar.vue`, permitir navegação por `ArrowLeft`/`ArrowRight` e abertura de submenus com `ArrowDown`/`Enter`.
