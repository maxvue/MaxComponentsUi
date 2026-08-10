# MaxModal não expõe `role="dialog"`, `aria-modal` nem `aria-labelledby`

- **Categoria:** acessibilidade
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxModal.vue:9-28`
- **Domínio:** overlays-navegacao

## Problema

O painel do modal é um `<div class="max-modal">` puro (linha 10). Não há nenhum atributo ARIA:

- Sem `role="dialog"` — leitores de tela anunciam o conteúdo como texto solto no documento, sem indicar que uma janela modal foi aberta.
- Sem `aria-modal="true"` — o leitor de tela não restringe o "modo de navegação" ao contêiner do diálogo.
- Sem `aria-labelledby` ou `aria-label` — mesmo existindo um título renderizado (`MaxTitle1` com `props.title`, linha 14), ele não está vinculado ao diálogo.
- O botão de fechar padrão (`MaxIconButton`, linha 18) não tem `aria-label`, ao contrário do `MaxDrawer`, que aplica `aria-label="Fechar"` explicitamente (`src/components/MaxDrawer.vue:35`).

O `MaxDrawer` já aplica `role="complementary"` e `aria-modal="true"` (linhas 16-17), evidenciando que o padrão existe no projeto e não foi replicado no `MaxModal`.

## Impacto

O `MaxModal` é o overlay principal da biblioteca. Sem semântica de diálogo, usuários de leitor de tela não recebem anúncio de abertura, não sabem o título da janela e não têm o contexto delimitado. Combinado com a ausência de focus trap, torna o componente praticamente inoperável por tecnologia assistiva.

## Plano de correção

1. Em `src/components/MaxModal.vue`, no `<div class="max-modal" ref="el">` (linha 10), adicionar:
   - `role="dialog"`
   - `aria-modal="true"`
   - `:aria-labelledby="title_id"` quando `! props.noHeader` e `props.title` existirem; caso contrário, `:aria-label="props.title ?? undefined"`.
2. Gerar `const title_id = computed(() => 'max-modal-title-' + id.value)` e aplicar esse `:id` no wrapper do `MaxTitle1` (linha 13-15).
3. Adicionar `aria-label="Fechar"` no `MaxIconButton` de fechar (linha 18).
4. Manter a convenção de 4 espaços e aspas simples.

## Verificação

- Teste em `tests/components/MaxModal.test.ts`: abrir o modal e afirmar que `document.querySelector('.max-modal')?.getAttribute('role') === 'dialog'` e `aria-modal === 'true'`.
- Teste de vínculo: afirmar que `aria-labelledby` do painel corresponde ao `id` do elemento que contém o texto do `title`.
- Teste do botão de fechar: afirmar `aria-label="Fechar"`.
- `npx vitest run tests/components/MaxModal.test.ts`
