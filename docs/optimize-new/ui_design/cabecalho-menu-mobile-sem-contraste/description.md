# Cabeçalho do menu móvel usa texto de superfície clara sobre shell escuro

## Resumo

O cabeçalho de `MaxSideMenuMobile` mantém fundo azul-petróleo escuro em ambos os temas, mas aplica tokens `background-*` que só se tornam claros quando `.dark` está ativo. No tema claro, nome e metadados ficam escuros sobre o shell escuro.

## Severidade e prioridade

- Severidade: alta
- Prioridade: P1

## Evidências

- `src/components/MaxSideMenuMobile.vue:224-240`: header usa `--layout-shell-bg` (`#003048`).
- `src/components/MaxSideMenuMobile.vue:256-277`: nome, subtexto e chevron usam `--background-775` e `--background-650`.
- `src/themes/colors.scss:751-756`: no claro esses tokens valem `#74869A` e `#3A4C60`.
- Contrastes calculados sobre `#003048`: nome em `#3A4C60` ≈ 1,57:1; subtexto em `#74869A` ≈ 3,71:1.
- `tests/themes/textColorValidation.test.ts:200-205` valida nomes de tokens, não o par com a superfície real.

## Componentes e consumidores afetados

Cabeçalho do drawer `MaxSideMenuMobile` em aplicações no tema claro.

## Causa-raiz

Tokens invertíveis de texto para superfícies `background-*` foram aplicados a uma superfície institucional fixa e sempre escura. A cor do conteúdo passou a depender do tema global, enquanto seu fundo não depende.

## Impacto visual e funcional

O nome do usuário pode ficar quase invisível e metadados não atingem contraste de texto normal. A hierarquia do cabeçalho móvel diverge do menu desktop e do shell Max.

## Reprodução e verificação

Sem classe `.dark`, abrir o menu móvel e medir as cores computadas do nome, subtexto e chevron contra o fundo do cabeçalho. Repetir com `.dark` para demonstrar a assimetria.

## Direção recomendada

Usar tokens de conteúdo próprios para shell escuro, independentes do esquema, com pares de contraste validados.

## Critérios de aceite

- Nome e metadados atingem 4,5:1 sobre o shell nos dois temas.
- Chevron/ícones atingem 3:1 como gráficos de interface.
- Teste de tema avalia a composição fundo/conteúdo, não apenas o token isolado.

## Contraevidências consideradas

No modo escuro a inversão atual deixa o texto claro e legível; a falha é específica do tema claro, que continua sendo cenário canônico suportado.
