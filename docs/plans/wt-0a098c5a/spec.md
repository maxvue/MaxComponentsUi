# Especificação técnica — 15 novos inputs especializados

## 1. Contexto & Objetivo

- Projeto: `@maxvue/max-components-ui`, versão observada `1.1.14`.
- Data: 16/10/2026.
- Worktree exclusiva: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-0a098c5a`, branch `wt-0a098c5a`.
- Solicitação: analisar os inputs de `engeapp`, `MaxAiManager` e `SocialMedia` e propor **15 inputs de propósito específico que ainda não existem** na biblioteca.
- Entrega desta sessão: somente investigação, especificação, plano e notificações. Nenhuma implementação ou validação executável foi realizada.

O benefício esperado é centralizar catálogos e controles repetidos, com tipagem, acessibilidade e valores compatíveis com os domínios observados. Os usuários futuros são desenvolvedores consumidores e pessoas que preenchem cadastros, financiamentos, configurações solares, regras de IA e planejamento editorial.

### 1.1. Resultado da investigação

Raízes consultadas em leitura:

| Referência | Raiz |
|---|---|
| `UI` | worktree identificada acima |
| `E` | `/home/johnattas/GitHub/engeapp` |
| `A` | `/home/johnattas/GitHub/MaxAiManager` |
| `S` | `/home/johnattas/GitHub/SocialMedia` |

Varredura estática de todos os arquivos `.vue` sob `resources` de cada consumidor, contando tags `MaxInput*`, `input`, `select` e `textarea`:

| Projeto | Arquivos Vue | Ocorrências de tags de entrada | Principais usos |
|---|---:|---:|---|
| Engeapp | 361 | 803 | `MaxInputText` 341; `MaxInputSelect` 144; `MaxInputNumber` 71 |
| MaxAiManager | 47 | 103 | `MaxInputText` 49; `MaxInputSelect` 16; `MaxInputNumber` 15 |
| SocialMedia | 23 | 70 | `MaxInputTextArea` 26; `MaxInputText` 22; `MaxInputSelect` 9 |

Essas contagens são inventário textual, não campos únicos, usuários, telas ativas ou frequência de uso. Incluem ocorrências em componentes, loops e eventuais comentários. A investigação detalhada priorizou formulários com catálogos e composições relevantes; não constitui auditoria integral dos três sistemas.

Existem **80 arquivos `MaxInput*.vue`** na raiz de `UI/src/components`, incluindo barras auxiliares. `MaxInputEntity` e `MaxInputGender`, citados como exemplos, **já existem** e estão exportados. Também já existem inputs para e-mail, URL, senha, RG, endereço, datas, horário, dias da semana/mês, potência, tensão, corrente, distância, tokens, duração, plataformas sociais, tipo de conteúdo, execução/cobrança de IA e unidades de cobrança. Nenhum deles integra a lista de novos componentes.

## 2. Escopo

### 2.1. Incluído na execução futura proposta

1. Criar os 15 componentes públicos da seção 3, suas interfaces, catálogos, testes e exemplos.
2. Compor controles usando a infraestrutura Max existente, sem PrimeVue.
3. Publicar a API no código da biblioteca: exports raiz, tipos, manifesto/resolver e subpaths conforme padrão atual. Isso **não significa publicar no npm**.
4. Validar contratos com dados sintéticos equivalentes aos formatos encontrados nos três consumidores, sem conectar às aplicações reais.
5. Documentar diferenças entre catálogos padrão, limites de backend e futuras adaptações dos consumidores.

### 2.2. Fora de escopo

- Alterar arquivos de Engeapp, MaxAiManager, SocialMedia, MaxUse ou MaxPinia.
- Substituir inputs nas aplicações nesta entrega, corrigir seus problemas preexistentes ou migrar valores persistidos.
- Instalar dependências nesta sessão Plan; executar testes, builds, geradores ou servidores nesta sessão.
- Criar endpoints, bancos, filas, cache próprio, polling, uploads, credenciais, consultas a fornecedores ou execução de SQL.
- Adicionar bibliotecas, mudar versões, remover classes legadas `.p-*`, modificar a identidade visual ou refatorar bases compartilhadas sem necessidade comprovada.
- Commit, merge, push, release, publicação npm, deploy ou limpeza da worktree.

## 3. Arquitetura & Mudanças Técnicas

### 3.1. Evidências dos pontos de origem

Todos os caminhos desta tabela existem e foram consultados por leitura ou busca direcionada. Os identificadores permitem retomar sem a conversa.

| Evidência | Localização e elementos |
|---|---|
| E1 | `E/resources/Vue/Components/SolarFinancing/ModalSolarFinancingSubmit.vue:21–27,119,224–249`: prazo, carência e ocupação; `E/app/Http/Controllers/CommercialProposal/CommercialProposalFinancingController.php:112–129`: validações |
| E2 | `E/resources/Vue/Components/Services/ServiceConfigModal.vue:43–46,162–173`: unidade e público de preços de serviços |
| E3 | `E/resources/Vue/Sections/Settings/Equipments/SettingsEquipments.vue:58,195–196`; `E/resources/Stores/List/useListSizeTypeInverter.Store.ts:11–15`: tipos `String` e `Micro` |
| E4 | `E/resources/Vue/Sections/Settings/Monitoring/SettingsMonitoring.vue:95,138,318–328`: autenticação e fluxo de credencial |
| E5 | `E/resources/Vue/Pages/SolarCompanyProjectCreatePage.vue:102`: código UC; `E/app/Http/Controllers/Integrador/SolarCompanyProjectController.php:258`: string de até 50 caracteres |
| A1 | `A/resources/Vue/Sections/Settings/Ai/ModalAiModel.vue:98–107,271–275`: situação do modelo |
| A2 | `A/resources/Vue/Sections/Settings/Ai/ModelPriceRulesEditor.vue:256–282`: modalidade de preço e cache; `A/app/Enums/AiPriceItemType.php` e `A/app/Enums/AiCacheOperation.php`: valores canônicos |
| A3 | `A/resources/Vue/Sections/Rag/ModalRag.vue:153–179,675,806–816`: escolha e bloqueio de tipos de fonte RAG |
| S1 | `S/resources/Vue/Sections/SocialMedia/TabBrandPositioning.vue:87–101,176–181`; `S/resources/Stores/socialMedia/useBrandPositioningStore.ts:5–8,21,56–90`: coleção de cor/detalhes e autosave MaxPinia |
| S2 | `S/resources/Vue/Sections/SocialMedia/ThemeScheduleBuilder.vue:14–49,97–173`; `S/resources/Stores/socialMedia/useThemesStore.ts:18–22`; `S/app/Http/Controllers/SocialMedia/ThemeController.php:250–275`; `S/app/Services/SocialMedia/ThemeScheduleService.php:97–208`: regras e semântica temporal |
| UI1 | `UI/src/components/base/MaxDomainSelect.vue`, `UI/src/types/domainInputs.ts`, `UI/src/components/MaxInputContentType.vue`: padrão de seletor tipado |
| UI2 | `UI/src/constants/{aiInputs,editorialInputs,electricalInputs,semanticInputOptions}.ts`: catálogos existentes e exclusão de duplicações |
| UI3 | `UI/src/components/{MaxColorPicker,MaxInputText,MaxInputTime,MaxInputWeekInterval,MaxInputMonthDays,MaxInputTextList}.vue`: composição e limites; TextList recebe string, não coleção de objetos |
| UI4 | `UI/src/index.ts`, `UI/src/types/index.ts`, `UI/src/components-manifest.json`, `UI/src/scripts/generateResolver.ts`, `UI/src/helpers/MaxComponentsUiResolver.ts`, `UI/vite.config.ts`, `UI/package.json`: distribuição |
| UI5 | `UI/tests/components/{MaxDomainSelect,MaxInputContentType}.test.ts`, `UI/tests/setup.ts`, `UI/vitest.config.ts`, inventário de `UI/tests/browser`: padrões de validação |
| UI6 | `UI/playground/src/catalog.ts`, `UI/playground/src/scenarios/index.ts`, `UI/scripts/verify-consumers.mjs`: catálogo, carregamento tardio e consumidores temporários |

### 3.2. Catálogo fechado dos 15 componentes propostos

Os nomes, arquivos e contratos abaixo são **propostas para criação**, não APIs já disponíveis. Cada componente terá `src/components/<Nome>.vue` e `tests/components/<Nome>.test.ts`.

| ID | Nome novo | Propósito e origem | Modelo e catálogo padrão |
|---|---|---|---|
| I01 | `MaxInputOccupation` | Ocupação para solicitação de financiamento — E1 | `CLT`, `EMPRESARIO`, `AUTONOMO`, `SERVIDOR_PUBLICO`, `APOSENTADO`, `PRODUTOR_RURAL`, `OUTROS`; string ou `null` |
| I02 | `MaxInputFinancingTerm` | Prazo preferencial em meses — E1 | `24,36,48,60,72,84,96,120`; número ou `null` |
| I03 | `MaxInputFinancingGracePeriod` | Carência em dias — E1 | `30,60,90,120`; número ou `null` |
| I04 | `MaxInputServicePricingUnit` | Base de medição do preço de serviço — E2 | `kwp`, `modulo`, `km`, `unidade`; string ou `null` |
| I05 | `MaxInputServiceAudience` | Destinatários da faixa/preço/adicional — E2 | `final_consumer`, `other_integrators`, `both`, `nobody`; string ou `null` |
| I06 | `MaxInputInverterType` | Tecnologia do inversor — E3 | `String`, `Micro`, preservando caixa; string ou `null` |
| I07 | `MaxInputMonitoringAuthType` | Modelo de autenticação do monitoramento — E4 | `global_api_keys`, `user_api_keys`, `python_automation`, `oauth2_redirect`; string ou `null` |
| I08 | `MaxInputMonitoringCredentialFlow` | Forma de obtenção da credencial — E4 | `assisted_key_generation`, `direct`, `oauth_flow`; string ou `null` |
| I09 | `MaxInputConsumerUnit` | Identificador da unidade consumidora — E5 | `string` ou `null`, máximo padrão 50; sem máscara fixa, cálculo, consulta ou conversão numérica |
| I10 | `MaxInputAiModelStatus` | Situação de aprovação de modelo — A1 | `approved`, `pending`, `failed`; string ou `null` |
| I11 | `MaxInputAiPriceItemType` | Modalidade da regra de preço de IA — A2 | união dos valores canônicos de `AiPriceItemType.php`, listados na seção 3.4 |
| I12 | `MaxInputAiCacheOperation` | Operação de cache tarifada — A2 | `read`, `write`, `storage`; string ou `null` |
| I13 | `MaxInputRagSourceType` | Tipo de fonte a adicionar à base RAG — A3 | `document`, `url`, `text`, `mysql`; string ou `null` |
| I14 | `MaxInputColorPalette` | Coleção de cores com descrição de uso — S1 | `Array<{ color: string; details: string }>`; padrão `[]` |
| I15 | `MaxInputScheduleRules` | Editor composto de regras editoriais — S2 | união discriminada `ScheduleRule[]`; padrão `[]` |

Distribuição por evidência: 9 Engeapp, 4 MaxAiManager e 2 SocialMedia. Não se impõe cota igual por projeto: muitos inputs simples de IA e SocialMedia já existem. I14/I15 são novos propósitos compostos, não renomeações de `MaxColorPicker` ou `MaxInputScheduleType`.

### 3.3. Contrato comum dos seletores I01–I08 e I10–I13

- Usar `MaxDomainSelect` privado, que já compõe `MaxInputSelect` e `InputBase`; não criar outro dropdown.
- Props comuns baseadas em `BaseDomainInputProps<T>`: `modelValue`, `label`, `placeholder`, `filter`, `disabled`, `required`, `clearable`, `showClear`, `done`, `error`, `caution`, `noMessage`. Defaults seguem `MaxInputContentType`: modelo `null`, desabilitado/obrigatório/limpável/filtro `false`, estados manuais `undefined`.
- Eventos tipados `update:modelValue`, `change` e `clear`; seleção e limpeza não podem duplicar eventos. `''` recebido representa ausência e vira `null` internamente; nenhum preenchimento ou emissão automática na montagem/atualização do pai.
- Propagar `id`/`inputId` conforme contrato real de `InputBase`, descrições ARIA, atributos de dados e mensagens ao controle correto; declarar props próprias quando o repasse por attrs não atender. Não supor que `useAttrs` seja reativo para watchers/computeds.
- Slots `value` e `option` só devem ser instalados no filho quando fornecidos, preservando sua renderização padrão.
- Catálogos `readonly DomainSelectOption<T>[]`, com `value`, `label` e `name`, exportados e sem mutação compartilhada. Não aceitar sobrescrita acidental via `attrs` de `options`, `loadOptions`, grupos e nomes de campos reservados.
- Valor desconhecido recebido deve permanecer visível com erro local, sem conversão destrutiva nem seleção automática da primeira opção. Erro explícito do pai tem precedência.
- I01, I02 e I03 terão prop **explícita** `options?: readonly DomainSelectOption<T>[]`, para ocupações de outros provedores e ofertas de prazo/carência específicas. `T` será string em I01 e número inteiro positivo em I02/I03. Ausência usa o catálogo padrão; `[]` explícito significa nenhuma oferta, nunca fallback para ofertas inexistentes. Não aplicar coerção string/número.
- Demais seletores terão catálogo fechado. Uma extensão futura requer atualização explícita do contrato, não um bypass por atributos.
- Labels padrão: Ocupação; Prazo do financiamento; Carência da primeira parcela; Unidade de preço do serviço; Público do serviço; Tipo de inversor; Tipo de autenticação; Fluxo de credencial; Situação do modelo; Modalidade de preço de IA; Operação de cache; Tipo de fonte RAG. Todos substituíveis pelo consumidor.
- Rótulos de opções em pt-BR preservam o significado dos formulários de origem. I06 usa “String”/“Microinversor”; I10 “Aprovado”/“Pendente”/“Falhou”; I12 “Leitura”/“Escrita”/“Armazenamento”. Não traduzir os códigos.
- I02 não representa todas as ofertas aceitas pelo backend: seu catálogo padrão replica a tela. Backend observado admite prazo de 6 a 120 meses. A biblioteca não garante elegibilidade de banco nem deve iniciar simulação.
- I07/I08/I13 apenas selecionam códigos. Não autenticam, não executam automação, não habilitam acesso SQL e não trocam de fonte durante upload quando o consumidor passar `disabled`.

### 3.4. IA: contrato canônico e incompatibilidade observada

Valores propostos de I11, transcritos do enum existente, sem inventar aliases:

```text
global, text, embedding, rerank, moderation, ocr, tts, stt,
speech_to_speech, live_audio, live_video, document_process,
image_process, image_create, image_edit, image_upscale, image_avatar,
video_process, video_create, video_edit, video_upscale, video_avatar,
video_add_voice, video_dubbing, audio_process, audio_create,
sound_effect_create, voice_create, music_create, avatar_create,
voice_clone, translate_audio, translate_video, translate_text, lip_sync
```

Na tela A2 há códigos como `image`, `document`, `video`, `audio` e `audio_live` que não são os valores correspondentes do enum. A nova biblioteca utilizará os códigos canônicos **somente para o novo componente**. Valores legados recebidos ficam visíveis e inválidos; não haverá mapeamento silencioso. Adoção nessa tela fica condicionada a análise separada de compatibilidade e autorização. Não presumir que a simples validação de string do request torna esses valores equivalentes no cálculo.

I12 inclui `storage`, que existe no enum mas não nas duas opções da tela. Isso não altera a tela, a lógica de `cached`, preços, aprovações ou persistência. Ambos os componentes precisam de revisão de contrato antes de integração externa.

### 3.5. I09 — unidade consumidora

- Compor `MaxInputText`, com label “Unidade consumidora (UC)”, `modelValue?: string | null`, `maxLength?: number` padrão 50 e estados/mensagens usuais de entrada.
- Receber e emitir string sem remover zeros iniciais, separadores, letras ou caixa; não aplicar trim automático. Campo vazio digitado emite `null`.
- Limite excedido deve ficar visível como erro, sem truncar informação recebida ou colada silenciosamente. Não impor limite numérico nem máscara nacional: os formatos variam por concessionária.
- `required` valida ausência; erro manual do consumidor prevalece. Sem consulta externa, sem alterar `installation_code` e sem interpretar sentinelas históricas como “Sem Unidade Consumidora”.

### 3.6. I14 — paleta com detalhes

- Compor `MaxColorPicker`, `MaxInputText`, `MaxButton` e `MaxIconButton`, com layout SCSS semântico. Uma linha contém cor, descrição e remoção; botão adiciona `{ color: '#000000', details: '' }`, como na origem.
- Props: `modelValue?: ColorPaletteItem[]`, `id?`, `label?`, `disabled?`, `required?`, `error?`, `caution?`, `noMessage?`, `ariaDescribedby?`; defaults `[]`, label “Paleta de cores”, flags `false`.
- Eventos: `update:modelValue` e `change` com uma nova coleção por ação. Não mutar props, objetos aninhados nem arrays do pai. Atualização externa não emite eco. Nenhuma requisição ou persistência própria.
- Manter ordem, duplicatas e detalhes livres. Não inventar deduplicação, limite de cores, exclusão com confirmação ou normalização automática de dados existentes.
- Representação válida de cor: hexadecimal com `#`, 3 ou 6 dígitos. Manter string recebida; entradas novas do picker são `#rrggbb`. Cor inválida deve apresentar texto original e erro, não ser trocada no modelo pelo vermelho de fallback visual do picker.
- Incluir campo textual da cor usando `MaxInputText` além do picker, para edição explícita e inspeção de valores inválidos. Texto em edição usa rascunho local; só confirma cor válida; blur inválido mostra erro sem sobrescrever o modelo. Detalhes continuam editáveis.
- Grupo com nome acessível; cada linha tem labels/IDs únicos e botões com nomes completos. Após remover, foco vai para a linha vizinha ou “Adicionar cor”. Estado disabled bloqueia todas as ações. `required` exige pelo menos uma cor válida; erro externo e erros locais não devem desaparecer por acidente.

