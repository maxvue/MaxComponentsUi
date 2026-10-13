# Especificação técnica — Documentação completa do MaxGrid e dos tokens s

## 1. Contexto & Objetivo

- Data: 2026-10-13.
- Projeto: `@maxvue/max-components-ui`, manifesto local `1.1.2`.
- Worktree e branch: `wt-3917332f`.
- Raiz obrigatória: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-3917332f`.
- Revisão investigada: `3b9c5ce94b68f7cae3186152a70f2bd80016cecd`; árvore inicialmente sem alterações.
- Pedido: atualizar toda a documentação do MaxGrid, incluindo a integração com `presetMaxUno` e os valores `s-*`.
- Beneficiários: desenvolvedores consumidores e mantenedores de formulários e layouts Max.

O catálogo Markdown ainda apresenta `s50`/`s100` como porcentagens, o playground descreve MaxGrid como grid de 12 colunas e a referência do tema contém aviso de outra branch. A implementação local já usa limites em pixels e organização explícita de linhas. O preset também reconhece sufixos de dispositivo que não são reconhecidos pelo organizador de linhas do MaxGrid. A documentação deve explicar o que efetivamente existe, sem transformar uma limitação em promessa nem executar uma correção de runtime.

Esta spec precede o plano porque a atualização abrange várias superfícies, exemplos e contratos interdependentes. A sessão Plan só escreve spec, plano e notificações nos destinos autorizados. A atualização descrita abaixo é futura e depende de autorização de execução.

## 2. Escopo

### 2.1. Incluído

1. Referência canônica do componente em `COMPONENTS.md`: props, slot, atributos, flexbox, espaçamentos, dimensionamento, quebras, exemplos, limites e links.
2. Referência canônica dos tokens em `docs/THEME.md`: sintaxe real do preset, fórmulas, tabelas, dispositivos, Attributify, migração conceitual e limites.
3. Orientação curta e configuração completa do preset em `README.md`, restritas às seções ligadas a layout/preset.
4. Ligação entre auto-import e estilos em `docs/AUTO-IMPORT.md`; auto-import não configura UnoCSS.
5. Descrição de MaxGrid em `playground/src/catalog.ts` e exemplos demonstrativos do bloco MaxGrid em `playground/src/scenarios/layout-grid.vue`. São documentação navegável, não mudança da biblioteca.
6. Regressão pequena para o material demonstrativo em `tests/architecture/playgroundCoverage.test.ts`, preservando os testes existentes.
7. Inventário de referências ativas, revisão de links e registro de divergências externas ao escopo.

### 2.2. Fora de escopo

- Modificar `src/components/MaxGrid.vue`, `src/components/base/gridSlotRows.ts`, `src/presetMaxUno.ts`, estilos, fórmulas, breakpoints, exports ou comportamento de inputs.
- Implementar quebras por dispositivo no MaxGrid ou fazer funcionar `break-before/after` em flexbox comum.
- Migrar usos da família `s` em consumidores, MaxGridCols ou outros componentes.
- Reformar o tema/PrimeVue de toda a documentação, ajustar contagens globais de componentes ou exemplos de overlays.
- Alterar plans/specs/notificações históricos, instruções globais, skills projetadas por symlink, diretórios de outros trabalhos ou arquivos gerados.
- Instalar dependências, mudar configurações/harness, publicar pacote, atualizar versão, fazer commit, merge, push ou deploy.
- Criar backend, chamadas HTTP, cache ou stores para exemplos locais de layout.

## 3. Arquitetura & Mudanças Técnicas

### 3.1. Fontes de verdade e superfícies

| Arquivo existente | Papel e evidência | Atualização futura |
|---|---|---|
| `src/components/MaxGrid.vue:1–77` | Div flex com wrap; props `label?: string \| null`, `labelCenter?: boolean`; gap `13px 8px`; `GridSlotRows`; flags de mensagem | Somente leitura |
| `src/components/base/gridSlotRows.ts:17,69–109,116–173` | Parser sem dispositivos; classes normalizadas; atributos ativos; segmentos condicionais | Somente leitura |
| `src/presetMaxUno.ts:81–125,140–165` | Regex ampliada, gerador de regras, breakpoints, preflight Sass e alias | Somente leitura |
| `COMPONENTS.md:1168–1187` | Exemplo com porcentagens incorretas | Reescrever referência MaxGrid |
| `docs/THEME.md:46–60,139–235,251–256` | Referência extensa; regex antiga; aviso de outra branch; configuração sem Attributify | Consolidar contrato local e setup de `s` |
| `README.md:151,162–179` | Entrada de layout; snippet usa `defineConfig` sem import | Adicionar orientação e links; corrigir snippet relacionado |
| `docs/AUTO-IMPORT.md:51,61–89` | Alias `Grid`; exemplo e notas do resolver | Acrescentar nota de separação entre resolução e CSS |
| `playground/src/catalog.ts:121` | MaxGrid descrito como 12 colunas | Corrigir somente registro MaxGrid |
| `playground/src/scenarios/layout-grid.vue:7–26` | MaxGrid vazio com supostos estados disabled/error | Substituir bloco MaxGrid por usos reais |
| `tests/architecture/playgroundCoverage.test.ts` | Regressões de catálogo e arquivos demonstrativos | Acrescentar verificações do bloco MaxGrid |

Não é necessário criar uma terceira referência Markdown independente. `COMPONENTS.md` fica responsável pelo componente; `docs/THEME.md`, pelo preset. As outras superfícies apontam para essas duas e evitam duplicar a tabela completa.

### 3.2. Contrato a documentar: MaxGrid

- Flexbox horizontal com `flex-wrap: wrap`, não CSS Grid de 12 colunas.
- Gap de 13px vertical e 8px horizontal; padding superior de 14px; raiz posicionada relativamente.
- `label` é opcional, aceita `null` e só aparece quando tem valor verdadeiro; `labelCenter` opcional centraliza visualmente o texto. Não há `withDefaults` nem valores padrão explícitos no código.
- Apenas slot `default`; nenhum evento próprio ou `v-model` do grid.
- Classes, `id`, `style` e atributos adicionais chegam à div raiz. `s-*`, `no-message` e `no-messages` não são props declaradas do MaxGrid.
- A presença de `no-message` ou `no-messages` colapsa a área de mensagem dos inputs internos por CSS. Não apresentar `:no-message="false"` como forma garantida de desativação: o seletor verifica presença, não valor.
- `disabled`, `error` e `severity` não são estados implementados pelo grid. Inputs individuais podem possuir seus próprios estados.
- Quebras reais usam tokens sem dispositivo nos filhos lógicos diretos do slot: `start` separa antes; `end`, depois. Expandem Fragments, não descendem em elementos ou slots de outros componentes.
- Sem marcadores ativos, preserva nós originais sem `.max-grid-row`; com marcadores, organiza segmentos que ainda permitem wrap natural e herdam gap/alinhamentos. A fronteira não muda limites de largura do item.
- `end` seguido de `start` não cria linha vazia. Início/fim também não criam segmento vazio. Marcador estático em todo item de `v-for` pode produzir uma linha por item.
- Classes string/array/objeto são normalizadas pelo Vue; atributos de marcadores são ativos somente com `''`, `true` ou `'true'`. `false`, `null`, `undefined` não ativam a segmentação. Isso não comprova comportamento idêntico do CSS para todos os atributos dinâmicos.
- Cada MaxGrid aninhado interpreta seu próprio slot. Wrappers são detalhe observável interno, não nova API pública.
- Não prometer preservação de foco/instância durante todas as mudanças dinâmicas de fronteiras: os testes lidos não cobrem todos os casos de reparenting.

### 3.3. Contrato a documentar: preset e família s

Regex do preset nesta revisão:

```regex
/^s-?(\d+)(?:-(full|max|\d+))?(?:-(start|end|desktop|mobile|tablet)){0,2}$/
```

Regex do organizador de linhas do MaxGrid:

```regex
/^s-?(\d+)(?:-(full|max|\d+))?(?:-(start|end))?$/
```

- Base `n` inteira não negativa: `flex: 1 1 0%`, `min-width: n × 20px`, `max-width: n × 24px`.
- `-full`/`-max`: teto de `100%`, não `width: 100%` nem ocupação exclusiva da linha.
- `-m`: teto de `m × 20px`. As dimensões são aplicadas em qualquer tela, mesmo com sufixo de dispositivo.
- Sem `!important` nesta família; não generalizar esse fato para todas as regras do preset.
- `sN` e `s-N` são equivalentes. Números não representam porcentagem, quantidade de colunas nem peso de `flex-grow`.
- `-start` gera `break-before: always`; `-end`, `break-after: always`. No MaxGrid, somente os tokens aceitos por seu parser também geram fronteiras reais.
- No preset, direção e dispositivo podem aparecer em qualquer ordem após a extensão: `s7-end-mobile` e `s7-mobile-end`. Recomendar no máximo uma direção e um dispositivo. A regex tolera algumas repetições; o gerador usa o primeiro marcador de posição e o primeiro dispositivo encontrados. Não promover combinações ambíguas como API recomendada.

| Dispositivo no token | Condição CSS emitida para `break-*` | Dimensões | Quebra real no MaxGrid atual |
|---|---|---|---|
| `mobile` | `@media (max-width: 767.98px)` | Sempre | Não |
| `tablet` | `@media (max-width: 1000.98px)`; inclui larguras mobile | Sempre | Não |
| `desktop` | `@media (min-width: 1001px)` | Sempre | Não |
| Sem dispositivo, com `start/end` | Sem media query | Sempre | Sim, nos filhos lógicos diretos |
| Dispositivo sem direção | Nenhum `break-*` adicional | Sempre | Não |

Dispositivos usam largura da viewport CSS, não do container. Não substituir limiares pelo conjunto de larguras da toolbar do playground. Não prometer uma partição matemática contínua entre `1000.98px` e `1001px`.

Tabela mínima da documentação final:

| Token | Mínimo | Máximo | Observação |
|---|---|---|---|
| `s1` / `s-1` | 20px | 24px | Sem fronteira |
| `s2` | 40px | 48px | Sem fronteira |
| `s10` | 200px | 240px | Não significa 10% |
| `s10-20` | 200px | 400px | Extensão usa 20px |
| `s10-full` / `s10-max` | 200px | 100% | Teto, não largura forçada |
| `s7-end` | 140px | 168px | Fronteira após no MaxGrid |
| `s3-10-start` | 60px | 200px | Fronteira antes no MaxGrid |
| `s7-end-mobile` | 140px | 168px | Só fragmentação CSS condicional; sem fronteira MaxGrid |
| `s50` / `s-50` | 1000px | 1200px | Não significa 50% |
| `s100` | 2000px | 2400px | Não significa 100% |
| `s0` | 0px | 0px | Pode colapsar |
| `s0-full` | 0px | 100% | Permite mínimo zero |
| `s10-0` | 200px | 0px | Conflito: mínimo prevalece no CSS |

Limites: decimais, negativos e sufixos maiúsculos não correspondem à regex. Não há lista finita `s10…s100`. Não prometer precisão ilimitada para inteiros enormes convertidos por `Number`. Wrap não reduz um item abaixo do mínimo: container menor que o mínimo ainda pode transbordar. `s` não configura pai flex, wrap nem gap e não substitui os spans do MaxGridCols.

### 3.4. Configuração e exemplos

1. Imports públicos: componentes de `@maxvue/max-components-ui`; preset de `@maxvue/max-components-ui/preset`; alias exportado `maxUnoPreset` apenas mencionado, sem nova dependência.
2. Mostrar configuração UnoCSS com `defineConfig`, `presetMaxUno`, `presetWind3` e `presetAttributify`, seguindo as configurações reais. Classes estáticas não exigem Attributify; atributos sem valor exigem.
3. Explicar plugin Vite `UnoCSS()` e import `virtual:uno.css` na entrada da aplicação. Auto-import de componentes e CSS do componente não substituem a geração das regras `s`.
4. Manter as proteções de `ignoreAttributes` do projeto, sem instruir a sobrescrever integralmente configurações consumidoras.
5. Diferenciar CSS dos componentes, CSS gerado pelo UnoCSS e preflights do preset. `getCSS` compila `themes/all.scss`, que inclui mais arquivos que os três listados atualmente. Não expandir essa seção para uma revisão global de tema.
6. Exemplos Vue completos ou explicitamente rotulados como trecho de template; abertura de tags em linha única, imports completos, TS/aspas/ponto e vírgula no padrão local e somente componentes/props existentes.
7. Usar valores usuais como `s10-full`, `s10-20`, `s7-end`, `s3-10-start`; não usar `s50/s100` para demonstrar metades/largura total.
8. Exemplos de layout sem chamadas remotas, persistência ou helpers novos. MaxPinia continua sendo a opção exigida para GET/cache/salvamento se um exemplo futuro os precisar; nada disso é necessário aqui. MaxUse continua sendo a fonte de helpers; não há helper novo a criar nem dependência a instalar.

Fluxo explicativo:

```text
Template com MaxGrid e tokens estáticos
  ├─ UnoCSS + presetMaxUno → CSS de dimensões e fragmentação
  │    └─ Attributify quando os tokens forem atributos
  └─ Slot do MaxGrid → parser sem dispositivo → segmentos quando start/end ativos
       └─ Flex-wrap natural + gap + limites CSS dos itens
