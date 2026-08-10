# `docs/STORES.md` documenta um subpath de import inexistente e a chave de cache errada

- **Categoria:** documentação
- **Severidade:** alta
- **Arquivo(s):** `docs/STORES.md:3-7`, `docs/STORES.md:46`, `package.json:8-25`, `src/stores/useIcon.Store.ts:9`
- **Domínio:** docs-qualidade-testes

## Problema

### 1. O subpath `@maxvue/max-components-ui/stores` não existe

O `docs/STORES.md:3-7` abre com:

> Stores reativas exportadas por `@maxvue/max-components-ui/stores`.
>
> ```typescript
> import { useIconStore, usePopoverStore } from '@maxvue/max-components-ui/stores'
> ```

E repete o mesmo import em cada seção de store (`useIconStore`, `usePopoverStore`, etc.).

Mas o `package.json:8-25` declara **exatamente quatro** entradas em `exports`:

```json
"exports": {
    ".":         { ... "./dist/index.es.js" },
    "./preset":  { ... "./dist/preset.es.js" },
    "./resolver":{ ... "./dist/resolver.es.js" },
    "./prime":   { ... "./dist/prime.es.js" }
}
```

Não há `./stores` (`grep -n "stores" package.json` retorna vazio). Como o campo `exports`
do Node é **restritivo** — ele bloqueia qualquer subpath não declarado —, o import
documentado falha em tempo de resolução com `ERR_PACKAGE_PATH_NOT_EXPORTED` em toda
aplicação consumidora.

O caminho que de fato funciona é o entry point principal (`.`), já que `src/index.ts`
reexporta o barrel das stores. Ironicamente, o próprio `docs/STORES.md:9` reconhece isso
em uma nota, mas apenas para duas stores:

> As stores `useModalStore` e `useConfirmStore` são usadas internamente [...] mas também podem ser importadas diretamente do entry point principal.

A nota está certa quanto ao mecanismo, mas invertida quanto ao alcance: o entry point
principal é o **único** caminho válido, para **todas** as stores — não uma alternativa
para duas delas.

### 2. Chave do `localStorage` desatualizada

`docs/STORES.md:46`, na seção "Funcionamento interno" do `useIconStore`:

> 3. Os resultados são salvos em `icons_data` e persistidos no `localStorage` com a chave `all_icons`

O código real (`src/stores/useIcon.Store.ts:9`) usa:

```ts
const CACHE_KEY = 'all_icons_v2';
```

A documentação está uma versão de schema atrás. Os testes confirmam a chave real em
`tests/stores/useIcon.Store.test.ts:37,85,152,162` e
`tests/stores/useIconStore.cache-sanitize.test.ts:22`.

### 3. Cobertura parcial das stores

O `docs/STORES.md` documenta um subconjunto das **12** stores exportadas pelo barrel
`src/stores/index.ts:1-12`. Isso se soma à divergência já registrada em
`bugs_to_fix/plans/stores-claudemd-cinco-stores-divergencia.md` (que trata da afirmação
"Cinco stores" no `CLAUDE.md:84`): o mesmo desalinhamento se repete aqui, com números
diferentes.

## Impacto

- **Todo exemplo de import do documento está quebrado.** Quem copiar qualquer bloco de
  código do `docs/STORES.md` recebe erro de resolução de módulo. É o exemplo principal,
  repetido em cada seção — não um detalhe de rodapé.
- **Diagnóstico difícil:** `ERR_PACKAGE_PATH_NOT_EXPORTED` aponta para o `package.json`,
  não para a documentação, e o desenvolvedor tende a suspeitar da própria configuração de
  build antes de desconfiar do doc oficial.
- **Chave de cache errada induz a bug:** alguém que precise limpar ou inspecionar o cache
  de ícones vai operar sobre `all_icons`, uma chave que não existe, e concluir
  erroneamente que o cache está vazio ou que a limpeza funcionou.
- **Ambiguidade de decisão de produto:** não está claro se `./stores` deveria existir
  (documentação adiantada a uma feature nunca entregue) ou se o doc está errado. O
  `bugs_to_fix/plans/` já registra, em `execute_fixes.md`, uma etapa sobre justamente
  essa entrada de export — sinal de que a ambiguidade é conhecida e não resolvida.

## Plano de correção

1. **Decidir entre criar o subpath ou corrigir o doc.**
   - *Opção A (criar):* adicionar a entrada `"./stores"` ao `exports` do `package.json`
     **e** a entrada correspondente no `vite.config.ts` para gerar `dist/stores.es.js` —
     as duas coisas, já que declarar o export sem gerar o bundle produz um 404 em runtime.
   - *Opção B (corrigir o doc, mais simples):* trocar todos os imports do
     `docs/STORES.md` para `@maxvue/max-components-ui` e remover a nota das linhas 9-10,
     que deixa de fazer sentido.
   Recomendação: **Opção B**, salvo se houver consumidor real dependendo do subpath — o
   que deve ser verificado antes.
2. **Corrigir a chave de cache** no `docs/STORES.md:46`: `all_icons` → `all_icons_v2`.
   Considerar referenciar a constante (`CACHE_KEY` em `src/stores/useIcon.Store.ts:9`)
   em vez de repetir o literal, para que a próxima mudança de versão não recrie a
   divergência.
3. **Completar o inventário de stores** do `docs/STORES.md` para as 12 exportadas pelo
   barrel, ou declarar explicitamente no topo quais são públicas e quais são internas —
   alinhando com a correção do `CLAUDE.md:84` tratada no plano de stores já existente.
4. **Validar os demais exemplos do documento** (`usePopoverStore`, `useToastStore`,
   `useModalStore`, `useConfirmStore`): conferir nomes de métodos e propriedades contra
   os fontes, já que o documento demonstrou estar defasado em dois pontos independentes.

## Verificação

- Em um projeto consumidor limpo, o import exato do `docs/STORES.md:6` resolve sem erro
  (após a Opção A) **ou** o documento não contém mais nenhuma ocorrência de
  `max-components-ui/stores` (após a Opção B):
  ```bash
  grep -rn "max-components-ui/stores" docs/ README.md COMPONENTS.md
  ```
- `grep -n "all_icons" docs/STORES.md` só retorna `all_icons_v2`, batendo com
  `grep -n "CACHE_KEY" src/stores/useIcon.Store.ts`.
- Toda store listada em `docs/STORES.md` existe em `src/stores/index.ts`, e toda store
  pública do barrel aparece no documento.
- Se a Opção A for escolhida: `npm run build` gera `dist/stores.es.js` e o
  `package.json` aponta para um arquivo que existe.
