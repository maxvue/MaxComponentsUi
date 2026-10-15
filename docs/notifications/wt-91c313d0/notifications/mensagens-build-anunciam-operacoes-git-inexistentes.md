# Mensagens da tarefa de build anunciam operações Git inexistentes

## Localização e evidência

- `.vscode/tasks.json:7`: texto da notificação anuncia “Build, Commit e Push realizados”.
- `.vscode/tasks.json:18`: rótulo de status anuncia “BUILD, COMMIT & PUSH”.
- O comando da mesma tarefa executa `npm run build`, seguido de notificação e som. Não contém operação de commit ou push.

## Impacto

O mantenedor pode acreditar que suas alterações já foram integradas ou enviadas ao remoto após apenas compilar. O incremento de versão planejado também não adiciona essas operações Git.

## Encaminhamento

Corrigir os textos para descrever somente as ações realmente executadas, mediante autorização em escopo separado. Não adicionar commit/push para tornar o texto verdadeiro. Esta sessão não alterou a tarefa nem executou seu comando.
