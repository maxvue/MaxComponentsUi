# Plano de execução — ICON_SERVER por aplicação

- Data: 2026-10-28.
- Projeto: `@maxvue/max-components-ui` (`1.1.36` na investigação).
- Worktree/branch: `wt-37afb347`.
- Raiz exclusiva: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-37afb347`.
- Especificação prévia: [spec.md](./spec.md).
- Estado: planejamento para revisão. Nenhuma etapa de implementação ou teste foi executada.

## 1. Objetivo, autorização e restrições

Permitir que aplicações que usam `MaxIcon` escolham o servidor com `ICON_SERVER` no próprio `.env`, conservando o Engeapp quando a variável não estiver configurada. O usuário confirmou a origem **em cada aplicação consumidora**, e não no build da biblioteca.

Nesta sessão somente `spec.md` e `plan.md` estão autorizados para escrita. Este plano não autoriza sua própria execução. Uma sessão Execute deve obter a autorização correspondente, reutilizar esta worktree, não trocar de branch nem investigar outras worktrees. Não fazer commit, merge, push, publicação, atualização de pacotes, limpeza da worktree ou deploy.

Usuários afetados: integradores dos consumidores e pessoas que visualizam ícones. Não há mudança visual ou de uso das props de `MaxIcon`.

## 2. Evidências e comportamento a preservar

| Evidência existente | Conclusão factual |
|---|---|
| `src/components/MaxIcon.vue:23-27,163-174` | Componente delega à store e renderiza o SVG em cache; não escolhe diretamente um host. |
| `src/stores/useIcon.Store.ts:27-81` | Inicializa cache, migra localStorage legado e carrega IndexedDB. Nem toda renderização produz rede. |
| `src/stores/useIcon.Store.ts:134-175,178-289` | Usa GET em lote, fallback Iconify e POST consolidado; lê três rotas da configuração. |
| `src/helpers/maxAppConfig.ts` | GET e POST têm defaults Engeapp independentes; merge acumulativo; reset para defaults. |
| `src/types/app.ts:177-197` e `src/types/app.d.ts:167-187` | Contrato de rotas; os dois arquivos são rastreados. |
| `src/components/MaxApp.vue:199-208` | Setup reaplica apenas opções presentes; deve preservar o servidor definido no boot. |
| `src/index.ts:359-360`; `package.json:8-15,144-147` | API de configuração já pública; consumidor instala código pré-compilado. |
| `vite.config.ts`; `env.d.ts`; `playground/vite.config.ts` | Não foi encontrada ligação para `ICON_SERVER`. O playground usa fontes, não comprova o pacote publicado. |
| `tests/helpers/maxAppConfig.test.ts` | Regressões de defaults, merge, chamada sem argumentos, preservação do boot e reset. |
| `tests/stores/useIcon.Store.test.ts` | Regressões de rotas customizadas, fallback, POST, sanitização, retries, concorrência e descarte. |
| `tests/components/MaxIcon.test.ts`; `tests/components/MaxApp.test.ts` | API/renderização dos ícones e setup do shell já possuem harness. |
| `tests/architecture/package-exports.test.ts` | Suíte exige `dist` atualizado e verifica exports públicos; não deve ser contornada. |
| `tests/setup.ts`; `vitest.config.ts` | Fetch simulado, IndexedDB em memória, política de console e deduplicação de Vue/Pinia. |
| `README.md:234-250`; `package.json:856-883` | `npm test` faz build e suíte; `verify` agrega gates completos. |
| `README.md:258-262`; scripts de consumidores | Consumidores locais podem exigir integridade da biblioteca; scripts de consumidores instalam dependências em diretórios temporários. |
| `src/helpers/iconIdb.ts` | Cache identificado por nome do ícone, não por servidor. |
| `docs/STORES.md:13-46` | Documentação de cache ainda menciona localStorage como persistência principal; ajustar somente a seção pertinente. |

Investigação realizada: leituras e buscas, `git status --short --branch` e listagem de arquivos rastreados. A branch estava correta e a árvore limpa antes da criação destes documentos. A busca de `.env*` na raiz da worktree não encontrou arquivos; nenhum segredo foi lido. Não houve instalação, build, teste, chamada à API de ícones ou verificação operacional de consumidor.

Versões: Vite `8.3.3` confirmado no lockfile; MaxUse declarado `^1.1.47` e resolvido `1.1.47`; MaxPinia é peer opcional `^0.2.0`. A resolução efetiva/symlinks do ambiente de execução ainda precisa ser conferida. A documentação oficial consultada é Vite `8.0.10`, da mesma linha principal, com limite de revisão explicitado na spec.

## 3. Solução e decisões

### Decisões confirmadas

- A origem da configuração é o `.env` de cada consumidor.
- O servidor legado continua disponível como padrão.
- Este trabalho é somente investigação/documentação; alterações futuras permanecem na worktree indicada.

### Proposta técnica para revisão

1. Adicionar `iconServer?: string` a `MaxAppConfig`, sem novas props em componentes ou novos entrypoints.
2. O consumidor expõe apenas `ICON_SERVER` pelo Vite e chama `configureMaxApp({ iconServer: import.meta.env.ICON_SERVER })` no boot, antes de criar/usar stores e montar a aplicação.
3. A biblioteca normaliza o valor e devolve `routeIcons`/`routeIconsSync` efetivos em `getMaxAppConfig`, aproveitando o fluxo HTTP já existente.
4. Separar opções explicitamente recebidas do objeto de configuração resolvida. Recalcular os dois defaults sem confundi-los com overrides, preservando o merge dos demais campos.

**Integração inicial obrigatória:** somente criar a variável no `.env` não basta em uma aplicação ainda não integrada. A API nova recebe um valor público em runtime; ela não lê o disco nem o ambiente privado do consumidor. Não colocar `import.meta.env.ICON_SERVER` dentro da biblioteca para tentar contornar isso.

### Regras observáveis de resolução

| Entrada ou situação | Resultado esperado |
|---|---|
| Sem servidor, string vazia ou apenas espaços | GET/POST em `https://engeapp.com.br/api/icons`. |
| `https://icones.exemplo.com` | GET/POST em `https://icones.exemplo.com/api/icons`. |
| Espaços externos ou barras finais | Removidos, sem barras duplicadas na junção. |
| `https://icones.exemplo.com/prefixo` | Endpoint `https://icones.exemplo.com/prefixo/api/icons`. |
| Valor já terminado em `/api/icons` | Não duplicar o sufixo; aceitar barras finais. |
| Relativo, sem protocolo, protocolo diferente de HTTP/HTTPS, credenciais, query ou fragmento | Tratar como configuração inválida e usar default, sem lançar erro no boot ou logar o valor bruto. |
| `routeIcons` explicitamente definida | Prevalece apenas no GET, sem reescrever o POST. |
| `routeIconsSync` explicitamente definida | Prevalece apenas no POST. |
| Uma dessas rotas recebe `undefined` | Remove seu override anterior e resolve novamente pelo servidor/default; não alterar semântica de outros campos. |
| `configureMaxApp()` ou alteração de rota de login | Não apaga o servidor nem overrides de ícones. |
| `resetMaxAppConfig()` | Limpa servidor e overrides; restaura defaults legados. |
| Alteração de `iconServer` antes do uso das stores | Recalcula somente destinos derivados; preserva rotas explícitas acumuladas. |

