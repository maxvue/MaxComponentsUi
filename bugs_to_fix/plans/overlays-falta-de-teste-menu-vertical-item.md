# Falta de teste: `MaxMenuVerticalItem` não tem nenhum teste próprio nem indireto

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxMenuVerticalItem.vue:37-43`, `tests/components/MaxSideMenu.test.ts`
- **Domínio:** overlays-navegacao

## Problema

Não existe `tests/components/MaxMenuVerticalItem.test.ts`. Verificação:

```
ls tests/components/MaxMenuVerticalItem.test.ts  →  não existe
grep -rln "MaxMenuVerticalItem" tests/           →  tests/components/MaxSideMenu.test.ts
```

O componente só aparece indiretamente, montado como filho do `MaxSideMenu`. Isso deixa sem cobertura direta a lógica própria do componente:

**1. `isActive` (linha 39)** — a comparação central que define o item destacado:
```
const isActive = (item: SideMenuItem): boolean => snakeCase(item.details.page_component ?? '') === system.page;
```
Casos não testados:
- `page_component` correspondendo à rota atual (caminho positivo);
- `page_component` divergente;
- `page_component` `undefined`/`null` → `snakeCase('')` comparado a `system.page`; se `system.page` for `''` (estado inicial), **todos** os itens sem `page_component` seriam marcados como ativos simultaneamente — um bug plausível que nenhum teste protege;
- `page_component` em camelCase/PascalCase, validando a normalização por `snakeCase`.

**2. `clearSearch` (linhas 41-43)** — instancia a store dentro da função (`useSearchBarStore().input_value = ''`) a cada clique, em vez de no `setup`. Não há teste verificando que o clique limpa a busca.

**3. Renderização por item:**
- `:key="item.id ?? index"` (linha 4) — fallback de chave quando não há `id`;
- `v-tooltip.right="item.details.tooltip"` (linha 5);
- `:route="item.details.route?.trim() ?? null"` (linha 10) — o `.trim()` sugere que rotas com espaços já causaram problema, e não há teste que o fixe;
- a prop `textCenter` (linhas 31-33) é **declarada mas nunca usada** em nenhum ponto do template ou do estilo — prop morta que um teste teria evidenciado.

## Impacto

O componente que renderiza cada item da navegação principal, e que decide qual item aparece como ativo, não tem teste dedicado. Regressões em `isActive` (a lógica mais frágil, por depender de normalização de string entre duas fontes) passariam despercebidas, deixando o menu sem indicação de página atual ou com múltiplos itens destacados.

## Plano de correção

1. Criar `tests/components/MaxMenuVerticalItem.test.ts` seguindo o padrão de `tests/components/MaxSideMenu.test.ts` (mesma configuração de Pinia e mocks de store).
2. Cobrir `isActive` com os quatro casos listados acima, incluindo explicitamente o cenário de `page_component` ausente com `system.page` vazio — e, se ele de fato marcar todos como ativos, abrir um achado de bug separado ou corrigir com um guard (`if (! item.details.page_component) return false;`).
3. Cobrir `clearSearch`: clicar num item e afirmar que `useSearchBarStore().input_value === ''`. Aproveitar para mover a instanciação da store para o escopo do `setup`, evitando a chamada repetida por clique.
4. Cobrir a renderização: `key` de fallback, `route` com espaços sendo trimada, tooltip aplicada.
5. Decidir o destino da prop `textCenter` (linhas 31-33): implementá-la ou removê-la da API pública.

## Verificação

- `npx vitest run tests/components/MaxMenuVerticalItem.test.ts`
- `npm run test:coverage` — `MaxMenuVerticalItem.vue` deve passar a figurar no relatório com cobertura acima de 90% de statements e funções.
- `grep -n "textCenter" src/ tests/` para confirmar o destino da prop.
