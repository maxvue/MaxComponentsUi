# Plano de execução — Issue #98

## Descrição e Causa Raiz

### Veracidade e delimitação

**Achado confirmado por inspeção estática do estado atual em 19/10/2026.** O catálogo ainda promete compatibilidade integral com o DataTable PrimeVue, mas `MaxTable` renderiza uma tabela HTML nativa e possui contrato próprio. A correção necessária é documental; a ausência de agrupamento não autoriza implementar paridade com PrimeVue.

- `COMPONENTS.md:L1299-1309` descreve o componente como baseado no DataTable, afirma aceitar todas as suas props via `v-bind` e promete todos os slots nativos.
- `src/components/MaxTable.vue:L1-5` materializa `div` e `table`, não um DataTable externo. Os imports em `src/components/MaxTable.vue:L443-457` tampouco importam PrimeVue.
- `src/components/MaxTable.vue:L459-495` declara as props próprias; `rowGroupMode` e `groupRowsBy` não constam nelas. A pesquisa literal de `rowGroupMode`, `groupRowsBy` e `groupheader` no arquivo inteiro não encontrou ocorrências.
- `src/components/MaxTable.vue:L560-568` declara os slots principais e uma assinatura aberta. Essa assinatura permite nomes adicionais na tipagem, mas não implementa automaticamente sua renderização.
- `src/components/MaxTable.vue:L210-315` renderiza linhas virtuais ou normais, células e ações; não há cabeçalhos de grupos nem execução do slot `groupheader`.
- `COMPONENTS.md:L1311-1323` também apresenta `width` como método, embora seja uma ref exposta, e usa `<Column>` sem esclarecer que existe um alias local, independente do PrimeVue.

**Causa Raiz Comprovada:** o contrato universal publicado em `COMPONENTS.md:L1299-1309` não corresponde ao contrato finito de `src/components/MaxTable.vue:L459-568` nem ao template de `src/components/MaxTable.vue:L1-440`. Trata-se de divergência entre catálogo e implementação nativa. A origem histórica da redação não foi comprovada e não é necessária para estabelecer essa divergência.

### Fluxo causal e rastreamento reverso

1. O integrador lê o catálogo e infere que pode usar quaisquer props/slots do DataTable.
2. O consumidor fornece dados e colunas a `MaxTable`. `rawData` resolve `value`, `data` e o fallback de atributos em `src/components/MaxTable.vue:L697-709`; `resolvedColumns` resolve `columns` ou VNodes do slot padrão em `src/components/MaxTable.vue:L614-687`.
3. O fluxo efetivo é `rawData → filteredData → sortedData → displayData → linhas/células HTML`, em `src/components/MaxTable.vue:L1017-1089`, `L1122-1127` e `L210-315`. Não existe estágio de agrupamento.
4. No sentido reverso, as células obtêm os valores de `displayData` e das colunas resolvidas; os slots renderizados dependem de chamadas explícitas no template. A passagem de um atributo desconhecido ao elemento raiz não cria comportamento de DataTable.
5. `src/index.ts:L315-319` exporta `MaxTable`, `MaxTableColumn`, `Column` e `MaxColumn`; os dois últimos são aliases da coluna local, não dependências do PrimeVue.

**UI ⇄ Store ⇄ API/Rotas ⇄ Controller/Service ⇄ DB:** neste achado, o rastreamento termina na UI e nos dados fornecidos pelo consumidor. O componente não contém integração com store, requisição HTTP, rota, controller, serviço ou banco de dados. No modo `lazy`, emite eventos para o consumidor e não executa filtragem, ordenação ou paginação local; não cabe inventar um backend para explicar o erro documental.

### Cenário reproduzível

Confrontar os trechos acima e pesquisar os três identificadores de agrupamento no componente basta para comprovar o defeito de documentação. Como demonstração opcional na execução futura, montar `MaxTable` com `value`, uma `MaxTableColumn`, atributos `rowGroupMode="subheader"`/`groupRowsBy="categoria"` e um slot `groupheader` com marcador: o template atual renderiza as linhas comuns, sem consumir o marcador de agrupamento. Essa demonstração não deve virar uma obrigação permanente de impedir uma futura implementação legítima de agrupamento.

Não foram executados testes de runtime, tipos ou build nesta etapa; a confirmação do problema é estática, suficiente para esta promessa documental incorreta.

## Arquivos afetados

**Na implementação futura:**

| Arquivo | Alteração prevista |
|---|---|
| `COMPONENTS.md` | Corrigir apenas a seção `### MaxTable`, delimitada pela próxima seção `### MaxTableFields`; descrever API própria, limitações e exemplo independente do PrimeVue. |
| `tests/components/MaxTableDocumentation.test.ts` (novo) | Validar o contrato documental da seção e executar um exemplo equivalente ao publicado, com componentes locais. |

**Nesta etapa:** somente `docs/issues/98/plan.md` é preenchido. `src/components/MaxTable.vue`, `src/components/MaxTableColumn.vue`, `src/index.ts`, testes existentes, dependências e lockfile são referências de leitura e devem permanecer intactos. Não realizar commit, push, merge ou publicação.

