# Especificação técnica — dez inputs semânticos

## 1. Contexto & Objetivo

- Data: 2026-10-16. Projeto: `@maxvue/max-components-ui` 1.1.12.
- Worktree exclusiva: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-609c633c`, branch `wt-609c633c`, derivada de `dev`.
- Estado: proposta para revisão; nenhuma implementação, teste, instalação ou publicação executada nesta investigação.
- Pedido: analisar os inputs de Engeapp, MaxAiManager e SocialMedia e planejar exatamente dez inputs ainda inexistentes na biblioteca.
- Valor: retirar listas e regras de interface repetidas das aplicações, oferecendo contratos tipados e reutilizáveis sem acoplar o design system aos respectivos backends.

### 1.1. Evidências e seleção

As raízes consumidoras são `/home/johnattas/GitHub/engeapp`, `/home/johnattas/GitHub/MaxAiManager` e `/home/johnattas/GitHub/SocialMedia`. Os caminhos da tabela são relativos à respectiva raiz.

| Novo componente proposto | Necessidade observada | Evidência existente |
|---|---|---|
| `MaxInputEntity` | Selecionar Pessoa Física ou Pessoa Jurídica | Engeapp: `resources/Vue/Sections/Project/ProjectData/SubSections/ClientProjectData.vue:5,44–48`, valores `PF`/`PJ` |
| `MaxInputGender` | Selecionar Masculino ou Feminino | Mesmo arquivo: `6,12,50–53`, valores `M`/`F`; aparece também no representante de PJ |
| `MaxInputEmail` | E-mail dedicado, sem autodetecção telefônica | MaxAiManager: `resources/Vue/Pages/ResetPasswordPage.vue:16–26`; Engeapp: `resources/Vue/Sections/Auth/ForgotPassword.vue:14` |
| `MaxInputUrl` | Entrada de URL com validação e feedback próprios | MaxAiManager: `resources/Vue/Sections/Settings/Ai/ModalAiProvider.vue:43–51,108–116`; SocialMedia: `resources/Vue/Sections/SocialMedia/ThemeContentList.vue:18–23,89–92` |
| `MaxInputPassword` | Senha com confirmação exata e mostrar/ocultar acessível | MaxAiManager: `resources/Vue/Pages/ResetPasswordPage.vue:27–52` e `resources/Vue/Sections/Settings/Ai/ModalAiProvider.vue:53–71`; Engeapp: `resources/Vue/Sections/Auth/Register.vue:76–77` |
| `MaxInputTime` | Horário independente de calendário | SocialMedia: `resources/Vue/Sections/SocialMedia/ThemeScheduleBuilder.vue:17`; Engeapp: `resources/Vue/Components/SnoozeChatPopover.vue:8,34,41–45` |
| `MaxInputWeekday` | Dia da semana com rótulo pt-BR e valor estável | SocialMedia: `resources/Vue/Sections/SocialMedia/ThemeScheduleBuilder.vue:49,67–77` |
| `MaxInputMonth` | Mês independente com valor numérico | SocialMedia: `resources/Vue/Sections/SocialMedia/TabCalendar.vue:60,562–567` |
| `MaxInputYear` | Ano independente com faixa controlada | Mesmo arquivo: `61,569–572` |
| `MaxInputSlug` | Identificador kebab-case com validação local | MaxAiManager: `resources/Vue/Pages/ProjectsPage.vue:32–42,202–209`, `resources/Helpers/slug.ts:1–30`, `app/Http/Requests/Panel/ProjectRequest.php:34–41` |

Os dez nomes estão ausentes de `src/components/*.vue`, dos exports de `src/index.ts` e de `src/components-manifest.json`. A biblioteca tem 127 componentes Vue públicos na raiz de `src/components` na revisão investigada. Existirem primitivas capazes de compor um campo não equivale a existir o componente semântico: `MaxInputPhoneMail` aceita e-mail, `MaxInputText` aceita `type="password"` e `MaxInputBirthday` contém segmentos de mês/ano, mas nenhum fornece os dez contratos independentes propostos.

### 1.2. Limites da análise

Inventário estático de `resources/**/*.vue`: 361 arquivos no Engeapp, 47 no MaxAiManager e 23 no SocialMedia. Ocorrências de tags de abertura `MaxInputText`/`MaxInputSelect`: respectivamente 341/144, 49/16 e 22/9. São ocorrências textuais, inclusive possíveis trechos comentados, não número de controles ativos nem telemetria de produção. Houve leitura direcionada dos fluxos selecionados, não auditoria integral dos três sistemas. Não foram abertas credenciais, bases ou serviços em execução.

## 2. Escopo

### 2.1. Incluído

Dez componentes novos na biblioteca, contratos TypeScript públicos, listas locais necessárias, reaproveitamento de `InputBase`, `MaxInputSelect`, `MaxIconButton` e helpers disponíveis no MaxUse; exports, manifesto, testes, documentação de uso e exemplos no playground. Cobrir teclado, feedback, valores vazios, atualização externa, estados visuais e distribuição do pacote.

### 2.2. Fora de escopo

- Migrar telas, stores, endpoints, validações de servidor ou bancos dos três projetos analisados.
- Alterar PF/PJ, M/F, protocolos de agendamento, faixas de expediente ou regras de senha dos consumidores.
- Criar catálogos remotos de clientes, provedores, modelos de IA, plataformas ou concessionárias dentro da biblioteca.
- Reescrever componentes legados, corrigir achados notificados, alterar `MaxInputBirthday`, `MaxInputPhoneMail` ou `MaxInputText`.
- Adicionar dependências, PrimeVue, referências locais a MaxUse, atualização npm, commit, merge, push, deploy ou release.
- Criar stores ou persistir estado de campos apenas para satisfazer uma escolha de tecnologia. MaxPinia continua responsável por GET, cache e salvamento nas aplicações; os dez controles não possuem essas operações.

## 3. Arquitetura & Mudanças Técnicas

### 3.1. Composição

```text
Aplicação / store MaxPinia já existente
             ↕ modelValue / update:modelValue
