# 02 — `MaxTabPanel` perdeu toda a lógica de exibição: renderiza todos os painéis ao mesmo tempo

- **Severidade:** Crítico
- **Tipo:** Bug / regressão funcional
- **Arquivo:** [src/components/MaxTabPanel.vue](../src/components/MaxTabPanel.vue)
- **Estado:** alteração **não commitada** no working tree

## Descrição

O template de `MaxTabPanel` foi reduzido a um `div` estático, mas **todo o script
foi mantido intacto**. O componente agora computa estado que nunca é consumido.

Template atual ([MaxTabPanel.vue:1-5](../src/components/MaxTabPanel.vue#L1-L5)):

```vue
<template>
    <div class="max-tab-panel" >
        <slot></slot>
    </div>
</template>
```

Template anterior (removido):

```vue
<div v-if="should_render" v-show="is_active" class="max-tab-panel" role="tabpanel"
     :id="`${context.id_prefix}-panel-${props.value}`"
     :aria-labelledby="`${context.id_prefix}-tab-${props.value}`">
```

Foram eliminados de uma só vez: `v-if="should_render"` (modo lazy),
`v-show="is_active"` (alternância de painel), `role="tabpanel"`, `id` e
`aria-labelledby`.

Enquanto isso, o script segue calculando `is_active`, `was_active` e
`should_render` ([MaxTabPanel.vue:18-31](../src/components/MaxTabPanel.vue#L18-L31))
— código 100% morto, confirmado pelo ESLint:

```
src/components/MaxTabPanel.vue
  31:11  warning  'should_render' is assigned a value but never used
```

## Cenário de falha

Mesmo que o problema de contexto do achado 01 fosse resolvido, um `MaxTabs` com
três painéis exibiria **os três conteúdos empilhados simultaneamente**, em vez de
apenas o painel ativo. O componente deixa de cumprir sua única função.

Efeitos colaterais adicionais:
- A prop `lazy` do `MaxTabs` torna-se inoperante — todo conteúdo pesado de todas
  as abas é montado de imediato (custo de performance e requisições de rede
  disparadas por abas nunca visitadas).
- Leitores de tela perdem a relação painel↔header (`aria-labelledby` removido) e
  o papel semântico (`role="tabpanel"`).

## Evidência

Testes que cobriam exatamente esse comportamento agora falham:

```
FAIL  MaxTabPanel > mostra apenas o painel do tab ativo
FAIL  MaxTabPanel > troca o painel visivel quando value muda
FAIL  MaxTabPanel > aplica role tabpanel e aria-labelledby apontando ao header
FAIL  MaxTabPanel > com lazy, o painel inativo nunca foi montado
FAIL  MaxTabPanel > sem lazy, o painel inativo permanece no DOM apenas oculto
FAIL  MaxTabPanel > com lazy, painel ja visitado continua montado apos sair
```

## Causa raiz

Edição incompleta durante a reescrita de Tabs: o template foi esvaziado sem que o
script correspondente fosse removido nem a responsabilidade transferida para
outro componente. A responsabilidade de exibição migrou informalmente para
`MaxTabItem` (que usa `v-if="is_active"`), deixando `MaxTabPanel` como um invólucro
sem propósito.

## Correção recomendada

Depende da rota escolhida no achado 01:

- **Rota A (nova arquitetura):** excluir o arquivo `MaxTabPanel.vue` e seus
  exports — a função foi absorvida por `MaxTabItem`.
- **Rota B (reverter):** `git checkout -- src/components/MaxTabPanel.vue`.

Em nenhum cenário faz sentido manter o arquivo no estado atual: ou ele controla
visibilidade, ou não deve existir.
