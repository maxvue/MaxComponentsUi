# Especificação técnica — recuperação isolada do build

Data: 2026-10-05. Projeto: `@maxvue/max-components-ui` (manifesto `1.1.2`). Worktree/branch: `wt-e84f0bff`.

## 1. Contexto & Objetivo

O build informado pelo usuário, executado na pasta principal, falhou com `ERR_PACKAGE_PATH_NOT_EXPORTED` para `entities/decode`, em Node `24.18.0`. O objetivo confirmado é recuperar e comprovar o build **somente na worktree ativa**, preservando código e versões declaradas. Não implica reparar a instalação principal.

Raiz verificada por `pwd` e `git rev-parse --show-toplevel`:
`/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-e84f0bff`.

### Evidências e diagnóstico

- Estado Git inicial limpo, branch `wt-e84f0bff`.
- `node_modules` local é link simbólico para `/home/johnattas/GitHub/MaxComponentsUi/node_modules`.
- Compilador instalado `@vue/compiler-core@3.5.42` declara `entities: ^7.0.1` e seu `dist/compiler-core.cjs.js` contém `require('entities/decode')`.
- A resolução a partir desse arquivo falhou com `ERR_PACKAGE_PATH_NOT_EXPORTED`. O pacote raiz instalado é `entities@4.5.0`, cujo mapa `exports` não contém `./decode`.
- `package-lock.json` (formato 3) registra `entities@7.0.1` na raiz e versões aninhadas `4.5.0` e `8.1.0` para outros consumidores. Essa coexistência é legítima; não deve ser eliminada por override global.
- `vue` instalado é `3.6.0-rc.9`, enquanto manifesto e lockfile preveem `3.6.0-rc.10`. A divergência reforça a inconsistência da instalação compartilhada.
- `package.json:559`: `build = vue-tsc && vite build`. A fase exata do build original não foi instrumentada; a falha de resolução é demonstrada independentemente dele.
- `.nvmrc`: `24.18.0`, igual ao Node observado; npm observado `12.0.1`, embora `packageManager` declare `npm@10.8.2` e `engines.npm` aceite `>=10.0.0`.

**Conclusão fundamentada:** existe incompatibilidade verificável entre o compilador e a dependência efetivamente resolvida. **Hipótese a validar:** a instalação limpa a partir do lockfile atual elimina esse erro e permite o build. Não há prova de que o lockfile inteiro seja instalável, nem de ausência de outros erros de tipos/build.

## 2. Escopo

### Incluído

- Revalidar contexto, trabalho anterior, resolução e limites antes de executar.
- Em futura execução autorizada, substituir apenas o link local por uma instalação própria com `npm ci`, usando o lockfile existente.
- Verificar resolução compatível dentro da worktree, integridade do manifesto/lockfile, árvore, build e testes existentes.
- Registrar progresso e bloqueios por revisão, sem publicar ou integrar mudanças.

### Fora de escopo

- Implementação nesta sessão de planejamento; instalações, testes e build não foram executados.
- Reparar ou escrever na pasta principal, investigar outras worktrees, trocar branch, criar/remover worktree, commit, merge, push, release ou deploy.
- Novos testes/scripts preventivos, alterações de componentes, APIs, CSS, configurações, workflow ou tarefa do VS Code.
- Atualização/downgrade de Vue, Node ou npm; edição/regeneração de `package-lock.json`; adição de `entities` como dependência direta; overrides globais; `--force` ou `--legacy-peer-deps`.
- Validação completa de release como requisito desta recuperação operacional.

## 3. Arquitetura & Mudanças Técnicas

```text
Atual: worktree/node_modules (link) → raiz/node_modules
       compiler-core → entities@4.5.0 → ./decode indisponível

Desejado: worktree/node_modules (diretório próprio) ← lockfile + npm ci
          compiler-core → entities compatível → ./decode resolvido localmente
          vue-tsc → vite build → dist local
```

| Caminho | Situação | Tratamento futuro |
|---|---|---|
| `node_modules` | Existente, link não versionado | Desvincular somente a entrada local; instalar diretório próprio. |
| `package.json`, `package-lock.json` | Existentes | Somente leitura; conferir SHA256 antes/depois. |
| `.nvmrc`, `.gitignore`, `AGENTS.md` | Existentes | Preservar; dependências/build e worktrees já ignorados. |
| `vite.config.ts`, `tsconfig.json` | Existentes | Preservar; build escreve `dist` e copia temas. |
| `scripts/check-lockfile.mjs`, `tests/architecture/lockfileValidation.test.ts` | Existentes | Reutilizar verificação estrutural; não comprovam instalação física consistente. |
| `dist/`, caches e temporários locais | Gerados | Permitidos apenas na execução futura, dentro da worktree e sem sobrescrever trabalho desconhecido. |
| `docs/plans/wt-e84f0bff/execution-state.json` | Novo proposto | Somente em Execute, após autorização; proibido nesta sessão Plan. |