Valor inválido não garante ausência de tráfego ao Engeapp: o comportamento proposto é cair no padrão. Esse efeito deve constar na documentação. URLs completas alternativas, como `/v1/icons`, devem continuar usando as rotas explícitas existentes, não ser adivinhadas como endpoint por `ICON_SERVER`.

Preservar: fallback e override Iconify; payload GET `icons[]`; resposta mapa nome→SVG; POST `{ icons }`, com `icon`/`svg` também na raiz quando houver um item; sanitização; retries; batching; controle de requisições em voo; descarte e cache. Não modificar o transporte só para trocar o host.

### Bibliotecas e limites arquiteturais

Usar o próprio MaxComponentsUi, MaxPinia já integrado no consumidor e helpers MaxUse existentes. Não introduzir componentes de terceiros, stores paralelas, Axios direto em componente ou um novo cache. A store de ícones inspecionada usa Pinia e cache/transporte especializados, sem `options.get` MaxPinia; convertê-la seria outro escopo. Não alterar seu mecanismo nem a instalação MaxPinia das aplicações.

Alternativas descartadas: embutir o servidor no build npm contraria a escolha por aplicação; apenas documentar `VITE_ICON_SERVER` troca o nome solicitado; expor todo `.env` vaza segredos; plugin Vite/global de janela novo amplia a API sem necessidade; configurar manualmente as duas rotas em todo consumidor duplica a normalização que pode ficar centralizada.

