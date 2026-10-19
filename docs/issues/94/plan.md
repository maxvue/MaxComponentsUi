# Plano de execução — Issue #94

## Descrição e Causa Raiz

### Problema e decisão de veracidade

**Planejamento necessário: bug confirmado experimentalmente em 19/10/2026.** A falha está no teste de auditoria de isolamento, não em um vazamento de bandeiras comprovado no código de produção. O teste pode aprovar um chunk que alcança outra bandeira por um módulo intermediário. Isso gera uma aprovação indevida do isolamento e deixa regressões de code-splitting sem proteção.

O arquivo atual ainda contém o comportamento relatado. O histórico consultado inclui o commit `4fcc97c5`, cujo título menciona isolamento de grafo de bandeiras; essa intenção histórica não corrige a lacuna observada no conteúdo atual.

### Causa Raiz Comprovada

- `tests/assets/creditCardAssetsOptimization.test.ts:L260-279`: para cada uma das nove bandeiras, localiza um arquivo em `dist/` e lê somente esse arquivo com `fs.readFileSync`. Não há extração de dependências nem caminhada no grafo.
- `tests/assets/creditCardAssetsOptimization.test.ts:L281-289`: verifica `<svg` e procura a substring `card-${other.key}` apenas em `chunkContent`. Uma aresta para `./intermediario.js` não contém o nome da bandeira proibida; o arquivo intermediário nunca é lido.
- `tests/assets/creditCardAssetsOptimization.test.ts:L291-299`: os orçamentos comprimidos também usam exclusivamente o buffer do chunk inicial. Esses limites individuais são válidos e devem permanecer individuais; não são uma verificação de transitividade.
- `tests/assets/creditCardAssetsOptimization.test.ts:L304-323` e `src/helpers/creditCardAssets.ts:L163-165`: a verificação em runtime consulta o `Map` de promessas da biblioteca. Um módulo carregado como dependência do bundle não precisa registrar uma promessa nesse mapa; cache vazio de outra bandeira não prova ausência de importação transitiva.

**Fluxo causal:** `chunk Visa → import './intermediario.js' → import './card-mastercard-<hash>.js'`. A auditoria lê Visa, encontra seu SVG, não encontra `card-mastercard` nesse primeiro arquivo e aprova. O carregador de módulos, diferentemente da auditoria, percorre a aresta intermediária e carrega Mastercard.

**Rastreamento reverso no projeto:**

1. UI: `src/components/MaxCreditCard.vue:L243-258` solicita a bandeira ao montar e ao alterar `card_type`; `src/components/MaxCreditCard.vue:L84-92` recebe a URI e atualiza `card_type_image`.
2. Helper/cache local: `src/helpers/creditCardAssets.ts:L112-133` resolve a marca, consulta o cache, executa o loader e transforma o SVG em Data URI.
3. Origem do asset: `src/helpers/creditCardAssets.ts:L64-75` declara imports dinâmicos literais para os SVGs. O nome canônico `discover` aponta para `card-discovery.svg` (`L52-61` e `L68`), distinção que deve ser preservada.
4. Build: `vite.config.ts:L24-65` produz a biblioteca ESM com entradas múltiplas, dependências externas e minificação. A auditoria lê os chunks de `dist/`, mas não acompanha suas dependências.
5. Store Pinia, API/rotas, Controller/Service e DB: **não participam deste fluxo**. O estado relevante é o cache em memória do helper (`src/helpers/creditCardAssets.ts:L82-83`), não uma store remota.

### Experimento de mutação executado

Foi executado o **teste existente, sem editar seu código**, em artefatos sintéticos descartáveis dentro de `dist/` na worktree pré-alocada. `dist/` não existia antes do experimento. Não foi produzido nem auditado um build real nesta etapa.

Preparação: nove módulos `card-<bandeira>-audit94.js`, cada um exportando uma string SVG mínima; Mastercard recebeu uma atribuição sentinela em `globalThis` para comprovar carregamento. Um módulo `intermediario-audit94.js` importava `./card-mastercard-audit94.js`. Uma configuração descartável reutilizou `vitest.config.ts`, alterando somente o diretório de cache para a área descartável.

Filtro executado em cada cenário:

```bash
node node_modules/vitest/vitest.mjs run tests/assets/creditCardAssetsOptimization.test.ts --config dist/.issue94-audit/vitest.config.mjs --testNamePattern 'todos os chunks de bandeira no dist são estritamente isolados' --maxWorkers 1
```

