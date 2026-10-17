# Divergência de faixas Pinia entre consumidores e biblioteca

- Data: 16/10/2026. Worktree: `wt-84453aaf`.
- Natureza: incompatibilidade declarada de peers para eventual adoção; falha de runtime não reproduzida.

## Localização e evidência sanitizada

Manifestos lidos, relativos a `/home/johnattas/GitHub/`:

- `engeapp/package.json`: `pinia: ^3.0.4`.
- `AgenteDeBolso/package.json`: `pinia: ^3.0.3`.
- `MaxAiManager/package.json`: `pinia: ^4.0.2`.
- `SocialMedia/package.json`: `pinia: ^4.0.3`.
- `MaxComponentsUi/.max-code-worktrees/wt-84453aaf/package.json`: peer `pinia: ^4.0.0`, MaxPinia opcional.

Os quatro consumidores declaram bibliotecas Max por `file:./storage/libs/...`; isso não comprova que o pacote efetivamente incorporado seja idêntico ao desta worktree. O node_modules desta worktree é compartilhado por symlink com a árvore principal e não contém `@maxvue/max-pinia` instalado.

## Impacto

Engeapp/AgenteDeBolso não satisfazem pelo manifesto a faixa Pinia desta versão da biblioteca. Um gate com consumidor sintético Pinia 4 não comprova adoção nesses apps. Não se conclui, somente com essa evidência, que os frontends atuais estejam quebrados.

## Encaminhamento

Planejar qualquer migração real em demanda separada, verificando libs efetivas, lockfiles e instâncias únicas de Vue/Pinia/Axios. Não usar `--legacy-peer-deps`, não instalar no node_modules compartilhado e não alterar apps como efeito colateral deste plano. Os dez componentes propostos não acrescentam dependência runtime de MaxPinia; a persistência dos apps continua em suas stores.
