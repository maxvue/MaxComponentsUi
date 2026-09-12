# Plano de implementação — clamp responsivo para popovers e PDF

## Objetivo e escopo

Manter `MaxPopover`, `MaxPopoverConfirm` e `MaxPdfView` dentro da largura/altura útil em 280 px, landscape, zoom 200% e safe areas. Preservar posicionamento, seta e ações; não redesenhar o visualizador.

## Fora de escopo

Não redesenhar o visualizador, mudar conteúdo/ações ou tratar focus trap; este plano limita-se à geometria responsiva e às safe areas.

## Arquivos

- Alterar os três SFCs.
- Reusar/ampliar `src/helpers/useOverlayWidth.ts` e seus testes quando aplicável.
- Alterar testes dos componentes e criar testes browser responsivos.

## Dependências e ordem

1. Definir viewport útil/safe area.
2. Corrigir helper e popovers.
3. Reestruturar PDF.
4. Testar viewports/zoom/orientação.

## Passos

1. Aplicar `box-sizing: border-box` e largura `min(300px, viewport útil)` com margens/tokens.
2. Calcular left/top após o clamp e reposicionar/ocultar seta quando não puder apontar sem overflow.
3. Limitar altura a `100dvh` menos safe areas, com scroll interno e ações alcançáveis.
4. No PDF, substituir grid central de 60vw por `min/max/clamp` responsivo e usar `dvh`/`env(safe-area-inset-*)`.
5. Tornar toolbar flexível/quebrável ou sticky, mantendo área mínima de toque.
6. Testar conteúdo longo, bordas e scrollbar, não apenas geometria vazia.

## Migração e testes

Sem props/emits novos. Layout desktop mantém largura esperada; mobile passa a encolher. Unitários testam helper/clamps; integração browser mede bounding rect em 280/320/768 px, landscape e zoom; a11y verifica foco/ações visíveis. Benchmark não é necessário.

## Aceite

Nenhum rect ultrapassa viewport útil; zero scroll horizontal de página; toolbar e botões permanecem visíveis/operáveis; PDF usa largura disponível maior que o antigo centro estreito em mobile.

## Riscos e rollback

Safe areas variam e `dvh` requer fallback; declarar `vh` antes. Conteúdo intrínseco pode forçar overflow; usar `min-width:0`/wrap. Rollback restaura desktop via media query sem remover clamp mobile.

## Validação final

Testes de helper/componentes, screenshots responsivos, teclado/touch/zoom, Safari/iOS ou emulação, suíte, stylelint e `git diff --check`.