| Cenário | Modificação no módulo Visa | Resultado observado |
| --- | --- | --- |
| Controle sem ligação cruzada | Apenas exportação do SVG | Exit code 0; 1 teste passou, 14 ignorados |
| Mutação transitiva estática | `import './intermediario-audit94.js'` antes do SVG | Exit code 0; 1 teste passou, 14 ignorados: mutação sobreviveu |
| Mutação transitiva dinâmica | `export const carregar = () => import('./intermediario-audit94.js')` junto ao SVG | Exit code 0; 1 teste passou, 14 ignorados: mutação sobreviveu |
| Controle de ligação direta | `import './card-mastercard-audit94.js'` antes do SVG | Exit code 1; falha em `creditCardAssetsOptimization.test.ts:289`, mensagem de referência a Mastercard |

Uma importação nativa do módulo Visa no cenário estático também imprimiu `PROVA RUNTIME: mastercard carregado pela importação de visa = true`. Portanto, não se trata apenas de uma string com aparência de import: a dependência transitiva realmente foi executada.

Os arquivos do experimento e seu cache foram removidos. O comando acima documenta a execução realizada, não é um comando autossuficiente após essa limpeza; a implementação deverá transformar esses cenários em regressões permanentes com fixtures próprias. O experimento comprova a insuficiência da auditoria, não que o bundle real atual esteja contaminado. A falha intencional do controle direto não é uma falha de baseline do projeto.

## Arquivos afetados

| Arquivo | Alteração planejada |
| --- | --- |
| `tests/helpers/bundleDependencyGraph.ts` — novo | Utilitário interno de teste para extrair e percorrer dependências ESM locais, validar resolução e informar caminhos de dependência. Não exportar no pacote. |
| `tests/assets/bundleDependencyGraph.test.ts` — novo | Fixtures descartáveis e regressões do mesmo utilitário utilizado na auditoria real, incluindo as mutações sobreviventes. |
| `tests/assets/creditCardAssetsOptimization.test.ts` | Integrar a caminhada transitiva à asserção das nove bandeiras, preservando as verificações atuais de SVG, existência, segurança, tamanho e cache. |

`docs/issues/94/plan.md` é o único documento persistente preenchido nesta etapa. Não estão previstas alterações em `src/`, SVGs, configurações de build, API pública, dependências ou lockfile. `dist/` continuará sendo apenas saída gerada, nunca arquivo versionado da correção.

## Execuções propostas

1. **Manter o escopo de teste.** Trabalhar na worktree autorizada, sem trocar branch nem alterar carregadores, componentes ou assets para fazer a auditoria passar. Preservar os testes existentes e a exigência de um build recém-produzido na validação final.
2. **Definir o grafo auditado.** Para cada chunk de bandeira, percorrer todos os imports locais alcançáveis no bundle ESM: importações estáticas, importações de efeito colateral, reexports (`export ... from` e `export * from`) e imports dinâmicos com especificador literal. Imports dinâmicos entram no grafo potencial de dependências, mesmo sem execução imediata.
3. **Extrair arestas com parser, não com busca textual de imports.** Usar a API de AST de `typescript`, que já é dependência direta de desenvolvimento (`package.json:L948`), com parsing de JavaScript e visita recursiva a `ImportDeclaration`, `ExportDeclaration` e chamadas de `import()`. Suportar aspas simples/duplas e template literal sem interpolação; ignorar comentários e strings que apenas imitem sintaxe de import. Reportar erro de parsing em vez de aprovar uma inspeção incompleta. Não depender incidentalmente de um parser instalado somente como dependência transitiva.
4. **Resolver com limites explícitos.** Resolver cada caminho relativo a partir do diretório do módulo importador, preservando o contexto de subdiretórios. Normalizar caminhos e, para acesso ao arquivo, retirar query/fragmento de especificadores locais. Validar existência e contenção na raiz do bundle, inclusive após resolução de symlinks. Imports de pacotes externos não serão percorridos: o contrato é o grafo local emitido em `dist/`, coerente com `vite.config.ts:L46-52`. Não executar nenhum chunk durante a inspeção. Import local ausente, caminho fora da raiz, sintaxe inválida ou `import()` não literal devem falhar explicitamente, indicando que a auditoria não conseguiu concluir o grafo.
5. **Percorrer o fecho transitivo.** Implementar DFS/BFS com conjunto de visitados por caminho normalizado, evitando ciclos e releituras dentro da análise. Retornar os módulos alcançados e a cadeia de predecessores para diagnóstico. Reutilização de análise entre raízes não pode reaproveitar o conjunto de visitados de forma que esconda violações de outra bandeira. Evitar cache global que sobreviva à mutação de fixtures.
6. **Integrar ao contrato das nove bandeiras.** Manter uma lista explícita de marcas e prefixos físicos, incluindo `discover`/`card-discovery-`, e resolver os chunks atuais sem congelar hashes. Verificar existência inequívoca do chunk de cada marca, falhando também em ausência/ambiguidade. Partindo de cada raiz, rejeitar alcance de qualquer arquivo pertencente ao conjunto de chunks das outras oito marcas, mesmo a profundidades maiores que dois. Manter a checagem textual legada contra referências a outras marcas e aplicá-la aos conteúdos visitados como proteção complementar; ela não substitui as arestas reais do parser. A falha deve trazer marca de origem, destino proibido e cadeia completa, por exemplo `card-visa-<hash>.js → intermediario.js → card-mastercard-<hash>.js`.
7. **Preservar as demais garantias.** Exigir `<svg` no chunk da própria bandeira e manter os limites atuais por chunk: bruto < 15 KB, gzip < 6 KB e Brotli < 5 KB. Não transformar esses limites em orçamento cumulativo do grafo. Não retirar a checagem do entry principal, o inventário de assets, a segurança SVG nem os cenários de cache.
8. **Criar fixtures e regressões permanentes.** Gerar diretórios temporários exclusivos dentro de uma área descartável/ignorada da própria worktree, com criação e limpeza controladas por teste. A auditoria recebe a raiz explicitamente; as fixtures não devem modificar o `dist/` real nem interferir em testes paralelos. Usar o mesmo caminho de análise/asserção integrado ao teste do bundle, não uma implementação paralela que possa passar enquanto a integração continua rasa.
9. **Fechar o lote.** Implementar todo o bloco de utilitário, integração e testes antes de executar testes, tipos ou build. Em seguida, executar o lote de validação abaixo; diagnosticar falhas, corrigir em lote e revalidar apenas o que as correções afetarem. Não fazer commit, push, merge, publicação ou atualização de dependências nesta autorização de planejamento.

