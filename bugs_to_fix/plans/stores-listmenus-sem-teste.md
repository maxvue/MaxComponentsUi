# useListMenus.Store sem nenhum teste

- **Categoria:** falta-de-teste
- **Severidade:** baixa
- **Arquivo(s):** `src/stores/useListMenus.Store.ts:21-25` (nenhum teste, direto ou indireto)
- **Domínio:** stores-barrel

## Problema

`useListMenusStore` não tem arquivo de teste e não aparece em nenhum teste de componente (`grep -rn "useListMenusStore" tests/` não retorna nada). É a única das doze stores sem cobertura alguma — as outras duas sem arquivo dedicado (`useSearchBar`, `useTopToolbar`) ao menos são exercitadas por testes de componente.

A store é minúscula, mas tem um contrato não trivial em `:22`:

```ts
const list = useRefCachedApi<ListMenu | null | undefined>(getMaxAppConfig().routeMenus as string);
```

`getMaxAppConfig()` é lido **no momento da instanciação da store**, não de forma reativa. Ou seja: se a aplicação chamar `configureMaxApp({ routeMenus: 'x' })` **depois** de a store ter sido instanciada uma primeira vez, a store já criada continuará apontando para a rota antiga, porque `useRefCachedApi` recebeu uma string, não um getter. O mesmo padrão em `useUserStore` é resolvido de forma diferente e correta: lá as rotas ficam dentro de um `computed` (`src/stores/useUser.Store.ts:35-43`), portanto reagem à reconfiguração.

Não há teste que fixe esse comportamento em nenhuma das duas direções.

## Impacto

Baixo hoje, porque `configureMaxApp()` é documentado como chamada de boot. Mas a inconsistência entre `useListMenusStore` (rota capturada uma vez) e `useUserStore` (rota reativa) não está registrada em lugar algum e é exatamente o tipo de detalhe que quebra em testes que reconfiguram o app entre casos, ou em aplicações que configuram rotas tardiamente.

## Plano de correção

1. Criar `tests/stores/useListMenus.Store.test.ts` mockando `useRefCachedApi` de `@maxvue/max-use` para capturar o argumento recebido:
   - `configureMaxApp({ routeMenus: 'menus.custom' })` antes de instanciar a store → `useRefCachedApi` recebe `'menus.custom'`.
   - Sem configuração (após `resetMaxAppConfig()`) → recebe o default `'menus'`.
   - A store expõe `list` e ele é o valor devolvido pelo mock.
2. Decidir e documentar o comportamento na reconfiguração tardia. Duas opções:
   - **(preferida)** Alinhar com `useUserStore`: verificar se `useRefCachedApi` aceita um getter/`Ref` de rota; se aceitar, passar `() => getMaxAppConfig().routeMenus` e adicionar um teste de reconfiguração.
   - Se não aceitar, manter como está e adicionar um comentário JSDoc no bloco de `:21-24` explicitando que a rota é resolvida uma única vez, na primeira instanciação, e que `configureMaxApp()` deve preceder a montagem do `MaxApp`.

## Verificação

```bash
npx vitest run tests/stores/useListMenus.Store.test.ts
npm run test:coverage
```

Meta: `useListMenus.Store.ts` a 100% (arquivo de 25 linhas, sem branches).
