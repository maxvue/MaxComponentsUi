# Suítes de smoke test com asserções tautológicas (`exists()).toBe(true)`) e nenhum comportamento

- **Categoria:** qualidade-de-teste
- **Severidade:** média
- **Arquivo(s):** `tests/components/IconsAndLoaders.test.ts:10-39`, `tests/components/LayoutComponents.test.ts:41-56`, `tests/components/MaxPageLayout.test.ts:50-57`
- **Domínio:** docs-qualidade-testes

## Problema

Há **254 ocorrências** de `expect(...exists()).toBe(true)` / `toBeTruthy()` em `tests/`
(`grep -rn "exists()).toBe(true)\|exists()).toBeTruthy()" tests/ | wc -l`). Nem toda é
problemática — verificar renderização condicional é legítimo. O problema são os arquivos
onde essa asserção é *a única coisa que existe*, com razão alta em relação ao total de
`expect`:

| Arquivo | `exists()`/total `expect` |
|---|---|
| `tests/components/IconsAndLoaders.test.ts` | 9/11 |
| `tests/components/LayoutComponents.test.ts` | 8/11 |
| `tests/components/MaxPageLayout.test.ts` | 11/17 |
| `tests/components/MaxTopMenu.test.ts` | 11/35 |
| `tests/components/MaxApp.test.ts` | 14/36 |

### Casos concretos verificados

**`IconsAndLoaders.test.ts:10-39`** — quatro `describe` inteiros (`MaxDoneIcon`,
`MaxWaitIcon`, `MaxErrorIcon`, `MaxLoaderIcon`) contêm um único `it` cada, e cada `it`
só afirma que uma `<div>` e um `<svg>` existem:

```ts
it('renderiza SVG de ícone de conclusão', () => {
    const wrapper = mount(MaxDoneIcon);
    expect(wrapper.find('.icon-done-max').exists()).toBe(true);
    expect(wrapper.find('svg').exists()).toBe(true);
});
```

Nada distingue `MaxDoneIcon` de `MaxWaitIcon`: os dois testes são idênticos e ambos
verificam a **mesma** classe `.icon-done-max` (linhas 13 e 21) — um ícone de "espera"
sendo validado pela classe de "concluído". Se os componentes trocassem de conteúdo SVG
entre si, os testes continuariam verdes. O `describe('MaxLoader')` (linhas 41-76) do
mesmo arquivo, em contraste, é adequado: testa `show=false`/`show=true` e o label.

**`LayoutComponents.test.ts:50-55`** — caso explicitamente vazio de sentido:

```ts
it('usa grid com 24 colunas (CSS)', () => {
    const wrapper = mount(MaxGridCols, { slots: { default: '<div>Col</div>' } });
    expect(wrapper.find('.grid-cols').exists()).toBe(true);
});
```

O nome promete verificar **24 colunas**, mas a asserção só confere que o elemento
existe — e é literalmente a mesma asserção do caso anterior (linha 46). O número de
colunas nunca é checado. O `describe('MaxGrid')` (linhas 7-39) do mesmo arquivo, ao
contrário, é bom: testa presença/ausência de label e a classe condicional `label-center`.

**`MaxPageLayout.test.ts:50-57`** — o caso *"compõe container, topo, lateral e conteúdo"*
faz quatro `findComponent(...).exists()`. Verifica só a montagem da árvore; não valida
nenhuma prop repassada, nenhum estado do `useSystemStore` e nenhuma interação.

## Impacto

- **Falsos positivos:** os testes de `MaxWaitIcon`/`MaxErrorIcon`/`MaxLoaderIcon`
  passariam se os SVGs fossem trocados, esvaziados de `<path>` ou renderizados com o
  ícone errado. É exatamente o tipo de regressão visual que ninguém percebe.
- **Cobertura inflada:** esses arquivos contam para a métrica do `test:coverage` sem
  proteger comportamento, mascarando componentes de fato desprotegidos.
- **Nomes de teste enganosos:** *"usa grid com 24 colunas (CSS)"* documenta uma garantia
  que o código do teste não oferece. Quem lê o relatório do CI é induzido ao erro.
- **Ruído na revisão:** dificulta distinguir os `exists()` legítimos (renderização
  condicional) dos inúteis.

## Plano de correção

1. **`IconsAndLoaders.test.ts`:**
   - corrigir a asserção de `MaxWaitIcon` (linha 21), que confere a classe errada
     (`.icon-done-max`) — usar a classe real do componente;
   - trocar `find('svg').exists()` por asserções que identifiquem **qual** ícone foi
     renderizado: verificar o `viewBox`, a presença de um `<path>` com `d` esperado,
     ou um atributo/`aria-label` distintivo;
   - garantir que cada um dos quatro ícones tenha ao menos uma asserção que **falharia**
     se ele fosse substituído por outro do mesmo grupo.
2. **`LayoutComponents.test.ts:50-55`:** ou implementar a verificação prometida pelo
   nome (ler `grid-template-columns` via `getComputedStyle` — já mockado em
   `tests/setup.ts` — ou validar o `style`/classe que define as 24 colunas), ou **remover
   o caso** e renomear o teste para o que ele de fato garante. Não deixar o nome mentindo.
3. **`MaxPageLayout.test.ts:50-57`:** complementar o teste de composição com asserções de
   **props repassadas** aos filhos (`findComponent(MaxTopMenu).props(...)`) e ao menos um
   caso de interação (ex.: efeito do `useSystemStore` sobre a exibição do `MaxSideMenu`).
4. **Regra geral para o repositório:** estabelecer no `CONTRIBUTING.md` que
   `expect(x.exists()).toBe(true)` só é aceitável quando o **objeto do teste é a
   renderização condicional** (par com um caso `toBe(false)`). Fora disso, exigir
   asserção sobre conteúdo, prop, emit ou estado.
5. **Priorizar** os arquivos da tabela acima por razão `exists()`/`expect`, começando por
   `IconsAndLoaders.test.ts` e `LayoutComponents.test.ts`, que são os mais degenerados e
   também os menores (correção barata).

## Verificação

- **Teste de mutação por arquivo:** trocar o conteúdo de `MaxDoneIcon.vue` pelo de
  `MaxErrorIcon.vue` e rodar `npx vitest run tests/components/IconsAndLoaders.test.ts` —
  a suíte **deve falhar**. Hoje ela passa.
- Nenhum `it(...)` cujo nome cite uma garantia (número de colunas, ordem, valor) sem uma
  asserção correspondente no corpo.
- A razão `exists()`/`expect` dos arquivos listados cai; nenhum arquivo de teste tem
  `exists()` como única forma de asserção em todos os seus casos.
- `npx vitest run` permanece verde após as correções.
