# Plano de execução — Atualizar toda a documentação do MaxGrid

## 1. Identificação e autorização

- Data: **2026-10-13**.
- Projeto: **`@maxvue/max-components-ui`**; versão do manifesto local `1.1.2`.
- Worktree/branch: **`wt-3917332f`**, pré-alocada pelo MaxCode a partir de `dev`.
- Raiz exclusiva: **`/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-3917332f`**.
- HEAD investigado: `3b9c5ce94b68f7cae3186152a70f2bd80016cecd`.
- Especificação precedente: [spec.md](spec.md).
- Situação desta entrega: **planejamento concluído; execução não iniciada**. O usuário autorizou apenas escrita de spec, plano e notificações nesta sessão.

Pedido original: **“Atualizar toda documentação do MaxGrid inclusive sobre presetMaxUno e os valores s-*.”**

Não criar outra worktree, trocar branch, fazer commit, merge, push, release, deploy ou remover esta worktree. A execução futura depende de autorização; integração e limpeza são do MaxCode/usuário. Não investigar outras worktrees.

## 2. Resultado esperado e requisitos

Quem consome a biblioteca deve conseguir configurar estilos, escolher valores `s`, entender wrap e quebras explícitas e reconhecer limitações sem depender desta conversa.

| ID | Requisito |
|---|---|
| R1 | MaxGrid documentado como flexbox com wrap; props, slot, attrs, gap e flags reais |
| R2 | Família `s` descrita por limites em pixels, com fórmulas, aliases, exemplos e casos extremos |
| R3 | Quebras `start/end` reais no MaxGrid diferenciadas de fragmentação CSS e dispositivos |
| R4 | Setup de `presetMaxUno`, Attributify, plugin Vite e CSS virtual explicado com imports completos |
| R5 | Todas as superfícies ativas de documentação de MaxGrid coerentes, incluindo catálogo e demonstração |
| R6 | Exemplos úteis com componentes Max, sem estados/props fictícios, sem chamadas remotas |
| R7 | Runtime, configurações, dependências, histórico e componentes vizinhos preservados |
| R8 | Validações vinculadas à revisão real, falhas/pendências explícitas e handoff retomável |

O pedido não autoriza tornar o grid responsivo por dispositivo, migrar layouts consumidores nem substituir a família `s`. A documentação acompanha o contrato local; não inventa comportamento desejado.

## 3. Investigação realizada e evidências

### 3.1. Código e contratos

| Fonte lida | Fato observado |
|---|---|
| `src/components/MaxGrid.vue:1–77` | Raiz `.max-grid`, slot via GridSlotRows, props `label?: string \| null`/`labelCenter?: boolean`, flex-wrap, gap `13px 8px`, padding-top 14px, CSS para `no-message` e `no-messages` |
| `src/components/base/gridSlotRows.ts:17,69–173` | Parser sem dispositivo; classes normalizadas; atributos ativos com `''`, `true`, `'true'`; Fragments; wrappers somente com marcadores; sem varredura dos descendentes |
| `src/presetMaxUno.ts:81–125` | Fórmulas em pixels; regex com até dois sufixos de direção/dispositivo; dimensão base incondicional e media query somente para `break-*` |
| `src/presetMaxUno.ts:140–165`, `src/themes/all.scss` | Preflight compila barril Sass, fallback de caminho local e alias `maxUnoPreset` |
| `src/components/MaxInputText.vue` | Componente existente para exemplos, usa `modelValue`, `label`, attrs e helpers MaxUse; não precisa ser modificado |
| `src/components/MaxGridCols.vue` | Componente distinto com CSS Grid de 24 colunas; não confundir com MaxGrid |
| `src/index.ts`, `src/components-manifest.json`, `package.json` | Export/alias MaxGrid e subpath público do preset existentes |

### 3.2. Documentação e materiais ativos