```

## 4. Plano de Execução Faseado

1. **Admissão e preflight por leitura:** conferir branch, arquivos locais, fontes, notificações, scripts, symlinks e harness. Revalidar esta spec diante de mudanças reais.
2. **Referências canônicas:** atualizar `docs/THEME.md` e `COMPONENTS.md` com contratos acima, removendo aviso de disponibilidade de outra branch; preservar advertência genérica sobre a versão efetivamente consumida, sem afirmar release.
3. **Descoberta e configuração:** atualizar apenas trechos pertinentes de `README.md` e `docs/AUTO-IMPORT.md`, com links relativos e snippets completos.
4. **Documentação demonstrativa e regressão:** corrigir registro MaxGrid no catálogo, trocar somente bloco MaxGrid do cenário por exemplos úteis e acrescentar verificações direcionadas em `playgroundCoverage.test.ts`.
5. **Revisão e validação em lote:** terminar todas as edições e testes antes de rodar a suíte; revisar matriz de aceite e links; diagnosticar falhas conjuntamente; não corrigir baseline fora de escopo.
6. **Handoff:** registrar evidências reais e pendências durante Execute, sem integração Git ou limpeza da worktree pelo agente.

Detalhes operacionais, tarefas e matriz de aceite estão em `plan.md` deste diretório.

## 5. Critérios de Aceite & Validação

- Nenhuma referência ativa tratada apresenta `s50` como 50%, `s100` como 100% ou MaxGrid como 12 colunas. Exemplos de semântica antiga ficam explicitamente históricos.
- Props, slot, attrs, mensagens, gap e comportamento sem marcadores correspondem ao código; nenhum estado ou evento próprio é inventado.
- Fórmulas/tabela, tokens opcionais, limites e setup são coerentes entre documentos e playground.
- Sufixos de dispositivo são documentados como CSS de fragmentação condicional, não como quebras reais responsivas no MaxGrid desta revisão.
- Snippets distinguem classes e Attributify e não dependem de variáveis sem declaração quando rotulados como completos.
- Links e âncoras existentes são preservados ou têm todas as referências atualizadas; histórico não é reescrito.
- Testes de cobertura do playground preservados e acrescidos de regressões do material MaxGrid; cenários vizinhos não são reformados.
- Nenhum arquivo funcional da biblioteca, configuração, dependência ou versão é alterado.

Comandos existentes para a execução futura: `npm run check:lockfile`, `npm run test`, `npm run test:browser`, `npm run type-check`, `npm run type-check:test`, `npm run lint`, `npm run build`, `npm run check:playground:bundle`. A seleção e ordem estão no plano; não executar nenhum deles em Plan. `npm run verify` é pré-release, não necessário para documentação nem autorizado como publicação.

Validação manual futura: ler as duas referências como consumidor, verificar renderização Markdown e links, abrir cenário `layout-grid` pelo catálogo do playground no ambiente local confirmado, alternar claro/escuro e larguras disponíveis, confirmar wrap/fronteiras/inputs/flags com CSS real. Sem ambiente seguro, registrar `manualPending` e próxima ação; não afirmar aceite visual.

### 5.1. Limitações e bloqueios conhecidos

- Nenhum teste, build, servidor ou instalação foi executado nesta investigação.
- `node_modules` é symlink para a árvore principal; executar ferramentas que gravem nesse destino pode ultrapassar o isolamento exigido. Planejar cache/output local e verificar efeitos antes de execução; não instalar na árvore compartilhada.
- MaxPinia é peer opcional e não está instalado no caminho inspecionado; isso não prova erro do pacote. Não adicioná-lo para demonstração puramente local.
- Os testes mockados do preset ainda tratam o retorno como objeto e rejeitam token hoje aceito pelo preset; há divergência por leitura, não resultado de teste executado. Notificação própria registra o risco de baseline.
- Documentação oficial UnoCSS consultada via Context7 aponta para `main`, não snapshot certificado de `66.10.5`. Configuração local, lockfile e testes são evidência da versão usada; a consulta oficial confirma setup, não prova compatibilidade de todo snippet.
- Publicação npm, build instalado em consumidor e runtime de aplicações externas não foram verificados. O `1.1.2` é versão do manifesto, não prova da versão publicada com esse contrato.