### 3.7. I15 — editor de regras de agendamento

Novo contrato público independente dos imports `@/Stores` dos consumidores:

```typescript
type ScheduleWeekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type ScheduleRule =
    | { type: 'specific_dates'; dates: string[]; time?: string }
    | { type: 'weekly'; weekdays: ScheduleWeekday[]; interval_weeks: number; anchor?: string; time?: string }
    | { type: 'monthly_days'; days: number[]; time?: string }
    | { type: 'monthly_nth_weekday'; nth: 1 | 2 | 3 | 4 | 5; weekday: ScheduleWeekday; time?: string };
```

- Props de coleção/estado seguem I14, com label “Agendamento”. Eventos `update:modelValue` e `change` recebem `ScheduleRule[]` novo por ação confirmada; sem emissões iniciais nem mutação aninhada.
- Usar `MaxInputScheduleType`, `MaxInputTime`, `MaxInputDatePicker`, `MaxInputWeekday`, `MaxInputWeekInterval`, `MaxInputMonthDays`, `MaxInputMonthOccurrence`, controles Max de seleção múltipla e botões. Não copiar os botões nativos de dias da tela.
- Inicialização por ação de adicionar: datas específicas, `dates: []`, `time: '09:00'`. Trocar tipo cria a estrutura padrão do novo tipo e preserva somente horário existente; não conservar propriedades incompatíveis.
- Padrões restantes: semanal com `weekdays: []`, `interval_weeks: 1`; dias do mês com `days: []`; ocorrência mensal com `nth: 1`, `weekday: 'monday'`. Preservar ausência de campos opcionais recebidos até ação do usuário, sem preencher o modelo na montagem.
- Horário estrito `HH:mm`, sem timezone ou conversão UTC; datas reais de calendário em `YYYY-MM-DD`. Validar inclusive ano bissexto, não apenas expressão regular. `anchor` opcional usa a mesma forma; intervalos inteiros 1–52, conforme backend. Oferecer explicitamente as 52 opções a `MaxInputWeekInterval`, cujo padrão só vai até 4.
- Dias do mês inteiros 1–31; nomes de dias exatamente os sete códigos acima; `nth` 1–5. Quinta ocorrência é literalmente a quinta e pode não existir em um mês; nunca chamar de “última”. O componente não expande regras em datas nem implementa o calendário do servidor.
- Não rejeitar o dia 31 por depender do mês futuro. Não remover duplicatas ou reordenar regras carregadas silenciosamente. Ações individuais de seleção podem impedir adicionar novamente o mesmo dia.
- Rascunhos incompletos (ex.: regra nova ou data vazia recém-adicionada) ficam locais e indicados como erro até confirmação válida. Adicionar uma regra cria linha local, mas só emite a coleção atualizada quando os campos obrigatórios daquela regra estiverem válidos e sua coleção de datas/dias não estiver vazia. Enquanto isso, ações válidas em regras já confirmadas podem emitir sem incluir a nova regra incompleta. Não gerar autosave de strings de data inválidas ou arrays obrigatórios vazios. Não confundir validação de estrutura com elegibilidade editorial.
- Atualização externa efetivamente diferente substitui rascunhos e limpa seus erros; simples eco do valor emitido não perde rascunhos ainda ativos de outros campos. Testar duas instâncias e troca de registros, sem estado global.
- Estado inválido recebido deve permanecer inspecionável e sinalizado; não descartar a regra, mudar seu tipo ou salvá-la automaticamente. Implementar checagem em runtime na fronteira, mesmo com tipos estritos.
- Grupo nomeado, descrições/erros ligados por ARIA, IDs únicos por instância/linha, navegação por teclado e restauração de foco após remoção. Usar `nextInstanceId` existente quando adequado ao padrão local; não criar IDs persistidos dentro do payload.

