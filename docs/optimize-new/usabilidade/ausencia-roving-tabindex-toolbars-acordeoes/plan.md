# Plano de implementação

## Objetivo e resultado esperado

Expor as barras de código e Markdown como toolbars nomeadas e comunicar o estado dos comandos persistentes, preservando a operação nativa por teclado e o `select` interno.

## Escopo e fora de escopo

- Em escopo: `MaxInputCodeToolbar` e `MaxInputMarkdownToolbar`, nomes, agrupamento, estados e navegação.
- Fora de escopo: acordeões, `MaxChips`, comandos do editor e aumento obrigatório dos controles além do mínimo de 24 px.

## Arquivos a alterar/criar

- `src/components/MaxInputCodeToolbar.vue`
- `src/components/MaxInputMarkdownToolbar.vue`
- `src/helpers/useToolbarNavigation.ts` (se o roving compartilhado for adotado)
- `tests/components/MaxInputCodeToolbar.test.ts`
- `tests/components/MaxInputMarkdownToolbar.test.ts`

## Dependências e ordem

1. Classificar comandos momentâneos e alternáveis em cada toolbar.
2. Implementar o contrato ARIA comum.
3. Adicionar roving compartilhado, sem englobar o `select`.
4. Cobrir estados e teclado nos testes.

## Passos de implementação

1. Adicionar `role="toolbar"` e nome acessível configurável, com defaults “Editor de código” e “Editor de Markdown”.
2. Aplicar `aria-pressed` somente aos toggles persistentes: quebra automática, minimapa e tela cheia no código; marcas/blocos cuja ativação é consultada no editor no Markdown.
3. Manter ações momentâneas como formatar, copiar, desfazer, refazer, limpar e inserir separador/imagem sem `aria-pressed`.
4. Atualizar o estado ARIA reativamente a partir das props e de `editor.isActive`, inclusive após mudança externa da seleção.
5. Implementar roving apenas entre botões habilitados: um `tabindex="0"`, demais `-1`; setas e Home/End movem foco e ignoram desabilitados. O `select` permanece uma parada nativa e Tab continua entrando/saindo da toolbar.
6. Preservar Enter/Espaço nativos e evitar que o controlador dispare comandos durante mera movimentação de foco.

## Migração e compatibilidade

Não alterar props, emits, atalhos nem tamanho visual. A semântica adicional é compatível; se o roving mudar a quantidade de paradas de Tab, registrar o comportamento APG e preservar uma opção interna de desligamento durante a migração caso testes de consumidores revelem dependência.

## Testes

- Unitários: papel/nome, estados `aria-pressed` true/false e ausência em ações momentâneas.
- Integração: atualização após comando/editor, setas/Home/End, salto de disabled e Tab pelo `select`.
- Acessibilidade: apenas um botão da sequência roving em `tabindex="0"`, sem aprisionamento de foco.

## Critérios de aceite mensuráveis

- As duas raízes expõem `role="toolbar"` e nome não vazio.
- 100% dos toggles persistentes expõem o estado correto; 0 ações momentâneas expõem `aria-pressed`.
- Setas/Home/End percorrem apenas botões habilitados e Tab sai da barra.
- Testes dos editores continuam passando.

## Riscos e rollback

O editor pode não notificar mudança de seleção, deixando estado ARIA obsoleto; conectar aos eventos já usados pelo componente e desmontar listeners. Em regressão, manter role/nome/pressed e reverter somente o roving opcional.

## Validação final

Executar as duas suítes, lint/typecheck e um teste manual com teclado e leitor de tela em estados ativos, inativos e desabilitados.
