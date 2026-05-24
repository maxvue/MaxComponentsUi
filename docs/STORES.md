# Stores Pinia

Stores reativas exportadas por `@maxvue/max-components-ui/stores`.

```typescript
import { useIconStore, usePopoverStore } from '@maxvue/max-components-ui/stores'
```

> As stores `useModalStore` e `useConfirmStore` são usadas internamente pelos componentes `MaxModal` e `MaxPopoverConfirm`, mas também podem ser importadas diretamente do entry point principal.

---

## useIconStore

Store responsável pelo **carregamento e cache de ícones SVG** do ecossistema Iconify.
Os ícones são buscados em lote via API e armazenados no `localStorage` para evitar requisições repetidas.

### Uso

```typescript
import { useIconStore } from '@maxvue/max-components-ui/stores'

const iconStore = useIconStore()

// Buscar o SVG de um ícone (retorna null enquanto carrega)
const svg = iconStore.getIcon('mdi:home')
```

### Estado

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `icons_data` | `Ref<Record<string, string>>` | Mapa de `nome_do_icone → conteúdo SVG`. Valor `'waiting'` indica que o ícone está sendo carregado |
| `list_icons_waiting_request` | `ComputedRef<string[]>` | Lista de ícones aguardando requisição à API |

### Métodos

| Método | Retorno | Descrição |
|--------|---------|-----------|
| `getIcon(name: string)` | `string \| null` | Retorna o SVG se disponível, registra para busca se não. Retorna `null` enquanto carrega |

### Funcionamento interno

1. Ao chamar `getIcon('mdi:home')`, se o ícone não estiver no cache, ele é marcado como `'waiting'`
2. Um `watchDebounced` (50ms, maxWait 150ms) agrupa todos os ícones pendentes e faz uma única requisição
3. Os resultados são salvos em `icons_data` e persistidos no `localStorage` com a chave `all_icons`

---

## usePopoverStore

Store para controlar a **visibilidade de popovers** globalmente.
Garante que apenas um popover esteja aberto por vez.

### Uso

```typescript
import { usePopoverStore } from '@maxvue/max-components-ui/stores'

const popoverStore = usePopoverStore()

// Abrir um popover
popoverStore.show('meu-popover-id')

// Fechar
popoverStore.hide()

// Alternar (toggle)
popoverStore.toggle('meu-popover-id')
```

### Estado

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `show_id` | `Ref<string \| null>` | ID do popover atualmente visível. `null` = nenhum aberto |

### Métodos

| Método | Descrição |
|--------|-----------|
| `show(id: string)` | Abre o popover com o ID informado |
| `hide()` | Fecha qualquer popover aberto |
| `toggle(id: string)` | Alterna: abre se fechado, fecha se aberto |

---

## useModalStore

Store para controlar a **visibilidade de modais** globalmente.
Funciona de forma idêntica ao `usePopoverStore`, mas para modais.

### Uso

```typescript
import { useModalStore } from '@maxvue/max-components-ui'

const modalStore = useModalStore()

modalStore.show('meu-modal-id')
modalStore.hide()
modalStore.toggle('meu-modal-id')
```

### Estado e Métodos

Mesma interface do `usePopoverStore`:
- `show_id: Ref<string | null>`
- `show(id)`, `hide()`, `toggle(id)`

---

## useConfirmStore

Store para controlar o **popover de confirmação** (`MaxPopoverConfirm`).
Gerencia mensagem, botões de aceitar/rejeitar e posicionamento.

### Uso

O `useConfirmStore` é normalmente consumido pelo componente `MaxPopoverConfirm`, mas pode ser manipulado diretamente:

```typescript
import { useConfirmStore } from '@maxvue/max-components-ui'

const confirmStore = useConfirmStore()

// Configurar mensagem e ações
confirmStore.message = 'Tem certeza que deseja excluir?'
confirmStore.acceptProps = {
  label: 'Sim, excluir',
  icon: 'mdi:delete',
  action: () => excluirItem()
}
confirmStore.rejectProps = {
  label: 'Cancelar',
  action: () => {}
}
confirmStore.show = true
```

### Estado

| Propriedade | Tipo | Padrão | Descrição |
|-------------|------|--------|-----------|
| `message` | `Ref<string>` | `'Deseja continuar?'` | Mensagem exibida |
| `messageIcon` | `Ref<string \| null>` | `null` | Ícone da mensagem |
| `show` | `Ref<boolean>` | `false` | Visibilidade do popover |
| `x`, `y` | `Ref<number>` | `0` | Posição do popover |
| `width`, `height` | `Ref<number>` | `0` | Dimensões do popover |
| `acceptProps` | `Ref<{ label, icon?, action }>` | `{ label: 'Sim' }` | Configuração do botão de aceitar |
| `rejectProps` | `Ref<{ label, icon?, action }>` | `{ label: 'Não' }` | Configuração do botão de rejeitar |

### Métodos

| Método | Descrição |
|--------|-----------|
| `hide()` | Fecha o popover de confirmação |
