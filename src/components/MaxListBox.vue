<template>
    <div class="max-listbox" :class="{ 'is-disabled': props.disabled, 'two-lines': props.twoLines }" :style="rootStyle">
        <div v-if="$slots.header || props.title" class="max-listbox-header">
            <slot name="header">
                <span class="max-listbox-title">{{ props.title }}</span>
            </slot>
        </div>

        <div v-if="props.filter" class="max-listbox-filter">
            <input
                v-model="searchInput"
                type="text"
                class="max-listbox-filter-input"
                :placeholder="props.filterPlaceholder"
                :disabled="props.disabled"
                @input="onFilterInput"
            >
        </div>

        <div
            ref="listElem"
            class="max-listbox-list"
            role="listbox"
            :tabindex="props.disabled ? -1 : 0"
            :aria-disabled="props.disabled"
            :aria-activedescendant="focusedItemId"
            @scroll="onListScroll"
            @keydown="onKeydown"
        >
            <div v-if="isVirtual" class="max-listbox-spacer" :style="{ height: `${totalHeight}px` }" aria-hidden="true" />

            <ul
                class="max-listbox-window"
                :class="{ 'is-virtual': isVirtual }"
                role="presentation"
                :style="isVirtual ? { transform: `translateY(${offsetY}px)` } : undefined"
            >
                <li
                    v-for="entry in visibleItems"
                    :id="itemId(entry.index)"
                    :key="optionKey(entry.item, entry.index)"
                    class="max-listbox-item"
                    :class="{ 'is-selected': isSelected(entry.item), 'is-disabled': isDisabled(entry.item), 'is-focused': focusedIndex === entry.index }"
                    role="option"
                    :aria-selected="isSelected(entry.item)"
                    :aria-disabled="isDisabled(entry.item)"
                    :style="isVirtual ? { height: `${props.itemHeight}px` } : undefined"
                    @click="selectOption(entry.item)"
                >
                    <slot name="option" :option="entry.item" :selected="isSelected(entry.item)" :index="entry.index">
                        <MaxIcon v-if="entry.item.icon" :icon="entry.item.icon" class="max-listbox-item-icon" />
                        <div class="max-listbox-item-labels">
                            <span class="max-listbox-item-label">{{ labelOf(entry.item) }}</span>
                            <span v-if="subLabelOf(entry.item)" class="max-listbox-item-sublabel">{{ subLabelOf(entry.item) }}</span>
                        </div>
                        <MaxBadgeComponent v-if="entry.item.badge !== undefined && entry.item.badge !== null" :label="String(entry.item.badge)" :background="entry.item.badgeColor" class="max-listbox-item-badge" />
                    </slot>
                </li>
            </ul>

            <!-- Loader/erro/vazio ficam fora de .max-listbox-window de propósito: em modo
                 virtual a window flutua (position: absolute) sobre a janela renderizada, então
                 uma <li> ali dentro pintaria logo após o último item da janela atual — no meio
                 do viewport, não no fim real da lista. Como siblings da window (e do spacer),
                 eles ficam em fluxo normal no fim de .max-listbox-list em ambos os modos. -->
            <div v-if="isLoading || (isApiMode && hasMore && visibleOptions.length > 0)" class="max-listbox-loader">
                <slot name="loader">Carregando...</slot>
            </div>

            <div v-if="loadError" class="max-listbox-error">
                <span>Erro ao carregar</span>
                <button type="button" class="max-listbox-retry" @click="retry">Tentar novamente</button>
            </div>

            <div v-if="visibleOptions.length === 0 && !isInitialLoading && !loadError" class="max-listbox-empty">
                <slot name="empty">{{ props.emptyMessage }}</slot>
            </div>
        </div>

        <div v-if="$slots.footer" class="max-listbox-footer">
            <slot name="footer" />
        </div>
    </div>
</template>

/**
 * Lista de seleção sempre visível, para painéis de navegação mestre-detalhe.
 * Suporta itens ricos (ícone, label, sublabel, badge), filtro, virtualização
 * automática e carregamento paginado por scroll infinito.
 */
