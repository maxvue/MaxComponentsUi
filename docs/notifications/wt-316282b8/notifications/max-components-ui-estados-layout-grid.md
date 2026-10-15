# Achado fora do escopo — Estados demonstrativos sem contrato no playground

- Data: 15/10/2026.
- Projeto/worktree: MaxComponentsUi / `wt-316282b8`.
- Localização: `playground/src/scenarios/layout-grid.vue:60-68,80-88`.
- Evidência: os blocos de `MaxGridCols` e `MaxEmptyDiv` mostram exemplos rotulados como desabilitado e erro/secundário e passam `disabled`, `error` e `severity`. `src/components/MaxGridCols.vue` não declara props nem estilos para esses estados. `src/components/MaxEmptyDiv.vue:26-45` declara outras props, sem esses três estados.
- Impacto: o playground sugere capacidades visuais/funcionais que não estão implementadas nesses componentes. Os atributos podem chegar ao elemento raiz sem produzir o estado anunciado.
- Limite: achado documental/demonstrativo por leitura; não houve execução visual nem investigação de aplicações consumidoras. Não afirmar falha de segurança ou funcionalidade além da evidência.
- Ação sugerida para tarefa separada: alinhar os exemplos aos contratos reais; não implementar novos estados somente para justificar exemplos existentes sem requisito específico.
- Situação: não corrigido. A correção de encerramento mobile no `MaxGrid` não deve alterar esses blocos.

Este registro não contém credenciais, tokens ou dados pessoais.
