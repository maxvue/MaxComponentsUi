# Plano de implementação — classificar e enxugar dependências de runtime

## Objetivo e resultado esperado

Transformar `package.json` em uma fonte de verdade: pacote importado pela biblioteca fica em `dependencies`; ferramenta de desenvolvimento fica em `devDependencies`; integração exigida do host fica em `peerDependencies` (opcional quando aplicável); item sem uso nem contrato é removido. A execução deve reduzir a instalação direta sem alterar os três entry points publicados nem os componentes.

## Escopo e fora de escopo

### Escopo

- Auditar individualmente `quill`, `oxc-parser`, `@tiptap/pm`, os seis `@vue/*` declarados diretamente e `@maxvue/max-pinia`.
- Remover dependências sem import ou contrato comprovado.
- Reclassificar a integração opcional com `@maxvue/max-pinia` sem caminho local `file:`.
- Documentar a política e criar uma verificação automatizada contra nova deriva.
- Regenerar e medir uma instalação limpa após o achado P0 do lockfile.
- Validar pacote empacotado, entry points e componentes ligados aos candidatos.

### Fora de escopo

- Remover dependências que possuem imports reais, como Tiptap, Monaco, Chart.js, Axios, DOMPurify, DotLottie ou TanStack Virtual.
- Alterar comportamento ou API dos componentes.
- Otimizar o tamanho de `dist/index.es.js`; os bare imports já são externalizados por `vite.config.ts`.
- Atualizar versões em massa ou resolver advisories não relacionados.
- Reparar isoladamente o lockfile corrompido; essa pré-condição pertence a `docs/optimize-new/testes_estabilidade/lockfile_irreproduzivel_e_audit_indisponivel`.

## Classificação a validar

| Candidato | Ação proposta | Condição de confirmação |
| --- | --- | --- |
| `quill` | remover | nenhuma referência no fonte, declarações ou tarball; `quill:folder-open` continua tratado apenas como nome de ícone |
| `oxc-parser` | remover da raiz | nenhum script/configuração o importa; a cópia transitiva do UnoCSS pertence ao próprio tooling |
| `@tiptap/pm` | remover a declaração direta | nenhum `.d.ts` publicado o referencia e os pacotes Tiptap testados já resolvem sua versão compatível |
| `@vue/compiler-core`, `@vue/compiler-dom`, `@vue/compiler-sfc` | remover de `dependencies` | build limpo resolve os compiladores pelas ferramentas que os declaram |
| `@vue/reactivity`, `@vue/runtime-core`, `@vue/runtime-dom` | remover de `dependencies` | nenhum import direto ou tipo público exige os subpacotes; `vue` permanece peer/dev dependency |
| `@maxvue/max-pinia` | mover para peer opcional com faixa publicada válida | integração é consumida pelo host e documentada, mas a biblioteca não importa o pacote |

Cada alteração deve ser testada separadamente. Se um contrato oculto for demonstrado, manter/reclassificar somente aquele candidato e registrar a evidência; não restaurar o conjunto em bloco.

## Arquivos a alterar ou criar

- `package.json`: aplicar classificações, declarar `peerDependenciesMeta` para a integração opcional e adicionar comandos de verificação.
- `package-lock.json`: regenerar apenas depois de corrigida sua reprodutibilidade, refletindo exatamente o manifesto final.
- `README.md`: explicar a integração opcional com MaxPinia e apontar a política de dependências.
- `docs/DEPENDENCIES.md` (novo): registrar categorias, justificativas contratuais e processo de auditoria.
- `tests/architecture/runtimeDependencies.test.ts` (novo): falhar quando uma dependência de produção não tiver import direto ou exceção contratual documentada.
- `scripts/verify-package-consumer.mjs` (novo): validar o tarball em projeto consumidor temporário e os entry points `.`, `./preset` e `./resolver`.

## Dependências e ordem

1. Concluir o plano de `lockfile_irreproduzivel_e_audit_indisponivel` e obter `npm ci` funcional em clone/worktree limpo.
2. Registrar baseline de árvore, bytes e tempo de instalação.
3. Aplicar e validar os candidatos um a um, começando por `quill` e `oxc-parser`.
4. Validar Tiptap e subpacotes Vue por build/tarball antes de removê-los diretamente.
5. Reclassificar MaxPinia e documentar o contrato opcional.
6. Regenerar o lockfile uma única vez com o manifesto final.
7. Adicionar guardrail arquitetural e smoke test do consumidor.
8. Executar validação completa e comparar com o baseline.

## Passos detalhados

