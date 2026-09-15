# IMP-R19 — playground executável

## Registro

- ID da plataforma: `/root/imp_r19`.
- Parent: `/root`.
- Início: 2026-09-15T16:39:00Z.
- Fim: 2026-09-15T16:42:57Z.
- Tarefa: reproduzir e auditar o build/smoke do playground para R19, sem alterar produção ou testes.
- Arquivos alterados por este agente: somente este relatório.

## Veredito

**REJEITADO / bloqueado para aceite.** Há catálogo, loaders lazy e cenários com componentes reais, mas o playground não passa pelo type-check, não possui gate efetivo de warnings ou orçamento de chunks e falha ao montar múltiplas famílias em Chromium.

## Evidências reproduzidas

| Comando / método | Resultado |
| --- | --- |
| `npm run type-check -- --project playground/tsconfig.json` | **Falhou.** Múltiplos cenários omitem props obrigatórias: por exemplo `inputs-rich.vue` (modelValue/editor), `inputs-select.vue` (modelValue/options/route), `inputs-special.vue`, `inputs-tags.vue`, `inputs-toggles.vue`, `media-brand.vue`, `media-loaders.vue`, `nav-side.vue`, `nav-toolbars.vue` e `panels-tabs.vue`. |
| `npx vite build --config playground/vite.config.ts` | Retornou 0, mas emitiu warnings de imports duplicados, configuração Vite com `__dirname` incompatível com o futuro loader nativo e chunk >500 kB. O maior JS foi `dist-DsfaJ0NX.js`: **2.507,44 kB** minificado / **823,12 kB gzip**; não há orçamento configurado ou script que reprove esse resultado. |
| `npx vitest run tests/architecture/playgroundCoverage.test.ts` | Passou: 1 arquivo, 8 testes. É insuficiente como smoke: só checa existência de arquivos/strings e que o catálogo contém IDs; não invoca `SCENARIO_LOADERS`, não monta cenários, não captura warnings nem inspeciona orçamento. |
| Chromium/Playwright, `?family=<família>&theme=dark&width=mobile`, viewport 320×720 | Tema e classe de largura foram aplicados (`html.dark` e `--mobile` presentes), porém o mount gerou erros e warnings. Inputs, buttons, navigation, layout, overlays e media falham com `getActivePinia()` sem Pinia ativa. Buttons também emite warning de `MaxIconButton` sem nome acessível. Panels falha por montar `MaxAccordionItem` fora de `MaxAccordion` e `MaxTabList` fora de `MaxTabs`. Data emite warning de `MaxListBox` sem nome acessível. Só transitions montou sem erro/warning. |

## Causa-raiz observada

1. `playground/src/main.ts` cria a aplicação com router e `MaxComponentsUi`, mas não instala Pinia; componentes de cenários que usam stores falham em runtime.
2. `playground/src/App.vue` instancia o mesmo cenário uma vez para cada item do catálogo. Isto não representa individualmente o componente referido pelo card e permite que cenários com filhos contextuais sejam montados fora de seus provedores.
3. `tests/architecture/playgroundCoverage.test.ts` considera cobertura como a mera existência de `SCENARIO_LOADERS[scenarioId]`, portanto não prova importação/mount nem falha sob os erros acima.
4. `playground/vite.config.ts` não define mecanismo de budget e o build não converte warnings em falha.

## Risco e rollback

O playground pode aparentar cobertura de 100% enquanto cartões comuns exibem cenários quebrados. Não há mudança de produção deste agente; rollback é remover apenas este relatório.

## Próximos passos necessários ao implementador

1. Instalar/configurar a instância Pinia exigida pela biblioteca no bootstrap do playground.
2. Corrigir props obrigatórias e composição de cenários (especialmente filhos de Accordion/Tabs) antes de reativar o type-check.
3. Criar smoke real que percorra todos os loaders, monte cada cenário em light/dark, 320 px e desktop, e transforme console warning/pageerror em falha.
4. Congelar e aplicar orçamento mensurável aos chunks de build, falhando quando excedido.