Campo semântico novo
 ├─ Entity, Gender, Time, Weekday, Month, Year → MaxInputSelect → InputBase
 └─ Email, Url, Password, Slug → InputBase + input nativo + useInputValidation
                                      └─ Password → MaxIconButton
Helpers disponíveis → @maxvue/max-use publicado, nunca cópia local
```

Não criar outro combobox, calendário ou camada de rede. Reusar o comportamento de overlay, filtro e teclado do select. Para os quatro campos textuais, `MaxInputText` não permite fornecer um validador de domínio; compor `InputBase` diretamente evita duplicar validações ou ampliar sua API fora do pedido. Password usa o botão da própria biblioteca, irmão do input, nunca um controle interativo dentro de outro.

### 3.2. Contrato comum proposto

- Interfaces explícitas em `src/types/semanticInputs.ts`, reexportadas por `src/types/index.ts` e, portanto, pela raiz. Nomes `MaxInputEntityProps`, `MaxInputGenderProps` e equivalentes; tipos de valor enumerados onde aplicável. Sem `any` novo na API pública.
- Props comuns: `modelValue?`, `id?`, `name?`, `label?`, `placeholder?`, `disabled?`, `required?`, `done?: boolean`, `error?: string | boolean | null`, `caution?: string | boolean | null`, `noMessage?`, `noStatus?`, `icon?`, `iconLeft?`, `iconRight?`, `msg?`, `message?`, `ariaDescribedby?`. Defaults: disabled/required/noMessage/noStatus `false`, overrides de feedback ausentes. Rótulos padrão conforme o nome em pt-BR.
- Atributos adicionais de controle e atributos de layout existentes são encaminhados pelo mecanismo de `InputBase`; não prometer prop inexistente como `noLabel`. `label=""` omite o rótulo.
- `defineOptions({ inheritAttrs: false })`, encaminhamento explícito e listeners consumidos apenas uma vez. Não permitir que `attrs` substituam o catálogo, o formato ou o tipo nativo semântico. Não expor `options`, `loadOptions`, `optionValue`, `optionName` ou `groupOptions` nesses novos componentes.
- Seis seletores: `clearable?: boolean = false`, `filter?: boolean = false`, slots tipados `value` e `option`; emits `update:modelValue(value)`, `change(value)` e `clear()`. Limpar emite `null` e um único evento de cada tipo pertinente. Selecionar emite o valor primitivo, nunca o objeto de opção. Troca externa não deve voltar como alteração do usuário; filtrar ecos do select na borda do wrapper e testar.
- Quatro textuais: entrada `string | null | undefined`, atualização emitida `string`, limpeza textual `''`; eventos `blur(FocusEvent)` e `focus(FocusEvent)` e métodos expostos `focus(options?)`, `setFocus()`. Não inventar submissão automática ou novo evento `save`.
- Não emitir atualização na montagem nem converter silenciosamente o valor fornecido pelo pai. Ausência de valor permanece ausência; seletores exibem placeholder para `null`/`undefined`; strings vazias antigas podem exigir adaptação explícita pelo consumidor numa migração futura, fora deste lote.
- No feedback dos textuais, seguir `useInputValidation`: neutro inicialmente, obrigatório vazio após blur/submissão explícita pelo consumidor, correção do erro ao editar, opcional vazio neutro. `done`/`caution` explícitos mantêm o padrão existente; `error` explícito tem prioridade sobre o erro interno e `error=false` o suprime. Não gerar check verde automaticamente. `caution=null` é convertido em ausência apenas na chamada do helper, mantendo a tipagem da UI.
- Seletores mantêm validação e feedback externos como `MaxInputSelect`; `required` não cria uma camada nova de validação automática ou bloqueio do formulário. Valores externos desconhecidos permanecem no pai sem seleção visível, como no select atual; nunca selecionar automaticamente a primeira opção ou persistir uma correção.
- Aplicar `inputAttrs` ao input real ou, por composição, ao combobox real. Preservar associação label/id, ARIA, mensagens, foco visível, noMessage/noStatus, tema claro/escuro, 36px e modo compacto herdado.

### 3.3. Contratos específicos propostos

| Componente | Valor público e opções | Comportamento adicional |
|---|---|---|
| Entity | `'PF' | 'PJ' | null`, padrão ausente; Pessoa Física/Pessoa Jurídica | Não inferir a partir de CPF/CNPJ; watcher atual fica na aplicação. Placeholder `Selecione o tipo de entidade`. |
| Gender | `'M' | 'F' | null`; Masculino/Feminino | Não inferir por nome/documento nem adicionar outros valores neste lote. Cadastro só oferece os valores solicitados e comprovados. |
| Email | `string`; label `E-mail` | `type="email"`, `inputmode="email"`, `autocomplete="email"` substituível pelo consumidor, spellcheck/autocapitalize desativados. `isEmail` do MaxUse. Preservar caixa e conteúdo digitado; sem máscara, lowercase obrigatório, autodetecção ou remoção de caracteres. Feedback não comprova existência da caixa postal. |
| Url | `string`; label `URL` | `type="url"`, inputmode url, spellcheck/autocapitalize desativados. Aceitar URL absoluta `http:`/`https:` com hostname, inclusive localhost/IP/porta/caminho/query; rejeitar URL relativa, sem esquema, credenciais embutidas, whitespace e esquemas executáveis. Verificação local via `URL` nativa; não buscar, resolver DNS, abrir, reescrever ou acrescentar https. Não alegar proteção SSRF. |
| Password | `string`; label `Senha` | Oculto inicialmente; `toggleVisibility?: boolean = true`, `autocomplete?: string = 'current-password'`, `minLength?: number` sem mínimo imposto por padrão, `targetValue?: string` opcional. Confirmação por igualdade exata, sensível a caixa/acentos/espaços; sem normalização. Mensagem fixa `As senhas não coincidem`, nunca incluir o alvo. Mostrar/ocultar não muda o valor, não emite update, usa botão type button com aria-label/aria-pressed, não submete o formulário e respeita disabled. `new-password` é escolha da tela de cadastro. Sem medidor de força, telemetria, storage ou cache. Whitespace-only é vazio para feedback conforme helper comum, sem alterar os bytes emitidos. |
| Time | `string | null`, formato `HH:mm`; label `Horário` | Select de horários; `minTime = '00:00'`, `maxTime = '23:59'`, `stepMinutes = 30`. Gerar minutos desde min inclusivo até max, sem ultrapassar; step inteiro 1–1440. `07:00`–`19:00`, step 60 reproduz Snooze. Step 1 permite qualquer minuto. Sem segundos, data, UTC, fuso, feriados ou conversão Date. Min/max inválidos, invertidos ou step inválido produzem lista vazia, sem loop nem emissão. |
| Weekday | `'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null` | Rótulos Segunda-feira até Domingo; ordem segunda–domingo. Um dia por campo. Seleção de vários dias via chips continua fora do escopo. Não converter para índices JS 0–6. |
| Month | união numérica `1` a `12`, ou `null`; label `Mês` | Janeiro a Dezembro; emitir número, não string, índice 0–11 ou Date. Sem ano ou timezone. |
| Year | `number | null`; label `Ano` | `minYear?`/`maxYear?`: padrão ano de referência −1/+1; referência capturada na criação da instância. Faixa inclusiva crescente, inteiros entre 1 e 9999. Inválida/invertida produz lista vazia. Limitar alocação ao domínio de 9999 anos, usar filtro para faixas extensas. SSR deve informar limites explícitos quando houver risco de virada de ano entre servidor e cliente. Não atualizar modelo quando a faixa muda. |
| Slug | `string`; label `Identificador` | Regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`; valida o conteúdo exato, sem trim silencioso, espaço, underscore ou hífen repetido nas pontas. `normalizeOnBlur?: boolean = false`; quando ligado, usar `slugify` do MaxUse e emitir apenas se mudou; validar novamente. Não gerar a partir do nome, consultar unicidade nem salvar. Limite de comprimento pode vir por maxlength da aplicação. |

Os contratos são **propostas de produto desta entrega**, não inferência de que todo comportamento atual dos consumidores já atende a esses requisitos. `Url` preserva a convenção PascalCase de `MaxInputUrl`, sem aliases de capitalização adicionais neste lote. Fonte oficial Vue consultada via Context7: guia de atributos herdados e API script setup; confirma encaminhamento explícito e risco de defaults de modelo divergentes. O projeto usa Vue 3.6.0-rc.10; o material consultado é da documentação geral Vue 3, não uma garantia específica desse RC.

### 3.4. Dependências e lacunas

MaxUse instalado na biblioteca: 1.1.47, pacote npm real, não symlink de MaxUse; `isEmail`, `slugify` e `kebabCase` constam dos exports. Não foi encontrado validador dedicado de URL, horário HH:mm ou slug canônico em `dist/Helpers/Validations/index.d.ts` e declarações de strings/datas examinadas. Registrar lacunas e usar apenas regras locais de domínio de UI/`URL` nativa, sem criar biblioteca paralela de helpers nem alterar MaxUse nesta entrega. Se a execução demonstrar necessidade de helper compartilhado adicional, interromper essa expansão e solicitar escopo próprio.

MaxPinia é peer opcional da biblioteca, não está instalado no node_modules efetivo desta worktree. Seus controles não necessitam de uma store. Integração real futura mantém as stores existentes e sua configuração MaxPinia; não armazenar senha em cache para demonstrar integração. Há notificação de incompatibilidade entre Pinia do Engeapp e peer atual da biblioteca; não mudar versões automaticamente.

### 3.5. Mapa de arquivos futuro

- **Novos:** dez `src/components/MaxInput{Entity,Gender,Email,Url,Password,Time,Weekday,Month,Year,Slug}.vue`; `src/types/semanticInputs.ts`; `src/constants/semanticInputOptions.ts` com catálogos pequenos estáticos; dez `tests/components/MaxInput<NOME>.test.ts`; `tests/types/semantic-inputs.test.ts`; `tests/browser/SemanticInputs.browser.ts`; `docs/INPUTS-SEMANTICOS.md`.
- **Existentes a alterar:** `src/index.ts`, `src/types/index.ts`, `src/components-manifest.json`, `package.json` (dez exports explícitos, sem versão/dependências), `tests/helpers/MaxComponentsUiResolver.test.ts`, `tests/architecture/package-exports.test.ts`, `tests/architecture/inputBaseAccessibility.test.ts`, `scripts/verify-consumers.mjs`, `playground/src/catalog.ts`, `playground/src/scenarios/inputs-text.vue`, `playground/src/scenarios/inputs-select.vue`.
- Atualizar contagens arquiteturais intencionais: 127 → 137 componentes; consumidores diretos de InputBase 27 → 31 e famílias 28 → 32 se mantida a composição especificada. Recontar antes de fixar; não remover asserções. Reutilizar os dois cenários existentes mantém os 36 cenários requeridos, sem criar cenário 37.
- `vite.config.ts` já descobre arquivos Vue da raiz; não requer ampliação. `src/scripts/generateResolver.ts` já regenera o manifesto; sua execução fica para Execute, não foi rodada aqui. Plugin `install` registra diretiva e opções, não componentes globais; não mudar esse contrato.

## 4. Plano de Execução Faseado

1. Preflight por leitura: confirmar branch/worktree, alterações existentes, scripts e hooks, dependências reais e integridade do harness. Não instalar, mudar versões ou contornar gates falhos.
2. Preparar tipos e constantes; implementar os dez controles e todos os seus testes no lote, com revisão de contratos por leitura nos marcos. Etapas detalhadas e dependências em `plan.md`.
3. Conectar exports, manifesto, exports de pacote, testes arquiteturais, consumidores sintéticos, documentação e playground.
4. Executar validações agregadas somente após concluir implementação e testes; corrigir falhas em lote. Gate completo de entrega pública: `npm run verify`, com preflight dos efeitos externos e do destino temporário antes de autorização operacional.
5. Registrar resultados factuais, revisão de segurança/acessibilidade e pendências manuais; não publicar nem integrar Git sem solicitação separada.

## 5. Critérios de Aceite & Validação

- Existem exatamente dez componentes novos com os nomes e tipos acima, cada um com evidência de necessidade e testes próprios.
- Tipos e eventos correspondem à API; ausência, clear e valores primitivos preservados; nenhuma gravação/requisição decorrente de montagem, atualização externa ou toggle de senha.
- Validações específicas, confirmação de senha sem vazamento, faixas inválidas e alterações de props cobertas. Segurança e feedback não dependem exclusivamente de validação nativa ou de dublês.
- Import da raiz, dez subpaths explícitos, `.d.ts`, autoimport canônico/kebab/snake e aliases gerados sem Max resolvem corretamente; nomes legados continuam funcionando.
- Novo pacote funciona em consumidor sintético isolado ESM, TypeScript, Vite e SSR; isso não comprova integração real com os três apps.
- Navegador: labels/ARIA, teclado, Escape, foco, disabled, limpar, toggle de senha sem submit, mobile 240/320px, claro/escuro e zoom 200%; execução automática onde disponível mais inspeção manual documentada.
- Nenhuma redução dos gates de cobertura ou arquitetura, nenhuma dependência PrimeVue nova, nenhuma mudança nos consumidores ou persistência de valores sensíveis.
- Comandos existentes relevantes: `npm run type-check`, `npm run type-check:test`, `npm run lint`, `npm run build`, `npm run test`, `npm run test:coverage`, `npm run test:browser`, `npm run verify:consumers`, `npm run verify`. O agregado `verify` já reúne esses gates: não repetir componentes isoladamente sobre a mesma revisão. `plan.md` define ordem, ambiente e impedimentos.
- Não foram executados esses comandos nesta sessão. Falha vigente ou inspeção manual pendente impede declaração de validação integral.
