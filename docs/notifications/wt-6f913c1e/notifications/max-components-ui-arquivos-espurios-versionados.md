# Arquivos espúrios versionados na raiz do repositório

- **Data**: 2026-10-22
- **Worktree**: wt-6f913c1e
- **Severidade**: baixa (higiene do repositório / portabilidade)

## Achado

`git ls-files` na raiz da worktree lista dois itens que não parecem intencionais:

1. `-l` — arquivo vazio (0 bytes) na raiz. Provável efeito colateral de um comando de shell com argumento mal interpretado (ex.: `ls -l > ...` ou redirecionamento quebrado).
2. `MaxComponentsUi` — link simbólico versionado apontando para um **caminho absoluto da máquina local** do desenvolvedor (`/home/<usuario>/GitHub/MaxComponentsUi`).

## Impacto

- O link simbólico absoluto quebra em qualquer outra máquina/CI e pode causar varreduras recursivas (ferramentas que seguem symlinks podem reentrar no próprio repositório).
- O arquivo `-l` confunde comandos de shell (é interpretado como opção) e polui a raiz.
- Ambos podem acabar no pacote publicado caso o `files` do `package.json` não os exclua (não verificado).

## Evidência

- `git ls-files -- '-l' MaxComponentsUi` retorna os dois caminhos.
- `ls -la` mostra `-l` com 0 bytes e `MaxComponentsUi -> /home/.../GitHub/MaxComponentsUi`.

## Sugestão

Remover ambos do controle de versão (`git rm`) após confirmar que nenhum script depende deles, e avaliar se `tests/architecture/tracked-filenames.test.ts` deveria barrar nomes iniciados por `-` e symlinks absolutos.

Fora do escopo da tarefa "desabilitar sugestões de preenchimento automático nos inputs".
