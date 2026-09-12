# Plano de implementação — feedback local e responsivo no upload grande

## Objetivo e resultado esperado

Substituir os Lotties remotos com fundo vermelho por feedback local tokenizado, responsivo e utilizável com movimento reduzido, preservando slots e interação do upload.

## Escopo e fora de escopo

- Escopo: defaults de uploading/error, responsividade, temas, reduced motion e testes reais sem stub de Lottie.
- Fora: remover `@lottiefiles/dotlottie-vue` de outros componentes, alterar fluxo de seleção ou eliminar slots customizados.

## Arquivos-alvo

- `src/components/MaxInputFileUploadBig.vue`.
- `tests/components/MaxInputFileUploadBig.test.ts` e `tests/unit/MaxInputFileUploadBig.spec.ts` (consolidar duplicação se possível).
- Playground/baselines do componente após o plano do catálogo.

## Dependências e ordem

1. Fixar estados default em teste sem stubs.
2. Trocar assets externos por componentes locais.
3. Aplicar responsividade/reduced motion.
4. Preservar e testar slots.

## Passos detalhados

1. Remover `DotLottieVue` e URLs `lottie.host` do default.
2. Para uploading, usar `MaxLoaderIcon` local, texto “Carregando arquivos” e `role=status`; para erro, usar `MaxErrorIcon`/ícone semântico e mensagem com `role=alert`.
3. Dimensionar o bloco com `inline-size: min(...)`, `max-inline-size: 100%`, padding e `box-sizing`, sem largura/altura inline fixa.
4. Usar `--max-primary-*`, `--max-danger-*` e superfícies do tema; nenhum fundo vermelho de depuração.
5. Em `prefers-reduced-motion: reduce`, parar rotação/animação não essencial mantendo ícone e texto distinguíveis.
6. Preservar precedência e conteúdo dos slots `uploading`/`error` sem impor estilos internos ao slot do consumidor.

## Migração e compatibilidade

- Props, callbacks, slots, teclado e drop permanecem.
- Default deixa de depender de rede/WASM; consumidores com slots não mudam.
- A remoção do import dinâmico pode reduzir bundle/chunk, mas não é critério para remover a dependência global enquanto houver outros usos.

## Testes pertinentes

- Renderizar uploading/error default reais e afirmar ausência de URL externa, `background=red` e overflow em container de 240 px.
- Verificar roles/labels, ícones e contraste em claro/escuro.
- Emular reduced motion e afirmar animação desativada sem sumir com estado.
- Confirmar slots customizados, disabled, clique, Enter/Espaço e drop.
- Screenshot 240/320/desktop; benchmark compara zero request externo e zero carregamento do player neste componente.

## Critérios de aceite

- Zero referência a `lottie.host`, `background="red"` ou dimensão 300 px no componente.
- Estados cabem em 240 px sem overflow horizontal.
- Loading/erro continuam distinguíveis em ambos os temas e reduced motion.
- Nenhum chunk/player Lottie é solicitado por `MaxInputFileUploadBig` default.
- Testes, stylelint, type-check e build passam.

## Riscos, rollback e validação final

- Risco: perda de expressividade ou slot receber regra indevida. Mitigar com hierarquia icon+texto e escopo de CSS restrito ao fallback.
- Rollback: ajustar o fallback local/asset empacotado; não restaurar dependência remota essencial.
- Validar rede offline, 240 px, temas, reduced motion, teclado, slots e build.
