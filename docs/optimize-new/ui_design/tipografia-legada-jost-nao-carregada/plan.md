# Plano de implementação — tipografia canônica nos controles compactos

## Objetivo e resultado esperado

Remover a exceção não documentada `Jost` de toggle e tabelas, fazendo-os herdar `--font-sans`/Quicksand como o restante da biblioteca, e documentar que o host é responsável por disponibilizar a webfont.

## Escopo e fora de escopo

- Escopo: stack sans global, três componentes, documentação e regressão de métricas.
- Fora: embutir/baixar webfont, mudar fontes monoespaçadas funcionais ou redefinir pesos/tamanhos sem necessidade.

## Arquivos-alvo

- `src/themes/app.scss` e `src/themes/font.scss` para uma única stack canônica.
- `src/components/MaxInputToggle.vue`, `MaxTable.vue` e `MaxTableFields.vue`.
- `README.md` e `docs/THEME.md` para responsabilidade de carregamento/fallback.
- Criar `tests/themes/typography.test.ts` e atualizar testes dos três componentes.

## Dependências e ordem

1. Consolidar `--font-sans` e fallback.
2. Migrar toggle; migrar tabelas junto do plano de anatomia compartilhada.
3. Testar em ambiente com e sem Quicksand.
4. Documentar antes da publicação.

## Passos detalhados

1. Definir uma stack pública única, preservando Quicksand em primeiro lugar e fallbacks de sistema já documentados.
2. Fazer `body/html/#app` consumir `var(--font-sans)` em vez de repetir lista parcial.
3. Remover `font-family: Jost` e `!important`; herdar a stack ou referenciá-la explicitamente apenas onde isolamento exigir.
4. Varrer produção para impedir família sans adicional sem papel documentado; allowlist apenas monospace/editor e fontes de conteúdo externo.
5. Documentar instalação opcional de Quicksand pelo consumidor e comportamento quando ausente.

## Migração e compatibilidade

- Nenhuma fonte passa a ser dependência remota do pacote.
- Hosts podem sobrescrever `--font-sans`; o fallback de sistema continua funcional.
- A largura do conteúdo pode variar pela correção, portanto revisar truncamento/colunas sem alterar API.

## Testes pertinentes

- Teste estático falha para `Jost` ou sans local não allowlisted.
- CSS computado de toggle, header/body das tabelas e label de `InputBase` deve compartilhar família.
- Screenshots com Quicksand disponível e bloqueada; verificar alinhamento, truncamento e densidade em claro/escuro.
- A11y: zoom 200% e texto longo não pode cortar informação; benchmark não se aplica.

## Critérios de aceite

- Zero ocorrência de `Jost` em código/estilo distribuído.
- Os três componentes resolvem a mesma primeira família e fallback dos formulários.
- Responsabilidade da webfont está explícita em README/THEME.
- Testes, stylelint, type-check e build passam.

## Riscos, rollback e validação final

- Risco: novas métricas causarem truncamento. Ajustar largura/padding do componente, não reintroduzir fonte implícita.
- Rollback: temporariamente usar `var(--font-sans)` local com métricas ajustadas; não restaurar Jost.
- Validar ambientes com/sem fonte, zoom, textos longos, tabelas/toggle e pacote final.
