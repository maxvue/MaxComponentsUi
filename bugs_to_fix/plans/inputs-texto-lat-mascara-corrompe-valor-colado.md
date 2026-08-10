# Máscara de latitude corrompe valor negativo colado (-23.550520 vira -2.355052)

- **Categoria:** bug
- **Severidade:** crítica
- **Arquivo(s):** `src/components/MaxInputCoordinateDecimalLat.vue:66-91`
- **Domínio:** inputs-texto

## Problema

A máscara é reativa ao sinal do valor já digitado:

```ts
mask: negative.value ? '-39.######' : '33.######'
```

e `negative` só é ligado pelo `watch(temp_value, ...)` (linha 83), ou seja, **depois** que o Maska já processou a entrada. O token `'3'` tem pattern `/[0-5-]/`, que aceita o próprio caractere `-` como se fosse um dígito.

Enquanto o campo está vazio (`negative === false`), a máscara ativa é `33.######`. Quando o usuário **cola** (ou preenche de uma vez, ex.: autofill / `setValue`) uma latitude negativa completa, o Maska consome o `-` no primeiro token `3`, o `2` no segundo token `3`, insere o `.` literal e joga o resto nas casas decimais.

Verificado executando o componente real com a diretiva `vMaska` de verdade:

```
input colado: "-23.550520"
valor exibido: "-2.355052"
temp_value:    -2.355052
emitido (update:modelValue): [-2.355052]
```

A digitação caractere a caractere **não** é afetada (após o primeiro `-` a máscara vira `-39.######` e o resto entra correto), e valores vindos por prop (`modelValue` inicial ou `setProps`) também não são afetados — o problema é exclusivo do caminho "valor completo entra de uma vez", que é justamente o caso de colar coordenada copiada do Google Maps, o uso mais comum deste campo.

O valor corrompido `-2.355052` continua dentro da faixa válida de latitude brasileira (`-33.8..5.3`), então `done` fica `true` e **nenhum erro é exibido**: a corrupção é silenciosa.

`MaxInputCoordinateDecimalLng.vue:64-76` não tem esse defeito porque sua máscara é fixa (`-7#.######`), sem alternância dependente de estado.

## Impacto

Coordenada gravada errada, sem qualquer sinal visual para o usuário. Uma latitude de São Paulo (-23.55) vira uma latitude perto do equador (-2.35) — cerca de 2.300 km de deslocamento. Como o campo alimenta cadastro de endereço/geolocalização, o dado incorreto é persistido e propagado.

## Plano de correção

1. Remover a alternância de máscara e adotar uma máscara única que trate o sinal como caractere literal opcional, à imagem do que o Lng já faz. Ex.: tokens `{'#': {pattern: /[0-9]/}, '9': {pattern: /[0-9]/, optional: true}}` com máscara `'-#9.######'` e `eager: true`, deixando o `-` como literal — ou usar `preProcess` do Maska para separar sinal e magnitude antes do casamento.
2. Em qualquer solução, garantir que nenhum token de dígito aceite `-` no seu pattern (o `[0-5-]` atual é a raiz do problema).
3. Se a alternância for mantida por outro motivo, computar `negative` de forma síncrona a partir do valor **de entrada** (via `preProcess`), nunca por `watch` posterior.
4. Reavaliar o intervalo aceito: `33.######` limitava o primeiro dígito a `[0-5]`, o que já não cobre corretamente todas as latitudes brasileiras positivas de dois dígitos; com máscara única isso deixa de importar, pois a faixa é validada por `done` (linha 49).

## Verificação

- Novo teste montando o componente com a diretiva `vMaska` real (não stub) que faz `input.setValue('-23.550520')` e afirma `temp_value === -23.55052` e o último `update:modelValue` igual a `-23.55052`.
- Teste equivalente para uma latitude positiva (`'4.512345'`) garantindo que não houve regressão.
- Teste de digitação incremental (`'-'`, `'-2'`, `'-23'`, `'-23.5'`) confirmando o mesmo resultado final.
- `npx vitest run tests/components/MaxInputCoordinateDecimalLat.test.ts`.
