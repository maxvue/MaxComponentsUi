# Plano de execução — Issue #102

## Descrição e Causa Raiz

### Veracidade e escopo

**Achado confirmado por inspeção estática**, na revisão `02955b7fce6d6a61c43ab68165c7f1bbdc846d8f`. O problema é uma promessa documental incompatível com a implementação atual, não uma solicitação para criar um motor de temas, tradução global ou ripple. A correção proposta é alinhar a documentação ao contrato existente, preservando a API pública.

O `README.md:L89-112` apresenta `app.use(MaxComponentsUi, options)` como configuração do PrimeVue e anuncia `locale`, `theme.preset`, `theme.options.darkModeSelector`, `theme.options.prefix` e `ripple`, inclusive com valores padrão. Esses efeitos não são executados pelo plugin atual. Quem segue o exemplo pode acreditar que mudou idioma, seletor escuro, prefixo CSS e efeito de clique, embora apenas tenha disponibilizado um objeto para injeção.

**Causa Raiz Comprovada:**

1. `README.md:L91-103` orienta passar um locale e um preset ao plugin; `README.md:L106-112` atribui efeitos e padrões a essas opções.
2. `src/index.ts:L450-455` aceita um objeto permissivo: `theme`, `prefix`, `ripple` e uma assinatura aberta. `locale` pode entrar pela assinatura aberta; aceitação de uma chave pelo TypeScript não comprova comportamento.
3. `src/index.ts:L457-460` limita a instalação ao registro da diretiva nativa `tooltip` e a `app.provide?.('maxComponentsOptions', options)`. O padrão real do argumento é `{}`, sem mescla de locale, preset ou ripple.
4. A busca literal por `maxComponentsOptions` em todo `src` encontrou somente `src/index.ts:L459`: não há consumidor interno dessa chave. A busca por `darkModeSelector|ripple|meuLocaleCustomizado|ptBR|MeuPresetCustomizado` encontrou somente o export de `ptBR` (`src/index.ts:L4`) e a declaração de `ripple` (`src/index.ts:L453`). Não foi encontrado mecanismo que aplique as opções anunciadas.
5. `tests/core/install.test.ts:L14-30` já comprova que opções arbitrárias são injetadas, não aplicadas. `tests/core/install.test.ts:L33-36` trata `MaxStyle` como objeto de tokens independente.

### Rastreamento reverso dos dados e agravantes

```text
Efeito esperado na UI pelo exemplo do README
    ⇐ opções locale/theme/ripple fornecidas pela aplicação consumidora
    ⇒ app.use(MaxComponentsUi, options)
    ⇒ install (src/index.ts:457-460)
       ├─ registra v-tooltip nativo
       └─ provide('maxComponentsOptions', options)
          └─ sem consumo interno identificado: os efeitos prometidos não ocorrem

Apresentação efetiva da UI
    ⇐ regras CSS e tokens estáticos, não o objeto options
    ⇐ src/themes/tokens.scss:8-19 e 145-150
    ⇐ src/components/MaxButton.vue:103-120
```

- `src/components/MaxButton.vue:L1-8` renderiza um botão nativo; `L75-87` trata clique/ação/rota sem aplicar ripple. Seus estilos usam `--max-primary-*` diretamente (`L103-120`).
- Os tokens de marca estão em `src/themes/tokens.scss:L8-19` e o esquema escuro usa `.dark` em `L145-150`. Não são produzidos a partir de `theme.options.prefix` ou `darkModeSelector`.
- `src/styles/style.ts:L15-25` define `MaxStyle` como estrutura de paletas semânticas; sua existência e exportação não significam instalação de um preset Aura.
- `src/locales/pt-br.ts:L13-31` exporta um objeto de textos; o export público em `src/index.ts:L4` não o instala como tradução global. Não afirmar que a biblioteca inteira carece de traduções locais ou props de textos: o achado diz respeito exclusivamente a `options.locale` do plugin.
- A inconsistência reaparece no próprio README: `L126` e `L170` ainda descrevem `MaxStyle` como preset, inclusive associado a PrimeVue/Aura. Corrigir apenas o exemplo deixaria essa falsa expectativa ativa.
- `docs/THEME.md:L10-14` já descreve tokens e carregamento explícito de CSS, mas `L36` ainda promete `.dark` configurável por `darkModeSelector`. Esse ponto precisa ser harmonizado com a correção do README.