## Continuação — 2026-09-15

### Correções aplicadas

1. `playground/src/main.ts` agora instala `createPinia()` antes da biblioteca. O `package.json` e lockfile próprios do playground declaram Pinia compatível com o peer de `vue-router`.
2. Os cenários que omitiam contratos obrigatórios receberam props neutras compartilhadas. Assim, App e todos os cenários continuam incluídos no type-check real, que agora passa.
3. `scripts/check-playground-bundle.mjs` mede cada chunk JavaScript no artefato efetivo e reprova acima de **2.600.000 bytes brutos** ou **850.000 bytes gzip**. O comando `npm run build` do playground executa esse gate depois do Vite. Também foi removido o uso de `__dirname` que gerava o aviso de loader nativo futuro.

### Evidências atuais

| Comando / método | Resultado |
| --- | --- |
| `npx vue-tsc -p playground/tsconfig.json --noEmit` | **Passou** (0 erros). |
| `npm run build` em `playground/` | **Passou**. Maior chunk: `dist-DsfaJ0NX.js`, **2.507.440 bytes brutos / 814.514 bytes gzip**, abaixo do budget aplicado. |
| `npx vitest run tests/architecture/playgroundCoverage.test.ts` | **Passou**: 8 testes. |
| Chromium/Playwright, todas as famílias | O erro `getActivePinia()` não ocorreu mais. Inputs, buttons, data, overlays e transitions montaram sem `pageerror`; dark/mobile aplicado no smoke focal. |

### Pendências conhecidas para o aceite integral

O smoke expandido ainda revela problemas preexistentes que precisam ser resolvidos antes de uma política de warnings como erro: nomes acessíveis omitidos nos exemplos de botões, configuração Ziggy ausente em navigation/layout, composição inválida de Accordion/Tabs e um import SVG servido como módulo em media. Portanto, o gate de budget e o type-check estão corrigidos, mas a exigência de **todos** os cenários sem warnings/pageerrors permanece pendente.

### Continuação — correção do smoke focal

Foram corrigidas as causas reproduzidas no Chromium: o bootstrap do playground passa uma configuração Ziggy local e configura a rota de menus usada pelo shell; cada arquivo de cenário é montado uma única vez (em vez de uma vez por cartão do catálogo); os cenários de Accordion e Tabs agora montam seus filhos dentro dos respectivos provedores; e os exemplos de `MaxIconButton` têm nomes acessíveis reais. `MaxTitle1` e `MaxTitle2` passaram a importar seu `MaxIcon`, eliminando o componente não resolvido nos cenários de mídia.

O Vite 8 servia imports dinâmicos `@fs/*.svg?raw` da biblioteca como `image/svg+xml`. O plugin do playground agora devolve esses requests como módulo JavaScript somente no dev server, preservando o conteúdo raw esperado pelo carregador de cartões. O request foi verificado com `Content-Type: application/javascript`.

| Comando / método | Resultado |
| --- | --- |
| `npx vue-tsc -p playground/tsconfig.json --noEmit` | Passou após as alterações. |
| Chromium focal, `buttons` | Passou sem warnings/pageerrors. |
| Chromium focal, `panels` | Passou sem warnings/pageerrors. |
| Chromium focal anterior à última configuração de rota, `navigation`/`layout` | Ainda mostrou falha do cache de menus ao receber rota vazia; foi corrigido substituindo-a pela rota local `playground.menus`. Reexecução integral pendente. |
| Chromium focal anterior ao ajuste de `MaxMaps`, `media` | Não teve mais erro SVG; restavam warnings de `modelValue` inválido, removidos dos exemplos de mapa. Reexecução integral pendente. |

Risco: o endpoint demonstrativo `playground/menus` pode retornar 404 em desenvolvimento, mas evita a exceção Ziggy e os cenários fornecem seus próprios itens. Rollback: remover a configuração local do bootstrap, plugin raw do Vite e os cenários reais alterados.
