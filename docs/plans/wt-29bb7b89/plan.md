# Plano: atributos de tags frontend em uma única linha

## 1. Identificação e objetivo

- Data: 2026-10-07.
- Projeto: `@maxvue/max-components-ui`.
- Worktree e branch: `wt-29bb7b89`.
- Raiz confirmada: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-29bb7b89`.
- Solicitação: acrescentar ao `CLAUDE.md` uma instrução para não distribuir os atributos de componentes frontend por várias linhas.
- Público afetado: assistentes e desenvolvedores que consultam as diretrizes do projeto. Não há alteração de comportamento para usuários da biblioteca.
- Entrega futura: uma regra documental em português, com exemplos válidos do formato proibido e do formato esperado.
- Complexidade baixa: uma alteração documental em um único arquivo físico, sem lógica, migração ou múltiplos escopos. Não é necessária uma especificação técnica separada.

## 2. Evidências e estado inicial

| Local inspecionado | Fato observado | Consequência |
|---|---|---|
| Git da worktree ativa | `git rev-parse --show-toplevel` confirmou a raiz acima; branch `wt-29bb7b89`; `git status --short` sem saída antes da escrita deste plano | Manter essa worktree e branch; revalidar alterações antes de executar |
| `CLAUDE.md` | Link simbólico relativo para `AGENTS.md`, confirmado por `ls -l` e modo Git `120000` | Não substituir o link por arquivo regular; editar seu alvo dentro da mesma worktree |
| `AGENTS.md`, seção 5.1, visível também por `CLAUDE.md:63–69` | Convenções de SFC Vue: ordem template/script/style, Composition API e tipagem; não há regra sobre atributos na mesma linha | Acrescentar a regra nessa seção, preservando o conteúdo atual |
| `eslint.config.js:54–65,69–83` | Há regras de ordem e indentação Vue; a configuração lida não determina atributos em uma única linha | Não prometer enforcement automático; não modificar ESLint |
| `package.json:556–582` | Scripts existentes incluem `lint`, `type-check`, `build`, `test` e `verify` | Não são necessários para alteração exclusivamente documental |

As leituras e verificações Git acima foram realizadas nesta sessão. Não foram executados testes, builds, instalações, formatadores ou serviços. Não foi investigado o runtime nem o ambiente de dependências, pois eles não são necessários para esse contrato documental. Nenhum achado fora de escopo foi identificado na investigação dirigida.

## 3. Escopo e decisões

### Incluído

- Alterar futuramente apenas `AGENTS.md`, alvo real de `CLAUDE.md`, mantendo o link intacto.
- Acrescentar na seção 5.1 uma regra explícita para tags de abertura de componentes Vue e elementos HTML no frontend, incluindo atributos, props, diretivas, eventos e o fechamento `>` ou `/>`.
- Manter a tag de abertura inteira em uma única linha, mesmo com muitos atributos; não repartir atributos ou valores/expressões entre linhas nessa tag.
- Permitir conteúdo interno, componentes filhos e tags de fechamento em linhas separadas, com a indentação existente.
- Fornecer exemplos de formato proibido e correto. Corrigir as aspas incompletas do exemplo fornecido pelo usuário, sem reproduzir HTML inválido.

### Excluído e preservado

- Não reformatar arquivos `.vue`, exemplos existentes, playground, testes ou outros documentos.
- Não adicionar regras de ESLint, formatador, dependências, componentes, stores ou helpers.
- Não mudar interfaces, atributos, eventos, acessibilidade, estilos ou comportamento de componentes.
- Não impor linha única ao conteúdo inteiro do componente, ao bloco `<template>`, ao TypeScript ou ao SCSS.
- Não criar outra worktree, trocar branch, remover a worktree, executar commit, merge, push ou publicação.
- Não quebrar o vínculo `CLAUDE.md -> AGENTS.md` nem duplicar as diretrizes.

**Decisão de implementação fundamentada:** a edição do alvo é a forma de atender à leitura de `CLAUDE.md` sem quebrar a estrutura atual. A regra ficará disponível também para consumidores de `AGENTS.md`; isso decorre do vínculo existente, não de uma sincronização adicional proposta.

O pedido é documental, não uma alteração de frontend executável. Portanto, não há consumo novo de MaxComponentsUi, MaxPinia ou MaxUse, nem necessidade de criar recursos nessas bibliotecas. Seus contratos existentes permanecem intactos.

## 4. Texto proposto para inclusão

Inserir após as regras atuais da seção 5.1, antes da seção 5.2:

````markdown
- **Tags de abertura em uma única linha no frontend**: mantenha o nome da tag, todos os atributos, props, diretivas e eventos e o fechamento `>` ou `/>` na mesma linha, tanto em componentes Vue quanto em elementos HTML. Não distribua os atributos ou seus valores/expressões em várias linhas, mesmo quando a tag ficar longa. Essa regra vale para a tag de abertura; o conteúdo interno, os filhos e a tag de fechamento podem permanecer em linhas separadas, respeitando a indentação do projeto.

**Não usar:**

```html
<NomeDoComponente
    class="add"
    title="titulo"
>
    <div
        class="classe-do-conteudo"
        number="2"
    >
        Conteúdo
    </div>
</NomeDoComponente>
```

**Usar:**

```html
<NomeDoComponente class="add" title="titulo">
    <div class="classe-do-conteudo" number="2">
        Conteúdo
    </div>