**UI ⇄ Store ⇄ API/Rotas ⇄ Controller/Service ⇄ DB:** o fluxo afetado termina no bootstrap Vue e em CSS. Não envolve store, requisição HTTP, controller, serviço de backend ou banco. A possibilidade de um botão navegar por uma rota não integra a instalação do plugin e não será modificada.

### Reprodução estática verificável

Na raiz desta worktree, os comandos abaixo permitem repetir o confronto sem editar arquivos nem executar build:

```bash
nl -ba README.md | sed -n '89,112p'
nl -ba src/index.ts | sed -n '450,460p'
rg -n --fixed-strings maxComponentsOptions src
rg -n 'darkModeSelector|ripple|meuLocaleCustomizado|ptBR|MeuPresetCustomizado' src
```

Resultado observado: promessa explícita no README, corpo de instalação com duas operações e somente um resultado para a chave de injeção em `src`. Isso basta para comprovar a divergência documental. Não foi realizada reprodução visual ou execução de testes nesta etapa; não confundir evidência estática com validação runtime.

## Arquivos afetados

### Nesta etapa de planejamento

- `docs/issues/102/plan.md` — único arquivo preenchido; o arquivo já existia vazio na worktree pré-alocada.

### Na implementação futura

| Arquivo | Alteração prevista |
| --- | --- |
| `README.md` | Reescrever a configuração avançada; ajustar o comentário do início rápido e as duas descrições de `MaxStyle` que contradizem o contrato. |
| `docs/THEME.md` | Remover a promessa de `darkModeSelector` via plugin e explicitar o mecanismo real de tokens CSS e classe `.dark`. |
| `tests/core/install.test.ts` | Expandir a caracterização da instalação sem opções e da preservação das opções injetadas, mantendo as asserções atuais. |
| `tests/core/readmeConfiguration.test.ts` (novo) | Cobrir o contrato documental da configuração e sua coerência com o guia de tema. |

`src/index.ts`, componentes, temas, locales, manifests e lockfile são evidências/contratos de referência e **não precisam de alteração**. Não modificar outros planos/issues, regenerar artefatos ou atualizar dependências.

## Execuções propostas

1. Permanecer na worktree pré-alocada e conferir o estado Git, preservando alterações de terceiros. Reler os trechos citados caso a revisão tenha avançado; ajustar números de linha sem assumir que a auditoria continua atual.
2. Preparar, em um único bloco, os testes de contrato documental e a ampliação de `tests/core/install.test.ts` descritos abaixo. Não iniciar validações a cada microedição.
3. Reescrever a seção `Configuração Avançada` do README para explicar o comportamento real de `install`:
   - Registra somente a diretiva global `v-tooltip`; não registra componentes globais nem configura PrimeVue.
   - Aceita um objeto opcional cujo padrão é `{}` e o disponibiliza pela chave `maxComponentsOptions`. Não prometer validação, mescla de defaults, reatividade extra ou efeitos automáticos.
   - Preferir exemplo completo e mínimo com `createApp`, `App` e `app.use(MaxComponentsUi)` sem o segundo argumento. Incluir import explícito de `@maxvue/max-components-ui/style.css` no bootstrap demonstrado, em coerência com os exports `package.json:L25-30` e o guia de tema.
   - Se houver exemplo de opções adicionais, identificar claramente que somente código da própria aplicação que injete a chave pode lhes dar significado. Não apresentar isso como configuração nativa dos componentes.
   - Remover a tabela de opções suportadas e os defaults fictícios. Registrar em uma nota de compatibilidade que `locale`, `theme`, `prefix` e `ripple` podem ser recebidos pelo objeto permissivo, mas não são aplicados internamente; incluir explicitamente os caminhos aninhados `theme.options.darkModeSelector` e `theme.options.prefix` na explicação da limitação.
