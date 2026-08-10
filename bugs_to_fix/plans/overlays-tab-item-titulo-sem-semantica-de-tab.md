# MaxTabItem: título é um `<div>` sem `role="tab"`, sem `tabindex` e sem navegação por teclado

- **Categoria:** acessibilidade
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTabItem.vue:3-12`, `src/components/MaxTabItem.vue:13-15`
- **Domínio:** overlays-navegacao

## Problema

O sistema legado de abas (`MaxTabItem`) renderiza o título como um `<div>` cru:

```
<div class="max-tab-item-title" :active="is_active" :disabled="props.disabled || undefined" @click="onTitleClick">
```

Comparado ao sistema novo (`MaxTab`, que ao menos tem `role="tab"`, `aria-selected`, `aria-controls` e `tabindex` — `src/components/MaxTab.vue:6-13`), o `MaxTabItem` não tem **nada**:

- Sem `role="tab"` e sem um `role="tablist"` no contêiner alvo do teleport (`.max-tabs-title`, `src/components/MaxTabs.vue:4`).
- Sem `tabindex` — **não é focável de forma alguma**. Não há maneira de selecionar uma aba pelo teclado.
- Sem `aria-selected` (o estado é comunicado por um atributo customizado `:active`, linha 4, que só serve ao seletor CSS `[active='true']`, linha 103).
- Sem `aria-disabled` (o estado usa o atributo `disabled` em um `<div>`, onde ele não tem significado nativo — linha 5, estilizado por `[disabled]`, linha 123).
- Sem `aria-controls` ligando ao painel `.max-tab-item-content` (linha 13), e o painel não tem `role="tabpanel"` nem `aria-labelledby`.
- Sem nenhum handler de teclado.

## Impacto

Toda aplicação que ainda usa `MaxTabItem` tem abas completamente inoperáveis por teclado e sem semântica alguma para leitores de tela — o conteúdo do painel ativo aparece como texto solto, sem relação com o título que o controla. Como `MaxTabItem` é a API legada ainda em uso, o impacto é real em produção.

## Plano de correção

Ordenar conforme a decisão tomada em `overlays-tabs-dois-sistemas-de-contexto-coexistindo.md`:

**Se o `MaxTabItem` for deprecado mas mantido em produção**, aplicar a correção mínima de acessibilidade:
1. Adicionar `role="tablist"` no `.max-tabs-title` de `src/components/MaxTabs.vue:4`.
2. No título (linha 3-12 de `MaxTabItem.vue`): `role="tab"`, `:aria-selected="is_active ? 'true' : 'false'"`, `:aria-disabled="props.disabled ? 'true' : 'false'"`, `:tabindex="is_active ? 0 : -1"`, `:id` e `:aria-controls` derivados de `tab_id`.
3. Adicionar `@keydown` tratando Enter/Espaço (ativar) e ArrowLeft/ArrowRight/Home/End (mover o foco entre os títulos irmãos) — a lista de títulos irmãos pode ser obtida do contêiner de teleport.
4. No painel (linha 13): `role="tabpanel"`, `:id` e `:aria-labelledby` ligados ao título.
5. Manter os atributos `:active`/`:disabled` existentes para não quebrar o CSS atual, adicionando os ARIA em paralelo.

**Se o `MaxTabItem` for removido**, migrar os consumidores para `MaxTabList`/`MaxTab`/`MaxTabPanel` (que já têm a semântica correta) e este achado se resolve por eliminação.

## Verificação

- Teste em `tests/components/MaxTabItem.test.ts`: afirmar que o título tem `role="tab"`, `aria-selected` refletindo `is_active` e `tabindex="0"` quando ativo / `-1` quando não.
- Teste de teclado: focar o título ativo, disparar `keydown` com `ArrowRight` e afirmar que o foco foi para o próximo título habilitado; disparar Enter e afirmar que a aba foi selecionada.
- Teste de vínculo: afirmar que `aria-controls` do título corresponde ao `id` do `.max-tab-item-content`, e que este tem `role="tabpanel"`.
- `npx vitest run tests/components/MaxTabItem.test.ts`