### 3.8. Organização dos arquivos futuros

| Situação | Arquivos |
|---|---|
| Novos | 15 SFCs e 15 testes unitários, com os nomes da seção 3.2 |
| Novos | `src/types/specializedInputs.ts`; `src/constants/financingInputs.ts`; `src/constants/serviceInputs.ts`; `src/constants/monitoringInputs.ts` |
| Novos | `src/helpers/scheduleRules.ts`, com validação/atualização puramente de domínio, não funções genéricas duplicadas do MaxUse; testes `tests/helpers/scheduleRules.test.ts` |
| Novos | `tests/browser/SpecializedInputs.browser.ts` e fixture correspondente sob `tests/browser/fixtures/`; `playground/src/scenarios/inputs-specialized.vue` |
| Existentes a estender | `src/constants/aiInputs.ts` (I10–I13), `src/constants/electricalInputs.ts` (I06), `src/index.ts`, `src/types/index.ts`, `src/components-manifest.json`, `package.json`, `tests/index.test.ts`, `scripts/verify-consumers.mjs`, `playground/src/catalog.ts`, `playground/src/scenarios/index.ts`, `docs/INPUTS-DOMAIN.md` |
| Preservar, salvo necessidade causal demonstrada | `MaxDomainSelect`, `MaxInputSelect`, `InputBase`, helpers genéricos, configuração de build e bibliotecas irmãs |

