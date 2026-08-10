# useIcon.Store: contador de erro por ícone nunca é resetado e o ícone é banido permanentemente

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/stores/useIcon.Store.ts:96-99`, `src/stores/useIcon.Store.ts:66-72`
- **Domínio:** stores-barrel

## Problema

A store mantém dois tipos de contador dentro do mesmo `errors` ref (`:55-57`):

- `errors.fetch` — falhas de rede globais. Tem política de recuperação: ao atingir `MAX_FETCH_RETRIES` (4), `scheduleFetchErrorReset()` (`:66-72`) agenda um reset em 30 s, e qualquer resposta bem-sucedida zera o contador (`:103`).
- `errors[icon_name]` — falhas por ícone individual. **Não tem política de recuperação alguma.**

Em `:96-99`, quando a API responde com sucesso (HTTP OK) mas o payload não traz o ícone pedido:

```ts
errors.value[icon_name] = (errors.value[icon_name] ?? 0) + 1;
console.error('Erro na obtenção do ícone', icon_name);

if (errors.value[icon_name] >= 4) updated_data[icon_name] = '';
```

Ao chegar a 4, o ícone é gravado como string vazia em `icons_data` e, via `saveCache()` (`:106,117`), **persistido no localStorage** sob `all_icons_v2`. A partir daí:

- `getIcon()` (`:19`) encontra `icons_data[icon_name]` truthy? Não — `''` é falsy, então cai em `:20` e remarca como `'waiting'`, reentrando na fila de fetch. Mas `errors[icon_name]` continua `>= 4`, então cada nova tentativa que falhe reescreve `''` imediatamente. O ícone entra em um ciclo `waiting` → fetch → `''` a cada sessão.
- O contador `errors[icon_name]` só existe em memória — mas o valor `''` persiste no cache. Após reload, `getInCache()` (`:45`) preserva explicitamente `''` (`value === '' ? value : sanitizeSvg(value)`), reinstalando o estado degradado.

Ou seja: uma indisponibilidade temporária do endpoint de ícones para um ícone específico (ex.: um ícone recém-adicionado ao Iconify que o backend ainda não indexou) marca esse ícone como permanentemente indisponível, **sem qualquer janela de reset** — diferente do tratamento cuidadoso dado a `errors.fetch`, que ganhou `FETCH_RETRY_RESET_DELAY` justamente para "evitar que uma queda momentânea de rede trave novos ícones pelo resto da sessão" (comentário em `:64-65`).

Note também que o limiar `4` em `:99` está hardcoded, enquanto o limiar equivalente de fetch usa a constante `MAX_FETCH_RETRIES` (`:59`) — os dois valores coincidem hoje por acaso, não por vínculo.

## Impacto

Ícones que falharam temporariamente somem da interface de forma permanente e persistente entre sessões, sem qualquer sinal ao usuário (renderiza vazio). A recuperação exige limpar o localStorage manualmente ou bump da `CACHE_KEY`. Como o `MaxIcon` é usado em praticamente toda a biblioteca, o sintoma aparece como botões e menus sem ícone — visualmente quebrados, mas sem erro que ajude o diagnóstico depois do fato (o `console.error` de `:97` só aparece na sessão em que a falha ocorreu).

## Plano de correção

1. Extrair o limiar hardcoded de `:99` para uma constante nomeada (ex.: `MAX_ICON_RETRIES = 4`), ao lado de `MAX_FETCH_RETRIES`, deixando explícito que são políticas distintas.
2. Dar ao contador por ícone a mesma política de recuperação já aplicada ao fetch: ao marcar um ícone como indisponível, agendar (ou registrar um timestamp) para que `errors[icon_name]` seja zerado após um intervalo, permitindo nova tentativa em vez de banimento definitivo.
3. Não persistir o sentinela de falha. Em `:105-106`, filtrar as entradas `''` antes de `saveCache()`, de modo que o estado degradado não sobreviva ao reload — o cache deve guardar apenas SVGs efetivamente resolvidos. Alternativamente, gravar um marcador com timestamp e expirá-lo em `getInCache()`.
4. Reavaliar se `''` é o sentinela adequado: por ser falsy, ele faz `getIcon()` reentrar em `'waiting'` a cada chamada (`:19-21`), gerando refetch contínuo do ícone banido. Um sentinela dedicado (ex.: `'unavailable'`) permitiria a `getIcon()` retornar cedo sem reenfileirar.

## Verificação

Novo teste em `tests/stores/useIconStore.test.ts` (ou arquivo dedicado) com `vi.useFakeTimers()` e `fetch` mockado:

- Quatro respostas OK sem o ícone pedido → `icons_data[icon]` vira o sentinela de indisponível.
- Após avançar o intervalo de reset, uma nova chamada a `getIcon()` volta a enfileirar o ícone e um `fetch` é disparado.
- Uma resposta bem-sucedida após o reset preenche o SVG normalmente.
- O `localStorage` gravado por `saveCache()` não contém entradas com valor de falha.

```bash
npx vitest run tests/stores/useIconStore.test.ts tests/stores/useIcon.Store.test.ts tests/stores/useIconStore.cache-sanitize.test.ts
```
