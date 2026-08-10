# MaxTabList: `onKeydown` cai em `current_value` quando o alvo não expõe `data-tab-value`, e os navegadores de scroll são inacessíveis

- **Categoria:** acessibilidade
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTabList.vue:50-77`, `src/components/MaxTabList.vue:3-10`, `src/components/MaxTabList.vue:16-25`
- **Domínio:** overlays-navegacao

## Problema

**1. Fallback silencioso do `value` no keydown.** O handler resolve o tab de origem assim (linhas 52-54):

```
const target = event.target as HTMLElement | null;
const value = target?.getAttribute('data-tab-value') ?? current_value.value;
if (value === undefined) return;
```

O `MaxTab` aplica `:data-tab-value="value"` na sua raiz (`src/components/MaxTab.vue:8`), então o caminho normal funciona. Mas se o evento borbulhar de um **elemento filho** dentro do slot do `MaxTab` (um `<span>`, um ícone, um `<button>` de fechar aba), `event.target` é o filho, que não tem o atributo — e o handler silenciosamente usa `current_value` (o tab **ativo**), não o tab **focado**. Com `selectOnFocus` desligado, isso significa que uma seta pressionada num tab focado-mas-não-ativo navega a partir do tab errado, pulando posições.

A correção idiomática é usar `target?.closest('[data-tab-value]')` em vez de ler o atributo diretamente do alvo.

**2. Navegadores de scroll inacessíveis por design.** Os botões `.max-tab-nav-prev` / `.max-tab-nav-next` (linhas 3-10 e 16-25) têm `aria-hidden="true"` **e** `tabindex="-1"`. Eles são, portanto, invisíveis para leitores de tela e inalcançáveis por teclado. No modo `scrollable` com muitas abas, um usuário de teclado consegue navegar entre abas pelas setas (o `navigate` do contexto chama `header.el.focus()`, `src/components/MaxTabs.vue:172`, e o browser rola para o elemento focado), então o caso não é bloqueante — mas um usuário que dependa de zoom/mouse-substituto perde a função. Além disso, os botões não têm `aria-label` nem texto, apenas ícones.

**3. Sem `aria-label` no `role="tablist"`.** O `<div role="tablist">` (linha 13) não tem `aria-label` nem `aria-labelledby`, então leitores de tela anunciam apenas "lista de guias" sem contexto.

A cobertura do arquivo é de 75% stmts / 40,9% branches / 33,3% functions, e `scrollBy` (linhas 44-47) não tem nenhum teste (os testes em `tests/components/MaxTabs.test.ts:204-251` cobrem apenas `role`, setas, Home, End e Enter).

## Impacto

Navegação por teclado imprevisível quando o conteúdo do tab é composto (caso comum: ícone + label), e funções de rolagem sem equivalente acessível. O ponto 1 é um bug funcional real, não apenas de acessibilidade.

## Plano de correção

1. Trocar a resolução do alvo (linha 53) por:
   ```
   const container = target?.closest<HTMLElement>('[data-tab-value]');
   const value = container?.getAttribute('data-tab-value') ?? current_value.value;
   ```
2. Adicionar `aria-label` aos botões navegadores ("Rolar abas para a esquerda"/"para a direita") e remover `aria-hidden="true"`/`tabindex="-1"`, ou — se a decisão for mantê-los decorativos — documentar explicitamente no código por que são inacessíveis e garantir que a navegação por setas cubra 100% do caso de uso.
3. Adicionar suporte a `aria-label` no `tablist`: nova prop opcional `ariaLabel` no `MaxTabList` aplicada como `:aria-label`.
4. Adicionar `role="presentation"` no `.max-tab-list-wrapper` caso os botões permaneçam dentro dele, para não quebrar a relação `tablist` → `tab`.

## Verificação

- Novo teste em `tests/components/MaxTabs.test.ts` (bloco `MaxTabList`): montar um `MaxTab` com um `<span data-testid="inner">` no slot, focar/disparar `keydown` com `ArrowRight` **no span**, e afirmar que a navegação partiu do tab que contém o span (e não do tab ativo).
- Teste de `scrollBy`: com `scrollable: true`, clicar em `.max-tab-nav-next` e afirmar que `scrollLeft` do `.max-tab-list` aumentou.
- Teste de `aria-label` nos navegadores e no `tablist`.
- `npx vitest run tests/components/MaxTabs.test.ts` e conferir a subida das branches de 40,9%.