| Arquivo | Divergência ou ação necessária |
|---|---|
| `COMPONENTS.md:1168–1187` | `s50` descrito como 50%, `s100` como 100%; falta referência completa de quebras/attrs/limites |
| `docs/THEME.md:139–235` | Fórmulas corretas já documentadas, mas aviso de outra branch (`wt-b7ccd219`) e regex sem dispositivos; manter conteúdo válido e corrigir o restante |
| `docs/THEME.md:46–60,251–256` | Setup só com preset não explica atributos valueless; lista de preflight incompleta para o barril atual |
| `README.md:151,162–179` | Layout listável e link existentes; snippet de preset omite import de `defineConfig`; precisa ponte curta para MaxGrid e tokens |
| `docs/AUTO-IMPORT.md:51,61–89` | Alias `Grid` existente; explicar que resolver não gera CSS nem habilita Attributify |
| `playground/src/catalog.ts:121` | Descrição incorreta: “12 colunas” e faixa “s10 a s100” |
| `playground/src/scenarios/layout-grid.vue:7–26` | Exemplos MaxGrid vazios e estados `disabled/error/severity` sem comportamento implementado |

Busca direcionada incluiu `git grep` de referências Markdown rastreadas, além de conteúdo e nomes relevantes. `INDEPENDENCIA-PRIMEVUE.md` apenas inventaria ausência de dependência; `CONTRIBUTING.md` apenas recomenda preset; não requerem reescrita sem nova evidência. Planos/notificações históricos que descrevem revisões antigas permanecem históricos. Links de skills em `.opencode/skills` são symlinks projetados, não destinos locais de atualização.

### 3.3. Configuração e validações disponíveis

- `uno.config.ts`: presetMaxUno + Wind3 + Attributify, transformerVariantGroup e exclusão de atributos reais de cor para evitar extração indevida.
- `playground/vite.config.ts`: plugin UnoCSS usa explicitamente **`../uno.config.ts`**, não o `playground/uno.config.ts`; alias do pacote aponta para `src/index.ts`; host `maxcomponents.test`, porta `5180`, strictPort.
- `playground/src/main.ts`: import `virtual:uno.css`, Pinia existente, bootstrap de componentes Max; não mudar bootstrap.
- `tests/preset/presetMaxUno.generate.test.ts`: CSS real e análise PostCSS; integração Wind3/Attributify para atributos valueless.
- `tests/components/MaxGrid.test.ts`: renderização, label, attrs, segmentos, redundância, classes, atributos condicionais, aninhamento e reatividade com input real.
- `tests/browser/maxGridLineBreaks.browser.ts`: teste negativo sem marcador, fronteiras, limites de largura e gap; não cobre dispositivos.
- `tests/architecture/playgroundCoverage.test.ts`: catálogo, famílias, aliases e existência dos cenários; destino para regressão documental demonstrativa.
- `vitest.config.ts`, `tests/setup.ts`: happy-dom, dedupe Vue/Pinia, storage/IndexedDB e fetch de teste; geometria não é comprovada pelos dublês.
- `vitest.browser.config.ts`, `tests/browser.setup.ts`: Chromium, CSS real do preset servido por módulo virtual, Pinia por teste e adaptador Axios; confirmar identidade efetiva antes de rodar.
- `package.json:556–582`: scripts reais de gates, testes, build e playground. Não há comando identificado de lint Markdown; não inventar `lint:docs`.
- `package-lock.json`: UnoCSS e presets `66.10.5`; manifesto declara `unocss ^66.10.5` para desenvolvimento e `^66.0.0` como peer opcional.
- `.gitignore`: `.worktrees/` e `.max-code-worktrees/` já ignoradas; nenhuma edição necessária.

Documentação oficial consultada via Context7: UnoCSS `/unocss/unocss`, fontes `docs/presets/wind3.md`, `docs/presets/attributify.md` e `docs/integrations/vite.md` no GitHub oficial. Confirmou configuração de presets, plugin Vite e import `virtual:uno.css`. O conteúdo é de `main`, não prova uma revisão fixa `66.10.5`; validar exemplos contra a versão local durante Execute.

### 3.4. Limitações e notificações

