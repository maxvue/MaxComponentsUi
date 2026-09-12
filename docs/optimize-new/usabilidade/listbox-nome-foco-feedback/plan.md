# Plano de implementação

## Objetivo e resultado esperado

Completar o contrato acessível de `MaxListBox` com nome do widget e filtro, foco visível e anúncios adequados de carregamento, erro e vazio, sem regredir a máquina de teclado existente.

## Escopo e fora de escopo

- Em escopo: título/header, filtro, raiz listbox, estados assíncronos e estilos de foco.
- Fora de escopo: algoritmo de virtualização, paginação/API, seleção e `aria-activedescendant` já funcionais.

## Arquivos a alterar/criar

- `src/components/MaxListBox.vue`
- `tests/components/MaxListBox.test.ts`

## Dependências e ordem

1. Definir props e IDs de nome.
2. Corrigir foco e estados live.
3. Reexecutar toda a matriz local/API/virtualizada.

## Passos de implementação

1. Criar IDs estáveis com `useId`; envolver título prop ou slot header em nó sempre presente e apontar `aria-labelledby` do listbox para ele.
2. Adicionar `ariaLabel` como fallback quando não houver título/header e avisar em desenvolvimento se o widget continuar sem nome.
3. Nomear o filtro por prop `filterLabel` com default derivado do título (“Filtrar …”) ou fallback “Filtrar opções”; manter placeholder apenas como dica.
4. Substituir `outline: none` por foco `:focus-visible` usando tokens canônicos tanto no filtro quanto na lista, inclusive vazia.
5. Expor carregamento e vazio em `role="status"`/`aria-live="polite"` e erro em `role="alert"`, com mensagens atômicas e botão de retry nomeado.
6. Evitar anúncio repetido em carregamentos incrementais: atualizar a região somente quando o estado lógico mudar, não a cada item virtualizado.
7. Preservar handlers de setas, disabled, seleção, scroll e active descendant sem reimplementá-los.

## Migração e compatibilidade

As novas props `ariaLabel` e `filterLabel` são aditivas; slots e props atuais permanecem. Manter classes existentes e adicionar wrappers/IDs sem mudar a estrutura de opções.

## Testes

- Unitários: nomes com prop, slot e fallback; filtro nomeado; IDs únicos; status loading/empty e alert/retry.
- Integração: foco visível e ciclo API loading→erro→retry→dados, inclusive virtualizado.
- Regressão: setas, Home/End, disabled, seleção e `aria-activedescendant` continuam corretos.

## Critérios de aceite mensuráveis

- Listbox e filtro possuem nome não vazio em 100% das variantes testadas.
- Filtro e lista exibem indicador perceptível em `:focus-visible`.
- Cada transição de loading, erro ou vazio gera no máximo um anúncio apropriado.
- Toda a suíte atual de `MaxListBox` permanece verde.

## Riscos e rollback

Headers customizados podem duplicar nomes e live regions podem gerar ruído. Mitigar com precedência explícita e estado derivado único. Reverter anúncios incrementais isoladamente se leitores reais demonstrarem repetição, mantendo nome e foco.

## Validação final

Executar a suíte de `MaxListBox`, lint/typecheck e teste manual com teclado/leitor nos modos local, vazio, erro, carregamento e virtualização.
