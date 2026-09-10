# Drawers Empilhados e Navegação em Camadas (Nested Sheets)

## 1. Visão Geral no Directus

No ecossistema do **Directus Studio (Vue 3)**, a manipulação de dados relacionais e a edição de entidades complexas é centrada no paradigma de **Drawers Empilhados (Nested Sheets)**. Ao invés de redirecionar o operador para rotas isoladas ou abrir múltiplos popups/modais destrutivos, o Directus adota uma arquitetura de navegação deslizante em camadas profundas:

- **Fluxo Relacional Contextual:** Ao visualizar ou editar um registro principal (ex: formulário da coleção pai) e clicar em uma relação *Many-to-One (M2O)*, *One-to-Many (O2M)* ou *Many-to-Many (M2M)*, uma nova gaveta deslizante (*sheet*) desliza a partir da borda direita da tela, cobrindo entre 85% e 95% da viewport.
- **Hierarquia Visual e Profundidade (Z-Stacking com Efeito Cascata):**
  - Conforme novas entidades filhas são abertas (ex: `Nível 1` -> `Nível 2` -> `Nível 3`), os drawers subjacentes sofrem uma sutil translação horizontal para a esquerda e recebem uma camada de escurecimento/sombra com transição cúbica suave, criando percepção imediata de profundidade espacial.
  - O cabeçalho de cada drawer exibe breadcrumbs contextuais e um indicador de profundidade (ex: `← Voltar para Projeto #1280`), garantindo que o usuário nunca se perca na árvore relacional.
- **Isolamento de Estado e Ciclo de Vida Reativo:**
  - Cada drawer encapsula seu próprio estado de rascunho (*dirty state*).
  - Se o usuário fecha uma camada que contém alterações pendentes, o sistema exibe uma confirmação de descarte de alterações restrita àquela folha.
  - Ao clicar em "Salvar / Confirmar" na folha superior, os dados validados são resolvidos via *Promise* e repassados reativamente para o formulário pai imediatamente anterior, sem disparar mutações precoces no banco de dados até que a transação inteira seja concluída.
- **Ergonomia e Atalhos:**
  - Suporte completo à tecla `Escape`, fechando estritamente o drawer no topo da pilha (*LIFO - Last In, First Out*).
  - Trava de scroll automática inteligente mantendo a posição de leitura intacta nos níveis inferiores.

---

## 2. Situação Atual no Engeapp / MaxComponentsUi

No **Engeapp** e na biblioteca **MaxComponentsUi**, a experiência de formulários relacionais e inspeção de entidades secundárias é fragmentada e possui limitações arquiteturais severas:

1. **`MaxDrawer.vue` é um componente isolado e plano (Flat):**
   - O componente atual aceita `v-model:visible`, `header`, `position`, `modal`, mas foi concebido para instâncias únicas estáticas declaradas no template de cada página.
   - Não existe um gerenciador global ou orquestrador reativo de pilha de drawers que permita empilhar instâncias programaticamente (`useDrawerStackStore`).
2. **Conflito com `MaxModal` e Perda de Contexto:**
   - Atualmente, para cadastrar ou editar um item relacionado (ex: cadastrar um novo Integrador ou criar uma Unidade Consumidora dentro de um Projeto de Homologação), o sistema apela para `MaxModal`.
   - Modais sobrepostos criam problemas crônicos de usabilidade: perda de visão periférica do formulário pai, conflitos de `z-index`, sobreposição desordenada de máscaras pretas (*backdrop traps*) e bloqueio do scroll principal.
3. **Navegação Destrutiva por Rota:**
   - Em cenários onde o formulário é mais extenso, o sistema frequentemente direciona o usuário para outra rota completa (ex: `/clientes/novo`). O engenheiro perde os dados parciais preenchidos no projeto solar se não houver um sistema robusto de autosave em todos os campos, gerando atrito e retrabalho constante.

---

## 3. Valor Agregado para o Engeapp

O Engeapp é um sistema de alta densidade operacional voltado para homologação de usinas solares fotovoltaicas junto a dezenas de concessionárias de energia (CEMIG, CPFL, Enel, Equatorial, Neoenergia, etc.). Um único projeto de homologação conecta dezenas de entidades relacionais:

- **Dados do Projeto:** Titular, Unidade Consumidora (UC), Coordenadas Geográficas (UTM/Decimal), Grupo Tarifário.
- **Dados Técnicos de Engenharia:** Inversores (fabricante, potência nominal, tensão, homologação INMETRO), Módulos Fotovoltaicos (potência de pico, eficiência, quantidade de strings), Padrão de Entrada (disjuntor geral, ramal de conexão, transformador).
- **Documentação e Agentes:** ART do Engenheiro Responsável, Procurações Assinadas, Integrador Comercial, Contato da Concessionária.

