# Prompt mestre para execução dos achados confirmados

## Missão e fontes de verdade

Você é o agente coordenador responsável por implementar integralmente os 72 achados confirmados da auditoria da biblioteca `@maxvue/max-components-ui`. Execute as 12 etapas deste documento na ordem indicada, usando subagentes especializados, resolvendo causas-raiz e preservando identidade, API pública e estabilidade.

Antes de editar, leia integralmente `GEMINI.md`, o `description.md` e o `plan.md` de cada item da etapa ativa, além dos arquivos de produção, testes, configuração e documentação citados. Reproduza o problema e confirme suas relações causais. O código atual é a fonte de verdade; se uma premissa do plano tiver mudado, registre a evidência e adapte a solução sem abandonar seu objetivo e critérios de aceite. Todo defeito corrigido deve ganhar teste de regressão.

## Ambiente e Git

1. Inspecione raiz, branch, `git status --short` e worktrees. Alterações preexistentes pertencem ao usuário: não as reverta, formate nem inclua incidentalmente.
2. Crie branch com prefixo `fixes/` e worktree isolada sob `.worktrees/`, após confirmar que a pasta está ignorada. Toda edição, instalação, geração e teste ocorre nessa worktree; nunca edite a working tree principal.
3. Não use comandos destrutivos ou limpeza ampla. Confirme alvos exatos antes das remoções previstas.
4. Não faça commit, merge, rebase, push, publicação ou PR sem autorização explícita. Se autorizado, use commits pequenos e mensagens em pt-BR, sem misturar mudanças preexistentes.
5. Ao fim de cada etapa, entregue arquivos/API alterados, testes e resultados, desvios justificados, métricas e riscos remanescentes.

## Orquestração obrigatória

Use subagentes especializados, no mínimo, em: Vue/TypeScript e fundações; testes/toolchain; acessibilidade/UX; UI/design system; performance/bundle. O coordenador mantém uma tabela `ID | plano | owner | worktree | arquivos | dependências | status | evidências`.

- Cada item da matriz tem exatamente um owner final. Um owner pode receber itens relacionados.
- Calcule previamente interseções de arquivos. Dois agentes não editam simultaneamente o mesmo SFC/helper/teste, fonte e artefato gerado, manifesto, configuração, snapshot, `package.json` ou `package-lock.json`.
- Paralelize apenas arquivos comprovadamente disjuntos. Sobreposições ficam com o mesmo owner ou são serializadas; o owner seguinte relê o diff e os testes já integrados.
- Subagentes podem compartilhar a worktree de execução apenas com ownership disjunto. Se usarem worktrees próprias sob `.worktrees/`, entregam diff/patch ao coordenador; não exija commit quando ele não estiver autorizado.
- Cada subagente investiga, reproduz, implementa, testa e relata. O coordenador revisa o diff e impede helpers, estados e contratos concorrentes.
- Falhas não permitem pular itens. Registre comando, saída, causa, impacto e trabalho restante quando houver bloqueio externo real.

## Contratos transversais

- `GEMINI.md` é a identidade canônica: teal institucional, tokens semânticos, Quicksand com fallback, densidade compacta, foco visível e claro/escuro.
- `.p-*` existente é compatibilidade legada, não lixo para remoção em massa. Altere apenas ocorrências investigadas, com cobertura de consumidores legados.
- UnoCSS, preset, resolver, stores, exports, componentes, props, emits, slots, attrs e tipos publicados são API. Prefira adição compatível e depreciação documentada. Quebra inevitável requer migração e autorização.
- Preserve TypeScript estrito, estilos `scoped`, ordem SFC e convenções locais. Não faça refatoração ou formatação oportunista.
- Nomeie um único owner de dependências. Antes de instalar, confirme os contratos reais de `@maxvue/max-use` e `@maxvue/max-pinia`; não troque referências `file:` por versões presumidas.
- Somente o owner de dependências edita manifesto, `.npmrc`, runtime, lockfile e exports durante uma janela. Nunca edite lock manualmente nem use `npm audit fix`. Valide instalação limpa e tarball consumidor; pacote publicado não pode depender de caminhos irmãos.
- Em sobreposições, o primeiro plano cria a primitiva/contrato e os seguintes migram consumidores. Não implemente o mesmo mecanismo duas vezes. Serializar especialmente: E03 (`InputBase`); E04 (overlays); E05–E06 (select/autocomplete/icon picker); E07 (uploads/`MaxImage`); E08–E10 (menus/tabelas/tokens); E11 (manifesto/build/lock).