O build descobre automaticamente SFCs da raiz; não colocar componentes públicos em `components/base`. O resolver lê o manifesto gerado. O gerador atual altera apenas o manifesto, **não** exports raiz, tipos ou `package.json`: estes precisam de revisão explícita. O wildcard de subpath existe, mas os novos subpaths explícitos devem seguir a convenção dos anteriores.

### 3.9. MaxUse, MaxPinia e limites de ambiente

- A biblioteca depende de `@maxvue/max-use: ^1.1.47`; instalada na resolução observada: `1.1.47`. Usar helpers existentes desse pacote para utilidades genéricas, como `hasContent`; verificar assinatura real antes de usar outros. Não importar helpers da checkout irmã `MaxUse` 2.0.1 nem criar dependência `file:`.
- Coleções serão atualizadas imutavelmente; não é necessário inventar helper genérico para spread/map/filter. `scheduleRules.ts` conterá somente regras específicas novas do domínio, não um serviço genérico de datas.
- MaxPinia é peer opcional `^0.2.0`; inputs da biblioteca são controles sem acesso a dados, não lojas de dados. **Não criar store para catálogo estático, cor ou rascunho de formulário.** Nos consumidores a persistência permanece nas stores MaxPinia existentes. Qualquer futura adoção deve ligar `v-model` à store/formulário atual e manter GET/saves/cache ali, sem Axios nos inputs e sem outra camada de cache.
- Os três consumidores declaram bibliotecas `file:./storage/libs/...`; os links instalados apontam para as raízes irmãs, não esta worktree. Suas versões observadas são UI `1.1.14`, MaxPinia `0.2.0`, MaxUse `2.0.1`. Testar esses consumidores diretamente não prova o conteúdo desta branch e pode atingir recursos compartilhados.
- `node_modules` da worktree resolve dependências sob a raiz principal. Vue observado `3.6.0-rc.10`, Pinia `4.0.3`; MaxPinia não está instalado ali. Isso não comprova falha, mas exige preflight e isolamento antes de qualquer processo que escreva cache/artefatos.
- A documentação oficial Vue consultada confirma props/emits tipados, repasse explícito com `inheritAttrs: false`, ausência de reatividade observável de `useAttrs` e recomendação de eventos em vez de mutar objetos/arrays recebidos. Referências: <https://vuejs.org/api/sfc-script-setup>, <https://vuejs.org/guide/components/attrs>, <https://vuejs.org/guide/components/props>. A fonte é documentação geral Vue 3, não certificação específica da RC instalada.