<script setup lang="ts">
    import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxBadgeComponent from './MaxBadgeComponent.vue';
    import { useVirtualList } from '../composables/useVirtualList';
    import { LoadOptionsContext, LoadOptionsResult } from '../types';

    const props = withDefaults(
        defineProps<{
            /** Valor selecionado; null quando nada está selecionado */
            modelValue?: any;
            /** Objeto já resolvido pela app, exibido enquanto o item real não foi
             * carregado. Quando há um termo de busca ativo, o filtro tem precedência:
             * um selectedOption que não casa com o termo não é fixado no topo da lista.
             * Em modo API a checagem é feita client-side contra optionLabel/
             * optionSubLabel — um item que o servidor encontrou por outro campo (ex.:
             * um número de documento) não será fixado enquanto o filtro estiver ativo. */
            selectedOption?: any;
            /** Lista de opções local */
            options?: any[];
            /** Campo que contém o valor do item */
            optionValue?: string;
            /** Campo que contém o rótulo principal */
            optionLabel?: string;
            /** Campo que contém o rótulo secundário */
            optionSubLabel?: string;
            /** Campo que marca o item como não selecionável */
            optionDisabled?: string;
            /** Exibe o sublabel abaixo do label em vez de à direita */
            twoLines?: boolean;
            /** Mensagem exibida quando não há itens */
            emptyMessage?: string;
            /** Desabilita o painel inteiro */
            disabled?: boolean;
            /** Título exibido no cabeçalho */
            title?: string;
            /** Altura do painel (ex.: '400px'); padrão 100% do container */
            height?: string;
            /** Exibe o campo de busca. Nota: a filtragem local atualiza a lista
             * renderizada a cada tecla digitada, sem debounce — é a melhor UX para
             * uma lista já em memória. O evento `filter` e a busca em modo API
             * (loadOptions) continuam com debounce de 300ms. */
            filter?: boolean;
            /** Placeholder do campo de busca */
            filterPlaceholder?: string;
            /** Campos usados no filtro local; padrão: optionLabel + optionSubLabel */
            filterFields?: string[];
            /** Força a virtualização; undefined = automático acima do threshold */
            virtualScroll?: boolean;
            /** Quantidade de itens a partir da qual a virtualização liga sozinha */
            virtualScrollThreshold?: number;
            /** Altura fixa de cada linha, em pixels (exigida pela virtualização) */
            itemHeight?: number;
            /** Carrega páginas do servidor; quando definido, `options` é ignorado */
            loadOptions?: (ctx: LoadOptionsContext) => Promise<LoadOptionsResult>;
            /** Itens por página enviados ao loadOptions */
            pageSize?: number;
            /** Loading controlado externamente pela app */
            loading?: boolean;
        }>(),
        {
            modelValue: null,
            selectedOption: undefined,
            options: undefined,
            optionValue: 'value',
            optionLabel: 'label',
            optionSubLabel: 'sub_label',
            optionDisabled: 'disabled',
            twoLines: false,
            emptyMessage: 'Nenhum registro encontrado',
            disabled: false,
            title: undefined,
            height: undefined,
            filter: false,
            filterPlaceholder: 'Buscar...',
            filterFields: undefined,
            virtualScroll: undefined,
            virtualScrollThreshold: 500,
            itemHeight: 44,
            loadOptions: undefined,
            pageSize: 50,
            loading: false
        }
    );

    const emit = defineEmits<{
        (e: 'update:modelValue', value: any): void;
        (e: 'change', payload: { value: any; option: any }): void;
        (e: 'filter', term: string): void;
        (e: 'load-error', error: unknown): void;
    }>();

    const listElem = ref<HTMLElement | null>(null);

    const rootStyle = computed(() => (props.height ? { height: props.height } : undefined));

    const searchInput = ref('');
    const searchTerm = ref('');
    let filterTimer: ReturnType<typeof setTimeout> | undefined;

    /** Remove acentos e normaliza a caixa para comparação de texto. */
    function normalize(value: any): string {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase();
    }

    function onFilterInput() {
        clearTimeout(filterTimer);
        filterTimer = setTimeout(() => {
            searchTerm.value = searchInput.value;
            emit('filter', searchInput.value);
        }, 300);
    }

    const filterFieldList = computed(() => props.filterFields ?? [props.optionLabel, props.optionSubLabel]);

    /** Verifica se uma opção casa com o termo de busca já normalizado. */
    function matchesTerm(option: any, term: string): boolean {
        if (term === '') return true;
        return filterFieldList.value.some((field) => normalize(option?.[field]).includes(term));
    }

    const isApiMode = computed(() => props.loadOptions !== undefined);

    const apiItems = ref<any[]>([]);
    const currentPage = ref(0);
    const hasMore = ref(true);
    const isLoadingPage = ref(false);
    const loadError = ref<unknown>(null);
    /** Página que estava sendo buscada quando o erro ocorreu. */
    const failedPage = ref(1);
    /** Sequência de requisição: respostas de buscas antigas são descartadas. */
    let requestId = 0;
    /** Conta os auto-preenchimentos consecutivos (páginas buscadas sem um scroll
     * real do usuário) desde o último reset. Protege contra loop infinito quando
     * o servidor mente sobre `hasMore` ou quando o painel não é mensurável. */
    let autoFillCount = 0;
    /** Limite de páginas que o auto-preenchimento busca sozinho antes de desistir
     * e esperar por um scroll real do usuário. */
    const MAX_AUTO_FILL_PAGES = 20;

    const isLoading = computed(() => props.loading || isLoadingPage.value);
    // Considera tanto o loading interno (busca de página em modo API) quanto o
    // `loading` externo controlado pela app (ex.: modo local com fetch no pai):
    // em ambos os casos, se ainda não há nada em visibleOptions para mostrar,
    // é carregamento inicial — e a linha de "vazio" não deve aparecer junto.
    const isInitialLoading = computed(() => isLoading.value && visibleOptions.value.length === 0);

    async function fetchPage(pageToLoad: number) {
        if (!props.loadOptions || isLoadingPage.value) return;

        const thisRequest = ++requestId;
        isLoadingPage.value = true;
        loadError.value = null;
        failedPage.value = pageToLoad;

        try {
            const result = await props.loadOptions({
                page: pageToLoad,
                search: searchTerm.value,
                pageSize: props.pageSize
            });

            // Uma busca mais recente já foi disparada: descarta esta resposta.
            if (thisRequest !== requestId) return;

            const items = result?.items ?? [];
            apiItems.value = pageToLoad === 1 ? items : [...apiItems.value, ...items];
            currentPage.value = pageToLoad;

            if (result?.hasMore !== undefined) hasMore.value = result.hasMore;
            else if (result?.total !== undefined) hasMore.value = apiItems.value.length < result.total;
            else hasMore.value = items.length > 0;

            // A página carregada pode não preencher o painel (lista curta): sem scroll
            // possível o evento de scroll nunca dispara, então verificamos aqui mesmo.
            fillViewportIfNeeded();
        } catch (error) {
            if (thisRequest !== requestId) return;

            loadError.value = error;
            hasMore.value = false;
            emit('load-error', error);
        } finally {
            if (thisRequest === requestId) isLoadingPage.value = false;
        }
    }

    /** Recomeça a busca do zero — usado na montagem e a cada mudança de filtro. */
    function resetAndFetch() {
        apiItems.value = [];
        currentPage.value = 0;
        hasMore.value = true;
        loadError.value = null;
        isLoadingPage.value = false;
        autoFillCount = 0;
        fetchPage(1);
    }

    function retry() {
        loadError.value = null;
        hasMore.value = true;
        fetchPage(failedPage.value);
    }

    onMounted(() => {
        if (isApiMode.value) resetAndFetch();
    });

    watch(searchTerm, () => {
        if (isApiMode.value) resetAndFetch();
    });

    // A prop loadOptions pode ser fornecida (ou removida) depois do mount — ex.:
    // um painel que troca de um array local em cache para busca no servidor.
    // Sem este watch, apiItems ficaria vazio para sempre e filteredOptions (que
    // passa a olhar para apiItems assim que isApiMode vira true) mostraria a
    // lista permanentemente vazia. Ao voltar para modo local (isApiMode false)
    // não é preciso fazer nada: filteredOptions volta a ler props.options
    // automaticamente, e limpamos o estado da API para não deixar lixo (erro,
    // hasMore etc.) vazando caso o modo API seja religado depois.
    watch(isApiMode, (apiMode) => {
        if (apiMode) resetAndFetch();
        else {
            apiItems.value = [];
            currentPage.value = 0;
            hasMore.value = true;
            loadError.value = null;
            isLoadingPage.value = false;
            autoFillCount = 0;
        }
    });

    const filteredOptions = computed<any[]>(() => {
        // No modo API o filtro é server-side: a lista já vem filtrada.
        if (isApiMode.value) return apiItems.value;

        const list = props.options ?? [];

        if (!props.filter) return list;

        const term = normalize(searchInput.value);
        return list.filter((option) => matchesTerm(option, term));
    });

    /** Lista efetivamente renderizada. Inclui o selectedOption externo no topo
     * quando o valor selecionado ainda não está presente na lista local — mas
     * apenas se ele também casar com o termo de busca ativo (o filtro tem
     * precedência sobre a fixação do selectedOption). */
    const visibleOptions = computed<any[]>(() => {
        const list = filteredOptions.value;

        if (props.selectedOption === undefined || props.selectedOption === null) return list;

        const alreadyInList = list.some((opt) => valueOf(opt) === valueOf(props.selectedOption));
        if (alreadyInList) return list;

        const term = props.filter ? normalize(searchInput.value) : '';
        if (!matchesTerm(props.selectedOption, term)) return list;

        return [props.selectedOption, ...list];
    });

    /** Altura assumida do viewport antes do primeiro scroll (e em ambiente sem layout). */
    const DEFAULT_VIEWPORT_HEIGHT = 400;

    const isVirtual = computed(() => {
        if (props.virtualScroll !== undefined) return props.virtualScroll;
        return visibleOptions.value.length > props.virtualScrollThreshold;
    });

    const { visibleItems, offsetY, totalHeight, setViewport } = useVirtualList(visibleOptions, {
        itemHeight: computed(() => props.itemHeight),
        enabled: isVirtual
    });

    setViewport(0, DEFAULT_VIEWPORT_HEIGHT);

    /** Distância do fim, em múltiplos da altura do viewport, que dispara a próxima página. */
    const LOAD_MORE_THRESHOLD_VIEWPORTS = 2;

    function shouldLoadMore(target: HTMLElement): boolean {
        if (!isApiMode.value) return false;
        if (!hasMore.value || isLoadingPage.value || loadError.value) return false;

        const viewport = target.clientHeight || DEFAULT_VIEWPORT_HEIGHT;
        const distanceToBottom = target.scrollHeight - target.scrollTop - viewport;

        return distanceToBottom <= viewport * LOAD_MORE_THRESHOLD_VIEWPORTS;
    }

    function onListScroll(event: Event) {
        const target = event.target as HTMLElement;
        setViewport(target.scrollTop, target.clientHeight || DEFAULT_VIEWPORT_HEIGHT);

        // Um scroll real do usuário devolve a capacidade total de auto-preenchimento.
        autoFillCount = 0;

        if (shouldLoadMore(target)) fetchPage(currentPage.value + 1);
    }

    /** Após uma página carregar, busca a próxima automaticamente se o conteúdo
     * ainda não preenche o painel — sem barra de rolagem o evento `scroll` nunca
     * dispara, então o carregamento infinito ficaria travado sem esta checagem.
     * Espera o DOM atualizar (nextTick) para medir alturas reais.
     *
     * Termina porque: (1) cada chamada depende de `hasMore`/`isLoadingPage`/
     * `loadError`, atualizados de forma síncrona por `fetchPage` antes de
     * qualquer nova chamada; e (2) `autoFillCount` limita a MAX_AUTO_FILL_PAGES
     * o número de páginas buscadas sem um scroll real — protegendo contra um
     * servidor que nunca preenche o painel (ou mente sobre `hasMore`).
     *
     * Limitação conhecida: esta função depende de medir `clientHeight` real do
     * painel (guarda em `target.clientHeight <= 0`). Um painel montado dentro de
     * um container escondido com `display: none` não tem layout algum e mede 0
     * — o auto-preenchimento fica pulado até que um scroll real aconteça (o que
     * nunca ocorre enquanto escondido). Prefira `v-if` a `v-show` para painéis
     * que usam este componente, ou aceite que a paginação só avance após o
     * painel se tornar visível e o usuário rolar manualmente. */
    async function fillViewportIfNeeded() {
        if (autoFillCount >= MAX_AUTO_FILL_PAGES) return;

        await nextTick();

        const target = listElem.value;
        if (!target) return;

        // Sem uma altura real de layout (ex.: painel ainda não medido, ou
        // ambiente sem layout como o dos testes) não há como saber se o
        // conteúdo preenche o painel — não arriscamos auto-buscar às cegas.
        if (target.clientHeight <= 0) return;

        if (!shouldLoadMore(target)) return;

        // Só preenchemos automaticamente quando não há barra de rolagem possível
        // (scrollHeight <= clientHeight); com conteúdo rolável, o próprio scroll
        // do usuário já dispara as próximas páginas via onListScroll.
        if (target.scrollHeight > target.clientHeight) return;

        autoFillCount += 1;
        await fetchPage(currentPage.value + 1);
    }

    function valueOf(option: any): any {
        return option?.[props.optionValue];
    }

    function labelOf(option: any): string {
        return option?.[props.optionLabel] ?? '';
    }

    function subLabelOf(option: any): string {
        return option?.[props.optionSubLabel] ?? '';
    }

    function isDisabled(option: any): boolean {
        return option?.[props.optionDisabled] === true;
    }

    function isSelected(option: any): boolean {
        return props.modelValue !== null && props.modelValue !== undefined && valueOf(option) === props.modelValue;
    }

    function optionKey(option: any, index: number): string | number {
        const value = valueOf(option);
        return value !== undefined && value !== null ? value : index;
    }

    function selectOption(option: any) {
        // Rede de segurança independente do reconcile de focusedIndex: nunca agir
        // sobre uma opção inexistente (índice ficou fora da lista já encolhida).
        if (option === null || option === undefined) return;
        if (props.disabled || isDisabled(option)) return;

        const value = valueOf(option);
        emit('update:modelValue', value);
        emit('change', { value, option });
    }

    /** Identificador único desta instância, usado no aria-activedescendant. */
    const instanceId = `max-listbox-${Math.random().toString(36).slice(2, 9)}`;
    const focusedIndex = ref(-1);

    /** Reconcilia o foco quando a lista visível muda (ex.: filtro reduz os
     * resultados). Sem isso um índice obsoleto aponta para uma opção que não
     * existe mais — aria-activedescendant referenciaria um id inexistente e
     * Enter selecionaria `undefined`, apagando silenciosamente a seleção do
     * usuário. Em vez de sempre resetar para -1 (o que perderia o contexto de
     * navegação a cada filtro), o foco é preso (clamp) ao último item ainda
     * existente — mantém a navegação por teclado utilizável — e só cai para -1
     * quando a lista fica vazia. */
    watch(visibleOptions, (list) => {
        if (focusedIndex.value < 0) return;

        if (list.length === 0) focusedIndex.value = -1;
        else if (focusedIndex.value > list.length - 1) focusedIndex.value = list.length - 1;
    });

    const focusedItemId = computed(() => (focusedIndex.value >= 0 ? `${instanceId}-opt-${focusedIndex.value}` : undefined));

    function itemId(index: number): string {
        return `${instanceId}-opt-${index}`;
    }

    function moveFocus(delta: number) {
        const total = visibleOptions.value.length;
        if (total === 0) return;

        const next = focusedIndex.value < 0 ? 0 : focusedIndex.value + delta;
        focusedIndex.value = Math.min(total - 1, Math.max(0, next));
        scrollFocusedIntoView();
    }

    /** Mantém o item em foco visível ao navegar pelo teclado. Como as linhas têm
     * altura fixa (itemHeight), a posição é calculada aritmeticamente em vez de
     * lida do DOM — funciona tanto na lista virtualizada quanto na completa. */
    function scrollFocusedIntoView() {
        const list = listElem.value;
        if (!list || focusedIndex.value < 0) return;

        const top = focusedIndex.value * props.itemHeight;
        const bottom = top + props.itemHeight;
        const viewport = list.clientHeight || DEFAULT_VIEWPORT_HEIGHT;

        if (top < list.scrollTop) list.scrollTop = top;
        else if (bottom > list.scrollTop + viewport) list.scrollTop = bottom - viewport;

        // Atualiza a janela virtual de forma síncrona: setar scrollTop não dispara
        // o evento 'scroll' de imediato (fica pendente até o próximo tick do
        // navegador), então sem isso o item recém-focado poderia não estar
        // renderizado ainda no momento em que aria-activedescendant já aponta
        // para ele — exatamente o cenário que a virtualização precisa evitar.
        // O scroll do mouse continua indo só pelo listener @scroll (onListScroll).
        setViewport(list.scrollTop, viewport);
    }

    function onKeydown(event: KeyboardEvent) {
        if (props.disabled) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                moveFocus(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                moveFocus(-1);
                break;
            case 'Home':
                event.preventDefault();
                focusedIndex.value = 0;
                scrollFocusedIntoView();
                break;
            case 'End':
                event.preventDefault();
                focusedIndex.value = visibleOptions.value.length - 1;
                scrollFocusedIntoView();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (focusedIndex.value >= 0) selectOption(visibleOptions.value[focusedIndex.value]);
                break;
            default:
                break;
        }
    }

    onBeforeUnmount(() => clearTimeout(filterTimer));

    defineExpose({ listElem });