4. Apontar a personalização real para `docs/THEME.md`: CSS explícito, sobrescrita de tokens semânticos existentes na aplicação e uso da classe `.dark`. Se mostrar sobrescrita, usar `--max-primary-500`/`--max-primary-600` em CSS carregado depois do CSS da biblioteca; deixar claro que isso não é obtido passando `MaxStyle` a `app.use`.
5. Ajustar cirurgicamente o comentário do início rápido (`README.md:L34`), a linha do subpath `./styles` (`L126`) e o item de tema (`L170`). Descrever `MaxStyle` como objeto de tokens/paletas independente, não preset PrimeVue baseado em Aura. Preservar exports, imports individuais, resolver e instruções de integração externa que não fazem parte do erro.
6. Em `docs/THEME.md`, manter o conteúdo válido sobre paletas/UnoCSS; corrigir apenas a relação entre plugin, tokens e dark mode. Remover de `L36` a configuração por `darkModeSelector` e explicar que um seletor alternativo exige CSS da aplicação, sem promessa de reconfiguração automática dos estilos distribuídos.
7. Preservar integralmente o runtime: manter `MaxPluginOptions`, assinatura aberta, chave de injeção, identidade do objeto fornecido e diretiva. Não remover propriedades legadas, lançar avisos novos, renomear tokens/classes `.p-*`, nem reinstalar PrimeVue para fazer o exemplo antigo funcionar.
8. Concluir todas as alterações de documentação e testes antes da validação do lote. Executar os comandos da seção de validação, agrupar eventuais correções e revalidar somente as etapas afetadas. Revisar o diff bruto para confirmar o escopo. Não fazer commit, push, publicação ou integração sem solicitação explícita.

## Testes de regressão e validação em lote

### Contrato da instalação — `tests/core/install.test.ts`

- Preservar os testes existentes de tooltip nativo, injeção e export de `MaxStyle`.
- Instalar o plugin sem opções e, usando a API pública `app.runWithContext`/`inject` ou componente de prova, verificar que o valor fornecido é `{}`, sem defaults `locale`, `theme` ou `ripple`. Preferir APIs públicas a acessar `_context`.
- Instalar com um objeto contendo `locale`, `theme: { preset, options: { darkModeSelector, prefix } }`, `prefix`, `ripple: false` e uma chave customizada; verificar com `toBe` a identidade do objeto injetado, além da integridade do conteúdo. O teste comprova transporte, não aplicação de tema/idioma/ripple.
- Verificar que instalações em duas aplicações sem opções recebem objetos padrão distintos, evitando transformar o contrato em singleton.
- Manter o registro da diretiva ao fornecer opções. Limpar aplicações/componentes montados, se usados.

### Contrato documental — `tests/core/readmeConfiguration.test.ts`

- Ler `README.md` e `docs/THEME.md` com `node:fs`, resolvendo caminhos a partir de `import.meta.url`; não depender de número de linha, diretório de execução externo ou snapshots do documento inteiro.
- Delimitar o trecho de configuração avançada pelo heading e pelo próximo heading do mesmo nível. Exigir que a seção exista antes de avaliar seu conteúdo, evitando teste que passa ao apagar toda a explicação.
- Extrair os blocos de exemplo da seção e impedir que apresentem `locale`, `theme.preset`, `darkModeSelector`, prefixo ou ripple como argumentos funcionais de `app.use`. Para o exemplo principal adotado neste plano, exigir a chamada sem segundo argumento; a nota de incompatibilidade pode mencionar as chaves livremente.
- Verificar a presença dos pontos essenciais: tooltip, chave `maxComponentsOptions`, ausência de aplicação interna dessas opções, import CSS e link válido para `docs/THEME.md`. Não congelar a redação completa; usar verificações delimitadas por seção e por exemplos.
- Assegurar que a antiga tabela de defaults `ptBR`/`MaxStyle`/ripple não reapareça como tabela de capacidades suportadas.
- Conferir que a descrição de `MaxStyle` nas áreas alteradas identifica tokens/paletas e não associação a preset Aura/PrimeVue. Não proibir a palavra PrimeVue no README inteiro, pois há informações legítimas sobre consumo externo.
- No trecho de dark mode do guia, exigir `.dark` e impedir promessa de seletor configurável por opção do plugin. Conferir que a orientação de sobrescrita CSS não é apresentada como configuração via `app.use`.
- Projetar pelo menos uma asserção que falhe contra a seção atual do README (exemplo com segundo argumento/tema), para que os novos testes distingam concretamente o estado defeituoso do corrigido. Não remover asserções para obter resultado verde.

