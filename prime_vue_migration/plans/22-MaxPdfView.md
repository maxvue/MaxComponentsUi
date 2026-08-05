# Plano 22 — `MaxPdfView` (troca de `ProgressSpinner`)

| | |
|---|---|
| **id** | 22 |
| **Arquivo** | `src/components/MaxPdfView.vue` |
| **Primitiva eliminada** | `ProgressSpinner` |
| **Depende de** | 3 (`MaxBaseSpinner`) |
| **Teste existente** | `tests/components/MaxPdfView.test.ts` |

O item mais trivial da migração: uma linha de import e uma tag.

---

## 1. A mudança

```diff
- import ProgressSpinner from 'primevue/progressspinner';
+ import MaxBaseSpinner from './base/MaxBaseSpinner.vue';
```

```diff
- <ProgressSpinner />
+ <MaxBaseSpinner />
```

Nada mais. Toda a lógica de renderização de PDF permanece intocada.

---

## 2. Verificações

```bash
grep -n "ProgressSpinner" src/components/MaxPdfView.vue   # confirme que só há esses 2 pontos
grep -n "primevue" src/components/MaxPdfView.vue          # após a mudança: vazio
npx vitest run tests/components/MaxPdfView.test.ts
```

Se o teste existente procurar por `.p-progressspinner`, ele **continua passando** — o
`MaxBaseSpinner` emite essa classe de propósito.

### Ampliação do teste

1. durante o carregamento, o spinner é renderizado;
2. após carregar, o spinner some;
3. o spinner renderizado é o `MaxBaseSpinner` (verifique ausência de qualquer
   componente PrimeVue no `wrapper.html()`).

---

## 3. Checklist

- [ ] `grep -n "primevue" src/components/MaxPdfView.vue` → vazio
- [ ] Diff contém apenas 2 linhas alteradas
- [ ] Teste existente passa
- [ ] Verificado no playground que o spinner aparece durante o carregamento
- [ ] `type-check`, `lint`, `test` OK
