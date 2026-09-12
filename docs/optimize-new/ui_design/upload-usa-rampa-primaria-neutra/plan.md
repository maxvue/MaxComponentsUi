# Plano de implementação — alinhar upload à marca teal

## Objetivo e escopo

Migrar CTA, spinner, hover e dragover de `MaxInputFileUpload` dos aliases neutros `--primary-*` para `--max-primary-*`, com foreground/contraste validados. Preservar aliases globais e classes legadas.

## Fora de escopo

Não remover aliases `--primary-*`, alterar transporte/seleção de arquivos ou redesenhar estados; somente papéis de ação da marca serão migrados.

## Arquivos

- Alterar `src/components/MaxInputFileUpload.vue`.
- Alterar testes do componente e testes de tema/contraste.
- Atualizar documentação apenas se citar tokens internos do upload.

## Dependências e ordem

1. Mapear cada uso por papel.
2. Trocar apenas ações/estados de marca.
3. Validar foreground/hover nos temas.
4. Coordenar com tokens de conteúdo de botão.

## Passos

1. Classificar usos de `--primary-500`, `--primary-c` e `--primary-mouse` no componente.
2. Aplicar `--max-primary-500` no CTA/spinner/dragover e `--max-primary-600` no hover, usando token foreground aprovado.
3. Não substituir usos realmente neutros nem editar `colors.scss`.
4. Garantir ícones/spinner via `currentColor` e estados loading/disabled distinguíveis.
5. Testar CSS computado com temas distribuídos e overrides dos tokens de marca.
6. Criar regressão estática que proíba aliases neutros em papéis de ação do upload.

## Migração e testes

Sem mudança de API. Overrides de aliases neutros deixam de afetar a ação; consumidores devem customizar `--max-primary-*`. Unitários cobrem classes/estados; integração visual cobre idle, hover, dragover, loading e disabled; a11y mede 4,5:1 para texto e 3:1 para componentes gráficos. Benchmark não se aplica.

## Aceite

CTA/spinner/dragover resolvem para teal canônico em claro/escuro; nenhum papel de ação usa aliases neutros; contraste passa; aliases públicos continuam definidos.

## Riscos e rollback

Foreground atual pode falhar no teal; usar token de conteúdo semântico. Seletor dragover pode ter especificidade distinta; testar evento real. Rollback restaura por estado somente enquanto se ajusta o novo token, sem remover aliases.

## Validação final

Testes do upload/tema, CSS computado e snapshots dos estados, suíte, stylelint, type-check e `git diff --check`.
