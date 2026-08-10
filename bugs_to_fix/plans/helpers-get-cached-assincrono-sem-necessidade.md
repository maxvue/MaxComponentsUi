# `getCached()` é `async` sem nenhuma operação assíncrona e retorna `Promise<any>`

- **Categoria:** melhoria
- **Severidade:** baixa
- **Arquivo(s):** `src/helpers/getCached.ts:1-13`
- **Domínio:** helpers-composables

## Problema

```ts
// src/helpers/getCached.ts:1
export async function getCached(key: string | null): Promise<any> {
```

O corpo inteiro é síncrono: `localStorage.getItem` (linha 5), `JSON.parse` (linha 8). Não há `await` em lugar nenhum. O `async` força todo chamador a `await`/`.then()`, adiando o valor por um microtask sem ganho algum, e o retorno `Promise<any>` apaga qualquer tipagem do lado do consumidor.

Além disso, `JSON.parse(data).data` (linha 8) assume cegamente que o valor armazenado tem o envelope `{ key, data }` produzido por `setCached`. Uma chave gravada por outro código (ou por uma versão anterior do envelope) faz `.data` devolver `undefined` — que é distinto do `null` retornado nos caminhos de erro (linhas 2, 6, 11), mas o contrato declarado não distingue os dois.

## Impacto

- Chamadores pagam um tick assíncrono desnecessário em um caminho quente (leitura de cache antes de renderizar).
- `Promise<any>` obriga o consumidor a fazer cast manual, perdendo verificação de tipos no ponto de uso — contrário ao padrão do restante da lib, que tipa retornos (ex.: `useVirtualList`, `useInputValidation`).
- O retorno `undefined` para um envelope inesperado não é coberto por teste nem documentado.

## Plano de correção

1. Avaliar remover o `async` e tornar a função síncrona (`getCached<T = unknown>(key: string | null): T | null`). É uma quebra de assinatura, então confirmar chamadores antes — hoje não há chamador dentro de `src/` além dos testes.
2. Se a assinatura assíncrona precisar ser mantida por compatibilidade externa, ao menos parametrizar o genérico: `getCached<T = unknown>(key): Promise<T | null>`.
3. Normalizar o retorno para `null` quando o envelope não tiver a propriedade `data`, alinhando com os demais caminhos de falha.
4. Documentar com JSDoc o formato do envelope `{ key, data }` compartilhado com `setCached`.

## Verificação

- Testes a criar/ajustar: `tests/helpers/cached.test.ts` — caso com valor gravado fora do envelope (ex.: `localStorage.setItem('k', '"raw"')`) assertando `null`.
- Comandos: `npx vitest run tests/helpers/cached.test.ts`, `npm run type-check`, `npm run lint`
