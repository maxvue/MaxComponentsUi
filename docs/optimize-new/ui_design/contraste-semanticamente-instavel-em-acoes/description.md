# Contraste de texto instável nas ações semânticas entre os temas claro e escuro

## Resumo

`MaxButton` usa a mesma cor de fundo semântica nos dois temas, mas troca implicitamente a cor do texto por `--background-0`: branco no tema claro e azul-escuro (`#17293D`) no tema escuro. Essa inversão não foi projetada por par de cores. Como resultado, diferentes severidades falham em temas diferentes: no claro, `success`, `info`, `warning`, `danger` e `whatsapp` ficam abaixo de 4,5:1; no escuro, a ação primária e `danger` ficam abaixo de 4,5:1.

## Severidade e prioridade

- Severidade: alta
- Prioridade: P1

## Evidências

- `src/components/MaxButton.vue:126-129`: botão primário combina `--max-primary-500` com `--background-0`.
- `src/components/MaxButton.vue:163-220`: todas as severidades sólidas reutilizam `--background-0` como texto.
- `src/themes/colors.scss:725`: `--background-0` é `#FFF` no tema claro.
- `src/themes/colors.scss:1772`: `--background-0` passa a `#17293D` no tema escuro.
- `src/themes/tokens.scss:21-30`: fundos semânticos são invariantes entre esquemas.
- Contrastes calculados segundo WCAG para o tema claro: primary 5,27:1; success 2,54:1; info 2,77:1; warning 2,15:1; danger 3,76:1; WhatsApp 1,98:1.
- Contrastes contra `#17293D` no tema escuro: primary 2,80:1; success 5,83:1; info 5,33:1; warning 6,88:1; danger 3,93:1; WhatsApp 7,45:1.
- `tests/components/MaxDarkModeContrast.test.ts:44-72` valida apenas a presença textual de tokens; não mede luminância das combinações efetivamente renderizadas.

## Componentes e consumidores afetados

- `MaxButton` e todos os wrappers que o reutilizam (`MaxButtonConfirm`, toolbars, menus, ações de formulário).
- Qualquer aplicação que use severidades `success`, `info`, `warning`, `danger` ou `whatsapp`, sobretudo com labels compactos de 12–14 px.

## Causa-raiz

A rampa `background-*` foi concebida como superfície/texto invertível, enquanto as rampas semânticas foram congeladas como cores independentes de esquema. Usar um token de superfície invertível como cor de conteúdo sem resolver contraste por severidade criou uma matriz acidental: a troca de tema corrige algumas severidades e quebra outras.

## Impacto visual e funcional

- Labels de ações perdem legibilidade e hierarquia.
- Estados semanticamente importantes podem não atender WCAG 1.4.3 para texto normal.
- O comportamento varia de forma imprevisível ao alternar tema, apesar de a anatomia do botão permanecer igual.

## Reprodução e verificação

Renderizar todas as severidades sólidas em tema claro e escuro, obter `color` e `background-color` computados e calcular a razão de contraste. Verificar também repouso, hover e disabled separadamente.

## Direção recomendada

Definir tokens explícitos de cor de conteúdo por severidade e por esquema, escolhidos por contraste real; não inferir o texto a partir de `--background-0`. Manter aliases `.p-button-*` como compatibilidade, pois não são a causa.

## Critérios de aceite

- Toda combinação sólida em repouso e hover atinge no mínimo 4,5:1 para labels de texto normal nos dois temas.
- Testes calculam contraste a partir dos valores resolvidos, não apenas procuram strings no SCSS.
- Ícones que herdam `currentColor` preservam o mesmo contraste do label.

## Contraevidências consideradas

- O primário passa no tema claro e algumas severidades passam no escuro; isso não elimina a falha da matriz completa.
- Disabled pode ter exceção normativa, mas os valores acima são dos estados habilitados.
- Texto preto puro resolveria várias combinações claras, porém a direção final deve respeitar a identidade azul-petróleo e os dois esquemas.
