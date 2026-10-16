# MaxComponentsUi — fechamento acidental após arraste interno

- Data: 15/10/2026.
- Worktree: `wt-4edd89d1`.
- Situação: defeito relatado pelo usuário, com mecanismo compatível identificado por leitura; reprodução automatizada e correção ainda pendentes.
- Escopo: achado diretamente relacionado ao pedido, não uma ampliação de implementação.

## Localização e evidência

- `src/components/MaxModal.vue:8–30,331–338`: máscara trata clique e o handler verifica topo/dismissable antes de solicitar fechamento; não registra a origem da pressão.
- `src/components/MaxDrawer.vue:2–22,200–202`: máscara usa `@click.self` e handler verifica dismissable; também não registra a origem do gesto.
- `tests/components/MaxModal.test.ts` e `tests/components/MaxDrawer.test.ts`: cobertura existente de clique isolado, mas não de pressão interna com soltura na máscara.
- Semântica documentada em https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event: pressão e soltura em elementos diferentes podem gerar clique no ancestral comum. A máscara é ancestral do conteúdo nos dois componentes.

## Impacto

Selecionar texto em input ou arrastar a partir do conteúdo e soltar fora pode ser interpretado como fechamento. Isso interrompe a edição e pode iniciar confirmação de descarte. Não foi demonstrada perda de dados persistidos, nem executado teste de runtime nesta investigação.

## Encaminhamento

Planejar validação de origem e término do gesto antes dos handlers atuais de fechamento, preservando clique direto na máscara, Escape, botão e hooks. Incluir regressão com mouse real e seleção em input.

Referências: `docs/plans/wt-4edd89d1/spec.md` e `docs/plans/wt-4edd89d1/plan.md`. Nenhuma correção de código foi feita nesta sessão Plan.
