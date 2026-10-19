# Subpath opcional do MaxUse aponta para arquivo ausente na instalação inspecionada

- Data: 19/10/2026.
- Worktree: `wt-a13d5b54`.
- Pacote observado: `@maxvue/max-use` 1.1.47.
- Escopo: achado separado; não corrigir como parte do reparo de retry de ícones.

## Localização e evidência

`node_modules/@maxvue/max-use/package.json:59–62` declara o import de `@maxvue/max-use/vueuse` como `./dist/core.es.js`. A leitura de `node_modules/@maxvue/max-use/dist/core.es.js` retornou arquivo não encontrado. O destino de tipos `dist/Helpers/VueUse/core.d.ts` existe e reexporta `@vueuse/core`.

## Impacto e limites

Consumidores desse subpath podem falhar na resolução em runtime/build nesta instalação. Não foi tentado import dinâmico, instalação, build ou teste. A evidência não comprova problema no pacote publicado nem falha do entry raiz `@maxvue/max-use`, utilizado pela store de ícones. Não há vínculo demonstrado com o travamento relatado.

## Encaminhamento

Revalidar existência e integridade da instalação antes de consumir esse subpath; diagnosticar empacotamento/instalação em tarefa autorizada separada. Não editar node_modules, mudar versão ou contornar gates de integridade nesta tarefa. Manter os imports atuais pelo entry raiz.
