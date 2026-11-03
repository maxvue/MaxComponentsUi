# Especificação técnica — múltiplos overlays no MaxBadge

## 1. Contexto & Objetivo

- Data: 03/11/2026. Projeto: `@maxvue/max-components-ui`, versão declarada `1.1.36`.
- Worktree e branch: `wt-24731b16`, em `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-24731b16`.
- Solicitação: permitir vários overlays, cada um com cor opcional, criando o tipo público `OverlayData`.
- Hoje `src/components/MaxBadge.vue` aceita somente booleano, texto ou número. Booleanos representam status; texto e número geram uma única pílula à direita. As cores dessa pílula vêm de `resolveBadgeColors`.
- Valor entregue: representar contagens ou informações simultâneas sem criar badges adicionais e sem quebrar consumidores existentes.

## 2. Escopo

### Incluído

1. Contrato público exato:

```typescript
export type OverlayData = {
    color?: string;
    value: string | number;
};

// Em MaxBadgeProps:
overlay?: boolean | string | number | string[] | number[] | OverlayData | OverlayData[];
```

2. Normalização reativa para uma lista interna e renderização das pílulas na ordem recebida.
3. Cores independentes por objeto, preservando a paleta atual quando `color` estiver ausente ou vazia.
4. `MaxBadgeButton` também deve aceitar e renderizar todos os formatos de múltiplos overlays, com cores independentes — requisito explicitamente solicitado pelo usuário. Propagar os tipos no wrapper físico `MaxBadgeComponent` e em `MaxTag`; o grupo herda a atualização por `MaxBadgeButtonProps`.
5. Exportação de `OverlayData` em `src/index.ts`, testes de comportamento e tipos, exemplos no playground.

### Fora de escopo

- Arrays heterogêneos de primitivas/objetos, arrays de booleanos, listas aninhadas, ícones, tooltips, eventos ou identificadores novos por overlay.
- Reposicionamento absoluto das pílulas, truncamento, limite de itens, quebra de linha ou novo tamanho.
- Alterar cores globais, algoritmo compartilhado de luminância, aliases públicos, seleção de botões/grupos ou comportamento de status.
- Novas stores, API, persistência, cache, dependências, migração, publicação ou integração Git.

## 3. Arquitetura & Mudanças Técnicas

### Contratos e preservação

| Entrada | Resultado esperado |
|---|---|
| `undefined` e `null` recebido por JavaScript | Nenhuma pílula; `null` não passa a fazer parte do tipo público |
| `true` / `false` | Alias atual para status `done` / `error`, sem pílula |
| Status explícito com booleano | Status explícito continua prevalecendo |
| Texto não vazio ou número, inclusive `0` | Uma pílula, idêntica à atual |
| `''` ou somente espaços | Nenhuma pílula |
| `string[]`, `number[]` | Uma pílula por valor exibível, preservando ordem e duplicatas |
| `OverlayData` | Uma pílula com `value` e paleta derivada de `color`, quando fornecida |
| `OverlayData[]` | Uma pílula por objeto exibível, com paletas independentes |
| `[]` ou lista só de valores vazios | Nenhuma pílula, sem espaçamento residual |

O filtro verifica `String(value).trim()` sem modificar o texto exibido. Não filtrar números por truthiness. Não converter objetos em `[object Object]` nem listas em texto separado por vírgulas. Não mutar arrays/objetos de entrada. Tipos inválidos recebidos por JavaScript devem ser ignorados de forma defensiva, sem ampliar o contrato público; não inventar validação de números finitos, arredondamento ou formatação.

### Decisões propostas de baixo impacto

