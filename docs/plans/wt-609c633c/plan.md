# Plano de execução — dez novos inputs baseados em três consumidores

## 1. Identificação e autorização

- Data: 2026-10-16.
- Projeto: `@maxvue/max-components-ui` 1.1.12.
- Worktree: `wt-609c633c`; branch homônima, criada a partir de `dev`.
- Raiz obrigatória: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-609c633c`.
- Especificação normativa da proposta: `docs/plans/wt-609c633c/spec.md`, nesta mesma worktree.
- Esta sessão recebeu autorização **somente para investigar e documentar**. Este documento não autoriza implementação, instalação, alteração nos apps consumidores, commit, merge, push, atualização npm ou publicação. Execute depende de solicitação posterior.

## 2. Objetivo e resultado proposto

Criar na biblioteca exatamente os seguintes dez componentes independentes, ainda inexistentes: `MaxInputEntity`, `MaxInputGender`, `MaxInputEmail`, `MaxInputUrl`, `MaxInputPassword`, `MaxInputTime`, `MaxInputWeekday`, `MaxInputMonth`, `MaxInputYear` e `MaxInputSlug`.

Usuários beneficiados: pessoas que preenchem dados cadastrais e credenciais no Engeapp/MaxAiManager e programam conteúdo no SocialMedia; equipes consumidoras deixam de reconstruir catálogos e validações comuns. A entrega é uma API de biblioteca pronta para adoção futura, não uma migração das aplicações.

### 2.1. Base factual da escolha

| Projeto analisado | Evidência por leitura | Conclusão limitada |
|---|---|---|
| `/home/johnattas/GitHub/engeapp` | `resources/Vue/Sections/Project/ProjectData/SubSections/ClientProjectData.vue:5–12,44–63`: selects PF/PJ e M/F e watcher de documento; `resources/Vue/Sections/Auth/Register.vue:76–77`: senhas; `resources/Vue/Sections/Auth/ForgotPassword.vue:14`: e-mail; `resources/Vue/Components/SnoozeChatPopover.vue:8,34,41–45,75–106`: horário HH:mm e combinação posterior com data | Entity/Gender possuem vocabulário real; Time pode substituir lista repetida sem assumir regras de expediente, calendário ou fuso |
| `/home/johnattas/GitHub/MaxAiManager` | `resources/Vue/Pages/ResetPasswordPage.vue:16–52`: email/password; `resources/Vue/Sections/Settings/Ai/ModalAiProvider.vue:43–71,108–116`: URL base, preço e mostrar/ocultar segredo; `resources/Vue/Pages/ProjectsPage.vue:32–42,202–209` e `resources/Helpers/slug.ts`: slug; `app/Http/Requests/Panel/ProjectRequest.php:34–41`: formato e unicidade no servidor | Email/Url/Password/Slug têm demanda concreta; unicidade de slug e atualização de credenciais continuam no backend |
| `/home/johnattas/GitHub/SocialMedia` | `resources/Vue/Sections/SocialMedia/ThemeScheduleBuilder.vue:16–49,67–95`: horário, dias da semana e outras listas; `resources/Stores/socialMedia/useThemesStore.ts:18–22`: união das regras; `resources/Vue/Sections/SocialMedia/TabCalendar.vue:60–61,546–548,562–572`: meses 1–12 e ano atual ±1; `resources/Vue/Sections/SocialMedia/ThemeContentList.vue:18–23,89–92`: URL | Time/Weekday/Month/Year são peças independentes de agendamento; Url não precisa depender de um fornecedor de IA |

Inventário textual: 361/47/23 SFCs em `resources` e 144/16/9 ocorrências de `MaxInputSelect`, na ordem acima. As contagens não distinguem trechos comentados, controles condicionais ou execução em produção. A seleção privilegia necessidades independentes de backend, não dez componentes necessariamente presentes nos três apps simultaneamente.

### 2.2. Evidências da biblioteca e do ambiente

- Foram conferidos o diretório `src/components`, `src/index.ts` e `src/components-manifest.json`: nenhum dos dez nomes existe. São 127 `.vue` na raiz de componentes.
- Primitivas lidas: `InputBase.vue`, `MaxInputSelect.vue`, `MaxInputText.vue`, `MaxInputUF.vue`, `MaxInputTypeAddress.vue`, `MaxInputPhoneMail.vue`, `MaxInputBirthday.vue`, `MaxIconButton.vue`; política de feedback em `src/helpers/useInputValidation.ts`.
- `MaxInputText` aceita tipo nativo, mas não um validador de domínio. Sua mensagem padrão de comparação pode incluir o valor esperado; não reutilizar essa implementação de confirmação de senha. Achado registrado separadamente, sem corrigir o legado neste escopo.
- `MaxInputBirthday` oferece mês e ano apenas como segmentos de nascimento; não refatorá-lo para aproveitar os novos campos neste lote. `MaxInputPhoneMail` continua disponível sem mudança ou depreciação.
- Distribuição: `src/index.ts`, `src/types/index.ts`, `src/helpers/MaxComponentsUiResolver.ts`, `src/scripts/generateResolver.ts`, `vite.config.ts`, `package.json`, `scripts/check-lockfile.mjs` e `scripts/verify-consumers.mjs` foram lidos. `vite.config.ts` descobre automaticamente os Vue da raiz. O teste de exports exige subpaths **explícitos**, mesmo existindo wildcard no package.json.
- Harness: `vitest.config.ts`, `vitest.browser.config.ts`, `tests/setup.ts`, `tsconfig.test.json`; testes de select/texto, resolver, arquitetura de exports, acessibilidade e cobertura do playground foram inspecionados. Há mocks globais de rede/ícones e deduplicação Vue/Pinia, que não provam comportamento real de aplicações externas.
- Playground: `playground/src/catalog.ts`, `playground/src/scenarios/index.ts`, `inputs-text.vue`; teste exige 36 cenários. Reutilizar `inputs-text` e `inputs-select`, sem novo cenário.
- Versões pelo lockfile da biblioteca: Vue `3.6.0-rc.10`, Pinia `4.0.3`, MaxUse `1.1.47`. MaxUse efetivo é pacote npm instalado; não substituir por projeto irmão. `node_modules` efetivo resolve na árvore principal do MaxComponentsUi: não modificar esse diretório compartilhado. MaxPinia é peer opcional não instalado nesse ambiente.
- Nos apps, os três pacotes Max são declarados via `file:./storage/libs/...`; MaxUse/MaxPinia efetivos são symlinks para projetos irmãos. Engeapp fixa Pinia `^3.0.4`/lock `3.0.4`, divergindo do peer Pinia `^4.0.0` da biblioteca; demais apps têm lock Pinia `4.0.3`. Nada disso foi alterado ou executado.
- A worktree estava limpa na primeira leitura. `.gitignore` já inclui `.worktrees/` e `.max-code-worktrees/`. Não criar worktree, trocar branch ou investigar worktrees de terceiros.
- Documentação Vue 3 consultada via Context7: `https://vuejs.org/guide/components/attrs`, `https://vuejs.org/api/sfc-script-setup`, `https://vuejs.org/guide/components/v-model`. Regras utilizadas são estáveis de Vue 3; não houve consulta de documentação específica do RC instalado.