## Gates

Registre comandos e resultados. Falha preexistente exige baseline comprovado; regressão nova bloqueia avanço.

- **G0:** `git status --short`, testes focais atuais e baselines do plano.
- **GF:** `npx vitest run <testes>` de todo código alterado. Quando viável, o teste novo deve falhar pela razão correta antes da correção.
- **GT:** `npm run type-check`.
- **GL, sem mutação:** `npx eslint .` e `npx stylelint "src/**/*.{scss,vue}"`. Não use `npm run lint` como gate enquanto ele contiver `--fix`.
- **GU:** `npm run test`.
- **GB:** `npm run build`, inspeção de `dist` e exports/tarball quando houver distribuição ou API.
- **GC:** `npm run test:coverage`, sem redução do baseline e com thresholds ratcheted.
- **GA:** testes DOM/ARIA/teclado; ferramenta automatizada disponível; claro/escuro, zoom e viewports; registre checks manuais inevitáveis.
- **GP:** benchmark reproduzível com dataset, ambiente, aquecimento e mediana/p95 ou cardinalidade. Não use limite temporal instável na suíte comum.
- **GR:** `git diff --check`, revisão de stat/diff e ausência de arquivos, segredos ou gerados incidentais.

GT + GL + GU + GR são obrigatórios ao fim de toda etapa, além dos gates específicos abaixo.

## Matriz de execução — 12 etapas

Cada checkbox é uma unidade de ownership e aparece uma única vez.

### E01 — Baseline, toolchain, dependências e contratos técnicos (5)

Ordem: inventário seguro; contratos Vue/pacotes irmãos; classificação do manifesto; lock reproduzível; gates imutáveis. Um único integrador altera manifesto/lock.

- [ ] E01-01 — `docs/optimize-new/testes_estabilidade/artefatos_corrompidos_e_poluicao_repositorio/plan.md`
- [ ] E01-02 — `docs/optimize-new/performance/dependencias-runtime-sem-uso-direto/plan.md`
- [ ] E01-03 — `docs/optimize-new/testes_estabilidade/lockfile_irreproduzivel_e_audit_indisponivel/plan.md`
- [ ] E01-04 — `docs/optimize-new/testes_estabilidade/gates_qualidade_fragmentados_e_lint_mutante/plan.md`
- [ ] E01-05 — `docs/optimize-new/testes_estabilidade/violacao_contratos_typescript_emits_e_attrs/plan.md`

Gates: G0; instalação limpa com `npm ci`/`npm ls`; auditoria tratada ou documentada; GF arquitetural; GT; GL; GU; GB; tarball consumidor; GR. Guarde baselines de bundle, cobertura, warnings e dependências.

### E02 — Fundações compartilhadas e ciclo de vida (5)

Estabilize helpers/contratos antes de consumidores: defensividade específica, modelo canônico, browser/SSR seguro, cleanup idempotente e saneamento restrito de atributos utilitários.

- [ ] E02-01 — `docs/optimize-new/testes_estabilidade/fragilidade_props_falta_defensividade/plan.md`
- [ ] E02-02 — `docs/optimize-new/performance/modelo-espelhado-emissao-duplicada/plan.md`
- [ ] E02-03 — `docs/optimize-new/testes_estabilidade/renderizacao_ssr_quebrada_em_overlays/plan.md`
- [ ] E02-04 — `docs/optimize-new/testes_estabilidade/vazamento_recursos_timers_e_listeners_globais/plan.md`
- [ ] E02-05 — `docs/optimize-new/ui_design/achado_04_atributos_utilitarios_unocss_params_scss_templates/plan.md`

Gates: GF de helpers, SSR/hidratação e mount/unmount repetido; GT; GL; GU; GB; listeners/timers zerados após unmount; GR.

### E03 — Formulários, rótulos e validação (5)

Um único integrador estabiliza `InputBase`, IDs, mensagens, slot/attrs e validação; depois migra consumidores. Preserve compatibilidade `.p-*` legítima.

