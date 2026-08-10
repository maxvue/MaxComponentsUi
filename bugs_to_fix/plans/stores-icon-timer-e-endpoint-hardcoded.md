# useIcon.Store: timer de reset nunca é limpo e o endpoint de ícones está hardcoded

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/stores/useIcon.Store.ts:62-72`, `src/stores/useIcon.Store.ts:82`, `src/stores/useIcon.Store.ts:108`
- **Domínio:** stores-barrel

## Problema

Dois defeitos independentes no mesmo bloco, ambos relacionados a recursos não controlados pela store.

**1. `fetchResetTimer` nunca é cancelado (`:62-72`).**

```ts
let fetchResetTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleFetchErrorReset = () => {
    if (fetchResetTimer !== null) return;
    fetchResetTimer = setTimeout(() => { fetchResetTimer = null; errors.value['fetch'] = 0; }, FETCH_RETRY_RESET_DELAY);
};
```

O timer de 30 s é criado, mas não há `clearTimeout` em lugar algum do arquivo, nem hook de `$dispose`/`onScopeDispose`. Em produção com uma store singleton isso é inofensivo (o timer resolve sozinho). Em **testes**, porém, cada `setActivePinia(createPinia())` cria uma nova instância da store e o timer da instância anterior continua vivo, segurando uma referência ao `errors` ref daquela instância e podendo disparar durante um caso de teste posterior — fonte clássica de flakiness com `vi.useFakeTimers()`. O mesmo vale para o `watchDebounced` de `:74-115`, que não é vinculado a um escopo descartável.

**2. Endpoint hardcoded (`:82` e repetido em `:108`).**

```ts
fetch(`https://engeapp.com.br/api/icons?${params.toString()}`, { ... })
```

A URL absoluta do engeapp está embutida na biblioteca, e ainda **duplicada** na mensagem de erro do `catch` (`:108`), onde a mesma string é remontada. Isso contradiz o princípio adotado no resto das stores do shell — `useLogin.Store`, `useUser.Store`, `useListMenus.Store` e `useSystem.Store` todas resolvem suas rotas via `getMaxAppConfig()`, e o `useSystem.Store.ts:42-46` documenta explicitamente a preocupação de nunca embutir origem. `src/helpers/maxAppConfig.ts` já centraliza sete rotas configuráveis; `routeIcons` não é uma delas.

Consequências: (a) qualquer aplicação consumidora que não seja o engeapp depende de um domínio de terceiro para renderizar ícones; (b) ambientes offline/air-gapped ou de teste não conseguem redirecionar o endpoint; (c) o cross-origin é fixo, sem possibilidade de usar um proxy do próprio backend.

Note ainda em `:85` que a resposta é consumida com `.then((res) => res.json())` **sem checar `res.ok`**: uma resposta 500 com corpo HTML cai no `.catch` por erro de parse de JSON (contando como falha de rede, o que por acaso funciona), mas uma resposta 404 com corpo JSON válido `{}` seria tratada como sucesso, zerando `errors.fetch` em `:103` e incrementando o contador por ícone de todos os ícones pedidos — acelerando o banimento descrito no achado `stores-icon-errors-por-icone-nunca-resetam.md`.

## Impacto

- Testes da store de ícones sujeitos a interferência entre casos por timers órfãos.
- A biblioteca, que se propõe genérica e está em migração para independência do PrimeVue, carrega uma dependência de rede fixa no domínio `engeapp.com.br` — impedindo uso real por qualquer outro consumidor e criando um ponto único de falha externo.
- Respostas HTTP de erro com JSON válido são interpretadas como sucesso.

## Plano de correção

1. Adicionar `routeIcons` (ou `iconsUrl`) ao `MaxAppConfig` em `src/types/app.ts` e ao `DEFAULT_CONFIG` de `src/helpers/maxAppConfig.ts`, mantendo `https://engeapp.com.br/api/icons` como valor padrão para não quebrar consumidores atuais.
2. Em `useIcon.Store.ts`, construir a URL uma única vez numa variável local e reusá-la tanto no `fetch` (`:82`) quanto na mensagem de erro (`:108`), eliminando a duplicação.
3. Checar `res.ok` antes de `res.json()` e tratar `!res.ok` como falha de fetch (incrementando `errors.fetch`), não como resposta válida.
4. Guardar o timer e o watcher num escopo descartável: registrar `onScopeDispose(() => { if (fetchResetTimer) clearTimeout(fetchResetTimer); })` dentro do setup da store, e garantir que `watchDebounced` seja parado junto.

## Verificação

- Teste que configura `configureMaxApp({ routeIcons: 'https://exemplo.test/icons' })` e assevera que o `fetch` mockado foi chamado com esse host.
- Teste com `fetch` resolvendo `{ ok: false, status: 500 }` → `errors.fetch` incrementa e `icons_data` não é populado.
- Teste que instancia a store, dispara o agendamento do reset, descarta a pinia e avança os fake timers além de 30 s sem que nenhum callback dispare.

```bash
npx vitest run tests/stores/
npm run type-check
```