## 3. Decisões e preservação

### 3.1. Confirmado pelo pedido e pelas diretrizes

1. Entregar plano e spec, sem código nesta sessão. Toda execução futura é na worktree indicada.
2. Criar dez entradas públicas novas, com base no uso observado. Usar componentes Max, helpers MaxUse e manter MaxPinia nas camadas que já fazem GET/cache/save.
3. Sem PrimeVue novo, sem dependência local MaxUse, sem remoção de classes legadas `.p-*`, sem mudanças de autenticação, persistência ou contratos dos consumidores.
4. Vue Composition API, `<template>` → `<script setup lang="ts">` → `<style lang="scss" scoped>`, tags de abertura em uma linha; recuo base de quatro espaços no script, aspas simples e ponto e vírgula. Classes novas `.max-*`/`is-*`, tokens teal/foco existentes e densidade compacta.

### 3.2. Proposta de arquitetura para revisão

- Entity/Gender/Time/Weekday/Month/Year são wrappers de `MaxInputSelect`; Email/Url/Password/Slug compõem `InputBase` e `useInputValidation` com input nativo. Password também usa `MaxIconButton`. Não ampliar API das primitivas neste lote.
- Modelos e opções exatos estão na spec, seção 3.3. Entity=`PF/PJ`; Gender=`M/F`; Weekday=nomes ingleses estáveis; Month=número 1–12; Year=número; Time=HH:mm. Clear de select é `null`; vazio textual é `''`.
- Seletor não escreve default no pai, não tenta corrigir valor órfão e não faz validação automática de obrigatório além do feedback externo atual do select. Textuais reutilizam a política comum de feedback. Evitar eventos duplicados e eco de atualizações externas.
- Password confirma sem normalização e sem revelar o alvo. Mantém espaços/caixa/acentos no valor; toggle não salva, não muda modelo e não submete form. Regras de força e comprimento de cada aplicação não migram para um default universal.
- Url aceita somente HTTP(S) absoluto válido com hostname, sem credenciais ou whitespace; não usa rede, não altera a string e não representa defesa SSRF do backend. Localhost/IP/porta são necessários para provedores locais, sem que o controle faça qualquer acesso.
- Time é select com min/max/step em minutos. Ano usa faixa inclusiva padrão atual ±1, sem selecionar automaticamente ano corrente. Faixas inválidas ficam vazias; evitar alocação não limitada e loops. Não combinar com data ou fuso.
- Slug valida o conteúdo literal por padrão; normalização só com `normalizeOnBlur=true` e `slugify` do MaxUse. Backend conserva unicidade e autorização. O validador legado faz trim para conferir; a nova API não promete aceitar espaços silenciosamente. Uma adoção futura deve avaliar essa diferença.
- Não criar store por campo nem instalar MaxPinia para um exemplo. Aplicações mantêm suas stores MaxPinia existentes; segredos nunca vão para cache. Ausência de MaxPinia opcional deve continuar suportada no pacote.

