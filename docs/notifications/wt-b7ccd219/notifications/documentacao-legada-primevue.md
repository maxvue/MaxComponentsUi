# Referências documentais legadas ao PrimeVue

- Data: 2026-10-13.
- Locais: `README.md:109,239`; `.opencode/skills/vue-unocss-styling-best-practices/SKILL.md:51`.
- Evidência: README descreve preset baseado no Aura e diretório como preset PrimeVue; a skill afirma que MaxComponentsUi é construído sobre PrimeVue. As diretrizes canônicas `AGENTS.md`, seção 3, informam independência concluída e proíbem reintrodução dessas dependências.
- Impacto: leitores e executores podem inferir arquitetura/dependências antigas e planejar integrações incompatíveis com as diretrizes atuais.
- Próxima ação: revisão documental separada autorizada, conferindo cada afirmação contra a arquitetura vigente. Não remover classes `.p-*`, pois sua preservação é intencional. Nenhuma dessas referências foi corrigida nesta tarefa sobre a família `s`.