## 4. Arquivos previstos

### Existentes a alterar na futura execução

- `src/helpers/maxAppConfig.ts`: normalização, configuração explícita versus efetiva e defaults dos ícones.
- `src/types/app.ts`: campo proposto e documentação de prioridade/defaults.
- `src/types/app.d.ts`: manter o contrato rastreado compatível, após confirmar sua manutenção; a fonte canônica é `.ts` e os tipos distribuídos são gerados em `dist`.
- `tests/helpers/maxAppConfig.test.ts`: casos de resolução, merge e reset.
- `tests/stores/useIcon.Store.test.ts`: asserções de destinos GET/POST e preservação dos contratos existentes.
- `tests/components/MaxApp.test.ts`: servidor e rotas explícitas sobrevivem ao setup.
- `docs/STORES.md`: configuração e descrição correta do cache na seção da store de ícones.
- `README.md`: ligação curta para a configuração por ambiente, sem refatoração geral de conteúdo antigo.

### Novo arquivo proposto

- `tests/architecture/icon-server-consumer.test.ts`: regressão contra o pacote compilado e passagem de configuração por consumidores isolados.

`MaxIcon.vue`, `MaxApp.vue`, `useIcon.Store.ts`, `src/index.ts`, `vite.config.ts`, manifests, lockfiles e demais stores são referências de preservação, não alvos previstos de edição. Não modificar `.d.ts.map` por aproximação nem regenerar declarações de todo `src`. Se a manutenção da declaração exigir arquivos adicionais, estabelecer causalidade e revisar o escopo antes.

Os arquivos Vite, boot e declaração de ambiente de aplicações externas não pertencem a esta worktree e não tiveram nomes/caminhos confirmados. Entregar exemplos na documentação; aplicar nesses consumidores somente mediante autorização específica e acesso ao repositório correto.

## 5. Etapas executáveis

### T1 — Preflight por leitura

Dependência: autorização de Execute. Escrita de implementação: nenhuma nesta etapa.

1. Ler este plano e a spec na primeira admissão; conferir `AGENTS.md`, branch/diretório e alterações locais. Identificar trabalho já feito antes de editar.
2. Conferir scripts/prehooks atuais de `package.json`, configuração Vite/Vitest/TypeScript e resolução efetiva das dependências/symlinks, incluindo identidade única de Vue, Pinia e, se acionado pelo harness, Axios. Não confundir módulos do `src` e do `dist`.
3. Confirmar a origem e manutenção de `src/types/app.d.ts`, sem execução de emissor geral ou modificação de mapas. A inclusão do campo deve chegar aos tipos finais distribuídos.
4. Conferir por leitura que os testes previstos usam fetch simulado e IndexedDB isolado; não dependem de banco, cache, fila ou storage de uma aplicação real.
5. Verificar os gates de integridade antes de qualquer validação de consumidor externo. Gate falhado bloqueia essa validação; não usar bypass, comando direto equivalente, `ignoreConfig` ou remoção de prehook.

