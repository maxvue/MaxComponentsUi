# 33 — tests/setup.ts: mocks globais que escondem bugs

**Severidade:** Média
**Categoria:** Testes / Infraestrutura
**Arquivos:** `tests/setup.ts:28-45, 48-54, 57-71, 83-86`

## Problemas

- `getComputedStyle` devolve valores fixos para 6 variáveis CSS e `''` para todo o resto — componentes que leem qualquer outra var do tema passam silenciosamente com string vazia.
- `fetch` global sempre resolve `{}` com `ok: true` — caminhos de erro do `useIconStore` nunca são exercitados e URL errada passa despercebida.
- `indexedDB` devolve um request cujos callbacks nunca disparam — código de cache IDB fica pendente eterno sem nenhum teste perceber.
- Diretivas `tooltip`/`maska` stubadas como `{}` — máscaras nunca são validadas em teste (relevante para os inputs de cartão sem teste, achado 31).

## Correção sugerida

Manter os mocks como default, mas: `getPropertyValue` de var desconhecida emite warning; criar testes dedicados de caminho de erro para fetch/IDB com `vi.spyOn` local; considerar testar máscaras com a diretiva real do Maska (funciona em happy-dom).
