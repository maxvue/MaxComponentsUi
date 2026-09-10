# Risco de Perda de Dados por Fechamento Acidental de Modal (`MaxModal`)

## Contexto e Componentes Afetados
- **Componentes:** `MaxModal.vue`, `src/stores/useModal.Store.ts`.
- **Categoria:** Overlays e feedback / Prevenção de perda acidental de dados.
- **Severidade:** Alta.
- **Heurística Violada:** Nielsen #5 (Prevenção de Erros) e Nielsen #3 (Controle e Liberdade do Usuário).

---

## Descrição do Problema

O componente [`MaxModal.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxModal.vue) é utilizado como contêiner de formulários, edição de registros e fluxos de criação. No entanto, o fechamento ao clicar no fundo escuro (backdrop) é **incondicional e imediato**:

```html
<div class="background-modal" @click.stop="modal_store.hide" v-if="modal_store.show_id === id" ...>
```

Não existe nenhuma propriedade para desabilitar o fechamento ao clicar na máscara (como `dismissableMask: false`, `closeOnBackdrop: false` ou `persistent: true`), nem gancho de confirmação preventiva (`before-close` / `canClose`) para quando houver dados preenchidos no formulário interno.

Além disso, a propriedade `blockScroll` possui valor padrão `false` (linha 114):
```ts
blockScroll: false,
closeOnEscape: true
```
Isso permite que a página de fundo continue rolando enquanto o modal está aberto, provocando desorientação espacial ("scroll chaining").

---

## Evidência no Código

1. Em [`MaxModal.vue:9`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxModal.vue#L9), o evento `@click.stop="modal_store.hide"` no backdrop fecha o modal sem qualquer verificação.
2. Em [`MaxModal.vue:103-116`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxModal.vue#L103-L116), as props não incluem `dismissable` ou `maskClosable`, enquanto em `MaxDrawer.vue` existe a prop `dismissable: boolean` (default `true`). No `MaxModal`, o fechamento pelo backdrop não pode ser desativado.
3. O `blockScroll` default é `false`, divergindo do comportamento canônico de modais de diálogo (`role="dialog"`, `aria-modal="true"`).

---

## Impacto na Experiência do Usuário (UX)

1. **Perda Irreversível de Dados:** Se um usuário passar vários minutos preenchendo um formulário complexo dentro de um modal (ex.: cadastro de proposta, endereço, dados técnicos) e clicar por engano 1 pixel fora da borda do modal, todo o modal é fechado instantaneamente e o estado local é descartado.
2. **Fricção de Rolagem:** Com `blockScroll: false`, tentar rolar o conteúdo interno do modal pelo trackpad ou mouse wheel frequentemente rola o conteúdo da página de fundo em vez do modal, gerando frustração e sensação de instabilidade na interface.

---

## Recomendações de Solução

1. **Prop `dismissable` / `maskClosable`:**
   - Adicionar a prop `dismissable?: boolean` (ou `closeOnBackdrop`) com possibilidade de desativar o fechamento por clique externo (`false` para modais de formulário).
2. **Modo `persistent` com Feedback Visual:**
   - Se `dismissable: false`, ao clicar no backdrop, emitir uma animação sutil de vibração/destaque no diálogo (shake effect), sinalizando ao usuário que o modal requer interação interna (salvar ou cancelar expressamente).
3. **Evento `beforeClose`:**
   - Permitir que a aplicação registre um callback ou evento `beforeClose: (done: () => void) => void` para exibir confirmação de descarte se o formulário estiver preenchido/sujo (dirty state).
4. **Alinhar `blockScroll`:**
   - Adotar `blockScroll: true` como padrão para modais e drawers modais, evitando a rolagem acidental da página de fundo.