Leituras e consultas Git não equivalem a aprovação de runtime. **Nenhum teste, build, formatter, instalação, servidor ou consumidor externo foi executado.** Não se verificou pacote publicado.

`node_modules` é symlink para `/home/johnattas/GitHub/MaxComponentsUi/node_modules`. Pacotes Vue/UnoCSS/MaxUse existem nesse destino; MaxPinia não foi encontrado e é peer opcional. A tentativa de listagem retornou código 2 pela ausência do peer: não foi teste da aplicação nem falha de instalação comprovada. Não instalar nada nem gravar no symlink sem autorização/isolamento pertinente.

Notificações deste planejamento:

- [Marcadores de dispositivo](../../notifications/wt-3917332f/notifications/max-components-ui-marcadores-dispositivo.md): parsers diferentes e limitação de fronteiras reais.
- [Testes mockados do preset](../../notifications/wt-3917332f/notifications/max-components-ui-testes-preset-gerador.md): expectativas de objeto diante de gerador e token rejeitado por teste, mas aceito pelo preset.
- [Documentação adjacente](../../notifications/wt-3917332f/notifications/max-components-ui-documentacao-adjacente.md): PrimeVue/Aura no README, material do MaxGridCols e tags multilinha no input; não ampliar o escopo.

## 4. Solução e decisões

### 4.1. Organização confirmada pelo escopo e proposta editorial

**Confirmado pelo usuário:** planejamento apenas, worktree existente e atualização documental completa de MaxGrid/preset/tokens, sem integração Git.

**Proposta editorial fundamentada:** manter duas fontes canônicas já existentes. `COMPONENTS.md` documenta o componente; `docs/THEME.md` detalha o preset e `s-*`. README e AUTO-IMPORT apontam para elas. Playground é a demonstração navegável e recebe atualização limitada ao MaxGrid.

Não criar guia duplicado, renomear âncora `#maxgrid` nem substituir a âncora já usada para dimensionamento sem atualizar os links. Corrigir a nota de disponibilidade de outra branch; pode permanecer aviso genérico “confira o código/versão efetivamente consumido”, sem afirmar qual versão publicada inclui as regras.

Não havia decisão necessária sem resposta no pedido/código. Não há bloqueio para planejar a atualização; ambiente e baseline podem bloquear a validação integral futura.

### 4.2. Conteúdo mínimo das referências

