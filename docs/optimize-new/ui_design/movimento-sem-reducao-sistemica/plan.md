# Plano de implementação — política sistêmica de movimento reduzido

## Objetivo e escopo

Classificar movimentos funcionais/decorativos e fornecer alternativa sob `prefers-reduced-motion: reduce` para todos os SFCs. Priorizar deslocamento, flip, zoom, pulse e shake; preservar feedback funcional como loading/progresso sem movimento vestibular.

## Fora de escopo

Não remover feedback funcional, alterar duração de negócios como timeout de toast ou redesenhar transições para usuários sem preferência reduzida.

## Arquivos

- Criar `src/themes/_motion.scss` e tokens em `src/themes/tokens.scss`.
- Alterar as primitivas `MaxTransitionUp.vue`, `MaxTransitionFadeLight.vue` e `TransitionFade.vue`, depois os SFCs inventariados, incluindo `MaxCreditCard.vue`, `MaxAiIcon.vue`, `MaxModal.vue` e `MaxToast.vue`.
- Ampliar `tests/architecture/styleStandardsValidation.test.ts` e criar testes browser/visuais de motion.

## Dependências e ordem

1. Inventário e classificação.
2. Primitivas/tokens.
3. Componentes de maior risco.
4. Demais 52 arquivos.
5. Gate arquitetural.

## Passos

1. Classificar cada transition/animation: cor curta, estado funcional ou movimento não essencial.
2. Criar mixins para duração normal e redução; sob reduce eliminar transforms/deslocamentos/pulsos e reduzir fades ao mínimo.
3. Corrigir primeiro 150 px, flip 3D, pulso infinito, shake e movimentos do toast.
4. Fazer primitivas públicas encerrarem transição imediatamente ou usarem fade mínimo em reduce.
5. Para spinner/progresso, manter estado perceptível sem animação intensa; temporização do toast continua correta sem barra animada.
6. Gate exige bloco reduce ou exceção catalogada para cada movimento relevante.
7. Testar mudanças dinâmicas da media query sem reload.

## Migração e testes

API permanece. Consumidores recebem comportamento acessível automaticamente. Unitários verificam classes/estado; browser emula reduce/no-preference e compara transforms/durações; a11y confirma operação/feedback. Benchmark mede ausência de animações contínuas, sem teto temporal rígido.

## Aceite

Todos os 56 SFCs inventariados têm tratamento ou exceção; movimentos de grande deslocamento/3D/shake/pulso são removidos em reduce; ações, timers e loading continuam funcionais; gate detecta regressão.

## Riscos e rollback

`transition: none` pode ocultar callback dependente de evento; testar lifecycle e usar duração mínima quando necessário. Spinner estático pode parecer travado; fornecer texto/ícone. Rollback por componente mantendo mixin e exceção temporária.

## Validação final

Busca estática, testes media query, matriz manual dos componentes críticos, suíte, stylelint, screenshots e `git diff --check`.
