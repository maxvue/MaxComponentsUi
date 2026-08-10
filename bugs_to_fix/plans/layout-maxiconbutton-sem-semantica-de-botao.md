# MaxIconButton é um div clicável sem semântica nem nome acessível

- **Categoria:** acessibilidade
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxIconButton.vue:2-6`
- **Domínio:** tabela-layout-exibicao

## Problema

O componente inteiro é um `<div>` com um handler de clique:

```vue
<div v-bind="{...props, ...attrs}" :class="`icon-div ico-btn ...`" @click="onClick" ...>
    <slot>
        <MaxIcon pointer v-bind="{...props, ...attrs}" :size="size" ... />
    </slot>
</div>
```

Faltam quatro coisas simultaneamente:

1. **Papel**: um `<div>` não é anunciado como botão. Sem `role="button"` (ou, melhor, um `<button>` real), leitores de tela o descrevem como texto genérico.
2. **Foco**: sem `tabindex="0"` nem elemento focável nativo, o controle é **inalcançável por teclado**. Não há como acioná-lo sem mouse.
3. **Ativação por teclado**: só há `@click`; `Enter` e `Space` não disparam nada.
4. **Nome acessível**: o conteúdo é exclusivamente um ícone SVG. Sem `aria-label`, o controle não tem nome algum — é anunciado como "botão" sem qualquer indicação da ação.

O impacto se propaga: `MaxButton.vue:13` delega para `MaxIconButton` sempre que não há `label`, e `MaxTableFields.vue:77` renderiza a coluna de ações inteira com `MaxIconButton`. Ou seja, **toda ação de linha de tabela na biblioteca é inacessível por teclado**.

Existe uma prop `tooltip` em `MaxIcon` (`MaxIcon.vue:65`), mas tooltip visual não fornece nome acessível.

## Impacto

- Violação de WCAG 2.1.1 (Keyboard) e 4.1.2 (Name, Role, Value) — nível A.
- Usuários de teclado e de leitor de tela não conseguem acionar nenhum botão de ícone da biblioteca, incluindo editar/excluir em tabelas.
- Sem foco visível, usuários com deficiência motora que navegam por teclado ficam sem qualquer feedback.

## Plano de correção

1. Trocar o elemento raiz por um `<button type="button">`, que traz papel, foco e ativação por teclado nativamente, e neutralizar seu estilo padrão no SCSS (`background: none; border: none; padding: 0`).
2. Se a troca de elemento raiz for arriscada para o layout existente (o `.icon-div` é referenciado por outros componentes, ex.: `MaxTableColumn.vue:129`), aplicar o conjunto mínimo no `<div>`: `role="button"`, `:tabindex="0"`, e `@keydown.enter.prevent="onClick"` + `@keydown.space.prevent="onClick"`.
3. Expor e propagar um nome acessível:
   ```ts
   const accessibleName = computed(() => props.ariaLabel ?? props.label ?? props.tooltip);
   ```
   aplicado como `:aria-label="accessibleName"`. Emitir um warning em desenvolvimento quando ausente, já que um botão só de ícone sem nome é sempre um defeito.
4. Adicionar estilo de `:focus-visible` no SCSS (`.icon-div`, linhas 51-60), hoje inexistente.
5. Repassar `disabled`/`aria-disabled` quando aplicável, hoje ignorado.

## Verificação

- Teste: montar, disparar `keydown.enter` e asserir a emissão de `action`.
- Teste: asserir `role`/`tabindex` e `aria-label` quando `tooltip` ou `label` são fornecidos.
- Teste em `MaxTableFields` asserindo que os botões da coluna de ações têm nome acessível.
- `npx vitest run tests/components/MaxIconButton.test.ts tests/components/MaxTableFields.test.ts`.
- Navegação manual por Tab no playground.