Seguir contratos, regex, tabela de valores e limites de [spec.md, seção 3](spec.md#3-arquitetura--mudanças-técnicas). Não copiar a regex de MaxGrid como se fosse a do preset.

Em `COMPONENTS.md`, incluir:

1. Anatomia flexbox, gap/padding e distinção de MaxGridCols.
2. Props com tipo real, sem default numérico/textual inventado; slot default e ausência de emits próprios.
3. Atributos de raiz, flags de presença `no-message/no-messages`, diferença entre attrs e props, estados inexistentes no grid.
4. Dimensionamento resumido e link para THEME; escolher `s10-full` para limite amplo, não `s100` para “100%”.
5. Fronteiras diretas, Fragments/v-for, redundância e aninhamento; mudança de estrutura DOM somente quando há marcador ativo.
6. Exemplos completos ou claramente parciais, tags em linha única, MaxInputText/MaxInputNumber reais, modelos declarados quando completos.
7. Alertas de mínimo/overflow, `full/max` como teto e ausência de suporte de fronteiras com sufixo de dispositivo.

Em `docs/THEME.md`, incluir:

1. Setup por classes e adicional Attributify para attrs; plugin Vite e CSS virtual; `presetMaxUno` e alias `maxUnoPreset`.
2. Regex real do preset, sintaxe, fórmula base e extensão, primeira direção/dispositivo e combinações recomendadas.
3. Tabela mínima da spec, incluindo `s1/s2`, valores usuais, `s50/s100`, zero e máximo menor que mínimo.
4. Breakpoints exatos de dispositivo, `tablet` incluindo mobile, dimensão incondicional e ausência de fronteira MaxGrid com esses tokens.
5. CSS de fragmentação separado da organização de linhas; referência cruzada ao componente.
6. Semântica percentual somente em seção histórica, com revisão de consumidores indicada como tarefa separada.
7. Casos inválidos, mínimo que pode transbordar mesmo com wrap, limites de `Number`, extração estática do UnoCSS.
8. Explicação delimitada do preflight: barril `themes/all.scss` é fonte real; não prometer que somente os três arquivos listados hoje são incluídos nem que CSS instalado gera classes arbitrárias `s`.

Valores de referência obrigatórios: `s1` 20/24px; `s2` 40/48px; `s10` 200/240px; `s10-20` 200/400px; `s10-full` e `s10-max` 200px/100%; `s7-end` 140/168px; `s3-10-start` 60/200px; `s50` 1000/1200px; `s100` 2000/2400px. A quebra não amplia a largura.

### 4.3. Demonstração e convenções frontend

Trocar apenas o bloco MaxGrid do cenário por pequenos exemplos estáticos identificáveis, sem redesenhar shell ou blocos MaxGridCols/MaxEmptyDiv:

- Flex-wrap sem marcador, com dois inputs e valores `s10-full` ou limites numéricos usuais.
- Quebra explícita com `s7-end` e `s3-10-start`, mostrando que os itens mantêm limites, não viram largura total.
- Equivalência entre classe estática e atributo valueless, com pelo menos uma forma de cada.
- Label alinhado/centralizado e flag de mensagem, usando atributos existentes. Não demonstrar `disabled/error/severity` como estado do grid.
- Nota textual de que dispositivo no token não produz fronteira real no componente atual; não mostrar demonstração como se funcionasse.

Inputs usam estado efêmero local Vue somente para editar valores da demonstração. Não criar GET, salvamento, cache ou store artificial. Se o escopo crescer para dados remotos, interromper: a regra é usar MaxPinia para esses fluxos e MaxUse para helpers, com nova autorização. Preservar bootstrap Pinia e helpers MaxUse existentes. Nenhum componente/helper ausente precisa ser criado.

Classes novas da demonstração semânticas, prefixo `max-*`; cores via tokens canônicos e foco acessível preservado. O uso `s-*` é deliberado para ensinar API pública, não substituição do CSS interno da biblioteca. Tags em linha única; template/script setup TypeScript/style scoped na ordem do projeto; recuo base do script de quatro espaços, aspas simples, ponto e vírgula e sem vírgula final.

### 4.4. Alternativas descartadas

- Restaurar porcentagens, mudar fórmulas ou trocar MaxGrid por CSS Grid: altera contrato fora do pedido.
- Implementar dispositivos no parser para eliminar a divergência: tarefa de runtime separada.
- Trocar indiscriminadamente todos os `s50/s100`: pode alterar consumidores e mínimos existentes.
- Criar novo documento com tabela copiada: aumenta divergência entre referências.
- Reformar MaxGridCols/tema global ou editar skills symlinkadas: escopos distintos.
- Instalar ferramentas Markdown/MaxPinia para esta tarefa: desnecessário e sem autorização.
- Enfraquecer testes ou ignorar configuração/hook para obter verde: proibido.

## 5. Tarefas ordenadas

### T0 — Admissão e preflight por leitura

**Depende de:** autorização de Execute. **Escrita funcional:** nenhuma.

1. Ler plano e spec na primeira admissão, conferir branch/raiz/HEAD/status e trabalho preexistente. Na retomada, ler apenas trechos pertinentes e estado de execução.
2. Revalidar parsers, fórmulas, setup efetivo e notificações. Se tiver surgido suporte responsivo real, ajustar documentação e validação com evidência nova; não repetir limitação desatualizada.
3. Conferir todos os scripts a executar e eventuais pre/posthooks; inspecionar `scripts/check-playground-bundle.mjs` antes desse gate, pois não foi lido integralmente nesta sessão.
4. Conferir symlinks efetivos de dependências, caches, outputs e arquivos gerados por Vite/auto-import; ferramentas não podem gravar na árvore principal via `node_modules` compartilhado. Se não for possível assegurar isolamento, pedir provisionamento adequado ao MaxCode/usuário; não instalar/desvincular por conta própria.
5. Conferir resolução única de Vue, Pinia e Axios/MaxUse no harness, mocks/adaptadores e saídas da suíte. Não criar `.env`, migrations, resets ou serviços para documentação local.
6. Confirmar ambiente browser/Chromium e playground sem conflito com serviço existente. Não matar processo alheio nem alterar host/porta/config para contornar indisponibilidade.

**Pronto quando:** fontes ainda correspondem à spec; lista de escrita limitada; preflight registra limitações; execução de comandos não ultrapassará worktree nem acionará backend real.

### T1 — Consolidar contratos em THEME e COMPONENTS

**Depende de:** T0. **Arquivos:** `docs/THEME.md`, `COMPONENTS.md`.

1. Revisar apenas seções MaxGrid/família `s`/setup necessário e conservar as explicações que continuam corretas.
2. Aplicar conteúdo da seção 4.2 e tabela da spec; remover percentual como semântica corrente e aviso de branch antiga.
3. Acrescentar tabela de dispositivo e distinguir parsers. Tokens repetidos aceitos pelo preset são limite observado, não uso recomendado nem suporte do MaxGrid.
4. Preparar ao menos um exemplo Vue completo de campos, sem dados pessoais e com modelos tipados; exemplos adicionais podem ser trechos explicitamente rotulados.
5. Usar classes estáticas para explicar dimensões antes do Attributify; explicar requisitos adicionais para atributos sem valor e para nomes de classe montados dinamicamente (precisam de tokens detectáveis ou safelist específica confirmada).
6. Manter âncoras e links, e não ajustar tabelas de componentes irmãos.

**Pronto quando:** cada afirmação tem fonte local; setup é copiável; componente e preset não se contradizem; não se promete release nem runtime responsivo inexistente.

### T2 — Atualizar pontos de entrada da documentação

**Depende de:** T1. **Arquivos:** `README.md`, `docs/AUTO-IMPORT.md`.

1. No README, completar snippet do preset com imports reais e orientar configuração necessária; fornecer links ao MaxGrid e à seção `s` sem repetir tabela inteira.
2. Evitar copiar referências PrimeVue/Aura da configuração avançada; não reformar essa seção nem o início rápido global neste trabalho.
3. Em AUTO-IMPORT, acrescentar nota próxima ao uso de `Grid`: alias é MaxGrid, mas resolver não habilita preset/Attributify/CSS virtual. Vincular às referências canônicas.
4. Conferir links relativos de ambos os arquivos e preservação dos exemplos adjacentes.

**Pronto quando:** leitor chega a componente e dimensões pelos pontos de entrada, com separação clara entre import de componente e geração de CSS.

### T3 — Corrigir documentação navegável e acrescentar regressão

**Depende de:** T1/T2. **Arquivos:** `playground/src/catalog.ts`, `playground/src/scenarios/layout-grid.vue`, `tests/architecture/playgroundCoverage.test.ts`.

1. Alterar somente descrição do registro MaxGrid para flexbox com wrap/dimensionamento `s`, sem 12 colunas nem faixa artificial de valores.
2. Implementar todo o bloco demonstrativo MaxGrid da seção 4.3; preservar imports e blocos vizinhos, acrescentando apenas os componentes Max necessários.
3. Acrescentar regressões arquiteturais pequenas seguindo os testes existentes: registro MaxGrid não anuncia 12 colunas; bloco MaxGrid não apresenta `disabled/error/severity`; há exemplos identificáveis com filhos reais, classe e atributo `s`, e direção `start/end` sem dispositivo.
4. Limitar asserções ao contrato e marcadores estáveis do exemplo, não a parágrafos inteiros ou ordenação cosmética. Inspecionar somente o bloco MaxGrid; não fazer uma asserção global que falhe por estados legados dos blocos vizinhos.
5. Testes estáticos preservam intenção editorial; não fingem provar geometria ou interação. Prova visual continua separada.

**Pronto quando:** demonstrações coerentes com os textos; testes pertinentes escritos; nenhum arquivo de `src/`, config, manifesto ou geração automática intencionalmente alterado.

### T4 — Revisar e validar o lote completo

**Depende de:** todas as edições T1–T3 terminadas, sem escritor concorrente.

1. Revisar diff, matrizes e links; conferir inventário ativo para não deixar afirmação percentual de uso corrente.
2. Executar gates conforme seção 6; corrigir somente falhas causadas pelo lote, em conjunto. Registrar falhas preexistentes e pedir autorização separada quando a correção ampliar escopo.
3. Avaliar o diff bruto com guardrails e fazer revisão pelo risco dos contratos, dispositivos, isolamento e preservação dos exemplos vizinhos. Usar julgamento como complemento, não prova determinística.
4. Realizar validação manual local segura; registrar resultado ou `manualPending` com próxima ação concreta.
5. Atualizar handoff factual e apresentar resumo sem afirmar aprovação integral se há gate falhando ou pendente.

**Pronto quando:** matriz preenchida com evidência vigente; alterações limitadas; falhas e pendências explicitadas. Com blocker vigente, entregar progresso, não conclusão total de execução.

### Coordenação e paralelismo futuro

Executor único é suficiente. Não delegar automaticamente. Se outra sessão for explicitamente autorizada a usar múltiplos executores: T1 fixa contratos antes das demais; T2 pode escrever somente README/AUTO-IMPORT enquanto T3 escreve catálogo/cenário/teste, sem sobreposição. Cada executor recebe objetivo, arquivos permitidos e referências às seções pertinentes, não a conversa inteira. Validações só depois de cessar toda escrita. Revisão independente nos marcos de contrato e entrega, não a cada microedição.

## 6. Matriz de aceite e estratégia de validação

| Tarefa / requisito | Evidência esperada | Testes/verificações pertinentes | Revisão pelo risco | Manual |
|---|---|---|---|---|
| T1 / R1 | COMPONENTS com tipos, slot, attrs, gap e mensagens corretos | Leitura cruzada MaxGrid/helper; `MaxGrid.test.ts` existente | Não inventar props/defaults/eventos nem semântica de fieldset acessível | Conferir label e flag de mensagem no exemplo |
| T1 / R2 | THEME com fórmulas/tabela e extremos | Calcular valores da spec; `presetMaxUno.generate.test.ts` existente | 20px versus 24px; mínimo prevalente; full não força largura | Conferir limites em viewport amplo e estreito |
| T1 / R3 | Tabela de dispositivos e parser distinto explícitos | Leitura das duas regex/media queries; `maxGridLineBreaks.browser.ts` para tokens simples | Não inferir fronteira responsiva pelo CSS; tablet inclui mobile | Sem demonstração falsa de dispositivo |
| T1–T2 / R4 | Snippets com imports, plugin/CSS virtual e Attributify | Comparação com `uno.config.ts`, config Vite e teste de geração integrado | Preservar ignoreAttributes; não sobrescrever setup inteiro | Revisão de copiabilidade e Markdown |
| T2 / R5 | Links dos pontos de entrada válidos | Conferir destinos e âncoras em arquivos reais | Sem referência obsoleta a branch/versão publicada | Navegar README → COMPONENTS/THEME e AUTO-IMPORT → estilos |
| T3 / R5–R6 | Catálogo coerente e cenários com filhos reais | Regressões acrescidas em `playgroundCoverage.test.ts`; tipos/lint/build | Assertions limitadas ao MaxGrid; componentes Max e modelo local | Digitar nos inputs, claro/escuro, larguras disponíveis |
| T0/T4 / R7 | Diff sem arquivos funcionais/config/deps alterados | `git diff --check`, revisão de caminhos, gate lockfile | Symlink compartilhado, históricos e blocos vizinhos | Não aplicável |
| T4 / R8 | Checks reais e estado vigente | Registro de execução version 2; códigos de saída efetivos | Não omitir falhas de suíte nem aceitar dublê como visual | `manualPending` tem próxima ação |

### 6.1. Ordem dos gates futuros

Após terminar o lote e confirmar preflight, executar no diretório exclusivo da worktree:

```bash
npm run check:lockfile
npm run test
npm run test:browser
npm run type-check
npm run type-check:test
npm run lint
npm run build
npm run check:playground:bundle
git diff --check
```

- Os scripts acima foram identificados no projeto. Executá-los em lote; não criar comando agregado ou scripts novos. `build` já chama vue-tsc: reaproveitar a checagem de tipos embutida quando comprovadamente equivalente para a revisão corrente, em vez de repetir `type-check` sem motivo. A checagem separada de tipos de testes não é substituída pelo build.
- A suíte completa inclui MaxGrid, preset gerado e cobertura do playground; não repetir cada arquivo isoladamente na mesma revisão por rotina. Browser é necessário para sustentar exemplos de layout, mas não valida todos os dispositivos só por conter media query.
- Para diagnóstico de falha concreta, o comando direcionado confirmado pelo padrão do projeto é `npx vitest run tests/components/MaxGrid.test.ts tests/preset/presetMaxUno.generate.test.ts tests/architecture/playgroundCoverage.test.ts`. Não usar isso para substituir aprovação da suíte completa nem contornar integridade.
- Há risco conhecido de baseline em `tests/preset/presetMaxUno.test.ts`. Se ocorrer, registrar saída real, separar causalidade e não alterar esse arquivo sem autorização. Uma falha previsível por leitura ainda não é um check `failed` executado.
- Gate de integridade falhado bloqueia verificações dependentes; não usar comando direto, ignoreConfig ou remoção de hook para bypass.
- Não rodar `npm run verify`, coverage, benchmark, consumidores ou auditoria por rotina nesta atualização: `verify` é o gate de pré-release e inclui etapas externas ao lote. Se uma release futura for solicitada, fazer preflight próprio e preservar o gate completo, sem substituir por validação documental.
- Se um check falhar, diagnosticar o conjunto e corrigir falhas causais em lote. Reexecutar somente checks afetados e a suíte necessária à nova revisão. Não repetir a mesma falha sem diagnóstico/progresso.

### 6.2. Validação manual segura

1. Conferir ambiente e serviço local antes de usar `npm run dev:playground`; respeitar host/porta configurados e outputs gerados. Não iniciar servidor nesta sessão Plan.
2. Se houver ambiente exclusivo/serviço autorizado, localizar cenário `layout-grid` pelo catálogo/busca da interface, sem inventar endpoint próprio para cenário.
3. Conferir ausência de marcadores em exemplo de wrap, fronteiras antes/depois nos exemplos marcados, gap, label/centralização, flags de mensagem, edição dos valores e preservação visual no claro/escuro.
4. Alternar larguras existentes da toolbar; mínimo maior que container é limitação documentada, não garantia de ausência de overflow. Toolbar de tamanho do container não prova media query de viewport.
5. Conferir renderização dos Markdown e todos os links alterados. Código de exemplo completo deve declarar modelos; trecho parcial deve avisar isso.
6. Não abrir aplicação produtiva, consumidor externo ou backend para provar documentação. Se acesso visual não estiver disponível, marcar `manualPending`, apontar cenário/ambiente necessário e próxima ação.

## 7. Riscos e operação

| Risco | Tratamento |
|---|---|
| Confundir tokens novos com porcentagens antigas | Corrigir textos ativos; manter somente explicação histórica rotulada; não migrar usuários automaticamente |
| Prometer dispositivos que MaxGrid não interpreta | Documentar parser distinto e notificação; runtime separado |
| `full/max` interpretado como linha inteira | Explicar teto, flex-grow igual e fronteira independente |
| Excesso de mínimos e overflow | Exemplos com valores usuais; alerta de que wrap não reduz mínimo |
| Props fictícias reproduzidas do playground | Substituir só bloco MaxGrid por contrato real |
| Temas/MaxGridCols adjacentes desatualizados | Notificar e preservar fora do lote |
| Dependências/caches escrevendo na árvore principal | Preflight e bloqueio até ambiente isolado; sem instalação no symlink |
| Testes mockados incompatíveis com gerador | Diagnóstico separado; não relaxar assert nem alterar implementação |
| Validação visual confundida com happy-dom/mock | Chromium/CSS real e manual separados; pendência explícita |
| Documentação falando de pacote publicado não verificado | Descrever revisão local; aviso genérico para versão consumida |
| Mudanças concorrentes ou plano antigo | Conferir status, hashes e fontes; não sobrescrever trabalho desconhecido |

Sem migração de dados, permissões novas, segredos, filas, storage externo ou alteração de desempenho do runtime. Reversão deve reverter somente as alterações documentais/demonstrativas/teste realizadas pelo executor; nunca resetar a worktree ou remover trabalho alheio. Não remover versões históricas de planos e notificações para “limpar” buscas.

## 8. Retomada, estado de execução e entrega

Durante **Execute**, não durante Plan, registrar marcos T0, T1/T2, T3 e T4 em:

`docs/plans/wt-3917332f/execution-state.json`.

Este arquivo **não foi criado e não é destino autorizado nesta sessão Plan**. Sua escrita futura deve estar autorizada pelo workflow Execute.

O executor deve:

1. Ler plano/spec na primeira admissão; na retomada, consultar tarefas/contratos pertinentes.
2. Conferir trabalho já realizado, mudanças locais e fontes antes de repetir tarefa ou validação.
3. Preservar decisões e dependências; não reabrir sem evidência nova ou requisito alterado.
4. Calcular SHA256 real dos bytes de `plan.md` e da revisão factual dos conteúdos de cada tarefa (com lista de arquivos/ordem explícita). SHA Git é identificação da base, não substituto desses hashes.
5. Usar novos registros com `version: 2`, referência ao hash real do plano, tarefas/estado/arquivos e `verification: { revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`.
6. Registrar somente comandos realmente executados, inclusive toda falha da suíte completa. `passed` exige `exitCode: 0`; `failed` exige inteiro diferente de zero; `pending` não aceita exitCode. Não deduzir código de saída de `tool:end.ok`.
7. Reaproveitar check aprovado somente para a mesma revisão factual. Checks vazios, resultado desatualizado/ausente ou falha vigente impedem validação integral. Version 1 continua legível, mas não prova aprovação automaticamente.
8. Não tratar registro autodeclarado como prova de execução nativa ou de ausência de checks omitidos; preservar evidências de comandos e resultados.
9. Em bloqueio/cancelamento, salvar progresso parcial e próxima ação concreta. Tarefas assíncronas exigem espera limitada com recuo e informação nova; não consultar status repetidamente sem motivo.
10. Entregar arquivos alterados, requisitos atendidos, checks/saídas reais e pendências; não commitar/integrar/limpar a worktree.

## 9. Revisão final do plano

- Pedido mantido como atualização documental, não correção de implementação.
- Spec foi salva antes do plano; os únicos arquivos escritos em Plan são documentos autorizados.
- Escopo inclui referências Markdown, configuração explicativa, catálogo navegável, exemplos MaxGrid e regressão direcionada; runtime e componentes vizinhos ficam intactos.
- Fórmulas 20/24px, full/max como teto, dimensão incondicional, breakpoints exatos e diferença dos parsers foram confirmados por leitura.
- Sem pressuposto de pacote publicado, de sucesso de testes ou de isolamento por mera existência de worktree.
- Matriz cobre requisitos, evidências, testes, revisão pelo risco e manual; falhas baseline e ambiente compartilhado têm tratamento sem bypass.
- Plano tem ordem/dependências, arquivos de escrita delimitados e orientações de retomada com estado factual.
- Nenhuma pergunta necessária permaneceu aberta. O usuário pode revisar o escopo antes de autorizar Execute.
