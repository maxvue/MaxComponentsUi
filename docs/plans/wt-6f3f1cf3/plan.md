# Plano de execução — start/end com quebra real no MaxGrid

## 1. Identificação e leitura inicial

- Data: 13/10/2026.
- Projeto: `@maxvue/max-components-ui`.
- Worktree/branch: `wt-6f3f1cf3`, criada a partir de dev pelo MaxCode.
- Raiz obrigatória: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-6f3f1cf3`.
- Especificação obrigatória: [spec.md](./spec.md), elaborada antes deste plano.
- Estado investigado: `git status --short` inicialmente vazio. Esta sessão só acrescentou documentos autorizados; não implementou nem validou a correção.

**Resultado esperado:** o campo `MaxInputNumber s7-end` encerra sua linha e o histórico `s3-10-start` começa a próxima linha no MaxGrid; `s3-start` e `s7-10-end` também funcionam. As larguras continuam as mesmas, não passam a 100%.

**Decisão confirmada pelo usuário:** suporte restrito ao MaxGrid, não a qualquer contêiner flex. Não reabrir essa decisão sem novo requisito ou evidência de incompatibilidade.

## 2. Problema, preservação e limites

O preset gera propriedades de fragmentação (`break-before` / `break-after`), que não comandam quebra de linha em flexbox comum. O MaxGrid atualmente só renderiza o slot em um pai flex-wrap. A correção precisa coordenar esses filhos no MaxGrid; trocar propriedades CSS no item por `width: 100%`, `flex-basis: 100%` ou pseudo-elementos internos não atende simultaneamente ao limite de largura e à fronteira entre irmãos.

### Alterar

- Fazer MaxGrid reconhecer tokens válidos com `start` e `end` nos filhos lógicos diretos do slot.
- Criar segmentos de linha internos somente quando existirem marcadores ativos.
- Testar a separação visual real e documentar a dependência de MaxGrid.

### Preservar

- Regex e fórmulas `flex: 1 1 0%`, mínimo N × 20px, máximo N × 24px ou M × 20px ou 100%.
- CSS de fragmentação existente, como contrato independente; não remover por não produzir a quebra pedida.
- Prefixos `s` e `s-`, aliases full/max, zero e máximo abaixo do mínimo; rejeição de sintaxe inválida e separação de `w-*`.
- Grids sem marcadores: filhos diretos, wrap natural, gap, label e labelCenter.
- Ordem de leitura/tabulação, refs/listeners e atualização de modelValue em layouts com fronteiras estáveis.
- Atributos `no-message`/`no-messages`, classes semânticas e classes legadas `.p-*`.
- Nenhuma alteração em validação, formatação, cálculos, backend ou estado persistido.

### Não executar

Não editar Engeapp, árvore principal ou outra worktree. Não instalar dependências, introduzir PrimeVue, atualizar NPM, gerar manifesto, criar/trocar branch, commitar, mergear, fazer push ou deploy. Novas stores MaxPinia ou helpers MaxUse de negócio não são necessários: não há GET, salvamento nem nova lógica de dados. Os cenários usam os componentes da própria MaxComponentsUi e preservam o ecossistema existente.

## 3. Evidências e viabilidade por leitura

| Local inspecionado | Fato relevante |
|---|---|
| `src/presetMaxUno.ts:81–100` | Token reconhecido; CSS de fragmentação não coordena irmãos flex |
| `src/components/MaxGrid.vue` | Flex-wrap; gap 13px/8px; padding-top 14px; label absoluta; flags de mensagem |
| `src/components/MaxInputNumber.vue:1–38` | Raiz InputBase; atributos não declarados seguem o fallthrough Vue |
| `src/components/InputBase.vue:321–327` | Atributos que não são do controle são encaminhados ao wrapper raiz, incluindo tokens s* |
| `tests/components/MaxGrid.test.ts` | Cobertura de slot, labels e attrs; falta de fronteiras |
| `tests/preset/presetMaxUno.test.ts:433–488` | Contrato de dimensões e fragmentação |
| `tests/preset/presetMaxUno.generate.test.ts` | Generator real + PostCSS; helper atual acumula todas as declarações e precisa distinguir seletores se houver várias regras |
| `vitest.config.ts` / `tests/setup.ts` | Happy-dom e mocks; getComputedStyle mockado não prova geometria |
| `vitest.browser.config.ts` / `tests/browser.setup.ts` | Chromium real; sem plugin UnoCSS; Axios e Pinia preparados pelo harness |
| `tests/browser/inputBaseMatrix.browser.ts` | Padrão de createApp/h, montagem e cleanup |
| `uno.config.ts` | Preset local + Wind3 + attributify; respeitar ignoreAttributes existentes |
| `src/scripts/generateResolver.ts:24–29` | Componentes internos em subpastas ficam fora do manifesto |
| `docs/THEME.md:155–215` | Documentação de dimensões/pai; não explica as novas fronteiras |
| `package.json:556–582`, `package-lock.json:9825` | Scripts reais; UnoCSS 66.10.5 no lockfile |
| `.gitignore:68–69` | Worktrees já ignoradas; não alterar |
| `scripts/check-lockfile.mjs` | Gate rejeita dependências locais e inconsistências; sem bypass |
| `scripts/verify-consumers.mjs` | Empacotamento/instalações temporárias no gate de consumidores; requer ambiente permitido |

### Consumidor investigado, sem autorização para editar

- `/home/johnattas/GitHub/engeapp/resources/Vue/Pages/CommercialProposalDetailPage.vue:130–183`: os itens estão em MaxGrid; os meses usam `s2-30-start` em todos os elementos do v-for; o histórico contém outro MaxGrid.
- Mesmo arquivo, `:1840–1847`: o histórico é flex-column interno. Isso não muda seu papel como filho do MaxGrid externo.
- `/home/johnattas/GitHub/engeapp/uno.config.ts:4`: preset importado de `storage/libs/MaxComponentsUi/src/presetMaxUno.ts`.
- `/home/johnattas/GitHub/engeapp/vite.config.ts:336–339`: aliases de fonte na mesma biblioteca local.
- `readlink -f` confirmou `storage/libs/MaxComponentsUi` apontando para `/home/johnattas/GitHub/MaxComponentsUi`, não para esta worktree. Preset e MaxGrid vistos nesse destino têm a regra atual.

### Fatos, propostas e limites

- Fato: a árvore de dependências `node_modules` desta worktree é symlink para a árvore principal; não atualizar nem instalar ali.
- Proposta: segmentos flex de largura total para preservar tamanho dos filhos e gap sem duplicação; ainda não implementada ou medida.
- Limite: wrappers mudam seletores de filho direto apenas em grids com marcadores. Fronteiras móveis podem reparentear/remontar componentes; keys não eliminam esse risco.
- Documentação oficial UnoCSS/Vue consultada; não foi obtida referência versionada exata do RC de Vue. Confirmar APIs/tipos locais por leitura na execução.
- Não existe aceite manual do Engeapp nesta sessão. Não inventar resultado de teste, identidade de build ou compatibilidade de consumidores não inspecionados.

## 4. Solução e alternativas

### Arquitetura proposta

```text
slot default do MaxGrid
  → renderizador interno (Vue; classes + atributos; Fragment)
  → segmentos não vazios separados por start/end
  → div.max-grid-row (flex-wrap, largura integral, gap herdado)
  → componentes/elementos originais (larguras s* preservadas)
