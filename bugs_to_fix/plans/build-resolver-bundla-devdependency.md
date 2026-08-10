# `resolver.es.js` embute o `@primevue/auto-import-resolver` porque ele é devDependency

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `vite.config.ts:36-48`, `package.json:79`, `src/helpers/MaxComponentsUiResolver.ts:3`
- **Domínio:** build-config

## Problema

`src/helpers/MaxComponentsUiResolver.ts:3` importa em tempo de execução:

```ts
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
```

Mas `@primevue/auto-import-resolver` está declarado em **`devDependencies`**
(`package.json:79`), não em `dependencies` nem em `peerDependencies`.

A lista de externals do rollup (`vite.config.ts:46-47`) é montada só a partir de
`pkg.dependencies` e `pkg.peerDependencies` — devDependencies não entram. Consequência: o
pacote **não é externalizado** e acaba inlinado no bundle.

Isso é observável no artefato já construído:

```
$ wc -c dist/resolver.es.js
26332 dist/resolver.es.js
$ grep -oE "from\"[^\"]+\"" dist/resolver.es.js
(nenhuma saída — zero imports externos)
```

26 KB sem nenhum import: todo o `PrimeVueResolver`, com sua tabela de nomes de componentes,
foi copiado para dentro do arquivo. Compare com `dist/preset.es.js`, que corretamente
mantém `from"@maxvue/max-use"`, `from"sass"`, `from"node:fs"` etc. como imports externos.

Dois defeitos decorrem disso:

1. **Cópia congelada.** O consumidor que atualizar o `primevue` recebe um resolver com a
   lista de componentes da versão que estava presente no momento do build da lib. Componentes
   novos do PrimeVue não são resolvidos, e o sintoma é um auto-import que falha em silêncio.
2. **Declaração de tipos quebrada.** O `exports["./resolver"].types` aponta para
   `dist/helpers/MaxComponentsUiResolver.d.ts` (`package.json:18`), e esse `.d.ts` continua
   referenciando o tipo importado de `@primevue/auto-import-resolver`. Como o pacote é
   devDependency, ele **não é instalado** na app consumidora — o TypeScript da app não
   consegue resolver o módulo e emite erro de tipos ao usar o resolver.

## Impacto

- `MaxComponentsUiResolver` publicado carrega uma cópia obsoleta e duplicada do resolver do
  PrimeVue.
- Erro de resolução de tipos no `vite.config.ts` de toda app consumidora que use o resolver
  com `typecheck` ativo.
- 26 KB desnecessários no artefato.

## Plano de correção

1. Mover `@primevue/auto-import-resolver` de `devDependencies` para `dependencies` (ele é
   uma dependência de build-time real do consumidor, carregada pelo `vite.config.ts` da app,
   não código de runtime do browser — `dependencies` é o lugar certo; alternativamente
   `peerDependencies` junto com `primevue`, o que é coerente com o achado
   `build-dependencias-deveriam-ser-peer.md`, já que sua versão deve acompanhar a do
   `primevue` da app).

2. Confirmar que, após a mudança, ele passa a ser externalizado automaticamente pelo spread
   de `vite.config.ts:46`.

3. Tornar a lista de externals robusta contra esse tipo de omissão. Em vez de só listar
   dependências conhecidas, externalizar qualquer import bare:

   ```ts
   external: (id) => (
       !id.startsWith('.') &&
       !path.isAbsolute(id) &&
       !id.startsWith('virtual:') &&
       !id.startsWith('\0')
   )
   ```

   Isso elimina a classe inteira do bug — nenhuma dependência mal classificada volta a ser
   inlinada silenciosamente.

## Verificação

- Após o rebuild, `grep -c "@primevue/auto-import-resolver" dist/resolver.es.js` retorna 1
  (o import), e `wc -c dist/resolver.es.js` cai para poucos KB.
- `grep -oE "from\"[^\"]+\"" dist/resolver.es.js` passa a listar o import externo.
- Em uma app consumidora, `import { MaxComponentsUiResolver } from '@maxvue/max-components-ui/resolver'`
  passa no `vue-tsc --noEmit` sem erro de módulo não encontrado.
- Auto-import de um componente PrimeVue recém-adicionado funciona sem rebuild da lib.
