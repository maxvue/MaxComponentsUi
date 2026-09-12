# Estado selecionado usa shade histórico sem contraste no tema claro

## Resumo

`MaxInputSelect` e `MaxListBox` pintam opções selecionadas com `--blue-600` e texto `--background-0`. No tema claro o par é `#2EA4BC` sobre branco, aproximadamente 2,94:1 para textos compactos.

## Severidade e prioridade

- Severidade: alta
- Prioridade: P1

## Evidências

- `src/components/MaxInputSelect.vue:853-870`: opção selecionada combina `--blue-600` e `--background-0`.
- `src/components/MaxListBox.vue:736-750`: repete o mesmo par.
- `src/themes/colors.scss:483` e `src/themes/colors.scss:725`: no claro, `--blue-600: #2EA4BC` e `--background-0: #FFF`.
- A marca canônica `--max-primary-500: #00768E` (`src/themes/tokens.scss:13`) teria cerca de 5,27:1 contra branco.

## Componentes e consumidores afetados

Opções selecionadas em `MaxInputSelect` e `MaxListBox`, inclusive listas virtuais e dados carregados por API.

## Causa-raiz

O namespace histórico `--blue-*` tem numeração deslocada em relação a `--max-primary-*`. O shade 600 foi tratado como equivalente à ação de marca, embora seja visualmente mais claro.

## Impacto visual e funcional

Texto selecionado de 0,85–0,9 rem falha em legibilidade e o estado mais importante da lista perde força visual.

## Reprodução e verificação

No tema claro, selecionar uma opção em ambos os componentes e medir foreground/background computados. Validar também hover sobre selecionado e foco combinado.

## Direção recomendada

Usar par semântico específico de seleção com contraste validado, preferencialmente baseado na rampa `--max-primary-*`; preservar aliases públicos sem perpetuar equivalência cromática incorreta.

## Critérios de aceite

- Texto selecionado atinge 4,5:1 em claro e escuro.
- Seleção continua distinguível sem depender exclusivamente de cor.
- Select e ListBox compartilham os mesmos tokens de estado.

## Contraevidências consideradas

No tema escuro, a inversão da rampa torna o par atual altamente contrastante. Isso não corrige o tema claro nem justifica manter um token cuja semântica muda entre esquemas.