- [ ] E03-01 — `docs/optimize-new/ui_design/achado_01_acoplamento_residual_classes_primevue_inputbase/plan.md`
- [ ] E03-02 — `docs/optimize-new/usabilidade/desconexao-rotulos-mensagens-inputbase/plan.md`
- [ ] E03-03 — `docs/optimize-new/usabilidade/validacao-fragmentada-nao-integrada/plan.md`
- [ ] E03-04 — `docs/optimize-new/ux/truncamento-mensagens-validacao-inconsistente-formularios/plan.md`
- [ ] E03-05 — `docs/optimize-new/usabilidade/tooltip-sobrescreve-aria-describedby/plan.md`

Gates: GF de base/helper/tooltip e consumidores; GT; GL; GU; GA para label, describedby composto, required/invalid/live; mensagens longas e matriz touched/dirty/submitted; GR.

### E04 — Overlays, modais e camadas (7)

Ordem: base DOM-safe e teardown; posicionamento/stack/outside pointer; modais e consumidores; clamp; nome/foco. Não crie primitiva paralela.

- [ ] E04-01 — `docs/optimize-new/performance/reatividade-posicionamento-desnecessario-overlays-inativos/plan.md`
- [ ] E04-02 — `docs/optimize-new/ux/dead-clicks-flickering-posicionamento-overlays/plan.md`
- [ ] E04-03 — `docs/optimize-new/ux/destruicao-contexto-singleton-global-modais/plan.md`
- [ ] E04-04 — `docs/optimize-new/usabilidade/ausencia-focus-trap-overlays-flutuantes/plan.md`
- [ ] E04-05 — `docs/optimize-new/usabilidade/dialogs-sem-nome-acessivel/plan.md`
- [ ] E04-06 — `docs/optimize-new/ui_design/escala-z-index-sem-contrato/plan.md`
- [ ] E04-07 — `docs/optimize-new/ui_design/popovers-e-pdf-sem-clamp-mobile/plan.md`

Gates: GF por consumidor; GT; GL; GU; GB; SSR/hidratação; GA para Tab/Escape/retorno/nome/stack; GP provando zero listener/medida fechado; browser em 280 px, zoom 200%, scroll e landscape; GR.

### E05 — Concorrência assíncrona e cache (7)

Faça IndexedDB real antes do cache; proteção de geração/cancelamento antes de deduplicar busca; estados UX depois da correção funcional.

- [ ] E05-01 — `docs/optimize-new/testes_estabilidade/indexeddb_sem_teste_de_fluxo_real/plan.md`
- [ ] E05-02 — `docs/optimize-new/performance/cache-icones-reprocessa-colecao-inteira/plan.md`
- [ ] E05-03 — `docs/optimize-new/testes_estabilidade/max_input_icon_picker_fila_e_respostas_obsoletas/plan.md`
- [ ] E05-04 — `docs/optimize-new/testes_estabilidade/autocomplete_api_resposta_obsoleta/plan.md`
- [ ] E05-05 — `docs/optimize-new/performance/autocomplete-api-busca-duplicada/plan.md`
- [ ] E05-06 — `docs/optimize-new/performance/select-load-options-reentrante/plan.md`
- [ ] E05-07 — `docs/optimize-new/ux/estados-assincronos-indistinguiveis-sem-recuperacao/plan.md`

Gates: GF com promises controladas e IndexedDB funcional; GT; GL; GU; GA para loading/empty/error/retry; GP para delta de cache, uma busca por interação e zero stale update; GR.

### E06 — Seleção, listbox e virtualização (6)

Defina semântica neutra/opt-in da base virtual e estados de seleção antes de virtualizar. Preserve foco lógico, IDs ARIA, slots e navegação com itens desmontados.

- [ ] E06-01 — `docs/optimize-new/usabilidade/virtual-scroller-semantica-selection-incondicional/plan.md`
- [ ] E06-02 — `docs/optimize-new/usabilidade/autocompletes-sem-contrato-combobox/plan.md`
- [ ] E06-03 — `docs/optimize-new/usabilidade/estado-disabled-incompleto-em-selects/plan.md`
- [ ] E06-04 — `docs/optimize-new/usabilidade/listbox-nome-foco-feedback/plan.md`
- [ ] E06-05 — `docs/optimize-new/ui_design/selecao-blue-600-sem-contraste/plan.md`
- [ ] E06-06 — `docs/optimize-new/performance/falta-virtualizacao-colecoes-grandes/plan.md`

