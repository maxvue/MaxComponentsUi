# Plano de execução — width, maxWidth e minWidth em overlays

## 1. Identificação e autorização

- Data: 16/10/2026.
- Projeto: `@maxvue/max-components-ui` (`1.1.8`).
- Worktree/branch: `wt-799a14c0`.
- Diretório obrigatório: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-799a14c0`.
- Especificação: `docs/plans/wt-799a14c0/spec.md`.
- Situação: planejamento entregue para revisão. Este documento não autoriza sua própria execução.

O usuário solicitou `width` e `maxWidth` no `MaxDrawer`, como existem no `MaxModal`, e `minWidth` nos dois. Esta sessão só pode escrever spec, plano e eventuais notificações nos destinos autorizados. Não implementar nem escrever `execution-state.json` durante Plan.

Na execução futura, trabalhar exclusivamente nesta worktree pré-alocada. Não criar outra, trocar branch, commitar, fazer merge, push, release ou remover a worktree. A integração e a limpeza pertencem ao MaxCode/usuário.

## 2. Resultado esperado e decisões

Público afetado: aplicações consumidoras da biblioteca que abrem modais ou gavetas e precisam dimensionar o painel.

### Contrato a implementar

| Componente | Nova prop | Conversão e destino |
| --- | --- | --- |
| `MaxDrawer` | `width?: string \| number` | Número → px; string sem coerção → `width` do painel. |
| `MaxDrawer` | `maxWidth?: string \| number` | Número → px; aplicar `min(valor, 100vw)` em `max-width`. |
| `MaxDrawer` | `minWidth?: string \| number` | Número → px; string sem coerção → `min-width` do painel. |
| `MaxModal` | `minWidth?: string \| number` | Número → px; string sem coerção → `min-width` do painel. |

Todas são opcionais, sem valor padrão dimensional. Usar teste explícito de `undefined`, não truthiness: `0` precisa virar `0px`. Remover uma prop com `undefined` deve remover seu estilo inline. Strings aceitam unidades, percentuais, variáveis e expressões CSS válidas; não inventar conversão de strings numéricas nem parser de CSS.

### Decisões técnicas propostas para aprovação deste plano

1. **Sem margem de modal na gaveta:** o teto de `maxWidth` do drawer será `100vw`, pois o painel é ancorado na borda. O teto do modal existente continua `calc(100vw - 40px)` quando a prop é fornecida.
2. **Mínimo explícito é nativo do CSS:** aplicar `minWidth` sem clamp escondido. Se superar o máximo ou a viewport, o mínimo prevalece e pode causar transbordamento. Para mínimo responsivo, o consumidor pode fornecer uma expressão `min(...)`. Não alterar a precedência para prometer contenção impossível com limites contraditórios.
3. **Posições não restringem a API:** props fornecidas afetam o painel em `left`, `right`, `top`, `bottom` e `full`. Sem elas, preservar larguras atuais. Alturas, margens de ancoragem e flexbox ficam intactos.
4. **Slot substitutivo preservado:** o slot `container` continua responsável pelo próprio conteúdo e tamanho. Não aplicar as dimensões à máscara nem envolver esse slot em painel novo.
5. **Alteração local:** manter os componentes MaxComponentsUi e os imports MaxUse existentes. Acrescentar computeds locais como os atuais do modal, sem helper público. Não há fluxo de GET/salvamento/cache novo para MaxPinia; não migrar stores existentes por causa de uma prop de layout.

Descartado: clamp automático do mínimo (alteraria a semântica de `min-width`), margem fixa de 40px no drawer (não corresponde à geometria atual), refatoração compartilhada de dimensões (escopo e risco desnecessários) e encaminhamento de `$attrs.style` (nova API não solicitada).

### Preservação obrigatória

- Modal: `width`, `height`, `maxWidth`, `maxHeight`, `padding`, CSS responsivo, centralização e store atuais.
- Drawer: visibilidade controlada por prop, API exposta, eventos, slots, classes extras e `noPadding`.
- Ambos: acessibilidade, foco, Escape, bloqueio de scroll, eventos de ponteiro, proteção de arraste e transições.
- Não reintroduzir PrimeVue nem remover classes legadas; não alterar tokens, cores ou estilos fora do necessário.

## 3. Evidências e limites da investigação

| Arquivo existente | Constatação e uso na execução |
| --- | --- |
| `src/components/MaxModal.vue` | Props dimensionais em 108–115; `:style` em 20; computeds em 406–431. Inserir `minWidth` junto delas. |
| `src/components/MaxDrawer.vue` | Props em 68–115; painel padrão em 6–48; `inheritAttrs: false`; larguras por posição em 325–352. Acrescentar estilo ao painel, não à máscara. |
| `tests/components/MaxModal.test.ts` | `mountModal`, limpeza e Pinia existentes; bloco de layout em 420–491. Estender sem remover regressões. |
| `tests/components/MaxDrawer.test.ts` | `mountDrawer` usa Teleport real e `document.body`; preservar cobertura existente e desmontar instâncias dos testes novos. |
| `tests/browser/MaxOverlayBackdropGesture.browser.ts` | Referência de montagem real via `createApp`, `h`, `createPinia` e limpeza após cada caso. Reutilizar padrão sem alterar testes de gestos. |
| `vitest.config.ts`, `tests/setup.ts` | Unitários em happy-dom, aliases/dedupe de Vue/Pinia e `getComputedStyle` mockado. Não usar esse mock para comprovar tamanho calculado. |
| `vitest.browser.config.ts`, `tests/browser.setup.ts` | Chromium headless, inclusão de `tests/browser/**/*.browser.ts`, Pinia e Axios com adapter de teste. |
| `package.json:556–582`, `vite.config.ts` | Scripts reais e build de entradas individuais/declarations. `build` já executa `vue-tsc`. |
| `src/index.ts`, `package.json` | Exports atuais de `MaxModal`, `MaxDrawer`, alias `Drawer` e subpaths; sem necessidade de editar esses arquivos. |
| `src/stores/useModal.Store.ts` | Store atual da pilha de modais; não alterar estado para dimensões derivadas de props. |
| `package-lock.json`, `node_modules/@maxvue/max-use/package.json` | Lockfile registra Vue `3.6.0-rc.10` e MaxUse `1.1.47`; manifesto MaxUse instalado também informa `1.1.47`. Isso não comprova integridade completa nem instâncias únicas no runtime. |
| `.gitignore` | `.worktrees/` e `.max-code-worktrees/` já ignorados. |
| `docs/superpowers/specs/2026-08-04-tabs-accordion-drawer-design.md` | Referência histórica da API e visibilidade controlada; não substituir código atual por exemplos antigos. |

Estado inicial observado: `git status --short --branch` mostrou branch `wt-799a14c0` sem alterações antes da criação destes documentos. Revalidar na retomada; não presumir que continuará assim.

Não foram executados testes, build, instalação, scripts de verificação ou serviços. Não há resultado verde de baseline. Não se investigaram outras worktrees, arquivos de ambiente ou credenciais. A documentação oficial Vue consultada cobre props tipadas/estilos na linha Vue 3; não houve documentação específica da RC instalada. Não foi identificado impedimento que exigisse pergunta ao usuário.

## 4. Tarefas e dependências

### T1 — Preflight e contratos por leitura

**Dependência:** autorização de execução. **Arquivos de escrita:** nenhum arquivo de produto.

1. Ler este plano e a spec na primeira admissão, conferir `AGENTS.md` aplicáveis e a raiz/branch exatas. Nas retomadas, consultar somente os trechos pertinentes.
2. Conferir `git status`/diff e implementação eventualmente iniciada; preservar mudanças alheias. Confirmar que ainda faltam as props/testes previstos.
3. Ler scripts e eventuais prehooks vigentes, configurações de teste/build, versões instaladas, resolução e symlinks efetivos de bibliotecas. Não executar scripts desconhecidos como diagnóstico inicial.
4. Conferir identidade de Vue, Pinia e Axios no harness, adapters/mocks e isolamento de DOM/armazenamentos. Os casos de largura não precisam de backend, banco, filas ou storage externo. Não copiar `.env`, usar ambientes compartilhados, migrar ou limpar dados.
5. Registrar bloqueio concreto se faltar dependência, navegador ou integridade. Não instalar/atualizar pacotes nem ignorar prehooks sem autorização. Um gate de integridade reprovado bloqueia as validações dependentes, sem bypass por comando direto ou `ignoreConfig`.

**Conclusão observável:** contratos e ambiente compreendidos; lacunas com próxima ação concreta. Gate de integridade existente a executar, após a inspeção e antes das validações dependentes: `npm run check:lockfile`. Sem testes intermediários neste preflight.

### T2 — Implementar dimensões e toda a cobertura

**Dependência:** T1. **Arquivos existentes de escrita:** os dois SFCs e os dois testes unitários. **Novo arquivo:** `tests/browser/MaxOverlayWidth.browser.ts`.

1. Acrescentar `minWidth` tipada e documentada no modal. Criar `modal_min_width` seguindo `modal_width` e incluir no estilo de `.max-modal`, sem tocar computeds existentes.
2. Acrescentar as três props no drawer. Criar computeds locais com nomenclatura coerente e aplicar as três propriedades somente a `.max-drawer`. Documentar px, strings, omissão e teto de viewport no JSDoc.
3. Colocar as tags de abertura alteradas em uma linha, com o script recuado em quatro espaços; não aplicar formatador global nem reformatar componentes inteiros.
4. Adicionar unitários parametrizados para número, zero, `rem`, `%`, `vw`, `calc(...)` e variável CSS, usando valores válidos. Verificar omissão, destino do estilo, atualização e remoção reativas das quatro props. Manter testes atuais de `maxWidth` do modal.
5. Testar no drawer combinação de dimensões e cada posição, preservação de classes, máscara sem larguras e `container` customizado sem painel padrão nem mudanças de estilo. Não criar novo contrato para o slot.
6. Criar testes de layout real no novo arquivo, usando o padrão de montagem existente. Medir `getBoundingClientRect` e viewport efetiva do iframe; dimensionar amostras com base nela para evitar dependência de resolução fixa. Aguardar `nextTick` e estabilização do layout com limite, sem sleeps longos ou consultas ilimitadas.
7. Cobrir largura solicitada, máximo menor que largura, mínimo maior que largura, mínimo maior que máximo (mínimo vence), máximo maior que viewport, mínimo responsivo e retorno ao CSS após remover props. Usar conteúdo curto para casos de dimensões e um caso de conteúdo longo para observar regressões de rolagem.
8. No navegador, comparar defaults com `20 * font-size` nas laterais e largura da máscara nas demais posições. Não alterar `font-size` global para fixar expectativas. No modal, preservar os dois ramos CSS responsivos e a expressão atual quando `maxWidth` é informado.
9. Desmontar apps/wrappers e remover hosts de cada teste, mantendo isolamento de Pinia, DOM e scroll. Não mudar o setup global como atalho.

**Conclusão observável:** implementação completa e testes escritos, ainda sem presumir aprovação. Não executar testes, tipos ou builds entre microedições; completar todo este lote primeiro. Se houver delegação autorizada no Execute, só dividir por arquivos distintos: modal + seu unitário; drawer + seu unitário; navegador após os contratos estarem definidos. Não executar validações enquanto houver implementação concorrente.

### T3 — Validar o lote e revisar a entrega

**Dependência:** T2 concluída e integridade aprovada. **Escrita de produto:** somente correções causadas pela mudança, nos arquivos previstos.

Executar a partir da raiz desta worktree:

```bash
npm run test
npm run type-check:test
npm run lint
npm run build
npm run test:browser
```

- São verificações futuras; nenhuma foi executada em Plan. Executar sem `--fix`. O build já valida os tipos de produção; não repetir `type-check` sobre conteúdo idêntico.
- A suíte unitária completa contempla os dois testes alterados; não executá-los novamente sem mudança, falha ou dúvida concreta. `test:browser` contempla o novo arquivo e regressões de gestos.
- Inspecionar declarações geradas de `MaxModal.vue` e `MaxDrawer.vue` e entradas individuais; não editar nem versionar `dist` manualmente. Confirmar as novas props opcionais `string | number`.
- Agrupar falhas por causa; diagnosticar bootstrap/harness antes de repetir comandos equivalentes. Registrar todas as falhas, inclusive da suíte completa. Não corrigir baseline alheio sem estabelecer causalidade e autorização.
- Corrigir em lote e reexecutar os checks afetados pela revisão factual. Reutilizar checks aprovados cujo conteúdo relevante não mudou. Repetição da mesma falha sem progresso exige diagnóstico, não nova tentativa idêntica.
- Revisar o diff com foco em compatibilidade: nenhum evento/store/slot/default/CSS global alterado; sem dependências ou exports extras; sem PrimeVue; mínimo explícito documentado sem promessa falsa de conter a viewport.
- Realizar revisão independente no marco de entrega quando houver executor autorizado disponível; não criar loops de revisão por microedição.

`npm run verify` é o gate de pré-release do projeto. Não prescrever sua execução cumulativa com todos os comandos acima para esta mudança pontual. Se uma futura autorização exigir pré-release, usar o agregado no lugar das etapas já englobadas e manter seus gates de cobertura, consumidores, navegador, benchmark e segurança, sem bypass. Nenhuma publicação é autorizada por este plano.

## 5. Matriz de aceite por tarefa

| Tarefa/requisito | Evidência esperada | Testes/verificações | Revisão pelo risco e manual |
| --- | --- | --- | --- |
| T1: ambiente correto e íntegro | Raiz, branch, alterações e dependências conferidas | Leitura do harness e `check:lockfile` antes de validações dependentes | Bloquear se instalações/symlinks ou isolamento não forem confiáveis. |
| T2: `width` no drawer | Estilo no painel com px/string/zero | Unitários + medidas reais | Confirmar posição e altura intactas nas cinco posições. |
| T2: `maxWidth` no drawer | Expressão `min(valor, 100vw)` e tamanho limitado sem mínimo conflitante | Unitários de expressão; navegador com largura maior que máximo/viewport | Confirmar ausência de margem artificial de modal. |
| T2: `minWidth` nos dois | Declaração correta e piso efetivo | Unitários e navegador com width menor que min e max menor que min | Conferir precedência CSS e informar risco de transbordamento para mínimo incompatível. |
| T2: reatividade/omissão | Sem estilo indevido; atualiza e volta ao CSS ao remover | `setProps`/estado reativo nos testes; medidas antes/depois | Nenhum valor default dimensional novo. |
| T2: defaults e slots | Defaults preservados; máscara/container não recebem dimensões | Unitários + navegador de defaults | `container` continua totalmente substitutivo; não ampliar API. |
| T3: contratos públicos | Props opcionais presentes nos tipos gerados | `type-check:test`, `build` e leitura dos `.d.ts` | Sem alteração manual de exports/distribuição. |
| T3: regressões gerais | Suítes e lint aprovados na revisão vigente | `test`, `lint`, `test:browser` | Revisar foco, Escape, máscara, scroll e gestos; não inferir layout por mock. |

Verificação visual futura: observar desktop e viewport estreita (375px de largura, se o ambiente de inspeção permitir) e os dois lados do breakpoint de 768px do modal; conferir cabeçalho, botão de fechar e rolagem com dimensões coerentes. Não criar serviço externo ou alterar playground apenas para testar. Se o ambiente não permitir a inspeção ou Chromium não estiver disponível, registrar `manualPending`/bloqueio com próxima ação concreta; não declarar validação integral. Dublês não substituem layout real. Não há aceite de fornecedor externo nesta tarefa.

## 6. Riscos, recuperação e retomada

- **Limites contraditórios:** mínimo explícito pode superar máximo/viewport. É comportamento CSS documentado, não corrigir silenciosamente. Dar exemplo responsivo na documentação das props quando necessário.
- **Flexbox e conteúdo intrínseco:** drawer é item flex; largura declarada não garante largura usada. Testes reais separam esses casos de conversão de prop. Não alterar shrink/alinhamento sem evidência.
- **Responsividade legada do modal:** máximo CSS móvel tem desconto de 50px, enquanto `maxWidth` inline existente usa 40px. Preservar ambos; uniformizar isso não pertence ao pedido.
- **CSS de consumidor:** `!important` externo pode prevalecer; não prometer sobrepor todas as customizações existentes.
- **Testes unitários:** mock de `getComputedStyle` não demonstra layout. Navegador é gate para tamanho efetivo.
- **Operação:** sem migração, dados persistidos, concorrência de salvamento, credenciais ou implantação externa. Não há necessidade de novos logs de produção.
- **Recuperação:** como não há dados novos, desfazer somente alterações próprias das props/testes se autorizado. Preservar trabalho alheio e documentos; não executar reset/checkout destrutivo. Consumidores existentes sem props devem permanecer compatíveis.

### Registro de progresso no Execute

Após marcos e no handoff, registrar progresso em `docs/plans/wt-799a14c0/execution-state.json` **somente durante execução autorizada**, nunca nesta sessão Plan:

- Vincular ao SHA256 real do conteúdo de `plan.md`; identificar tarefas T1/T2/T3, estados e arquivos efetivos. Revisões de tarefa/check devem ser SHA256 reais do conteúdo relevante, com cálculo determinístico e escopo de arquivos documentado, nunca rótulos.
- Novos registros usam o contrato version 2 estrito do executor, sem campos adicionais. Não inventar esquema JSON se ele não estiver acessível: localizar/confirmar o contrato aceito antes de serializar o registro.
- Não usar `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp`; motivo e próxima ação cabem em `nextAction`, até 512 caracteres. Comandos têm até 4.096 caracteres.
- Estados de tarefa: `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`. Resultado de validação/check: apenas `passed`, `failed`, `pending`; nunca `blocked` nesse campo.
- `verification` deve seguir `{revision: SHA256, checks: [{command, revision: SHA256, result, exitCode?}]}`. `passed` exige saída real 0; `failed`, inteiro diferente de 0; `pending` não aceita `exitCode`.
- Registrar somente comandos realmente executados e todas as falhas. Não inferir exit code/aprovação por `tool:end.ok`. Checks vazios, falha vigente ou ausência de resultado vigente impedem validação integral. Version 1 é compatível sem provar validação integral automaticamente; registro autodeclarado não prova execução nativa nem identifica omissões.
- Tarefas assíncronas aguardam notificação/conclusão com espera limitada e recuo, sem polling repetitivo. Cancelamento mantém parcial e pendências explícitos.

Na retomada, conferir primeiro trabalho realizado, diff e revisões registradas; executar lacunas sem repetir checks válidos. Seguir dependências e decisões aprovadas; reabrir escolha somente com evidência nova ou mudança de requisito. Pendência manual, bloqueio ou falha devem trazer próxima ação concreta, nunca relato de conclusão total.

## 7. Revisão do planejamento

- Pedido coberto pelas quatro novas props, sem expansão de API não solicitada.
- Spec elaborada antes deste plano, pois o lote envolve cinco arquivos de produto/teste.
- Padrões de unidade, omissão, responsividade e mínimo conflitante explicitados, sem confundir comportamento atual com proposta.
- Arquivos existentes separados do novo teste proposto; referências e comandos conferidos no repositório.
- Matriz relaciona implementação, regressões, tipos e layout real; validações presentes são apenas futuras.
- Sem necessidade de instalação, mudança de store, serviço, segredos ou operações Git de integração.
- Nenhuma pergunta necessária ficou pendente na investigação. A revisão do usuário pode alterar as decisões propostas antes do Execute.
