# Especificação técnica — dez novos inputs

## Contexto e objetivo

Analisar os inputs usados nos projetos Engeapp, MaxAiManager, AgenteDeBolso e SocialMedia e propor dez componentes `MaxInput*` que não façam parte do catálogo atual do MaxComponentsUi nem conflitem com a relação de componentes reservados pelo usuário. O resultado esperado é um plano para uma implementação futura na biblioteca, com contratos e validação a definir durante a execução.

## Escopo

### Incluído

- Levantamento por leitura dos usos de inputs nos quatro projetos.
- Comparação com os componentes e exports atualmente catalogados pela biblioteca.
- Proposta de exatamente dez inputs, cada um relacionado a um caso de uso observado.
- Roteiro de execução, testes e critérios de aceite para a futura implementação.

### Fora de escopo

- Implementar qualquer componente, teste, export ou alteração nos projetos consumidores.
- Alterar contratos de backend, modelos de dados, dependências, temas ou configurações.
- Reimplementar componentes já existentes como `MaxInputSelect`, `MaxInputTextList`, `MaxInputUF`, `MaxInputTypeAddress`, `MaxColorPicker`, `MaxInputDatePicker` e `MaxInputMoney`.
- Criar qualquer componente listado como reservado pelo usuário, inclusive `MaxInputEntity`, `MaxInputGender`, `MaxInputEmail`, `MaxInputUrl`, `MaxInputPassword`, `MaxInputTime`, `MaxInputWeekday`, `MaxInputMonth`, `MaxInputYear`, `MaxInputSlug`, `MaxInputPercent`, `MaxInputPower`, `MaxInputCurrent`, `MaxInputVoltage`, `MaxInputDistance`, `MaxInputDuration`, `MaxInputTokenLimit`, `MaxInputMonthDays`, `MaxInputWeekInterval`, `MaxInputSocialPlatform`, `MaxInputPhase`, `MaxInputWireSize`, `MaxInputWireType`, `MaxInputAiExecutionType`, `MaxInputAiBillingMode`, `MaxInputAiBillingUnit`, `MaxInputPaymentMethod`, `MaxInputScheduleType`, `MaxInputMonthOccurrence` e `MaxInputContentType`.

## Evidências da análise

