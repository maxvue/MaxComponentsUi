# Shortcut `color-*` troca silenciosamente tokens curtos por `gray-300`

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/presetMaxUno.ts:31`
- **Domínio:** build-config

## Problema

```ts
[/^color-([\w-]+)$/, ([, s]) => ({ color: `var(--${String(s).length > 3 ? s : 'gray-300'}) !important` })],
```

Quando o token capturado tem 3 caracteres ou menos, a shortcut descarta o que o autor
escreveu e substitui por `gray-300`. Verificado com geração real:

```
color-blue-500 => .color-blue-500{color:var(--blue-500) !important;}   (esperado)
color-ab       => .color-ab{color:var(--gray-300) !important;}         (token descartado)
```

O limiar `length > 3` é uma heurística sem comentário explicando a intenção — diferente das
outras decisões não óbvias do arquivo, que são bem documentadas (ver o comentário detalhado
logo acima, em `src/presetMaxUno.ts:27-30`, sobre o caso `color-mix`). Provavelmente é uma
proteção contra falsos positivos do extractor, mas o efeito colateral é ruim: um erro de
digitação em token curto (`color-red` → 3 caracteres... na verdade `red` tem 3, então
`color-red` **também** cai no fallback) vira cinza silenciosamente, em vez de simplesmente
não gerar regra.

Note o caso concreto: `color-red` não produz vermelho, produz `var(--gray-300)`. O mesmo
vale para qualquer token de três letras.

O `uno.config.ts:14-26` documenta que a shortcut `color-*` já é fonte de problemas conhecidos
(a colisão com o atributo `:color-string`), o que reforça que essa regra merece um
tratamento mais explícito.

## Impacto

- Cores erradas aplicadas silenciosamente sempre que o token tem até 3 caracteres, incluindo
  o caso plausível `color-red`.
- Erros de digitação nunca falham de forma visível — produzem cinza, que é difícil de
  associar à causa.
- A intenção do limiar não está documentada, então quem mexer no código depois não sabe se
  pode removê-lo.

## Plano de correção

1. Descobrir e registrar a intenção original do limiar. Se for proteção contra falsos
   positivos do extractor attributify, a solução correta é uma **allowlist de tokens
   válidos** do tema (as famílias já enumeradas em `src/presetMaxUno.ts:95`: `red`, `green`,
   `blue`, `emerald`, `orange`, `amber`, `cyan`, `pink`, `yellow`, `gray`, `background`,
   mais `primary`/`max-primary`), não uma medida de comprimento.

2. Trocar o fallback silencioso por "não gerar regra":

   ```ts
   [/^color-([\w-]+)$/, ([, s]) => {
       if (!isTokenDeTema(s)) return undefined;   // não gera CSS em vez de virar cinza
       return { color: `var(--${s}) !important` };
   }],
   ```

   Retornar `undefined` faz o UnoCSS ignorar o candidato, que é o comportamento correto para
   um token desconhecido — e deixa a classe visivelmente sem efeito, o que é muito mais fácil
   de diagnosticar do que "ficou cinza".

3. Se o fallback para `gray-300` for mesmo desejado por algum motivo de produto, mantê-lo
   mas adicionar um comentário explicando o porquê, no mesmo padrão dos demais comentários
   do arquivo.

## Verificação

- Em `tests/preset/presetMaxUno.generate.test.ts`, adicionar:
  - `color-blue-500` continua gerando `var(--blue-500)`;
  - `color-red` gera `var(--red)`/`var(--red-500)` conforme a decisão tomada, e **não**
    `var(--gray-300)`;
  - um token inexistente (`color-zzz`) não gera declaração alguma.
- Rodar o `npm run dev:playground` e inspecionar visualmente componentes que usem
  `color-*` com tokens curtos, confirmando que nenhum ficou cinza por engano.
