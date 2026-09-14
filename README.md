# @maxvue/max-components-ui

Biblioteca de componentes e design system Vue 3 para o ecossistema Max, desenvolvida em **TypeScript** e **Vite 8**.
Oferece componentes prontos para formulários, tabelas editáveis, overlays, ícones, layout e validação — tudo com estilização padronizada para o ecossistema Max.

---

## 📦 Instalação

```bash
npm install @maxvue/max-components-ui
```

### Dependências Peer

```bash
npm install vue@^3.5.33 vue-router@^5.0.6
```

> Componentes PrimeVue que não possuem equivalente na biblioteca podem ser instalados e importados diretamente a partir do pacote oficial `primevue/*`.

---

## 🚀 Início Rápido

### Registro Global (Plugin)

```typescript
import { createApp } from "vue";
import MaxComponentsUi from "@maxvue/max-components-ui";

const app = createApp(App);

// Registra as diretivas globais (ex: tooltip) e configurações da biblioteca
app.use(MaxComponentsUi);
```

### Importação Individual

```vue
<template>
  <MaxButton
    label="Salvar"
    icon="mdi:content-save"
    severity="success"
    @click="salvar"
  />
</template>

<script setup lang="ts">
import { MaxButton } from "@maxvue/max-components-ui";

const salvar = () => console.log("Salvo!");
</script>
```

### Auto-Import (Recomendado)

Configure o resolver para importar automaticamente os componentes sem `import` manual:

```typescript
// vite.config.ts
import Components from "unplugin-vue-components/vite";
import { MaxComponentsUiResolver } from "@maxvue/max-components-ui/resolver";

export default defineConfig({
  plugins: [
    Components({
      resolvers: [MaxComponentsUiResolver()],
    }),
  ],
});
```

Com isso, basta usar os componentes diretamente no template:

```vue
<template>
  <!-- Importação automática, sem necessidade de import -->
  <MaxButton label="Enviar" icon="mdi:send" />
  <MaxInputText v-model="nome" label="Nome" />
</template>
```

> Veja todos os detalhes em [docs/AUTO-IMPORT.md](docs/AUTO-IMPORT.md).

---

## ⚙️ Configuração Avançada

A função `install` aceita opções para customizar o PrimeVue e o tema:

```typescript
app.use(MaxComponentsUi, {
  locale: meuLocaleCustomizado,
  theme: {
    preset: MeuPresetCustomizado,
    options: {
      darkModeSelector: ".my-dark-class",
      prefix: "app",
    },
  },
});
```

| Opção                            | Tipo      | Padrão     | Descrição                                   |
| -------------------------------- | --------- | ---------- | ------------------------------------------- |
| `locale`                         | `object`  | `ptBR`     | Traduções do PrimeVue                       |
| `theme.preset`                   | `object`  | `MaxStyle` | Preset de cores/semântica (baseado no Aura) |
| `theme.options.darkModeSelector` | `string`  | `'.dark'`  | Seletor CSS para ativar dark mode           |
| `theme.options.prefix`           | `string`  | `'max'`    | Prefixo das variáveis CSS                   |
| `ripple`                         | `boolean` | `true`     | Efeito ripple nos botões                    |

---

## 📁 Módulos de Exportação

A biblioteca expõe múltiplos entry points via `package.json` exports:

| Import path                          | Descrição                                              | Documentação                               |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------ |
| `@maxvue/max-components-ui`          | Componentes Max + função `install` + tipos             | [COMPONENTS.md](COMPONENTS.md)             |
| `@maxvue/max-components-ui/stores`   | Stores Pinia (`useIconStore`, `usePopoverStore`, etc.) | [docs/STORES.md](docs/STORES.md)           |
| `@maxvue/max-components-ui/resolver` | `MaxComponentsUiResolver` para auto-import             | [docs/AUTO-IMPORT.md](docs/AUTO-IMPORT.md) |
| `@maxvue/max-components-ui/preset`   | `presetMaxUno` — preset UnoCSS com classes utilitárias | [docs/THEME.md](docs/THEME.md)             |
| `@maxvue/max-components-ui/styles`   | Presets de tema e paletas semânticas (`MaxStyle`)      | [docs/THEME.md](docs/THEME.md)             |
| `@maxvue/max-components-ui/style.css`| CSS compilado da biblioteca (estilos e utilitários)    | [docs/THEME.md](docs/THEME.md)             |

### Descontinuação do subpath `./prime`

O antigo entry point `./prime` foi definitivamente descontinuado e removido. Todos os componentes da biblioteca Max Components UI são nativos e independentes.

Caso a aplicação consumidora necessite de componentes puros do PrimeVue (como `DataTable`, `Dialog`, `Card` etc.) que não possuem correspondente Max nativo, instale `primevue` diretamente no projeto consumidor (`npm install primevue`) e importe-os diretamente dos subpaths oficiais (ex: `import DataTable from 'primevue/datatable'`).

---

## 🧩 Componentes

A biblioteca contém **59 componentes** organizados em categorias:

