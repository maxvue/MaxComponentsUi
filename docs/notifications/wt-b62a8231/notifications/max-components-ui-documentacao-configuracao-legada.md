# Documentação de configuração do plugin descreve integração legada

- Data: 15/10/2026.
- Projeto/worktree: `@maxvue/max-components-ui` / `wt-b62a8231`.
- Natureza: divergência documental fora do escopo do aviso de disponibilidade de menus.
- Estado: registrada para avaliação futura; nenhuma correção aplicada.

## Localização e evidência

- `README.md:89–112` apresenta a configuração do plugin como personalização de PrimeVue/tema, incluindo locale, preset, prefixo e ripple com padrões descritos.
- `README.md:166` ainda descreve `MaxStyle` como preset PrimeVue baseado em Aura.
- `src/index.ts:287–297` aceita opções por compatibilidade, mas a implementação atual de `install` registra a diretiva tooltip e fornece o objeto `maxComponentsOptions`; não instala nem configura PrimeVue.
- A busca literal por `maxComponentsOptions` em `src` encontrou somente seu fornecimento em `src/index.ts:296`, sem consumidor desse objeto no código pesquisado.
- `AGENTS.md`, seção 3, informa que o desacoplamento de PrimeVue já foi concluído e proíbe reintroduzir dependências/imports na biblioteca.

## Impacto

Quem segue a seção de configuração pode esperar alterações de tema, tradução ou ripple que a implementação atual não aplica. A documentação também pode induzir a manutenção de uma arquitetura que as diretrizes atuais explicitamente abandonaram.

## Encaminhamento

Em tarefa própria, confrontar as opções publicamente suportadas com o plugin e os temas atuais e atualizar somente a documentação comprovadamente divergente, preservando compatibilidade de tipos quando necessário. Não reintroduzir PrimeVue para fazer a implementação corresponder ao texto antigo.

Esta notificação não registra falha de runtime nem exige alteração para implementar a solicitação atual. Não contém credenciais ou dados pessoais.