## Testes de regressão e validação em lote

### Matriz automatizada obrigatória

| Cenário | Resultado esperado após a implementação |
| --- | --- |
| Nove chunks válidos e independentes | Aprovar todas as raízes |
| Uma raiz importa módulo compartilhado sem outras bandeiras | Aprovar, sem impor ausência absoluta de imports |
| Referência direta de Visa a Mastercard | Rejeitar com origem/destino identificados |
| Visa → intermediário → Mastercard por import estático | Rejeitar; regressão principal da issue |
| Visa → dois ou mais intermediários → Mastercard | Rejeitar; impedir correção limitada a um nível |
| Visa → intermediário por `import()` literal → Mastercard | Rejeitar como dependência potencial |
| Intermediário usa `export ... from`, `export * from` ou import de efeito colateral | Rejeitar alcance da outra bandeira em todas essas sintaxes |
| Ciclo A → B → A sem bandeira estrangeira | Encerrar e aprovar, sem recursão infinita |
| Ciclo com saída para outra bandeira | Encerrar e rejeitar, preservando a cadeia de diagnóstico |
| Duas raízes chegam ao mesmo intermediário | Inspecionar ambas corretamente, sem contaminação do conjunto de visitados |
| Caminhos `./`, `../`, subdiretórios, query/fragmento e módulos `.mjs` locais | Resolver os arquivos corretamente dentro da raiz |
| Comentário/string contendo texto `import('./modulo.js')` | Não criar aresta inexistente; testar extração separadamente da checagem textual legada |
| Pacote externo | Não acessar `node_modules`; manter grafo limitado aos artefatos locais |
| Import local inexistente, escape da raiz, symlink externo, JavaScript inválido ou import dinâmico não literal | Rejeitar auditoria incompleta com diagnóstico explícito |
| Marca sem chunk ou com mais de um candidato; nomes com hashes diferentes | Falhar nos casos ambíguos/ausentes e aceitar hashes variáveis |
| Nome canônico `discover` com arquivo `card-discovery-*` | Aplicar as mesmas regras sem perder a marca por divergência de nomenclatura |

Preservar e executar os testes já existentes de aliases, promessas, Data URIs e cache em `tests/helpers/creditCardAssets.test.ts:L20-183`, além das verificações atuais de assets. As fixtures negativas devem usar `expect(...).toThrow(...)` ou asserções equivalentes: a suíte corrigida fica verde porque reconhece e rejeita a contaminação deliberada.

### Lote de fechamento da implementação

Executar a partir da worktree, depois de concluir o bloco inteiro:

