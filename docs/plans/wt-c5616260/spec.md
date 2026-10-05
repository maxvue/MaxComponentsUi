# Especificação técnica — recuperação isolada do build

## 1. Contexto & Objetivo

- Data: 2026-10-05.
- Projeto: `@maxvue/max-components-ui`, versão declarada `1.1.2`.
- Worktree ativa: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-c5616260`.
- Branch: `wt-c5616260`; revisão investigada: `67a658dd35dc2af3dd92f0ebb060d43122f5faba`.
- Estado inicial: `git status --short` sem alterações.

O usuário relatou falha ao acionar o build pela interface. O log fornecido mostra a tarefa `npm run build` iniciada na pasta principal `MaxComponentsUi`, encerrada com `ERR_PACKAGE_PATH_NOT_EXPORTED` para `entities/decode`, em Node `24.18.0`.

Objetivo: recuperar e comprovar o build **nesta worktree**, instalando dependências isoladas a partir do lockfile existente, sem modificar código ou atualizar dependências desnecessariamente. Usuários afetados: mantenedores que compilam a biblioteca e, indiretamente, consumidores que dependem dos artefatos distribuídos.

### Evidências e grau de certeza

1. `package.json:559`: build = `vue-tsc && vite build`. O log é compatível com falha na inicialização da primeira etapa, não com defeito comprovado em componentes.
2. `node_modules` é um link simbólico para `/home/johnattas/GitHub/MaxComponentsUi/node_modules`. Isto explica a resolução fora da worktree; a instalação compartilhada foi apenas lida.
3. `node_modules/@vue/compiler-core/package.json`: versão `3.5.42`, dependência `entities: ^7.0.1`.
4. `node_modules/@vue/compiler-core/dist/compiler-core.cjs.js:11`: `require('entities/decode')`.
5. `node_modules/entities/package.json`: versão instalada `4.5.0`, sem exportação `./decode`; exporta `./lib/decode.js`.
6. Uma sondagem somente de resolução, com `createRequire` ancorado no compilador, encontrou essa cópia e reproduziu `ERR_PACKAGE_PATH_NOT_EXPORTED`, sem carregar o compilador nem executar build.
7. `package-lock.json:4889`: cópia raiz de `entities` = `7.0.1`. Existem cópias aninhadas `4.5.0` para outros consumidores e `8.1.0` para `parse5`; não são, por si, erros.
8. `vue-tsc@3.3.11` depende de `@vue/language-core@3.3.11`; este usa `@vue/compiler-dom`, que leva ao compilador. O fluxo foi inspecionado estaticamente; o log original não contém os frames do importador.

**Conclusão confirmada:** há incompatibilidade entre o compilador instalado e a dependência que ele resolve, além de divergência entre instalação compartilhada e lockfile da worktree.

**Ainda não comprovado:** por que a instalação ficou divergente, se o lockfile é integralmente instalável, se o build completo passará após a recuperação e qual diretório a interface usará em uma execução futura. Não atribuir automaticamente a falha ao Node, ao Vue RC ou ao npm.

## 2. Escopo

### Incluído

- Revalidar contexto, mudanças locais e resolução efetiva das dependências.
- Na futura execução aprovada, remover somente o link `node_modules` desta worktree, preservando seu destino, e instalar dependências próprias com `npm ci`.
- Preservar `package.json`, `package-lock.json`, overrides, APIs, componentes, classes legadas e configuração de build.
- Confirmar resolução de `entities/decode`, checagem de tipos, build, artefatos públicos e testes existentes.
- Registrar progresso e limites do resultado na fase Execute.

### Fora de escopo

- Implementação nesta sessão de planejamento; instalações e testes não foram executados.
- Recuperação do `node_modules` principal ou qualquer alteração fora da worktree.
- Corrigir a configuração do botão, texto da tarefa, notificações ou áudio do editor.
- Novos scripts preventivos, novos testes, atualizações de versões, regeneração automática do lockfile, downgrade do Vue/Node e overrides globais de `entities`.
- Commit, merge, push, release, publicação, nova worktree ou troca de branch.

Decisões confirmadas na entrevista: **isolar a worktree** e **somente recuperação**, sem prevenção por alteração de código. Instalação limpa que falhar por conflito do lockfile é bloqueio para novo diagnóstico e aprovação, não autorização para ampliar o escopo.

## 3. Arquitetura & Mudanças Técnicas

### Fluxo atual

```text
worktree/node_modules (link) → raiz/node_modules
vue-tsc → language-core → compiler-dom → compiler-core@3.5.42
→ entities@4.5.0 → require('entities/decode') → erro
```

### Fluxo esperado

```text
worktree/node_modules (diretório próprio) ← npm ci com lockfile atual
vue-tsc → compilador → entities compatível com o consumidor
→ entities/decode resolvido dentro da worktree
→ checagem de tipos → Vite → dist/ e temas → testes
```

### Destinos afetados na execução futura

| Destino | Estado / mudança |
| --- | --- |
| `node_modules` | Existente como link; substituir apenas a entrada local por diretório de instalação isolada. |
| `dist/`, `*.tsbuildinfo` | Saídas geradas; nenhuma edição manual. |
| `package.json`, `package-lock.json` | Existentes; manter conteúdo e hash. |
| `src/`, `tests/`, `vite.config.ts`, `tsconfig.json` | Existentes; leitura e validação, sem alterações previstas. |
| `docs/plans/wt-c5616260/execution-state.json` | Novo registro proposto, somente durante Execute; não criado nesta sessão. |
| `.cache/` e `.execution-tmp/` locais | Diretórios operacionais futuros, se necessários para manter cache e temporários dentro da worktree; não criados agora. |

Não há novo contrato público, esquema de dados, endpoint ou migração. A coexistência de versões transitivas é permitida quando cada consumidor resolve uma versão compatível; não forçar todos a usar `entities@7`.

## 4. Plano de Execução Faseado

1. **Admissão e segurança:** ler o plano, obter aprovação de execução, conferir raiz/branch/status, hashes do manifesto/lock e tipo/destino do link. Interromper se houver divergência ou trabalho desconhecido.
2. **Isolamento:** remover somente o link local, sem seguir seu destino. Confirmar ausência da entrada e manter a instalação principal intocada. Se `node_modules` já for diretório próprio, investigar trabalho anterior em vez de apagar.
3. **Instalação congelada:** usar `npm ci` com ferramentas existentes e registrar Node/npm reais. Não instalar outro npm nesta tarefa. Avaliar previamente scripts de instalação e permissões de rede; direcionar cache e temporários à worktree. Falha sem progresso exige diagnóstico, não repetição cega.
4. **Validação focada:** verificar caminho real de `node_modules`, dependência resolvida desde o compilador, exportação `entities/decode`, árvore e preservação dos hashes. Executar os checks de lockfile e árvore.
5. **Entrega e fechamento:** executar `npm run build` (inclui checagem por `vue-tsc`) e a suíte unitária ampla, que inclui os testes de arquitetura, depois do build fresco. Revisar artefatos, estado Git e limites do resultado; registrar handoff para eventual ação separada do MaxCode na raiz/interface. Não repetir tipos/testes sobre a mesma revisão sem falha, mudança ou dúvida concreta.

As fases são sequenciais. Não é necessário delegar; uma revisão independente deve conferir o isolamento e a entrega, quando houver revisor disponível.

## 5. Critérios de Aceite & Validação

| Requisito | Aceite observável |
| --- | --- |
| Isolamento | `node_modules` não é link e seus caminhos reais, inclusive compilador e `entities/decode`, estão dentro da worktree. |
| Compatibilidade | A resolução de `entities/decode` ancorada em cada compilador relevante passa; versão atende ao requisito do seu consumidor. |
| Instalação reproduzível | `npm ci` termina com código 0 sem alterar manifesto/lock e sem `--force` ou `--legacy-peer-deps`. |
| Tipos e build | `npm run build` termina com código 0 nas etapas `vue-tsc` e Vite, sem o erro reportado; `type-check` isolado fica reservado a diagnóstico quando necessário. |
| Contratos preservados | Testes existentes de lockfile e exports passam após build fresco; `dist/index.es.js`, declarações, estilos, entrypoints e temas existem conforme os contratos atuais. |
| Regressão | `npm run test` passa; falhas preexistentes ou ambientais são diagnosticadas e não ocultadas. |
| Segurança operacional | Nada fora da worktree é modificado; nenhuma operação Git de publicação é executada. |

Comandos confirmados no projeto: `npm ci` em `.github/workflows/quality.yml:23`; `npm run check:lockfile`, `npm run check:npm-tree`, `npm run type-check`, `npm run build` e `npm run test` em `package.json`. A suíte ampla inclui os testes existentes de lockfile e exports; seleção isolada só para diagnóstico de falha ou revisão específica, sem repetir automaticamente o mesmo conteúdo.

Fontes oficiais consultadas via Context7: Node 24, documentação de `packages`/`errors` (`https://nodejs.org/docs/latest-v24.x/api/packages.html`, `https://nodejs.org/docs/latest-v24.x/api/errors.html`); npm CLI, documentação de `npm ci` (`https://github.com/npm/cli/blob/latest/docs/lib/content/commands/npm-ci.md`). A referência npm consultada é da versão corrente, não uma garantia de detalhe específico do npm `12.0.1`; revalidar comportamento local antes da instalação. A documentação confirma o bloqueio de subpaths não exportados e a natureza congelada/limpa de `npm ci`, mas não comprova instalabilidade deste lockfile.
