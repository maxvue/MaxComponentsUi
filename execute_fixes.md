# Plano de execução das correções — execute_fixes

Baseado nos 40 achados em [`implementations/`](implementations/). Cada etapa é autocontida, com critério de verificação. Executar **na ordem** — etapas posteriores dependem das anteriores (ex.: testes verdes antes de refatorar).

**Regra geral (CLAUDE.md):** toda execução por agente que modifique código deve rodar em git worktree separado (`git worktree add ../MaxComponentsUi-wt-<slug> -b <slug>`), validar lá e só então integrar. Após qualquer mudança em `src/components/`, rodar `npx tsx src/scripts/generateResolver.ts` se componentes foram adicionados/removidos.

**Verificação padrão de cada etapa:** `npm run type-check && npm run lint && npm run test`.

---

## Etapa 1 — Restaurar o processo de migração (achados 01, 17)
1. `git checkout 8746a182^ -- migration_plans/` — restaura os 33 planos.
2. Adicionar `MaxUserSection` (dependência direta: TieredMenu) e `MaxButtonConfirm`/`MaxIconConfirm` (transitivos via MaxButton + v-tooltip) ao `status-primevue.migration.yaml` **e** à fila do `migration_executor.md`; criar `migration_plans/MaxUserSection.md`.
3. **Verificar:** links da fila do executor resolvem; YAML e fila com a mesma contagem.

## Etapa 2 — Consertar o MaxTabs (achados 02, 34)
1. Em `MaxTabs.vue`, prover o contexto tipado de `tabsContext.ts` (mantendo `'tabs_info'` legado para `MaxTabItem`).
2. Ligar (ou remover) `should_render` em `MaxTabPanel.vue`; remover imports mortos em `MaxTabItem.vue`.
3. `npm run lint` para os arrow-parens de `MaxUserSection.test.ts`.
4. **Verificar:** `npx vitest run tests/components/MaxTabs.test.ts` → 0 falhas; `npx eslint .` → 0 erros; suíte completa verde (649/649). **Suíte verde é pré-requisito das etapas seguintes.**

## Etapa 3 — Remover código órfão de app consumidor (achados 03, 04, 14)
1. Deletar `src/components/MaxApp.vue`, `src/stores/useApp.Store.ts`, `src/stores/useLogin.Store.ts` (e as exclusões correspondentes no tsconfig).
2. Exportar `MaxTableColumn` e `MaxTogglePopover` em `src/index.ts`; fazer `generateResolver.ts` respeitar exclusões; regenerar o manifesto.
3. **Verificar:** diff programático manifesto × exports do index vazio; build ok.

## Etapa 4 — Corrigir empacotamento (achados 05, 13, 28, 29, 38)
1. Export `./stores`: adicionar entrada `stores` no `vite.config.ts` **ou** remover o export do package.json (decidir com base em consumidores existentes).
2. Corrigir types do `./resolver` → `./dist/helpers/MaxComponentsUiResolver.d.ts`.
3. Limpar deps: remover duplicatas primevue/@primeuix das devDeps, remover `@tanstack/vue-virtual`, mover `vite-plugin-css-injected-by-js` para devDeps, peer `vue` → `^3.5.0`.
4. Script `release`: guardar por branch main + rodar type-check/test antes.
5. Revisar export `./dist/components/*.vue` (achado 38).
6. **Verificar:** `npm run build` e inspecionar `dist/` (stores.es.js presente se mantido o export; types resolvem via `npx are-the-types-wrong` ou checagem manual).

## Etapa 5 — Segurança e robustez do icon pipeline (achados 06, 07, 08)
1. Adicionar sanitização (DOMPurify perfil SVG) antes de renderizar e cachear SVGs; validar `<svg` sem `on*`/`<script>`.
2. try/catch no `JSON.parse` do localStorage com remoção da chave corrompida; versionar o cache.
3. Tirar a mutação `'waiting'` do computed (action + watchEffect); reset de `errors.fetch` com backoff.
4. Trocar `v-html` por `v-text`/slots nos labels de `MaxInputSelect`/`MaxTagSelect`.
5. **Verificar:** testes novos cobrindo storage corrompido, fetch falhando e payload SVG malicioso.

