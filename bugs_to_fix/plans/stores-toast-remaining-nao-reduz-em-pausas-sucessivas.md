# useToast.Store: pause/resume repetidos prolongam o toast e a barra de progresso dessincroniza

- **Categoria:** bug
- **Severidade:** baixa
- **Arquivo(s):** `src/stores/useToast.Store.ts:103-122`, `src/stores/useToast.Store.ts:65-69`
- **Domínio:** stores-barrel

## Problema

O par `pause()`/`resume()` reconstrói o tempo restante a partir de `createdAt`, e `resume()` reescreve `createdAt` para compensar o tempo pausado:

```ts
const pause = (id: string): void => {
    ...
    const elapsed = Date.now() - toast.createdAt;
    toast.remaining = Math.max(toast.duration - elapsed, 500);   // :110
    ...
};

const resume = (id: string): void => {
    ...
    toast.createdAt = Date.now() - (toast.duration - toast.remaining);   // :120
    startTimer(toast);
};
```

O clamp `Math.max(..., 500)` em `:110` é intencional e testado (`tests/stores/useToastStore.test.ts:98`), mas ele **entra no cálculo de `createdAt`** em `:120`. Quando o toast já passou de sua duração e o usuário pausa, `remaining` é forçado a 500 ms e o `resume()` recalcula `createdAt` como se restassem 500 ms reais. Um usuário que passe o mouse sobre o toast repetidamente estende a vida dele em 500 ms a cada ciclo, indefinidamente — o toast nunca fecha sozinho enquanto houver hover intermitente.

O comportamento "não fechar enquanto o mouse está em cima" é desejável; "nunca fechar após o mouse sair" não é. Hoje não há distinção entre os dois.

Além disso, o próprio arquivo documenta em `:98-101` uma dessincronia conhecida e **não corrigida**:

> `remaining` é clampado em no mínimo 500ms […]. A barra de progresso visual em `MaxToast.vue`, porém, usa `animationDuration` baseado em `toast.duration` (duração original), não em `remaining` — após pause()/resume() ela fica dessincronizada do tempo real restante.

Ou seja: após qualquer pausa, a barra de progresso mostra um tempo que não corresponde ao timer real. O comentário registra o defeito mas não o resolve.

Detalhe menor de consistência: `add()` (`:74`) usa `payload.duration ?? 4000`, enquanto a documentação da interface `ToastItem` em `:20` afirma *"Duração em ms antes de fechar automaticamente (default: 5000)"*. O default real é 4000; o JSDoc diz 5000. O teste `:20` ("add() cria toast com valores padrão") fixa o comportamento — é o JSDoc que está errado.

## Impacto

Baixo: afeta a experiência de fechamento automático de notificações, não a correção de dados. O sintoma é um toast que teima em não sumir depois de o usuário passar o mouse por ele algumas vezes, e uma barra de progresso que não reflete o tempo restante. Irritante, não danoso.

## Plano de correção

1. Separar o clamp de exibição do clamp de agendamento. Guardar o `remaining` **real** (podendo ser ≤ 0) no estado e aplicar o piso de 500 ms apenas no `startTimer()` (`:65-69`), ao calcular o `ms` do `setTimeout`. Assim `createdAt` em `:120` é recomputado a partir do tempo verdadeiro e pausas sucessivas deixam de acumular vida extra.
2. Expor o `remaining` corrente para o componente e, em `MaxToast.vue`, derivar o `animationDuration` da barra de `remaining` (reiniciando a animação no `resume()`) em vez de `toast.duration`. Remover então o comentário de `:95-102`, que deixa de descrever o comportamento.
3. Corrigir o JSDoc de `:20` de `5000` para `4000`, ou promover `4000` a uma constante nomeada `DEFAULT_TOAST_DURATION` referenciada nos dois lugares.

## Verificação

Novos casos em `tests/stores/useToastStore.test.ts` com `vi.useFakeTimers()`:

- Adicionar toast de 4000 ms, avançar 3900 ms, `pause()`, `resume()`, avançar 200 ms → toast removido (hoje sobreviveria por mais 500 ms a partir do resume).
- Repetir pause/resume cinco vezes após a duração ter expirado → o toast é removido em tempo total limitado, não estendido a cada ciclo.
- Os casos existentes `:98` (clamp mínimo) e `:115` (resume retoma) devem ser reescritos conforme a nova semântica, mantendo a garantia de que o toast não fecha **enquanto** pausado.

```bash
npx vitest run tests/stores/useToastStore.test.ts tests/components/MaxToast.test.ts
```
