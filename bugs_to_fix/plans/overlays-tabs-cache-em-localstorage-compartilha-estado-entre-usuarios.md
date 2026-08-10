# MaxTabs persiste a aba ativa em `localStorage` por padrão (`cached: true`), sem escopo de usuário nem forma prática de desligar por instância

- **Categoria:** melhoria
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxTabs.vue:38`, `src/components/MaxTabs.vue:51-66`
- **Domínio:** overlays-navegacao

## Problema

O `MaxTabs` tem `cached: true` como **default** (linha 38) e persiste a aba selecionada em `localStorage` sob a chave `'max-tab-opened-' + (props.id ?? '')` (linha 53), via `useRefCached`.

Detalhes relevantes:

1. **A chave não tem escopo de usuário nem de sessão.** Em um navegador compartilhado, ou após logout/login de outro usuário na mesma máquina, a aba restaurada é a do usuário anterior. Para abas cujo rótulo já revela informação (ex.: uma aba "Financeiro" ou "Documentos do cliente X"), isso é vazamento leve de contexto entre sessões.

2. **Sem `props.id`, a chave vira `'max-tab-opened-'`** — uma chave **global compartilhada por todas as instâncias** de `MaxTabs` sem `id` na aplicação. Na prática o efeito é mitigado pelo guard `isValid(props.id)` nos dois watchers (linhas 60 e 65), que impede tanto a leitura quanto a escrita quando não há `id`. Ainda assim, o `useRefCached` é **instanciado** com essa chave global na linha 53, registrando um watcher sobre um valor de `localStorage` compartilhado em toda instância sem `id` — desperdício e acoplamento desnecessário.

3. **Não há como limpar o cache.** Nenhum método exposto (`defineExpose`, linha 192, expõe apenas `select` e `navigate`) permite invalidar a aba salva, por exemplo no logout.

4. **`cached: true` por padrão é uma decisão surpreendente.** Persistência em `localStorage` é um efeito colateral observável fora do componente; o default idiomático seria opt-in (`false`).

## Impacto

Baixo, mas real: estado de UI de um usuário reaparece para outro no mesmo navegador, e a aplicação não tem um gancho para limpar essa persistência no logout.

## Plano de correção

1. Só instanciar o `useRefCached` quando `isValid(props.id) && props.cached`, evitando o registro com a chave global vazia (linha 53). Isso pode exigir mover a instanciação para dentro de um `computed`/`watchEffect` guardado, ou usar uma chave `null` que o helper trate como no-op — verificar a API do `useRefCached` em `@maxvue/max-use`.
2. Adicionar uma prop opcional `cacheScope?: string` (ou aceitar que o consumidor componha o `id` com o identificador do usuário) e incorporá-la à chave: `'max-tab-opened-' + scope + '-' + props.id`.
3. Expor um método `clearCache()` via `defineExpose` (linha 192), e documentar seu uso no logout.
4. Avaliar com o time inverter o default de `cached` para `false`. Se a mudança quebrar consumidores, manter `true` mas documentar explicitamente o comportamento e o requisito de `id` no JSDoc da prop (linha 21 da interface `Props`).

## Verificação

- Teste em `tests/components/MaxTabs.test.ts`: montar dois `MaxTabs` **sem** `id`, selecionar abas diferentes em cada e afirmar que nenhuma chave `max-tab-opened-` foi escrita no `localStorage` mockado (`tests/setup.ts` já mocka `localStorage`).
- Teste de escopo: com `cacheScope: 'user-1'` e `cacheScope: 'user-2'` e o mesmo `id`, afirmar que as chaves gravadas são distintas.
- Teste de `clearCache()`: selecionar uma aba, chamar `clearCache()` e afirmar que a chave foi removida.
- `npx vitest run tests/components/MaxTabs.test.ts`
