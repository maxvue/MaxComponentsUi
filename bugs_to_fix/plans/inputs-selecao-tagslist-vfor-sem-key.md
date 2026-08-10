# `v-for` sem `:key` no MaxTagsList e no MaxInputFileProject

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTagsList.vue:3`, `src/components/MaxInputFileProject.vue:26`
- **Domínio:** inputs-selecao-arquivo

## Problema

Dois `v-for` do domínio renderizam listas mutáveis sem `:key`:

`MaxTagsList.vue:3`
```vue
<div v-for="item in items_array" >
    <MaxTagSelect flex :modelValue="item.value" ... @update:modelValue="(val: any) => replaceItem(item, val)" >
```

`MaxInputFileProject.vue:26`
```vue
<div v-for="button in props.buttons">
    <MaxButton i="hugeicons:ai-file" label="Preencher" :action="button.action" :data="button" />
</div>
```

Sem `:key`, o Vue usa a estratégia de patch "in-place" — reaproveita o nó DOM da posição, apenas atualizando os props. Para o `MaxTagsList` isso é concretamente problemático porque a lista é **mutável em três caminhos**:

- `removeItem` (linhas 72-76) filtra um item do meio da lista;
- `replaceItem` (linhas 62-70) substitui um item numa posição;
- o watcher de `add_tag` (linhas 52-60) acrescenta ao fim.

Quando um item do meio é removido, todos os `MaxTagSelect` seguintes deslizam uma posição e são reaproveitados com dados diferentes. O `MaxTagSelect` mantém **estado interno próprio** — `temp_value` (linha 128), `optionsField` (linha 134) e `loading` (linha 133), sincronizados por watchers e não por reconstrução. Reaproveitar a instância significa que esse estado interno pode não corresponder ao item que agora ocupa a posição, produzindo tags exibindo o valor errado após uma remoção.

O `@update:modelValue="(val) => replaceItem(item, val)"` agrava: o closure captura `item` por referência, e `replaceItem` identifica o alvo por identidade de objeto (`i === item`, linha 67). Se a instância do componente for reaproveitada mas o closure for recriado, a correspondência entre a instância visual e o objeto capturado fica dependente da ordem de patch.

Note o contraste com o resto do arquivo e do domínio, onde o `:key` é feito corretamente: `MaxInputFileProject.vue:15` (`:key="file.id"`), `MaxInputFileUpload.vue:67` (`:key="file.id || index"`), `MaxListBox.vue:41` (`:key="optionKey(entry.item, entry.index)"`, com função dedicada para o caso).

Isso também viola a regra `vue/require-v-for-key` do ESLint — vale verificar por que a regra não está pegando esses dois casos.

## Impacto

Tags exibindo valores incorretos após remoção de um item do meio da lista, e potencial perda/embaralhamento de estado interno dos `MaxTagSelect`. É um bug de renderização difícil de diagnosticar, porque só se manifesta em sequências específicas de remoção/substituição e parece "aleatório" para quem reporta.

## Plano de correção

1. Em `MaxTagsList.vue:3`, adicionar uma chave estável baseada no valor da tag: `:key="item.value ?? item"`. Como `replaceItem` já garante ausência de duplicatas (linha 66) e o watcher de adição também (linha 54), `item.value` é único na lista — é uma chave legítima, não um paliativo.
2. Em `MaxInputFileProject.vue:26`, adicionar `:key` ao `v-for` de `props.buttons` — como `MaxButtonsType` pode não ter identificador natural, usar o índice é aceitável aqui (lista estática de configuração, sem reordenação), mas preferir um campo do próprio botão se existir (`button.action` ou um `label`).
3. Investigar por que o ESLint não sinalizou: verificar se `vue/require-v-for-key` está ativa na configuração flat do projeto e, se não estiver, habilitá-la — é uma regra que previne exatamente esta classe de bug em todo o repositório.

## Verificação

- Novo teste em `tests/components/MaxTagsList.test.ts`: montar com três tags, remover a **do meio** e asserir que as duas restantes exibem os valores corretos (hoje o reaproveitamento in-place pode embaralhar).
- Teste de sequência: remover do meio e em seguida substituir a primeira, verificando que o model final contém exatamente os valores esperados.
- `npm run lint` deve passar (e, após habilitar a regra, apontar quaisquer outros `v-for` sem key no repositório).
- `npx vitest run tests/components/MaxTagsList.test.ts tests/components/MaxInputFileProject.test.ts`.