### 3.3. Alternativas descartadas e limitações

- Não selecionar UF, CEP, CPF/CNPJ, dinheiro, tags, telefone, data de nascimento, cores ou OTP: já há componentes equivalentes.
- Não selecionar seletor fixo de rede social/modelo/provedor: opções são catálogos de backend ou variam por cliente; hardcode na biblioteca quebraria contratos.
- Não selecionar profissão/estado civil/escolaridade: não houve evidência equivalente suficientemente forte para preferi-los aos dez escolhidos. Não inventar novas enums de negócio.
- Não adicionar configuração genérica excessiva de opções, formatos e aliases: os novos campos precisam ter valor semântico claro.
- Não reusar confirmação de `MaxInputText` e esconder apenas a mensagem: é mais seguro compor Password com comparação e mensagem próprias, sem carregar risco de regressão em todos os inputs existentes.
- Não há validação de runtime, credenciais, fornecedores, browser ou telas reais nesta sessão. Não há necessidade de fornecedor/modelo externo para os dez controles. Nenhum dado pessoal ou segredo foi necessário para a análise.

## 4. Arquivos previstos para Execute

| Situação | Arquivos e responsabilidade |
|---|---|
| Novos — implementação | `src/components/MaxInputEntity.vue`, `MaxInputGender.vue`, `MaxInputEmail.vue`, `MaxInputUrl.vue`, `MaxInputPassword.vue`, `MaxInputTime.vue`, `MaxInputWeekday.vue`, `MaxInputMonth.vue`, `MaxInputYear.vue`, `MaxInputSlug.vue`; todos dentro de `src/components/` |
| Novos — tipos/catálogos | `src/types/semanticInputs.ts`, `src/constants/semanticInputOptions.ts` |
| Existentes — API pública | `src/index.ts`, `src/types/index.ts`, `src/components-manifest.json`, `package.json` somente exports |
| Novos — testes | Um `tests/components/<nome-exato-do-componente>.test.ts` para cada um dos dez; `tests/types/semantic-inputs.test.ts`; `tests/browser/SemanticInputs.browser.ts` |
| Existentes — contratos/testes | `tests/helpers/MaxComponentsUiResolver.test.ts`, `tests/architecture/package-exports.test.ts`, `tests/architecture/inputBaseAccessibility.test.ts`, `scripts/verify-consumers.mjs` |
| Existentes — exemplos | `playground/src/catalog.ts`, `playground/src/scenarios/inputs-text.vue`, `playground/src/scenarios/inputs-select.vue` |
| Novo — documentação de produto | `docs/INPUTS-SEMANTICOS.md` |
| Apenas durante Execute | `docs/plans/wt-609c633c/execution-state.json`, segundo schema v2 do executor; não criado nesta sessão |

