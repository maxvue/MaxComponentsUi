# 18 ocorrências de `any` na superfície de tipos pública, contrariando a regra de no-any do projeto

- **Categoria:** melhoria
- **Severidade:** média
- **Arquivo(s):** `src/types/index.ts:44,47,49,71,97,103,201,219,231`, `src/types/app.ts:63,82,89`, `src/types/listbox.ts:24,40`, `src/helpers/useInputValidation.ts:18,20`, `src/helpers/getCached.ts:1`, `src/helpers/setCached.ts:1`
- **Domínio:** helpers-composables

## Problema

Varredura completa do escopo (`grep -n ": any\|any\[\]\|<any>"`) encontra 18 ocorrências. Elas se dividem em três grupos com tratamentos distintos:

**Grupo A — index signatures deliberadas e justificadas.** `src/types/app.ts:63` (`MaxAppUser`), `:82` (`SideMenuDetails`), `:89` (`SideMenuItem`) e `src/types/listbox.ts:24` (`ListBoxOption`). Estas têm justificativa escrita no próprio arquivo (`app.ts:52-56`: *"cada aplicação consumidora tem seu próprio modelo de usuário... O shell só precisa de `id`"*). Aqui `any` deveria ser `unknown`: mantém a extensibilidade, mas obriga o consumidor a narrowing antes de usar, sem perder nada.

**Grupo B — `any` sem justificativa, em callbacks públicos.** Estes apagam a checagem de tipos no ponto exato onde ela mais vale:

```ts
// src/types/index.ts:71
action?: (data: { event: any; data?: any }) => void;
// :97 e :103
action?: ((event?: any) => void) | undefined;
// :219
action?: (data: { row: any; field: string; value: any }) => void;
```

`event` nas linhas 71, 97 e 103 é um evento DOM — deveria ser `MouseEvent` ou `Event`, tipos que a lib já usa corretamente em `ComponentEmits` (`src/types/index.ts:148`: `click: [event: MouseEvent]`). A inconsistência dentro do mesmo arquivo mostra que `MouseEvent` era viável.

**Grupo C — `any` em helpers, coberto por planos próprios.** `useInputValidation.ts:18,20`; `getCached.ts:1`; `setCached.ts:1`.

Também nesse grupo: `src/types/index.ts:201` (`options?: any[]`) e `src/types/listbox.ts:40` (`items: any[]`) — ambos poderiam ser genéricos ou `unknown[]`, e `options` em particular tem um tipo pronto na mesma casa (`SelectItem`, `index.ts:151`).

O `CLAUDE.md` do projeto direciona a skill `typescript-best-practices`, cuja regra declarada é *"strict no-any"*. Há divergência entre a norma documentada e o código.

## Impacto

O consumidor perde autocomplete e verificação em callbacks que são o principal ponto de extensão da lib (`action` de coluna de tabela, de botão de confirmação, de item). Um erro de nome de campo em `data.row.nome_errado` só aparece em runtime.

## Plano de correção

1. Grupo A: trocar `any` por `unknown` nas quatro index signatures. É a mudança de maior retorno e menor risco — nenhum código interno lê essas chaves.
2. Grupo B: tipar `event` como `MouseEvent` (linhas 71, 97, 103) e `Event` onde o gatilho não for necessariamente mouse; tipar `row` (linha 219) via genérico no `MaxTableColumn<TRow = Record<string, unknown>>`.
3. `options?: any[]` (linha 201) → `SelectItem[]`, reaproveitando o tipo já definido na linha 151; `items: any[]` (listbox.ts:40) → `ListBoxOption[]` ou genérico.
4. `data`/`params`/`query` (linhas 44, 47, 49) e `blob` (231) → `unknown` ou `Record<string, unknown>` conforme o uso real; verificar os componentes consumidores antes.
5. Executar em etapas, rodando `npm run type-check` a cada grupo — a mudança para `unknown` tende a revelar acessos não verificados nos componentes.

## Verificação

- Testes a criar/ajustar: os testes de componentes existentes servem de regressão; nenhum teste novo é estritamente necessário, mas a suíte completa deve passar sem alteração.
- Comandos: `npm run type-check`, `npm run test`, `npm run lint`
