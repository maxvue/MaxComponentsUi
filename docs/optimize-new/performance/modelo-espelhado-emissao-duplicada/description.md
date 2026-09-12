# `useMirroredModel` tem risco latente de eco com transformação não normalizada

## Validação da refutação

**Parcialmente confirmado.** O helper genérico duplica a emissão no cenário descrito, mas nenhum consumidor atual demonstrou esse efeito: `MaxInputCep` fornece comparador semântico, `MaxInputCpfCnpj` mantém o valor local já normalizado e `MaxInputTextList` usa transformação equivalente à identidade. O achado fica restrito ao contrato interno do helper e a consumidores futuros.

## Severidade e prioridade

- Severidade: baixa enquanto não houver consumidor afetado.
- Prioridade: P3.

## Evidências confirmadas

- `src/helpers/useMirroredModel.ts:50-52`: o watcher local emite o valor transformado, mas não registra o último valor canônico emitido.
- `src/helpers/useMirroredModel.ts:54-55`: o round-trip do pai é comparado com a representação local anterior à transformação.
- Reprodução executada com transformação uppercase: alteração local `abc`, seguida da prop `ABC`, gerou `['ABC', 'ABC']`.
- `rg "useMirroredModel\\(" src` encontra somente `MaxInputCep`, `MaxInputCpfCnpj` e `MaxInputTextList`; a leitura desses três usos não mostrou o round-trip divergente.

## Causa-raiz

O contrato aceita `transform`, mas não define se o valor local deve ser normalizado nem compara a prop com o último valor transformado emitido. O comparador opcional transfere essa responsabilidade ao consumidor sem tornar a invariável explícita.

## Impacto demonstrado

Há uma armadilha reutilizável no helper, não uma regressão de performance observada nos componentes atuais. Um novo consumidor cuja transformação altere a representação e que reaplique o valor emitido pode duplicar eventos e efeitos do pai.

## Direção de solução

Escolher e documentar uma semântica: registrar/comparar o último valor canônico emitido, normalizar localmente antes da emissão ou exigir comparador semântico quando `transform` alterar a representação. Adicionar teste unitário do helper e testes dos três consumidores atuais.

## Critérios de aceite

- O round-trip semanticamente equivalente do teste uppercase gera uma única emissão.
- Mudanças externas genuínas continuam sincronizadas.
- Os consumidores atuais preservam máscara, normalização e emissão inicial onde aplicável.

## Contraevidências consideradas

- O helper não é exportado no entry público e não há consumidor atual comprovadamente afetado.
- Sem transformação, com transformação identidade ou com comparador semântico adequado, o guard atual evita o eco.
