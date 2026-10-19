# Build com incremento de versão e entrega rastreável

## 1. Contexto & Objetivo

- Data: 19/10/2026.
- Projeto: `@maxvue/max-components-ui`.
- Worktree autorizada: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-e842eb84`.
- Branch: `wt-e842eb84`; revisão investigada: `89f2f0a4125c8c035116cfcde34f02d25840c492`.
- Esta especificação é de planejamento. Nenhuma implementação ou validação executável foi realizada.

O usuário relatou bloqueio de deploy do Engeapp depois de acionar **NPM RUN BUILD**. A investigação encontrou uma diferença importante: o botão do editor incrementa a versão antes de compilar, enquanto o comando de terminal `npm run build` apenas compila. O incremento modifica `package.json` e `package-lock.json` sem criar commit. O consumidor recusa bibliotecas com arquivos versionados modificados.

**Decisão confirmada pelo usuário:** manter o aumento da versão em cada acionamento do botão. A alternativa escolhida foi apresentada explicitamente com a consequência de precisar registrar as alterações em commit antes do deploy.

Portanto, a solução não é retirar o incremento, fazer commit automático ou afrouxar a proteção do consumidor. É corrigir a comunicação enganosa do botão, explicar a pendência criada e documentar o procedimento operacional seguro. O bloqueio continua correto enquanto existir qualquer alteração versionada não commitada.

## 2. Escopo

### Incluído

1. Preservar o incremento patch e todos os contratos funcionais atuais de build e release.
2. Corrigir a notificação de sucesso e o rótulo da barra de status do botão de build, que hoje alegam commit e push inexistentes.
3. Informar que o commit pelo MaxCode é uma ação posterior, necessária antes do deploy dos consumidores locais.
4. Atualizar testes da mensagem/rótulo e acrescentar cobertura isolada da comunicação de sucesso e da interrupção por falha.
5. Documentar a origem do erro, a diferença entre botão e terminal, a sequência de entrega e a recuperação de falhas sem descartar trabalho.

### Fora de escopo

- Alterações em componentes Vue, stores, helpers, estilos, exports ou dependências. Não há frontend de aplicação novo; MaxComponentsUi, MaxPinia e MaxUse continuam intactos.
- Alterar `package.json`, `package-lock.json`, `vite.config.ts`, scripts de release ou a tarefa **NPM RUN RELEASE**.
- Alterar Engeapp, manifesto de bibliotecas, links simbólicos ou scripts de sincronização/verificação.
- Commit, merge, push, tag, publicação npm, deploy e qualquer sincronização de banco. São ações do usuário/MaxCode mediante solicitação própria.
- Ignorar alterações versionadas, usar `SKIP_LOCAL_LIBS_GATE`, remover prehooks, restaurar versões anteriores ou inventar uma exceção para arquivos de versão.
- Corrigir achados de compatibilidade/documentação notificados fora deste escopo.

## 3. Arquitetura & Mudanças Técnicas

### Evidências confirmadas

| Local existente | Evidência |
|---|---|
| `.vscode/tasks.json:5–20` | O botão executa incremento patch, build, notificação e som com `&&`. Notificação e barra afirmam commit/push sem executá-los. |
| `package.json:859,875–876` | Build é `vue-tsc && vite build`; release é um fluxo separado com versão, Git e publicação. |
| `README.md:239–240` | Incremento por botão, ausência de commit e versão mantida após falha já estão documentados. |
| `tests/architecture/npmBuildTask.test.ts:86–291` | Testes exigem incremento, preservação de release, flags, ausência de hooks de versão e comportamento de falhas. |
| `vite.config.ts:13–22` e `.gitignore:6,68–69` | Plugin copia temas para `dist`; distribuição e diretórios de worktrees estão ignorados. Não foi encontrado incremento no build Vite. |
| `/home/johnattas/GitHub/engeapp/scripts/sync-local-libraries.mjs:24–39` | Resolve symlink e rejeita qualquer alteração versionada antes de calcular commit, árvore e hash de `package.json`. |
| `/home/johnattas/GitHub/engeapp/scripts/verify-local-libraries.mjs:38–53` | Confere commit, árvore, hash e limpeza da biblioteca. |
| `/home/johnattas/GitHub/engeapp/deploy.php:432–438` | Executa sincronização e verificações locais antes do deploy. |
| `/home/johnattas/GitHub/engeapp/package.json:13–21` | Build/tipos têm verificações próprias; sincronizar manifesto é uma operação com escrita, não apenas leitura. |

O link `engeapp/storage/libs/MaxComponentsUi` resolveu para `/home/johnattas/GitHub/MaxComponentsUi`, não para esta worktree. No instante da inspeção, não havia diferenças versionadas nos dois arquivos de versão da raiz principal, nem alterações iniciais nesta worktree. Isso não reproduz nem invalida o erro histórico fornecido pelo usuário.

### Contratos a preservar

```text
NPM RUN BUILD
  → npm version patch --no-git-tag-version --ignore-scripts
  → npm run build
  → notify-send
  → paplay

