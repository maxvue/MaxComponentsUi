# Plano — paleta dinâmica e modos do MaxApp

## Objetivo
Substituir as escalas fixas de `colors.scss` por cores calculadas com MaxUse, configuráveis pela prop `colors` do `MaxApp`, gerenciadas em store Pinia compatível com MaxPinia e persistidas em cache. Adicionar `free-mode`, alias `blank-mode`, e `no-login`, mantendo os comportamentos atuais quando omitidos.

## Arquivos
- Criar `src/types/colors.ts`, `src/helpers/colorPalette.ts` e `src/stores/useColors.Store.ts`.
- Editar `src/components/MaxApp.vue`, `src/stores/index.ts`, `src/index.ts` e `src/helpers/maxCacheKeys.ts`.
- Editar `src/themes/colors.scss` e `src/themes/all.scss`; preservar os contratos de `src/themes/tokens.scss` e `src/styles/style.ts`.
- Criar `tests/helpers/colorPalette.test.ts` e `tests/stores/useColors.Store.test.ts`; ampliar `tests/components/MaxApp.test.ts` e `tests/components/MaxApp.controlled-theme.test.ts`.
- Atualizar `README.md` com as novas props e o funcionamento do cache.

## Passos
1. Definir uma paleta tipada, aceitando sobrescritas parciais em `colors` e completando as demais entradas com estes padrões (nomes correspondentes às variáveis `--nome`):
   - `pink: #ED58A2`, `red: #E88188`, `red-b: #FF766F`, `orange: #F9B182`, `orange-b: #FFAD48`, `yellow: #FFE38B`, `yellow-b: #FDFD9F`.
   - `green: #96D796`, `green-b: #83E083`, `emerald: #25BF8C`, `seagreen: #34B9B1`, `lime: #8FD02B`, `blue: #56C2D7`, `blue-b: #8FBCF5`, `violet: #AF64F7`.
   - `gray: #ABBBCD`, `gray-light: #D7E0E9`, `zinc: #7D7D86`, `white: #EEEEEE`, `black: #111111`, `background: #ABBBCD`, `primary: #B8BFCA`, `secondary: #7D7D86`.
   - `warn: #F5A621`, `danger: #FF766F`, `success: #83E083`, `info: #23ADEB`, `error: #E88188`.
2. Criar o calculador usando `getColorFromVar` importado como `GetColor` de MaxUse. A declaração instalada retorna `ColorInstance`: usar suas operações para derivar as escalas, não presumir que o helper já gera uma paleta. Preservar nomes, níveis e inversões claro/escuro existentes; manter a marca teal `--max-primary-*` separada do neutro legado `--primary-*`, além dos tokens de foco.
3. Criar a store reativa e o cache persistente versionado, identificado pela paleta efetiva normalizada e pela versão do algoritmo. Cache válido evita cálculo; ausência, corrupção ou mudança da paleta provoca recálculo. Observar substituições e alterações internas da prop; aplicar as variáveis globais antes da exibição do conteúdo. Registrar a chave na limpeza escopada existente e tolerar SSR e armazenamento indisponível.
4. Integrar a store ao `MaxApp` e substituir as escalas manuais de `colors.scss`, preservando os seletores de tema e o consumo de estilos/componentes sem `MaxApp`, com inicialização padrão compartilhando o mesmo calculador. Não reintroduzir PrimeVue nem referências locais a MaxUse.
5. Adicionar `freeMode` e `blankMode`, ambos `false` por padrão, dentro do getter de `isBlank`: combinar `meta.layout === 'blank'`, `blankPages`, `freeMode` e `blankMode` com OU lógico. Renderizar apenas a área de conteúdo, sem barras; preservar os singletons globais. Não reproduzir a duplicação de `freeMode` nem o OU fora de `computed` do exemplo.
6. Adicionar `noLogin`, padrão `false`: permitir renderização do conteúdo/layout público sem tela de login e sem depender do sucesso do carregamento do usuário. Manter a precedência do modo livre; não simular autenticação, liberar extras autenticados ou alterar guards e autorização de rotas/API. Preservar o fluxo atual de login, carregamento e erro quando a prop estiver desativada.
7. Implementar os testes do conjunto e documentar as props; depois validar em lote com testes afetados, checagens de tipos, lint e build, além de teste em navegador para variáveis computadas e alternância claro/escuro. Corrigir e revalidar apenas o que falhar; não executar publicação ou operações de integração Git.

## Aceite
- Sem `colors`, todas as cores-base correspondem à paleta acima; sobrescritas parciais e mutações reativas atualizam as escalas e o DOM.
- Recarregar com a mesma paleta reutiliza cache sem cálculo; alterar a paleta recalcula e persiste; cache inválido ou bloqueado não impede a aplicação.
- Escalas públicas, tema escuro, foco, marca teal e componentes usados fora do `MaxApp` permanecem funcionais.
- `free-mode` e `blank-mode` removem todas as barras; `no-login` elimina a tela de login sem conceder autenticação. As combinações e o comportamento padrão têm testes de regressão.
- Testes afetados, tipos, lint, build e verificação visual no navegador aprovados, ou limitações explicitamente registradas.