</script>

<style lang="scss">
.max-listbox {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    background-color: var(--background-0);
    border: 1px solid var(--background-300);
    border-radius: 6px;
    overflow: hidden;

    &.is-disabled {
        opacity: 0.6;
        pointer-events: none;
    }
}

.max-listbox-header {
    padding: 10px 12px;
    border-bottom: 1px solid var(--background-300);
}

.max-listbox-title {
    font-weight: 600;
    color: var(--background-750);
}

.max-listbox-filter {
    padding: 8px 10px;
    border-bottom: 1px solid var(--background-300);
}

.max-listbox-filter-input {
    width: 100%;
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--background-300);
    border-radius: 4px;
    background-color: var(--background-0);
    color: var(--background-750);
    font-size: 0.9rem;
    outline: none;

    &::placeholder {
        color: var(--background-600);
    }

    &:focus {
        border-color: var(--blue-600);
    }
}

// Elemento focável e rolável: role="listbox" vive aqui porque é ele quem
// recebe foco/teclado; o <ul> interno é apenas um agrupamento de apresentação.
.max-listbox-list {
    position: relative;
    flex: 1;
    overflow-y: auto;
    outline: none;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
        width: 3px;
        height: 3px;
    }
}

.max-listbox-spacer {
    width: 100%;
}