```

O caminho sem marcadores retorna o slot original sem elementos de linha. O renderizador só lê filhos lógicos diretos; não inspeciona DOM interno de componentes, não observa o documento e não altera grids aninhados.

### Decisões delegadas de baixo impacto

- Implementar o renderizador em `src/components/base/gridSlotRows.ts` usando APIs tipadas de renderização do Vue; sem Options API ou export público.
- Usar classes semânticas `.max-grid-row` e CSS scoped do MaxGrid, com deep restrito a wrappers imediatos quando exigido pelo renderizador funcional.
- Normalizar classes com Vue, não reimplementar class array/objeto com regex; parser de tokens é domínio interno do componente, não novo helper genérico.
- Gerar CSS de testes no Node com o preset real. Se necessário, acrescentar plugin estritamente de teste ao config browser e módulo virtual tipado; não duplicar CSS de dimensionamento manualmente.

### Alternativas descartadas

- Apenas break-before/break-after: não resolve flexbox.
- Remover max-width ou forçar item de largura total: altera comportamento fora do pedido.
- Pseudo-elemento dentro do filho: não vira irmão flex do campo/histórico.
- Separador flex vazio sem tratar gap: pode duplicar o espaçamento vertical.
- Migrar todo MaxGrid para CSS Grid: muda distribuição de largura, alinhamento e consumidores.
- Observers globais, manipulação manual de DOM, redimensionamento por JavaScript ou reordenação com order: maior custo/risco, desnecessários para o escopo escolhido.

## 5. Tarefas ordenadas

Executar como um lote. Paralelismo é opcional e só após fixação do contrato: implementação do renderizador/MaxGrid e documentação podem ocorrer em arquivos distintos; testes dependem da interface e de decisões de harness. Não executar validações enquanto houver escrita concorrente. Não delegar automaticamente nesta sessão Plan.

### T0 — Preflight e reconciliação

**Arquivos:** leitura de AGENTS.md, spec/plan, git status, configs, package.json, lockfile, setup, dependências efetivas.

1. Confirmar raiz/branch; não criar nem trocar worktree. Identificar trabalho já feito e preservá-lo.
2. Conferir scripts e eventuais prehooks antes de executá-los, inclusive geração incidental de arquivos, caches e outputs. Não inferir ausência de hooks a partir de scripts lidos parcialmente.
3. Confirmar versões instaladas e resolução real de Vue, UnoCSS, Axios, Pinia e MaxUse, incluindo symlinks. Não ler/expor credenciais.
4. Confirmar que artefatos de build/teste/cache ficarão na worktree e que nenhum comando atualizará o node_modules compartilhado. Se isso não puder ser garantido, interromper e solicitar ambiente isolado autorizado; não criar ambiente alternativo por conta própria.
5. Na execução, rodar gates de integridade pertinentes antes de validação dependente, conforme scripts/hook efetivos. Falha bloqueia o próximo gate; não usar ignoreConfig, remover hooks ou executar comando direto para contornar.
6. Não há uso necessário de banco, cache externo, filas ou storage. Não copiar .env, rodar migrations/reset nem conectar serviços do consumidor.

**Conclusão:** identidade do ambiente registrada; blockers concretos resolvidos ou explicitamente pendentes. Leitura inicial não equivale a um teste aprovado.

### T1 — Renderizador e integração MaxGrid

**Depende de:** T0. **Arquivos:** novo `src/components/base/gridSlotRows.ts`, existente `src/components/MaxGrid.vue`, comentário em `src/presetMaxUno.ts`.

1. Implementar exatamente o algoritmo/contrato da spec: start antes, end depois; Fragment/v-for; tokens completos; classes normalizadas e atributos; comentários sem linhas vazias.
2. Manter VNodes únicos; não mutar recebidos; preservar refs/listeners/keys. Compor keys entre Fragments quando necessário.
3. Definir keys de segmentos estáveis para rerenders sem mudanças de fronteira. Não alegar estabilidade universal quando os filhos mudarem de pai.
4. Garantir caminho sem marcadores sem elementos intermediários.
5. Adicionar estilos de segmento preservando padding/label/gap da raiz e wrap natural interno. Não criar margens extras, foco ou semântica acessível artificial nos wrappers.
6. Conferir seletor scoped do renderizador e aninhamento; não alterar `.p-*` ou InputBase/MaxInputNumber sem evidência de falha de encaminhamento, que não foi encontrada.
7. Ajustar comentário do preset para explicar que MaxGrid organiza linhas e propriedades break-* continuam sendo fragmentação.

**Conclusão:** estrutura implementada e revisada por leitura com limites preservados. Ainda não declarar validada.

### T2 — Cobertura completa e harness browser

**Depende de:** contrato de T1. **Arquivos:** três suítes existentes mencionadas na spec; novo `tests/browser/maxGridLineBreaks.browser.ts`; se necessário, `vitest.browser.config.ts` e novo `tests/browser/fixtures/maxGridPresetCss.d.ts`.

1. Cobrir as três combinações relatadas, os sufixos full/max/numérico e tokens inválidos. Manter asserções antigas de dimensão e fragmentação.
2. Unitários MaxGrid: start sozinho, end sozinho, pares redundantes, início/fim, item com duas fronteiras válidas, vários segmentos, slot vazio, Fragment/v-for com keys, v-if, texto visível, classes array/objeto e attrs opcionais.
3. Preservar testes de label, labelCenter, root attrs, no-message/no-messages e grids sem marcadores. Garantir que um MaxGrid aninhado não seja interpretado recursivamente pelo externo.
4. Montar MaxInputNumber real e comprobar atributo no wrapper, modelValue, refs, foco/instância em rerenders estáveis e ausência de eventos de atualização espúrios. Testar inserção/remoção keyed no mesmo segmento. Avaliar mudança de fronteira separadamente e documentar possível remount; se o caso real exigir identidade preservada nesse movimento, parar para revisar arquitetura.
5. Generator real com `[presetMaxUno(), presetWind3(), presetAttributify()]`: gerar CSS para classes e attrs valueless, analisar via PostCSS por seletor e manter o parser para casos de uma regra sem misturar declarações de várias regras.
6. Browser: importar CSS de módulo virtual produzido pelo Node no harness. Plugin local do config faz resolveId/load e chama createGenerator com o preset real; emitir string com CSS de fixture estática contendo todos os tokens de teste, `preflights: false`. A declaração de módulo novo resolve tipos, sem ts-ignore ou bypass. Config browser não deve importar o preset no iframe. Não escrever fixture gerada no repositório, nem alterar config de aplicação.
7. Injetar/remover stylesheet no ciclo de teste e montar/desmontar app conforme o padrão existente. Se CSS virtual não chegar, o teste deve falhar, não usar fallback CSS escrito à mão.
8. Medir rects após nextTick e frames limitados, sem polling indefinido. Usar pai amplo e altura determinística; caso negativo sem marcadores deve caber na mesma linha.
9. Casos Chromium: start deixa item posterior compartilhar linha; end deixa anterior compartilhar linha; largura mínima/máxima com caixas simples; gap padrão/customizado/zero; wrap natural dentro de segmento; nenhum segmento vazio; nested grid e input real.
10. SSR: verificar caminho sem window/document; não confundir SSR unitário com aprovação do pacote empacotado.

**Conclusão:** todo o lote de testes está implementado antes de rodar suítes/tipos/builds. Suítes do happy-dom não substituem geometria real.

### T3 — Documentação do contrato e revisão de risco

**Depende de:** decisões de T1/T2. **Arquivo:** `docs/THEME.md`.

1. Acrescentar sintaxe start/end, tabela dos exemplos, diferenciação entre fronteira e largura e exigência de MaxGrid.
2. Exemplo Vue com MaxGrid + MaxInputNumber, tags de abertura em uma linha. Mostrar atributos sem valor e classes equivalentes.
3. Explicar full/max como teto; `s3-10-start` tem teto 200px e pode ser estreito para conteúdo do histórico. Não alterar a largura para disfarçar overflow.
4. Documentar filhos lógicos diretos, wrappers, limitações de seletores `>`, fronteiras móveis, fluxo horizontal padrão e ausência de suporte a qualquer div flex.
5. Revisão independente no marco de risco: CSS scope/gap, VNode keys, preservação do input e equivalência do caminho sem marcadores. Sem revisão a cada microedição.

**Conclusão:** docs correspondem ao código factual e nenhum limite é apresentado como garantia.

### T4 — Validar o lote e corrigir falhas agrupadas

**Depende de:** T1–T3 completos; T0 aprovado.

Comandos identificados no package.json, todos com cwd nesta worktree:

```bash
npm run test
npm run test:browser
npm run type-check
npm run type-check:test
npm run lint
npm run build
```

1. Executar o conjunto completo previsto para a correção; registrar cada comando e exit code real.
2. Em falhas, agrupar diagnóstico de harness/bootstrap/resolução de dependências antes de repetir testes equivalentes. Corrigir somente causas demonstradas nesta alteração; notificar baseline alheio sem ampliar escopo.
3. Depois do lote de correções, revalidar checks afetados; reaproveitar os aprovados com revisão factual ainda vigente. Falha repetida sem progresso exige diagnóstico, não repetição automática.
4. Se cobertura ou comparação de consumidores for exigida no fechamento, dimensionar gate ao contrato alterado. Antes de release, usar `npm run verify`, que agrega cobertura, consumidores, browser, benchmarks, tipos/build/integridade/segurança. Não substituir esse gate por lista parcial e não repetir suas etapas separadas sem causa.
5. O gate de consumidores empacota/instala em temporários. Revisar seu isolamento e permissões antes de executá-lo; não usar o Engeapp real como fixture. Instalações não foram autorizadas nesta sessão Plan; execução posterior depende do ambiente/autorizações pertinentes. Se bloqueado, registrar pendência, não contornar.

**Conclusão:** matriz abaixo satisfeita por evidências vigentes; qualquer check falhado/ausente impede afirmar validação integral.

### T5 — Aceite manual e handoff

**Depende de:** T4 para aceite técnico; integração externa autorizada para aceite do consumidor.

1. Revisar diff bruto contra pedido, restrições e matriz. Usar verificação de entrega exigida pelo AGENTS.md, com evidência bruta sem conclusões inseridas.
2. Relatar arquivos alterados, comandos/resultados e limitações, sem commit/merge/push.
3. Demonstrar em harness controlado os três pares. Para demonstração no Engeapp, o responsável precisa disponibilizar integração que aponte à revisão desta tarefa; não modificar aliases, symlink ou árvore principal nesta execução.
4. No Engeapp autorizado, conferir aba de consumo, gap, foco, recalculate e valores. Inspecionar identidade do preset e MaxGrid antes de afirmar que a correção está em uso.
5. Registrar aceite consumidor como `manualPending` enquanto não realizado; próxima ação concreta é o responsável autorizar/disponibilizar integração e verificar a aba de consumo. Notificações existentes alertam usos de `-start` em todos os meses e integração na árvore principal.
6. Preservar worktree com integração pendente. Limpeza/integracão são do MaxCode/usuário.

## 6. Matriz de aceite por tarefa

| Tarefa / requisito | Evidência obrigatória | Testes pertinentes | Revisão pelo risco | Manual |
|---|---|---|---|---|
| T0: ambiente íntegro | root/branch, status, realpaths/versões, hooks e outputs | Gates de integridade vigentes na execução | Symlink compartilhado não recebe instalações/escritas | Disponibilidade de Chromium |
| T1: fronteira start/end | Código + DOM de segmentos sem linhas vazias | MaxGrid unitário; três pares Chromium | VNodes únicos, order/refs, aninhamento, scope | Exemplo visual controlado |
| T1: sem regressão de dimensões | CSS por token e rects | Preset unitário + generator; Chromium com caixas simples | Não alterar full/max ou `w-*` | Histórico estreito tratado separadamente |
| T2: classes/attrs e slots | Seletores CSS, props, wrappers | Attributify/Wind3, v-for/Fragments/v-if/classes condicionais | Nenhuma leitura recursiva de componentes arbitrários | Wrapper real de MaxInputNumber |
| T2: estabilidade de inputs | Identidade do controle e eventos em rerender estável | MaxInputNumber real; keyed lists; foco Chromium | Fronteira móvel não recebe garantia falsa | Digitar mantendo foco e cálculos |
| T2: gaps e wrap | Coordenadas com tolerância ≤ 1px | Gap 13px, customizado/zero, wrap interno, controle negativo | Sem dupla distância vertical | Layout amplo e estreito |
| T3: contrato documentado | THEME.md consistente com implementação | Revisão de exemplos/tabela | Limites de parent selectors e largura explícitos | Exemplo documentado |
| T4: qualidade do lote | Checks vigentes com exitCode real | Testes unitários/browser, tipos de produção/testes, lint, build | Correlação de falhas; sem bypass | Não substitui aceite externo |
| T5: revisão entregue | Diff e handoff | Checks de entrega contra pedido | Não alterar fora de escopo | Engeapp manualPending até integração comprovada |

## 7. Riscos, operação e reversão

- **Seletores consumidores:** wrappers alteram `>`, flex item placement e nth-child somente quando existem marcadores. Conferir o consumidor conhecido; não modificar automaticamente CSS externo.
- **Fronteiras móveis:** reparenting pode perder foco/estado interno; não presumir que keys resolvem. Sem mudança estrutural, preservação é obrigatória. Se o fluxo real requer garantia entre segmentos móveis, interromper para decisão técnica.
- **Largura/overflow existente:** o histórico de 200px contém componentes com mínimos relevantes; esta tarefa não amplia largura nem corrige o consumidor. Seus meses com start em cada item passarão a iniciar segmentos separados.
- **CSS do harness:** UnoCSS usa Node/Sass; geração deve ocorrer no config/plugin Node. Sem CSS real do preset, a prova geométrica é inválida.
- **Desempenho:** processamento linear dos VNodes do slot por render; sem consultas de layout em produção, rede ou observers globais. Se houver custo demonstrado, investigar antes de otimizar fora do escopo.
- **Ambiente compartilhado:** node_modules symlink não é isolamento de dependências. Falha de gate ou necessidade de instalação exige ação autorizada do responsável.
- **Operação:** alteração de biblioteca pública sem mudança de versão nesta tarefa. Deploy/release exige solicitação e gate completo próprios.
- **Recuperação:** correção não altera dados. Para voltar à semântica antiga, revisão autorizada pode remover integração/renderizador/estilos e testes/docs correspondentes; não executar git reset/revert automático nem descartar trabalho de terceiros.
- **Cancelamento/bloqueio:** preservar o parcial, registrar próxima ação e checks pendentes; não anunciar conclusão total.

## 8. Retomada e registro na futura execução

Na primeira admissão, ler este plano e a spec. Nas retomadas, consultar trechos pertinentes e registros; conferir trabalho já feito, diff local e revisão factual. Executar lacunas respeitando dependências; não reabrir escolhas sem evidência nova.

Somente durante Execute, registrar progresso após marcos e handoff em `docs/plans/wt-6f3f1cf3/execution-state.json`. **Este arquivo não foi criado no Plan Mode e sua escrita não está autorizada nesta sessão.**

- Usar `version: 2` e vincular ao SHA256 real dos bytes de `plan.md`, calculado no ambiente da execução.
- Registrar tarefas, estado e arquivos; revisões são SHA256 reais do conteúdo factual, nunca labels como v1/final.
- Estrutura de verificação: `verification: { revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`.
- Registrar comandos realmente executados e todas as falhas, inclusive da suíte completa. `passed` exige exitCode 0; `failed` exige inteiro diferente de 0; `pending` não aceita exitCode.
- Não inferir exit code a partir de `tool:end.ok`. Checks vazios, resultado ausente ou falha vigente impedem validação integral.
- Version 1 continua compatível, mas não prova aprovação integral automaticamente. O registro autodeclarado não comprova execução nativa nem detecta checks omitidos.
- Manter manualPending e blockers concretos separados de checks automatizados aprovados; reaproveitar apenas resultados vinculados à revisão efetivamente verificada.

## 9. Revisão do plano

Revisado contra o pedido e a decisão do usuário: fronteiras corretas antes/depois, preservação de larguras, MaxGrid como escopo, testes visuais além de CSS, ausência de execução em Plan, worktree única, riscos do consumidor e de reparenting declarados, dependências/gates/retomada explícitos. A proposta é executável por outra sessão sem depender da conversa. A viabilidade visual e a qualidade do código só serão confirmadas pelas validações futuras; este documento não equivale a uma implementação aprovada.
