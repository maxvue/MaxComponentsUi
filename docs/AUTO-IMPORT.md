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

1. **Verifica o manifesto de componentes** — Consulta o `components-manifest.json` para encontrar o componente pelo nome ou alias
2. **Fallback para PrimeVue** — Se não encontrar no manifesto, tenta resolver via `PrimeVueResolver` e importa de `@maxvue/max-components-ui/prime`

Isso significa que você pode usar **qualquer componente PrimeVue** diretamente, sem instalar o `@primevue/auto-import-resolver` separadamente.

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
    <InputSelect v-model="tipo" label="Tipo" :options="opcoes" />
    <MaxButton label="Salvar" icon="mdi:check" @click="salvar" />

    <!-- Componentes PrimeVue também são auto-importados -->
    <Card>
      <template #content>
        <DataTable :value="dados">
          <Column field="nome" header="Nome" />
        </DataTable>
      </template>
    </Card>
  </Grid>
</template>
```

---

## Notas Importantes

- O resolver é **gerado automaticamente** pelo script `src/scripts/generateResolver.ts`. Não modifique o `MaxComponentsUiResolver.ts` manualmente.
- Componentes PrimeVue importados via auto-import vêm de `@maxvue/max-components-ui/prime` (re-exportação), garantindo compatibilidade com o build da biblioteca.
- Os aliases suportam formatos `PascalCase`, `kebab-case` e `snake_case`.