| Categoria                 | Componentes                                                                                                                                                                                                                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Base**                  | `InputBase`                                                                                                                                                                                                                                                                                                      |
| **Botões**                | `MaxButton`, `MaxIconButton`, `MaxIconConfirm`                                                                                                                                                                                                                                                                   |
| **Tipografia**            | `MaxTitle1`, `MaxTitle2`                                                                                                                                                                                                                                                                                         |
| **Inputs de Texto**       | `MaxInputText`, `MaxInputTextArea`, `MaxInputNumber`, `MaxInputSearch`                                                                                                                                                                                                                                           |
| **Inputs Especializados** | `MaxInputCep`, `MaxInputCpfCnpj`, `MaxInputDatePicker`, `MaxInputSelect`, `MaxInputAutoComplete`, `MaxInputAutoCompleteApi`, `MaxInputCheckbox`, `MaxInputRadio`, `MaxInputSwitch`, `MaxInputToggle`, `MaxInputCoordinateDecimalLat`, `MaxInputCoordinateDecimalLng`, `MaxInputPhoneMail`, `MaxInputTypeAddress` |
| **Telefone**              | `MaxInputPhone`                                                                                                                                                                                                                                                                                                  |
| **Arquivos**              | `MaxInputFile`, `MaxInputFileUpload`, `MaxInputFileUploadBig`, `MaxInputFileUploadButton`, `MaxInputFileProject`                                                                                                                                                                                                 |
| **Tabelas**               | `MaxTable`, `MaxTableFields`, `MaxTableColumn`                                                                                                                                                                                                                                                                   |
| **Layout**                | `MaxGrid`, `MaxGridCols`                                                                                                                                                                                                                                                                                         |
| **Overlays**              | `MaxModal`, `MaxPopover`, `MaxPopoverConfirm`, `MaxTogglePopover`                                                                                                                                                                                                                                                |
| **Ícones e Status**       | `MaxIcon`, `MaxDoneIcon`, `MaxWaitIcon`, `MaxErrorIcon`                                                                                                                                                                                                                                                          |
| **Loaders**               | `MaxLoader`, `MaxLoaderAi`, `MaxLoaderIcon`                                                                                                                                                                                                                                                                      |
| **Transições**            | `MaxAnimateFade`, `MaxTransitionFadeLight`, `MaxTransitionUp`, `TransitionFade`                                                                                                                                                                                                                                  |
| **Display**               | `MaxBadgeComponent`, `MaxEmptyDiv`, `MaxLink`, `MaxLogo`, `MaxMaps`, `MaxPdfView`, `MaxUserAvatar`, `MaxMsgLabels`, `MaxTextInputFloatLabel`                                                                                                                                                                     |

> Para documentação detalhada de cada componente (props, aliases, slots), veja o **[Catálogo de Componentes](COMPONENTS.md)**.

---

## 🎨 Tema e Estilos

A biblioteca fornece:

- **MaxStyle** — Preset PrimeVue baseado no tema Aura com paleta de cores personalizada (primary, success, info, warning, danger)
- **presetMaxUno** — Preset UnoCSS com shortcuts e rules customizados para padding, margin, grid, cores, hover e mais
- **Tipografia Canônica** — Stack baseada em `--font-sans` (`Quicksand` com fallback para fontes do sistema operacional). A biblioteca não embute arquivos binários de fontes; o carregamento de `Quicksand` é responsabilidade da aplicação consumidora.

```typescript
// uno.config.ts
import { presetMaxUno } from "@maxvue/max-components-ui/preset";

export default defineConfig({
  presets: [presetMaxUno()],
});
```

> Veja todas as classes utilitárias e paleta de cores em [docs/THEME.md](docs/THEME.md).

---

## 📝 Tipos TypeScript

A biblioteca exporta interfaces úteis para tipagem:

```typescript
import type {
  MaxTableColumn,
  MaxTableButtons,
  SelectItem,
  SelectOptions,
} from "@maxvue/max-components-ui";
```

> Referência completa em [docs/TYPES.md](docs/TYPES.md).

---

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Modo desenvolvimento
npm run dev

# Playground para testes
npm run dev:playground

# Verificar tipagem
npm run type-check

# Lint (ESLint + Stylelint)
npm run lint

# Build para produção
npm run build

# Release (build + version patch + push + publish)
npm run release
```

---

## 📂 Estrutura do Projeto

```
src/
├── components/          # 59 componentes Vue (.vue)
├── components-manifest.json  # Manifesto de componentes e aliases (auto-gerado)
├── constants/           # Constantes (DDI/bandeiras)
├── helpers/             # Resolver, cache, CSS helpers
├── locales/             # Traduções (pt-BR)
├── prime/               # Re-exportações do PrimeVue
├── scripts/             # Scripts de geração (resolver, manifesto)
├── stores/              # Pinia stores (ícones, popover, modal, confirm)
├── styles/              # Tema MaxStyle (PrimeVue preset)
├── themes/              # Variáveis SCSS (cores, fontes, parâmetros)
├── types/               # Interfaces e tipos TypeScript
├── utils/               # Utilitários internos
├── presetMaxUno.ts      # Preset UnoCSS
└── index.ts             # Entry point principal
```

---

## 📚 Documentação Adicional

| Documento                                  | Descrição                          |
| ------------------------------------------ | ---------------------------------- |
| [COMPONENTS.md](COMPONENTS.md)             | Catálogo completo de componentes   |
| [CONTRIBUTING.md](CONTRIBUTING.md)         | Guia de contribuição               |
| [docs/TYPES.md](docs/TYPES.md)             | Referência de tipos TypeScript     |
| [docs/THEME.md](docs/THEME.md)             | Tema e preset UnoCSS               |
| [docs/STORES.md](docs/STORES.md)           | Stores Pinia                       |
| [docs/AUTO-IMPORT.md](docs/AUTO-IMPORT.md) | Configuração do auto-import        |
| [docs/PRIME.md](docs/PRIME.md)             | Componentes PrimeVue re-exportados |

---

## 📜 Licença

MIT

## 🤝 Contribuição

Contribuições são bem-vindas! Leia o [Guia de Contribuição](CONTRIBUTING.md) antes de começar.