</NomeDoComponente>
```

**Tags sem conteúdo também ficam em uma única linha:**

```html
<NomeDoComponente class="add" title="titulo" />
```
````

`NomeDoComponente` é apenas o marcador ilustrativo trazido pelo usuário, não um componente a criar ou uma API da biblioteca. Os exemplos demonstram formatação e não devem ser copiados para arquivos de produção.

## 5. Execução futura e dependências

1. **Admissão por leitura:** ler este plano e as diretrizes vigentes; confirmar raiz, branch, status e o vínculo de `CLAUDE.md`. Verificar se a regra já foi implementada por outra sessão e preservar qualquer alteração preexistente. Se o vínculo ou a estrutura tiver mudado, investigar antes de editar; não recriar o link automaticamente.
2. **Implementação documental única:** acrescentar o texto da seção 4 em `AGENTS.md`, seção 5.1. Preservar o restante do arquivo e o próprio link. Não há tarefas paralelas ou subagentes necessários.
3. **Revisão do lote completo:** após finalizar a inclusão, revisar o diff, ler `CLAUDE.md` e conferir todos os critérios da matriz abaixo. Não executar suíte, tipos ou builds entre microedições, nem ao final deste escopo exclusivamente documental.
4. **Registro e entrega:** somente em Execute, registrar progresso e handoff em `docs/plans/wt-29bb7b89/execution-state.json`, conforme seção 7, e relatar a alteração e as verificações efetivamente realizadas. Não realizar operações de integração Git.

Se houver necessidade de enforcement automático ou reformatação do código, interromper essa ampliação e obter autorização específica. Não incluir essas mudanças neste lote.

## 6. Matriz de aceite e validação futura

| Tarefa/requisito | Evidência esperada | Verificação pertinente | Revisão por risco/manual |
|---|---|---|---|
| Instrução acessível em `CLAUDE.md` | Leitura via link mostra a nova regra da seção 5.1 | `git diff -- AGENTS.md CLAUDE.md` e leitura dos dois caminhos | Conferir localização e preservação do link |
| Tags e atributos em uma linha | Texto cobre componentes, HTML, diretivas, eventos, tags longas e `/>` | Revisão documental; teste automatizado não aplicável | Exemplos corretos não têm quebra dentro da abertura |
| Filhos preservados em múltiplas linhas | Regra limita-se à abertura; exemplo conserva estrutura aninhada | Revisão dos exemplos | Não confundir tag em linha única com componente inteiro em linha única |
| Sintaxe válida nos exemplos | Aspas fechadas e delimitadores corretos | Inspeção manual | Não atribuir contrato real ao componente ilustrativo |
| Ausência de expansão de escopo | Diff de implementação restrito a `AGENTS.md`, além dos documentos de planejamento/registro | `git status --short` e `git diff --check` | Separar alterações anteriores das próprias; não apagar trabalho alheio |

Comandos de leitura/revisão pertinentes ao fechamento: `git rev-parse --show-toplevel`, `git branch --show-current`, `git status --short`, `git ls-files -s CLAUDE.md AGENTS.md`, `ls -l CLAUDE.md AGENTS.md`, `git diff -- AGENTS.md CLAUDE.md` e `git diff --check`. Os comandos listados são para execução futura; a seção 2 discrimina o que já foi realizado nesta sessão.

Não executar `npm run verify` nem seus componentes para comprovar uma regra em Markdown: esses gates não demonstram cumprimento dessa instrução. Caso o escopo mude para código/configuração, o plano de validação precisa ser revisto e o preflight das dependências, hooks, symlinks e integridade deve preceder os checks dependentes, sem bypass. Não há ambiente externo, credenciais, dados, migração ou aceite de fornecedor neste escopo.

## 7. Retomada, registro e riscos

- Ler o plano na primeira admissão; nas retomadas, consultar os trechos pertinentes, conferir o trabalho já existente e executar somente as lacunas. Não reabrir decisões sem evidência nova ou mudança de requisito.
- O principal risco é substituir inadvertidamente o link `CLAUDE.md`; o segundo é interpretar a regra como autorização para reformatar todo o projeto. Os critérios acima cobrem ambos.
- A instrução é documental, sem garantia de aplicação automática por ferramentas. Não declarar que ESLint passa a exigir esse formato.
- Recuperação, se necessária, deve remover apenas a inclusão realizada pelo executor, preservando alterações alheias; nunca usar reset amplo.
- Em Execute, criar/atualizar o registro de estado com `version: 2`, SHA256 real do conteúdo de `plan.md`, tarefas, estado e arquivos; usar `verification: {revision: SHA256, checks: [{command, revision: SHA256, result, exitCode?}]}`. As revisões devem representar hashes reais de conteúdo, nunca rótulos.
- Registrar somente comandos realmente executados e todas as falhas. `passed` exige `exitCode: 0`; `failed` exige inteiro diferente de zero; `pending` não aceita `exitCode`. Não deduzir aprovação de `tool:end.ok` nem tratar checks vazios, falhas vigentes ou resultados sem revisão vigente como validação integral. Registros version 1 continuam compatíveis, sem provar validação automaticamente.
- Registrar separadamente a revisão manual dos exemplos e do link. O registro autodeclarado não comprova execução nativa nem detecta checks omitidos. Falhas repetidas exigem diagnóstico agrupado e uma próxima ação concreta, não repetição cega.
- Nesta sessão Plan, somente este plano foi escrito; `execution-state.json` não deve ser criado até Execute com autorização correspondente.

## 8. Revisão final do plano

Escopo limitado à instrução solicitada; vínculo canônico investigado e preservado; exemplos corrigidos sem alterar sua intenção; critérios correspondem ao pedido; não há dependência de implementação de componentes, dados ou serviços. Não restaram decisões relevantes que exijam perguntas. A implementação permanece pendente de uma sessão Execute autorizada.
