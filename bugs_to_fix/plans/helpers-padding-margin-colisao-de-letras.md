# `paddingMargin()` decide direção e operação por `includes()` de letra solta, gerando colisões

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/helpers/paddingMargin.ts:9-16`
- **Domínio:** helpers-composables

## Problema

A função classifica a classe inteira por presença de caracteres, não por posição:

```ts
// src/helpers/paddingMargin.ts:9-16
if (!fullClass.includes('p') && !fullClass.includes('m')) return undefined;
const operation = fullClass.includes('p') ? 'padding' : 'margin';

const top    = fullClass.includes('t') || fullClass.includes('y') || fullClass.includes('h');
const bottom = fullClass.includes('b') || fullClass.includes('y') || fullClass.includes('h');
const left   = fullClass.includes('l') || fullClass.includes('x') || fullClass.includes('w');
const right  = fullClass.includes('r') || fullClass.includes('x') || fullClass.includes('w');
```

Consequências verificáveis:

1. **`p` vence sempre sobre `m`.** Qualquer classe que contenha as duas letras vira `padding`. O regex do preset (`src/presetMaxUno.ts:24`, `/^[pm][tblrwhyx]?-?(\d+)$/`) não permite isso hoje, mas a função é exportada e usada como helper genérico — chamá-la com `['mp-10', ...]` devolve silenciosamente `padding`, sem erro.
2. **Direções acumulam.** `fullClass` não é o prefixo isolado, é a string completa capturada. Uma classe que contenha `t` **e** `x` produziria três lados, sem que a função sinalize entrada inválida.
3. **A guarda da linha 9 usa `includes`, não anchoring.** `paddingMargin(['xyz-map', 10])` passa pela guarda (contém `m`), enquanto o teste existente (`tests/helpers/paddingMargin.test.ts:76`) só cobre `['xyz', 10]`, que não contém `p` nem `m` — a cobertura dá falsa segurança.
4. `getCssSize` já devolve `string`, mas o resultado é reenvelopado em `String(value)` nas linhas 19 e 22-25 — ruído sem efeito.

O contrato real é "primeiro caractere = operação, segundo caractere (opcional) = eixo", mas o código não expressa isso.

## Impacto

Enquanto o único chamador for o regex de `presetMaxUno.ts:24`, o comportamento observável está correto. O risco é de regressão silenciosa: qualquer ampliação do regex (ex.: aceitar `pt-md`, `mx-auto`, prefixos com variante `hover:`) passa a produzir CSS errado sem que nenhum teste falhe, porque a função não valida a forma da entrada — só varre letras.

## Plano de correção

1. Trocar a análise por `includes()` por um parse posicional explícito: `const [, op, axis] = /^([pm])([tblrwhyx]?)/.exec(fullClass) ?? []`.
2. Retornar `undefined` quando o regex não casar (entrada malformada), em vez de adivinhar.
3. Derivar `operation` de `op` e as quatro direções de `axis` via mapa (`t`→top, `y`/`h`→top+bottom, etc.), eliminando a possibilidade de acumulação.
4. Remover os `String(...)` redundantes das linhas 19 e 22-25.

## Verificação

- Testes a criar/ajustar: `tests/helpers/paddingMargin.test.ts` — adicionar casos negativos reais (`['xyz-map', 10]`, `['mp-10', 10]`, `['', 10]`) e confirmar que os 14 casos atuais continuam passando sem alteração de expectativa.
- Comandos: `npx vitest run tests/helpers/paddingMargin.test.ts`, `npm run type-check`, `npm run lint`