- `color` é uma **cor base**, como a prop homônima do badge, não uma garantia de fundo literal. Para cada cor não vazia usar `resolveBadgeColors(item.color, isDark.value, props.neon)` e aplicar somente `overlayBg`/`overlayText`. Sem cor, reutilizar `colors.value`. Isso reaproveita o helper que já consome `getColorFromVar` do MaxUse e preserva as regras existentes de tema.
- Cores inválidas e variáveis não resolvidas seguem o fallback já existente do helper. Não prometer contraste WCAG mínimo: o nome/documentação do helper não comprova a razão de contraste de todas as combinações atuais.
- Preservar `.max-badge-overlay`, sua altura, padding, tipografia e margem esquerda atual de `10px` para cada pílula. Manter todas como filhas diretas do badge; não criar container que altere a anatomia legada.
- Usar índice como chave primitiva local da lista de spans sem estado. `value` não serve como chave porque duplicatas são válidas; não expor `id` novo.
- Centralizar a união no contrato de `MaxBadgeProps`; os wrappers podem usar `MaxBadgeProps['overlay']` para evitar divergência, desde que a compilação confirme os tipos runtime corretos. Não introduzir uma hierarquia de tipos nova sem necessidade.
- Trata-se da própria biblioteca MaxComponentsUi. Não substituir por componentes externos nem reintroduzir PrimeVue. Não há Get/Save/cache nesta demanda: preservar a infraestrutura MaxPinia existente, sem criar store artificial. Helpers de cor continuam pela cadeia local → MaxUse, sem nova biblioteca utilitária.

### Arquivos

Existentes a modificar: `src/components/MaxBadge.vue`, `src/index.ts`, `src/components/MaxBadgeButton.vue`, `src/components/MaxBadgeComponent.vue`, `src/components/MaxTag.vue`; os quatro testes `tests/components/MaxBadge*.test.ts` existentes; `playground/src/scenarios/buttons-badges.vue`.

Novos propostos: `tests/components/MaxTag.test.ts`, `tests/components/MaxBadgeOverlayTypes.test.ts` e `tests/browser/MaxBadge.browser.ts`. Confirmar ausência desses arquivos na retomada antes de criar.

Arquivos de referência sem alteração planejada: `src/helpers/colorLuminance.ts`, `src/components/MaxBadgeButtonsGroup.vue`, configurações de build/testes e `package.json`. Não editar `dist` manualmente nem regenerar resolver: nenhum componente novo é exportado.

Fluxo: `overlay` → lista normalizada → filtro de valores exibíveis → resolução de cores por item → spans ordenados. O status permanece calculado em fluxo independente.

## 4. Plano de Execução Faseado

Executor solicitado pelo usuário: **Gemini 3.8 Flash, esforço High**. Seguir o roteiro sequencial e os checkpoints por leitura de `plan.md`, sem reduzir escopo ou testes. A seleção é uma decisão do usuário, não comprovação de disponibilidade do modelo; não alterar configuração nem iniciar sua execução nesta sessão.

1. **T1 — Preflight por leitura:** conferir branch, alterações preexistentes, scripts, dependências efetivas, destinos de artefatos e isolamento. Bloquear validação dependente em falha de integridade, sem bypass.
2. **T2 — Contrato e implementação:** criar tipo, exportar, ampliar wrappers, normalizar e renderizar lista reativa. Preservar status e estilos.
3. **T3 — Cobertura:** implementar testes de valores, cores, reatividade, duplicatas, compatibilidade, encaminhamento e contrato público; adicionar teste de navegador.
4. **T4 — Exemplos:** ampliar cenário existente com listas primitivas e objetos coloridos usando tokens semânticos, sem remover exemplos legados.
5. **T5 — Validação e revisão:** depois de todo o lote e seus testes, executar gates, diagnosticar/corrigir falhas em lote e revisar o diff. Não publicar nem integrar.

## 5. Critérios de Aceite & Validação

- Todas as variantes da união são aceitas pelo TypeScript; `OverlayData` é importável pela fachada e pelo módulo do componente. Arrays mistos não passam a integrar o contrato.
- Quantidade, texto, ordem e cores são verificáveis; zero e duplicatas permanecem; vazios não criam spans.
- `setProps`, atualização de valores/cores de dados reativos e mudanças de tema recalculam a saída sem mutação da entrada.
- Um overlay escalar mantém aparência e classes atuais; booleanos/status, ícone, label, uppercase, tamanho, neon, foco e seleção permanecem compatíveis.
- Wrappers e grupo exibem a mesma lista; cores explícitas não se tornam neutras ao desativar botão, enquanto itens sem cor seguem o fallback atual do badge interno.
- Em navegador real: pílulas sem sobreposição, margem de `10px`, mesma altura, texto legível em claro/escuro/neon e sem novos controles focáveis; conferir também tamanhos padrão/large/xlarge.
- Comandos e gates detalhados em `plan.md`. Nenhum teste, build ou instalação foi executado nesta sessão de planejamento. Disponibilidade dos módulos instalados, navegadores e validação do pacote gerado permanecem para Execute.
