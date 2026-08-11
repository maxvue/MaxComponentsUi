# 24 — MaxModal: `show`/`hide` expostos não funcionam

**Severidade:** Média
**Categoria:** Bug de API
**Arquivos:** `src/components/MaxModal.vue:118-121, 296+`

## Problema

```ts
const hide = modal_store.hide;
const show = modal_store.show;   // assinatura: show(id: string)
defineExpose({ toggle, is_show, show, hide, open, close });
```

- Consumidor chamando `modalRef.show()` grava `show_id = undefined` e **não abre o modal**.
- `hide()` fecha sem animação nem atualizar `intent`, deixando o estado interno dessincronizado (um `open()` seguinte pode ser descartado).
- `open`/`close` já existem e funcionam.

Também: `id = ref(Random())` sem namespace — colisão improvável mas possível entre modais (dois abririam juntos).

## Correção sugerida

Expor `show: open` e `hide: close` (aliases), removendo o repasse cru da store. Usar `useId()` para o id.
