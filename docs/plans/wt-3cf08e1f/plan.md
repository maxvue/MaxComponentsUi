# Plano de execução — análise e criação de dez novos inputs

## Identificação

- **Projeto:** `@maxvue/max-components-ui`
- **Worktree:** `wt-3cf08e1f`
- **Data do plano:** 2026-10-16
- **Estado:** planejamento; nenhuma implementação ou validação foi executada nesta sessão.
- **Spec:** [`spec.md`](./spec.md)

## Objetivo e resultado esperado

Após analisar os usos nos projetos Engeapp, MaxAiManager, AgenteDeBolso e SocialMedia, implementar e expor no pacote da biblioteca dez inputs ausentes e não reservados. A proposta concreta é: `MaxInputMultiSelect`, `MaxInputDateRange`, `MaxInputDateReference`, `MaxInputStatusGroup`, `MaxInputRG`, `MaxInputAddress`, `MaxInputDateTimeLocal`, `MaxInputCurrencyCode`, `MaxInputSocialHandle` e `MaxInputCredential`.

O detalhamento funcional e os limites de cada componente estão na tabela de Arquitetura da spec. A execução não deve ampliar o escopo para migrar os quatro projetos consumidores.

## Escopo e preservação

### Fazer

- Rever a evidência nos quatro projetos e confirmar contratos críticos antes da implementação.
- Criar dez componentes, testes, documentação/exemplos necessários e integrar cada item nos exports e no manifesto/resolver conforme o fluxo existente.
- Usar `InputBase` onde fizer sentido, preservar acessibilidade e compatibilidade do pacote.

### Não fazer

- Não tocar nos quatro repositórios consumidores, backend, banco, serviços externos ou dependências.
- Não introduzir PrimeVue.
- Não sugerir nem implementar nomes da lista reservada do pedido.
- Não substituir controles existentes sem evidência e revisão explícita do contrato.
- Não fazer commit, merge, push, publicação ou deploy.

## Evidências e referências existentes

- Biblioteca: `src/components/`, `src/index.ts`, `src/components-manifest.json`, `package.json`, `tests/components/`, `tests/browser/` e `AGENTS.md`.
- Engeapp: `resources/Vue/Sections/Auth/Register.vue` (RG e perfis sociais), `resources/Vue/Pages/WirePage.vue` (exemplos de inputs especializados já planejados/reservados).
- MaxAiManager: `resources/Vue/Sections/Settings/Ai/ModalAiProvider.vue` (credenciais e apresentação externa da chave).
- AgenteDeBolso: `resources/Vue/Sections/Report/ReportFilterBuilder.vue` (período, regime de data, filtros múltiplos e chips), `resources/Vue/Sections/Settings/Preferences/CurrencyGroup.vue` e `resources/Vue/Sections/Settings/ScheduleGroup.vue`.
- SocialMedia: `resources/Vue/Sections/SocialMedia/TabBrandPositioning.vue` (cor já atendida por `MaxColorPicker`), `resources/Vue/Pages/Clients/ClientWorkspace.vue` (credenciais/conta externa) e `resources/Vue/Sections/SocialMedia/ThemeScheduleBuilder.vue` (data/horário).

## Etapas

### 1. Preflight e confirmação de lacunas

- Conferir o estado atual da worktree e as instruções vigentes; preservar toda alteração que já exista.
- Ler contratos e testes de `InputBase`, `MaxInputSelect`, `MaxTagSelect`, `MaxInputDatePicker`, `MaxInputUF`, `MaxInputTypeAddress`, `MaxInputMoney` e `MaxColorPicker`; conferir `MaxInputTextList` e componentes equivalentes.
- Verificar novamente a ausência dos dez nomes e conflitos com a lista de componentes em andamento.
- Nos quatro projetos, confirmar somente os campos representativos e contratos de dados apontados na spec, sem editar arquivos externos à biblioteca.
- Resultado: tabela final de requisitos e decisões; se houver duplicidade, lacuna legal/regional ou contrato de data/fuso não verificável, pausar esse item e revisar a proposta antes de codificar.

### 2. Fixar contratos públicos

- Definir tipos de valor, props, eventos e acessibilidade para cada componente antes de implementar.
- Acordar formatos compostos de `MaxInputDateRange`, `MaxInputAddress` e `MaxInputDateTimeLocal`; manter os outros inputs controlados e configuráveis sem valores de domínio embutidos indevidos.
- Revisar colisões com `MaxTagSelect` para multi-seleção e com a API de credenciais; separar `MaxInputSocialHandle` de seletor de plataforma e `MaxInputAddress` de seletor de tipo de endereço.
- Resultado: contrato de API tipado que permita testes sem backend ou rede.

### 3. Implementar os componentes e testes

- Criar os dez SFCs em `src/components/` e os testes em `tests/components/`, seguindo a ordem do template/script/style do projeto, Composition API, TypeScript estrito, linhas de abertura Vue em uma linha, aspas simples, acessibilidade e tokens semânticos.
- Implementar com estado controlado; composições devem tratar desmontagem, foco, erros e estados vazios sem exigir comportamento especial dos consumidores.
- Para `MaxInputCredential`, manter segredo sob controle do consumidor; não logar, persistir, enviar ou incluir valor real em fixtures/snapshots.
- Cobrir entradas válidas/inválidas, valores vazios, atualizações externas, eventos, teclado e casos de borda relevantes. Aplicar testes de navegador aos controles compostos/interativos, especialmente multi-seleção, intervalo e credencial.
- Resultado: cobertura de comportamento antes de registrar os nomes no catálogo público.

### 4. Integrar catálogo e material de uso