Os arquivos de código propostos ainda não existem. Não editar `vite.config.ts`, primitivas existentes, lockfiles, libs irmãs ou aplicações sem nova evidência e autorização de ampliação.

## 5. Etapas executáveis e dependências

### T0 — Preflight por leitura

1. Ler este plano e a spec na primeira admissão; consultar apenas trechos pertinentes nas retomadas. Revalidar raiz/branch, `git status`, diff e trabalho anterior sem sobrescrever mudanças alheias.
2. Ler os AGENTS aplicáveis. Conferir scripts, hooks, versões efetivas, symlinks e destinos de saída. Não editar node_modules compartilhado, copiar `.env` nem instalar para corrigir o ambiente automaticamente.
3. Validar por leitura os exports MaxUse `isEmail`/`slugify` no pacote efetivamente instalado, e o comportamento necessário no código distribuído antes de depender deles. Não inferir que um projeto irmão mais recente coincide com 1.1.47.
4. Conferir identidade única Vue/Pinia/Axios no harness e isolamento dos testes. Os novos testes não devem usar backend, banco, cache persistente, filas ou storage reais. O stub de ícone não representa aceitação de serviço externo.
5. Inspecionar os efeitos de `npm run verify`: build e relatórios escrevem artefatos; consumidores sintéticos instalam pacotes e usam diretório temporário; benchmark escreve resultados; audit/tree podem usar rede. Preparar apenas ambiente de execução autorizado. Testes de consumidores sintéticos devem ficar em temporário dedicado **dentro da worktree**, configurável por `CONSUMER_TEMP_DIR` já suportado no script; não escrever em outras worktrees.
6. Gate de integridade falho bloqueia validação dependente. Não executar ferramentas diretas para burlar prehook, não usar ignoreConfig/legacy-peer-deps e não remover asserts. Se dependências próprias na worktree forem necessárias, solicitar autorização específica em vez de alterar a instalação compartilhada.

**Saída:** preflight e próximas ações registrados; sem testes intermediários para descobrir versões, sem instalação automática. A integração real Engeapp/Pinia é pendência de outro escopo, não licença para alterar o peer.

### T1 — Contratos e catálogos

Dependência: T0. Criar tipos comuns e específicos e catálogos Entity/Gender/Weekday/Month em `semanticInputs.ts` e `semanticInputOptions.ts`; reexportar tipos no barrel existente. Catálogos usam `name`, `label` e `value` coerentes com select e não são mutados. Arrays por instância ou readonly com cópia na fronteira; não forçar cast inseguro para aceitar readonly. Preparar testes de tipos com aceitações e rejeições de valores.

**Conferência por leitura:** modelos da spec e eventos batem; sem enum de PHP importada, sem caminhos dos consumidores, sem `any` novo. Não executar tipos/testes ainda.

### T2 — Seis seletores semânticos

Dependência: T1. Implementar Entity/Gender/Weekday/Month primeiro, Time/Year em seguida, junto com os seis testes unitários. Repassar feedback, layout, id/ARIA, filtro e clear sem permitir alteração do catálogo por attrs. Encaminhar slots tipados. O setter transforma somente saída de interação, nunca o valor externo.

