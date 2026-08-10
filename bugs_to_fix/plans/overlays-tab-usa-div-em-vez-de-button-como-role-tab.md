# MaxTab usa `<div role="tab">` sem handler de teclado próprio — Enter/Espaço só funcionam via `MaxTabList`

- **Categoria:** acessibilidade
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTab.vue:2-17`, `src/components/MaxTab.vue:44-52`, `src/components/MaxTabList.vue:73-76`
- **Domínio:** overlays-navegacao

## Problema

O `MaxTab` renderiza um `<div>` com `role="tab"` e `:tabindex` (linhas 2-15). Ele declara `@click` e `@focus`, mas **nenhum `@keydown`**. A ativação por Enter/Espaço depende inteiramente do handler do componente **pai** `MaxTabList` (`src/components/MaxTabList.vue:73-76`).

Consequências:

1. **Acoplamento frágil.** Um `MaxTab` usado fora de um `MaxTabList` (o `MaxTabs` não impõe essa estrutura — `injectTabsContext` valida apenas a presença do `MaxTabs`, `src/components/MaxTab.vue:32`) fica sem ativação por teclado alguma: focável por `tabindex="0"`, mas inerte ao Enter.
2. **`<div>` em vez de `<button>`.** Um `<button type="button" role="tab">` traria ativação nativa por Enter/Espaço, estado `:disabled` real e semântica de controle interativo sem depender de atributos manuais. O `MaxAccordionHeader` do mesmo repositório faz exatamente isso (`src/components/MaxAccordionHeader.vue:3-16`: `<button type="button" ... :disabled="panel.disabled.value" @keydown="onKeydown">`), estabelecendo o padrão correto que o `MaxTab` não segue.
3. **`disabled` só visual.** O `MaxTab` desabilitado recebe `aria-disabled="true"` e a classe `max-tab-disabled` (linhas 5, 10), e o `onClick` tem guard (linha 45) — mas continua **focável** se for o tab ativo (`is_tabbable`, linhas 38-42, retorna `true` para o ativo independentemente de `disabled`). Um tab desabilitado que também seja o ativo entra no fluxo de tabulação e não pode ser ativado, um estado confuso para o teclado.
4. **Sem `cursor`/`user-select` de botão** e sem `type`, o `<div>` também não é anunciado como controle acionável por alguns leitores.

A cobertura do `MaxTab` é de 72,2% de branches, e o caso "tab ativo **e** desabilitado" não tem teste (os testes em `tests/components/MaxTabs.test.ts:56-203` cobrem tab desabilitado não-ativo e fallbacks de tabindex, mas não a combinação).

## Impacto

`MaxTab` fora de `MaxTabList` é inoperável por teclado. O caso ativo+desabilitado produz um item focável e inerte. Divergência de padrão com o `MaxAccordionHeader`, que resolveu o mesmo problema corretamente.

## Plano de correção

1. Trocar o elemento raiz do `MaxTab` de `<div>` para `<button type="button">`, mantendo `role="tab"` e todos os atributos ARIA atuais. Adicionar `:disabled="disabled"` para desabilitar nativamente.
2. Ajustar o SCSS (linhas 64-83) — `background: none; border: none;` já estão presentes, então a mudança visual deve ser nula; conferir `padding` e `font` herdados.
3. Adicionar um `@keydown` próprio no `MaxTab` tratando Enter/Espaço (chamando `onClick`), para que o componente funcione isoladamente. Manter o handler do `MaxTabList` para as setas/Home/End, que dependem do contexto da lista.
4. Corrigir `is_tabbable` (linhas 38-42) para excluir tabs desabilitados: `if (props.disabled) return false;` como primeira linha. Garantir que, se o tab ativo estiver desabilitado, o `fallback_tab_value` (`src/components/MaxTabs.vue:126`) assuma o tabindex 0 — a lógica de fallback já filtra por `! header.disabled()`.
5. Verificar se algum consumidor estiliza `.max-tab` contando com ser um `div` (busca por `.max-tab` em `src/`).

## Verificação

- Teste em `tests/components/MaxTabs.test.ts`: montar um `MaxTab` **sem** `MaxTabList` (direto no slot do `MaxTabs`), disparar `keydown` com Enter e afirmar que `update:value` foi emitido.
- Teste do caso ativo+desabilitado: `<MaxTab value="a" disabled>` com `value="a"` no `MaxTabs`, afirmar que `tabindex === '-1'` e que o próximo tab habilitado recebeu `tabindex="0"`.
- Teste de elemento: afirmar que a raiz do `MaxTab` é um `BUTTON` com `type="button"`.
- `npx vitest run tests/components/MaxTabs.test.ts` e conferir a subida de branches de 72,2%.
