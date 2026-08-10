# Escala de z-index dos overlays é inconsistente: modal (59) fica abaixo de popover (99) e toast (9999)

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxModal.vue:278`, `src/components/MaxPopover.vue:176`, `src/components/MaxPopover.vue:235`, `src/components/MaxPopoverConfirm.vue:73`, `src/components/MaxToast.vue:75`, `src/components/MaxDrawer.vue:136`
- **Domínio:** overlays-navegacao

## Problema

Os valores de `z-index` dos overlays foram definidos isoladamente em cada componente, sem uma escala compartilhada:

| Componente | Seletor | z-index | Linha |
|---|---|---|---|
| `MaxModal` | `.background-modal` | `59` | `MaxModal.vue:278` |
| `MaxDrawer` | máscara (computed) | `baseZIndex + 60` | `MaxDrawer.vue:136` |
| `MaxPopover` | `.background-popover` | `99 !important` | `MaxPopover.vue:176` |
| `MaxPopover` | `.popover-item` (wrapper teleportado) | `9999 !important` | `MaxPopover.vue:235` |
| `MaxPopoverConfirm` | `.background-popover-confirm` | `3` | `MaxPopoverConfirm.vue:73` |
| `MaxToast` | `.max-toast-container` | `9999` | `MaxToast.vue:75` |

Problemas concretos:

1. **`MaxPopoverConfirm` com z-index 3** — o popover de confirmação é teleportado/renderizado no nível da aplicação e fica **abaixo** de qualquer modal (59), drawer (60) ou popover (99). Um `MaxButtonConfirm` / `MaxIconConfirm` acionado de dentro de um `MaxModal` terá sua confirmação renderizada atrás da máscara do modal — invisível e não clicável.
2. **`MaxPopover` (99) acima do `MaxModal` (59)** — o popover teleportado sobrepõe o modal. Isso pode ser intencional (popover disparado de dentro do modal), mas não está documentado e é acidental, pois `.popover-item` usa `9999 !important` e `.background-popover` usa `99 !important` — dois valores para o mesmo overlay, com `!important` impedindo qualquer ajuste pelo consumidor.
3. **Toast em 9999** empata com `.popover-item`, deixando a ordem indefinida (dependente da ordem no DOM).

Apenas o `MaxDrawer` expõe controle ao consumidor (`baseZIndex` / `autoZIndex`, linhas 86-88 e 136). Nenhum outro overlay permite ajuste.

## Impacto

Confirmações (`MaxPopoverConfirm`) acionadas de dentro de modais/drawers ficam completamente inacessíveis — o usuário clica em "excluir", nada aparece e a ação nunca é confirmada. O uso de `!important` no `MaxPopover` impede que a aplicação consumidora corrija o problema por CSS.

## Plano de correção

1. Definir uma escala única de camadas como variáveis CSS no tema (`src/styles/style.ts` ou um `_layers.scss` importado pelos componentes):
   - `--max-z-drawer: 1000`
   - `--max-z-modal: 1100`
   - `--max-z-popover: 1200`
   - `--max-z-confirm: 1300`
   - `--max-z-toast: 1400`
2. Substituir os literais em cada componente pela variável correspondente, removendo os `!important` de `MaxPopover.vue:176` e `MaxPopover.vue:235` (manter um único z-index no wrapper `.popover-item` e deixar `.background-popover` sem z-index próprio).
3. Elevar `.background-popover-confirm` (`MaxPopoverConfirm.vue:73`) para `--max-z-confirm`, garantindo que confirmações sempre apareçam acima de modais e drawers.
4. Manter `baseZIndex`/`autoZIndex` do `MaxDrawer` funcionando, apenas mudando a base de `60` para a variável.
5. Documentar a escala no `CLAUDE.md` ou no README de temas.

## Verificação

- Teste de integração em `tests/components/MaxModal.test.ts` (ou um novo `tests/components/overlays-stacking.test.ts`): montar um `MaxModal` aberto contendo um `MaxIconConfirm`, acionar a confirmação e afirmar que o `z-index` computado do `.background-popover-confirm` é maior que o do `.background-modal`.
- Verificação manual no `npm run dev:playground`: abrir modal → acionar confirm → a confirmação deve estar visível e clicável.
- `npm run lint` (Stylelint) para garantir que a remoção dos `!important` não quebra as regras de estilo.