Testar seleção pelo DOM, clear, teclado, disabled, modelos numéricos, valores ausentes/órfãos, mudança externa sem eco, estabilidade das listas, reatividade de min/max/step e ausência de update ao estreitar a faixa. Time testa 00:00/23:59, step 1/30/60, faixa 07:00–19:00, max não alinhado, inválidos/invertidos. Year testa referência controlada, limites inclusivos, ano fora da faixa e domínio 1–9999. Não usar rede.

**Conferência por leitura:** nenhum novo overlay; loops limitados; nenhum Date para Time; nenhuma migração das regras de agendamento. Não executar suíte entre componentes.

### T3 — Quatro textuais semânticos

Dependência: T1; independente de T2 em arquivos de escrita. Implementar Email/Url/Password/Slug e seus quatro testes, todos usando InputBase/inputAttrs e política de feedback compartilhada, sem delegar validação exclusivamente a HTML5.

- Email: usar `isEmail` do MaxUse, preservar valor, testar plus addressing, vazio opcional/obrigatório, entrada inválida e alteração externa.
- Url: `URL` nativa e regras da spec; testar localhost, IP, porta, caminho/query, relativo, esquema executável, credenciais e whitespace, sem requisições. Não criar helper genérico paralelo para URL.
- Password: `useInputValidation` com `targetValue` reativo e comparação literal; mensagem fixa. Testar diferença apenas de caixa/acentos/espaços, alvo modificado, comprimento opcional, valor intacto, oculto por padrão, toggle sem update/submit, disabled, nome acessível, foco e ausência do alvo na mensagem/aria/title. Dados de teste sintéticos, nunca credenciais reais.
- Slug: regex da spec, normalização desligada inicialmente; teste de input literal, hífen repetido, bordas, underscore, unicode e números. Com opção ligada, usar MaxUse no blur e conferir saída; sem unicidade remota.

**Conferência por leitura no marco de risco:** segredo não aparece em mensagem, logger, cache, clipboard ou snapshot; não reutilizar trecho vulnerável do input genérico. Não alterar política do servidor. Não executar suíte entre campos.

### T4 — Publicação interna, exemplos e testes integrados

Dependência: T2 e T3. Um único responsável altera arquivos compartilhados.

1. Exportar dez componentes e tipos; adicionar dez mapas explícitos `./components/MaxInput…` em `package.json` com caminhos `.vue.d.ts` e `.es.js`, sem versão/deps novas. Regenerar manifesto com o script existente apenas nesta fase de Execute, após confirmar runner disponível; não usar `npx` com download implícito. A forma documentada no AGENTS é `npx tsx src/scripts/generateResolver.ts`, mas `tsx` não é dependência direta declarada: verificar disponibilidade antes, não instalar silenciosamente.
2. Expandir teste do resolver para todos os nomes canônicos, kebab, snake e aliases gerados sem prefixo Max; não interceptar PrimeVue. Manter aliases antigos.
3. Ajustar assert do catálogo de 127 para 137, recontando antes. Ajustar inventário InputBase 27→31 diretos/28→32 famílias, se a composição não mudou; manter verificação de inputAttrs e acrescentar asserções de DOM para wrappers. Não converter teste rígido em simples `>0`.
4. Ampliar consumidores sintéticos existentes ESM/TypeScript/Vite/SSR para importar e exercer os dez novos exports/subpaths e tipos, sem depender de MaxPinia opcional. Não basta teste de MaxButton já existente. Não executar esses consumidores contra os três apps reais.
5. Atualizar os dois cenários e catálogo do playground, preservando os 36 cenários. Usar valores sintéticos e modelos reativos locais, sem store persistente para senhas. Demonstrar estados neutro, inválido, disabled, clear, overrides, limites e atualização externa.
6. Escrever `docs/INPUTS-SEMANTICOS.md`: props/defaults/eventos, exemplos com tags numa linha, diferenças para as primitivas, formatos exatos, ausência de salvamento automático, responsabilidade de MaxPinia na tela, segurança de senha/URL, limites de SSR e checklist de adoção futura por app. Não indicar migração já realizada.
7. Completar teste de tipos e `SemanticInputs.browser.ts` com casos de acessibilidade e interações reais; manter suites legadas intactas. Toda implementação e todos os testes devem estar prontos antes de rodar validações agregadas.

