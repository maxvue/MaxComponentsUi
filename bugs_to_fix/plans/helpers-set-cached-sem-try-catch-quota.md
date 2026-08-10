# `setCached()` não trata `QuotaExceededError` nem localStorage indisponível

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/helpers/setCached.ts:1-6`, `src/helpers/getCached.ts:4-12`
- **Domínio:** helpers-composables

## Problema

`getCached` protege a leitura com `try/catch` (linhas 4-12), mas `setCached` escreve sem nenhuma proteção:

```ts
// src/helpers/setCached.ts:1-6
export function setCached(key: string | null, data: any) {
    if (!key) return;
    const data_save = { key: key, data: data };
    const clean_data = JSON.stringify(data_save);
    localStorage.setItem(key, clean_data);
}
```

Três falhas concretas:

1. `localStorage.setItem` lança `QuotaExceededError` quando o storage está cheio. A exceção sobe para o chamador, que hoje trata cache como operação best-effort (evidenciado pelo `catch` do lado da leitura).
2. `JSON.stringify` lança `TypeError` em referências circulares — plausível para `data: any` vindo de um payload de API já hidratado.
3. Em Safari no modo privado e em SSR, o acesso a `localStorage` lança de saída (`SecurityError` / `ReferenceError`). `getCached` sobrevive; `setCached` não.

A assimetria entre os dois arquivos é o achado: eles formam um par e têm contratos de robustez diferentes.

## Impacto

Uma escrita de cache que falhe derruba o fluxo do chamador (ex.: um `.then()` de fetch de ícone/rota), transformando um cache indisponível em erro de aplicação visível para o usuário final da app consumidora — quando o comportamento correto e já assumido pelo par é degradar silenciosamente.

## Plano de correção

1. Envolver o corpo de `setCached` em `try/catch`, registrando via `console.error` no mesmo formato de `getCached.ts:10` (`'Erro ao gravar localStorage:'`).
2. Avaliar retornar `boolean` indicando sucesso, para chamadores que queiram reagir — mantendo compatibilidade (hoje o retorno é `void`, então `boolean` é aditivo).
3. Considerar tipar `data` como `unknown` em vez de `any` (ver achado `helpers-tipos-any-em-cache.md`).

## Verificação

- Testes a criar/ajustar: `tests/helpers/cached.test.ts` — adicionar caso em que `localStorage.setItem` é mockado para lançar (`vi.spyOn(localStorage,'setItem').mockImplementation(() => { throw new Error('QuotaExceeded'); })`) e assertar que `setCached` não propaga a exceção.
- Comandos: `npx vitest run tests/helpers/cached.test.ts`, `npm run type-check`, `npm run lint`