Conclusão: dependências e limites de escrita conhecidos. Falta de dependências exige decisão operacional antes de instalar; não instalar automaticamente nem copiar `.env`. Testes compartilhados, migrações e resets não são necessários nem autorizados.

### T2 — Contrato e resolução

Dependência: T1. Arquivos: helper, tipos e `tests/helpers/maxAppConfig.test.ts`.

1. Acrescentar a opção `iconServer` e documentar seu uso no boot.
2. Implementar normalização com `URL` nativa e resolução conforme a tabela, restritas a destinos de ícones. É lógica específica de configuração; conservar helpers MaxUse já existentes para funções gerais.
3. Manter opções explícitas acumuladas separadas dos defaults efetivos; suportar merge, limpeza de override e reset sem mudar as demais opções.
4. Escrever toda a matriz unitária da configuração, incluindo ordens distintas de chamada, override em um destino e troca de servidor antes do uso.

Conclusão por leitura: não existe leitura de `.env` no pacote/browser, alteração dos demais defaults ou queda acidental do POST no Engeapp com servidor válido e sem override.

### T3 — Regressões de ícones, shell e distribuição

Dependência: T2 para contratos. Arquivos: testes de store/MaxApp e novo teste arquitetural.

1. Com fetch simulado, verificar GET no host configurado, parâmetros em lote e renderização do SVG; verificar ausência de GET/POST legado nesse cenário.
2. Simular resposta principal incompleta e falha principal; recuperar via Iconify e verificar POST no mesmo servidor configurado, preservando payload de um e vários ícones, sanitização e consolidação.
3. Cobrir defaults sem variável, prioridade independente das duas rotas, cache sem nova rede e preservação no setup do MaxApp. Reaproveitar as regressões já existentes de retries/dispose; não removê-las para facilitar aprovação.
4. No teste arquitetural, usar `loadEnv` do Vite e fixtures temporárias próprias, exclusivamente dentro da worktree, para ler `ICON_SERVER` de dois consumidores fictícios e um sem variável. Usar sentinela não secreta em outra variável para provar que ela não entra no objeto público serializado.
5. Importar a configuração e a store do mesmo pacote compilado/mesma instância de módulos. Aplicar o valor de cada consumidor no boot, observar os endpoints e resetar entre contextos. O mesmo `dist` deve atender aos três cenários. O teste depende do build agregado de `npm test`, não pode usar artefatos antigos.
6. Restaurar config, fetch, timers, scopes e IndexedDB entre casos. Apagar somente fixtures temporárias criadas pelo próprio teste, sem remover diretórios compartilhados.

Limite: essa regressão comprova leitura seletiva e passagem de configuração ao pacote, não o CORS/serviço real nem toda configuração Vite de um consumidor externo. O aceite manual abaixo continua necessário.

### T4 — Guia de integração do consumidor

Dependência: T2. Arquivos: documentação. Pode ser redigida em paralelo a T3, com responsável e arquivos distintos, se uma futura sessão tiver autorização de delegação.

1. Documentar `ICON_SERVER=https://icones.exemplo.com` no `.env` do consumidor; protocolo obrigatório, formatos aceitos, fallback para inválido e prioridade de rotas explícitas.
2. Mostrar complemento, não substituição integral, da configuração Vite existente: `loadEnv(mode, diretorioDoEnv, 'ICON_SERVER')`; selecionar exclusivamente `env.ICON_SERVER`; acrescentar somente `'import.meta.env.ICON_SERVER': JSON.stringify(env.ICON_SERVER ?? '')` ao `define` existente. Preservar plugins, aliases e outras definições. Confirmar `envDir`/root do consumidor em vez de assumir seu caminho.
3. Mostrar `configureMaxApp({ iconServer: import.meta.env.ICON_SERVER })` no boot e declaração `ImportMetaEnv` com `readonly ICON_SERVER?: string` no arquivo de ambiente já adotado pelo consumidor. Manter a integração MaxPinia e os helpers MaxUse existentes; não fornecer bootstrap novo que os omita.
4. Explicar que alterações de `.env` pedem reinício do dev server/rebuild do frontend consumidor; não recompilam nem republicam a biblioteca.
5. Explicar cache existente, GET/POST esperados, fallback Iconify e requisitos CORS/HTTPS. Corrigir apenas a descrição de cache de ícones, não o README inteiro.

