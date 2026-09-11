# Achado UX-05: Destruição Acidental de Contexto por Singleton Global de Modais e Falta de Suporte a Multi-Modal / v-model

## Severidade: Alta

### Componentes Impactados
- [`MaxModal.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxModal.vue)
- [`stores/useModal.Store.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/stores/useModal.Store.ts)
- [`MaxPopoverConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopoverConfirm.vue)
- [`stores/useConfirm.Store.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/stores/useConfirm.Store.ts)

---

## 1. Sintoma Observado vs Causa Raiz Profunda

### Sintomas Observados
1. **Destruição Imediata de Formulários e Estado ao Abrir Modais Secundários (Stacked Modals Proibidos)**:
   Em fluxos operacionais corporativos (como preenchimento de propostas ou homologação de projetos fotovoltaicos), é extremamente comum que um modal principal (ex.: "Novo Projeto") precise abrir um diálogo secundário (ex.: "Cadastrar Novo Cliente", "Buscar CEP", ou "Confirmar Descarte de Alterações"). No `@maxvue/max-components-ui`, no exato instante em que o segundo modal é aberto, o primeiro modal é **abruptamente desmontado do DOM**. Todas as informações digitadas que não foram salvas em backend, abas selecionadas e o estado de rolagem do modal pai desaparecem instantaneamente.
2. **Perda de Contexto e Tela em Branco ao Fechar Diálogos Secundários**:
   Quando o usuário conclui ou cancela o segundo modal, o modal anterior **não reaparece**. A aplicação volta diretamente para a tela base de fundo. O usuário é expulso do fluxo de trabalho sem entender por que a janela anterior fechou sozinha.
3. **Ausência do Contrato Universal do Vue (`v-model:visible`)**:
   Diferente de componentes maduros como `MaxDrawer.vue` (que expõe `v-model:visible`), o `MaxModal.vue` **não possui a prop `visible` nem suporta `v-model`**. O consumidor é forçado a usar um botão interno embutido no template (`<slot name="button">`) ou a criar refs complexas e interagir manualmente com a store global imperativa `modal_store.toggle(id)`.
4. **Cliques Ignorados e Congelamento por Timers Artificiais (`refAutoReset`)**:
   O `MaxModal.vue` não utiliza a tag nativa `<Transition>` do Vue para gerenciar sua animação de entrada e saída. Em vez disso, simula a transição com encadeamento de temporizadores JavaScript (`setTimeout(..., 1)` e `setTimeout(..., 300)`) combinados com um flag `is_changing = refAutoReset(false, 400)`. Se o usuário der duplo clique para abrir, fechar rapidamente ou tentar interagir dentro do intervalo de 400ms, o clique é simplesmente descartado em silêncio (`if (is_changing.value) return;`), passando a impressão de travamento da interface.

### Causa Raiz Profunda
A causa raiz é a **arquitetura de estado baseada em um identificador escalar único (`show_id: string | null`) na store global**, em vez de uma **estrutura de pilha de camadas (Modal Stack)**:
- **Modelo de Exclusão Mútua Destrutiva**: Em `useModalStore`, a propriedade `show_id` só pode guardar um único identificador por vez. O template do `MaxModal.vue` faz `v-if="modal_store.show_id === id"`. Assim, o surgimento de qualquer novo ID na aplicação força a destruição do anterior.
- **Falta de Desacoplamento entre Apresentação e Estado Global**: Um componente de diálogo modal em um design system deveria operar perfeitamente de forma local e autocontida através de `v-model:visible`, permitindo composição hierárquica natural de componentes (árvore DOM do Vue), sem depender de um barramento de eventos ou store Pinia como pré-requisito funcional.

---

## 2. Evidência Técnica

