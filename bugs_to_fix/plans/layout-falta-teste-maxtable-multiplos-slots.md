# A suíte do MaxTable mascara o bug da coluna de botões com um stub simplista

- **Categoria:** falta-de-teste
- **Severidade:** alta
- **Arquivo(s):** `tests/components/MaxTable.test.ts:70-108`, `src/components/MaxTable.vue:4-13`
- **Domínio:** tabela-layout-exibicao

## Problema

O teste "renderiza o slot 'buttons' e calcula o width" usa um stub de `DataTable` que renderiza **exclusivamente** o slot `buttons`:

```js
DataTable: {
    template: `<div class="p-datatable">
        <slot name="buttons" :data="{}" :index="0" />
    </div>`
}
```

Com um único slot em jogo, o defeito estrutural do componente (a `Column` de botões é emitida uma vez por slot declarado, porque a condição é `slotNames.includes('buttons')` e não `name === 'buttons'`) **não pode se manifestar**. O teste passa e transmite falsa confiança.

Lacunas concretas na suíte (5 testes no total, cobertura de branches em 80%):

1. Nenhum teste com **múltiplos slots** simultâneos (`header` + `footer` + `buttons`), que é onde a duplicação aparece.
2. Nenhum teste com **múltiplas linhas** — o stub de `Column` sempre renderiza uma única linha (`:index="0"`), o que também mascara o problema do template ref dentro do `v-for` (`MaxTable.vue:8`).
3. Nenhum teste verificando que a `Column` de botões é filha direta do `DataTable`, e não conteúdo de outro slot.
4. O `watch` de largura (`MaxTable.vue:33-37`) tem o ramo `if (width.value > 1) return` coberto, mas não o ramo em que `calculated_width` é `0` na primeira emissão.
5. Nenhum teste do repasse de `attrs` ao `DataTable` (ordenação, paginação, filtro — toda a configuração da tabela chega por `v-bind="attrs"`, linha 3, e nada disso é verificado).

## Impacto

- Dois bugs estruturais reais (documentados em `layout-maxtable-coluna-buttons-duplicada-por-slot.md` e `layout-maxtable-ref-el-dentro-de-v-for.md`) convivem com uma suíte verde.
- Qualquer refatoração na migração do PrimeVue não terá rede de segurança para o comportamento de slots.

## Plano de correção

1. Substituir o stub de `DataTable` por um que renderize **todos** os slots recebidos, permitindo observar a emissão múltipla:
   ```js
   DataTable: {
       template: '<div class="p-datatable"><template v-for="(_, n) in $slots"><slot :name="n" :data="{}" :index="0" /></template></div>'
   }
   ```
2. Adicionar teste com `header`, `footer` e `buttons` simultâneos, asserindo **exatamente uma** `Column` de botões.
3. Adicionar stub de `Column` que renderize N linhas, asserindo que a largura converge com múltiplas linhas.
4. Adicionar teste de repasse de attrs (`:value`, `:paginator`, `:rows`, `sortField`) ao `DataTable`.
5. Cobrir o ramo `calculated_width === 0` do watch.

## Verificação

- Os novos testes devem **falhar** contra o código atual (comprovando que capturam os bugs) e passar após as correções dos dois planos relacionados.
- `npx vitest run tests/components/MaxTable.test.ts`.
- `npm run test:coverage` — branches de `MaxTable.vue` acima dos 80% atuais.
