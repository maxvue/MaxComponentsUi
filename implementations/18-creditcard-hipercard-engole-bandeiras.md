# 18 — MaxCreditCard: detecção de bandeira classifica Diners/Discover como Hipercard

**Severidade:** Média
**Categoria:** Bug / Regra de negócio
**Arquivos:** `src/components/MaxCreditCard.vue:132-143`

## Problema

Na detecção de bandeira, `hipercard /^(38|60)/` vem antes de `diners /^(30[0-5]|36|38)/` e de `discover /^(6011|65|64[4-9])/`. Prefixo `38` (Diners) e `6011` (Discover) caem sempre em hipercard; os branches seguintes para esses prefixos são inalcançáveis.

```ts
if (/^(38|60)/.test(digits)) return 'hipercard';
if (/^(30[0-5]|36|38)/.test(digits)) return 'diners';
if (/^(6011|65|64[4-9])/.test(digits)) return 'discover';
```

## Correção sugerida

Usar prefixos hipercard reais (`6062`, `384100`, `384140`, `384160`) e ordenar do mais específico para o mais genérico. Alternativa: delegar a `card-validator`/`@polvo-labs/card-type`, já usados no ecossistema.
