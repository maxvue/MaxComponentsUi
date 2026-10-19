# Referência obsoleta ao PrimeVue na estrutura do README

- Data: 19/10/2026.
- Local: `README.md:253`.
- Evidência: o diagrama de estrutura apresenta `src/prime/` como local de reexportações do PrimeVue. A busca direcionada por `src/prime/**` não encontrou arquivos; `AGENTS.md:30–34` informa que o desacoplamento foi concluído e proíbe reintroduzir essa dependência.
- Impacto: a orientação pode levar mantenedores a procurar uma camada inexistente ou interpretar incorretamente a arquitetura suportada.
- Encaminhamento: revisar esse trecho em tarefa separada de documentação. Não reintroduzir PrimeVue para fazer o diagrama corresponder ao código.
- Limite: nenhuma alteração no README foi feita nesta sessão de planejamento; este achado não integra a correção da comunicação do build.
