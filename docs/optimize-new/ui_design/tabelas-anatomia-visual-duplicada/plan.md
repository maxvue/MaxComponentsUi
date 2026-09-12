# Plano de implementação — anatomia compartilhada e feedback compacto em tabelas

## Objetivo e resultado esperado

Fazer `MaxTable` e `MaxTableFields` derivarem da mesma anatomia/tokens e manter feedback de inputs perceptível dentro de células, sem perder a densidade compacta.

## Escopo e fora de escopo

- Escopo: header, linhas, zebra, gaps, tipografia, células e apresentação compacta de erro/cautela/mensagem.
- Fora: unificar APIs/dados das duas tabelas, remover aliases `.p-*` nesta etapa ou alterar virtualização/paginação.

## Arquivos-alvo

- `src/themes/tokens.scss` e `src/themes/colors.scss` para tokens `--max-table-*`.
- Criar `src/themes/_table-anatomy.scss` com mixins estruturais compartilhados.
- `src/components/MaxTable.vue`, `MaxTableFields.vue` e `InputBase.vue` se for necessário um modo público de feedback compacto.
- `tests/components/MaxTable.test.ts`, `MaxTableFields.test.ts`, `InputBase.test.ts` e novos baselines visuais.

## Dependências e ordem

1. Aprovar tokens/anatomia comum e screenshots de baseline.
2. Implementar feedback compacto no `InputBase` ou contrato contextual explícito.
3. Migrar `MaxTableFields` e depois `MaxTable` para mixins/tokens.
4. Executar antes do sweep `.p-*` e junto da correção tipográfica.

## Passos detalhados

1. Definir tokens semânticos para altura de cabeçalho, padding/gap de linha, raio, borda, header bg/text, zebra par/ímpar, seleção e densidade de célula.
2. Extrair mixins SCSS de header row/cell, body row/cell e estados, mantendo seletores próprios de cada componente.
3. Substituir duplicações e `--primary-*` de zebra/seleção pelos tokens de tabela; preservar a assinatura teal/ciano aprovada.
4. Remover as regras que ocultam `.input-message` nas duas tabelas.
5. Criar modo compacto explícito: status visual permanece no campo e mensagem curta fica em linha compacta ou popover/tooltip associado; texto continua no DOM/live region e ligado por `aria-describedby`.
6. Garantir que linha expanda ou reserve área de feedback sem sobrepor linha vizinha; edição sem erro mantém densidade atual.

## Migração e compatibilidade

- Props, slots, classes legadas e modelo de dados permanecem.
- Novos tokens são sobrescrevíveis pelo host; defaults reproduzem a aparência aprovada.
- Se houver prop `feedbackDensity`, default fora de tabela permanece normal e modo compacto é aditivo/contextual.

## Testes pertinentes

- Contrato: ambas resolvem os mesmos valores de header, zebra, gap e tipografia.
- Renderizar input válido, erro, cautela e ajuda em célula; mensagem deve ser visível e referenciada semanticamente.
- Testar conteúdo longo, virtual/não virtual, claro/escuro e navegação por teclado.
- Screenshots lado a lado de ambas e de erro inline.
- Métrica: zero bloco anatômico duplicado fora dos mixins; benchmark garante que modo compacto não altera cardinalidade/virtualização.

## Critérios de aceite

- Ambas usam os mesmos tokens/mixins para anatomia comum.
- Nenhuma tabela contém regra `display:none` para `.input-message`.
- Erro/cautela são perceptíveis, anunciáveis e não se sobrepõem à linha seguinte.
- Aparência normal permanece dentro da tolerância visual aprovada.
- Testes, stylelint, type-check e build passam.

## Riscos, rollback e validação final

- Riscos: aumento excessivo da linha e mixin rígido impedir variações. Mitigar com densidade explícita e parâmetros do mixin.
- Rollback: ajustar modo compacto/tokens sem restaurar ocultação total do feedback.
- Validar duas tabelas, estados de input, virtualização, temas, teclado, screenshots e CSS gerado.