Fluxo pretendido:

```text
Store MaxPinia / formulário do consumidor
        -> props/modelValue
        -> input especializado -> controles Max -> InputBase/controle acessível
        <- evento tipado com código/coleção
        <- consumidor decide salvar; input nunca acessa API/cache
```

## 4. Plano de Execução Faseado

1. **Preflight por leitura e congelamento dos contratos:** revalidar branch, alterações locais, dependências efetivas, scripts/hooks e esta lista de 15 nomes; garantir isolamento para validações. Interromper se houver conflito ou instalação compartilhada sem estratégia autorizada.
2. **Tipos e catálogos:** criar interfaces e opções, adicionando apenas os contratos listados. Revisar enum de IA e datas antes de depender deles.
3. **Seletores e UC:** implementar os 12 seletores mais I09, com testes de valores, eventos e repasse de attrs.
4. **Compostos:** implementar I14 e I15, com rascunhos, imutabilidade, erros, teclado e testes de integração. Nenhum teste/build entre microalterações.
5. **API e exemplos:** exports, tipos, manifesto, subpaths, playground, testes de consumidor temporário e documentação.
6. **Validação consolidada:** concluir todo código e testes; executar os gates previstos no plano, corrigir falhas em lote, revalidar somente conteúdo afetado. Manuais pendentes impedem conclusão integral.
7. **Revisão e handoff:** conferir contratos/ausência de regressões e registrar progresso no Execute, sem integrar Git ou publicar.

