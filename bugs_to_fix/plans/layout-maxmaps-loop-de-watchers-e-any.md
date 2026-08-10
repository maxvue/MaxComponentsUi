# MaxMaps encadeia watchers redundantes e recria marker_options a cada mudança

- **Categoria:** performance
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxMaps.vue:23`, `src/components/MaxMaps.vue:25-30`, `src/components/MaxMaps.vue:52-60`, `src/components/MaxMaps.vue:37`, `src/components/MaxMaps.vue:47`, `src/components/MaxMaps.vue:57`
- **Domínio:** tabela-layout-exibicao

## Problema

Existem **três** watchers sobre o mesmo par de coordenadas, formando um ciclo emissão↔recepção:

- Linha 23: `watch([lat, lng]) => emit('update:modelValue', coordinates.value)`
- Linhas 25-30: `watch(props.modelValue)` → escreve de volta em `coordinates`
- Linhas 52-60: `watch([lat, lng])` → recria `center` e `marker_options`

O ciclo só não é infinito por causa do guard `is_different` (linha 27), que compara com `Number(...)`. Mas o guard é frágil: `props.modelValue?.latitude && props.modelValue?.longitude` (linha 26) trata `0` como inválido — uma coordenada legítima na linha do Equador ou no meridiano de Greenwich é **rejeitada**, e a sincronização externa para de funcionar naquele eixo.

O terceiro watcher recria integralmente `marker_options` (linhas 54-59) a cada movimento, incluindo uma **nova closure** `click: function (_e) {}` — uma função vazia, sem uso, realocada a cada atualização. Durante um arrasto do marcador isso dispara em alta frequência, forçando o `vue3-google-map` a reconciliar as opções do marker a cada frame.

O `emit` da linha 23 também emite a **referência** `coordinates.value` (objeto reativo compartilhado), em vez de uma cópia — o consumidor recebe um objeto que o componente continua mutando por baixo.

Além disso, o componente usa `any` em três pontos (`click: function (_e: any)` nas linhas 37 e 57, e `onDrag(event: any)` na linha 47), contrariando a convenção de tipagem do projeto.

## Impacto

- Coordenada `0` (Equador/Greenwich) quebra a sincronização com `v-model`.
- Realocação de objetos e closures a cada frame de arrasto — reconciliação desnecessária do marcador.
- O objeto emitido é mutável por referência, permitindo que o pai observe mudanças que não emitiu.
- `any` em três assinaturas, sem tipos do `vue3-google-map`.

## Plano de correção

1. Corrigir o guard de validade para aceitar `0`:
   ```ts
   const is_valid = Number.isFinite(Number(props.modelValue?.latitude)) && Number.isFinite(Number(props.modelValue?.longitude));
   ```
2. Colapsar os watchers: derivar `center` e `marker_options` como `computed` a partir de `coordinates`, eliminando o watcher das linhas 52-60.
3. Remover a closure `click` vazia de `marker_options` — não tem efeito e força realocação.
4. Emitir uma cópia: `emit('update:modelValue', { ...coordinates.value })`.
5. Tipar `onDrag` com o tipo de evento do Google Maps (`google.maps.MapMouseEvent`, disponível via `@types/google.maps`) em vez de `any`.

## Verificação

- Teste com `modelValue: { latitude: 0, longitude: 0 }` seguido de `{ latitude: 0, longitude: 10 }`, asserindo que `coordinates` acompanha.
- Teste asserindo que o objeto emitido não é a mesma referência de `coordinates.value`.
- `npx vitest run tests/components/MaxMaps.test.ts` e `npm run type-check`.
