# Escala Semântica de Camadas (Layer System)

Este documento define o contrato canônico de empilhamento visual (`z-index`) dos componentes do **Max Design System**.

---

## 1. Princípios e Regras de Empilhamento

1. **Camadas Globais Determinísticas**: Todo componente que cria um contexto de empilhamento flutuante global ou teleportado consome exclusivamente os tokens `--max-layer-*`.
2. **Índices Locais Pequenos**: Dentro de um contexto de empilhamento isolado (ex.: dentro de um input, card, tabela ou overlay), use apenas valores locais (`-1`, `0`, `1`, `2`, `3`, `5`, `10`). Nenhum valor local pode escapar do seu contexto delimitado.
3. **Ausência de Literais Arbitrários**: Números históricos arbitrários como `59`, `99`, `940`, `1100`, `9999`, `99999`, `100000` e `999999` foram descontinuados e substituídos pelos tokens semânticos documentados abaixo.
4. **Respeito à Hierarquia de Ações**:
   - Elementos em foco/dropdowns dentro de diálogos modais elevam-se contextualmente acima do modal (`1320`), sem ultrapassar tooltips (`1600`) ou bloqueios de tela (`10000`).
   - Bloqueios globais de carregamento (`MaxLoadScreenTarget`) isolam a tela no topo (`10000`).

---

## 2. Tabela de Camadas e Tokens Canônicos

| Camada / Papel | Token CSS | Valor | Papel / Componentes |
|---|---|---:|---|
| **Sticky local** | `--max-layer-sticky` | `100` | Cabeçalhos de tabela, toolbars internas sticky (`MaxTable`, `MaxInputMarkdownToolbar`) |
| **Navegação** | `--max-layer-navigation` | `500` | Menus e barras de navegação globais (`MaxTopMenu`, `MaxBottomMenu`, `MaxSideMenu`) |
| **Dropdown / Seletores** | `--max-layer-dropdown` | `1000` | Menus suspensos, select, autocomplete, datepicker, phone (`MaxInputSelect`, `MaxInputDatePicker`, `MaxPopoverMenu`, `MaxInputPhone`) |
| **Popover / Confirmação** | `--max-layer-popover` | `1200` | Popovers contextuais, botões de confirmação (`MaxPopover`, `MaxPopoverConfirm`) |
| **Backdrop de Modal** | `--max-layer-modal-backdrop` | `1300` | Máscaras escuras de fundo (`MaxModal`, `MaxDrawer`, `MaxTopMenuSearchBar` mobile overlay) |
| **Diálogo Modal / Drawer** | `--max-layer-modal` | `1310` | Janelas modais, painéis laterais deslizantes (`MaxModal`, `MaxDrawer`, `MaxInputIconPicker`) |
| **Tela Cheia / Lightbox** | `--max-layer-fullscreen` | `1400` | Visualizadores em tela cheia, lightbox de imagens e PDFs (`MaxImage`, `MaxInputCode`, `MaxPdfView`) |
| **Toast / Notificações** | `--max-layer-toast` | `1500` | Alertas flutuantes globais (`MaxToast`) |
| **Tooltip / Dica de Contexto** | `--max-layer-tooltip` | `1600` | Dicas de contexto (`.max-tooltip`, diretiva `v-tooltip`) |
| **Bloqueio Global de Tela** | `--max-layer-screen-block` | `10000` | Telas de carregamento integral e bloqueio (`MaxLoadScreenTarget`) |

---

## 3. Composição de Camadas Aninhadas

### 3.1 Dropdowns e Popovers dentro de Modais
Quando um componente baseado em `MaxBaseOverlay` (ou um select/datepicker teleportado) tem como alvo um elemento contido em um diálogo modal (`.max-modal`, `.max-drawer`, `[role="dialog"]`), ele eleva automaticamente sua camada base para `1320` (`--max-layer-modal + 10`). Isso garante que a lista de seleção fique visível sobre a janela modal sem competir com toasts (`1500`) ou tooltips (`1600`).

### 3.2 Submenus e Tooltips
Submenus horizontais e verticais permanecem vinculados à camada de dropdown (`1000`), garantindo que tooltips contextuais (`1600`) sempre apareçam visíveis acima de qualquer barra de ferramentas ou submenu ativo.

---

## 4. Tabela de Migração de Literais Legados

| Literal Legado | Contexto Anterior | Novo Token / Valor Canônico |
|---|---|---|
| `59` / `60` | Offset de cálculo do `MaxDrawer` | `--max-layer-modal` (`1310`) |
| `940` | Backdrop de busca mobile (`MaxTopMenuSearchBar`) | `--max-layer-modal-backdrop` (`1300`) |
| `950` | Painel de busca mobile (`MaxTopMenuSearchBar`) | `--max-layer-modal` (`1310`) |
| `1100` / `1101` | Máscara e overlay de telefone (`MaxInputPhone`) | `--max-layer-dropdown` (`1000`) |
| `1200` | Backdrop de drawer de ícones (`MaxInputIconPicker`) | `--max-layer-modal` (`1310`) |
| `9999` | Modal lightbox (`MaxImage`, `MaxInputMarkdown`) e fullscreen (`MaxInputCode`) | `--max-layer-fullscreen` (`1400`) |
| `9999` | Container de toasts (`MaxToast`) | `--max-layer-toast` (`1500`) |
| `100000` | Submenu superior (`MaxTopToolbarSubmenu`) | `--max-layer-dropdown` (`1000`) |
| `999999` | Bloqueio de tela (`MaxLoadScreenTarget`) | `--max-layer-screen-block` (`10000`) |
| `999999` | Botão interno de label (`MaxMsgLabels`) | `z-index: 2` (local) |