Conclusão: outro integrador consegue ligar o `.env` ao pacote sem acesso a esta conversa e sem expor outras variáveis.

### T5 — Revisão e validação do lote

Dependência: T2–T4 integralmente implementadas, inclusive testes. Ninguém deve continuar editando os arquivos durante os gates.

1. Revisar diff por contratos, prioridade de rotas, segurança da exposição de ambiente e preservação de cache/fluxo HTTP. Fazer revisão independente neste marco, se houver executor autorizado disponível; caso contrário registrar essa limitação e executar revisão estruturada.
2. Executar os comandos de validação da seção 6, somente após terminar todo o lote. Não executar testes/tipos/builds entre microedições.
3. Diagnosticar falhas agrupadas de harness/bootstrap antes de repetir comandos equivalentes; corrigir causalmente em lote e revalidar a revisão alterada. Não ampliar o escopo para corrigir baseline sem evidência e autorização.
4. Submeter o diff bruto à verificação final de requisitos prevista nas diretrizes do projeto e confrontar cada linha da matriz de aceite.

### T6 — Aceite de consumidor e handoff

Dependência: T5. Não inclui escrita em outros repositórios ou requisições externas sem autorização específica.

1. Em consumidor e ambiente isolados/autorizados, confirmar a integração Vite/boot documentada e usar o mesmo pacote com servidor padrão e customizado.
2. Em perfil de navegador exclusivo para teste ou com nome de ícone não cacheado, observar GET, SVG renderizado, fallback e sincronização. Não limpar armazenamento de usuário para forçar rede.
3. Não enviar POST real sem autorização do proprietário do servidor. Conferir suporte ao payload em lote, CORS/preflight, HTTPS e ausência de credenciais privadas na URL.
4. Sem consumidor, URL ou autorização, marcar `manualPending` com próxima ação concreta. Não afirmar integração externa validada com base em dublês.
5. Entregar arquivos, revisão, comandos/resultados reais, pendências e limites. Manter trabalho na worktree para o painel/usuário; não integrar Git nem publicar.

## 6. Matriz de aceite e comandos futuros

| Tarefa/requisito | Evidência esperada | Testes pertinentes | Revisão pelo risco / manual |
|---|---|---|---|
| T1: isolamento e integridade | Scripts, resolução de libs e alterações locais conferidos | Sem testes nesta etapa | Bloquear consumidor com gate de integridade falhado. |
| T2: defaults e normalização | Tabela de resolução coberta | `tests/helpers/maxAppConfig.test.ts` | URL inválida não lança erro; revisar credenciais/query/protocolos. |
| T2: merge e prioridade | Overrides independentes em ordens distintas | Mesmo arquivo | Não alterar defaults de login, menus, Maps e demais campos. |
| T3: GET/POST customizados | URLs, parâmetros e corpos observados por mock | `tests/stores/useIcon.Store.test.ts` | POST sem envio acidental ao legado; validar fallback de erro e ausência. |
| T3: compatibilidade e cache | Fluxos anteriores permanecem cobertos | Suítes existentes da store e `MaxIcon.test.ts` | Sem cache novo, invalidação automática ou regressão XSS. |
| T3: setup do shell | Servidor do boot permanece após montagem | `tests/components/MaxApp.test.ts` | Não migrar ou duplicar MaxPinia/Pinia. |
| T3: pacote reutilizável | Mesmo build aceita dois servidores e default | Novo `tests/architecture/icon-server-consumer.test.ts` | Sem capturar `.env` na compilação da biblioteca; secret sentinel não exposta. |
| T4: integração documentada | `.env` → exposição seletiva → boot explicados | Revisão do guia e regressão de consumidor | Não prometer suporte automático sem ligação inicial. |
| T5: lote validado | Saídas reais vinculadas à revisão | Comandos abaixo | Checks atuais sem falha; nada inferido só pelo término da ferramenta. |
| T6: operação real | Rede e UI observadas no consumidor autorizado | Aceite manual, não substituível por mocks | Sem autorização/ambiente: `manualPending`, não conclusão integral. |

