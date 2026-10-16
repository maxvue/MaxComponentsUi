# Especificação técnica — dez inputs de domínio

Data: 16/10/2026. Projeto: `@maxvue/max-components-ui` 1.1.12. Worktree: `wt-9a811fd4`.

## 1. Contexto & Objetivo

Os projetos engeapp, MaxAiManager e SocialMedia repetem catálogos e contratos de seleção em campos genéricos. Criar dez inputs especializados na biblioteca, com opções prontas, tipagem e acessibilidade herdadas do `MaxInputSelect`, reduz essa repetição sem levar regras de negócio ou acesso a servidores para os componentes.

Esta sessão apenas investiga e documenta. A implementação abaixo é uma proposta para execução posterior autorizada. Nenhum teste, build, instalação ou publicação foi executado.

### Evidência e limites

Raiz confirmada por `pwd` e `git rev-parse --show-toplevel`: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-9a811fd4`; branch `wt-9a811fd4`; HEAD `bae1879d2f2130d2aebb2354f7b810d859377767`. O estado Git inicial estava limpo. `.gitignore:68-69` já ignora worktrees.

Foram inventariados estaticamente os arquivos Vue de `resources` das árvores principais dos três consumidores, sem consultar outras worktrees: 361 no engeapp, 47 no MaxAiManager e 23 no SocialMedia. Ocorrências textuais de `MaxInputSelect`: 144, 16 e 9, respectivamente. São indicadores de busca, não contagens de campos efetivamente renderizados; incluem trechos comentados e condicionais. Os fluxos da seleção final foram lidos individualmente.

Fontes externas locais, somente para consulta:

| Projeto | Raiz | HEAD consultado |
|---|---|---|
| engeapp | `/home/johnattas/GitHub/engeapp` | `47071e3b2a5233da5d9977041cca74720c956b21` |
| MaxAiManager | `/home/johnattas/GitHub/MaxAiManager` | `241af26bbcf5c78c69d82946c7167fc607dcef58` |
| SocialMedia | `/home/johnattas/GitHub/SocialMedia` | `8e6cbe1fbc561dde1ef27b143936224d522c49fa` |

Os HEADs identificam as bases, não provam ausência de alterações locais nesses consumidores. A evidência corresponde aos arquivos efetivamente lidos. Não houve validação em navegador nem auditoria integral dos projetos.

## 2. Escopo

### Incluído

- Exatamente os dez componentes da tabela seguinte, ausentes em `src/components`, exports e catálogo consultados da worktree ativa.
- Contratos públicos, catálogos locais, composição do select existente, testes, exports, manifesto/resolver, exemplos e documentação.
- Preservação dos valores técnicos encontrados nos consumidores. Correções ortográficas dos novos rótulos não alteram os valores.
- Registro sanitizado dos componentes ausentes e dos achados fora do escopo.

### Fora de escopo

- Alterar os três aplicativos, substituir seus campos, remover listas/stores ou atualizar `storage/libs`.
- Backend, regras de cobrança, cálculo/dimensionamento elétrico, expansão de agenda, uploads, cache ou autosave próprios dos inputs.
- Instalações e atualização de dependências, mudanças de versão, migrações, banco, publicação, commit, merge ou push.
- Refatorar `MaxInputSelect`, `InputBase` ou outros inputs existentes. Problemas nesses contratos exigem diagnóstico e decisão específica antes de ampliar o escopo.
- Os componentes reservados: `MaxInputEntity`, `MaxInputGender`, `MaxInputEmail`, `MaxInputUrl`, `MaxInputPassword`, `MaxInputTime`, `MaxInputWeekday`, `MaxInputMonth`, `MaxInputYear`, `MaxInputSlug`, `MaxInputPercent`, `MaxInputPower`, `MaxInputCurrent`, `MaxInputVoltage`, `MaxInputDistance`, `MaxInputDuration`, `MaxInputTokenLimit`, `MaxInputMonthDays`, `MaxInputWeekInterval` e `MaxInputSocialPlatform`. Não criar aliases ou substitutos disfarçados deles.

## 3. Arquitetura & Mudanças Técnicas

### 3.1. Seleção dos dez inputs e contratos de domínio

Todos são seletores, não campos livres. `T` nas próximas seções é o conjunto de valores da respectiva linha.

| ID | Novo componente / label padrão | Valores de T, na ordem | Evidência existente e justificativa |
|---|---|---|---|
| D01 | `MaxInputPhase` / Número de fases | números `1`, `2`, `3` | engeapp `resources/Stores/List/useListPhases.Store.ts:12-17`; `resources/Vue/Sections/Project/ProjectData/SubSections/ElectricalData.vue:10,26`; também proposta comercial e equipamentos. Monofásico, bifásico, trifásico; não é tensão ou corrente. |
| D02 | `MaxInputWireSize` / Seção do condutor | números `0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630, 800, 1000` | engeapp `resources/Stores/List/useListWireSizes.Store.ts:12-38`; `ElectricalData.vue:12,28`. Seção transversal em mm², não diâmetro, distância ou dimensionamento automático. |
| D03 | `MaxInputWireType` / Material e isolamento | `copper-70`, `copper-90`, `aluminum-70`, `aluminum-90` | engeapp `resources/Stores/List/useListTypeWire.Store.ts:12-18`; `ElectricalData.vue:13,29,44-54`. O contrato combina material e temperatura de isolamento; não reduzir a cobre/alumínio. |
| D04 | `MaxInputAiExecutionType` / Tipo de execução | `cloud`, `local` | MaxAiManager `resources/Vue/Sections/Settings/Ai/ModalAiModel.vue:45-54,285-288`; `app/Http/Requests/Settings/Ai/AiModelRequest.php:91`. Nuvem / Local (auto-hospedado); não seleciona fornecedor/modelo nem muda fila. |
| D05 | `MaxInputAiBillingMode` / Forma de cobrança | `dollar`, `bonus`, `free`, `local` | mesmo modal `:55-64,290-295`; mesmo request `:92`. Dólar (USD), Bônus (créditos), Gratuito, Local (custo zero). Categoria de cobrança do modelo, não meio de pagamento. |
| D06 | `MaxInputAiBillingUnit` / Unidade de cobrança | `m_tokens`, `tokens`, `unity`, `characters`, `second`, `minute`, `hour` | MaxAiManager `resources/Vue/Sections/Settings/Ai/ModelPriceRulesEditor.vue:74-80,173-179,270-278`; request acima `:95,105` aceita string. Por 1 milhão de tokens, token, unidade/requisição, caractere, segundo, minuto, hora. Não é limite de tokens nem duração. |
| D07 | `MaxInputPaymentMethod` / Método de pagamento | `pix`, `credit_card` | MaxAiManager `resources/Vue/Pages/RechargesPage.vue:57-67,168-175,189-192`; `app/Enums/ProviderCreditRechargePaymentMethod.php:5-18`. PIX / Cartão de crédito. Catálogo inicial deliberadamente restrito aos dois métodos comprovados; não processa transações. |
| D08 | `MaxInputScheduleType` / Tipo de agendamento | `specific_dates`, `weekly`, `monthly_days`, `monthly_nth_weekday` | SocialMedia `resources/Vue/Sections/SocialMedia/ThemeScheduleBuilder.vue:16,79-84,101-122`; `app/Http/Controllers/SocialMedia/ThemeController.php:263`. Datas específicas, Semanal, Dias do mês, Enésimo dia da semana. Escolhe somente a estratégia; não edita suas datas/dias/intervalos. |
| D09 | `MaxInputMonthOccurrence` / Ocorrência no mês | números `1`, `2`, `3`, `4`, `5` | mesmo builder `:48,93-95`; controller `:273`; `app/Services/SocialMedia/ThemeScheduleService.php:162-208`. Rótulos 1ª a 5ª ocorrência. `5` é quinta, quando existir; nunca significa última. Não é seleção do mês nem lista de dias do mês. |
| D10 | `MaxInputContentType` / Tipo de conteúdo base | `image`, `pdf`, `audio`, `text`, `url` | SocialMedia `resources/Vue/Sections/SocialMedia/ThemeContentList.vue:5,67-73`; `resources/Stores/socialMedia/useThemesStore.ts:6,18-22`. Imagem, PDF, Áudio, Texto, URL. Seleciona o tipo, não substitui os inputs de URL, texto ou arquivo. |

Para D02, apresentar decimais em pt-BR e unidade mm²; manter número no model. Para D03: Cobre — PVC 70 °C; Cobre — EPR/XLPE 90 °C; Alumínio — PVC 70 °C; Alumínio — EPR/XLPE 90 °C. Não anunciar certificação normativa com base apenas nessa lista.

### 3.2. Contrato comum proposto

- Props públicas tipadas por componente: `modelValue?: T | '' | null`, padrão `null`; `label?: string` com padrão da tabela; `placeholder?: string`; `filter?: boolean`; `disabled?: boolean`; `required?: boolean`; `clearable?: boolean`; `showClear?: boolean`; `done?: boolean`; `error?: string | boolean | null`; `caution?: string | boolean | null`; `noMessage?: boolean`. Booleanos padrão `false`, exceto `done/error/caution` sem imposição de estado. Busca padrão `true` apenas em D02; `false` nos demais.
- `update:modelValue` emite `T | null`; `change` emite `T | null`; `clear` não tem payload. Uma mudança de seleção produz cada evento correspondente uma única vez; limpar produz uma atualização para `null`, um `change(null)` e um `clear`. Selecionar novamente o mesmo valor pode emitir `change`, como o select atual, mas não duplica atualização do model.
- Não emitir atualização na montagem ou somente porque o pai mudou o model; proteger o wrapper dos ecos do watcher do select (`MaxInputSelect.vue:324-339`). Não inventar um valor inicial de negócio nem repassar `default`.
- `''`, `null` e ausência representam vazio na entrada; saída de limpeza é `null`. Não converter strings numéricas, booleanos, índices ou objetos em opções válidas. Typescript deve rejeitar valores fora de T; em runtime, valor desconhecido recebido deve ser preservado, exibido como texto escapado no slot de valor e marcado como inválido sem emitir correção silenciosa. Vazio não recebe erro automático: `required` mantém o contrato visual/ARIA existente.
- Erro explícito do consumidor tem precedência, inclusive `false`; na ausência (`null`/`undefined`), valor desconhecido recebe mensagem local de opção inválida. Essa validação não substitui validação do formulário/servidor.
- Repassar `id`, `aria-*`, `class`, atributos UnoCSS, ícones, mensagens e estados de `InputBase` ao select por uma única rota, sem sobrescrever o contrato do catálogo. `options`, `groupOptions`, `loadOptions`, `optionValue`, `optionLabel`, `optionName`, `default` e variantes kebab-case não são extensões públicas desses inputs; filtrar tais atributos. Não expor catálogo assíncrono ou configurável nesta versão.
- Slots `value` e `option` preservam os payloads do `MaxInputSelect`; manter renderização padrão quando não fornecidos. Não usar `v-html` para valores externos.
- O combobox deve manter associação label/id, `aria-describedby`, `aria-invalid`, `aria-required`, navegação por teclado, foco e overlay do select. Não prometer validação/submissão HTML nativa que o select atual não fornece.

### 3.3. Composição e arquivos

Fluxo: formulário/MaxPinia do consumidor → `v-model` tipado no novo input → adaptador privado → `MaxInputSelect` → `InputBase`/combobox. Eventos retornam ao formulário; não há persistência no input.

Arquivos novos propostos:

- Dez `src/components/<NomeDaTabela>.vue`, com interfaces públicas específicas.
- `src/components/base/MaxDomainSelect.vue`: composição interna do select, forwarding controlado de attrs/slots e tratamento comum de vazios, desconhecidos e eventos. Não exportar nem registrar no manifesto público.
- `src/types/domainInputs.ts`: tipos de valores, opções e props comuns; sem `any` na API nova. Adaptador interno pode aceitar a união `string | number`; wrappers fazem estreitamento para seus tipos de domínio.
- `src/constants/electricalInputs.ts`, `aiInputs.ts`, `paymentMethods.ts`, `editorialInputs.ts`: catálogos tipados, independentes de aplicativos. Produzir arrays de opções sem mutar os catálogos compartilhados. Usar chaves `value`, `name`, `label` consistentes para trigger e lista.
- Dez `tests/components/<NomeDaTabela>.test.ts`, `tests/components/MaxDomainSelect.test.ts`, `tests/types/domainInputs.test.ts`, `tests/browser/MaxDomainInputs.browser.ts` e `docs/INPUTS-DOMAIN.md`.

Arquivos existentes a alterar na execução: `src/index.ts`, `src/components-manifest.json`, `package.json` (somente dez exports explícitos), `tests/index.test.ts`, `tests/helpers/resolver.test.ts`, `tests/architecture/package-exports.test.ts`, `playground/src/catalog.ts`, `playground/src/scenarios/inputs-select.vue`, `scripts/verify-consumers.mjs`. Build modular já descobre os SFCs da raiz (`vite.config.ts:32-39`). Manifesto deve ser gerado pelo processo existente, preservando todos os aliases anteriores. O teste de exports exige entradas explícitas e fixa hoje 127 SFCs; a adição isolada passa a 137, mas o executor deve recontar se a base tiver mudado. Não enfraquecer as verificações de existência em dist.

### 3.4. Ecossistema e decisões

- MaxComponentsUi é a própria biblioteca-alvo: reutilizar seu select/base, sem PrimeVue ou novos controles nativos concorrentes.
- MaxPinia permanece responsável por GET, cache e salvamentos dos consumidores. Catálogos estáticos e estado efêmero de demonstração não justificam stores ou tráfego de rede novos. A adoção futura mantém as stores existentes; não adicionar Pinia paralelo ou fetch/autosave nos inputs.
- MaxUse foi consultado em `/home/johnattas/GitHub/MaxUse/src`; a busca por esses catálogos não encontrou helpers equivalentes. Não é necessária uma nova função utilitária: a busca do select já existe, e operações locais simples podem usar recursos nativos. Helpers adicionais, se comprovadamente necessários, devem vir de `@maxvue/max-use`; não criar cópias de helpers nem dependências `file:` na biblioteca.
- Preferir seletores com vocabulário comprovado a novos inputs de texto que só trocariam o label. Arquétipo e tom de voz foram descartados porque hoje são texto livre; fechá-los imporia uma regra nova. Usuário/departamento/modelo/provedor dependem de dados e autorização do aplicativo e foram descartados deste lote.
- Documentação oficial Vue consultada via Context7: https://vuejs.org/api/sfc-script-setup e https://vuejs.org/guide/components/attrs. Confirma props/emits tipados e `inheritAttrs: false` para forwarding explícito. A documentação é da linha Vue 3, não uma garantia específica do RC do lockfile.
- Lockfile lido: Vue `3.6.0-rc.10`, Vite `8.3.3`, Vitest `4.1.11`, MaxUse `1.1.47`; `@maxvue/max-pinia` é peer opcional `^0.2.0`, não consta instalado no lock. `node_modules` da worktree é symlink; identidade/destino devem ser revalidados antes da execução.
- Os três aplicativos declaram bibliotecas via `file:./storage/libs/...`; a biblioteca-alvo consome MaxUse via npm. Não trocar essa escolha dos aplicativos nem assumir que ler o repositório irmão equivale à versão efetivamente carregada por eles.

## 4. Plano de Execução Faseado

1. Preflight exclusivamente por leitura: confirmar worktree, alterações locais, nomes livres, scripts/prehooks, resolução das dependências e isolamento dos testes. Revalidar as tabelas nas fontes; não investigar worktrees alheias.
2. Implementar contratos, catálogos, adaptador privado e seus testes; depois os dez wrappers e testes de cada um. Escrever todo o lote antes das validações executáveis.
3. Integrar exports explícitos, tipos públicos, manifesto, resolver e contagem de catálogo sem apagar trabalho concorrente.
4. Acrescentar demonstrações dos dez ao cenário existente de selects, documentação de API e testes de tipos/navegador/consumidor empacotado.
5. Revisar o lote, executar os gates previstos em `plan.md`, diagnosticar/corrigir falhas em conjunto e revalidar apenas revisões afetadas. Registrar progresso e handoff na execução futura.

## 5. Critérios de Aceite & Validação

- Exatamente D01–D10 novos; nenhum nome reservado ou input existente reimplementado.
- Listas, valores e tipos iguais à tabela; limpeza sem coerção; montagem/atualização externa sem correção de dados; eventos sem duplicação.
- D03 mantém isolamento; D05 não é D07; D06 não limita tokens; D08 não altera regras de agenda; D09 não calcula nem promete última ocorrência; D10 não faz upload.
- Testes cobrem cada opção, vazios, desconhecidos, estados, attrs, slots, teclado, reset pelo pai, múltiplas instâncias e imutabilidade dos catálogos. Interação real com o select é obrigatória, além de testes de forwarding com dublês.
- Dez exports raiz e subpaths com JS e declarações em dist; resolver com formas canônica/kebab/snake e aliases produzidos pelo gerador; todos presentes no playground.
- Gates futuros identificados: `npm run verify` agrega integridade, tipos, lint, build, unitários, cobertura, navegador, playground, benchmark, consumidores e dependências. Não executar nesta sessão Plan. Há instalações e rede internas no gate de consumidores/auditoria; requerem liberação operacional antes da execução futura.
- Verificação visual futura: claro/escuro, teclado, busca D02, feedback e larguras estreitas no playground. Testes/dublês não provam integração de API, transação de pagamento ou agenda externa; esses comportamentos estão fora do escopo.
- Ausência de navegador, dependências, autorização de rede ou checks válidos é pendência explícita, não entrega integralmente validada. A matriz por tarefa e o procedimento de retomada estão em `plan.md`.