Gates: GF local/API/virtualizado; GT; GL; GU; GA de combobox/listbox/disabled/activedescendant; contraste; GP para DOM O(viewport + overscan) e datasets do plano; GR.

### E07 — Uploads, arquivos e interfaces gráficas (8)

Ordem: lifecycle/URLs e máquina de upload; progresso/retry/cancel; teclado; mídia/crop; apresentação. Um owner por SFC compartilhado.

- [ ] E07-01 — `docs/optimize-new/testes_estabilidade/max_input_file_efeitos_globais_e_urls/plan.md`
- [ ] E07-02 — `docs/optimize-new/testes_estabilidade/max_input_file_project_sem_maquina_de_upload/plan.md`
- [ ] E07-03 — `docs/optimize-new/ux/ausencia-feedback-progresso-e-degradacao-erros-upload/plan.md`
- [ ] E07-04 — `docs/optimize-new/usabilidade/uploads-com-acoes-exclusivas-de-ponteiro/plan.md`
- [ ] E07-05 — `docs/optimize-new/usabilidade/interfaces-graficas-sem-alternativa-operavel/plan.md`
- [ ] E07-06 — `docs/optimize-new/performance/recorte-imagem-codificacao-duplicada-sem-limite/plan.md`
- [ ] E07-07 — `docs/optimize-new/ui_design/upload-grande-default-vermelho-nao-responsivo/plan.md`
- [ ] E07-08 — `docs/optimize-new/ui_design/upload-usa-rampa-primaria-neutra/plan.md`

Gates: GF para input/drop/paste, concorrência, retry/cancel, URLs e unmount; GT; GL; GU; GB; GA para teclado/anúncios/alternativas; GP/browser para crop; claro/escuro, mobile e reduced motion; GR.

### E08 — Teclado, menus, ações e tabelas (9)

Aplique o padrão WAI-ARIA correto por widget. Compartilhe roving apenas entre padrões equivalentes; elimine nested controls sem duplicar emissões.

- [ ] E08-01 — `docs/optimize-new/usabilidade/acoes-avatar-personificacao-sem-teclado/plan.md`
- [ ] E08-02 — `docs/optimize-new/usabilidade/ausencia-roving-tabindex-toolbars-acordeoes/plan.md`
- [ ] E08-03 — `docs/optimize-new/usabilidade/controles-interativos-aninhados-semantica-aria/plan.md`
- [ ] E08-04 — `docs/optimize-new/usabilidade/nomes-genericos-em-botoes-de-icone/plan.md`
- [ ] E08-05 — `docs/optimize-new/usabilidade/tabelas-sem-operacao-por-teclado/plan.md`
- [ ] E08-06 — `docs/optimize-new/usabilidade/top-toolbar-sem-navegacao-menubar/plan.md`
- [ ] E08-07 — `docs/optimize-new/ux/acoes-disponiveis-sem-efeito-ou-explicacao/plan.md`
- [ ] E08-08 — `docs/optimize-new/ux/ciclo-teclado-foco-incompleto-e-aprisionamento/plan.md`
- [ ] E08-09 — `docs/optimize-new/ux/sequestro-atalhos-nativos-e-eventos-globais/plan.md`

Gates: GF por widget; GT; GL; GU; GA com Tab/Setas/Home/End/Escape, nomes, pressed/sort, zero nested interactive, uma emissão e preservação de atalhos nativos; GR.

### E09 — Feedback, anúncios e loading (3)

Torne sucesso/falha/cópia/cooldown/loading distinguíveis, persistentes e recuperáveis sem bloquear interações não relacionadas.

- [ ] E09-01 — `docs/optimize-new/usabilidade/feedback-de-erro-nao-anunciado/plan.md`
- [ ] E09-02 — `docs/optimize-new/ux/feedback-terminal-efemero-e-bloqueio-global-loading/plan.md`
- [ ] E09-03 — `docs/optimize-new/ui_design/toast-whatsapp-fora-dos-tokens/plan.md`

Gates: GF com timers controlados e concorrência; GT; GL; GU; GA para live regions, foco, busy/inert e contraste; claro/escuro; GR.

### E10 — Identidade visual, tipografia e movimento (10)

Um owner define tokens/mixins; consumidores migram depois. Playground é o último item, após tokens, tipografia, camadas, movimento e responsividade.