- Registrar os dez exports em `src/index.ts`; atualizar o manifesto e o resolver usando o gerador já previsto no projeto somente após entender seu efeito e sua saída.
- Documentar props, tipos, eventos, acessibilidade, formatos e exemplos de uso em documentação/playground existentes, identificados na execução.
- Confirmar que exports gerados, tipos públicos e artefatos previstos não criam import ou dependência proibida.
- Resultado: componentes descobertos por importação e auto-import conforme as convenções existentes.

### 5. Validação por lote e revisão de risco

- Antes de qualquer suíte, executar o preflight do ambiente por leitura: scripts e prehooks, dependências efetivas/symlinks e isolamento relevante. Um gate de integridade falhado bloqueia validações dependentes; não contornar com comando direto ou remoção de prehook.
- Implementar o escopo e todos os testes antes de rodar validações completas; não validar após cada microedição.
- Executar gates pertinentes sobre uma revisão factual. Os comandos identificados no `AGENTS.md` são `npm run test`, `npm run type-check`, `npm run type-check:test`, `npm run lint`, `npm run build` e, quando necessário para gate pré-release, `npm run verify`. `npm run verify` agrega validações e não deve ser repetido pelos mesmos comandos isolados na mesma revisão sem causa.
- Corrigir falhas em lote, diagnosticar falhas persistentes e repetir apenas validações afetadas após mudança relevante. Não afirmar aprovação de checks não executados.
- Fazer revisão independente dos contratos compostos, acessibilidade, impacto público do catálogo e não regressão.

### 6. Handoff e encerramento

- Registrar marcos e handoff durante Execute em `docs/plans/wt-3cf08e1f/execution-state.json` conforme o formato v2 estrito especificado nas instruções da sessão; vincular hashes SHA256 reais do plano e das revisões verificadas, registrar comandos realmente executados e falhas. Não criar esse registro durante Plan.
- Deixar alterações na worktree ativa. Esperar pedido explícito para commit/integração/publicação.

## Matriz de aceite

| Requisito | Evidência de aceite | Testes pertinentes | Revisão por risco / manual |
| --- | --- | --- | --- |
| Dez novos nomes estão ausentes e não são reservados | Catálogo, exports e manifesto atualizados sem colisões | teste de catálogo/resolver ou validação equivalente já existente | comparar nominalmente com lista reservada |
| Multi-seleção e grupo de situação são acessíveis e controlados | seleção atualiza valor controlado; vazio segue semântica declarada | unitários e navegador (teclado, foco, seleção/remoção) | revisão de leitor de tela/nomes e `MaxTagSelect` |
| Período e data/hora têm formato explícito | limites, ordenação, valor e serialização documentados | unitários para limites, campos vazios e atualização externa; navegador para interação | revisar limites de data e fuso antes de aprovar |
| Referência de data permite seleção única configurável | opções e eventos fornecidos pela aplicação | unitários e teclado/foco | confirmar ausência de regras de domínio embutidas |
| RG valida apenas regras comprovadas | número/emissor/UF com contrato declarado | unitários de máscara e bordas confirmadas | revisão de regra local; se incerta, não alegar validade documental |
| Endereço preserva dados e integração externa é opcional | eventos/slots e valores dos campos documentados | unitários de edição parcial/limpeza; integração manual isolada se houver serviço | verificar compatibilidade com `MaxInputCep` sem chamadas ocultas |
| Moeda não se confunde com entrada de valor | código/label selecionado sem conversão de dinheiro | unitários para opções, vazio e valor selecionado | revisão de códigos suportados e `MaxInputMoney` |
| Handle social não seleciona plataforma | edição sem chamadas de rede e sem embutir plataforma | unitários de valor, normalização e eventos | comparar explicitamente com `MaxInputSocialPlatform` reservado |
| Credencial não expõe nem altera segredo implicitamente | valor controlado; mostrar/ocultar só apresentação visual | unitários para visibilidade, teclado e valor; evitar snapshots de segredo | inspeção manual sem credenciais reais e revisão de acessibilidade/segurança |
| Biblioteca não sofre regressões de pacote | gates pertinentes passam na mesma revisão validada | suíte, tipos, lint e build conforme seção de validação | revisão de exports, manifesto, peer/runtime deps e build |

## Riscos, limitações e interrupção

- Nomes semelhantes a itens simultaneamente em desenvolvimento podem surgir depois desta análise; revalidar antes de criar arquivos.
- RG, formato do endereço, fuso/serialização e catálogo de moedas dependem de contratos/regra não estabelecidos por esta leitura; interromper o item se não forem comprováveis, e pedir decisão somente se afetar o resultado.
- Componentes com escopo amplo (`MaxInputAddress`, `MaxInputCredential`) podem duplicar composição de consumidor; manter API pequena e não introduzir rede, persistência ou domínio sem autorização.
- Nenhum teste foi executado nesta fase; os comandos são verificações futuras identificadas em `AGENTS.md`.
- A busca foi limitada às árvores de código acessíveis e arquivos representativos listados na spec, não é garantia de inventário completo dos históricos dos consumidores.

## Retomada

Na primeira admissão, ler este plano e a spec; nas retomadas, consultar apenas etapas relevantes. Conferir trabalho e mudanças locais já feitos, revalidar contratos e componentes similares, preservar decisões e dependências, executar as lacunas na ordem acima e registrar estado após marcos. Não reabrir decisões sem nova evidência ou mudança do pedido. Não paralelizar etapas que escrevam nos mesmos arquivos de catálogo/export; eventual paralelismo exige arquivos de escrita distintos e dependências resolvidas.
