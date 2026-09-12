# Plano de implementação — modularizar entries e estilos

## Objetivo e resultado esperado

Separar API JavaScript, CSS agregado e componentes em fronteiras que permitam tree-shaking real. Um consumidor deve importar um componente por subpath estável sem reter CSS ou código alheio; o entry raiz continuará disponível, com migração explícita do estilo hoje injetado implicitamente.

## Escopo

- Gerar entries ESM e tipos por componente canônico de `src/components-manifest.json`.
- Publicar subpaths como `@maxvue/max-components-ui/components/MaxButton` e um CSS global opt-in.
- Remover do entry moderno a injeção de `virtual:uno.css` como string JavaScript.
- Manter exports, aliases, `install`, SSR e resolver de auto-import.
- Criar testes de pacote, tree-shaking e orçamento bruto/gzip/Brotli.
- Documentar consumo granular e migração.

## Fora de escopo

- Refatorar regras visuais, tokens ou SCSS dos componentes.
- Otimizar internamente Monaco, Tiptap, Chart ou Maps.
- Remover o entry raiz, aliases ou a função `install`.
- Resolver achados de virtualização ou performance de runtime.
- Restaurar o entry PrimeVue depreciado citado em documentação desatualizada.

## Arquivos a alterar ou criar

- Alterar `src/index.ts`, `vite.config.ts` e `package.json`.
- Alterar `src/scripts/generateResolver.ts` e o artefato gerado `src/helpers/MaxComponentsUiResolver.ts`; não editar o manifesto manualmente.
- Alterar `tests/helpers/resolver.test.ts`, `tests/index.test.ts`, `tests/core/install.test.ts`, `README.md` e `docs/AUTO-IMPORT.md`.
- Criar um entry dedicado de estilos, preferencialmente `src/styles.ts`.
- Criar `scripts/generate-library-entries.mjs` e `scripts/check-package-bundles.mjs`.
- Criar fixtures mínimas em `tests/fixtures/bundle/` e um teste de exports em `tests/architecture/package-exports.test.ts`.

Os nomes dos artefatos em `dist` devem ser confirmados no protótipo antes de fixar `package.json#exports`; caminhos públicos não podem conter hashes.

## Dependências e ordem

1. Registrar o baseline atual em tarball/fixtures.
2. Prototipar o build com um componente folha, um composto e um pesado.
3. Definir a política de compatibilidade do CSS implícito.
4. Implementar entries, estilos e tipos granulares.
5. Atualizar exports, side effects e resolver.
6. Automatizar testes/orçamentos e atualizar documentação.
7. Validar o tarball em aplicações consumidoras limpas.

O manifesto deve continuar sendo a fonte dos componentes públicos. Mudanças paralelas em `src/index.ts`, `vite.config.ts`, `package.json` ou no gerador precisam ser integradas antes da medição final.

## Passos detalhados

1. Criar baseline que construa o pacote em diretório temporário e meça `index.es.js`, CSS, tarball e consumidores de `MaxButton`, `MaxInputText`, `MaxModal`, `MaxTable` e um componente assíncrono. Registrar bruto, gzip, Brotli e módulos retidos.
2. Fazer as fixtures consumirem o tarball pelo mapa `exports`, nunca o source ou um caminho interno de `dist`.
3. Remover `virtual:uno.css` de `src/index.ts` e gerar o CSS global em entry próprio, sem literal injetado no JS moderno.
4. Remover `vite-plugin-css-injected-by-js` ou limitá-lo exclusivamente a um entry legado. Testar ausência de criação de `<style>`/acesso a `document` nos entries modernos.
5. Habilitar CSS code splitting e gerar entries somente para nomes canônicos do manifesto; aliases apontam ao canônico e não criam cópias físicas.
6. Prototipar `MaxButton`, `MaxButtonConfirm` e `MaxInputMarkdown`/`MaxInputCode`. Confirmar CSS próprio/compartilhado, chunks, sourcemaps e SSR. Se um build Vite único não preservar associação estável, usar duas fases: módulos ESM estruturados e estilos.
7. Produzir `.d.ts` alinhados a cada subpath e validar inferência de props/emits em fixture TypeScript.
8. Atualizar `package.json#exports` com condições `types`/`import` para componentes e CSS. Restringir `sideEffects` a CSS e, se adotado, ao entry legado; remover `./dist/index.es.js` dessa lista.
9. Alterar o gerador para o resolver retornar o default export do subpath canônico com o alias solicitado. Confirmar o formato com teste unitário e compilação real do `unplugin-vue-components`.
10. Preservar o conjunto de exports do barrel raiz e comparar suas chaves de runtime antes/depois.
11. Criar gates que rejeitem componentes/seletores alheios no caso mínimo e mostrem baseline, valor, delta e maiores responsáveis.
12. Executar os gates no CI/release após o build e antes da publicação.
13. Documentar CSS global opt-in, imports granulares, auto-import, SSR/CSP e o caminho de compatibilidade.

