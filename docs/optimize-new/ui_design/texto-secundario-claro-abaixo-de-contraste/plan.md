# Plano de implementação — separar texto secundário de disabled

## Objetivo e escopo

Criar tokens distintos para conteúdo secundário habilitado e conteúdo desabilitado. Placeholder, ajuda e sublabel habilitados devem atingir ≥4,5:1; ícones acionáveis ≥3:1 nos fundos efetivos.

## Fora de escopo

Não eliminar a escala `background-*`, aumentar tipografia ou aplicar o requisito de contraste de texto habilitado a conteúdo realmente disabled.

## Arquivos

- Alterar `src/themes/tokens.scss` e, somente para aliases necessários, `src/themes/colors.scss`.
- Alterar `InputBase.vue`, `MaxInputCodeToolbar.vue`, `MaxInputMarkdown.vue` e demais usos habilitados inventariados de `--background-650`/`--max-surface-400`.
- Reestruturar `tests/themes/textColorValidation.test.ts` para validar semântica e contraste.

## Dependências e ordem

1. Classificar usos 650/400 em disabled, informativo ou acionável.
2. Definir tokens por papel/tema.
3. Migrar base e componentes.
4. Ativar testes de matriz.

## Passos

1. Inventariar cada uso com fundo, tamanho, peso e estado.
2. Criar tokens `--max-content-secondary`, `--max-content-placeholder`, `--max-content-help` e `--max-content-disabled`.
3. Escolher valores claros/escuros por contraste; não resolver com opacidade.
4. Migrar InputBase e todos os textos habilitados; manter disabled no token próprio.
5. Migrar ícones acionáveis de toolbar para token de ação/foco adequado.
6. Calcular contraste de pares resolvidos em testes e manter teste nominal apenas como complemento.
7. Verificar estados error/caution/success para que ajuda semântica não seja sobrescrita.

## Migração e testes

Tokens são aditivos; aliases antigos continuam públicos. Overrides de `background-650` não devem ser exigidos para conteúdo novo. Testes unitários/visuais cobrem placeholder, ajuda, sublabel, blockquote e toolbar em claro/escuro/disabled; a11y mede razões. Benchmark não se aplica.

## Aceite

Textos informativos habilitados ≥4,5:1, ícones acionáveis ≥3:1, disabled separado, nenhum uso habilitado inventariado permanece em token insuficiente, e matriz automatizada passa.

## Riscos e rollback

Escurecer tudo pode destruir hierarquia; separar papéis. Fundo contextual pode variar; testar cada superfície. Rollback ajusta tokens por papel, não volta a compartilhar disabled/informativo.

## Validação final

Inventário sem pendências, testes de contraste resolvido, screenshots claro/escuro, zoom/baixa luminosidade manual, suíte, stylelint e `git diff --check`.
