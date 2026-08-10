# Falta de teste: limites de fronteira das coordenadas de latitude e longitude

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `tests/components/MaxInputCoordinateDecimalLat.test.ts`, `tests/components/MaxInputCoordinateDecimalLng.test.ts`, `src/components/MaxInputCoordinateDecimalLat.vue:47-50`, `src/components/MaxInputCoordinateDecimalLng.vue:47-50`
- **Domínio:** inputs-texto

## Problema

Ambos os componentes validam a coordenada por uma faixa que aproxima o território brasileiro:

```ts
// Lat:49
return !(only_numbers.value < -33.8 || only_numbers.value > 5.3 || only_numbers.value === 0 || isNaN(only_numbers.value));
// Lng:49
return !(only_numbers.value <= -74 || only_numbers.value > -32.4 || only_numbers.value === 0 || isNaN(only_numbers.value));
```

Os testes só usam valores bem no meio da faixa (`-23.5`, `-46.6`) ou bem fora dela (`100`). **Nenhum valor de fronteira é testado**, apesar de a faixa ter quatro extremos por componente e de os operadores serem assimétricos entre os dois arquivos:

- Lat usa `< -33.8` (inclusivo em -33.8) e `> 5.3` (inclusivo em 5.3)
- Lng usa `<= -74` (**exclusivo** em -74) e `> -32.4` (inclusivo em -32.4)

Essa assimetria (`<` vs `<=`) não está documentada nem coberta — pode ser intencional ou um deslize, e hoje não há como saber pelo teste.

Casos ausentes, por componente:

**Latitude:** `-33.8` (deve ser válido), `-33.81` (inválido), `5.3` (válido), `5.31` (inválido), `0` (inválido por regra explícita), valor não numérico → `NaN`.
**Longitude:** `-74` (inválido pela regra atual), `-73.99` (válido), `-32.4` (válido), `-32.39` (inválido), `0` (inválido), `NaN`.

O caso `only_numbers === 0` merece destaque: uma coordenada exatamente `0` é geograficamente legítima (Golfo da Guiné), mas aqui é tratada como "campo vazio". Isso é uma decisão de produto razoável para um app brasileiro, mas está implícita no código e sem teste que a registre como intencional.

Nenhum dos dois arquivos testa `NaN` explicitamente, embora `isNaN(only_numbers.value)` seja um dos quatro termos da condição.

## Impacto

A faixa de validação é a única barreira contra uma coordenada absurda ser gravada. Sem testes de fronteira, um ajuste de limite (ou a troca de `<` por `<=`) passa sem detecção, e a divergência de inclusividade entre Lat e Lng permanece indefinida — não dá para distinguir bug de intenção.

## Plano de correção

1. Adicionar, em cada arquivo de teste, um bloco `describe('limites da faixa', ...)` com `it.each` cobrindo os seis casos listados acima por componente, afirmando `wrapper.vm.done`.
2. Adicionar caso de `NaN`: setar `temp_value` para um valor não numérico e afirmar `done === false`.
3. Adicionar caso de `0` explícito, com um comentário no teste registrando que é decisão intencional (tratado como vazio), para que o teste sirva de documentação.
4. Decidir sobre a assimetria `< -33.8` vs `<= -74`: alinhar os dois operadores ou registrar em comentário no código por que diferem. Fazer isso **antes** de escrever os testes de fronteira, para que os testes travem o comportamento correto e não o atual por inércia.

## Verificação

- `npx vitest run tests/components/MaxInputCoordinateDecimalLat.test.ts tests/components/MaxInputCoordinateDecimalLng.test.ts`.
- Checagem de mutação: alterar `-33.8` para `-30` no código e confirmar que a suíte falha.
- `npm run test:coverage` e conferir que os branches de `done` nos dois componentes ficam integralmente cobertos.