## Execuções propostas

1. Permanecer na worktree pré-alocada, preservar trabalho alheio e confirmar novamente os trechos do contrato caso o código tenha mudado desde este plano.
2. Substituir a descrição de wrapper/DataTable por “tabela HTML nativa com contrato próprio”. Preservar a informação válida sobre largura automática da coluna de ações. Explicar que classes legadas `.p-*` não significam dependência ou paridade funcional com PrimeVue.
3. Remover as duas promessas universais. Acrescentar aviso explícito de que não há compatibilidade integral com props, slots ou eventos do DataTable. Registrar `rowGroupMode`, `groupRowsBy` e `groupheader` como recursos não implementados no estado atual, sem sugerir que basta repassá-los via `v-bind`.
4. Documentar props efetivamente consumidas, com tipos e defaults conferidos em `MaxTableProps`, `withDefaults` e nos usos reais. Organizar em grupos: dados/colunas (`value`, `data`, `columns`, `dataKey`); apresentação/estado (`stripedRows`, `scrollable`, `scrollHeight`, `tableStyle`, `loading`, `empty`, mensagens, `headerButton`); paginação (`paginator`, `rows`, `first`, `totalRecords`, `lazy`); seleção e ordenação; filtros; virtualização (`virtualScroll`, `itemHeight`, `virtualScrollOptions`). Explicar que `value` prevalece sobre `data`, que o zebrado é ativo por padrão e que `lazy` delega o processamento ao consumidor. Não promover props apenas declaradas a funcionalidades comprovadas: por exemplo, `responsiveLayout` aparece na declaração e no default, mas não há consumo que implemente o modo `stack`; omitir essa capacidade ou sinalizar expressamente a limitação, sem corrigir runtime nesta issue.
5. Separar os dois modos de composição. Com `columns` ou colunas declarativas, opera em modo orientado a dados. O slot `header` da tabela ativa o modo manual (`src/components/MaxTable.vue:L689-695`), no qual o consumidor fornece células de cabeçalho e linhas. Não confundir esse slot com `#header` de uma coluna nem documentá-lo como toolbar do DataTable.
6. Enumerar slots realmente renderizados: `default`, `header`, `loading`, `empty`, `buttons` e `footer`; documentar o payload `{ data, index }` de `buttons` no modo orientado a dados. Explicar a composição local com `MaxTableColumn` e seus slots efetivamente usados (`body`, `header`, `filter`), além dos slots dinâmicos para `columns` (`col.slot`/campo e `filter-{field}`/`col.filterSlot`, conforme `L669-677`). Não tratar a assinatura aberta de slots como suporte universal; `filterHeader` apenas extraído e `editor` apenas declarado não comprovam renderização e não devem ser prometidos.
7. Publicar a lista e os payloads dos eventos declarados em `src/components/MaxTable.vue:L548-558`, distinguindo declaração de emissão efetiva. Não prometer `update:rows` ou `update:modelValue` como comportamentos ativos sem encontrar emissão correspondente. Descrever `width` como estado exposto, não método; caso sejam documentados outros expostos, usar exclusivamente os membros de `L1310-1322` e distinguir refs/computeds de `scrollToIndex`/`scrollToOffset`.
8. Tornar o exemplo autocontido em Vue 3: importar `MaxTable` e `MaxTableColumn` de `@maxvue/max-components-ui`, fornecer dados locais tipados, declarar colunas por `MaxTableColumn` e demonstrar `#buttons` com botão nativo e handler definido. Mencionar que `Column` e `MaxColumn` são aliases locais disponíveis, sem exigir import de PrimeVue. Manter tags de abertura em linha única e `<template>` antes de `<script setup lang="ts">`.
9. Criar o teste documental descrito abaixo, sem adicionar dependências. Reaproveitar o padrão de Vitest, Vue Test Utils, Pinia e mock de medição observado em `tests/components/MaxTable.test.ts:L1-28`. Não refatorar testes preexistentes nem alterar o componente para satisfazer documentação.
10. Concluir todo o bloco documental e seus testes antes das validações. Revisar o diff e, somente depois, executar os comandos em lote. Corrigir eventuais falhas relacionadas ao lote conjuntamente e revalidar após todas as correções.

## Testes de regressão e validação em lote

### Teste documental novo

Em `tests/components/MaxTableDocumentation.test.ts`:

- Ler `COMPONENTS.md` por URL relativa ao arquivo de teste usando `node:fs`; isolar estritamente a seção `MaxTable`, sem capturar `MaxTableFields` ou outras referências históricas do catálogo.
- Assegurar que a seção existe, descreve tabela nativa/contrato próprio e não contém as afirmações “Aceita todas as props do DataTable PrimeVue”, “Todos os slots nativos do DataTable” ou uma descrição afirmativa de wrapper baseado no DataTable. Não proibir a palavra PrimeVue, necessária ao aviso de limitação.
- Exigir aviso de ausência de compatibilidade integral e que os três identificadores de agrupamento estejam associados expressamente à limitação, não apenas presentes em qualquer contexto. Preferir um bloco de limitações delimitado para evitar falsos positivos em exemplos negativos.
- Verificar que o exemplo usa `MaxTableColumn`, não importa `primevue` e define os dados e o handler utilizados. Evitar snapshot de toda a seção ou testes dependentes da formatação completa das tabelas Markdown.
- Montar um equivalente funcional do exemplo com os componentes locais: duas linhas tipadas, duas colunas declarativas e `buttons` com `{ data, index }`. Conferir cabeçalhos, textos das células, uma ação por linha e associação correta do clique ao registro. Desmontar o wrapper ao final.
- Cobrir também a alternativa documentada de `columns` com slot de célula nomeado, caso incluída como exemplo no catálogo. Não criar testes de filtragem, edição ou agrupamento inexistentes só para ampliar esta issue.

