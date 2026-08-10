# Ícones estáticos e transições têm apenas testes de smoke

- **Categoria:** falta-de-teste
- **Severidade:** baixa
- **Arquivo(s):** `tests/components/IconsAndLoaders.test.ts:10-40`, `tests/components/DisplayAndTransitions.test.ts:103-124`, `src/components/MaxWaitIcon.vue`, `src/components/MaxDoneIcon.vue`, `src/components/MaxErrorIcon.vue`
- **Domínio:** tabela-layout-exibicao

## Problema

Os componentes de ícone estático e as transições têm exatamente um teste cada, todos verificando apenas que "renderiza SVG":

- `MaxDoneIcon` (`IconsAndLoaders.test.ts:11`)
- `MaxWaitIcon` (`IconsAndLoaders.test.ts:19`)
- `MaxErrorIcon` (`IconsAndLoaders.test.ts:27`)
- `MaxLoaderIcon` (`IconsAndLoaders.test.ts:34`)
- `TransitionFade`, `MaxTransitionFadeLight`, `MaxTransitionUp` (`DisplayAndTransitions.test.ts:104`, `:111`, `:118`)

Para os três ícones estáticos (`MaxDoneIcon`, `MaxErrorIcon`, `MaxWaitIcon`) o smoke test é largamente adequado — são componentes sem props, sem lógica e sem script. A cobertura fraca ali é aceitável e não justifica esforço.

O problema real está em dois pontos:

1. **`MaxLoaderIcon` tem lógica e ela está quebrada.** O teste da linha 34 verifica apenas a presença do SVG e da classe. Não verifica o repasse de attrs — que é justamente onde está o bug `const attrs = useAttrs;` (`MaxLoaderIcon.vue:26`, catalogado em `layout-maxloadericon-useattrs-sem-chamada.md`). Um teste de attrs teria capturado o defeito.

2. **As transições são testadas apenas no estado visível.** Os três testes montam com o slot presente e asseram que o conteúdo aparece. Nenhum alterna a visibilidade, que é a única coisa que uma `Transition` faz. As classes `*-enter-active` / `*-leave-to` — o comportamento inteiro do componente — não são exercitadas. É por isso que o defeito do `MaxAnimateFade` (sem `<Transition>` algum, catalogado à parte) passou despercebido: o teste dele, em `LayoutComponents.test.ts:59`, é idêntico em forma aos das transições que funcionam.

## Impacto

- Testes que passam igualmente com e sem a funcionalidade presente não protegem contra regressão.
- Dois defeitos reais nesta família de componentes escaparam justamente por essa lacuna.

## Plano de correção

1. Para `MaxLoaderIcon`: adicionar teste de repasse de attrs (`style`, `class`, `data-*`) ao elemento raiz — deve falhar contra o código atual.
2. Para as três transições: alternar a visibilidade do slot com `setProps`/`v-if` e asserir a presença das classes de transição durante a mudança, usando os utilitários de timer do Vitest para avançar a animação.
3. Manter os smoke tests dos ícones estáticos como estão — o custo/benefício de expandi-los não se justifica.

## Verificação

- `npx vitest run tests/components/IconsAndLoaders.test.ts tests/components/DisplayAndTransitions.test.ts`.
- O novo teste de attrs do `MaxLoaderIcon` deve falhar antes da correção de `layout-maxloadericon-useattrs-sem-chamada.md` e passar depois.