- [ ] E10-01 — `docs/optimize-new/ui_design/rampa-max-primary-incompleta/plan.md`
- [ ] E10-02 — `docs/optimize-new/ui_design/contraste-semanticamente-instavel-em-acoes/plan.md`
- [ ] E10-03 — `docs/optimize-new/ui_design/texto-secundario-claro-abaixo-de-contraste/plan.md`
- [ ] E10-04 — `docs/optimize-new/ui_design/foco-visual-fragmentado/plan.md`
- [ ] E10-05 — `docs/optimize-new/ui_design/cabecalho-menu-mobile-sem-contraste/plan.md`
- [ ] E10-06 — `docs/optimize-new/ui_design/moldura-page-content-inverte-no-dark/plan.md`
- [ ] E10-07 — `docs/optimize-new/ui_design/tipografia-legada-jost-nao-carregada/plan.md`
- [ ] E10-08 — `docs/optimize-new/ui_design/tabelas-anatomia-visual-duplicada/plan.md`
- [ ] E10-09 — `docs/optimize-new/ui_design/movimento-sem-reducao-sistemica/plan.md`
- [ ] E10-10 — `docs/optimize-new/ui_design/playground-nao-representa-tema-canonico/plan.md`

Gates: GF de tokens/componentes; GT; GL; GU; GB; GA com contraste mensurável, foco, claro/escuro, reduced motion, zoom/viewports; regressão visual e cobertura do manifesto no playground; GR.

### E11 — Distribuição, bundle e renderização (5)

Janela final serializada de build/exports/manifesto/lockfile. Modularize após estabilizar contratos e tema; preserve aliases e compatibilidade de consumo.

- [ ] E11-01 — `docs/optimize-new/performance/text-list-numera-todas-linhas/plan.md`
- [ ] E11-02 — `docs/optimize-new/performance/textarea-redimensionamento-duplicado/plan.md`
- [ ] E11-03 — `docs/optimize-new/performance/inchaco-bundle-payload-svg-duplicado/plan.md`
- [ ] E11-04 — `docs/optimize-new/performance/css-monolitico-entry-raiz/plan.md`
- [ ] E11-05 — `docs/optimize-new/testes_estabilidade/contrato_publico_documentado_nao_exportado/plan.md`

Gates: GF de componentes/entries/resolver/exports; GT; GL; GU; GB; GP para linhas, resize, SVG e chunks; sourcemaps/side effects; instalação limpa e tarball consumidor de todos os subpaths; lock determinístico final; GR.

### E12 — Endurecimento da suíte e aceite global (2)

Remova testes que passam sem exercer comportamento, feche lacunas e faça warnings/coverage integrarem o gate. Não mude produção para satisfazer teste incorreto sem evidência.

- [ ] E12-01 — `docs/optimize-new/testes_estabilidade/testes_com_assercao_condicional/plan.md`
- [ ] E12-02 — `docs/optimize-new/testes_estabilidade/lacunas_cobertura_testes_e_suites_rasas/plan.md`

Gates: GF; GT; GL; GU repetido em instalação limpa; GC; GB/tarball; GA integrada; GP consolidado; GR.

## Critérios globais de conclusão

1. Os 72 itens estão marcados e cada owner entregou evidência contra os critérios mensuráveis do respectivo plano.
2. Em instalação limpa passam: checks arquiteturais/lock/nomes, GT, GL, GU, GC e GB.
3. Passam SSR/hidratação, exports/tarball/consumidor, a11y/teclado, contraste, visual e benchmarks. Bundle, listeners, cardinalidade e tempos são comparados ao baseline.
4. Buscas finais distinguem violações de exceções documentadas: cores/fontes indevidas, ARIA desconectada, listeners sem cleanup, caminhos locais publicados, async sem identidade e entradas/assets eager.
5. API e documentação estão coerentes; toda depreciação tem compatibilidade transitória e migração. Consumidores com e sem integrações opcionais foram testados.
6. `git diff --check` passa; diff foi revisto arquivo a arquivo; não há segredos, caches, outputs temporários, snapshots não aprovados nem alteração incidental da auditoria.
7. O handoff final, em pt-BR, traz resumo por etapa, matriz ID→owner→status, API/arquivos, comandos/resultados, métricas antes/depois, migrações, riscos e rollback.

Somente declare conclusão com todos os itens implementados — ou bloqueio externo aceito pelo usuário — e todos os gates sem regressão. Solicite autorização antes de commit, merge, push ou publicação.
