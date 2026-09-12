# Fluxo de arquivo mantém escolha e remoção exclusivas de ponteiro

## Resumo
`MaxInputFile` oculta o input nativo e delega escolha e remoção a `div`s clicáveis sem foco ou teclado.

## Severidade e prioridade
Alta — P1. WCAG 2.1.1 e 3.3.3.

## Evidências
- `src/components/MaxInputFile.vue:2-11`: chooser em `div @click`; input com `display:none`.
- `src/components/MaxInputFile.vue:58-65`: remoção em `div` sem papel, nome ou teclado.

## Afetados
`MaxInputFile`.

## Causa-raiz
Drag-and-drop/click foi tratado como área visual e o controle nativo foi removido da árvore de foco sem substituto completo.

## Impacto e reprodução
Com teclado, não é possível abrir o chooser nem remover preview em `MaxInputFile`.

## Direção de correção
Usar `label`/botão nativo associado ao file input e botão nomeado para remoção; manter drop e colagem como métodos adicionais.

## Critérios de aceite
Escolher, revisar e remover funcionam com teclado e leitor; disabled é respeitado; estados são anunciados.

## Contraevidências
`MaxInputFileUploadBig.vue:2-11` e os botões principais de `MaxInputFileUpload.vue:16-40` implementam teclado/nome e servem de base. Os rótulos clicáveis de `MaxInputFileUpload.vue:43-50,63-74` são redundantes com o botão “Escolher arquivos” já operável, por isso não sustentam a alegação de ação exclusivamente por ponteiro.