### Ganhos de Produtividade:
- **Fluxo Contínuo de Preenchimento:** O engenheiro de projetos pode cadastrar um novo inversor que não existia no catálogo sem sair da tela de memorial descritivo do projeto. Ao confirmar a folha do inversor, o formulário principal é atualizado instantaneamente via reatividade do Vue 3.
- **Redução Drástica de Erros Operacionais:** Como o operador mantém o contexto visual da folha de origem logo atrás, ele pode consultar os dados da conta de energia ou diagrama técnico enquanto cadastra a subestação ou inversor.
- **Agilidade e Satisfação do Usuário:** Elimina a necessidade de abrir 5 abas no navegador para conferir dados cruzados.

---

## 4. Especificação Técnica Proposta

### 4.1 Arquitetura Pinia: Store Centralizada de Pilha (`useDrawerStackStore`)

A pilha de drawers deve ser gerenciada de forma centralizada por uma store dedicada, permitindo aberturas declarativas (via template) ou programáticas (via composição com retorno tipado via `Promise`).

```typescript
// src/stores/useDrawerStack.Store.ts
import { defineStore } from 'pinia';
import { ref, markRaw, type Component } from 'vue';

export interface DrawerSheetItem<TProps = any, TResult = any> {
    id: string;
    title: string;
    subtitle?: string;
    component: Component;
    props?: TProps;
    width?: string;
    dismissable?: boolean;
    isDirty?: boolean;
    resolve?: (value: TResult) => void;
    reject?: (reason?: any) => void;
}

export const useDrawerStackStore = defineStore('drawerStack', () => {
    const stack = ref<DrawerSheetItem[]>([]);

    const openSheet = <TProps = any, TResult = any>(options: {
        title: string;
        subtitle?: string;
        component: Component;
        props?: TProps;
        width?: string;
        dismissable?: boolean;
    }): Promise<TResult> => {
        return new Promise<TResult>((resolve, reject) => {
            const sheet: DrawerSheetItem<TProps, TResult> = {
                id: `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: options.title,
                subtitle: options.subtitle,
                component: markRaw(options.component),
                props: options.props,
                width: options.width ?? '48rem',
                dismissable: options.dismissable ?? true,
                isDirty: false,
                resolve,
                reject
            };
            stack.value.push(sheet);
        });
    };

    const closeTop = (result?: any) => {
        if (stack.value.length === 0) return;
        const top = stack.value.pop();
        if (top?.resolve) {
            top.resolve(result);
        }
    };

    const cancelTop = () => {
        if (stack.value.length === 0) return;
        const top = stack.value.pop();
        if (top?.reject) {
            top.reject(new Error('Sheet closed by user'));
        }
    };

    const closeAll = () => {
        while (stack.value.length > 0) {
            const item = stack.value.pop();
            item?.reject?.(new Error('All sheets closed'));
        }
    };

    const setTopDirty = (dirty: boolean) => {
        if (stack.value.length > 0) {
            stack.value[stack.value.length - 1].isDirty = dirty;
        }
    };

    return {
        stack,
        openSheet,
        closeTop,
        cancelTop,
        closeAll,
        setTopDirty
    };
});
```

### 4.2 Lógica de Animação e Efeito Cascata Visual

Para reproduzir o efeito elegante do Directus Studio:
- **Base Z-Index:** `1200 + index * 20`.
- **Efeito de Escala/Translação:**
  - Nível do topo: `transform: translateX(0); opacity: 1;`.
  - Níveis anteriores (`index < stack.length - 1`):
    - `transform: scale(calc(1 - (stack.length - 1 - index) * 0.03)) translateX(calc((stack.length - 1 - index) * -20px));`
    - `filter: brightness(calc(1 - (stack.length - 1 - index) * 0.15));`
    - `pointer-events: none;` (evita interações acidentais na folha inferior).

---

## 5. Componentes de UI Sugeridos para o MaxComponentsUi

### 5.1 `MaxDrawerStack.vue` (Container Global de Montagem)

Container registrado globalmente em `App.vue`, escutando a store e renderizando o conjunto dinâmico de folhas em `Teleport to="body"`.

```html
<template>
    <teleport to="body">
        <div v-if="drawerStore.stack.length > 0" class="max-drawer-stack-container">
            <div
                class="stack-backdrop"
                @click="onBackdropClick"
            />
            <div
                v-for="(sheet, index) in drawerStore.stack"
                :key="sheet.id"
                class="stack-sheet-wrapper"
                :style="getSheetStyle(index)"
            >
                <div class="sheet-card">
                    <header class="sheet-header">
                        <div class="header-breadcrumbs">
                            <span v-if="index > 0" class="breadcrumb-back" @click="drawerStore.cancelTop()">
                                <MaxIcon i="iconoir:arrow-left" size="1.2" />
                                Nível {{ index + 1 }}
                            </span>
                            <h2 class="sheet-title">{{ sheet.title }}</h2>
                            <span v-if="sheet.subtitle" class="sheet-subtitle">{{ sheet.subtitle }}</span>
                        </div>
                        <div class="header-actions">
                            <button
                                type="button"
                                class="close-action-btn"
                                aria-label="Fechar gaveta"
                                @click="handleClose(sheet)"
                            >
                                <MaxIcon i="iconoir:xmark" size="1.3" />
                            </button>
                        </div>
                    </header>
                    <main class="sheet-body">
                        <component
                            :is="sheet.component"
                            v-bind="sheet.props"
                            @resolve="drawerStore.closeTop"
                            @cancel="drawerStore.cancelTop"
                            @dirty-change="(val: boolean) => (sheet.isDirty = val)"
                        />
                    </main>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
    import { computed, onMounted, onBeforeUnmount } from 'vue';
    import { useDrawerStackStore, type DrawerSheetItem } from '../stores/useDrawerStack.Store';
    import MaxIcon from './MaxIcon.vue';

    const drawerStore = useDrawerStackStore();

    const getSheetStyle = (index: number) => {
        const total = drawerStore.stack.length;
        const depthFromTop = total - 1 - index;
        const baseZ = 1200 + index * 10;
        const scale = Math.max(0.92, 1 - depthFromTop * 0.03);
        const translateX = depthFromTop * -18;
        const brightness = Math.max(0.7, 1 - depthFromTop * 0.12);

        return {
            zIndex: baseZ,
            transform: `translateX(${translateX}px) scale(${scale})`,
            filter: `brightness(${brightness})`,
            pointerEvents: depthFromTop === 0 ? 'auto' : 'none'
        };
    };

    const handleClose = (sheet: DrawerSheetItem) => {
        if (sheet.isDirty) {
            const confirmed = window.confirm('Você possui alterações não salvas nesta etapa. Deseja realmente fechar?');
            if (!confirmed) return;
        }
        drawerStore.cancelTop();
    };

    const onBackdropClick = () => {
        const top = drawerStore.stack[drawerStore.stack.length - 1];
        if (top && top.dismissable !== false) {
            handleClose(top);
        }
    };

    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && drawerStore.stack.length > 0) {
            const top = drawerStore.stack[drawerStore.stack.length - 1];
            if (top) handleClose(top);
        }
    };

    onMounted(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('keydown', handleKeydown);
    });
