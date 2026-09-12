# Rampa CSS `max-primary` incompleta ativa fallbacks azuis externos à identidade

## Resumo

`MaxStyle` define a rampa teal completa, mas `tokens.scss` materializa somente cinco shades. Componentes consomem `--max-primary-700`, inexistente no CSS, com fallback Tailwind azul; no Markdown esse fallback é efetivo.

## Severidade e prioridade

- Severidade: média
- Prioridade: P2

## Evidências

- `src/styles/style.ts:28-38`: fonte tipada inclui 50–950 e define 700 como `#004860`.
- `src/themes/tokens.scss:8-15`: CSS materializa apenas 100, 200, 400, 500 e 600.
- `src/components/MaxInputMarkdown.vue:571-625`: `--max-primary-700` cai em `#1d4ed8`; outros fallbacks usam `#3b82f6/#2563eb`.
- `src/components/MaxInputMarkdownToolbar.vue:380-459`, `src/components/MaxInputCode.vue:41,398-407` e `src/components/MaxInputCodeToolbar.vue:296-329`: repetem fallbacks azuis.

## Componentes e consumidores afetados

Markdown/editor e toolbar, editor de código e toolbar, e integrações com carregamento parcial de estilos.

## Causa-raiz

As fontes cromáticas `MaxStyle` e CSS materializado não são geradas/validadas juntas; snippets posteriores assumiram a escala Tailwind.

## Impacto visual e funcional

Links e código inline exibem azul genérico em vez de teal profundo; integrações parciais podem sofrer desvio cromático conforme o entry CSS carregado.

## Reprodução e verificação

Renderizar Markdown com link e código inline: `--max-primary-700` não existe e a cor computada é `rgb(29, 78, 216)`, não `#004860`.

## Direção recomendada

Materializar todo shade consumido e normalizar fallbacks para valores oficiais. Criar contrato automatizado entre `style.ts`, tokens e referências.

## Critérios de aceite

- Todo `--max-primary-N` consumido possui declaração CSS.
- Cada fallback coincide com `MaxStyle.semantic.primary[N]`.
- Teste falha para referência ausente ou divergente.

## Contraevidências consideradas

Fallbacks de 500/600 ficam latentes quando `tokens.scss` está carregado; o shade 700, porém, está efetivamente ausente. `--surface-border` herdado acompanha a redefinição dark e não integra este achado.
