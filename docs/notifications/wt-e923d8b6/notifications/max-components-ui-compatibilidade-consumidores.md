# Compatibilidade declarada e consumo por symlinks compartilhados

- Data: 16/10/2026.
- Localização: `package.json` do MaxComponentsUi e dos quatro projetos analisados; `storage/libs/MaxComponentsUi`, `storage/libs/MaxUse`, `storage/libs/MaxPinia` em cada consumidor.
- Evidência por leitura:
  - MaxComponentsUi exige peer `pinia: ^4.0.0`.
  - engeapp declara `pinia: ^3.0.4`; AgenteDeBolso declara `^3.0.3`.
  - MaxAiManager declara `^4.0.2`; SocialMedia declara `^4.0.3`.
  - Os quatro consumidores declaram as bibliotecas Max por `file:./storage/libs/...`; os caminhos são symlinks para os respectivos repositórios principais compartilhados, não para esta worktree.
  - `package.json` de MaxAiManager e AgenteDeBolso já estava modificado antes da investigação. As versões acima refletem o disco observado; não presumir correspondência com HEAD ou pacote instalado.

**Impacto:** não se pode assumir que uma adição nesta worktree esteja disponível nos quatro apps ou que instalação empacotada satisfaça peers em engeapp/AgenteDeBolso. Symlinks também permitem efeitos cruzados se alguém escrever na árvore compartilhada. Não foi executada instalação nem diagnosticada falha de runtime; o fato confirmado é a divergência declarada e o destino dos links.

**Encaminhamento:** antes de adoção futura, conferir lockfile, versões resolvidas e identidade de Vue/Pinia/Axios no harness. Resolver versões/pins em escopo autorizado com responsáveis. Falha de gate de integridade bloqueia validações dependentes; não remover hooks, usar `--legacy-peer-deps`, editar `storage/libs` ou trocar symlink como atalho.

Não foram alterados dependências, pins ou links. A biblioteca MaxComponentsUi deve continuar consumindo MaxUse via npm, conforme sua própria arquitetura; o consumo local dos apps não autoriza mudar isso.
