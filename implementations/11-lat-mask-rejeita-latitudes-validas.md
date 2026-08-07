# 11 — MaxInputCoordinateDecimalLat: máscara rejeita latitudes válidas e trava no modo negativo

**Severidade:** Alta
**Categoria:** Bug / Regra de negócio
**Arquivos:** `src/components/MaxInputCoordinateDecimalLat.vue:66-83`

## Problema

1. A máscara positiva é `'33.######'` com token `'3': { pattern: /[0-3-]/ }`. Os dois primeiros dígitos só aceitam 0–3, mas o range validado pelo `done` vai até **+5.3** (norte do Brasil). Latitudes 4.x e 5.x são válidas pela validação mas **fisicamente impossíveis de digitar**.

2. `negative` (linha 83) vira `true` ao digitar `-` e **nunca reseta** — depois de um valor negativo, a máscara fica presa em `'-39.######'` mesmo apagando tudo.

```ts
'3': { pattern: /[0-3-]/, optional: true }
...
mask: negative.value ? '-39.######' : '33.######',
```

## Correção sugerida

- Token `/[0-5-]/` (ou máscara sem restrição de primeiro dígito, validando só no `done`).
- Resetar `negative.value = false` quando o valor não começa com `-`.