**Saída:** API pública, exemplos, testes e distribuição coerentes. `vite.config.ts` e registro global do plugin permanecem sem alteração.

### T5 — Validação em lote e correções

Dependência: T4, T0 atualizado. Gate de entrega é `npm run verify`, script existente que agrega integridade de nomes/lockfile/SVG, tipos de fonte/teste, lint, build, testes/cobertura, browser, bundle playground, benchmark, consumidores sintéticos, árvore npm e audit.

Não executar cada componente isolado e depois repetir todo o agregado sem necessidade. O agregado já faz build antes da suíte, necessário porque `tests/architecture/package-exports.test.ts` exige dist fresco. A rotina de consumidores recompila por padrão: preservar o gate como existente, sem reescrever orchestration apenas para otimizar esta tarefa. Não repetir manualmente etapas já aprovadas da mesma revisão.

Em falha, agrupar diagnóstico de harness/bootstrap/dependência antes de repetir testes equivalentes. Distinguir baseline e causalidade; não corrigir projeto irmão/consumidor sem autorização. Corrigir o conjunto afetado e revalidar gates pertinentes da revisão nova; gate interrompido não prova aprovação das etapas não executadas. Sem autorização para installs/temporários/rede exigidos pelo agregado, registrar bloqueio e pedir a autorização operacional específica; não substituir por atalho e declarar verde.

Browser automático confirmado no projeto é Chromium via `npm run test:browser`. Playground manual é `npm run dev:playground`, apenas em Execute e sem expor servidor publicamente. Safari/Firefox não foram configurados como gate obrigatório; documentar limite, sem alegar validação nesses browsers.

### T6 — Revisão final e handoff

Dependência: T5 e matriz de aceite. Revisar diff completo por risco (senha, propagação de attrs/eventos, tipos, distribuição, acessibilidade), conferir somente arquivos esperados e submeter diff bruto ao guardrail exigido. Revisão independente no marco de segurança e na entrega, quando houver executor distinto autorizado; não é necessário um subagente por microedição.

Registrar verificações manuais, resultados e pendências por revisão. Não declarar a integração real com os três projetos concluída; adoção exige trabalho e ambiente isolado próprios. Não executar commit/merge/push/release nem remover a worktree pré-alocada: integração/limpeza pertencem ao MaxCode/usuário.

### Organização caso haja execução paralela futura

Não houve delegação nesta sessão. Se futuramente autorizada: T0/T1 sequenciais; T2 pode ficar com um executor e T3 com outro, cada qual apenas nos seus componentes/testes. T4 tem dono único de barrels, package.json, manifesto, arquivos arquiteturais e playground. T5 só começa após todos finalizarem. Contexto de cada tarefa é referência à spec e às seções relevantes do plano, sem impor releitura integral a cada retomada.

## 6. Matriz de aceite por tarefa