### Gate de desenvolvimento desta mudança

Na raiz da worktree, após terminar código e testes:

```bash
npm run type-check:test
npm run lint:check
npm test
```

`npm test` já faz `npm run build` (`vue-tsc` e Vite) e a suíte completa unitária/arquitetural. Não adicionar build, type-check de produção ou `test:built` redundantes na mesma revisão. `npm run type-check` existe, mas fica como ferramenta de diagnóstico, não passo duplicado do roteiro normal.

### Gate de pré-release

Se houver posterior escopo de pré-release, usar **em substituição aos gates parciais contidos nele**:

```bash
npm run verify
```

Ele inclui navegador, cobertura, benchmarks, consumidores, integridade e segurança. Não alegar aprovação pré-release com validação parcial. Antes de executá-lo, conferir os scripts: `verify:consumers` cria fixtures e instala dependências, portanto sua execução exige autorização operacional e diretório temporário próprio dentro da worktree, configurável por `CONSUMER_TEMP_DIR` conforme o script existente. Não usar filtros/skip para simular gate integral. Não executar `release`.

Nenhum desses comandos foi executado em Plan. Resultados de uma revisão não valem para arquivos alterados posteriormente; reaproveitar os que continuarem factualmente válidos. Tarefas assíncronas devem aguardar conclusão/mudança com limite e recuo, sem consultas repetidas sem nova informação; cancelamento conserva progresso parcial e pendência.

## 7. Riscos, operação e recuperação

- **Exposição do ambiente:** `ICON_SERVER` é configuração pública. Whitelist de uma chave; nunca serializar todo `.env` nem publicar credenciais, tokens ou cookies.
- **Env do app versus pacote:** testar somente fontes/playground pode mascarar substituição no build. Validar `dist` fresco e manter o teste arquitetural.
- **Destinos diferentes:** os defaults atuais de GET/POST são independentes. Não mudar esse contrato implicitamente; ambos só acompanham `iconServer` quando não há override de seu próprio destino.
- **CORS/backend:** outro site precisa implementar o contrato atual, inclusive POST em lote e eventual OPTIONS. Falha no POST continua não fatal para UI; não é confirmação de sincronização bem-sucedida.
- **Cache:** ícones existentes podem impedir nova rede ou manter SVG antigo. Não migrar/particionar/limpar automaticamente; usar ambiente de teste isolado. Ícones personalizados por servidor com o mesmo nome exigiriam outro escopo.
- **Concorrência e SSR:** configuração é singleton global existente. Não oferecer troca a quente, cancelamento por mudança de host ou isolamento por requisição SSR nesta entrega.
- **Recuperação:** remover a opção no boot ou remover a variável e reconstruir o consumidor restaura defaults; rotas explícitas continuam prevalecendo. Nenhuma migração ou limpeza de dados é necessária. Reverter somente alterações desta tarefa mediante autorização, sem descartar trabalho alheio.
- **Limites de acesso:** nenhum consumidor externo ou servidor customizado foi inspecionado. Não há garantia de disponibilidade, autenticação, CORS ou integração real até T6.

## 8. Progresso e retomada — somente em Execute

Na primeira admissão, ler plano/spec e comparar o disco com as tarefas antes de editar. Nas retomadas, consultar apenas trechos pertinentes e mudanças novas. Executar lacunas, preservar decisões/dependências e não reabrir escolhas sem evidência nova ou mudança de requisito.

