# 38 — Achados menores de empacotamento/documentação (agrupado)

**Severidade:** Baixa
**Categoria:** Build / Documentação

## Export `./dist/components/*.vue` só com types (`package.json`)
O subpath export declara apenas `types` (`./dist/components/*.vue.d.ts`) sem condição `import`, e o dist não contém os `.vue` compilados individualmente. Importar `@maxvue/max-components-ui/dist/components/X.vue` falha em runtime. Se a intenção é só dar tipos ao resolver, documentar; caso contrário, remover.

## CLAUDE.md desatualizado sobre stores
CLAUDE.md documenta 3 stores; `src/stores/` tem 7 arquivos. `useConfirm.Store.ts` e `useModal.Store.ts` são compilados mas **não exportados** pelo barrel `index.ts`; `useApp`/`useLogin` são órfãos (achado 04). Decidir se confirm/modal entram no barrel e atualizar o CLAUDE.md.

## MaxStyle sem tom 950 (`src/styles/style.ts:4-67`)
As escalas semânticas definem 50–900, mas o Aura usa 50–950; referências a `{primary.950}` caem no default do Aura (verde-esmeralda), inconsistente com a paleta ciano. Adicionar o tom 950 a cada escala.

## MaxInputText — fallthrough de attrs mudou na migração
Comparado ao plano recuperado do git, a API foi preservada, mas o plano descrevia `v-bind="props"` no `<input>` (fallthrough de attrs como `maxlength`/`autocomplete`); a implementação usa bindings explícitos — attrs extras agora caem no root do InputBase, não no `<input>`. Mesmo padrão deliberado do MaxInputTextArea; se o fallthrough for desejado, adicionar `v-bind="attrs"` filtrado; senão, documentar a decisão.

## generateResolver ignora `src/components/base/`
`MaxBaseInput.vue` fica fora do manifesto (só o nível raiz é lido) — aparentemente intencional (componente interno), mas vale confirmar/documentar.