| Tarefa / requisito | Evidência de necessidade | Testes pertinentes na execução | Revisão pelo risco e manual |
|---|---|---|---|
| T0 — ambiente seguro | package.json, locks, resolução efetiva e configs lidos | Gates de integridade do agregado; nenhum teste de backend | Identidade das libs, destinos de escrita, efeitos de instalação e isolamento antes de validar |
| T1 — contratos estritos | PF/PJ, M/F, string/número dos consumidores; spec 3.2–3.3 | `tests/types/semantic-inputs.test.ts` + tipos fonte/testes | Conferir evento, null/undefined, props públicas e ausência de any novo |
| T2 — Entity/Gender | ClientProjectData | Dois novos testes; alteração externa, clear, órfão e catálogo | Conferir rótulos/valores e preservar inferência CPF/CNPJ na aplicação |
| T2 — Weekday/Month | ThemeScheduleBuilder/TabCalendar | Dois novos testes; union semanal, número 1–12, clear e slots | Teclado e rótulos pt-BR sem converter para índices Date |
| T2 — Time/Year | Snooze/TabCalendar | Dois novos testes; limites, step, vazio, faixa alterada e geração limitada | Faixa 07–19 e ano ±1 reproduzíveis; sem fuso/Date para Time |
| T3 — Email | ResetPassword/ForgotPassword | Novo teste com helper MaxUse real e entradas válidas/inválidas | Teclado/autocomplete e nenhuma máscara/normalização silenciosa |
| T3 — Url | ModalAiProvider/ThemeContentList | Novo teste; esquemas, URL local e inválida, nenhum acesso de rede | Não alegar SSRF/fornecedor validado; confirmar feedback no browser |
| T3 — Password | ResetPassword/Register/toggle de provider | Novo teste; confirmação exata e conteúdo de mensagens; browser sem submit/update no toggle | Revisão de segurança; manual com valor sintético, mostrar/ocultar e gerenciador de senha sem credencial real |
| T3 — Slug | ProjectsPage, helper e request | Novo teste; literal e normalizeOnBlur; sem checagem de unicidade | Preservação de backend e demonstração da opção desligada |
| T4 — distribuição | Resolver, build entries, teste de exports | Resolver, `.d.ts`, raiz, dez subpaths; ESM/TS/Vite/SSR sintéticos | Catálogo 137 e ausência de dependências proibidas; integração real permanece fora do aceite |
| T4 — exemplos/acessibilidade | InputBase/harness/playground | `SemanticInputs.browser.ts`, cobertura catálogo e arquitetura InputBase | 240/320px, zoom 200%, claro/escuro, label/foco/ARIA, mensagens e disabled para as dez entradas |
| T5/T6 — qualidade/entrega | script verify e diretrizes | `npm run verify` na revisão final, com todos os resultados factuais | Sem gates reduzidos e sem falha vigente; pendências manuais impedem validação integral |

Resultados desta sessão: **somente leituras, busca, confirmação de ausência dos nomes e documentação**. Nenhum resultado futuro da matriz foi presumido. Dublês não equivalem a aceitação externa.

## 7. Riscos, operação e limites de reversão

- **Senha:** nunca persistir no componente/Pinia/cache; logs, erros e artefatos usam dados sintéticos. A vulnerabilidade condicional no campo legado é notificação fora do lote; o novo Password não depende dela.
- **Eventos e attrs:** há watch de modelValue no select existente; bloquear eco no wrapper sem modificar o componente base. Contar emits e verificar input/combobox reais, não só mocks de componentes.
- **Compatibilidade:** API aditiva; não substituir símbolos, aliases, classes legadas ou formatos vigentes. Dez componentes novos não autorizam adoção automática dos consumidores.
- **Helpers:** isEmail/slugify existem no MaxUse npm. Validadores URL/HH:mm/slug estrito ausentes foram notificados; regras mínimas locais do componente não autorizam criar pacote/helper compartilhado fora do escopo.
- **Dependências efetivas:** não desenvolver contra lib irmã e validar como se fosse pacote publicado. Peer Pinia do Engeapp impede presumir integração; tratar em trabalho separado.
- **Desempenho:** catálogos pequenos, Time máximo 1440 itens, Year máximo 9999; select tem virtualização disponível. Não introduzir fetch no mount nem dependência pesada. Benchmark e bundle continuam gates existentes, sem inventar limiares novos.
- **SSR:** não acessar DOM na avaliação de módulo; constantes estáticas seguras e Year com limites explícitos em renderizações que atravessam virada de ano. Datas da aplicação e timezone permanecem fora do controle.
- **Operação:** sem migração ou alteração de dados; sem credenciais de fornecedor necessárias; npm audit/consumidor sintético têm efeitos próprios que exigem ambiente autorizado. Parar em integridade falha, segredo real inesperado, conflito com trabalho alheio ou expansão de escopo.
- **Recuperação:** antes de integração, desfazer apenas o conjunto próprio e autorizado sem tocar alterações alheias. Após eventual publicação futura, recuperar por nova versão/correção, não reescrever pacote já distribuído. Esta tarefa não autoriza rollback Git, reset ou remoção de worktree.

