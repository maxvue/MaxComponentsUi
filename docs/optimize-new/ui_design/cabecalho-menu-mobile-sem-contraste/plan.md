# Plano de implementação — contraste do cabeçalho móvel

## Objetivo e resultado esperado

Usar os tokens próprios do shell escuro no perfil de `MaxSideMenuMobile`, mantendo nome/metadados legíveis nos temas claro e escuro e alinhados ao menu desktop.

## Escopo e fora de escopo

- Escopo: nome, subtexto, chevron, avatar e testes de contraste computado.
- Fora: alterar o fundo institucional, layout do drawer ou paleta `background-*` global.

## Arquivos-alvo

- `src/components/MaxSideMenuMobile.vue`.
- `src/themes/colors.scss` somente se os tokens `--layout-shell-text`/`--layout-shell-text-muted` precisarem ajuste central.
- `tests/components/MaxSideMenuMobile.test.ts`.
- `tests/themes/textColorValidation.test.ts`.

## Dependências e ordem

1. Fixar teste que resolve os pares atuais em claro/escuro.
2. Trocar consumo local para tokens de shell já existentes.
3. Ajustar valor central apenas se contraste medido não atingir WCAG.
4. Comparar visualmente com `MaxUserSection`/menu desktop.

## Passos detalhados

1. Aplicar `--layout-shell-text` ao nome e `--layout-shell-text-muted` ao subtexto/chevron, sempre com fallbacks claros equivalentes.
2. Manter `--layout-shell-bg` como fundo em ambos os temas; não usar rampa invertível para seu conteúdo.
3. Se o muted atual com 70% não atingir 4,5:1 para texto de 0,75 rem, elevar sua opacidade no token central sem afetar o contraste mínimo de ícones.
4. Testar valores resolvidos sob `:root` e `.dark`, incluindo fallback sem stylesheet.

## Migração e compatibilidade

- Sem mudança de props, eventos, markup ou dimensões.
- Tokens de shell já são públicos; eventual ajuste de muted deve ser registrado como correção visual e verificado nos demais consumidores.

## Testes pertinentes

- Calcular contraste do nome/subtexto contra `#003048` nos dois temas: texto normal ≥ 4,5:1.
- Chevron/ícone ≥ 3:1.
- Snapshot visual em viewport móvel claro/escuro, com nomes longos.
- A11y: manter botão/foco/nome acessível; benchmark não se aplica.

## Critérios de aceite

- Os três elementos usam tokens de shell, não `background-*`.
- Contrastes mínimos passam nos dois esquemas e no fallback.
- Menu desktop e móvel compartilham a mesma hierarquia cromática.
- Testes focados, stylelint, suíte e build passam.

## Riscos, rollback e validação final

- Risco: alterar token muted afetar outros shells. Preferir correção central somente após inventário; caso contrário, usar token local semântico.
- Rollback: restaurar apenas o valor do token, nunca o par de baixo contraste.
- Validar CSS computado, claro/escuro, 240/320 px, foco e comparação desktop.
