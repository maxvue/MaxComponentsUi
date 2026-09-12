# Plano de implementação — classes `.max-*` como anatomia canônica

## Objetivo e resultado esperado

Concluir o sweep interno de nomenclatura sem quebrar CSS consumidor: estilos e testes da biblioteca passam a depender de classes `.max-*`; aliases `.p-*` observáveis ficam isolados, documentados e depreciados por uma janela de versão.

## Escopo e fora de escopo

- Escopo: inventário DOM/CSS, classes canônicas nos componentes citados, simplificação de `InputBase`, testes e guia de migração.
- Fora: remover aliases públicos imediatamente, alegar dependência PrimeVue inexistente ou reescrever toda a anatomia visual.

## Arquivos-alvo

- `src/components/InputBase.vue`, `MaxButton.vue`, `MaxInputSelect.vue`, `MaxTagSelect.vue`, `MaxTopToolbar.vue`, `MaxTopToolbarSubmenu.vue`, `MaxInputAutoComplete.vue`, `MaxInputAutoCompleteApi.vue`, `MaxInputFileUpload.vue`, `MaxTable.vue`, `MaxInputIconPicker.vue`, `MaxLikeButton.vue`, `MaxInputPhone.vue` e `MaxUserSection.vue`.
- `src/themes/tokens.scss` e novo `src/themes/legacy-prime-compat.scss`, se houver CSS global de compatibilidade.
- Criar `docs/MIGRATION_LEGACY_CLASSES.md`.
- Criar `tests/architecture/legacyClassUsage.test.ts` e atualizar testes/snapshots dos componentes.

## Dependências e ordem

1. Gerar inventário de classes emitidas e seletores, classificando público, interno e teste.
2. Executar antes a anatomia/tipografia compartilhada das tabelas para evitar retrabalho.
3. Adicionar `.max-*` e migrar estilos/testes por família, mantendo alias.
4. Isolar compatibilidade e só remover aliases numa próxima major/depreciação aprovada.

## Passos detalhados

1. Registrar para cada `.p-*` se aparece no DOM publicado, em slot/documentação ou apenas como seletor interno.
2. Para anatomia interna sem nome Max, adicionar classe semântica `.max-*` equivalente sem remover a antiga.
3. Reescrever estilos scoped e lógica de `querySelector` para a classe canônica; agrupar alias somente na camada de compatibilidade quando necessário.
4. Em `InputBase`, substituir seletores profundos `.p-*` por classes Max dos filhos; manter `:deep` apenas para conteúdo de slot e remover `!important` quando a especificidade canônica bastar.
5. Atualizar testes para consultar `.max-*` e criar testes separados que comprovem aliases legados ainda emitidos durante a janela.
6. Guardrail arquitetural deve impedir novo seletor interno `.p-*`, aceitando apenas allowlist documentada de emissão/compatibilidade.

## Migração e compatibilidade

- Nenhum alias público é removido nesta etapa.
- Guia mapeia `.p-* → .max-*`, data/versão de depreciação e exemplos de CSS consumidor.
- Remoção futura exige major ou política de depreciação aprovada e teste de tarball sem PrimeVue.

## Testes pertinentes

- Testes DOM por família comprovam classe canônica e alias temporário.
- Testes de estilo verificam que retirar o alias em fixture não quebra aparência interna.
- Smoke de pacote sem PrimeVue e busca estática por imports PrimeVue.
- Regressão visual claro/escuro/foco/disabled; a11y deve permanecer inalterada.
- Métrica: contagem de seletores internos `.p-*`, `:deep` e `!important` antes/depois.

## Critérios de aceite

- Estilos internos funcionam com aliases `.p-*` removidos da fixture.
- Toda ocorrência restante está allowlisted com justificativa e prazo.
- Nenhum teste funcional depende exclusivamente de `.p-*`.
- Contagem de `:deep`/`!important` não cresce e cai nos casos sem slot.
- Type-check, testes, build e consumidor sem PrimeVue passam.

## Riscos, rollback e validação final

- Risco: classe tratada como interna ser usada por consumidores. Mitigar mantendo alias e publicando guia.
- Rollback: restaurar seletor do componente afetado sem remover a classe Max já adicionada.
- Validar inventário, guardrail, regressão visual, tarball e diff sem remoção silenciosa de alias.