// Sem virtualização a janela fica em fluxo normal (position: static, o padrão),
// então sua altura real soma a de todos os itens e o scroll do contêiner pai
// funciona naturalmente. Só quando virtualizado ela flutua (is-virtual) sobre
// o spacer que sustenta a altura total, deslocada por translateY.
.max-listbox-window {
    margin: 0;
    padding: 0;
    list-style: none;

    &.is-virtual {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
    }
}

.max-listbox-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 0 12px;

    // Sem virtualização a altura mínima "natural" da linha é 44px (mantém o
    // layout de hoje, já que itemHeight tem esse mesmo valor por padrão). Em
    // modo virtual o <li> já recebe um `height` inline vindo de itemHeight (ver
    // template); min-height precisa seguir o mesmo valor, senão ele vence sobre
    // `height` e desalinha as linhas com o que useVirtualList calculou para
    // totalHeight/offsetY/startIndex.
    min-height: v-bind('`${props.itemHeight}px`');
    cursor: pointer;
    color: var(--background-750);

    &:hover {
        background-color: var(--background-300);
    }

    &.is-focused {
        outline: 2px solid var(--blue-600);
        outline-offset: -2px;
    }

    &.is-selected {
        background-color: var(--blue-600);
        color: var(--background-0);

        .max-listbox-item-sublabel,
        .max-listbox-item-icon {
            color: var(--background-200);
        }

        &:hover {
            background-color: var(--blue-700);
        }

        // .is-focused sozinho usa outline azul (--blue-600), que é a mesma cor
        // do fundo aqui: sem isso, uma linha focada E selecionada não mostra
        // nenhuma indicação de foco para quem navega por teclado.
        &.is-focused {
            outline-color: var(--background-0);
        }
    }

    &.is-disabled {
        opacity: 0.5;
        cursor: not-allowed;

        &:hover {
            background-color: transparent;
        }
    }
}

.max-listbox-item-labels {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.max-listbox-item-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.max-listbox-item-sublabel {
    color: var(--background-600);
    font-size: 0.85rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

// Layout de duas linhas: sublabel abaixo do label em vez de ao lado.
.max-listbox.two-lines {
    .max-listbox-item-labels {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
    }
}

.max-listbox-empty,
.max-listbox-loader,
.max-listbox-error {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 12px;
    color: var(--background-600);
    font-size: 0.9rem;
}

.max-listbox-retry {
    border: none;
    background: none;
    padding: 0;
    color: var(--blue-600);
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.9rem;
}

.max-listbox-footer {
    padding: 10px 12px;
    border-top: 1px solid var(--background-300);
}
</style>