1. Em ambiente limpo e runtime Node/npm fixados pelo projeto, salvar `npm ls --all`, `npm explain` de cada candidato, tamanho de `node_modules`, tamanho do lockfile e duração de `npm ci`.
2. Remover `quill`; gerar pacote e testar os componentes de upload para provar que `quill:folder-open` continua sendo somente um identificador Iconify.
3. Remover a declaração raiz de `oxc-parser`; confirmar via `npm explain oxc-parser` que qualquer cópia restante vem exclusivamente do tooling UnoCSS.
4. Remover `@tiptap/pm` somente após verificar que `dist/**/*.d.ts` e o tarball não expõem imports desse nome; montar `MaxInputMarkdown` no projeto consumidor para detectar resolução transitiva quebrada.
5. Remover os seis `@vue/*` diretos, preservando `vue` em `peerDependencies` e `devDependencies`; executar type-check e build em instalação limpa, sem depender do `node_modules` anterior.
6. Substituir `@maxvue/max-pinia: file:../MaxPinia` por peer opcional usando uma faixa semver publicada e compatível. Documentar que a biblioteca funciona sem o plugin e quais stores ganham comportamento adicional quando o host o instala.
7. Criar `docs/DEPENDENCIES.md` com uma tabela das dependências de runtime, seus imports/componentes e as exceções contratuais. Vincular o documento na seção de desenvolvimento do README.
8. Criar teste arquitetural que:
   - derive o nome do pacote a partir de imports estáticos e dinâmicos em `src`;
   - compare-os às chaves de `dependencies`;
   - aceite somente exceções declaradas em uma lista pequena, com justificativa;
   - reporte dependência órfã e import sem declaração direta.
9. Criar smoke test que execute `npm pack`, instale o tarball em diretório temporário e importe os três caminhos exportados. Incluir montagem mínima de Markdown, preset e resolver, e testar com e sem o peer opcional MaxPinia.
10. Regenerar `package-lock.json` no ambiente limpo; verificar que não há caminhos externos à raiz nem entradas diretas removidas.

## Migração e compatibilidade

- Não há mudança de API JavaScript, props, emits ou CSS.
- Dependências realmente importadas pelo runtime permanecem em `dependencies`.
- `vue`, `pinia` e `vue-router` conservam seus contratos peer atuais.
- MaxPinia deixa de ser instalado por caminho local e passa a ser uma integração opcional explícita; consumidores que a utilizam devem declará-la diretamente.
- O teste com tarball deve ser feito antes da publicação. Caso qualquer `.d.ts` exponha um candidato, ele deve permanecer como dependência/peer apropriada em vez de ser removido.
- A regeneração do lockfile deve ocorrer no mesmo runtime adotado pelo plano P0 para evitar novo ruído de versões.

## Testes e medições

### Unitários e arquitetura

- Testar o classificador de imports com import estático, `import()`, subpath e pacote scoped.
- Afirmar que toda chave de `dependencies` possui uso direto e que toda exceção está documentada.
- Afirmar que `quill` e a cópia raiz de `oxc-parser` não reaparecem.

### Integração e estabilidade

- Executar testes focados de `MaxInputMarkdown`, `MaxInputFileUpload`, `MaxInputFileUploadBig`, `MaxInputCode`, `MaxChart`, stores e preset.
- Executar o smoke test do tarball para `.`, `./preset` e `./resolver`, com instalação limpa.
- Executar `npm ci`, `npm ls --depth=0`, `npm audit --omit=dev`, `npm run type-check`, `npm test` e `npm run build`.

### Acessibilidade

Não há alteração visual ou interativa. Não criar teste a11y novo; manter verdes os testes dos componentes afetados para comprovar que a limpeza não removeu renderização, labels ou estados existentes.

### Benchmark de instalação

- Medir antes/depois em cache npm frio e quente, com três execuções por cenário.
- Registrar mediana de tempo do `npm ci`, bytes de `node_modules`, bytes do tarball e tamanho do `package-lock.json`.
- Atribuir impacto por candidato usando alterações sequenciais; não atribuir economia a pacotes que continuam transitivos.

## Critérios mensuráveis de aceite

- `quill` não aparece em `package.json`, lockfile nem `npm ls quill`.
- Não existe cópia raiz de `oxc-parser`; eventual cópia transitiva aponta somente para seu proprietário no tooling.
- Nenhuma dependência de produção fica sem import direto ou justificativa documentada validada pelo teste arquitetural.
- `package.json` não contém dependência `file:` destinada ao pacote publicado.
- `npm ci`, `npm ls --depth=0` e o smoke test do tarball terminam com código 0 em ambiente limpo.
- Os três entry points publicados importam corretamente e os testes focados permanecem verdes.
- A comparação antes/depois registra valores e metodologia; a instalação final não pode crescer em bytes nem adicionar pacotes diretos sem justificativa.
- Type-check, suíte completa e build passam.

## Riscos e rollback

- **Dependência transitiva era parte de um tipo público:** detectar no tarball e restaurá-la na categoria correta antes de publicar.
- **Peer opcional do MaxPinia usa faixa incorreta:** validar contra a versão publicada e testar host com/sem plugin.
- **Teste de imports gera falso positivo em SFC:** cobrir sintaxes do repositório e manter exceção explícita somente quando houver contrato verificável.
- **Medição contaminada por cache:** separar resultados frio/quente e usar medianas.
- **Lockfile volta a conter caminhos locais:** bloquear a mudança se `npm ci` ou a busca por caminhos externos falhar.

O rollback consiste em restaurar individualmente apenas o candidato que falhar no consumidor empacotado e regenerar o lockfile no mesmo ambiente. Como não há mudança de dados persistidos, não existe migração reversa.

## Validação final

1. Revisar o diff de manifesto, lockfile e documentação contra a matriz aprovada.
2. Confirmar que o teste arquitetural não contém exceções sem justificativa.
3. Rodar instalação limpa, auditoria, testes focados, suíte completa, type-check e build.
4. Inspecionar o conteúdo de `npm pack --dry-run` e executar o consumidor temporário.
5. Anexar à implementação a tabela antes/depois e as decisões finais por candidato.
