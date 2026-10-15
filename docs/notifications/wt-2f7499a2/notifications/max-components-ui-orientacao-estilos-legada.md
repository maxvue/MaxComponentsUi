# Orientação de estilos incompatível com as diretrizes canônicas

- Data: 15/10/2026.
- Local: `.opencode/skills/vue-unocss-styling-best-practices/SKILL.md:48–54, 60–63`.
- Evidência: a skill recomenda utilitários como preferência geral, descreve SCSS sem scoped como convenção do aplicativo e apresenta componentes MaxComponentsUi como construídos sobre PrimeVue. O `AGENTS.md` deste repositório determina classes semânticas locais, SCSS scoped e independência concluída de PrimeVue.
- Impacto: execução literal da orientação de aplicativo dentro da biblioteca pode contrariar o padrão interno e induzir dependências proibidas.
- Encaminhamento: revisar separadamente a delimitação entre instruções para aplicações consumidoras e para esta biblioteca. Para o plano de MaxSteps, prevalece o `AGENTS.md`; não alterar a skill nesta tarefa.
- Não houve alteração de código ou reprodução de informações sensíveis.
