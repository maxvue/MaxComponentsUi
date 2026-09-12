# Plano de implementação — contrato completo da rampa primária

## Objetivo e resultado esperado

Materializar todos os shades de `MaxStyle.semantic.primary` em CSS e garantir automaticamente que cada uso de `--max-primary-N` possua declaração e fallback teal correspondente.

## Escopo e fora de escopo

- Escopo: rampa 50–950, fallbacks de Markdown/Code/toolbars e teste de contrato fonte↔CSS↔uso.
- Fora: alterar as cores aprovadas em `MaxStyle`, renomear rampas históricas ou normalizar todos os tokens não primários.

## Arquivos-alvo

- `src/themes/tokens.scss`.
- `src/components/MaxInputMarkdown.vue`, `MaxInputMarkdownToolbar.vue`, `MaxInputCode.vue` e `MaxInputCodeToolbar.vue`.
- Criar `tests/themes/primaryTokenContract.test.ts`; ajustar `tests/themes/tokens.test.ts` se houver sobreposição.

## Dependências e ordem

1. Fazer o teste ler `MaxStyle` e reproduzir a ausência/divergência atual.
2. Completar tokens.
3. Normalizar fallbacks em todos os consumidores encontrados por busca.
4. Validar claro/escuro e CSS parcial.

## Passos detalhados

1. Declarar em `:root` os shades 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 e 950 exatamente como `src/styles/style.ts`.
2. Substituir fallbacks Tailwind de toda referência `--max-primary-*` pelos valores oficiais do mesmo shade, incluindo os hoje latentes de 100/200/500/600.
3. Teste deve extrair declarações de `tokens.scss`, varrer `src/**/*.{vue,scss,ts}` e comparar nomes/hex de fallback de forma case-insensitive.
4. Falhar para shade consumido não declarado, valor divergente ou fallback de outra paleta.
5. Não duplicar a rampa em `.dark`; componentes escolhem shade apropriado, mas os valores de marca permanecem estáveis.

## Migração e compatibilidade

- Novos custom properties são aditivos.
- Fallbacks só mudam quando o stylesheet está ausente/parcial; a correção alinha esse caso ao contrato oficial.
- `--blue-*`/`--primary-*` continuam como compatibilidade, sem serem tratados como equivalentes.

## Testes pertinentes

- Contrato completo entre 11 shades tipados e CSS.
- Varrer todos os usos e respectivos fallbacks.
- CSS computado de link, code inline, seleção e toolbar com/sem `tokens.scss`, claro/escuro.
- Regressão visual dos editores; contraste de texto/estado deve continuar ≥ requisitos aplicáveis.
- Benchmark não se aplica.

## Critérios de aceite

- 11/11 shades primários estão materializados com valores idênticos a `MaxStyle`.
- Zero referência `--max-primary-N` ausente ou com fallback divergente.
- Link Markdown resolve para `#004860`, não `#1d4ed8`.
- Testes, stylelint, type-check e build passam.

## Riscos, rollback e validação final

- Risco: algum fallback azul era escolha visual local. Se for semântico, criar token próprio; não falsificar a rampa Max.
- Rollback: reverter consumidor específico para token semântico aprovado, mantendo a rampa completa.
- Validar busca global, contrato automatizado, editores em estilos completos/parciais e temas.
