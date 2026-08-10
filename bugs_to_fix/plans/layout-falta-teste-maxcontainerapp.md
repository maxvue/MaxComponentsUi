# MaxContainerApp não tem nenhum teste dedicado

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxContainerApp.vue:1-26`, `tests/components/LayoutComponents.test.ts`
- **Domínio:** tabela-layout-exibicao

## Problema

`MaxContainerApp` é o container raiz da aplicação — define a grid de nível superior (`grid-template-columns: auto 1fr`, linha 19), a viewport (`100vw`/`100vh`, linhas 17-18) e a variação mobile via seletor de atributo (`&[screen='mobile'] { grid-template-columns: 1fr }`, linhas 22-24).

Uma varredura em `tests/` mostra que o nome só aparece em `tests/components/MaxBottomMenu.test.ts` e `tests/components/MaxPageLayout.test.ts`, ambos como componente **stubado** ou como consequência indireta de montar `MaxPageLayout`. Não existe `tests/components/MaxContainerApp.test.ts`, e o componente também não está em `tests/components/LayoutComponents.test.ts`, que cobre `MaxGrid`, `MaxGridCols` e `MaxAnimateFade`.

Comportamentos hoje não verificados:
- Renderização do slot default.
- Repasse de `attrs` ao elemento raiz (`v-bind="attrs"`, linha 2) — inclusive o atributo `screen`, do qual depende o layout mobile.
- Presença da classe `.container-app`.

O atributo `screen` é particularmente relevante: `MaxPageLayout.vue:20` decide renderizar o `MaxBottomMenu` com base em `attrs.screen === 'mobile'`, e o CSS de `MaxContainerApp` reage ao mesmo valor. É um contrato implícito entre componentes, inteiramente sem cobertura.

## Impacto

- Uma regressão no repasse de attrs quebraria o layout mobile de toda a aplicação sem que nenhum teste falhasse.
- O contrato do atributo `screen` entre `MaxContainerApp` e `MaxPageLayout` não é verificado em ponto algum.

## Plano de correção

1. Criar `tests/components/MaxContainerApp.test.ts` (ou adicionar um bloco `describe` em `LayoutComponents.test.ts`, seguindo o agrupamento já usado para os demais componentes de layout).
2. Cobrir:
   - Renderiza o slot default.
   - Aplica a classe `.container-app` no elemento raiz.
   - Repassa `screen="mobile"` como atributo do elemento raiz.
   - Repassa attrs arbitrários (`data-*`, `class` adicional) sem perdê-los.

## Verificação

- `npx vitest run tests/components/MaxContainerApp.test.ts`.
- `npm run test:coverage` confirmando que `MaxContainerApp.vue` sai de 0 testes dedicados.