## 8. Progresso, retomada e registro de execução

Durante Execute, após marcos e antes de handoff, registrar `docs/plans/wt-609c633c/execution-state.json` vinculado ao SHA256 **real** de `plan.md`, às tarefas, estados, arquivos e revisões factuais de conteúdo. Não existe registro criado ou executado nesta sessão Plan.

Usar o schema version 2 estrito fornecido pelo executor/MaxCode, sem inventar campos superiores ausentes daqui. Confirmar esse schema antes de gravar; version 1 pode ser lida por compatibilidade, mas não comprova validação integral automaticamente. Regras obrigatórias:

- Não adicionar `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp`; motivos e próxima ação em `nextAction`, até 512 caracteres.
- Status de tarefa somente `pending`, `running`, `completed`, `blocked`, `manualPending` ou `validationFailed`.
- Comandos até 4096 caracteres. `verification` usa `{revision: SHA256, checks: [{command, revision: SHA256, result, exitCode?}]}`. Hashes são calculados sobre conteúdo real; nunca rótulos ou SHA inventado.
- Resultados de validação/check somente `passed`, `failed` ou `pending`, jamais `blocked`. `passed` exige exitCode 0; `failed` exige inteiro diferente de 0; `pending` não aceita exitCode.
- Registrar comandos realmente executados e **todas** as falhas, inclusive suíte completa, mantendo vínculo com revisão. Não derivar exitCode de `tool:end.ok`. Checks vazios, falha vigente ou falta de resultado vigente impedem validação integral.
- Se inspeção manual ou integração autorizada estiver pendente, usar `manualPending` com próxima ação concreta; cancelar mantém resultado parcial e pendência explícitos. Tarefas assíncronas aguardam conclusão/evento, com timeout e recuo, sem consultas repetidas de status sem informação nova.
- Retomada confere trabalho existente, revalida mudanças locais, executa lacunas e reutiliza verificações aprovadas apenas da mesma revisão factual. Não reabrir decisões sem evidência nova. Mesma falha repetida sem progresso exige diagnóstico da causa.
- O registro autodeclarado não comprova execução nativa nem detecta verificações omitidas. Relatório final deve separar implementado, validado, bloqueado e manualPending.

## 9. Revisão da proposta e documentos correlatos

Revisão concluída por leitura: os dez nomes são novos; cada um tem uso observado; composição preserva os contratos antigos; tipos, eventos, catálogos e validações têm critérios de aceite; dependências são sequenciais onde há arquivos compartilhados; riscos de senha, attrs, distribuição e ambiente têm pontos de interrupção. Não restou decisão de produto essencial que exigisse entrevista para escrever esta proposta.

Notificações sanitizadas nesta worktree:

- `docs/notifications/wt-609c633c/notifications/max-components-ui-inputs-semanticos-ausentes.md` — lacunas de componentes atendidas pela proposta.
- `docs/notifications/wt-609c633c/notifications/max-use-validadores-inputs-semanticos.md` — helpers não encontrados, fronteira para regras locais de UI.
- `docs/notifications/wt-609c633c/notifications/max-components-ui-confirmacao-senha-mensagem.md` — exposição condicional do valor de comparação no campo genérico; correção do legado fora do escopo.
- `docs/notifications/wt-609c633c/notifications/max-components-ui-integracao-dependencias-consumidores.md` — divergência Pinia e libs ligadas por symlink; integração real não comprovada.

Nenhuma correção desses achados fora de escopo está embutida no plano. A próxima sessão deve executar apenas após autorização, lendo este documento e a spec, sem depender do histórico da conversa.
