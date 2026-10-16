# Especificação — dez inputs especializados

## 1. Contexto & Objetivo

- Data: 16/10/2026. Projeto: `@maxvue/max-components-ui` 1.1.12.
- Worktree exclusiva: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-ef60677b`, branch `wt-ef60677b`, confirmada por leitura. Estado inicial sem alterações locais.
- Objetivo: oferecer dez inputs ausentes do catálogo, derivados de usos reais em engeapp, MaxAiManager e SocialMedia. São propostas para revisão, não componentes implementados.
- Benefício: centralizar unidade, tipo de valor, limites e acessibilidade que hoje ficam distribuídos em inputs genéricos.

## 2. Escopo

### Incluído

Dez componentes públicos, seus contratos, testes, exportações, descoberta pelo resolver e demonstrações. Reutilizar InputBase e MaxInputSelect. Os oito campos numéricos/lista não dependem de rede. O seletor social recebe opções do consumidor quando personalizadas.

### Excluído

Não implementar nem modificar consumidores nesta entrega; suas telas são evidência e futuros pontos de adoção. Não alterar APIs, regras elétricas, cálculo financeiro, filas, calendários ou persistência. Não publicar pacote, instalar dependências ou integrar Git automaticamente. Não criar MaxInputEntity, MaxInputGender, MaxInputEmail, MaxInputUrl, MaxInputPassword, MaxInputTime, MaxInputWeekday, MaxInputMonth, MaxInputYear ou MaxInputSlug. Não renomear nem modificar esses componentes se aparecerem por integração concorrente.

## 3. Arquitetura & Mudanças Técnicas

### Evidências e seleção

Os caminhos de consumidores abaixo são relativos a `/home/johnattas/GitHub/`. Números de linha representam o estado observado, não identificadores permanentes.

| Novo componente proposto | Evidência de uso atual | Contrato proposto e motivo |
|---|---|---|
| MaxInputPercent | `engeapp/resources/Vue/Pages/WirePage.vue:20`; `engeapp/resources/Vue/Pages/CommercialProposalDetailPage.vue:138,291–292`; `MaxAiManager/resources/Vue/Sections/Settings/Ai/ModalAiModel.vue:77–87` | `number \| null`, pontos percentuais: 15 significa 15%, nunca 0,15. Sufixo %, min=0 e max=100 por padrão, substituíveis. Não calcula desconto nem preço. |
| MaxInputPower | `engeapp/resources/Vue/Pages/WirePage.vue:15`; `engeapp/resources/Vue/Pages/SolarCompanyProjectCreatePage.vue:105`; `engeapp/resources/Vue/Sections/Monitoring/ModalAddInverterToStation.vue:60` | `number \| null`; unit: W/kW/kWp, padrão kW; min=0. Unidade é apresentação declarada, sem conversão automática. |
| MaxInputCurrent | `engeapp/resources/Vue/Pages/WirePage.vue:16`; `engeapp/resources/Vue/Sections/Settings/Equipments/SettingsEquipments.vue:65,67,103` | `number \| null`; ampères, sufixo A; min=0 substituível para medições com sinal. |
| MaxInputVoltage | `engeapp/resources/Vue/Pages/WirePage.vue:17`; `engeapp/resources/Vue/Sections/Monitoring/ModalStationCharts.vue:303–304,323` | `number \| null`; volts, min=0 substituível. Modo numérico padrão; `options?: {name:string;value:number}[]` ativa MaxInputSelect. Não embarcar catálogo de concessionárias. |
| MaxInputDistance | `engeapp/resources/Vue/Pages/WirePage.vue:19` | `number \| null`; unit: mm/cm/m/km, padrão m; min=0. Sem conversão de modelo ao mudar unidade. |
| MaxInputDuration | `MaxAiManager/resources/Vue/Sections/Settings/Ai/ModalAiModel.vue:130–149` | `number \| null`; duração em segundos, inteiro, min=0, sufixo s. `min`/`max` dinâmicos permitem manter fallback anterior ao timeout no consumidor. Não é horário do dia. |
| MaxInputTokenLimit | `MaxAiManager/resources/Vue/Sections/Settings/Ai/ModalAiModel.vue:66–76,218` | `number \| null`; inteiro, min=1, max=Number.MAX_SAFE_INTEGER; unidade tokens. Limite específico de 10.000.000 continua prop do consumidor. Não tokeniza texto nem consulta fornecedores. |
| MaxInputMonthDays | `SocialMedia/resources/Vue/Sections/SocialMedia/ThemeScheduleBuilder.vue:41–44,157–159`; `SocialMedia/resources/Stores/socialMedia/useThemesStore.ts:18–22` | `number[]`; lista de dias de 1 a 31. Entrada textual separada por vírgulas; vazio gera []; remover duplicatas mantendo ordem. Não representa mês/ano nem dia da semana. |
| MaxInputWeekInterval | `SocialMedia/resources/Vue/Sections/SocialMedia/ThemeScheduleBuilder.vue:37–38,86–91` | `number \| null`; select com 1,2,3,4 semanas e mesmos rótulos locais; `options` permite outros inteiros positivos. Não calcular datas nem assumir que duas semanas equivalem a meses. |
| MaxInputSocialPlatform | `SocialMedia/resources/Vue/Pages/Clients/ClientWorkspace.vue:56–66,130–139` | `string \| null`; select com Instagram=instagram, Facebook (Página)=facebook, Outra=''. Null é ausência; string vazia é opção legítima. Opções personalizadas `{name:string;value:string}[]` substituem padrões. Não carregar credenciais nem oferecer redes não suportadas implicitamente. |

### Contratos comuns

- Props comuns: modelValue, id, label, placeholder, disabled, required, done, error, caution, message/msg, noMessage, icon/i. Tipos explícitos; não copiar `any` do input genérico. Eventos `update:modelValue` tipados; nenhum salvamento interno. Expor foco/blur apenas se documentados e testados, sem prometer API não existente.
- Campos numéricos: min/max finitos opcionais, casas decimais padrão 0–2 nas grandezas/percentual, 0 nas contagens/duração; props de casas decimais somente nos decimais. Zero é válido quando min permite. Limpar gera null. Modelo externo inválido é exibido e marcado, nunca corrigido silenciosamente nem reemitido no mount/watch.
- Digitação inválida, não finita, fora dos limites ou fração em inteiro permanece como rascunho com erro e não emite um novo modelo válido. Não truncar, limitar, converter em zero ou retirar letras silenciosamente. Feedback depois da interação; erro do consumidor tem precedência. Modelos externos precisam da mesma validação, incluindo em modo select.
- Texto decimal pt-BR aceita vírgula decimal e ponto de agrupamento válido (por exemplo 1.250,50). Não interpretar entrada textual 1.5 como 1,5: informar formato esperado. Entrada programática numérica 1.5 continua válida. Sufixos ficam fora do texto editável. Não arredondar o modelo ao formatar.
- MonthDays: aceitar espaços, mas rejeitar tokens vazios entre vírgulas, frações, letras, 0 e 32; não aceitar `12abc` como 12. Rejeição preserva o modelo anterior e informa erro. Não remover dias 29–31 por mês: execução do calendário permanece externa.
- WeekInterval não é MaxInputWeekday: valor é quantidade de semanas. SocialPlatform não é o cadastro de plataformas do calendário: `TabCalendar.vue:200–204` trabalha com IDs de registros e não deve ser migrado automaticamente para um enum social.

### Composição e arquivos

Novos: `src/components/MaxInput{Name}.vue` para os dez nomes da tabela; `src/components/base/MaxBaseQuantity.vue` para controle numérico interno compartilhado; `src/types/semanticInputs.ts` para contratos comuns; testes correspondentes em `tests/components/`; novo cenário em `playground/src/scenarios/SemanticInputsScenario.vue`.

Existentes a atualizar: `src/index.ts`, `src/components-manifest.json`, `package.json` (exports explícitos seguindo padrão existente), `tests/index.test.ts`, `tests/helpers/MaxComponentsUiResolver.test.ts`, `playground/src/catalog.ts` e documentação pública pertinente após localizar sua seção de inputs. Não mudar versões nem lockfile sem necessidade real.

Fluxo: componente especializado → MaxBaseQuantity → InputBase → input nativo. Para selects: componente especializado → MaxInputSelect → InputBase. MonthDays compõe InputBase e entrada textual própria. Não duplicar InputBase aninhados.

**Decisão de segurança contratual:** MaxInputNumber atual não declara nem valida min/max; usa input text e parser permissivo. Não depender de atributos HTML para novos limites. Implementar o comportamento novo isoladamente em MaxBaseQuantity, sem alterar o contrato legado. Achado registrado separadamente.

Usar helpers disponíveis de `@maxvue/max-use` e o mecanismo local `src/helpers/useInputValidation.ts` quando compatível. O código-fonte irmão MaxUse exporta hasContent/isNumber/round; isso não comprova exports da versão instalada. Parsing estrito e validação do domínio permanecem internos, não uma nova biblioteca de helpers. Não importar caminhos locais do pacote irmão. Para necessidades genéricas realmente ausentes, registrar notificação antes de ampliar escopo.

Os inputs são controlados e não criam stores, cache ou chamadas HTTP. Exemplos com persistência devem usar MaxPinia; nenhuma nova camada de estado global é necessária para editar um valor local. Dados dinâmicos de opções pertencem à store MaxPinia consumidora.

Acessibilidade: reutilizar inputAttrs de InputBase (id, aria-describedby, aria-invalid, aria-required); manter label associado, disabled nativo, foco visível e teclado de MaxInputSelect. Layout de 36px, tokens semânticos teal, dark mode, SCSS scoped e classes max-*. SFC em template/script/style; script indentado em quatro espaços e tags de abertura em uma linha. Sem PrimeVue.

### Limitações e referências

Inspeção direcionada de usos em resources dos três projetos; não é auditoria integral de todas as telas. A ausência dos dez nomes foi conferida no diretório de componentes público atual. MaxInputDiscount já existe, mas inclui alternância moeda/percentual e cálculo de preço; não substitui um percentual genérico. MaxInputNumber cobre apresentação genérica, não o contrato especializado proposto.

Versões declaradas: Vue ^3.6.0-rc.10, Vite ^8.3.3, Vitest ^4.1.10, MaxUse ^1.1.47 e MaxPinia peer opcional ^0.2.0; não confundir intervalos declarados com versões efetivamente resolvidas. Consultada documentação oficial Vue por Context7 sobre props/emits tipados e inheritAttrs; referência https://vuejs.org/guide/components/attrs e https://vuejs.org/api/sfc-script-setup. Não foi possível obter documentação fixada exatamente no RC declarado; conferir comportamento no ambiente efetivo durante execução.

## 4. Plano de Execução Faseado

1. Preflight somente por leitura, detectar trabalho concorrente e contratos efetivos.
2. Criar contratos e base numérica isolada com testes; implementar todo o bloco de dez inputs e testes antes de rodar validações agregadas.
3. Integrar exports, manifesto, resolver, demonstrações e documentação. Não sobrescrever entradas adicionadas por outra sessão.
4. Validar lote completo, diagnosticar falhas em conjunto, revisar por risco e concluir com pendências explícitas. Detalhes e matriz em plan.md.

## 5. Critérios de Aceite & Validação

Exatamente dez novos nomes, distintos dos reservados; usos e contratos rastreáveis à tabela. Não alterar comportamento existente. Garantir tipagem, limites reais, vazio versus zero, ausência de emissões em eco, acessibilidade, import raiz/subpath e descoberta pelo resolver.

Execução futura: `npm run verify` é o gate completo identificado (inclui tipos, lint, build, testes, cobertura, navegador, benchmarks, consumidores, integridade e auditoria). Não executado nesta sessão. Executar apenas após implementar o lote, validar isolamento dos scripts e disponibilizar rede/navegador exigidos; não usar release. Reutilizar seus checks já aprovados na mesma revisão, sem repetir componentes isoladamente sem motivo. Ausência de requisito ambiental significa bloqueio/pendência, não aprovação.
