# MaxGrid usa a classe `max-grid-cols` e MaxGridCols usa `grid-cols` — nomes trocados

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxGrid.vue:2`, `src/components/MaxGrid.vue:24`, `src/components/MaxGridCols.vue:2`, `src/components/MaxGridCols.vue:14`
- **Domínio:** tabela-layout-exibicao

## Problema

Os dois componentes de grid têm nomes de classe invertidos em relação aos nomes dos componentes:

| Componente | Classe raiz | Layout |
|---|---|---|
| `MaxGrid.vue` | `.max-grid-cols` | `display: flex; flex-wrap: wrap` |
| `MaxGridCols.vue` | `.grid-cols` | `display: grid; grid-template-columns: repeat(24, 1fr)` |

Ou seja: o componente chamado **Grid** aplica flexbox e carrega "cols" no nome da classe; o componente chamado **GridCols** é o que de fato usa CSS Grid com 24 colunas, mas sua classe **não** tem o prefixo `max-`.

Duas consequências concretas:

1. **Colisão de namespace.** `.grid-cols` sem prefixo é um nome genérico o bastante para colidir com utilitários do UnoCSS ou com CSS da aplicação consumidora. Todos os demais componentes da biblioteca prefixam suas classes com `max-` (`.max-table-fields-wrapper`, `.max-icon-div`, `.max-loader-main-div`, `.max-auth-card`). `MaxGridCols` é a exceção.

2. **Seletores enganosos.** Um desenvolvedor que inspecione o DOM e veja `.max-grid-cols` naturalmente procura por `MaxGridCols.vue` — e encontra o componente errado. O SCSS de `MaxGrid.vue` (linhas 24-57) contém regras que dependem de `.max-grid-cols`, incluindo o seletor de atributo `&[no-message]` que colapsa a linha de mensagem dos inputs internos (linhas 33-41) — comportamento não óbvio a partir do nome.

Há uma assimetria adicional: `MaxGridCols.vue` usa `<style scoped>` (linha 13) enquanto `MaxGrid.vue` usa estilo **global** (linha 23). O bloco global de `MaxGrid` é necessário porque alcança `.max-input-main-div` de componentes filhos, mas isso significa que `.max-grid-cols` vaza para toda a aplicação.

## Impacto

- Risco de colisão de `.grid-cols` com CSS da aplicação consumidora ou utilitários do UnoCSS.
- Navegação e depuração confusas: o nome da classe não corresponde ao componente.
- Regras globais de `MaxGrid` afetando qualquer elemento que use a mesma classe.

## Plano de correção

1. Renomear as classes para corresponder aos componentes: `MaxGrid` → `.max-grid`; `MaxGridCols` → `.max-grid-cols`.
2. Como `.max-grid-cols` já existe (apontando para o outro componente), a troca precisa ser feita em um único commit atômico, com busca global por ambos os nomes em `src/`, `tests/` e `playground/`.
3. Verificar se aplicações consumidoras dependem dos nomes atuais — se sim, é quebra de contrato visual e exige nota no CHANGELOG, possivelmente com um período de convivência das duas classes.
4. Documentar no CLAUDE.md a convenção de prefixo `max-` para classes raiz de componente.

## Verificação

- `grep -rn "grid-cols" src/ tests/ playground/` para inventariar todas as referências antes e depois.
- `npx vitest run tests/components/LayoutComponents.test.ts` (os testes das linhas 8-56 asseram as classes atuais e precisarão ser atualizados junto).
- Inspeção visual no playground de um formulário usando ambos os grids.
