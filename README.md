# MaxComponentsUi

Biblioteca de componentes Vue 3 baseada em PrimeVue, construída com TypeScript e Vite 8.

## Instalação

```bash
npm install @maxvue/max-components-ui
```

## Dependências

Esta biblioteca requer as seguintes dependências peer:

```bash
npm install vue@^3.6.0 primevue@^4.2.4
```

## Uso

### Instalação Global

```typescript
import { createApp } from 'vue'
import MaxComponentsUi from '@maxvue/max-components-ui'
import 'primevue/resources/themes/aura-light-green/theme.css'

const app = createApp(App)

app.use(MaxComponentsUi)
```

### Importação Individual

```vue
<template>
  <MaxButton label="Clique aqui" severity="success" @click="handleClick" />
</template>

<script setup lang="ts">
import { MaxButton } from '@maxvue/max-components-ui'

const handleClick = () => {
  console.log('Botão clicado!')
}
</script>
```

## Componentes Disponíveis

### MaxButton

Botão estilizado baseado no PrimeVue Button com customizações adicionais.

#### Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| label | string | - | Texto do botão |
| icon | string | - | Ícone do botão |
| severity | 'secondary' \| 'success' \| 'info' \| 'warning' \| 'help' \| 'danger' \| 'contrast' | 'primary' | Severidade do botão |
| size | 'small' \| 'large' | - | Tamanho do botão |
| disabled | boolean | false | Desabilitar botão |
| loading | boolean | false | Estado de carregamento |
| variant | 'outlined' \| 'text' \| 'link' | - | Variante do botão |

#### Outros Componentes
Para uma lista completa de todos os componentes disponíveis, veja o [Catálogo de Componentes](COMPONENTS.md).

Principais categorias:
- **Inputs:** `MaxInputText`, `MaxInputCep`, `MaxInputCpfCnpj`, `MaxInputSelect`, `MaxInputPhone`.
- **Layout:** `Grid`, `MaxTable`.
- **Feedback:** `Loader`, `MaxUserAvatar`, `MaxIcon`.

---

## Configuração Avançada

A função `install` permite passar opções para o PrimeVue e para o tema Max:

```typescript
app.use(MaxComponentsUi, {
    locale: myCustomLocale,
    theme: {
        preset: MyCustomPreset,
        options: {
            darkModeSelector: '.my-dark-class'
        }
    }
})
```

## Desenvolvimento

### Instalar Dependências

```bash
npm install
```

### Modo Desenvolvimento

```bash
npm run dev
```

### Build para Produção

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Lint

```bash
npm run lint
```

## Estrutura do Projeto

```
src/
  components/     # Componentes Vue
    MaxButton.vue
  types/         # Definições de tipo TypeScript
    index.ts
  utils/         # Utilitários
  index.ts       # Ponto de entrada da biblioteca
```

## Publicação no NPM

1. Build do projeto:
```bash
npm run build
```

2. Publicar:
```bash
npm publish
```

## Licença

MIT

## Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue para discutir mudanças que você gostaria de fazer.
