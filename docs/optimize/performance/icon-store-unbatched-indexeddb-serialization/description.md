# Serialização Concorrente Não Debounced de Todo o IndexedDB no useIconStore

## Categoria
Otimização de SVGs / Armazenamento e I/O / Serialização Excessiva

## Severidade
Média-Alta

## Componentes Envolvidos
- [useIcon.Store.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/stores/useIcon.Store.ts#L173-L219)

## Descrição do Problema
Na store global de ícones `useIconStore.ts`, quando uma requisição em lote falha ou quando múltiplos ícones não são encontrados no backend principal, o fluxo de fallback resolve os SVGs individuais via `fetchIconFallback`:

```typescript
// useIcon.Store.ts L173-L188
if (missing_icons.length > 0) await Promise.all(missing_icons.map(async (icon_name) => {
    const fallbackSvg = await fetchIconFallback(icon_name);
    if (fallbackSvg) {
        icons_data.value[icon_name] = fallbackSvg;
        delete errors.value[icon_name];
        saveCache(); // <-- CHAMADO PARA CADA ÍCONE DO FALLBACK
        syncIconToBackend(icon_name, fallbackSvg);
        return;
    }
    ...
}));
```

O mesmo padrão se repete no bloco `catch`:

```typescript
// useIcon.Store.ts L195-L203
Promise.all(icons_to_fetch.map(async (icon_name) => {
    const fallbackSvg = await fetchIconFallback(icon_name);
    if (fallbackSvg) {
        icons_data.value[icon_name] = fallbackSvg;
        delete errors.value[icon_name];
        saveCache(); // <-- CHAMADO PARA CADA ÍCONE DO FALLBACK NO CATCH
        syncIconToBackend(icon_name, fallbackSvg);
    }
}));
```

E o método `saveCache()` serializa e salva a **base inteira de ícones** no IndexedDB:

```typescript
// useIcon.Store.ts L209-L219
const saveCache = () => {
    try {
        const cache_data: Record<string, string> = {};
        for (const [key, value] of Object.entries(icons_data.value)) {
            if (value && value !== 'waiting') cache_data[key] = value as string;
        }

        if (size(cache_data) > 0) saveIconsToIDB(cache_data);
    } catch {
        // Ignora silenciosamente qualquer erro de storage
    }
};
```

## Causa Raiz
1. Cada chamada a `saveCache()` itera **todas as chaves** do dicionário de ícones em memória (`Object.entries(icons_data.value)`), aloca um novo objeto `cache_data`, filtra valores e chama `saveIconsToIDB(cache_data)`.
2. O `saveIconsToIDB` abre uma transação de escrita no IndexedDB e reescreve ou grava os registros.
3. Quando múltiplos ícones (por exemplo, 10 ou 20 ícones) entram no fallback em paralelo via `Promise.all(missing_icons.map(...))`, a função `saveCache()` é executada **20 vezes consecutivas**.
4. Não há nenhum debounce, fila ou agrupamento no salvamento do IndexedDB.

## Impacto na Performance
- **Contenção no IndexedDB**: Múltiplas transações de gravação são abertas concorrentemente contra o banco local do navegador.
- **Serialização Redundante em Massa**: Se o usuário já tiver 400 ícones em cache, processar 15 fallbacks significa iterar $15 \times 400 = 6.000$ propriedades de objetos e disparar 15 gravações em lote no disco no intervalo de poucos segundos.
- **Congestionamento da Thread Principal e I/O**: O loop de serialização e despacho para workers do IndexedDB bloqueia tarefas prioritárias da interface durante o carregamento inicial da página.

## Solução Recomendada
Substituir a invocação imediata de `saveCache()` por uma versão debounced (ou salvar uma única vez após a resolução do `Promise.all`):

```typescript
// 1. Debounce no salvamento em disco
import { useDebounceFn } from '@maxvue/max-use';

const debouncedSaveCache = useDebounceFn(() => {
    saveCache();
}, 300);

// 2. No fluxo de fallback, usar debouncedSaveCache ou aguardar todo o lote:
if (missing_icons.length > 0) {
    await Promise.all(missing_icons.map(async (icon_name) => {
        const fallbackSvg = await fetchIconFallback(icon_name);
        if (fallbackSvg) {
            icons_data.value[icon_name] = fallbackSvg;
            delete errors.value[icon_name];
            syncIconToBackend(icon_name, fallbackSvg);
        }
    }));
    // Salva o lote completo uma única vez no IndexedDB:
    saveCache();
}
```
Isso consolida todas as alterações em uma única transação eficiente no IndexedDB.