</script>

<style lang="scss" scoped>
.max-drawer-stack-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1190;
    overflow: hidden;

    .stack-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(2px);
        transition: opacity 0.3s ease;
    }

    .stack-sheet-wrapper {
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: 100%;
        max-width: 52rem;
        display: flex;
        flex-direction: column;
        transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), filter 0.32s ease;
        box-shadow: -8px 0 32px rgba(0, 0, 0, 0.28);

        .sheet-card {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            background-color: var(--background-0);
            border-left: 1px solid var(--background-300);

            .sheet-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.25rem 1.5rem;
                border-bottom: 1px solid var(--background-200);

                .header-breadcrumbs {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;

                    .breadcrumb-back {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.35rem;
                        font-size: 0.8125rem;
                        color: var(--primary-600);
                        cursor: pointer;
                        font-weight: 500;

                        &:hover {
                            text-decoration: underline;
                        }
                    }

                    .sheet-title {
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: var(--background-800);
                        margin: 0;
                    }

                    .sheet-subtitle {
                        font-size: 0.875rem;
                        color: var(--background-500);
                    }
                }

                .header-actions {
                    display: flex;
                    align-items: center;

                    .close-action-btn {
                        background: none;
                        border: none;
                        color: var(--background-500);
                        cursor: pointer;
                        padding: 0.5rem;
                        border-radius: 0.5rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;

                        &:hover {
                            background-color: var(--background-100);
                            color: var(--background-800);
                        }
                    }
                }
            }

            .sheet-body {
                flex: 1;
                overflow-y: auto;
                padding: 1.5rem;
            }
        }
    }
}
</style>
```

### 5.2 Exemplo de Uso no Engeapp (Cadastrar Inversor sem perder o Projeto)

```typescript
// Exemplo em um formulário técnico de Homologação
import { useDrawerStackStore } from '@maxvue/max-components-ui';
import FormInversorFotovoltaico from './FormInversorFotovoltaico.vue';

const drawerStack = useDrawerStackStore();

const handleAddNovoInversor = async () => {
    try {
        const novoInversor = await drawerStack.openSheet({
            title: 'Cadastrar Novo Inversor Fotovoltaico',
            subtitle: 'O equipamento ficará vinculado imediatamente ao Memorial Descritivo atual',
            component: FormInversorFotovoltaico,
            props: {
                potenciaSugerida: projeto.value.potencia_pico_total
            }
        });
        
        // Retorno tipado via Promise, atualiza sem recarregar tela nem perder rascunhos!
        projeto.value.inversores.push(novoInversor);
    } catch {
        // Usuário cancelou ou descartou a folha
    }
};
```
