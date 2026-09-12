# Artefato hostil versionado com nome de opção UNIX

## Resumo
Há um arquivo vazio rastreado chamado `src/components/base/-l`. Ao chegar como basename a CLIs sem terminador `--`, ele pode ser interpretado como a opção `-l`, e não como arquivo.

## Severidade e prioridade
**Baixa / P3.** Não afeta build ou bundle atuais; o risco exige uma automação shell que use o basename sem `--`, mas o arquivo é um artefato versionado sem função.

## Evidências
- `git ls-files -- src/components/base/-l` confirma rastreamento; `stat` informa 0 bytes.
- `git log` aponta o commit `60300a7...`.

## Afetados
Automação shell, scripts de manutenção e higiene do inventário de componentes base.

## Causa-raiz
Artefato acidental de shell entrou no versionamento sem validação de nomes de arquivo.

## Impacto
Basenames iniciados por hífen podem alterar a interpretação de comandos que expandem arquivos e poluem ferramentas que enumeram `src/components/base/*`.

## Reprodução
Executar `stat src/components/base/-l` e passar seu basename a uma CLI que aceite `-l` sem usar `--`.

## Direção de correção
Remover o artefato com terminador `--` e validar em CI basenames iniciados por hífen/controle.

## Critérios de aceite
- Nenhum basename rastreado começa com `-`.

## Contraevidências consideradas
O arquivo não entra no entrypoint nem quebra o Vite atual; por isso a severidade foi reduzida e o problema de lockfile foi separado.