### Regressões existentes e lote

Executar uma vez, após concluir o bloco:

```bash
npx vitest run tests/components/MaxTableDocumentation.test.ts tests/components/MaxTable.test.ts tests/components/MaxTableColumn.test.ts tests/components/MaxTableFields.test.ts
npm run type-check:test
npm run lint
git diff --check
```

Os testes existentes preservam modos de composição, ações/largura, estados vazios e carregamento, seleção, ordenação, filtros, paginação e demais cenários já cobertos. Não adicionar asserção negativa permanente que congele a ausência de agrupamento.

Esse é um lote proporcional a documentação e novo teste, não um gate de release. Não executar build, browser, benchmarks ou `npm run verify` por microedição. Se a entrega futura exigir release, executar `npm run verify` no fechamento, sem repetir suas etapas isoladas na mesma revisão. Falhas de baseline não relacionadas devem ser diagnosticadas e relatadas, não corrigidas ampliando o escopo sem autorização.

## Banco de dados

Nenhuma migration. Nenhuma alteração em schema, persistência, API ou dados.

## Riscos de quebra e Não-Regressão

- **Runtime e dependências:** risco baixo desde que permaneçam inalterados os componentes, exports, CSS, classes `.p-*`, manifesto e lockfile. Não reintroduzir PrimeVue para tornar verdadeira a promessa antiga.
- **Contrato percebido pelo consumidor:** a documentação pode revelar integrações baseadas em expectativas incorretas. Explicitar os limites e os aliases locais; não apresentar a correção textual como remoção recente de funcionalidades que já existiam.
- **Nova promessa incorreta:** interfaces abertas e props/slots declarados sem consumo podem levar a outro catálogo enganoso. Conferir cada comportamento publicado no ponto de renderização/emissão; testes do exemplo e revisão cruzada do contrato são obrigatórios.
- **Confusão entre modos:** `header` manual muda a resolução da tabela. Descrever essa distinção e preservar as regressões de modo manual e orientado a dados, sem inserir um `header` de tabela no exemplo de colunas declarativas.
- **Teste documental frágil:** limitar a extração à seção exata e testar conteúdo contratual, não espaçamento ou número de linhas. Atualizações legítimas de contrato devem ajustar conjuntamente código, documentação e testes.
- **Escopo:** não corrigir silenciosamente `responsiveLayout`, slots não renderizados ou a seção vizinha de `MaxTableColumn`; achados adicionais devem ser tratados separadamente. Nenhuma alteração de comportamento está autorizada por este plano.

## Validação

**Prova automatizada principal:** `npx vitest run tests/components/MaxTableDocumentation.test.ts` deve terminar com código zero, demonstrando simultaneamente a remoção da promessa universal, a presença das limitações e a viabilidade do exemplo local. Ele já integra o lote acima; não executá-lo novamente sem mudança ou diagnóstico concreto.

Critérios de aceite conjuntos:

1. A seção `MaxTable` não afirma usar DataTable PrimeVue nem suportar todos os seus contratos.
2. As limitações de agrupamento são explícitas; props, slots, eventos e expostos descritos correspondem ao consumo real no componente.
3. O exemplo tem imports locais válidos e teste funcional equivalente aprovado.
4. O lote de regressões, tipos de testes, lint e integridade do diff passa; pendências são relatadas sem declarar sucesso indevido.
5. O diff de implementação fica restrito ao catálogo e ao novo teste, além deste plano; nenhum código de produção, dependência, backend ou banco muda.

## Skills Aplicáveis

- `technical-documentation-best-practices`: fidelidade ao código, documentação de API pública, exemplos completos e organização do catálogo. Aplicada na elaboração deste plano.
- `vue-components`: composição nativa Vue 3 e separação entre slots da tabela e das colunas, para o exemplo e sua montagem de teste.
- `vue-typescript-best-practices`: tipagem dos dados, payloads e exemplo Vue sem inventar contratos externos.
- `vitest-skill` e `javascript-testing-patterns`: teste documental com leitura de arquivo e regressão funcional isolada.
- `code-review`: revisão final da implementação, com foco na correspondência documentação/runtime, não-regressão e ausência de imports PrimeVue.

Não é necessário orquestrar agentes, implementar TDD de runtime, refatorar arquitetura ou alterar o design visual para corrigir este achado documental. Nenhuma dessas atividades foi executada nesta etapa de planejamento.
