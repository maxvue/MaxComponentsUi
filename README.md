# @maxvue/max-components-ui

Biblioteca de componentes Vue 3 baseada em **PrimeVue 4**, construída com **TypeScript** e **Vite 8**.
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

> O PrimeVue 4 é gerenciado internamente pela biblioteca. Não é necessário instalá-lo separadamente.

---

## 🚀 Início Rápido

### Registro Global (Plugin)

```typescript
import { createApp } from "vue";
import MaxComponentsUi from "@maxvue/max-components-ui";

const app = createApp(App);

// Registra o PrimeVue com o tema Max + locale pt-BR automaticamente
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
| `@maxvue/max-components-ui/resolver` | `MaxComponentsUiResolver` para auto-import             | [docs/AUTO-IMPORT.md](docs/AUTO-IMPORT.md) |
| `@maxvue/max-components-ui/preset`   | `presetMaxUno` — preset UnoCSS com classes utilitárias | [docs/THEME.md](docs/THEME.md)             |
| `@maxvue/max-components-ui/prime`    | Re-exportação de componentes PrimeVue puros            | [docs/PRIME.md](docs/PRIME.md)             |
| `@maxvue/max-components-ui/stores`   | Stores Pinia (`useIconStore`, `usePopoverStore`)       | [docs/STORES.md](docs/STORES.md)           |

### Depreciado: `@maxvue/max-components-ui/prime`

O entry point `./prime` reexporta componentes crus do PrimeVue que não têm
equivalente Max. Ele está **depreciado** e será removido na próxima major,
junto com a saída definitiva do PrimeVue.

Se a sua aplicação usa qualquer um desses componentes — inclusive via
auto-import, sem `import` explícito no arquivo — passe a importá-los
diretamente de `primevue/*`, declarando o `primevue` como dependência da
própria aplicação, ou substitua-os por componentes Max equivalentes.

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
| **Telefone**              | `MaxPhoneField`                                                                                                                                                                                                                                                                                                  |
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