### Sequência do lote

Esta é uma tarefa de planejamento: nenhum desses testes será implementado ou executado agora. Na execução futura, escrever o bloco completo autorizado e seus testes antes de rodar testes, tipos ou build; validar o conjunto; diagnosticar falhas e corrigir em lote; revalidar após as correções. Uma falha preexistente deve ser registrada com evidência e não corrigida fora do escopo sem autorização.

## Banco de dados

Nenhuma.

## Riscos de quebra e Não-Regressão

| Risco | Prevenção e prova |
| --- | --- |
| Remover opções ou o `provide` e quebrar aplicações que injetam dados próprios | Não alterar runtime ou tipos; caracterização de identidade e conteúdo em `install.test.ts`. |
| Converter uma correção documental em implementação de tema/i18n/ripple | Manter arquivos de `src` fora do diff e não introduzir dependências ou imports de PrimeVue. |
| Fazer o leitor acreditar que `MaxStyle` ou `ptBR` são automaticamente aplicados | Explicação explícita sobre export versus consumo; testes delimitados dos exemplos e das descrições alteradas. |
| Corrigir o README e redirecionar o leitor para a mesma promessa falsa no guia de tema | Corrigir `docs/THEME.md:L36` no mesmo lote e verificar sua seção de dark mode. |
| Sugerir tokens ou seletor que não correspondem ao CSS real | Usar `--max-primary-*` e `.dark`, comprovados no SCSS; não prometer prefixo customizável. Não alterar tokens existentes nem introduzir regressão visual. |
| Gerar testes frágeis por número de linha, redação literal ou proibição global de termos | Extrair seções/blocos, testar contrato e manter permitidas notas de limitação e integração externa legítima. |
| Confundir documentação corrigida com funcionalidades adicionadas | Fechamento e notas devem dizer que opções continuam sem efeito automático; nenhuma promessa nova de personalização global. |

Não há modificação de componente, layout, estilo distribuído, store, HTTP ou persistência; testes visuais/browser e benchmarks novos não são necessários para este escopo. Os gates existentes de release continuam obrigatórios se houver publicação futura.

## Validação

Após a implementação completa, executar na worktree:

```bash
npx vitest run tests/core/install.test.ts tests/core/readmeConfiguration.test.ts
npm run type-check:test
npx eslint tests/core/install.test.ts tests/core/readmeConfiguration.test.ts
git diff --check
git diff --name-only
```

**Prova conclusiva para o escopo:** os testes documentais rejeitam o exemplo atual e passam com a documentação corrigida; os testes de instalação comprovam a manutenção do contrato real (tooltip e injeção sem defaults fictícios). A checagem de tipos/lint aprova os testes acrescentados, o diff fica restrito à lista de arquivos prevista e uma revisão humana confirma a coerência dos textos e links. Nenhum comando isolado de grep ou build comprova a qualidade semântica de toda a documentação.

Não executar build ou a esteira completa por mera edição de Markdown. Caso o escopo mude para runtime ou haja release autorizado, dimensionar novamente os gates; para pré-release, usar `npm run verify`, sem repetir sobre a mesma revisão as etapas que ele já agrega. Este plano não autoriza release.

## Skills Aplicáveis

- `technical-documentation-best-practices` — seguida no planejamento; aplicar na correção dos exemplos, links e descrições fiéis ao código.
- `vitest-skill` — seguir ao escrever os testes de instalação e o contrato documental com Vitest.
- `javascript-testing-patterns` — orientar isolamento das aplicações de prova, limpeza e asserções de identidade/comportamento.
- `code-review` — revisar antes de integração a compatibilidade, o escopo do diff, a correção documental e as evidências de validação.

Não é necessário implementar ou delegar uma investigação de backend, adotar novas skills ou acionar uma reforma visual para corrigir este achado.
