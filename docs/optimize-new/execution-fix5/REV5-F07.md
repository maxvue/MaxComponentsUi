# REV5-F07 — refutação independente de E04-02

Agente: `/root/rev5_f07`  
Início: `2026-09-15T14:28:00-03:00`  
Fim: `2026-09-15T14:31:56-03:00`  
Referência adversarial: `aac16bca`  
HEAD auditado: `925b8bf1b74fc3e187f12664b784f974e0a402e1`

## Escopo e método

Auditoria somente leitura do motor `useOutsidePointer`. O caso adversarial
abre um overlay, emite dois pares `pointerdown`/`click` externos sem aguardar
o tick reativo e exige callback único, pilha vazia e zero listeners. O módulo
de referência foi obtido diretamente por `git show`, transpilado em memória e
executado em Happy DOM/Vite; nenhum arquivo de código ou teste canônico foi
criado ou alterado.

## Execução adversarial contra a referência

```text
$ node --input-type=module <runner-em-memoria>
[Vue warn]: onBeforeUnmount is called when there is no active component instance...
{"commit":"aac16bca","callbacks":2,"stack":1,"listeners":5}
referencia_exit=1
```

O exit 1 é intencional: o contrato exige um callback, mas `aac16bca` chamou
`onClose` duas vezes antes de Vue processar `open = false`, mantendo a entrada
na pilha e cinco listeners globais. Portanto, o caso realmente refuta a
referência pedida.

## Execução no HEAD auditado

```text
$ node --input-type=module <mesmo-runner-em-memoria, modulo HEAD>
[Vue warn]: onBeforeUnmount is called when there is no active component instance...
{"commit":"925b8bf1","callbacks":1,"stack":0,"listeners":0}
head_exit=0

$ npm test -- --run tests/helpers/useOutsidePointer.test.ts
Test Files  1 passed (1)
Tests  14 passed (14)
Duration  1.00s

$ git diff --check
(sem saída; exit 0)
```

O warning Vue pertence ao runner adversarial fora de um `setup()` de componente;
não ocorreu na suíte focal Vitest e não representa warning da implementação.

## Veredito

**ACEITO.** A remoção síncrona da entrada em `requestClose()` elimina a janela
entre eventos globais consecutivos. O cenário que falha em `aac16bca` passa no
HEAD, preservando callback único e cleanup imediato de pilha/listeners.
