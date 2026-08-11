# 07 — useIconStore: JSON.parse do localStorage sem try/catch quebra todos os ícones

**Severidade:** Alta
**Categoria:** Bug / Robustez
**Arquivos:** `src/stores/useIcon.Store.ts:20-24`

## Problema

```ts
const data = localStorage.getItem('all_icons');
if (data) icons_data.value = JSON.parse(data);
```

Se o `localStorage` estiver corrompido, o `JSON.parse` lança e quebra `getIcon()` — e como `getIcon` é chamado dentro do computed `svgContent` do `MaxIcon`, **todo ícone da aplicação quebra** permanentemente até o usuário limpar o storage manualmente.

Adicionalmente, o cache é ilimitado (cresce para sempre) e não tem versionamento nem TTL.

## Correção sugerida

- Envolver em `try/catch` com `localStorage.removeItem('all_icons')` no catch.
- Adicionar versão de cache (ex.: chave `all_icons_v2` ou campo `__version`) e limite/TTL.