Sem novos contratos públicos, endpoints, esquemas, migrações ou lógica de negócio. Classes legadas, independência de PrimeVue e dependência npm de `@maxvue/max-use` permanecem intactas.

### Segurança da instalação

Não executar `npm ci` enquanto `node_modules` for link para fora da worktree. A documentação npm informa limpeza automática de dependências existentes; é necessário remover exclusivamente a entrada simbólica usando operação que não siga o destino. Se a entrada já for diretório próprio, não apagar: conferir trabalho prévio primeiro.

O lockfile marca scripts de instalação em `@parcel/watcher@2.6.0` e `fsevents@2.3.3`; os corpos e efeitos completos não foram auditados. Antes de instalar, revisar políticas/scripts aplicáveis e permissões de rede. npm 12 possui política própria de scripts; não flexibilizar globalmente nem modificar configuração para contornar bloqueio sem decisão específica. Cache e temporários da execução devem ficar dentro da worktree. Não expor configurações de autenticação nos registros.

## 4. Plano de Execução Faseado

1. **Admissão:** ler `plan.md`, instruções aplicáveis e estado existente; validar raiz/branch/alterações, versões reais e SHA256 de manifesto/lockfile. Reconfirmar o link e diagnóstico por resolução, sem executar build na instalação compartilhada.
2. **Isolamento:** registrar destino do link; revisar o risco de remoção; desvincular apenas `node_modules` local. Interromper se tipo/destino diferirem ou houver trabalho pendente desconhecido.
3. **Instalação congelada:** executar `npm ci` com ferramentas disponíveis e dependências de desenvolvimento, cache/temporários locais, após autorização de Execute e revisão de scripts. Falha de rede, integridade, peer ou política exige diagnóstico; não regenerar lockfile.
4. **Validação do contrato:** confirmar diretório próprio, caminhos reais do compilador e de `entities/decode` dentro da worktree, versões coerentes com lockfile, hashes inalterados e checks de lockfile/árvore.
5. **Fechamento:** rodar `npm run build` diretamente, conferir artefatos, executar suíte unitária existente e registrar resultados, limitações e arquivos produzidos. Não usar tarefas de release nem notificação que afirme commit/push.

Etapas sequenciais: instalação, resolução e build dependem umas das outras. Não há benefício em múltiplos executores escrevendo nesta recuperação.

## 5. Critérios de Aceite & Validação

- `node_modules` não é link para a raiz; dependências críticas resolvem caminhos reais dentro da worktree.
- `entities/decode` resolve a partir do compilador instalado; sua versão satisfaz o requisito desse consumidor. Não exigir versão única de `entities` na árvore.
- `npm run check:lockfile` e `npm run check:npm-tree` concluem sem falhas.
- Manifesto e lockfile mantêm seus SHA256; fontes/configurações não sofrem alterações.
- `npm run build` termina com código zero; artefatos públicos em `dist` existem e estão atualizados. Conferir `index.es.js`, `index.d.ts`, `stores.es.js`, `preset.es.js`, `resolver.es.js`, `styles.es.js`, `style.css` e `themes/all.scss` conforme exports/configuração.
- `npm run test` conclui sem falhas. Build já executa `vue-tsc`: não repetir `type-check` sobre a mesma revisão sem necessidade concreta.
- Relatório final não afirma correção da raiz nem validação de release. Qualquer falha restante é bloqueio com próxima ação concreta.

Comandos acima foram identificados no projeto, **não executados nesta sessão**. `npm run verify` é o gate completo de pré-release; somente com necessidade/autorização adicional. Não repetir suas etapas isoladas sobre o mesmo conteúdo se optar pelo gate agregado.

### Referências e limitações

- `.github/workflows/quality.yml:22-26` usa `npm ci` e `npm run verify`.
- Documentação oficial consultada: <https://docs.npmjs.com/cli/v12/commands/npm-ci> e documentação de `/npm/cli` via Context7. Confirma instalação congelada, falha em divergência manifesto/lockfile e limpeza de `node_modules`. A página v12 servia `12.2.0`, não exatamente `12.0.1`; políticas/flags específicas devem ser verificadas na ferramenta real antes de uso.
- Não houve instalação limpa, consulta de disponibilidade de todos os tarballs, execução de gates, auditoria de vulnerabilidades ou inspeção de segredos. A leitura direcionada não garante ausência de problemas fora do escopo.
