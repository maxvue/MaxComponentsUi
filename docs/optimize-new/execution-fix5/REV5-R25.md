# REV5-R25 — E11-05: distribuição e consumidores concorrentes

## Escopo e referência

Revalidação independente e somente leitura do agente `/root/rev5_r25_retry`,
parent `/root`, no HEAD `3ee209c5e8b9eee339616f9eeed1aeda3f67f65c`, contra a
referência adversarial `aac16bca`. O contrato de R25 exige import Node do
entrypoint raiz, CSS e todos os temas públicos, rejeição de subpath desconhecido,
falha em warning de chunk e execução concorrente sem colisão nem resíduos.

## Caso adversarial e execução

Duas instâncias reais foram executadas em paralelo no checkout limpo do HEAD:

```text
$ npm run verify:consumers > /tmp/rev5-r25-retry.cb8ECW/a.log 2>&1 &
$ npm run verify:consumers > /tmp/rev5-r25-retry.cb8ECW/b.log 2>&1 &
$ wait ...
CONCORRENTE_STATUS=0,0
```

Cada uma fez `npm run build:clean`, gerou seu próprio tarball e consumidor:

```text
/tmp/max-components-pack-6OZWc6/maxvue-max-components-ui-1.1.2.tgz
/tmp/max-components-test-yvVAbh
/tmp/max-components-pack-Ufn9GH/maxvue-max-components-ui-1.1.2.tgz
/tmp/max-components-test-Goax0q
```

Ambas executaram integralmente os seis cenários. A saída final de cada log foi:

```text
Node ESM sem/com dependências opcionais — OK
TypeScript Consumer — OK
Vite Consumer — OK (sem warning de chunk)
SSR Consumer — OK
Subpath desconhecido corretamente rejeitado com: ERR_PACKAGE_PATH_NOT_EXPORTED
✅ --- Todos os cenários de validação passaram com sucesso ---
Diretório temporário removido: ...
Diretório do tarball removido: ...
```

O caso é discriminante: em `aac16bca` o import obrigatório da raiz em Node ESM
falhava por `pdfjs-dist/build/pdf.worker.min.mjs?url` não exportar `default`.
O HEAD substitui esse ponto pelo carregamento dinâmico compatível, e o cenário
Node real agora passa antes dos demais.

## Cobertura e cleanup

- O cenário Vite importa `style.css` e os seis temas exportados: `all`, `app`,
  `colors`, `font`, `params` e `tokens`.
- Node ESM com/sem peer opcional, TypeScript, Vite e SSR foram exercitados por
  cada processo. O wrapper do build trata warnings de chunk como falha; nenhum
  warning foi produzido.
- O cenário negativo exige `ERR_PACKAGE_PATH_NOT_EXPORTED` (ou equivalentes)
  para subpath não publicado e recebeu `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- `npm pack --pack-destination` recebe diretório exclusivo criado por
  `mkdtempSync`. Os dois runners encerram com `process.exitCode`, nunca com
  `process.exit()` antes do `finally`.
- Os quatro caminhos temporários apresentados foram removidos pelo `finally`;
  ao final não havia processo `verify-consumers` ativo nem resíduos nesses
  caminhos.

## Veredito

**ACEITO.** R25 atende a distribuição para Node, TypeScript, Vite e SSR; CSS e
todos os temas; subpath negativo; política de warning de chunk; e consumidores
concorrentes com tarballs/diretórios isolados e cleanup garantido.
