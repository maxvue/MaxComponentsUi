# REV5-R25 — E11-05: distribuição e consumidores concorrentes

## Escopo e referência

Refutação independente e somente leitura do agente `/root/rev5_r25`, parent
`/root`, no HEAD `4f9e79ab399423d1599679389ad807c80fa8d8df`, contra a referência
`aac16bca`. O contrato de R25 exige import Node do entrypoint raiz, CSS e todos
os temas públicos, rejeição de subpath desconhecido, falha em warning de chunk,
e execução concorrente sem colisão nem resíduos mesmo quando há falha.

## Caso adversarial

Foram iniciadas duas instâncias reais, simultâneas, do consumidor canônico:

```text
$ npm run verify:consumers > /tmp/rev5-r25-consumer-1.log 2>&1 &
$ npm run verify:consumers > /tmp/rev5-r25-consumer-2.log 2>&1 &
$ wait ...
CONCORRENTE_STATUS=1,1
```

Cada processo criou nomes independentes para tarball e consumidor:

```text
/tmp/max-components-pack-stppvQ/maxvue-max-components-ui-1.1.2.tgz
/tmp/max-components-test-dAthxW
/tmp/max-components-pack-6Oauzd/maxvue-max-components-ui-1.1.2.tgz
/tmp/max-components-test-w6YcFH
```

Logo, a colisão histórica do tarball de nome fixo foi eliminada. Ambos os
processos, porém, falharam antes de alcançar CSS, temas, subpath e Vite, pois o
primeiro cenário obrigatório de Node ESM não consegue importar a raiz:

```text
SyntaxError: The requested module 'pdfjs-dist/build/pdf.worker.min.mjs?url'
does not provide an export named 'default'
```

O mesmo caminho já existe no commit de referência: `aac16bca` importa o
entrypoint raiz no cenário Node ESM de `scripts/verify-consumers.mjs`. Portanto
o caso adversarial é capaz de falhar na referência exigida; o HEAD ainda não o
resolveu.

## Evidências adicionais

- A inspeção de `scripts/verify-consumers.mjs` confirma `npm pack --json
  --pack-destination` sob diretório criado por `mkdtempSync`, com `finally` que
  remove tanto o consumidor como o diretório do pacote.
- Após as duas falhas, `find /tmp -maxdepth 1` para os prefixos
  `max-components-pack-*` e `max-components-test-*` não retornou resíduos.
- Não há `process.exit()` no fluxo do runner antes do `finally`: a falha usa
  `process.exitCode = 1`. `scripts/verify-package-consumer.mjs` também protege
  o diretório exclusivo de pack com `try/finally`.
- O código contém os imports diretos de `style.css` e dos seis temas públicos,
  o teste negativo de subpath e a política de warning de chunk. Esta cobertura
  permanece **não executada** porque o import Node raiz falha primeiro.

## Veredito

**REJEITADO.** A correção de isolamento concorrente e cleanup é comprovada,
mas E11-05 exige consumidores Node funcionais. O import público raiz ainda é
incompatível com Node por causa de `pdfjs-dist/...mjs?url`; enquanto isso não
for corrigido e todos os cenários completarem sem warning de chunk, o bloco não
pode receber aceite.
