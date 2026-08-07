# 12 — Coordenadas Lat/Lng: erro em campo vazio, done invertido e tipos de emissão divergentes

**Severidade:** Alta
**Categoria:** Bug / Divergência de regra de negócio
**Arquivos:** `src/components/MaxInputCoordinateDecimalLat.vue:47-62, 80-89`, `src/components/MaxInputCoordinateDecimalLng.vue:49, 59-63, 79-84`

## Problemas

1. **Lat — erro em campo vazio não obrigatório:** `error` retorna `'Latitude inválida.'` sempre que `!done.value`, e `done` é `false` para campo vazio. Campo pristino, vazio e não-obrigatório já renderiza em vermelho:

```ts
const error = computed(() => {
    if (isBlank(temp_value.value) && props.required) return 'Campo obrigatório';
    if (!done.value) return 'Latitude inválida.';
    return false;
});
```

2. **Lng — done invertido:** campo **obrigatório e vazio** retorna `done = true` (check verde): `if (isBlank(temp_value.value) && props.required) return true;`. O Lat, componente irmão, não tem essa linha — divergência entre os dois.

3. **Tipos de emissão divergentes:** Lng emite `toNumber(temp_value.value, 6)` (número); Lat emite `temp_value.value` cru (string mascarada). Um par lat/lng no mesmo form produz tipos diferentes no payload.

## Correção sugerida

- Lat: retornar `false` no `error` quando `isBlank && !required`; exibir erro só após blur.
- Lng: remover a linha do `done = true` para vazio+required.
- Lat: emitir `toNumber(temp_value.value, 6)` como o Lng.
