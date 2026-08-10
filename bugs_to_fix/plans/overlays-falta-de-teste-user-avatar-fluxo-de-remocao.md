# Falta de teste: `MaxUserAvatar.onAvatarClick` — 0% de funções cobertas, fluxo de remoção destrutiva sem nenhum teste

- **Categoria:** falta-de-teste
- **Severidade:** crítica
- **Arquivo(s):** `src/components/MaxUserAvatar.vue:42-55`, `tests/components/MaxUserAvatar.test.ts:20-53`
- **Domínio:** overlays-navegacao

## Problema

`MaxUserAvatar` é o componente com a pior cobertura do escopo: **27,7% de statements e 0% de funções**. A única função do componente, `onAvatarClick` (linhas 42-55), **nunca é executada por nenhum teste**.

Os cinco testes existentes (`tests/components/MaxUserAvatar.test.ts:25,30,36,42,48`) cobrem apenas renderização estática: presença do `Avatar`, `imageUrl` vs. iniciais, geração das iniciais e aplicação condicional do tooltip. Nenhum dispara um clique.

O que fica sem cobertura é justamente o caminho crítico e **destrutivo**:

```
const onAvatarClick = (event: MouseEvent) => {
    if (!props.remove) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    confirm_store.x = rect.x;
    ...
    confirm_store.acceptProps = { label: 'Remover', icon: 'trash', action: () => emit('remove') };
    confirm_store.show = true;
};
```

Comportamentos críticos sem teste:

1. **Guard de `remove`:** clicar com `remove: false` não deve tocar no `confirm_store`.
2. **Abertura da confirmação:** com `remove: true`, o clique deve setar `confirm_store.show = true`.
3. **Emissão de `remove`:** executar `confirm_store.acceptProps.action()` deve emitir o evento `remove` — o único caminho pelo qual a ação destrutiva chega ao consumidor.
4. **Rejeição:** `confirm_store.rejectProps.action()` não deve emitir nada.
5. **Mensagem e ícone:** `labelRemove` deve sobrescrever o default `'Remover responsável?'` (linha 50); `messageIcon` deve ser `'mingcute:user-remove-fill'` (linha 51).
6. **Coordenadas:** `x`/`y`/`width`/`height` do store devem vir do `getBoundingClientRect()` do alvo.
7. **Escrita direta no store:** o componente muta campos individuais do `useConfirmStore` (linhas 46-54) em vez de usar o método `confirm()` da store (`src/stores/useConfirm.Store.ts:50`), que é o caminho usado por `MaxButtonConfirm`, `MaxIconConfirm` e `MaxTogglePopover`. Essa divergência não tem teste que a proteja nem que documente a intenção — e a store documenta explicitamente que `confirm()` existe para "resetar todos os campos... evitando vazamento de estado entre instâncias como `messageIcon`". Escrever campo a campo é exatamente o padrão que a store tenta evitar.

## Impacto

O único fluxo com consequência irreversível do componente (remover um responsável) não tem rede de proteção. Uma regressão que quebre a emissão de `remove`, ou que faça o clique abrir a confirmação mesmo com `remove: false`, passaria despercebida pela CI. O item 7 é um bug latente: um `messageIcon` de um confirm anterior pode vazar, exatamente o cenário que o teste `tests/components/MaxTogglePopover.test.ts:123` já cobre para os outros componentes.

## Plano de correção

1. Estender `tests/components/MaxUserAvatar.test.ts` com um `describe('MaxUserAvatar — fluxo de remoção')` cobrindo os itens 1 a 6 acima. Usar `createTestingPinia`/`setActivePinia` conforme o padrão já adotado em `tests/components/MaxTogglePopover.test.ts:74`.
2. Como o `getBoundingClientRect` no happy-dom retorna zeros, mockar o método no elemento alvo antes do clique (`vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({...})`) para validar a propagação das coordenadas.
3. Refatorar `onAvatarClick` para usar `confirm_store.confirm({ ... })` em vez das oito atribuições diretas, alinhando com os demais componentes de confirmação e eliminando o risco de vazamento de estado. Adicionar um teste que abra um confirm com `messageIcon` customizado por outro gatilho e, em seguida, dispare o do avatar, afirmando que o ícone é o do avatar (espelhando `MaxTogglePopover.test.ts:123`).
4. Confirmar a subida da cobertura de funções de 0% para 100% neste arquivo.

## Verificação

- `npx vitest run tests/components/MaxUserAvatar.test.ts`
- `npm run test:coverage` e conferir que `MaxUserAvatar.vue` sai de 27,7% stmts / 0% funcs para acima de 90% em ambos.