após sucesso: arquivos de versão modificados, ainda sem commit
  → usuário solicita ao MaxCode a entrega/commit no repositório efetivamente consumido
  → operador verifica que a biblioteca consumida está limpa
  → consumidor sincroniza e valida o manifesto no seu fluxo autorizado
  → deploy autorizado separadamente
```

- Manter os quatro segmentos, sua ordem, o encadeamento por `&&`, os comandos de incremento/build e as flags atuais.
- Manter `label: NPM RUN BUILD`, `type`, `isBackground`, apresentação, ícone da notificação, título `VS Code`, comando de som e `statusbar.hide`.
- Texto proposto da notificação: `✅ MAX COMPONENTS UI - Build concluído e versão incrementada. Faça commit pelo MaxCode antes do deploy.`
- Rótulo proposto da barra: `✅ BUILD + VERSÃO`.
- A mensagem informa pendência; não promete que o projeto inteiro está pronto para deploy nem que o commit sozinho resolve outras falhas.
- Falha de incremento impede build e notificações seguintes. Falha de build mantém a versão já incrementada e impede notificação/som. Nova tentativa pelo botão incrementa novamente.
- Falha de `notify-send` ainda impede o som, como hoje; não ampliar o escopo para mudar essa política.

### Arquivos de implementação futura

| Arquivo existente | Mudança prevista |
|---|---|
| `.vscode/tasks.json` | Somente mensagem de sucesso e rótulo de status do build. |
| `tests/architecture/npmBuildTask.test.ts` | Ajustar expectativas desses textos e acrescentar testes da comunicação com comandos gráficos substituídos por dublês locais. Preservar todas as regressões existentes. |
| `README.md` | Ampliar somente a nota de build/entrega, sem reescrever seções não relacionadas. |

Não há arquivo de produção novo nem nova interface pública.

## 4. Plano de Execução Faseado

1. Revalidar revisão, alterações locais, tarefas e dependências efetivas por leitura; interromper se o ambiente não isolar escritas de testes/build.
2. Alterar os dois textos do botão e sua documentação operacional, preservando o contrato de incremento.
3. Atualizar os testes estáticos e implementar cobertura com fixtures inteiramente dentro da worktree. Ler a tarefa real para testar a mensagem, evitando uma cópia independente do comando.
4. Depois de concluir todo o código/documentação e testes, executar a validação em lote definida em `plan.md`; diagnosticar e corrigir falhas em lote.
5. Revisar diff, contratos e evidências. Entregar sem integração Git. Deixar aceite operacional externo como `manualPending` até o operador validar no ambiente correto com autorização própria.

## 5. Critérios de Aceite & Validação

- O botão continua incrementando patch exatamente uma vez antes de cada build; os três campos de versão continuam sincronizados.
- Nenhum comando Git/publicação é adicionado ao botão. A tarefa de release e os scripts npm permanecem iguais.
- Não há afirmação de commit/push realizados na mensagem nem na barra do botão de build.
- A mensagem de sucesso informa a necessidade de commit pelo MaxCode antes do deploy e só é emitida após build bem-sucedido.
- Testes de falha comprovam que não há mensagem de sucesso após erro e que a versão já incrementada não é revertida.
- README explica o gate, alterações preexistentes, destino real do symlink, diferença entre build/commit/integração/publicação e proíbe bypass/descarte de trabalho.
- No Execute, após preflight por leitura e implementação integral: `npm run check:lockfile`, `npm run test`, `npm run type-check:test`, `npm run lint` e `npm run build`. A checagem de tipos de produção já está no build; não duplicá-la.
- `npm run verify` não é necessário para este ajuste textual de ferramenta e testes sem mudança no pacote/runtime. Se o escopo se ampliar para release, reavaliar a necessidade do gate completo, sem substituir seus gates por validação parcial.
- Verificação visual do MaxCode e verificação do consumidor são manuais, posteriores e autorizadas separadamente. Não executar `composer deploy:fast-db-all` para testar esta correção: o comando também pode sincronizar dados de produção.

Referência oficial consultada: [npm version — CLI v10](https://docs.npmjs.com/cli/v10/commands/npm-version). A página servida é da série 10, versão 10.9.9; o projeto declara `npm@10.8.2`. Documenta escrita em ambos os manifestos e ausência de commit com `git-tag-version=false`. Não houve comprovação da versão efetivamente instalada nesta sessão.
