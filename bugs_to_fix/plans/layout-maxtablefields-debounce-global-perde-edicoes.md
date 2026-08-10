# MaxTableFields descarta emissões de campos por causa de um debounce global de 100ms

- **Categoria:** bug
- **Severidade:** crítica
- **Arquivo(s):** `src/components/MaxTableFields.vue:165`, `src/components/MaxTableFields.vue:168-182`
- **Domínio:** tabela-layout-exibicao

## Problema

```ts
const action_click = refAutoReset(false, 100);

function setFieldValue(row, field, value, col) {
    ...
    target[keys[keys.length - 1]] = value;

    if (action_click.value) return;      // <- descarta
    action_click.value = true;

    col?.action?.({ row, field, value });
    emit('update:field', { row, field, value });
}
```

O guard `action_click` é **um único flag para a tabela inteira**, não por linha nem por campo. Qualquer segunda alteração dentro de uma janela de 100 ms — em **qualquer** linha e **qualquer** coluna — tem seu `col.action` e seu `emit('update:field')` silenciosamente suprimidos.

Casos concretos que quebram:
- Digitação contínua em um `MaxInputText` de célula: teclas em intervalos < 100 ms (velocidade normal de digitação) só emitem o primeiro caractere. A mutação direta em `target` acontece, mas o consumidor que escuta `update:field` (para persistir, validar ou recalcular totais) perde os eventos.
- Cliques rápidos em `+`/`-` do input de incremento (linhas 37/39): o valor local incrementa, mas o app não é notificado.
- Alterações programáticas em lote em várias linhas: só a primeira é notificada.

Não é um debounce correto: não há trailing edge — o último valor **nunca** é reemitido depois da janela.

## Impacto

- Perda silenciosa de eventos de alteração: o estado interno da linha diverge do que o consumidor recebeu.
- Dados não persistidos em formulários de tabela; totais/validações desatualizados.
- Especialmente grave porque a mutação em `target` ainda ocorre — a UI mostra o valor novo enquanto o app acredita no antigo.

## Plano de correção

1. Remover o guard global `action_click` do caminho de `update:field` — a emissão deve ser sempre feita, uma por alteração. O `@update:modelValue` dos inputs já é disparado uma única vez por mudança real.
2. Se o objetivo original era evitar reentrância do `col.action` em cliques repetidos de `incrementValue`/`decrementValue`, aplicar o throttle **apenas** ali e com granularidade por linha+campo (ex.: um `Map<string, number>` com a chave `` `${rowKey}:${field}` ``), nunca à emissão do evento.
3. Se o consumidor precisa de debounce de persistência, isso é responsabilidade dele — documentar em vez de embutir.

## Verificação

- Teste: alterar dois campos distintos em sequência imediata (sem avançar timers) e asserir **duas** emissões de `update:field`.
- Teste: chamar `incrementValue` três vezes seguidas e asserir três emissões com valores 1, 2, 3.
- `npx vitest run tests/components/MaxTableFields.test.ts`.
