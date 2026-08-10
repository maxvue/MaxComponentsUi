# `pinia`, `primevue` e `@primeuix/themes` estão em `dependencies` mas deveriam ser `peerDependencies`

- **Categoria:** build
- **Severidade:** alta
- **Arquivo(s):** `package.json:68`, `package.json:69`, `package.json:50`, `package.json:129-132`
- **Domínio:** build-config

## Problema

Três pacotes que precisam obrigatoriamente ser **instâncias únicas compartilhadas** com a
app consumidora estão declarados como `dependencies` normais:

```json
"@primeuix/themes": "^2.0.3",   // package.json:50
"pinia": "^4.0.2",              // package.json:68
"primevue": "^4.5.5",           // package.json:69
```

E `peerDependencies` lista apenas `vue` e `vue-router` (`package.json:129-132`).

Por que isso é um problema para cada um:

- **`pinia`** — 12 imports em `src/`. As cinco stores da lib (`useIconStore`,
  `usePopoverStore`, `useToastStore`, `useConfirmStore`, `useModalStore`) precisam registrar
  no **mesmo** ativo Pinia que a app consumidora. Se o npm resolver duas cópias de `pinia`
  (o que acontece quando os ranges divergem — a app numa 3.x e a lib pedindo `^4.0.2`), as
  stores da lib registram num `activePinia` diferente do da app, e `usePopoverStore()`
  chamado do lado da app devolve uma instância distinta da que o `MaxPopover` usa. O bug se
  manifesta como popover/modal/toast que "não abre" sem nenhum erro.

- **`primevue`** — 120 imports em `src/`. O `PrimeVue` é instalado como plugin Vue e mantém
  configuração global (locale, tema, `ripple`, `PrimeVueService`). Duas cópias significam
  duas configurações globais concorrentes: a app configura uma, os componentes Max leem a
  outra.

- **`@primeuix/themes`** — o `MaxStyle` (`src/styles/style.ts:2`) usa `definePreset` deste
  pacote, e o preset resultante precisa ser aplicado ao mesmo runtime de tema que o
  `primevue` da app usa. Segue `primevue` por acoplamento direto.

Que estas dependências são compartilhadas, e não privadas, já está implicitamente admitido
no `vite.config.ts:46-47`, onde **todas** as `dependencies` são marcadas como `external` no
rollup — ou seja, o bundle não as inclui e conta com a resolução do consumidor, que é
exatamente a semântica de uma peer dependency, mas sem a garantia de versão que só o campo
`peerDependencies` dá.

O `vitest.config.ts:24` já precisou fazer `dedupe: ['vue', '@vueuse/core', 'pinia']` à mão
para evitar instância dupla nos testes — sintoma do mesmo problema estrutural.

## Impacto

- Bugs de instância dupla silenciosos e difíceis de diagnosticar (stores que não
  compartilham estado, tema/locale do PrimeVue que não se aplica).
- A app consumidora não recebe aviso do npm quando sua versão de `primevue`/`pinia` é
  incompatível com a que a lib espera — porque `dependencies` não gera checagem de peer.
- Duplicação de peso no `node_modules` do consumidor.
- Especialmente relevante dado o esforço de independência do PrimeVue descrito no
  `CLAUDE.md`: enquanto o `primevue` for `dependency`, a versão fica travada pela lib e o
  consumidor não consegue segurar a última versão open source por conta própria.

## Plano de correção

1. Mover os três para `peerDependencies` com ranges amplos e compatíveis com o que hoje é
   testado:

   ```json
   "peerDependencies": {
       "vue": "^3.6.0",
       "vue-router": "^5.2.0",
       "pinia": "^4.0.0",
       "primevue": "^4.5.0",
       "@primeuix/themes": "^2.0.0"
   }
   ```

2. Mantê-los também em `devDependencies` (com as mesmas versões que estavam em
   `dependencies`), para que build, type-check e testes continuem resolvendo localmente.

3. Verificar que o `vite.config.ts:46-47` continua marcando-os como external — como o
   spread hoje usa `Object.keys(pkg.dependencies)` e `Object.keys(pkg.peerDependencies)`,
   mover os pacotes entre os dois campos preserva o comportamento. **Atenção:** as
   `devDependencies` *não* entram nesse spread, então confira o achado
   `build-resolver-bundla-devdependency.md`, que trata de um caso onde essa omissão já
   causa bundling indevido.

4. Declarar os três também como `peerDependenciesMeta` opcionais **apenas** se houver
   caminho de uso da lib sem eles — não é o caso hoje (`primevue` é importado por
   praticamente todo componente), então devem ser peers obrigatórios.

5. Atualizar o README com a instrução de instalação, já que o consumidor passa a precisar
   instalar `primevue`, `pinia` e `@primeuix/themes` explicitamente. Este é um **breaking
   change** de instalação e deve sair num bump major.

## Verificação

- Em uma app consumidora de teste: `npm ls pinia primevue` mostra exatamente uma cópia de
  cada, no topo da árvore.
- Abrir um `MaxModal`/`MaxPopover` a partir de código da app e confirmar que o estado é
  compartilhado com a store importada pela app.
- `npm run build` continua produzindo bundles que não contêm código do `primevue` nem do
  `pinia`: `grep -c "createPinia" dist/index.es.js` deve ser 0.
- Instalar a lib numa app com `primevue@3` e confirmar que o npm agora emite `ERESOLVE`/aviso
  de peer, em vez de instalar silenciosamente uma segunda cópia.