Biblioteca ativa: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-3cf08e1f`, branch `wt-3cf08e1f`. A árvore estava limpa na leitura inicial. O catálogo consultado foi `src/components/`, `src/index.ts` e `src/components-manifest.json`; não foi identificada a existência ou exportação das dez propostas abaixo.

Usos representativos observados:

- **Engeapp**: `resources/Vue/Sections/Auth/Register.vue` usa RG, órgão emissor e UF em campos separados, além de links de Instagram/Facebook/LinkedIn. `resources/Vue/Pages/WirePage.vue` demonstra campos especializados já reservados e que não devem ser repetidos. A varredura de páginas confirmou uso amplo dos componentes de input atuais.
- **MaxAiManager**: `resources/Vue/Sections/Settings/Ai/ModalAiProvider.vue` mantém URL, chave de API e dados relacionados a credenciais usando campos genéricos; a interface já controla visibilidade de chave fora do campo. Isso evidencia oportunidade de um input de credencial reutilizável, sem autorizar tráfego ou armazenamento próprio.
- **AgenteDeBolso**: `resources/Vue/Sections/Report/ReportFilterBuilder.vue` compõe início/fim de período, referência de data, operadores e chips de situação/contas/cartões. O comentário do componente registra ausência de seletor genérico de múltiplos valores e a opção por composição manual. `resources/Vue/Sections/Settings/Preferences/CurrencyGroup.vue` usa selects para moeda. `resources/Vue/Sections/Settings/ScheduleGroup.vue` é referência para configuração de agenda.
- **SocialMedia**: `resources/Vue/Sections/SocialMedia/TabBrandPositioning.vue` usa um seletor de cor existente e campos textuais para identidade social; `resources/Vue/Pages/Clients/ClientWorkspace.vue` registra identificadores externos e credenciais. `resources/Vue/Sections/SocialMedia/ThemeScheduleBuilder.vue` compõe regras com data e horário em campos separados.

As buscas foram leituras direcionadas, não uma análise formal de todos os históricos ou de cada campo em todos os arquivos. A inexistência foi comparada com os arquivos do catálogo, exports e manifesto desta worktree; não se afirma que cada padrão ocorra em todos os quatro consumidores.

## Arquitetura e mudanças técnicas propostas

Os componentes devem seguir os padrões da biblioteca: Vue 3 Composition API, TypeScript estrito, base compartilhada `InputBase` quando compatível, tokens semânticos, acessibilidade e classes locais `.max-*`. Nenhuma dependência PrimeVue deve ser introduzida. A API deve ser controlada por `modelValue`/`update:modelValue`, props explícitas e eventos documentados. Valores, defaults e normalização exatos são decisões da implementação, não fatos já definidos.

| Proposta | Necessidade e caso observado | Limite funcional proposto |
| --- | --- | --- |
| `MaxInputMultiSelect` | Seleção de várias contas/cartões no `ReportFilterBuilder`; comentário registra que o catálogo não tem controle multi genérico. | Seleção de coleção de opções com acessibilidade, estado vazio e seleção/remoção controlada; não substituir `MaxTagSelect` sem comparar os contratos. |
| `MaxInputDateRange` | Relatórios e comparativos usam campos De/Até separados. | Agrupar duas datas com limites e validação de ordem, emitindo um único valor composto; não substituir o `MaxInputDatePicker` simples. |
| `MaxInputDateReference` | `ReportFilterBuilder` oferece um grupo de opções para definir qual data rege o relatório. | Controle de escolha única rotulado, com opções fornecidas pelo consumidor; não embutir regras de domínio ou opções fixas. |
| `MaxInputStatusGroup` | Mesmo relatório seleciona múltiplos estados por chips e declara que nenhum marcado equivale a todos. | Grupo acessível de opções múltiplas, semântica de vazio definida pela aplicação (não presumir que vazio significa todos no componente genérico). |
| `MaxInputRG` | Cadastro do Engeapp separa número, órgão emissor e UF do RG. | Campo de documento com máscara/validação somente após confirmar regras atuais e variações regionais; não inferir validade legal. |
| `MaxInputAddress` | Cadastro do Engeapp mantém CEP, UF, cidade, bairro, logradouro, número e complemento em campos distintos. | Composição opcional de campos de endereço, integração por eventos/slots sem busca externa implícita; diferenciar de `MaxInputTypeAddress` (seletor de tipo de endereço) e `MaxInputCep`. |
| `MaxInputDateTimeLocal` | Agendamento no SocialMedia mantém data e horário como campos separados. | Entrada combinada para valor local de data e hora, com fuso/serialização explicitamente definidos antes da codificação. Não é o `MaxInputTime` reservado. |
| `MaxInputCurrencyCode` | Preferências do AgenteDeBolso oferecem seleção de moeda por opções. | Select tipado de códigos/labels fornecidos ou catálogo estático acordado; não converter nem formatar valores monetários, função já distinta de `MaxInputMoney`. |
| `MaxInputSocialHandle` | Engeapp captura identificadores de Instagram, Facebook e LinkedIn com campos de texto genéricos. | Entrada de nome de usuário/handle, sem seletor de plataforma (reservado `MaxInputSocialPlatform`) e sem validação/consulta remota implícita. |
| `MaxInputCredential` | MaxAiManager e SocialMedia capturam chaves/tokens com `MaxInputText` e lógica externa de mostrar/ocultar. | Campo de segredo com alternância acessível de visibilidade e suporte a valor controlado; não persistir, copiar, enviar ou mascarar de forma que altere o valor sem ação explícita. |

## Fluxo proposto

Quatro projetos consumidores → catálogo, exports e manifesto do MaxComponentsUi → validação da ausência e dos nomes reservados → contratos individuais e implementação dos dez componentes → testes unitários/acessibilidade e integração com `InputBase` → registro dos componentes/exports/manifestações → validação do pacote e exemplos.

## Critérios de aceite e validação futura

1. Existem exatamente dez nomes propostos, não presentes no catálogo verificado e nenhum deles corresponde à lista reservada.
2. Cada componente resolve um padrão observado e não é mera duplicação de um componente existente.
3. Cada API documenta valor, eventos, props, estados inválidos/vazios, teclado e nome acessível; campos compostos documentam serialização e normalização.
4. Testes unitários cobrem valor controlado, atualização, props, estados-limite e eventos; testes de navegador cobrem teclado/foco e comportamento interativo composto quando aplicável.
5. Exports públicos, manifesto/resolver, documentação e playground ficam consistentes; consumidores não são migrados nesta proposta.
6. Na execução futura, realizar o preflight seguro do harness e dos scripts conforme `AGENTS.md`, implementar os componentes e seus testes antes dos gates em lote. Comandos de validação identificados no projeto: `npm run test`, `npm run type-check`, `npm run type-check:test`, `npm run lint`, `npm run build`; `npm run verify` é gate completo pré-release, a dimensionar conforme a finalidade. Não foram executados nesta sessão Plan.

## Decisões e pontos que permanecem para a execução

- **Confirmado pelo usuário**: analisar os quatro projetos; propor dez inputs ausentes; excluir todos os nomes listados; usar somente a worktree ativa e não integrar por Git.
- **Proposta**: conjunto de dez na tabela, nomes e limites acima.
- **A confirmar por inspeção na execução**: contratos atuais e limitações de `MaxTagSelect`, `MaxInputUF`, `MaxInputTypeAddress`, `MaxColorPicker`, comportamento de `InputBase`, roteamento de props e resolver; regras de RG; serialização de data/hora local e estrutura de endereço/moeda compatíveis com consumidores.
- Se qualquer proposta revelar duplicidade, conflito com componente reservado ou regra de domínio não verificável, interromper esse item e revisar o plano, sem substituição silenciosa nem implementação especulativa.
