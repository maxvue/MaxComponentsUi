# `hover-primary-*` não gera nenhum CSS — a variante `hover:` do presetWind3 captura o token antes

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/presetMaxUno.ts:52`, `uno.config.ts:11-13`
- **Domínio:** build-config

## Problema

A regra `hover-(.+)` do preset (`src/presetMaxUno.ts:52-77`) gera um bloco aninhado
`&:hover` com a cor `var(--<token>)`. Para a maioria dos tokens ela funciona, mas para o
token `primary` ela produz **string vazia**.

Reproduzido com a mesma ordem de presets do `uno.config.ts:11-13`
(`presetMaxUno()` seguido de `presetWind3()`):

```
hover-red-500     => .hover-red-500:hover{color:var(--red-500);}
hover-blue-500    => .hover-blue-500:hover{color:var(--blue-500);}
hover-primary-600 => ""        <-- nada é gerado
```

Causa: o `presetWind3` registra a **variante** `hover-` (forma alternativa de `hover:`).
Diante de `hover-primary-600`, o UnoCSS aplica primeiro a variante, que remove o prefixo e
tenta resolver o restante — `primary-600` — como utilitário. O Wind3 tem uma paleta com o
nome `primary`, então `primary-600` é aceito como candidato válido pelo matcher da variante,
que assim "ganha" a resolução. Como o Wind3 não define de fato a cor `primary` (ela é do
tema Max, via variável CSS), o resultado final é vazio — e a regra `hover-(.+)` do
presetMaxUno nunca chega a ser consultada.

Com `red-500`/`blue-500` o desfecho é diferente por acaso: o Wind3 resolve essas cores, e a
saída acaba equivalente à pretendida.

Isso é uma quebra silenciosa e não hipotética: o `CLAUDE.md` documenta explicitamente
`hover-primary-600` como uma das classes utilitárias do preset. Qualquer uso dela no
código-fonte é simplesmente descartado, sem erro nem aviso.

Achado secundário no mesmo bloco: a regra `hover-(.+)` depende de aninhamento CSS (`&:hover`)
que só é achatado porque o presetWind3 está presente. Isolado, o preset emite CSS inválido:

```
.hover-red-500{&:hover:[object Object];}
```

Ou seja, o preset **não é autossuficiente** — se uma app consumidora usar o `presetMaxUno`
sem o `presetWind3`, todas as regras `hover-*` geram lixo. Isso merece, no mínimo, estar
documentado.

## Impacto

- Todo `hover-primary-*` no código-fonte da lib e das apps consumidoras é no-op: o hover
  simplesmente não muda de cor, sem nenhum sinal de erro.
- A confiabilidade da regra depende de qual token de cor é usado, o que é imprevisível para
  quem escreve o template.
- O preset publicado (`./preset`) produz CSS inválido se usado sem o presetWind3.

## Plano de correção

1. Eliminar a ambiguidade com a variante do Wind3. A correção mais segura é dar à regra um
   prefixo que não colida — por exemplo `max-hover-(.+)` — mas isso quebra a API pública.
   A alternativa que preserva a API é registrar a regra como **variante própria** com
   prioridade maior, ou restringir o matcher para não deixar a variante do Wind3 vencer.

2. Solução recomendada, de menor risco: manter `hover-(.+)` mas garantir que ela seja
   avaliada antes da variante, declarando-a com `layer`/ordenação explícita, e adicionar
   `primary` (e demais tokens do tema Max: `background`, `max-primary`) a uma allowlist
   testada. Validar caso a caso com o teste de geração real descrito abaixo.

3. Trocar o aninhamento `&:hover` por um seletor achatado, para que o preset não dependa do
   presetWind3 para produzir CSS válido — usar a forma `selector` da API de regras do
   UnoCSS em vez de um objeto aninhado.

4. Documentar no README/`CLAUDE.md` que o `presetMaxUno` pressupõe o `presetWind3` na
   configuração, caso a dependência seja mantida deliberadamente.

## Verificação

- Adicionar a `tests/preset/presetMaxUno.generate.test.ts` (que já gera CSS de verdade via
  `createGenerator` e valida com PostCSS) um caso que **falha hoje**:

  ```ts
  it('hover-primary-600 gera CSS de hover', async () => {
      const css = await generate('<div class="hover-primary-600"></div>');
      expect(css).toContain('var(--primary-600)');
  });
  ```

- Cobrir na mesma suíte `hover-red-500`, `hover-background-300` e `hover-max-primary-500`.
- Confirmar que o CSS gerado apenas com `presetMaxUno()` (sem Wind3) é parseável pelo
  PostCSS e não contém `[object Object]`.