## Etapa 6 — Bugs de regra de negócio nos inputs (achados 10, 11, 12, 18, 21)
1. CpfCnpj: emitir sempre no watch; gate 11/14 só no `complete`; consolidar os dois validadores.
2. Lat: token `/[0-5-]/`, reset de `negative`, emitir número; corrigir `error` para vazio não-obrigatório.
3. Lng: remover `done = true` para vazio+required.
4. CreditCard: corrigir ordem/prefixos de bandeiras (ou delegar a card-validator).
5. **Verificar:** testes unitários novos para cada caso (apagar documento, latitude 4.x, campo vazio, cartões Diners/Discover/Hipercard reais).

## Etapa 7 — Reatividade e leaks (achados 19, 20, 24, 25, 26, 35, 36)
1. Purificar computeds (CpfCnpj, PhoneMail → watch).
2. PhoneMail: remover `$` da máscara, revisar classes de token, emitir desmascarado.
3. MaxModal: `defineExpose({ show: open, hide: close })`; `useId()`.
4. Popovers/Confirms: composables VueUse no setup, não em handlers; posição em computed reativo.
5. ConfirmStore: action `confirm(payload)` que reseta campos e sempre abre no alvo; remover `count_loadeds` e props mortas do MaxButtonConfirm.
6. MaxInputSearch: clearTimeout no unmount + emitir clear; itens do achado 36 (CEP, Select, credit-card echo, TextArea, Toast, Logo, z-index).
7. **Verificar:** suíte verde + teste manual no playground (`npm run dev:playground`) de popover/modal/confirm.

## Etapa 8 — presetMaxUno (achados 15, 30)
1. Remover o espaço do regex `color-*`.
2. Validar unidades em min/max-w/h; restringir a regra flex `[sw]-` ao prefixo `s-`; documentar/remover `pw-`/`mh-`.
3. **Verificar:** testes de snapshot do preset (gerar CSS de `color-blue-500`, `min-w-50%`, `w-100`) + inspeção visual no playground. **Atenção:** `w-100` mudar de flex para width é breaking — auditar usos nos apps consumidores antes.

## Etapa 9 — Resolver e aliases (achados 16, 27)
1. Validar nomes contra a lista real de exports do `prime/index.ts` antes de retornar `from: .../prime`; instanciar `PrimeVueResolver` uma vez.
2. Denylist de colisões (`ColorPicker`, `Popover`, família Tabs/Drawer/Accordion) ou documentação explícita da precedência.
3. **Verificar:** teste unitário do resolver cobrindo `FloatLabel` (deve falhar/avisar), `ColorPicker` (comportamento decidido) e `MaxTableColumn`.

## Etapa 10 — Fundação estrutural pré-migração (achados 22, 23, 37, 39, 40)
1. Criar `useMirroredModel` (ou adotar `defineModel`) e `useInputValidation`; migrar primeiro os componentes já tocados nas etapas 6–7.
2. InputBase: `id` + `<label :for>` + `aria-invalid`/`aria-describedby`/`aria-live`.
3. Extrair `ConfirmProps`/`InputBaseProps` compartilhadas; corrigir docstrings.
4. Decidir Checkbox/Radio/Toggle: envolver em InputBase ou documentar exceção; unificar Switch/Toggle.
5. **Verificar:** suíte verde; axe/teste de a11y básico no InputBase.

## Etapa 11 — Qualidade de testes (achados 31, 32, 33)
1. Testes para os 16 componentes sem cobertura (prioridade: MaxButtonConfirm, família credit-card, MaxTagSelect/MaxTagsList).
2. Fortalecer os testes só-de-montagem com asserts de v-model/DOM.
3. Endurecer `tests/setup.ts` (warning em CSS var desconhecida; testes de erro de fetch/IDB).
4. **Verificar:** `npm run test:coverage` sem regressão; nenhum arquivo com apenas `exists()`.

## Etapa 12 — Documentação e retomada da migração
1. Atualizar CLAUDE.md (stores reais, exceções de convenção decididas na etapa 10).
2. Itens do achado 38 restantes (tom 950 do MaxStyle, decisão de fallthrough do MaxInputText, `base/` no gerador).
3. Retomar a migração PrimeVue pelo `migration_executor.md` — próximo item `waiting` de menor número — agora com os composables da etapa 10 disponíveis.

---

## Resumo de dependências

```
E1 (processo) ─┐
E2 (testes verdes) ──► E3..E9 (correções) ──► E10 (fundação) ──► E11 (testes) ──► E12 (docs + migração)
```

Etapas 3–9 são majoritariamente independentes entre si e podem rodar em worktrees paralelos, desde que a Etapa 2 esteja concluída (suíte verde como baseline).