Durante Execute, registrar marcos e handoff em `docs/plans/wt-37afb347/execution-state.json`, **não criar este arquivo em Plan**. Vincular o registro ao SHA256 real dos bytes de `plan.md` e às revisões factuais dos arquivos de cada tarefa. Não usar rótulos ou hashes fictícios. Excluir do cálculo da revisão factual os próprios registros de estado e saídas geradas para evitar autorreferência; definir ordem determinística dos caminhos e bytes incluídos.

Contrato estrito de novos registros, sem chaves adicionais:

| Nível | Chaves permitidas |
|---|---|
| Raiz | `version: 2`, `planRevision`, `tasks`, `verification`, `updatedAt?`, `nextAction?` |
| Tarefa | `id`, `status`, `files`, `validations`, `revision?`, `nextAction?` |
| `verification` | `revision`, `checks` |
| Check em `verification.checks` | `command`, `revision`, `result`, `exitCode?` |

- `tasks` deve identificar T1–T6, arquivos envolvidos e estado real. `validations: []` é sempre obrigatório; para este plano centralizar os registros de comandos em `verification.checks`, sem inventar estruturas adicionais dentro de `validations`.
- Status de tarefa: somente `pending`, `running`, `completed`, `blocked`, `manualPending` ou `validationFailed`.
- Resultados de validação/check: somente `passed`, `failed` ou `pending`; `blocked` nunca é resultado de check.
- `passed` exige `exitCode: 0`; `failed` exige inteiro diferente de zero; `pending` não aceita `exitCode`. Nunca usar `exitCode: null` ou inferir aprovação/exit code de `tool:end.ok`.
- `command` tem até 4.096 caracteres; `nextAction`, até 512. Motivos e próximo passo concreto cabem em `nextAction`; não criar `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp`.
- `updatedAt`, se presente, é inteiro positivo em milissegundos, nunca data ISO. Não usar `schemaVersion`, `worktree`, `branch`, `head`, `planPath`, `status` ou `checks` soltos na raiz; tarefa não admite `title` ou `evidence`.
- `planRevision`, `revision` da tarefa, `verification.revision` e revisões dos checks são SHA256 reais do respectivo conteúdo. Manter os comandos realmente executados e todas as falhas, inclusive da suíte completa, associados à revisão de sua execução.
- Checks vazios, falta de resultado vigente ou falha vigente impedem validação integral. Aceite manual pendente também impede declarar conclusão total. Repetir a mesma falha sem progresso exige diagnóstico antes de nova execução.
- Registros versão 1 continuam legíveis, mas não comprovam validação integral automaticamente. Registro autodeclarado não comprova execução nativa nem identifica verificações omitidas; conservar evidência real das ferramentas.

Delegação futura, se autorizada: contexto mínimo com IDs de tarefas e referências a estes documentos; T2 precede T3/T4. Paralelo somente em arquivos distintos e com responsável definido para testes compartilhados. Revisões nos marcos de risco e entrega, não a cada microedição.

## 9. Checklist de revisão deste plano

- [x] Pedido misto respondido: o Engeapp é default, mas há cache, overrides e fallback.
- [x] Origem do `.env` esclarecida com o usuário.
- [x] Viabilidade do pacote pré-compilado confrontada com documentação oficial; integração inicial explicitada.
- [x] Escopo, alternativas, contratos, tarefas dependentes e arquivos existentes/novos discriminados.
- [x] Preservação de componentes, MaxPinia/MaxUse, cache e transporte delimitada sem migração lateral.
- [x] Aceite automatizado separado de operação externa; pendências manuais não viram aprovação.
- [x] Validação em lote e estado de execução estrito descritos, sem executá-los nesta sessão.
- [x] Nenhuma autorização de implementação, publicação, operação externa ou alteração de outro repositório presumida.
