# Arquivos de trabalho temporários de agentes versionados na raiz, com referências quebradas

- **Categoria:** documentação
- **Severidade:** média
- **Arquivo(s):** `execute_fixes.md:3`, `.superpowers-task-12-report.md:1-20`, `.gitignore:11-14`
- **Domínio:** docs-qualidade-testes

## Problema

A raiz do repositório contém arquivos que são claramente **saída de sessões de agente**,
não documentação do projeto — e ambos estão versionados
(`git ls-files` confirma `execute_fixes.md` e `.superpowers-task-12-report.md`).

### 1. `execute_fixes.md` referencia um diretório que não existe

A linha 3 diz:

> Baseado nos 40 achados em [`implementations/`](implementations/).

O diretório `implementations/` **não existe** no repositório
(`ls implementations` → "Arquivo ou diretório inexistente"). O documento inteiro é um
plano de execução de 40 achados cuja fonte foi perdida — o link é morto e as etapas
referenciam achados por número (*"achados 01, 17"*, *"achados 02, 34"*, *"achados 03, 04, 14"*)
sem que exista qualquer lugar onde consultá-los.

Pior: o conteúdo é **acionável e destrutivo**, mas de proveniência não verificável.
A Etapa 3 (linhas 22-25) instrui:

> 1. Deletar `src/components/MaxApp.vue`, `src/stores/useApp.Store.ts`, `src/stores/useLogin.Store.ts` (e as exclusões correspondentes no tsconfig).

Esses arquivos existem hoje e têm testes (`tests/components/MaxApp.test.ts`,
`tests/stores/useLogin.Store.test.ts`). Um agente que encontre esse arquivo na raiz pode
interpretá-lo como instrução vigente e apagar código em uso, com base em uma análise que
ninguém pode auditar.

A Etapa 1 (linha 12) instrui `git checkout 8746a182^ -- migration_plans/` — um comando de
restauração amarrado a um SHA específico, cujo contexto se perdeu. Já foi executado?
Deve ser executado? Não há como saber.

### 2. `.superpowers-task-12-report.md` é relatório de sessão

O arquivo (`.superpowers-task-12-report.md:1`) começa com
`# Task 12 — MaxInputIconPicker: Endpoints Curados + SVG Sob Demanda` e descreve, em
tempo passado, o que uma sessão de agente alterou ("O que mudou", "Removido",
"Adicionado / Alterado"). É um log de trabalho, não documentação de referência.

O nome com prefixo `.` e a numeração `task-12` são de um sistema de tarefas efêmero
(`.superpowers/`, que existe no repositório). Não há `task-1` a `task-11` nem `task-13`
— é um sobrevivente isolado.

Contudo, é hoje a **única** documentação das props `listUrl`/`svgUrl` e da interface
`IconEntry` do `MaxInputIconPicker` — componente que, como registrado no plano
`docs-components-md-43-componentes-nao-documentados.md`, não está no `COMPONENTS.md`.
Apagá-lo sem migrar o conteúdo perderia informação real.

### 3. O `.gitignore` demonstra a intenção, mas não cobre esses padrões

As linhas 11-14 do `.gitignore` têm uma seção explícita:

```
# Relatórios e arquivos temporários
coverage_*.txt
coverage_report.txt
test-tmp.js
```

Ou seja, a política de não versionar relatórios existe — mas foi definida por enumeração
de casos específicos, e esses dois escaparam.

## Impacto

- **Risco de execução equivocada:** `execute_fixes.md` tem forma de plano vigente
  (etapas numeradas, critérios de verificação, "Executar **na ordem**") e instruções de
  deleção de arquivos em uso. É o achado mais perigoso deste conjunto.
- **Referências mortas:** o link para `implementations/` e as citações por número de
  achado tornam o documento impossível de auditar — não dá para julgar se as etapas ainda
  fazem sentido.
- **Poluição da raiz:** a raiz já carrega 5 arquivos de controle de migração
  (`migration_plan.md`, `migration_executor.md`, `status-primevue.migration.yaml`,
  `INDEPENDENCIA-PRIMEVUE.md`, e o diretório `prime_vue_migration/`). Somar restos de
  sessão dificulta distinguir o que é norma do que é rascunho.
- **Documentação real presa em arquivo temporário:** as props do `MaxInputIconPicker` só
  existem documentadas em um relatório de sessão com nome de arquivo oculto.

## Plano de correção

1. **Triar `execute_fixes.md` antes de qualquer coisa.** Percorrer as etapas e classificar
   cada uma como (a) já executada, (b) ainda pertinente, ou (c) obsoleta. Verificar contra
   o código atual — por exemplo, a Etapa 4 cita o export `./stores` do `package.json`, que
   **não existe** hoje, indicando que essa análise partiu de um estado diferente do atual.
2. **Migrar o que for pertinente** para o rastreador de trabalho vigente
   (`bugs_to_fix/plans/`, que é o padrão em uso), um achado por arquivo, com o contexto
   reconstruído — sem depender de `implementations/`.
3. **Remover `execute_fixes.md` do versionamento** após a triagem. Se houver valor
   histórico, mover para `docs/historico/` com um cabeçalho
   `> OBSOLETO — não executar. Mantido apenas como registro.` no topo.
4. **Migrar o conteúdo técnico de `.superpowers-task-12-report.md`** (props `listUrl` e
   `svgUrl`, interface `IconEntry`, endpoints `/api/icons/picker` e
   `/api/icons/picker/svg`) para a entrada do `MaxInputIconPicker` no `COMPONENTS.md` —
   resolvendo simultaneamente parte da lacuna do catálogo. Só então remover o arquivo.
5. **Endurecer o `.gitignore`** com padrões, não com casos isolados, na seção das
   linhas 11-14:
   ```
   .superpowers-*.md
   execute_*.md
   *-report.md
   ```
   ajustando para não capturar arquivos legítimos (conferir antes com
   `git ls-files | grep -E '<padrão>'`).
6. **Registrar a convenção** no `CONTRIBUTING.md`: saída de sessão de agente vai para o
   diretório de scratchpad da sessão; o que precisar sobreviver vira achado em
   `bugs_to_fix/plans/` ou documentação em `docs/`. Nada de relatório solto na raiz.

## Verificação

- `git ls-files | grep -E '^(execute_|\.superpowers-)'` retorna vazio.
- Nenhum arquivo versionado referencia `implementations/`:
  ```bash
  grep -rn "implementations/" --include='*.md' . | grep -v node_modules
  ```
- As props `listUrl`, `svgUrl` e a interface `IconEntry` do `MaxInputIconPicker` estão
  documentadas no `COMPONENTS.md`.
- A raiz do repositório contém apenas arquivos de norma vigente; qualquer histórico está
  sob `docs/historico/` com cabeçalho de obsolescência.
- `npm run test` e `npm run build` seguem verdes (nenhum arquivo removido era referenciado
  por código ou build).
