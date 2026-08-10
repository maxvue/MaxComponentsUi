# Falta de teste: `MaxTopToolbar.handleItemClick` e os ramos do slot `#item` (58,8% stmts / 27,7% branches / 50% functions)

- **Categoria:** falta-de-teste
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxTopToolbar.vue:44-54`, `src/components/MaxTopToolbar.vue:4-25`, `tests/components/MaxTopMenu.test.ts:179-217`
- **Domínio:** overlays-navegacao

## Problema

O `MaxTopToolbar` não tem arquivo de teste próprio; ele é testado dentro de `tests/components/MaxTopMenu.test.ts:179-217`, com apenas quatro casos: "não renderiza sem itens", "não renderiza quando show é falso", "renderiza com itens e show verdadeiro" e "renderiza o slot plus". Todos verificam apenas presença/ausência do contêiner.

O que fica sem cobertura:

**1. `handleItemClick` (linhas 44-54) — nenhum dos três ramos é testado:**
```
const handleItemClick = (item: any): void => {
    if (typeof item?.action === 'function') item.action();
    else if (typeof item?.command === 'function') item.command({ item });
    else if (item?.route || item?.data) toolbar.route(item.data ?? item.props ?? item.query, item.route);
};
```
São três caminhos mutuamente exclusivos mais o caso implícito de "nenhum dos três" (item inerte). Nenhum é exercitado — daí os 50% de funções e 27,7% de branches.

Note que `toolbar.route(...)` é testado indiretamente pelos testes da store (`tests/components/MaxTopMenu.test.ts:219-261`), mas o **despacho** a partir do clique no item não é.

**2. Ramos do slot `#item` (linhas 4-25):**
- `item.divider` → renderiza `.divider-space` (linha 5).
- `hasContent(label)` verdadeiro → renderiza `.menu-item-content` com `MaxIconButton` opcional (`v-if="item.icon"`, linha 7) e `subLabel` opcional (`v-if="item.subLabel"`, linha 10).
- Ramo `v-else` → renderiza um `MaxIconButton` puro com `tooltip`, `route`, `action`, `data` (linhas 13-24).
- Variação de `root` (linha 6, `:class="{ root: root }"` e linha 22).

Nenhum desses ramos é verificado.

**3. `showed` (linha 44):** `attrs.plus === true ? true : toolbar.show`. O teste do slot `plus` (linha 210) verifica o slot, não o efeito de `attrs.plus` sobre `showed`, que é o que permite renderizar a toolbar mesmo com `toolbar.show === false`.

**4. `attrs.plus` como atributo, não prop** (linhas 2, 38, 44) — comportamento não documentado e sem teste que o fixe. Ver `overlays-tipos-any-em-componentes-de-navegacao.md`.

## Impacto

O componente que despacha as ações da barra de ferramentas superior — navegação e comandos de tela — tem metade das funções sem execução em teste. Uma regressão na ordem de precedência entre `action`, `command` e `route` (por exemplo, `command` passando a ganhar de `action`) não seria detectada, e mudaria silenciosamente o comportamento de toda toolbar em produção.

## Plano de correção

1. Criar `tests/components/MaxTopToolbar.test.ts` dedicado (extraindo os quatro casos existentes de `MaxTopMenu.test.ts:179-217` para lá, mantendo em `MaxTopMenu.test.ts` apenas a integração).
2. Cobrir `handleItemClick` com quatro casos:
   - item com `action` → `action` chamada, `command` e `toolbar.route` **não** chamados;
   - item com `command` (sem `action`) → `command` chamada com `{ item }`;
   - item com `route` (sem `action`/`command`) → `toolbar.route` chamada com `(data, route)`;
   - item com `data` mas sem `route` → `toolbar.route` chamada;
   - item sem nada → nenhuma das três chamada, sem exceção.
   - Precedência: item com `action` **e** `command` **e** `route` → apenas `action` executa.
3. Cobrir os ramos do slot `#item`: montar com `items` contendo um divider, um item com label+icon+subLabel, e um item sem label (ramo `v-else`); afirmar os elementos renderizados em cada caso.
4. Cobrir `showed`: montar com `toolbar.show = false` e `plus` como atributo, afirmando que a toolbar renderiza mesmo assim.
5. Aplicar a tipagem de `MaxMenuItem` (ver `overlays-tipos-any-em-componentes-de-navegacao.md`) para que os testes também sirvam de documentação da forma esperada.

## Verificação

- `npx vitest run tests/components/MaxTopToolbar.test.ts`
- `npm run test:coverage` — `MaxTopToolbar.vue` deve sair de 58,8% stmts / 27,7% branches / 50% functions para acima de 90% nas três métricas.
