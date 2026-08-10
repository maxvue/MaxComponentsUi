# MaxTitle1 e MaxTitle2 usam a mesma classe raiz `.max-title-2`

- **Categoria:** divergência
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxTitle1.vue:2`, `src/components/MaxTitle1.vue:36`, `src/components/MaxTitle2.vue:2`, `src/components/MaxTitle2.vue:36`
- **Domínio:** tabela-layout-exibicao

## Problema

Os dois componentes declaram a mesma classe raiz:

- `MaxTitle1.vue:2` — `<div class="max-title-2" :class="{ center: center }">`
- `MaxTitle2.vue:2` — `<div class="max-title-2 select-none">`

`MaxTitle1` está usando a classe do `MaxTitle2` — evidentemente resultado de cópia entre os arquivos (os comentários das linhas 3-5 de ambos também são quase idênticos).

O que evita uma colisão real é o fato de ambos os blocos `<style>` serem `scoped` (`MaxTitle1.vue:35`, `MaxTitle2.vue:35`): o Vue adiciona atributos `data-v-*` distintos, então as regras não se sobrepõem apesar do seletor idêntico. O defeito é portanto de manutenção, não de renderização — mas é frágil:

1. Se qualquer um dos dois blocos deixar de ser `scoped` (algo comum nesta biblioteca, onde vários componentes usam estilo global para alcançar filhos), as regras passam a colidir imediatamente. Os dois definem `.max-title-2` com `padding` diferente (`10px 0 0` vs `1rem 0 5px`) e estruturas internas distintas (`.t1-main-text`/`.t2-main-text` vs `.text-h1`/`.text-h2`).
2. Uma aplicação consumidora que escreva CSS global mirando `.max-title-2` para estilizar subtítulos atinge **os dois** componentes sem perceber.
3. Inspecionar o DOM e ver `.max-title-2` não permite distinguir qual componente está renderizado.

Há ainda uma diferença de API não intencional: `MaxTitle1` aceita a prop `center` (linha 18) e aplica a classe correspondente; `MaxTitle2` não tem `center`, embora `MaxAuthCard.vue:5` passe `center` para um `MaxTitle2` — onde o atributo cai em `attrs` e não produz o efeito de centralização esperado (o SCSS de `MaxTitle2` não define `.center`).

## Impacto

- Seletor ambíguo entre dois componentes distintos, quebrando a correspondência classe↔componente do resto da biblioteca.
- Colisão latente caso o escopo do estilo mude.
- `MaxAuthCard` passa `center` a um componente que não o implementa — o cabeçalho do card de login não centraliza.

## Plano de correção

1. Renomear a classe raiz de `MaxTitle1.vue` para `.max-title-1`, ajustando o seletor no `<style scoped>` (linha 36).
2. Implementar `center` em `MaxTitle2` (prop + regra `.center`), já que há um consumidor real esperando o comportamento (`MaxAuthCard.vue:5`) — ou remover o `center` daquela chamada, se a centralização não for desejada.
3. Buscar referências às classes em `src/`, `tests/` e `playground/` antes de renomear.

## Verificação

- `grep -rn "max-title-2\|max-title-1" src/ tests/ playground/` antes e depois.
- Teste asserindo a classe raiz correta de cada componente.
- Teste asserindo que `MaxTitle2` com `center` aplica a classe de centralização.
- `npx vitest run tests/components/DisplayAndTransitions.test.ts tests/components/MaxAuthCard.test.ts`.