### Evidência 1: A condição de desmontagem fatal em `MaxModal.vue`
Localização: [`MaxModal.vue#L8-L15`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxModal.vue#L8-L15)

```html
        <teleport to="body">
            <div
                class="background-modal"
                @click.stop="onBackdropClick"
                v-if="modal_store.show_id === id"
                :style="{ opacity: style?.opacity }"
                :data-html2canvas-ignore="props.ignoreCanvas"
            >
```

Se `modal_store.show_id` receber outro ID, `modal_store.show_id === id` torna-se `false` e o componente é destruído do DOM junto com toda a sua árvore de componentes filhos e estado reativo local.

### Evidência 2: Store singleton com único ID em `useModal.Store.ts`
Localização: [`src/stores/useModal.Store.ts#L6-L19`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/stores/useModal.Store.ts#L6-L19)

```ts
export const useModalStore = defineStore('modal', () => {
    const show_id = ref<string | null>(null);

    const toggle = (id: string) => {
        show_id.value = show_id.value === id ? null : id;
    };

    const hide = () => {
        show_id.value = null;
    };

    return { show_id, toggle, hide };
});
```

A store não possui pilha (`stack: string[]`), impossibilitando guardar o histórico de janelas abertas para retorno posterior.

### Evidência 3: Ausência de `<Transition>` e bloqueio de cliques com `refAutoReset`
Localização: [`MaxModal.vue#L182`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxModal.vue#L182) e [`MaxModal.vue#L257-L300`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxModal.vue#L257-L300)

```ts
    const is_changing = refAutoReset(false, 400);

    const toggle = () => {
        if (is_changing.value) return; // Ignora o clique do usuário!
        is_changing.value = true;

        clearPendingTimers();
        // ...
        if (modal_store.show_id !== id.value) {
            modal_store.toggle(id.value);
            pending_timers.push(setTimeout(() => {
                // Mutação imperativa de opacity
                style.value.opacity = 1;
            }, 1));
            return;
        } else if (modal_store.show_id === id.value) {
            pending_timers.push(setTimeout(() => {
                style.value.opacity = 0;
                pending_timers.push(setTimeout(() => {
                    modal_store.toggle(id.value);
                }, 300));
            }, 1));
        }
    };
```

O uso de temporizadores aninhados de 1ms e 300ms para emular opacidade gera condições de corrida visual e força a trava de 400ms que descarta interações rápidas legítimas do usuário.

---

## 3. Impacto na Experiência do Usuário Final e no Produto

1. **Perda Catastrófica de Trabalho em Andamento**: Um operador que passa 10 minutos preenchendo dados de um dimensionamento solar e precisa abrir uma consulta rápida de equipamentos perde absolutamente tudo o que digitou no momento em que a segunda janela abre.
2. **Insegurança Psicológica ao Operar o Sistema**: Usuários aprendem por tentativa e erro que abrir novos diálogos "apaga a tela", criando um comportamento defensivo de evitar usar recursos do sistema por medo de perder o trabalho.
3. **Rigidez Arquitetural para os Desenvolvedores**: A impossibilidade de controlar o modal via `v-model:visible="isOpen"` gera código espaguete nos componentes consumidores para tentar sincronizar a abertura com eventos da página.

---

## 4. Recomendações de Solução Arquitetural de UX
1. **Suporte Completo a `v-model:visible` / `:visible`**:
   - Permitir que o componente funcione de forma 100% autônoma via props, espelhando a arquitetura moderna já implementada em `MaxDrawer.vue`.
2. **Evoluir a Store para Suporte a Pilha de Camadas (Modal Stack)**:
   - Alterar o estado interno para `stack: string[]`.
   - Ao abrir um novo modal, colocá-lo no topo da pilha (`stack.push(id)`); ao fechar, dar `pop()`, restaurando instantaneamente o modal anterior com z-index incrementado.
3. **Migrar para a Primitiva Nativa `<Transition>` do Vue**:
   - Envolver o modal em `<Transition name="max-modal-fade">`.
   - Eliminar `is_changing`, `refAutoReset(false, 400)` e a cadeia de temporizadores `setTimeout`, garantindo animações de 60fps aceleradas por hardware via CSS e descarte de race conditions.
