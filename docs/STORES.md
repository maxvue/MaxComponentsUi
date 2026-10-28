# Stores Pinia

Stores reativas exportadas por `@maxvue/max-components-ui/stores`.

```typescript
import { useIconStore, usePopoverStore } from '@maxvue/max-components-ui/stores'
```

> As stores `useModalStore` e `useConfirmStore` são usadas internamente pelos componentes `MaxModal` e `MaxPopoverConfirm`, mas também podem ser importadas diretamente do entry point principal.

---

## useIconStore

Store responsável pelo **carregamento e cache de ícones SVG** do ecossistema Iconify.
Os ícones são buscados em lote via API e armazenados no **IndexedDB** (`max-components-ui-icons`) para garantir alta capacidade sem consumir a cota de 5MB do `localStorage`. Dados legados que existirem no `localStorage` são automaticamente migrados para o IndexedDB e removidos do storage legado na primeira inicialização.

### Uso

```typescript
import { useIconStore } from '@maxvue/max-components-ui/stores'

const iconStore = useIconStore()

// Buscar o SVG de um ícone (retorna null enquanto carrega)
const svg = iconStore.getIcon('mdi:home')
```

### Configuração do Servidor de Ícones (`ICON_SERVER` por aplicação)

Por padrão, a biblioteca busca e sincroniza ícones em `https://engeapp.com.br/api/icons`. Aplicações consumidoras podem apontar para seu próprio servidor de ícones definindo a variável `ICON_SERVER` em seu arquivo `.env`, sem necessidade de recompilar ou republicar o pacote `@maxvue/max-components-ui`.

#### 1. Definir no `.env` da aplicação consumidora

```env
ICON_SERVER=https://icones.minhaempresa.com.br
```

- **Formato:** deve ser uma URL absoluta HTTP ou HTTPS (ex.: `https://icones.exemplo.com` ou `https://icones.exemplo.com/prefixo`).
- **Resolução automática:** a biblioteca normaliza o endereço e direciona automaticamente o GET e o POST para `{ICON_SERVER}/api/icons`. Se a URL informada já terminar em `/api/icons`, o sufixo não é duplicado.
- **Validação e fallback:** se a variável for omitida, vazia ou contiver formato inválido (relativo, sem protocolo, com credenciais embutidas, query string ou fragmento), a biblioteca adota o servidor padrão do Engeapp com segurança, sem lançar exceções nem expor strings brutas nos logs.
- **Prioridade:** se a aplicação configurar rotas explícitas via `routeIcons` (GET) ou `routeIconsSync` (POST) no `configureMaxApp`, essas rotas explícitas têm prioridade sobre o `iconServer`.

#### 2. Expor seletivamente no Vite da aplicação consumidora (`vite.config.ts`)

Como bibliotecas pré-compiladas não leem diretamente arquivos de ambiente do consumidor em tempo de execução, exponha exclusivamente a chave `ICON_SERVER` via `loadEnv` e `define` no Vite da aplicação consumidora:

```typescript
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // Carrega seletivamente apenas a variável ICON_SERVER do diretório do projeto
    const env = loadEnv(mode, process.cwd(), 'ICON_SERVER');

    return {
        // ... preserve suas configurações existentes (plugins, resolve, server, etc.)
        define: {
            'import.meta.env.ICON_SERVER': JSON.stringify(env.ICON_SERVER ?? '')
        }
    };
});
```

> [!IMPORTANT]
> Utilize whitelist restrita ao prefixo ou chave `ICON_SERVER`. Nunca passe strings vazias como prefixo (`''`) para serializar todo o `process.env`, evitando expor credenciais e chaves secretas no bundle final do cliente.

#### 3. Declarar a tipagem do ambiente no consumidor (`env.d.ts`)

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly ICON_SERVER?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
```

#### 4. Repassar a configuração no boot da aplicação (`main.ts`)

Chame `configureMaxApp` no boot, **antes** de criar ou usar stores que dependam do app shell:

```typescript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { configureMaxApp } from '@maxvue/max-components-ui';
import App from './App.vue';

// Aplica o servidor de ícones configurado no .env da aplicação
configureMaxApp({
    iconServer: import.meta.env.ICON_SERVER
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
```

#### 5. Requisitos de backend, CORS e ciclo de vida

- **Reinício do Frontend:** alterações no arquivo `.env` do consumidor exigem reiniciar o dev server do Vite (`npm run dev`) ou executar novo build da aplicação consumidora (`npm run build`).
- **Contrato da API:** o servidor customizado deve aceitar requisições `GET /api/icons?icons[]=nome` (devolvendo mapa `{ "nome": "<svg>...</svg>" }`) e `POST /api/icons` para sincronização com payload `{ icons: { "nome": "<svg>..." } }`.
- **CORS e HTTPS:** requisições entre origens distintas devem fornecer headers CORS adequados (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type, Accept`).
- **Resiliência:** se o servidor customizado falhar ou não encontrar o ícone solicitado, a store consulta o fallback público do Iconify (`https://api.iconify.design`) e, ao obter o SVG, efetua um POST de sincronização para salvar a definição no `iconServer`.

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

1. Ao chamar `getIcon('mdi:home')`, se o ícone não estiver no cache em memória, ele é buscado no IndexedDB e marcado como `'waiting'` se pendente.
2. Um `watchDebounced` (50ms, maxWait 150ms) agrupa todos os ícones pendentes e faz uma requisição GET em lote no endpoint derivado de `iconServer` (ou rota configurada).
3. Os resultados recebidos são sanitizados contra vetores XSS, salvos em `icons_data` e persistidos no IndexedDB. Ícones não encontrados recorrem ao fallback do Iconify e são sincronizados via POST no mesmo servidor.

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
