# Regra `opacity-*` gera valores fora da faixa válida (`opacity-150` → `opacity: 1.5`)

- **Categoria:** bug
- **Severidade:** baixa
- **Arquivo(s):** `src/presetMaxUno.ts:88-91`
- **Domínio:** build-config

## Problema

```ts
[/^opacity-?([\d.]+)$/, ([, d]) => {
    const val = Number(d);
    return { opacity: val > 1 ? `${val / 100}` : `${val}` };
}],
```

A heurística "se for maior que 1, trate como porcentagem" tem um ponto cego: valores acima
de 100 continuam sendo divididos por 100 e produzem opacidade maior que 1.

Verificado com geração real:

```
opacity-50  => .opacity-50{opacity:0.5;}     (correto)
opacity-150 => .opacity-150{opacity:1.5;}    (inválido)
```

Pela spec CSS, `opacity` é fixada (*clamped*) na faixa `[0, 1]`, então `1.5` é tratado como
`1` pelos navegadores — não quebra a página, mas silenciosamente não faz o que o autor
pediu, e é CSS inválido sendo emitido.

Há uma segunda ambiguidade na mesma regra: `opacity-1` gera `opacity: 1` (opaco), enquanto
`opacity-2` gera `opacity: 0.02`. Ou seja, a semântica muda drasticamente entre dois valores
adjacentes, o que é uma armadilha para quem escreve `opacity-1` esperando "1%".

A regex também aceita entradas malformadas: `[\d.]+` casa com `opacity-1.2.3`, cujo
`Number()` retorna `NaN`, gerando `opacity: NaN` — CSS inválido, que a declaração faz o
navegador descartar.

## Impacto

- Emissão de CSS inválido (`opacity: 1.5`, `opacity: NaN`) no bundle da app consumidora.
- Comportamento surpreendente e não documentado na fronteira `opacity-1` / `opacity-2`.
- Baixa severidade porque o navegador degrada de forma benigna (clamp/descarte), sem quebrar
  layout.

## Plano de correção

1. Fixar o resultado na faixa válida e rejeitar entradas não numéricas:

   ```ts
   [/^opacity-?(\d+(?:\.\d+)?)$/, ([, d]) => {
       const raw = Number(d);
       if (!Number.isFinite(raw)) return undefined;
       const val = raw > 1 ? raw / 100 : raw;
       return { opacity: `${Math.min(Math.max(val, 0), 1)}` };
   }],
   ```

   A regex mais estrita (`\d+(?:\.\d+)?`) elimina o caso `1.2.3`; retornar `undefined` faz o
   UnoCSS simplesmente não gerar a regra, em vez de gerar CSS quebrado.

2. Documentar a convenção no comentário da regra: valores `<= 1` são fração, valores `> 1`
   são porcentagem, e o resultado é sempre fixado em `[0, 1]`.

## Verificação

- Em `tests/preset/presetMaxUno.generate.test.ts`, adicionar casos que hoje falham:

  ```ts
  expect(await generate('<div class="opacity-150"></div>')).toContain('opacity:1');
  expect(await generate('<div class="opacity-150"></div>')).not.toContain('1.5');
  ```

- Confirmar que os casos já cobertos em `tests/preset/presetMaxUno.test.ts`
  (`opacity-50` → `0.5`, `opacity-0.8` → `0.8`) continuam passando.
- Confirmar que `opacity-1.2.3` não gera nenhuma declaração.