```bash
npm run type-check:test
npx eslint tests/helpers/bundleDependencyGraph.ts tests/assets/bundleDependencyGraph.test.ts tests/assets/creditCardAssetsOptimization.test.ts
npm run build
npx vitest run tests/assets/bundleDependencyGraph.test.ts tests/assets/creditCardAssetsOptimization.test.ts tests/helpers/creditCardAssets.test.ts
```

`npm run build` já executa `vue-tsc`; não repetir `npm run type-check` sem mudança ou falha que justifique. O build deve preceder a auditoria de `dist/`. A validação focada acima não é equivalente ao gate de release. Se a entrega for usada em pré-release, executar `npm run verify` como gate agregado no lugar de repetir isoladamente suas etapas sobre a mesma revisão.

**Limite desta etapa:** somente o experimento filtrado de mutação foi executado. Build real, suíte completa, tipos, lint, cobertura, browser, benchmarks e consumidores não foram executados e permanecem validações da implementação, não resultados já obtidos.

## Banco de dados

Nenhuma migration. Não há persistência ou contrato de banco de dados envolvido.

## Riscos de quebra e Não-Regressão

- **Nenhuma mudança de API pública prevista.** O utilitário deve ficar em `tests/`, fora dos entry points e do bundle publicado. Não adicionar parser ao runtime ou novas dependências de produção.
- **Falsa confiança por cobertura parcial:** não basta uma função de extração correta se o teste real não usa o fecho transitivo. As regressões negativas precisam percorrer a mesma integração/asserção da auditoria.
- **Falsos positivos por módulos compartilhados, comentários ou strings:** admitir compartilhamento sem outra bandeira; construir arestas via AST e testar os casos benignos. Preservar a proteção textual existente sem confundi-la com resolução de imports.
- **Falsos negativos por sintaxe alternativa:** cobrir import estático/dinâmico, efeito colateral, reexports, profundidade arbitrária e o nome físico `discovery`. Imports não resolvíveis não podem ser silenciosamente ignorados.
- **Loop ou omissão por cache:** testar ciclos, múltiplas raízes e fixtures modificadas; manter estado de visita por análise e não preservar conteúdo obsoleto entre cenários.
- **Dependência de artefato antigo ou seleção arbitrária por hash:** construir antes da auditoria, exigir chunks presentes/inequívocos e não fixar nomes completos de build.
- **Expansão indevida de orçamento:** manter a medição individual dos chunks, separada da descoberta do grafo, sem diminuir cobertura de segurança/SVGO/cache para acomodar a mudança.
- **Acesso fora da área auditada e interferência entre testes:** validar caminhos reais; fixtures isoladas e limpeza somente de arquivos próprios; nenhuma importação executada pelo auditor.
- **Mudança futura do bundler:** uma sintaxe nova não suportada deve produzir falha diagnóstica, não aprovação automática. Ajustar o extrator com fixture correspondente antes de relaxar qualquer regra.

## Validação

Comprovação conclusiva da correção exige conjuntamente:

1. O comando focado do lote termina com exit code 0 sobre um build real recém-produzido.
2. As fixtures reproduzindo as duas mutações indiretas que sobreviveram nesta análise são rejeitadas pelo mesmo auditor utilizado na integração; a mensagem identifica a cadeia até a outra bandeira.
3. Controles benignos, dependências compartilhadas e ciclos válidos continuam aprovados; o controle direto continua rejeitado.
4. Os testes originais de SVG, tamanho, entry principal, aliases e cache continuam passando, assim como tipos de teste e ESLint dos arquivos afetados.

Não considerar suficiente renomear o teste para remover a palavra “transitivo”, repetir somente o teste de cache ou fazer asserções sobre a primeira aresta sem alcançar o restante do grafo.

## Skills Aplicáveis

- `vitest-skill`: fixtures, parametrização e asserções negativas da auditoria.
- `javascript-testing-patterns`: isolamento dos cenários, controles positivos/negativos e cobertura de integração sem duplicar o algoritmo.
- `test-driven-development`: especificar regressões que distinguem o detector atual do corrigido e preservar evidência da mutação sobrevivente; executar as validações em lote conforme as diretrizes canônicas do projeto.
- `code-review`: revisar a cobertura real do fecho transitivo, diagnósticos, limites de acesso e preservação dos contratos antes de integração.
- `technical-documentation-best-practices`: manter evidências, comandos e limites da validação documentados com fidelidade ao código.

Nenhuma skill citada apenas como exemplo no relato foi presumida instalada. Não há necessidade de alterar UI, estilos ou stores nesta correção de testes.
