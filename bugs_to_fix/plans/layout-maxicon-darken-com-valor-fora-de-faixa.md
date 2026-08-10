# MaxIcon chama Color.darken(13) com um valor fora da faixa esperada

- **Categoria:** bug
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxIcon.vue:113`, `src/components/MaxIcon.vue:118`
- **Domínio:** tabela-layout-exibicao

## Problema

```ts
const value = 13;
...
return Color.darken(value).hexa();
```

`darken` da biblioteca `color` (usada por `getColorFromVar`, de `@maxvue/max-use`) recebe uma **razão** entre 0 e 1: `darken(0.2)` escurece 20%. Passar `13` significa "escurecer 1300%", o que satura para preto em qualquer implementação.

Consequência: sempre que o caminho da linha 118 é alcançado — cor opaca (sem alpha), com `pointer` ou `hoverColor` definido — a cor de hover resultante é **preto puro**, não um tom levemente mais escuro da cor original. O efeito de hover vira um salto abrupto para preto em vez de um escurecimento sutil.

O ramo adjacente (linha 116) usa a escala correta: `Color.alpha(alpha + 0.2)`, um incremento de 0.2 na faixa 0-1. A inconsistência entre `0.2` e `13` no mesmo computed reforça que `13` é um erro de digitação/unidade — provavelmente pretendia-se `0.13`.

O comentário `const value = 13;` isolado em uma variável (linha 113), sem unidade nem explicação, sugere que o valor foi ajustado empiricamente sem verificar a assinatura da função.

## Impacto

- Hover de ícones opacos salta para preto em vez de escurecer suavemente.
- Inconsistência visual com o ramo de cores translúcidas, que escurece corretamente.
- Afeta todo ícone com `pointer` — ou seja, praticamente todo ícone clicável da biblioteca (`MaxIconButton.vue:4` passa `pointer`).

## Plano de correção

1. Corrigir a escala para a faixa 0-1:
   ```ts
   const DARKEN_RATIO = 0.13;
   ...
   return Color.darken(DARKEN_RATIO).hexa();
   ```
2. Renomear a variável para algo autoexplicativo e documentar a unidade, evitando a repetição do erro.
3. Conferir visualmente o hover no playground para calibrar o valor final.

## Verificação

- Teste: `MaxIcon` com `pointer` e uma cor opaca (`color: '#3366cc'`), simular hover e asserir que a cor resultante **não** é `#000000` e é perceptivelmente mais escura que a original.
- O teste existente `tests/components/MaxIcon.test.ts:114` ("aplica hover_color calculado automaticamente (getColorFromVar hex => darken)") deve ser estendido para verificar o valor, não apenas a existência.
- `npx vitest run tests/components/MaxIcon.test.ts`.
