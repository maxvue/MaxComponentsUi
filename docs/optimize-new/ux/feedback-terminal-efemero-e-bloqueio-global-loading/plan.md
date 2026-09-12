# Plano de implementação

## Objetivo e resultado esperado

Separar bloqueio pendente de feedback terminal, impedir ampliação silenciosa de um alvo local para o `body` e tornar início/resultado perceptíveis e programaticamente coerentes.

## Escopo e fora de escopo

- Em escopo: loading store, LoadScreen/Target, loaders genéricos, alvo, máscara, `aria-busy`, live status e bloqueio de interação.
- Fora de escopo: operações de negócio consumidoras e animação Lottie além de semântica/performance já existente.

## Arquivos a alterar/criar

- `src/stores/useLoading.Store.ts`
- `src/types/app.ts`
- `src/components/MaxLoadScreen.vue`, `src/components/MaxLoadScreenTarget.vue`
- `src/components/MaxLoader.vue`, `src/components/MaxLoaderAi.vue`
- `tests/stores/useLoading.Store.test.ts`
- `tests/components/MaxLoadScreen.test.ts`, `MaxLoadScreenTarget.test.ts`, `IconsAndLoaders.test.ts`, `MaxLoaderAi.test.ts`

## Dependências e ordem

1. Separar ciclo pendente/terminal na store e tipos.
2. Corrigir resolução e geometria do alvo.
3. Aplicar ARIA/inert com restauração.
4. Testar concorrência e políticas de duração.

## Passos de implementação

1. Representar itens pendentes e terminais separadamente; `done` recebe duração configurável e `error` persiste por default até `dismiss` ou `retry` explícito.
2. Remover a limpeza baseada apenas em “zero pendentes”; limpar chaves/targets somente quando cada política terminal terminar, sem depender de outra operação.
3. Adicionar APIs `dismiss` e metadados de recuperação, preservando `start/update/end/stop/error` do adapter atual.
4. Resolver seletor antes de Teleport: alvo inválido não usa `body`; registrar estado de integração observável, aviso em desenvolvimento e não montar bloqueio global.
5. Diferenciar `body` intencional (máscara fixa na viewport) de alvo local (overlay absoluto `inset: 0`, contido pelo alvo, sem pseudo-elemento 100vw/100vh); tornar painel responsivo sem `min-width: 500px` rígido.
6. Marcar o alvo válido com `aria-busy=true` apenas enquanto houver pendência e aplicar `inert` aos conteúdos encobertos, exceto overlay; salvar/restaurar atributos anteriores e não roubar foco.
7. Expor região `role="status"` para início/conclusão e `role="alert"` para erro, com `aria-atomic`; fornecer defaults equivalentes em MaxLoader/MaxLoaderAi sem sobrescrever ARIA do consumidor.
8. Garantir cleanup de timers, inert e atributos ao dispensar, trocar alvo ou desmontar.

## Migração e compatibilidade

Manter API atual e defaults de mensagem. A persistência de erro e duração de done mudam intencionalmente; permitir política global/por item e documentar `dismiss`. Alvos que dependiam de fallback inválido devem corrigir o seletor, com diagnóstico claro.

## Testes

- Store: done temporizado, error persistente, dismiss/retry, múltiplos itens e independência entre estados/targets.
- Integração: alvo local/global/válido/ausente/inválido, geometria, responsividade, cleanup e concorrência.
- Acessibilidade: transições live, `aria-busy`, inert real para teclado e restauração de atributos.
- Estabilidade: fake timers e desmontagem sem listeners/timers pendentes.

## Critérios de aceite mensuráveis

- Erro permanece até ação/política explícita; done respeita sua duração configurada.
- Seletor local inválido cobre 0 pixels do `body` e produz diagnóstico testável.
- Overlay local não excede o bounding box do alvo; global cobre a viewport apenas quando solicitado.
- Conteúdo bloqueado não é acionável por Tab/Enter e todos os atributos são restaurados ao fim.

## Riscos e rollback

`inert` e posicionamento do alvo podem conflitar com DOM/CSS do consumidor; guardar estado anterior e fornecer modo não bloqueante. Em regressão, desativar inert por configuração mantendo escopo, persistência e anúncios corrigidos.

## Validação final

Executar suítes store/componentes com fake timers, lint/typecheck e teste manual local/global com teclado e leitor de tela, incluindo dois loadings concorrentes e recuperação de erro.
