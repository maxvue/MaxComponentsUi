# `getCssSize()` aceita strings numericamente inválidas e as transforma em CSS quebrado

- **Categoria:** bug
- **Severidade:** baixa
- **Arquivo(s):** `src/helpers/getCssSize.ts:1-4`
- **Domínio:** helpers-composables

## Problema

```ts
// src/helpers/getCssSize.ts:1-4
export function getCssSize(value: string | number): string {
    if (typeof value === 'number') return `${value}px`;
    return /^[0-9.]+$/.test(value) ? `${value}px` : value;
}
```

A regex `^[0-9.]+$` valida "contém apenas dígitos e pontos", não "é um número válido". Casos que passam e produzem CSS inválido:

- `getCssSize('1.2.3')` → `'1.2.3px'` — a regra CSS inteira é descartada pelo browser.
- `getCssSize('...')` → `'...px'` — idem.
- `getCssSize('.')` → `'.px'` — idem.

E casos numéricos legítimos que **não** passam, sendo devolvidos crus (sem `px`):

- `getCssSize('-10')` → `'-10'` (margem negativa é uso válido e comum) — o `-` não está na classe de caracteres.
- `getCssSize('1e3')` → `'1e3'`.
- `getCssSize(' 10 ')` (com espaços, ex.: vindo de um atributo de template) → `' 10 '`, sem `px`.

Há ainda um caso no ramo numérico: `getCssSize(NaN)` → `'NaNpx'` e `getCssSize(Infinity)` → `'Infinitypx'`, ambos CSS inválido sem nenhum aviso.

O helper é usado em toda a superfície do preset UnoCSS — `presetMaxUno.ts` o chama nas regras de `max-width`, `min-width`, `max-height`, `min-height` e `gap` (linhas 35, 42, 44-51), além de `paddingMargin.ts:7` e `gap.ts:11-15`. É um dos helpers mais exercitados da lib.

O teste existente (`tests/helpers/getCssSize.test.ts`, 28 linhas) cobre o caminho feliz: número → px, string numérica → px, string com unidade → inalterada. Nenhum dos casos acima.

## Impacto

Uma classe utilitária com valor malformado (`w-max-1.2.3`, ou uma margem negativa `m--10`) gera CSS descartado silenciosamente. O desenvolvedor da app consumidora vê o estilo simplesmente não aplicar, sem erro no console nem na build — e o helper é usado em dezenas de regras, então o sintoma é difuso.

## Plano de correção

1. Trocar a regex por uma validação numérica real: `/^-?\d*\.?\d+$/` (cobre negativos, rejeita `1.2.3` e `.`), ou usar `Number.isFinite(Number(value.trim()))`.
2. Aplicar `trim()` na entrada string antes de testar.
3. No ramo numérico (linha 2), guardar contra `NaN`/`Infinity` com `Number.isFinite(value)`, devolvendo string vazia ou `'0px'` — decidir e documentar.
4. Aceitar `-` para suportar margens negativas, que hoje são silenciosamente descartadas.

## Verificação

- Testes a criar/ajustar: `tests/helpers/getCssSize.test.ts` — adicionar: `'1.2.3'`, `'.'`, `'...'`, `'-10'`, `' 10 '`, `NaN`, `Infinity`, `''`.
- Comandos: `npx vitest run tests/helpers/getCssSize.test.ts tests/helpers/gap.test.ts tests/helpers/paddingMargin.test.ts`, `npm run type-check`, `npm run lint`
