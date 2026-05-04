# MaxUse

[![npm version](https://img.shields.io/npm/v/@maxvue/max-use.svg)](https://www.npmjs.com/package/@maxvue/max-use)
[![license](https://img.shields.io/npm/l/@maxvue/max-use.svg)](https://github.com/maxvue/MaxUse/blob/main/LICENSE)
[![tree-shaking](https://img.shields.io/badge/tree--shaking-supported-brightgreen)](https://www.npmjs.com/package/@maxvue/max-use)

Uma poderosa biblioteca de utilitários para Vue 3, combinando as melhores ferramentas do **VueUse**, a praticidade do **Lodash** e uma vasta coleção de helpers customizados para o desenvolvimento moderno.

Totalmente projetada em torno do sistema de reatividade do Vue, todas as funções processam de maneira fluida tanto valores reativos (Refs, Computeds, Getters) quanto primitivos, utilizando nativamente `toValue`.

## 📦 Instalação

```bash
npm install @maxvue/max-use @vueuse/core @vueuse/integrations vue
```

> Se você utilizar o submódulo `@maxvue/max-use/routes` (integração com Laravel/Ziggy), instale também:
> ```bash
> npm install ziggy-js
> ```

## 🚀 Como Usar

A **MaxUse** possui uma arquitetura modularizada, oferecendo flexibilidade total na forma de importação e suporte total a *tree-shaking*.

### 1. Importação Individual (Recomendado)

```ts
import { isString, isWeekend, capitalize, deepMerge } from '@maxvue/max-use'

const text = "hello"
if (isString(text)) {
  console.log(capitalize(text)) // Hello
}
```

### 2. O Objeto Centralizado (`_`)

Para manter a conveniência do padrão Lodash, a MaxUse exporta o objeto `_`. Ele agrupa **todos os helpers próprios** e também inclui as funções do **VueUse**, priorizando a MaxUse em caso de conflitos.

```ts
import { _ } from '@maxvue/max-use'

// Helpers nativos da MaxUse
const id = _.random(1, 10)
const merged = _.deepMerge({ a: 1 }, { b: 2 })

// Composables do VueUse integrados
const { x, y } = _.useMouse()
```

### 3. Importação por Submódulos

Para otimizar o build, você pode importar diretamente das categorias:

```ts
import { isTouchDevice } from '@maxvue/max-use/browser'
import { addTime, isWeekend } from '@maxvue/max-use/dates'
import { first, uniqueBy } from '@maxvue/max-use/iterables'
import { average, median } from '@maxvue/max-use/math'
import { deepMerge, renameKeys } from '@maxvue/max-use/objects'
import { truncate, readingTime } from '@maxvue/max-use/strings'
```

## ⚡ Poder de Reatividade

Diferente de bibliotecas utilitárias comuns, a MaxUse entende a reatividade do Vue. Você pode passar valores puros, `refs` ou funções `getter`.

```ts
import { ref, computed } from 'vue'
import { isPast } from '@maxvue/max-use'

const date = ref(new Date('2020-01-01'))
const isExpired = computed(() => isPast(date)) // Reativo!

// Também aceita getters
const isWeekendNow = isWeekend(() => new Date())
```

## 🛠️ Categorias e Funcionalidades

| Categoria | Descrição | Exemplos |
| :--- | :--- | :--- |
| **Browser** | Ambiente e dispositivos | `isTouchDevice` |
| **Dates** | Manipulação e verificação de datas | `isWeekend`, `addTime`, `isPast`, `isFuture`, `differences` |
| **Iterables** | Manipulação de arrays e coleções | `uniqueBy`, `first`, `last`, `chunk`, `groupBy`, `sortBy`, `sample` |
| **Math** | Cálculos e estatísticas | `average`, `median`, `roundUp`, `roundDown` |
| **Objects** | Manipulação profunda de objetos | `deepMerge`, `deepClone`, `set`, `get`, `renameKeys`, `mapValues` |
| **Strings** | Transformação e análise de texto | `capitalize`, `truncate`, `maskSensitive`, `readingTime`, `noHtml`, `initials` |
| **Types** | Validação de tipos e estados | `isBlank`, `hasContent`, `isObject`, `isNumber` |
| **Validations** | Verificações de dados comuns | `isEmail`, `isCpf`, `isCnpj` |
| **Format** | Formatadores de exibição | `formatBytes`, `formatCurrency` |
| **Electrical** | Cálculos de domínio elétrico | `wireSize` |

## 🧩 Auto Import

A MaxUse oferece integração nativa com `unplugin-auto-import`. Com uma única chamada, **todos os helpers e composables** ficam disponíveis globalmente sem precisar de imports manuais.

```ts
// vite.config.ts
import AutoImport from 'unplugin-auto-import/vite'
import { maxUseAutoImport } from '@maxvue/max-use'

export default defineConfig({
  plugins: [
    AutoImport({
      imports: [
        maxUseAutoImport(),
      ]
    })
  ]
})
```

> A função `maxUseAutoImport()` gera automaticamente a lista completa de exports da biblioteca, mantendo tudo sempre sincronizado com as atualizações da MaxUse.

## 🤝 Contribuindo

Ao contribuir, siga estes princípios:
1. **Padrão de Reatividade**: Use sempre `MaybeRefOrGetter<T>` para argumentos.
2. **Implementação**: Utilize `toValue(arg)` internamente.
3. **Documentação**: Adicione JSDoc completo para todas as funções.

## 📄 Licença

**MIT License** © [MaxVue](https://github.com/maxvue)
