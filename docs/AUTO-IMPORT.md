# Auto-Import de Componentes

O `MaxComponentsUiResolver` permite importar automaticamente os componentes sem declarar `import` manualmente.
Funciona com [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components).

---

## Configuração

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { MaxComponentsUiResolver } from '@maxvue/max-components-ui/resolver'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [MaxComponentsUiResolver()]
    })
  ]
})
```

---

## Como Funciona

O resolver segue esta lógica de resolução:

1. **Verifica o manifesto de componentes** — Consulta o `src/components-manifest.json` para encontrar o componente pelo nome nativo (`Max*`) ou por seus aliases canônicos (ex: `Button` -> `MaxButton`, `InputField` -> `MaxInputText`).
2. **Importação direta do pacote** — Resolve os componentes diretamente a partir do entry point público `@maxvue/max-components-ui`.

Componentes de bibliotecas externas (como `primevue/*`) não são resolvidos por este resolver. Caso utilize componentes PrimeVue na sua aplicação, configure o resolvedor oficial (`@primevue/auto-import-resolver`) separadamente ou importe-os diretamente de `primevue/*`.

---

## Aliases Suportados

Cada componente pode ser usado com múltiplos nomes. Exemplos:

| Componente | Aliases aceitos |
|------------|----------------|
| `MaxButton` | `Button`, `Botao`, `max-button`, `max_button` |
| `MaxInputText` | `InputText`, `InputField`, `input-text`, `input_text` |
| `MaxInputPhone` | `MaxPhoneField`, `PhoneField`, `InputPhone`, `phone-field`, `input_phone` |
| `MaxTitle1` | `Title1`, `T1`, `t-1`, `t_1` |
| `MaxTable` | `Table`, `table`, `max-table` |
| `MaxGrid` | `Grid`, `grid`, `max-grid` |
| `MaxIcon` | `Icon`, `icon`, `max-icon` |
| `MaxModal` | `Modal`, `modal`, `max-modal` |
| `MaxPopover` | `Popover`, `popover`, `max-popover` |
| `MaxLoader` | `Loader`, `loader`, `max-loader` |

> A lista completa de aliases está no arquivo `src/components-manifest.json`.

---

## Exemplo de Uso

Após configurar, basta usar os componentes no template:

```vue
<template>
  <Grid>
    <!-- Todos auto-importados, sem declarar import -->
    <MaxInputText v-model="nome" label="Nome" />
    <MaxInputSelect v-model="tipo" label="Tipo" :options="opcoes" />
    <MaxButton label="Salvar" icon="mdi:check" @click="salvar" />

    <!-- Modais e tabelas Max nativos também são auto-importados -->
    <MaxModal v-model="modalAberto" header="Detalhes">
      <MaxTable :data="dados">
        <MaxTableColumn field="nome" label="Nome" />
      </MaxTable>
    </MaxModal>
  </Grid>
</template>
```

---

## Notas Importantes

- O resolver é **gerado automaticamente** pelo script `src/scripts/generateResolver.ts`. Não modifique o `MaxComponentsUiResolver.ts` manualmente.
- Componentes de bibliotecas externas (ex: PrimeVue) não são resolvidos por este resolver e devem ser importados diretamente de seus pacotes oficiais (`primevue/*`).
- Os aliases suportam formatos `PascalCase`, `kebab-case` e `snake_case`.
