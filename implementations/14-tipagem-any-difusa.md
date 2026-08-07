# 14 — Uso difuso de `: any` enfraquece a API pública tipada

- **Severidade:** Baixo
- **Tipo:** Sugestão de melhoria
- **Escopo:** 125 ocorrências em `src/`

## Situação

A biblioteca declara-se como uma API TypeScript tipada — `defineProps<Interface>()`
com TSDoc por prop é uma convenção obrigatória do `CLAUDE.md`. Porém há 125
ocorrências de `: any`, concentradas em:

| Arquivo | Ocorrências |
|---|---|
| [MaxTagsList.vue](../src/components/MaxTagsList.vue) | 13 |
| [MaxTagSelect.vue](../src/components/MaxTagSelect.vue) | 9 |
| [MaxInputSelect.vue](../src/components/MaxInputSelect.vue) | 8 |
| [types/index.ts](../src/types/index.ts) | 7 |
| [MaxTableFields.vue](../src/components/MaxTableFields.vue) | 7 |
| demais | ~81 |

O `type-check` passa — mas passa **porque** `any` desativa a verificação nesses
pontos, não porque os tipos estejam corretos.

## Por que importa aqui mais do que num app

Numa biblioteca, os tipos **são parte do contrato público**. Quando uma prop é
`any`, o consumidor perde:
- autocomplete no editor;
- detecção de erro em tempo de compilação;
- documentação implícita sobre o que o valor aceita.

O caso mais ilustrativo é `modelValue: any` em componentes como
[MaxInputSwitch.vue:34](../src/components/MaxInputSwitch.vue#L34). O componente
tem `trueValue`/`falseValue` genéricos, então `any` parece justificável — mas o
resultado é que o TypeScript não consegue relacionar `modelValue`, `trueValue` e
`falseValue` entre si. Foi exatamente essa ausência de relação que permitiu o bug
do achado [05](05-maxinputswitch-label-direita.md) passar pelo compilador sem
qualquer sinal.

## Casos com solução direta

### Genéricos em vez de `any`

Vue 3.3+ suporta componentes genéricos, que resolvem o caso do switch e dos
selects preservando a relação entre props:

```vue
<script setup lang="ts" generic="T">
    const props = defineProps<{
        modelValue: T;
        trueValue: T;
        falseValue: T;
    }>();

    const emit = defineEmits<{ 'update:modelValue': [value: T] }>();
</script>
```

Agora `<MaxInputSwitch v-model="ativo" :true-value="1" :false-value="0" />` com
`ativo: boolean` vira **erro de compilação** no consumidor, em vez de bug
silencioso em runtime.

### Contexto de injeção tipado

```ts
const tabs_info: any = inject('tabs_info');
```
[MaxTabItem.vue:29](../src/components/MaxTabItem.vue#L29)

Este é o pior caso do repositório: `any` **combinado** com chave string. Ambos os
mecanismos de segurança (tipo e chave única) foram descartados de uma vez — o que
é a causa direta do achado [01](01-tabs-contexto-quebrado.md), já que nada
alertou sobre a incompatibilidade entre o que `MaxTabs` fornece e o que os filhos
consomem.

O padrão correto já existia no próprio repositório, em
[tabsContext.ts](../src/helpers/tabsContext.ts):

```ts
export const TABS_INJECTION_KEY: InjectionKey<TabsContext> = Symbol('max-tabs');
```

Com `InjectionKey<T>`, o `inject` retorna `TabsContext | undefined` tipado e
qualquer divergência entre provider e consumer vira erro de compilação.

## Recomendação

Não é um problema que justifique uma refatoração ampla imediata. A abordagem
proporcional:

1. **Tipar todo novo código** — nenhum `any` novo em componentes adicionados ou
   migrados.
2. **Aproveitar a migração PrimeVue em curso** — cada componente listado em
   [status-primevue.migration.yaml](../status-primevue.migration.yaml) já será
   reescrito. Incluir "eliminar `any`" no checklist dos planos em
   [migration_plans/](../migration_plans/) distribui o esforço sem criar uma
   frente de trabalho separada.
3. **Priorizar contextos de injeção** — sempre `InjectionKey<T>` + `Symbol`,
   nunca string + `any`. Este item tem retorno imediato e custo baixo.
4. **Não ativar `no-explicit-any` como erro agora** — com 125 ocorrências, o
   build ficaria vermelho e a regra seria suprimida. Ativar como `warn` e
   promover a `error` quando a contagem estiver baixa.

## Observação

`any` é legítimo em alguns pontos — payloads de API de formato desconhecido,
por exemplo. A meta não é zero ocorrências, e sim que cada uma seja uma decisão
consciente em vez de um atalho. Nos casos de `modelValue` e de contexto de
injeção descritos acima, existe alternativa tipada direta e o custo de adotá-la é
baixo.