O detalhamento executável e a matriz de aceite estão em `plan.md` neste mesmo diretório.

## 5. Critérios de Aceite & Validação

1. Exatamente 15 novos inputs da lista, sem recontar componentes existentes ou aliases.
2. Códigos, tipos numéricos/string e coleções preservados. Zero emissão automática na montagem/sincronização do pai e nenhuma mutação de props.
3. Valores desconhecidos visíveis; nenhum mapeamento automático de modalidades de IA, perda de zero inicial da UC ou alteração de semântica de quinta ocorrência.
4. Catálogos configuráveis têm comportamento explícito para `[]`; nenhum termo financeiro é apresentado como oferta aprovada.
5. I14/I15 funcionam com teclado, foco, erro, required, disabled, duas instâncias, atualização externa e dados inválidos. Nenhuma gravação de rascunho inválido por efeito colateral do input.
6. Export raiz, tipos, resolver e todos os subpaths novos comprovados com pacote construído desta revisão, não checkout irmão.
7. Nenhum import/dependência PrimeVue, dependência local de MaxUse ou mudança involuntária dos componentes legados.
8. Validação futura: `npm run verify` é o gate completo identificado. Ele inclui tipos, lint, build, testes/cobertura, navegador, bundle do playground, benchmarks, consumidores, árvore npm e auditoria. Não executar seus componentes novamente sobre a mesma revisão aprovada.
9. O gate faz instalações em consumidores temporários e consulta rede na auditoria; só executar no Execute com autorização/ambiente pertinentes, `CONSUMER_TEMP_DIR` sob a worktree e sem tocar aplicações reais. Falta de rede/Chromium/isolamento é bloqueio registrado, não aprovação.
10. Revisão visual manual do playground: desktop e largura pequena, temas claro/escuro, foco visível, textos compridos, contraste e componentes dentro de modal. Marcar `manualPending` até completar se o ambiente não permitir.

Não há endpoints novos, migrações, dados reais necessários nem aceite por fornecedor externo. Testes sintéticos atestam a biblioteca; não atestam a adoção ou os efeitos financeiros/editoriais nas aplicações reais. Achados fora do escopo estão em `docs/notifications/wt-0a098c5a/notifications/`.
