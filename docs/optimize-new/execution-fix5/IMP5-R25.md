# IMP5-R25 — consumidores e distribuição

## Escopo e manifesto

- `scripts/verify-consumers.mjs`
- `scripts/verify-package-consumer.mjs`
- este relatório e a linha `IMP5-R25` da matriz

## Correção implementada

- `npm pack` passou a usar `--pack-destination` com `mkdtempSync`, portanto cada
  processo cria o próprio tarball e diretório de trabalho; ambos são removidos no
  `finally`, inclusive quando um cenário falha.
- O parser aceita os dois formatos JSON observados do npm (`array` e objeto indexado
  pelo nome do pacote), sem depender de texto humano do `npm pack`.
- O consumidor Vite importa diretamente `style.css` e os seis temas públicos; sua
  saída é capturada e qualquer warning de tamanho/chunk passa a falhar o gate.
- O consumidor de pacote resolve todos os temas públicos, valida CSS e confirma que
  um subpath não publicado retorna erro de exports.
- Os runners não chamam `process.exit()` antes de seus `finally`; falhas usam
  `process.exitCode` somente após o cleanup.

## Execução focal

```text
node --check scripts/verify-consumers.mjs                         # passou
node --check scripts/verify-package-consumer.mjs                  # passou
npm run verify:consumers                                          # reproduziu falha independente
```

A execução construiu a biblioteca e criou tarball/diretórios exclusivos, depois
falhou legitimamente no primeiro consumidor Node ao importar a raiz:

```text
SyntaxError: The requested module 'pdfjs-dist/build/pdf.worker.min.mjs?url'
does not provide an export named 'default'
```

O `finally` foi executado e removeu tanto o diretório do consumidor quanto o do
tarball. A falha pertence ao entrypoint raiz/distribuição de `MaxPdfView`, fora do
ownership de consumidores de R25; não foi ocultada reduzindo a cobertura Node.

## Reabertura após REV5-R25

A refutação encontrou corretamente que o import estático de
`pdfjs-dist/build/pdf.worker.min.mjs?url` em `MaxPdfView` vazava a transformação
específica do Vite para o entrypoint raiz. O Node tenta interpretar esse specifier
mesmo quando o componente PDF não é montado e rejeita o `default` inexistente.

O worker passou a ser resolvido por import dinâmico, exclusivamente no cliente e
apenas quando o visualizador é carregado. Assim o Vite continua emitindo o asset
do worker no consumidor web, enquanto Node e SSR podem importar a raiz sem
executar esse specifier.

Os dois runners também passaram a executar `npm run build:clean` antes de
empacotar; não há mais caminho que reutilize um `dist` obsoleto.

## Revalidação

```text
npm run verify:consumers    # passou
npx eslint src/components/MaxPdfView.vue scripts/verify-consumers.mjs scripts/verify-package-consumer.mjs  # passou
git diff --check            # passou
```

O gate completo aprovou Node ESM com e sem peers, TypeScript, Vite (incluindo CSS
e seis temas, sem warning de chunk), SSR e subpath desconhecido. A reconstrução
limpa, o tarball exclusivo e os dois diretórios temporários foram removidos no
`finally` ao término.

## Estado

Implementação R25 reaberta e concluída; aguarda somente revalidação independente
de `REV5-R25`.
