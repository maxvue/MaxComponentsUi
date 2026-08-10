# Colisão de nome: `MaxTableColumn` é exportado como componente e como tipo pelo mesmo barrel

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/types/index.ts:181`, `src/index.ts:156`, `src/index.ts:210`
- **Domínio:** helpers-composables

## Problema

O barrel público exporta duas entidades distintas com o mesmo nome:

```ts
// src/index.ts:156
export { default as MaxTableColumn } from './components/MaxTableColumn.vue';
...
// src/index.ts:210
export * from './types';
```

e `src/types/index.ts:181` declara:

```ts
export interface MaxTableColumn {
    header: string;
    field: string;
    ...
}
```

Em TypeScript, um valor (o componente) e um tipo (a interface) podem coexistir no mesmo nome — vivem em namespaces de declaração diferentes, então isso **compila**. Mas o resultado é ambíguo na prática:

1. `import { MaxTableColumn } from '@maxvue/max-components-ui'` traz o componente. `import type { MaxTableColumn } from ...` traz a interface. O consumidor não tem como saber qual obtém sem inspecionar a origem.
2. Auto-import (`unplugin-vue-components`) resolve `MaxTableColumn` pelo manifesto para o componente; um desenvolvedor que queira o tipo e escreva `const cols: MaxTableColumn[] = [...]` recebe o **tipo da instância do componente**, não a interface de coluna — erro de tipo confuso, apontando para propriedades de componente Vue.
3. O JSDoc da interface (linha 179-180) diz *"Definição de uma coluna para o componente **MaxTableFields**"* — ou seja, o tipo pertence conceitualmente a `MaxTableFields`, não a `MaxTableColumn`. O nome está simplesmente errado para o que descreve.

Relevante para a migração em curso: `status-primevue.migration.yaml` trata `MaxTable` → `MaxTableColumn` → `MaxTableFields` como um conjunto que migra junto (conforme `CLAUDE.md`), então este é o momento certo para desambiguar.

## Impacto

Erros de tipo enganosos na app consumidora ao tipar arrays de colunas — a mensagem do TypeScript fala de props de componente Vue, sem nenhuma pista de que existe uma interface homônima. Custo alto de diagnóstico para um problema de nomenclatura.

## Plano de correção

1. Renomear a interface de `MaxTableColumn` para `MaxTableFieldColumn` (ou `TableColumnDef`), alinhando com o JSDoc que já a atribui a `MaxTableFields`.
2. Manter um alias depreciado por um ciclo de release: `/** @deprecated use MaxTableFieldColumn */ export type MaxTableColumn = MaxTableFieldColumn;` — embora o alias reintroduza a colisão, ele dá caminho de migração; avaliar se vale contra removê-lo de imediato.
3. Atualizar os usos internos da interface (`MaxTableFields.vue` e afins) para o novo nome.
4. Registrar a mudança no plano de migração do conjunto MaxTable em `migration_plans/`.

## Verificação

- Testes a criar/ajustar: `tests/components/MaxTableFields.test.ts` (se existir) — garantir que a tipagem das colunas continua compilando com o novo nome.
- Comandos: `npm run type-check`, `npm run build`, `npm run test`, `npm run lint`