## Migração e compatibilidade

Injeção de todo o CSS e tree-shaking de CSS são incompatíveis no mesmo entry. Portanto, adotar uma destas opções antes da implementação:

- publicar a extração de CSS em versão major; ou
- manter temporariamente `@maxvue/max-components-ui/legacy` com a injeção antiga e depreciá-lo.

Imports nomeados do entry raiz permanecem válidos. Aplicações modernas importam uma vez `@maxvue/max-components-ui/styles.css` ou o estilo granular definido pelo protótipo. O resolver passa a usar subpaths automaticamente. Não expor hashes, extensões `.vue` ou caminhos internos. Se CSS por componente não for estável, lançar primeiro subpaths JS com CSS global opt-in e não prometer isolamento de CSS granular.

## Testes

### Unitários e contrato

- Um entry por componente canônico, nenhum por alias.
- Todos os aliases convergem ao subpath canônico.
- Cada export público aponta para JS/tipos/CSS existentes.
- O barrel mantém suas chaves atuais.
- `sideEffects` não abrange o JS raiz ou padrões JavaScript amplos.

### Integração

- Instalar o tarball em fixture Vite e importar `MaxButton` por subpath e pelo barrel.
- Compilar auto-import real e confirmar que ele não usa o barrel.
- Executar `tsc --noEmit` sobre todos os caminhos públicos.
- Importar em Node/SSR sem `window`/`document`.
- Confirmar ausência de Monaco, Tiptap, Chart, Maps e CSS alheio no caso mínimo.
- Validar `npm pack --dry-run --json` e os arquivos publicados.

### Acessibilidade e visual

- Comparar cinco componentes representativos entre estilo explícito e legado, em temas claro/escuro.
- Verificar foco, hover, disabled e overlays, inclusive com ordens diferentes de importação.
- Rodar as verificações de acessibilidade existentes; a modularização não pode remover estilos de foco ou estado.

### Benchmark

- Medir bruto, gzip e Brotli com lockfile fixo, separando chunks iniciais e dinâmicos.
- Usar identidade de módulos/seletores como gate determinístico; tempo de rede não entra no CI.
- Versionar o baseline e exigir justificativa para atualização dos tetos.

## Critérios de aceite mensuráveis

- O subpath de `MaxButton` não contém módulos nem seletores exclusivos de componentes não alcançados.
- Seu chunk inicial reduz pelo menos 50% frente aos 477.773 bytes brutos do achado e fica abaixo do orçamento aprovado no protótipo.
- Nenhum entry moderno contém a string agregada de cerca de 431.455 caracteres de CSS ou injeção DOM.
- Cinco fixtures publicam tamanhos bruto/gzip/Brotli e falham ao exceder o teto.
- 100% dos componentes canônicos têm JS e tipos resolvíveis; 100% dos aliases testados convergem ao canônico.
- SSR/Node importa os entries modernos sem acesso a DOM.
- Barrel raiz preserva os exports de runtime existentes.
- Tarball, type-check, smoke tests e comparação visual passam.

## Riscos e rollback

- Extração do CSS pode deixar apps sem estilo: mitigar com major ou entry legado e documentação destacada.
- CSS compartilhado pode duplicar ou mudar a cascata: medir composição e testar ordens de importação.
- Wildcards podem expor internals e `vite-plugin-dts` pode desalinha tipos: validar todos os caminhos a partir do tarball.
- O resolver pode gerar sintaxe inválida: cobrir com build consumidor real.
- Muitos entries podem elevar build e tamanho do pacote: medir tempo, arquivos e duplicação.
- Rollback deve reverter configuração, exports e resolver como uma unidade; nunca publicar subpaths declarados sem artefatos.

## Validação final

1. Executar `npm run type-check`, `npm run test` e `npm run build` limpo.
2. Rodar o verificador de exports/orçamentos e `npm pack --dry-run --json`.
3. Instalar o tarball nas fixtures Vite, TypeScript e Node/SSR.
4. Testar resolver, nomes canônicos e aliases em compilação real.
5. Comparar visualmente os cinco componentes e executar checks de acessibilidade.
6. Executar `git diff --check` e revisar artefatos gerados.
7. Anexar tabela antes/depois de entry raiz, CSS global, fixtures, tarball e quantidade de arquivos.
