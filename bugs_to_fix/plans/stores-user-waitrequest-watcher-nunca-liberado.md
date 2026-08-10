# useUser.Store: waitRequest() deixa watcher e promise pendentes para sempre se o carregamento falhar

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/stores/useUser.Store.ts:77-91`
- **Domínio:** stores-barrel

## Problema

`waitRequest()` devolve uma promise que só resolve quando o usuário carrega com sucesso:

```ts
function waitRequest(this: any): Promise<void> {
    return new Promise((resolve) => {
        if (this?.status?.server?.get?.is_success) return resolve();

        const unwatch = watch(
            () => this?.status?.server?.get?.is_success,
            (is_success) => {
                if (is_success) { unwatch(); resolve(); }
            }
        );
    });
}
```

Três problemas encadeados, todos no caminho de falha:

1. **Sem timeout.** Se o GET do usuário falhar (401, 500, rede fora), `is_success` nunca vira `true`, a promise **nunca resolve nem rejeita**, e todo `await user.waitRequest()` fica pendente indefinidamente. Como essa função é o gate de inicialização usado por guardas de rota, o efeito é a navegação travar sem erro.
2. **Watcher nunca liberado.** O `unwatch()` só é chamado dentro do `if (is_success)`. No caminho de falha o watcher permanece registrado para sempre, retendo o closure e a promise. Cada chamada a `waitRequest()` que não completa acumula mais um watcher — e como a função pode ser chamada por várias guardas/componentes, o acúmulo é proporcional às tentativas.
3. **Sem escopo.** O `watch` é criado dentro de uma função chamada em tempo arbitrário (não no setup da store), logo **não é vinculado a nenhum effect scope** e não é descartado quando a store ou o componente chamador são desmontados. Nem `$dispose` da store o alcança.

Os testes existentes (`tests/stores/useUser.Store.test.ts:66,73`) cobrem apenas os dois caminhos felizes — "resolve de imediato quando o usuário já carregou" e "aguarda o carregamento concluir". Nenhum exercita a falha, que é onde está o defeito.

Vale notar o contraste com o cuidado tomado em `isImpersonated` (`:60-70`), que só consulta o servidor após confirmar `is_success` — a store demonstra consciência de que o carregamento pode não ocorrer, mas `waitRequest()` não a aplica.

## Impacto

Aplicação travada na inicialização quando o endpoint de usuário falha: a tela de carregamento fica indefinidamente, sem mensagem de erro nem caminho de recuperação, porque quem aguarda o `waitRequest()` nunca é retomado. Combinado com o achado de `useLogin.Store` (submit sem `try/catch`), o app tem dois pontos de travamento permanente no fluxo de autenticação sob condições de rede ruim. Secundariamente, watchers acumulados retêm memória.

## Plano de correção

1. Adicionar rejeição ou resolução por timeout: aceitar um parâmetro opcional (ex.: `waitRequest(timeout = 15000)`) e, ao esgotar, chamar `unwatch()` e **rejeitar** com um erro descritivo (ou resolver com `false`, se o contrato dos chamadores preferir degradar a falhar). A escolha deve seguir o que as guardas de rota consumidoras esperam — verificar antes.
2. Observar também o estado de **falha** do plugin, não só o de sucesso: se o `@maxvue/max-pinia` expõe algo como `status.server.get.is_error`, encerrar a espera assim que ele ficar verdadeiro, em vez de esperar o timeout inteiro.
3. Garantir `unwatch()` em **todos** os caminhos de saída — sucesso, falha e timeout — preferencialmente com uma função de limpeza única chamada antes de cada `resolve`/`reject`, e limpando também o `setTimeout` no caminho de sucesso.
4. Considerar memoizar a promise na store, de modo que N chamadas concorrentes a `waitRequest()` compartilhem um único watcher em vez de criar um por chamada.

## Verificação

Novos casos em `tests/stores/useUser.Store.test.ts` com `vi.useFakeTimers()`:

- `is_success` nunca vira `true` → após avançar além do timeout, a promise liquida (rejeita ou resolve conforme o contrato escolhido) em vez de ficar pendente.
- O watcher é removido nos três caminhos: espiar/contar registros de `watch` e asseverar que nenhum permanece ativo após a liquidação.
- Duas chamadas concorrentes a `waitRequest()` seguidas de sucesso resolvem ambas.
- Os casos existentes `:66` e `:73` continuam verdes.

```bash
npx vitest run tests/stores/useUser.Store.test.ts
```
