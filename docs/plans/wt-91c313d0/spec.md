# Incremento de versão no botão de build do MaxCode

## 1. Contexto & Objetivo

- Projeto: `@maxvue/max-components-ui` / MaxComponentsUi.
- Data: 15/10/2026.
- Worktree e branch: `wt-91c313d0`.
- Raiz confirmada por `git rev-parse --show-toplevel`: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-91c313d0`.
- Pedido: cada acionamento do botão MaxCode identificado como `NPM RUN BUILD` deve incrementar uma unidade no último número da versão. Exemplo: `1.1.2 → 1.1.3 → 1.1.4`.
- Valor entregue: eliminar o ajuste manual da versão nesse fluxo, sem associar build a publicação ou operações Git.

Estado observado: `package.json:3`, `package-lock.json:3` e `package-lock.json:9` contêm `1.1.2`. A tarefa em `.vscode/tasks.json:5–7` executa o build e avisos locais, sem incrementar a versão. O script `build` é `vue-tsc && vite build` (`package.json:559`).

Este documento especifica uma implementação futura. Nesta sessão foram permitidos somente investigação e documentos; não houve build, testes, instalação ou alteração de configuração.

## 2. Escopo

### Incluído

1. Alterar somente o encadeamento da tarefa `NPM RUN BUILD` para executar `npm version patch --no-git-tag-version --ignore-scripts` antes de `npm run build`.
2. Manter a atualização dos três campos de versão citados a cargo do npm, sem editar versões de dependências.
3. Manter o rótulo de reconhecimento, apresentação, avisos e som existentes; encadear com `&&` para interromper em caso de falha.
4. Adicionar regressões de configuração e de comportamento em fixtures locais e documentar a diferença entre o botão e o build comum.
5. Validar manualmente o botão real na worktree correta, somente em Execute e com ciência do incremento que esse teste produzirá.

### Fora de escopo

- Alterar o script `build`, criar `prebuild` ou incrementar a versão em todo build de terminal/CI.
- Acionar ou modificar `release`, `NPM RUN RELEASE`, publicação npm, commits, tags, merge ou push.
- Corrigir mensagens preexistentes que anunciam commit/push, ou outras divergências documentais registradas nas notificações desta worktree.
- Implementar frontend, componentes Vue, stores, chamadas HTTP ou helpers de aplicação. MaxComponentsUi, MaxPinia e MaxUse não precisam de novos contratos para uma tarefa shell do editor.
- Alterar dependências, regenerar lockfile via instalação, migrar dados ou modificar a extensão instalada do MaxCode.
- Criar outra worktree, trocar de branch, remover a worktree ou desfazer trabalho alheio.

## 3. Arquitetura & Mudanças Técnicas

### Evidências críticas

| Local existente | Evidência e consequência |
|---|---|
| `.vscode/tasks.json:3–22` | Tarefa shell com rótulo `NPM RUN BUILD`; ponto de alteração localizado. |
| `package.json:556–582` | Não há `prebuild`, `preversion`, `version` ou `postversion`. `verify` usa `build`; `release` já possui seu próprio `npm version patch`. Não colocar incremento no build global. |
| `.github/workflows/quality.yml:25–33` | A CI executa `verify` e exige working tree limpa depois. Incremento global quebraria esse contrato. |
| `package-lock.json:1–10` | Lockfile versão 3, com versão tanto no topo como em `packages['']`. |
| `scripts/check-lockfile.mjs` | Gate de integridade de dependências disponível; não verifica igualdade da versão do pacote entre manifest e lockfile. Os testes novos devem verificá-la explicitamente nas fixtures. |
| `vitest.config.ts:23–29`, `tsconfig.test.json:27–30` | A suíte inclui `tests/**/*.{test,spec}.ts` e tipos para testes/scripts. |
| `tests/architecture/lockfileValidation.test.ts` | Precedente para testes com arquivos e fixtures. Adaptar isolamento para manter as escritas dentro desta worktree. |

Foi inspecionado somente por leitura o bundle instalado `~/.vscode/extensions/johnattas.maxcode-1.1.134/dist/extension.js`: o mapa `uS.build` aceita `NPM RUN BUILD`; `Nj` lê `.vscode/tasks.json`; `cS`/`xa` constroem execução shell com diretório de execução. Isso sustenta a solução pelo arquivo do projeto, sem alterar a extensão. Não comprova qual versão está ativa no editor nem qual projeto/diretório estará selecionado no clique real.

### Arquivos da implementação futura

| Arquivo | Situação | Mudança |
|---|---|---|
| `.vscode/tasks.json` | Existente | Prefixar apenas `command` da tarefa de build. |
| `tests/architecture/npmBuildTask.test.ts` | Novo proposto | Contrato estático e integração de incremento/build com fixtures isoladas. |
| `README.md`, seção Desenvolvimento | Existente | Explicar incremento exclusivo pelo botão, arquivos modificados e falhas; preservar outras seções. |
| `package.json` e `package-lock.json` | Existentes; efeitos de execução | Não precisam de alteração para instalar a funcionalidade. Serão modificados por acionamentos futuros ou pelo aceite manual autorizado. Não antecipar `1.1.3` nesta implementação. |

### Contrato da tarefa

Prefixo proposto, preservando integralmente o sufixo atual de notificação e som:

```bash
npm version patch --no-git-tag-version --ignore-scripts && npm run build
```

- `patch` segue SemVer do npm; não há limite artificial em 9 (`1.1.9 → 1.1.10`). O pacote atual usa versão estável; não criar política própria para pré-releases.
- `--no-git-tag-version` evita commit e tag, inclusive com mudanças locais; não usar `--force`.
- `--ignore-scripts` aplica-se somente ao comando `npm version`, evitando execução dos hooks de versionamento. Não propagar a opção ao build nem desativar seus hooks/gates.
- Uma execução iniciada da tarefa corresponde a um incremento. Clique ignorado pelo editor por tarefa já ativa não é uma nova execução. Não introduzir disparos concorrentes, filas ou mecanismo próprio de bloqueio.
- Se o incremento falhar, não executar build nem avisos de sucesso.
- Se o build falhar depois do incremento, manter a versão incrementada e não executar os avisos seguintes. A próxima execução incrementa novamente. Essa é uma proposta explícita coerente com o pedido “sempre que clicar”, e não uma garantia de publicação ou de build bem-sucedido.
- Falhas de `notify-send`/`paplay` continuam tendo o comportamento atual: podem ocorrer depois de build e incremento bem-sucedidos. Não repetir o botão para testar apenas o aviso.
- Não prometer transação: a implementação local do npm escreve o manifest antes do lockfile e pode ignorar erro ao atualizar este último. Escrita parcial, interrupção ou divergência exigem parada e diagnóstico, sem reset automático nem um novo clique para “consertar”.

Fluxo: botão MaxCode → tarefa reconhecida → incremento sem Git/hooks de versão → build existente → notificação existente → som existente. Uma falha interrompe os passos seguintes.

### Limitações do ambiente

- `node_modules` resolve para `/home/johnattas/GitHub/MaxComponentsUi/node_modules`, fora da worktree. Não escrever nessa dependência compartilhada nem instalar para corrigir o ambiente sem autorização.
- O executável npm localizado pertence ao Node `v24.18.0`; seu manifest instalado declara npm `12.0.1`. O projeto declara `packageManager: npm@10.8.2`. Não trocar ferramentas nesta sessão; confirmar versão suportada na execução.
- Documentação oficial consultada: <https://docs.npmjs.com/cli/v10/commands/npm-version/>. A semântica das flags também foi confirmada por leitura de `libnpmversion/lib/version.js` do npm instalado, incluindo atualização dos campos e ausência de Git com a flag desabilitada.
- Uma consulta de metadados que incluía `.npmrc` foi bloqueada pela proteção do ambiente. Seu conteúdo não foi lido; não repetir nem contornar o bloqueio. Configuração efetiva sensível não foi validada.
- Não foram executados testes, gates ou botão real. Nenhuma hipótese de funcionamento externo deve ser apresentada como aceite comprovado.

## 4. Plano de Execução Faseado

1. **Admissão e preflight por leitura:** conferir raiz/branch, mudanças locais, scripts e hooks efetivos, npm e symlinks; confirmar que a tarefa selecionada pertence à worktree. Interromper se exigir escrita na raiz principal ou configuração sensível bloqueada.
2. **Implementação do lote:** alterar o comando, adicionar todos os testes e a nota de README. Preservar script global, release e arquivos alheios.
3. **Validação agrupada:** depois de concluir código e testes, executar gates pertinentes descritos em `plan.md`; corrigir falhas em lote e revalidar somente verificações invalidadas.
4. **Aceite manual e revisão final:** verificar o botão real, revisar diff e registrar evidências/progresso em Execute. Ausência de acesso ao editor permanece `manualPending`. Não publicar ou integrar Git.

## 5. Critérios de Aceite & Validação

1. Duas execuções da ação em fixture levam `1.1.2 → 1.1.3 → 1.1.4`, com igualdade entre manifest e ambos os campos do lockfile; o stub de build observa a versão nova.
2. Nenhuma execução da tarefa cria commit/tag ou aciona hooks de versionamento. As flags são verificadas estruturalmente, os hooks por marcadores em fixture e o estado Git pelo aceite manual.
3. Falha de incremento não inicia build; falha de build mantém incremento sem sucesso posterior; `1.1.9` resulta em `1.1.10`.
4. `npm run build` isolado e o encadeamento `verify` não recebem incremento novo. `release` permanece exatamente como antes e nunca é executado para testar esta mudança.
5. Notificações/som e demais opções da tarefa permanecem iguais ao baseline; a mensagem enganosa preexistente é um achado fora de escopo, não evidência de operações Git.
6. Testes usam subprocessos sem rede ou instalação, fixture e cache npm próprios dentro da worktree, sem executar o build real da biblioteca nem desktop notifications dentro da suíte.
7. Validações futuras identificadas: `npm run check:lockfile`, `npm run test`, `npm run type-check:test`, `npm run lint`, `npm run build`. O último já verifica tipos de produção. `npm run verify` é reservado para gate completo de pré-release, não exigido como rotina desta alteração de tooling e nunca substituído por validação parcial em eventual release.
8. Aceite pelo editor confirma diretório correto, incremento único, build e ausência de operações Git. Sem essa evidência, registrar pendência manual, sem declarar entrega integral.

O plano detalhado contém tarefas, matriz de aceite, diagnóstico, limites de recuperação e instruções de retomada.
