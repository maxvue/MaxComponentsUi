# MaxBadgeComponent renderiza OverlayBadge vazio, ignorando valor e slot

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxBadgeComponent.vue:4`, `src/components/MaxBadgeComponent.vue:60-62`, `src/components/MaxBadgeComponent.vue:70`
- **Domínio:** tabela-layout-exibicao

## Problema

Quando `overlay` é verdadeiro, o componente renderiza:

```vue
<OverlayBadge v-if="is_overlay" />
```

Sem `value`, sem `severity`, sem `v-bind="attrs"` e **sem slot default**. O `OverlayBadge` do PrimeVue funciona envolvendo um elemento filho e posicionando o badge sobre ele — sem conteúdo no slot, ele renderiza um wrapper vazio com um badge sem valor. O resultado é um badge em branco.

Note o contraste com o ramo `v-else` da linha 5, que recebe tratamento completo: `v-bind="attrs"`, `:value="message"`, `:class`, `:style` com cores calculadas.

Três props existem exclusivamente para esse modo e nenhuma é usada:

```ts
/** Apenas se estiver usando overlay = true */
badge?: any;                        // linha 60 — nunca lida
/** Apenas se estiver usando overlay = true */
overlay?: boolean | undefined;      // linha 62 — só lida para escolher o ramo (linha 70)
```

`props.badge`, cuja documentação diz explicitamente destinar-se ao modo overlay, não é referenciada em lugar algum do componente. Ela também é tipada como `any`, contrariando a convenção de tipagem do projeto.

O componente não tem teste cobrindo o modo overlay: `tests/components/MaxBadgeComponent.test.ts` tem 6 testes e nenhum passa `overlay: true`.

## Impacto

- Modo `overlay` produz um badge visualmente vazio — funcionalidade quebrada.
- Prop `badge` documentada e inerte.
- Cores calculadas (`bg_color`, `text_color`) e o ícone não se aplicam ao modo overlay.

## Plano de correção

1. Passar o conteúdo e os atributos ao `OverlayBadge`, espelhando o tratamento do `Badge`:
   ```vue
   <OverlayBadge v-if="is_overlay" v-bind="attrs" :value="message" :style="{ backgroundColor: bg_color, color: text_color }">
       <slot></slot>
   </OverlayBadge>
   ```
2. Definir o papel de `props.badge`: se for a configuração do badge sobreposto, repassá-la (`:badge="props.badge"`); se for redundante com `message`, removê-la. Tipá-la adequadamente em vez de `any`.
3. Adicionar um slot default ao componente para que o consumidor forneça o elemento sobre o qual o badge é posicionado — hoje não há slot algum.

## Verificação

- Teste com `overlay: true` e `label: '5'`, asserindo que o valor aparece no `OverlayBadge`.
- Teste com `overlay: true` e um slot default, asserindo que o filho é renderizado.
- `npx vitest run tests/components/MaxBadgeComponent.test.ts` e `npm run type-check`.
