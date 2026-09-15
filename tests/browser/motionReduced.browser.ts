import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';
import { createApp, defineComponent, h, nextTick, ref, type App, type Ref } from 'vue';
import { createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import axios from 'axios';
import TransitionFade from '../../src/components/TransitionFade.vue';
import MaxTransitionUp from '../../src/components/MaxTransitionUp.vue';
import MaxAiIcon from '../../src/components/MaxAiIcon.vue';
import MaxLoaderIcon from '../../src/components/MaxLoaderIcon.vue';
import MaxAnimateFade from '../../src/components/MaxAnimateFade.vue';
import MaxTransitionFadeLight from '../../src/components/MaxTransitionFadeLight.vue';
import MaxBadge from '../../src/components/MaxBadge.vue';
import MaxBadgeButton from '../../src/components/MaxBadgeButton.vue';
import MaxButton from '../../src/components/MaxButton.vue';
import MaxIconButton from '../../src/components/MaxIconButton.vue';
import MaxLikeButton from '../../src/components/MaxLikeButton.vue';
import MaxCreditCard from '../../src/components/MaxCreditCard.vue';
import MaxInputCheckbox from '../../src/components/MaxInputCheckbox.vue';
import MaxInputOTP from '../../src/components/MaxInputOTP.vue';
import MaxInputRadio from '../../src/components/MaxInputRadio.vue';
import MaxInputSwitch from '../../src/components/MaxInputSwitch.vue';
import MaxInputToggle from '../../src/components/MaxInputToggle.vue';
import MaxBaseInput from '../../src/components/base/MaxBaseInput.vue';
import MaxBaseSpinner from '../../src/components/base/MaxBaseSpinner.vue';
import MaxAccordion from '../../src/components/MaxAccordion.vue';
import MaxAccordionItem from '../../src/components/MaxAccordionItem.vue';
import MaxTabs from '../../src/components/MaxTabs.vue';
import MaxTab from '../../src/components/MaxTab.vue';
import MaxTabItem from '../../src/components/MaxTabItem.vue';
import MaxTabList from '../../src/components/MaxTabList.vue';
import MaxChips from '../../src/components/MaxChips.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxTagSelect from '../../src/components/MaxTagSelect.vue';
import MaxTagsList from '../../src/components/MaxTagsList.vue';
import MaxInputAutoCompleteApi from '../../src/components/MaxInputAutoCompleteApi.vue';
import MaxInputDatePicker from '../../src/components/MaxInputDatePicker.vue';
import MaxInputCode from '../../src/components/MaxInputCode.vue';
import MaxInputCodeToolbar from '../../src/components/MaxInputCodeToolbar.vue';
import MaxInputFileUpload from '../../src/components/MaxInputFileUpload.vue';
import MaxInputFileUploadBig from '../../src/components/MaxInputFileUploadBig.vue';
import MaxInputIconPicker from '../../src/components/MaxInputIconPicker.vue';
import MaxInputMarkdown from '../../src/components/MaxInputMarkdown.vue';
import MaxInputMarkdownToolbar from '../../src/components/MaxInputMarkdownToolbar.vue';
import MaxDrawer from '../../src/components/MaxDrawer.vue';
import MaxModal from '../../src/components/MaxModal.vue';
import MaxImage from '../../src/components/MaxImage.vue';
import MaxPdfView from '../../src/components/MaxPdfView.vue';
import MaxPopover from '../../src/components/MaxPopover.vue';
import MaxToast from '../../src/components/MaxToast.vue';
import MaxLoadScreen from '../../src/components/MaxLoadScreen.vue';
import { useLoadingStore } from '../../src/stores/useLoading.Store';
import { useSystemStore } from '../../src/stores/useSystem.Store';
import { useTopToolbarStore } from '../../src/stores/useTopToolbar.Store';
import MaxDividers from '../../src/components/MaxDividers.vue';
import MaxStats from '../../src/components/MaxStats.vue';
import MaxTable from '../../src/components/MaxTable.vue';
import MaxTableFields from '../../src/components/MaxTableFields.vue';
import MaxBottomMenu from '../../src/components/MaxBottomMenu.vue';
import MaxMenuVerticalItem from '../../src/components/MaxMenuVerticalItem.vue';
import MaxSideMenuMobile from '../../src/components/MaxSideMenuMobile.vue';
import MaxTopMenu from '../../src/components/MaxTopMenu.vue';
import MaxTopMenuSearchBar from '../../src/components/MaxTopMenuSearchBar.vue';
import MaxTopToolbar from '../../src/components/MaxTopToolbar.vue';
import MaxTopToolbarSubmenu from '../../src/components/MaxTopToolbarSubmenu.vue';
import MaxUserAvatar from '../../src/components/MaxUserAvatar.vue';
import MaxUserSection from '../../src/components/MaxUserSection.vue';
import MaxAuthCard from '../../src/components/MaxAuthCard.vue';
import MaxApp from '../../src/components/MaxApp.vue';
import MaxBaseOverlay from '../../src/components/base/MaxBaseOverlay.vue';
import { configureMaxApp } from '../../src/helpers/maxAppConfig';
import { useToastStore } from '../../src/stores/useToast.Store';
import Tooltip from '../../src/directives/tooltip';
import '../../src/themes/all.scss';

type MotionClass = 'keyframe-high-risk' | 'layout-transition' | 'micro-interaction';

const componentSources = import.meta.glob('../../src/components/**/*.vue', {
    eager: true,
    query: '?raw',
    import: 'default'
}) as Record<string, string>;

let app: App | undefined;
let host: HTMLElement | undefined;
let remainingVisible: Ref<boolean> | undefined;
let autonomousVisible: Ref<boolean> | undefined;
let baseOverlayVisible: Ref<boolean> | undefined;
let baseOverlayTarget: HTMLElement | undefined;
let tableLoadingState: Ref<boolean> | undefined;
let tableFieldsLoadingState: Ref<boolean> | undefined;
let autocompleteRequestInterceptor: number | undefined;
let loadingHandle: string | undefined;

function classifiedComponents() {
    return Object.entries(componentSources)
        .filter(([, source]) => /@keyframes|transition(?:\s*:\s*|-duration|-delay)|animation(?:\s*:\s*|-name|-duration)/i.test(source))
        .map(([file, source]) => {
            let category: MotionClass = 'micro-interaction';
            if (/@keyframes/i.test(source)) category = 'keyframe-high-risk';
            else if (/modal|drawer|menu|tab|side|toast|transition/i.test(file) || /transform|height|width|top|bottom|left|right/i.test(source)) category = 'layout-transition';
            return { file, category, source };
        });
}

function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function frames(count: number) {
    for (let index = 0; index < count; index += 1) await nextFrame();
}

type MotionTarget = {
    name: string;
    element: HTMLElement;
    hadAnimation: boolean;
    hadTransition: boolean;
    pseudo?: string;
};

type FixtureContract = {
    targetSelector: string;
    root: 'fixture' | 'body';
};

// Alvos exclusivos dos primeiros overlays: não compartilham uma lista global.
const fixtureContracts: Partial<Record<string, FixtureContract>> = {
    'MaxInputDatePicker.vue': { root: 'body', targetSelector: '.max-datepicker-title-btn' },
    'MaxBaseSpinner.vue': { root: 'fixture', targetSelector: '.max-base-spinner-spin' },
    'MaxTabList.vue': { root: 'fixture', targetSelector: '.max-tab-nav-prev' },
    'MaxChips.vue': { root: 'fixture', targetSelector: '.max-chip-token' },
    'MaxInputAutoCompleteApi.vue': { root: 'body', targetSelector: '.max-icon-spinner.animate-spin' },
    'MaxTabItem.vue': { root: 'body', targetSelector: '[role="tab"]' },
    'MaxInputSelect.vue': { root: 'body', targetSelector: '.max-select-option' },
    'MaxTagSelect.vue': { root: 'body', targetSelector: '.max-select-option' },
    'MaxDrawer.vue': { root: 'body', targetSelector: '.max-drawer[data-motion-owner="drawer-fixture"]' },
    'MaxModal.vue': { root: 'body', targetSelector: '.max-modal-fade-enter-active .max-modal[aria-label="motion-modal"]' },
    'MaxInputIconPicker.vue': { root: 'body', targetSelector: '.max-icon-picker-drawer[aria-label="Escolha um ícone"]' },
    'MaxPdfView.vue': { root: 'fixture', targetSelector: '.viewPDF' },
    'MaxPopover.vue': { root: 'body', targetSelector: '.max-popover-dialog' },
    'MaxLoadScreenTarget.vue': { root: 'body', targetSelector: '#motion-target .max-loader-icon-div' }
    , 'base/MaxBaseOverlay.vue': { root: 'body', targetSelector: '#motion-base-overlay-target .max-base-overlay-enter-active' }
    , 'MaxTable.vue': { root: 'fixture', targetSelector: '.max-table-spinner' }
    , 'MaxTableFields.vue': { root: 'fixture', targetSelector: '.max-table-spinner' }
    , 'MaxMenuVerticalItem.vue': { root: 'fixture', targetSelector: '.max-icon-div' }
    , 'MaxSideMenuMobile.vue': { root: 'body', targetSelector: '.max-side-menu-mobile-drawer[data-motion-owner="side-menu-fixture"]' }
    , 'MaxUserSection.vue': { root: 'body', targetSelector: '.max-user-section-overlay' }
};

/**
 * Escolhe um único nó de produto que já esteja animado/transicionando no modo
 * normal. A referência do mesmo nó é preservada para a checagem em reduce;
 * portanto um descendente neutro não consegue mascarar o alvo declarado.
 */
function captureMotionTarget(name: string, fixture: HTMLElement): MotionTarget {
    const contract = fixtureContracts[name];
    const controlId = fixture.querySelector<HTMLElement>('[aria-controls]')?.getAttribute('aria-controls');
    const tabPanelLabel = fixture.querySelector<HTMLElement>('[role="tabpanel"]')?.getAttribute('aria-labelledby');
    let contracted: HTMLElement[] = [];
    if (name === 'MaxTabItem.vue' && tabPanelLabel) contracted = [document.getElementById(tabPanelLabel)].filter((element): element is HTMLElement => element instanceof HTMLElement);

    else if (contract?.root === 'body' && controlId && name === 'MaxPopover.vue') contracted = [document.getElementById(controlId)].filter((element): element is HTMLElement => element instanceof HTMLElement);

    else if (contract?.root === 'body' && controlId && ['MaxInputSelect.vue', 'MaxTagSelect.vue', 'MaxInputDatePicker.vue', 'MaxInputAutoCompleteApi.vue'].includes(name)) contracted = [...document.querySelectorAll<HTMLElement>(`#${CSS.escape(controlId)} ${contract.targetSelector}`)];

    else if (contract?.root === 'body') contracted = [...document.querySelectorAll<HTMLElement>(contract.targetSelector)];

    else if (contract) contracted = [...fixture.querySelectorAll<HTMLElement>(contract.targetSelector)];

    else contracted = [];

    if (name === 'MaxDrawer.vue' || name === 'MaxSideMenuMobile.vue') expect(contracted, `${name} deve resolver um único Teleport pertencente à fixture`).toHaveLength(1);

    if (name === 'MaxUserAvatar.vue') {
        const avatar = fixture.querySelector<HTMLElement>('.max-user-avatar.removable');
        if (!avatar) throw new Error('MaxUserAvatar.vue não renderizou o estado removível público');
        avatar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        const style = getComputedStyle(avatar, '::after');
        if (style.transitionDuration === '0s') throw new Error('MaxUserAvatar.vue não expôs pseudo de hover');
        return { name, element: avatar, hadAnimation: false, hadTransition: true, pseudo: '::after' };
    }
    for (const element of contracted.length > 0 ? contracted : [fixture, ...fixture.querySelectorAll<HTMLElement>('*')]) {
        const style = getComputedStyle(element);
        const hadAnimation = style.animationDuration !== '0s';
        const hadTransition = style.transitionDuration !== '0s';
        if (!hadAnimation && !hadTransition) continue;
        expect(style.animationIterationCount, `${name} iteração no nó de motion`).toMatch(/^\d|infinite/);
        expect(style.transform, `${name} transform no nó de motion`).toMatch(/^(none|matrix(?:3d)?\()/);
        return { name, element, hadAnimation, hadTransition };
    }
    throw new Error(`${name} não expôs um nó de motion real em no-preference`);
}

function assertReducedTarget(target: MotionTarget) {
    if (!target.element.isConnected) {
        expect(target.element.isConnected, `${target.name} terminou seu lifecycle de saída`).toBe(false);
        return;
    }
    const style = getComputedStyle(target.element, target.pseudo);
    expect(style.animationIterationCount, `${target.name} reduce não pode repetir`).not.toBe('infinite');
    expect(style.transform, `${target.name} transform em reduce`).toMatch(/^(none|matrix(?:3d)?\()/);
    if (target.hadAnimation) expect(style.animationDuration, `${target.name} duração de animação em reduce`).toMatch(/^(0s|1e-05s)$/);
    if (target.hadTransition) expect(style.transitionDuration, `${target.name} duração de transição em reduce`).toMatch(/^(0s|1e-05s)$/);
}

function captureFixtureTargets(fixtures: HTMLElement[]) {
    return fixtures.map((fixture) => captureMotionTarget(fixture.dataset.motionFixture!, fixture));
}

/** Exercita os controles que cada SFC efetivamente publicou antes da leitura CSSOM. */
async function exerciseFixtureStates(fixtures: HTMLElement[]) {
    for (const fixture of fixtures) {
        const name = fixture.dataset.motionFixture!;
        expect(fixture.isConnected, `${name} deve iniciar montado`).toBe(true);
        for (const control of fixture.querySelectorAll<HTMLElement>('button, input, select, textarea, [role="button"], [role="tab"]')) {
            control.dispatchEvent(new Event('focus', { bubbles: true }));
            control.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        }
    }
    await nextTick();
    await frames(2);
}

/** A limpeza é registrada por fixture, mesmo quando a árvore usa providers compartilhados. */
function assertFixtureCleanup(fixtures: HTMLElement[]) {
    app?.unmount();
    app = undefined;
    for (const fixture of fixtures) expect(fixture.isConnected, `${fixture.dataset.motionFixture} deve remover listeners/DOM ao desmontar`).toBe(false);
}

async function emulateReducedMotion(value: 'reduce' | 'no-preference') {
    const session = cdp() as unknown as { send(command: string, params?: unknown): Promise<unknown> };
    await session.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value }]
    });
    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(value === 'reduce');
}

async function mountRealComponents() {
    host = document.createElement('div');
    document.body.append(host);
    const components = classifiedComponents();
    app = createApp({
        // Três SFCs reais cobrem as categorias do inventário: keyframe,
        // transição de layout e microinteração. Seus estilos efetivos são
        // medidos abaixo; o inventário conserva os 59 itens auditáveis.
        render: () => h('div', [
            h('section', { 'data-component': 'MaxAiIcon.vue', 'data-category': 'keyframe-high-risk' }, [h(MaxAiIcon)]),
            h('section', { 'data-component': 'TransitionFade.vue', 'data-category': 'layout-transition' }, [h(TransitionFade, null, { default: () => h('span', { class: 'fade-enter-active' }) })]),
            h('section', { 'data-component': 'MaxTransitionUp.vue', 'data-category': 'layout-transition' }, [h(MaxTransitionUp, null, { default: () => h('span', { class: 'slide-vertical-animation-enter-active' }) })])
        ])
    });
    app.directive('tooltip', Tooltip);
    app.use(createPinia());
    app.mount(host);
    await nextFrame();
    await nextFrame();
    return components;
}

/**
 * Família A do diagnóstico: cada alvo abaixo é o SFC de produção, com suas
 * props e slots públicos. Não há filho substituído nem classe CSS injetada.
 */
async function mountAutonomousFixtures() {
    host = document.createElement('div');
    host.style.width = '720px';
    document.body.append(host);
    const visible = ref(true);
    autonomousVisible = visible;
    app = createApp({
        setup: () => () => h('main', { 'data-motion-family': 'autonomous' }, [
            h('article', { 'data-motion-fixture': 'MaxAiIcon.vue' }, [h(MaxAiIcon)]),
            h('article', { 'data-motion-fixture': 'MaxLoaderIcon.vue' }, [h(MaxLoaderIcon)]),
            h('article', { 'data-motion-fixture': 'MaxBaseSpinner.vue' }, [h(MaxBaseSpinner, { animationDuration: '2s' })]),
            h('article', { 'data-motion-fixture': 'MaxAnimateFade.vue' }, [h(MaxAnimateFade, { show: visible.value, appear: true }, { default: () => h('button', 'Fade') })]),
            h('article', { 'data-motion-fixture': 'MaxTransitionFadeLight.vue' }, [h(MaxTransitionFadeLight, null, { default: () => visible.value ? h('button', 'Fade light') : null })]),
            h('article', { 'data-motion-fixture': 'TransitionFade.vue' }, [h(TransitionFade, null, { default: () => visible.value ? h('button', 'Fade') : null })]),
            h('article', { 'data-motion-fixture': 'MaxTransitionUp.vue' }, [h(MaxTransitionUp, null, { default: () => visible.value ? h('button', 'Up') : null })]),
            h('article', { 'data-motion-fixture': 'MaxBadge.vue' }, [h(MaxBadge, { label: 'Status', status: 'success' })]),
            h('article', { 'data-motion-fixture': 'MaxBadgeButton.vue' }, [h(MaxBadgeButton, { label: 'Status' })]),
            h('article', { 'data-motion-fixture': 'MaxButton.vue' }, [h(MaxButton, { label: 'Salvar', severity: 'secondary' })]),
            h('article', { 'data-motion-fixture': 'MaxIconButton.vue' }, [h(MaxIconButton, { icon: 'mdi:check', ariaLabel: 'Confirmar' })]),
            h('article', { 'data-motion-fixture': 'MaxLikeButton.vue' }, [h(MaxLikeButton, { modelValue: 1 })]),
            h('article', { 'data-motion-fixture': 'MaxCreditCard.vue' }, [h(MaxCreditCard, { number: '4111111111111111', cvv: '123', name: 'Teste', date: '1230', side: 'back' })]),
            h('article', { 'data-motion-fixture': 'MaxInputCheckbox.vue' }, [h(MaxInputCheckbox, { modelValue: false, label: 'Aceito' })]),
            h('article', { 'data-motion-fixture': 'MaxInputOTP.vue' }, [h(MaxInputOTP, { modelValue: '', label: 'Código' })]),
            h('article', { 'data-motion-fixture': 'MaxInputRadio.vue' }, [h(MaxInputRadio, { modelValue: 'a', value: 'a', name: 'escolha', label: 'Opção A' })]),
            h('article', { 'data-motion-fixture': 'MaxInputSwitch.vue' }, [h(MaxInputSwitch, { modelValue: true, label: 'Ativo' })]),
            h('article', { 'data-motion-fixture': 'MaxInputToggle.vue' }, [h(MaxInputToggle, { modelValue: true, label: 'Ativo', trueLabel: 'Sim', falseLabel: 'Não' })]),
            h('article', { 'data-motion-fixture': 'MaxBaseInput.vue' }, [h(MaxBaseInput, { modelValue: 'texto' })])
        ])
    });
    app.directive('tooltip', Tooltip);
    app.use(createPinia());
    app.mount(host);
    await nextTick();
    await frames(2);
}

/**
 * Família B: estes SFCs só existem corretamente dentro dos providers de
 * produção. A árvore monta o accordion e o sistema completo de tabs, sem
 * substituir os filhos que possuem o estilo e o lifecycle auditados.
 */
async function mountStructuralFixtures() {
    host = document.createElement('div');
    host.style.width = '280px';
    document.body.append(host);
    const accordionOpen = ref<string | undefined>();
    const selectedTab = ref<string | number>('first');
    app = createApp({
        setup: () => () => h('main', { 'data-motion-family': 'structural' }, [
            h('article', { 'data-motion-fixture': 'MaxAccordionItem.vue' }, [
                h(MaxAccordion, {
                    modelValue: accordionOpen.value,
                    'onUpdate:modelValue': (value: string | undefined) => { accordionOpen.value = value; }
                }, {
                    default: () => h(MaxAccordionItem, { value: 'details', title: 'Detalhes' }, { default: () => h('p', 'Conteúdo') })
                })
            ]),
            h('article', { 'data-motion-fixture': 'MaxTab.vue' }, [
                h(MaxTabs, {
                    id: 'motion-tabs', scrollable: true, modelValue: selectedTab.value,
                    'onUpdate:modelValue': (value: string | number) => { selectedTab.value = value; }
                }, {
                    default: () => [
                        h('div', { 'data-motion-fixture': 'MaxTabList.vue' }, [
                            h(MaxTabList, null, {
                                default: () => [
                                    h(MaxTab, { value: 'first' }, { default: () => 'Primeira aba' }),
                                    h('div', { 'data-motion-fixture': 'MaxTabItem.vue' }, [h(MaxTabItem, { value: 'first', title: 'Primeira aba com título longo' }, { default: () => h('p', 'Primeiro painel') })]),
                                    h(MaxTabItem, { value: 'second', title: 'Segunda aba com título longo' }, { default: () => h('p', 'Segundo painel') })
                                ]
                            })
                        ])
                    ]
                })
            ])
        ])
    });
    app.directive('tooltip', Tooltip);
    app.use(createPinia());
    app.mount(host);
    await nextTick();
    await frames(3);
    host.querySelector<HTMLElement>('.max-accordion-item-header')?.click();
    host.querySelector<HTMLElement>('[role="tab"]:not([aria-selected="true"])')?.click();
    await nextTick();
    await frames(3);
}

async function mountSelectFixtures() {
    host = document.createElement('div');
    host.style.width = '720px';
    document.body.append(host);
    const chips = ref(['Inicial']);
    const selected = ref('one');
    const tag = ref('one');
    const tags = ref([{ name: 'Primeira', value: 'one', backgroundColor: '#1463c3' }]);
    const options = [
        { name: 'Primeira', value: 'one', backgroundColor: '#1463c3' },
        { name: 'Segunda', value: 'two', backgroundColor: '#167c4c' },
        { name: 'Terceira', value: 'three', backgroundColor: '#8f3e9f' }
    ];
    app = createApp({
        setup: () => () => h('main', { 'data-motion-family': 'selects' }, [
            h('article', { 'data-motion-fixture': 'MaxChips.vue' }, [h(MaxChips, { modelValue: chips.value, 'onUpdate:modelValue': (value) => { chips.value = value.map(String); } })]),
            h('article', { 'data-motion-fixture': 'MaxInputSelect.vue' }, [h(MaxInputSelect, { modelValue: selected.value, options, filter: true, 'onUpdate:modelValue': (value: string) => { selected.value = value; } })]),
            h('article', { 'data-motion-fixture': 'MaxTagSelect.vue' }, [h(MaxTagSelect, { modelValue: tag.value, options, 'onUpdate:modelValue': (value: string) => { tag.value = value; } })]),
            h('article', { 'data-motion-fixture': 'MaxTagsList.vue' }, [h(MaxTagsList, { modelValue: tags.value, options, 'onUpdate:modelValue': (value) => { if (Array.isArray(value)) tags.value = value; } })])
        ])
    });
    app.directive('tooltip', Tooltip);
    app.use(createPinia());
    app.mount(host);
    await nextTick();
    await frames(3);
    for (const trigger of host.querySelectorAll<HTMLElement>('.max-select, .max-tag-select, .max-chips-container')) trigger.click();
    await nextTick();
    await frames(3);
}

async function mountUserSectionFixture() {
    host = document.createElement('div');
    document.body.append(host);
    app = createApp({ render: () => h(MaxUserSection, { name: 'Usuário', userId: 1, items: [{ label: 'Perfil', icon: 'mdi:account' }] }) });
    app.directive('tooltip', Tooltip);
    app.use(createPinia());
    app.mount(host);
    await nextTick();
}

/**
 * Famílias C--G: a árvore mantém cada SFC de produção como filho real. O
 * router de memória e a Pinia são providers de produção; os dados abaixo são
 * somente a entrada pública mínima de cada componente, sem substituir filhos.
 */
async function mountRemainingFixtures() {
    host = document.createElement('div');
    host.style.cssText = 'width: 960px; min-height: 720px; position: relative';
    document.body.append(host);
    baseOverlayTarget = document.createElement('div');
    baseOverlayTarget.id = 'motion-base-overlay-target';
    document.body.append(baseOverlayTarget);
    const visible = ref(true);
    const tableLoading = ref(false);
    const tableFieldsLoading = ref(false);
    tableLoadingState = tableLoading;
    tableFieldsLoadingState = tableFieldsLoading;
    const overlayVisible = ref(false);
    baseOverlayVisible = overlayVisible;
    remainingVisible = visible;
    const date = ref('2026-09-15');
    const fileList = ref<any[]>([]);
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/', name: 'motion-home', component: defineComponent({ render: () => h('div') }) }]
    });
    // Evita I/O de boot: os providers reais recebem a configuração pública
    // sem rotas remotas, como uma aplicação consumidora sem backend próprio.
    configureMaxApp({ routeMenus: undefined, routeUser: undefined, routeLogin: undefined, routeIcons: undefined });
    // Transporte local pendente: o componente continua usando seu caminho
    // produtivo (Ziggy + axios + spinner), sem substituir o SFC nem o CSS.
    (globalThis as any).Ziggy = {
        url: window.location.origin,
        port: null,
        defaults: {},
        routes: { 'motion-autocomplete': { uri: 'motion-autocomplete', methods: ['GET', 'HEAD'] } }
    };
    autocompleteRequestInterceptor = axios.interceptors.request.use(() => new Promise(() => {}));
    const columns = [{ field: 'name', header: 'Nome' }];
    const menuItems = [{ id: 'home', label: 'Início', details: { icon: 'mdi:home', tooltip: 'Início', route: 'motion-home' } }];
    const fixture = (name: string, child: ReturnType<typeof h>) => h('article', { 'data-motion-fixture': name }, [child]);
    const ToastProducer = defineComponent({
        setup() {
            useToastStore().add({ title: 'Movimento', message: 'Notificação real para transição', duration: 0 });
            return () => null;
        }
    });
    const LoadingProducer = defineComponent({
        setup() {
            loadingHandle = useLoadingStore().start({ key: 'motion-loader', target: '#motion-target', status: 'loading', message: 'Carregando' });
            return () => null;
        }
    });
    const SideMenuProducer = defineComponent({ setup: () => { useSystemStore().side_menu_open = true; return () => null; } });
    const ToolbarProducer = defineComponent({ setup: () => { const toolbar = useTopToolbarStore(); toolbar.show = true; toolbar.items = [{ label: 'Ferramentas', icon: 'mdi:tools', items: [{ label: 'Ação' }] }]; return () => null; } });
    app = createApp({
        setup: () => () => h('main', { 'data-motion-family': 'remaining' }, [
            fixture('MaxInputAutoCompleteApi.vue', h(MaxInputAutoCompleteApi, { modelValue: 'm', route: 'motion-autocomplete', data: { fixture: true }, optionLabel: 'label', delay: 0 })),
            fixture('MaxInputDatePicker.vue', h(MaxInputDatePicker, { modelValue: date.value, 'onUpdate:modelValue': (value: string) => { date.value = value; } })),
            fixture('MaxInputCode.vue', h(MaxInputCode, { modelValue: 'const motion = true;', toolbar: true, height: '180px' })),
            fixture('MaxInputCodeToolbar.vue', h(MaxInputCodeToolbar, { language: 'typescript', languages: [{ label: 'TypeScript', value: 'typescript' }], wordWrap: false, minimap: false, isFullscreen: false })),
            fixture('MaxInputFileUpload.vue', h(MaxInputFileUpload, { modelValue: fileList.value, label: 'Arquivo', uploading: true })),
            fixture('MaxInputFileUploadBig.vue', h(MaxInputFileUploadBig, { label: 'Enviar arquivo' })),
            fixture('MaxInputIconPicker.vue', h(MaxInputIconPicker, { modelValue: 'mdi:home', listUrl: '', svgUrl: '' })),
            fixture('MaxInputMarkdown.vue', h(MaxInputMarkdown, { modelValue: '<p>Texto</p>', minHeight: '120px' })),
            fixture('MaxInputMarkdownToolbar.vue', h(MaxInputMarkdownToolbar, { editor: null })),
            fixture('MaxDrawer.vue', h(MaxDrawer, { visible: visible.value, ariaLabel: 'motion-drawer', showCloseIcon: true, 'data-motion-owner': 'drawer-fixture' }, { default: () => h('button', 'Conteúdo') })),
            fixture('MaxModal.vue', h(MaxModal, { noHeader: true, ariaLabel: 'motion-modal', modelValue: false }, { button: () => h('button', 'Abrir modal'), default: () => h('p', 'Conteúdo') })),
            fixture('MaxImage.vue', h(MaxImage, { src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/%3E', alt: 'Imagem', preview: true })),
            fixture('MaxPdfView.vue', h(MaxPdfView, { file: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvUmVzb3VyY2VzIDw8ID4+IC9Db250ZW50cyA0IDAgUiA+PgplbmRvYmoKNCAwIG9iago8PCAvTGVuZ3RoIDAgPj4Kc3RyZWFtCgplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDIxOSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDUgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjI2OAolJUVPRgo=' })),
            fixture('MaxPopover.vue', h(MaxPopover, { title: 'Informações', label: 'Abrir' }, { default: () => h('p', 'Conteúdo') })),
            fixture('MaxToast.vue', h(MaxToast)),
            h(ToastProducer),
            h('div', { id: 'motion-target', style: 'min-height: 40px' }),
            fixture('MaxLoadScreenTarget.vue', h(MaxLoadScreen)),
            h(LoadingProducer),
            fixture('base/MaxBaseOverlay.vue', h(MaxBaseOverlay, {
                visible: overlayVisible.value,
                'onUpdate:visible': (value: boolean) => { overlayVisible.value = value; },
                appendTo: '#motion-base-overlay-target',
                ariaLabel: 'Camada'
            }, { default: () => h('p', 'Camada') })),
            fixture('MaxDividers.vue', h(MaxDividers, { resizable: true }, { first: () => h('p', 'Primeiro'), second: () => h('p', 'Segundo') })),
            fixture('MaxStats.vue', h(MaxStats, { items: [{ label: 'Total', value: '12', icon: 'mdi:chart-line', color: '#1463c3' }] })),
            fixture('MaxTable.vue', h(MaxTable, { value: [{ id: 1, name: 'Linha' }], columns, scrollable: true, loading: tableLoading.value })),
            fixture('MaxTableFields.vue', h(MaxTableFields, { list: [{ id: 1, name: 'Linha' }], columns, loading: tableFieldsLoading.value })),
            fixture('MaxBottomMenu.vue', h(MaxBottomMenu, { tabs: [{ name: 'motion-home', label: 'Início', icon: 'mdi:home' }], showLabels: true })),
            fixture('MaxMenuVerticalItem.vue', h(MaxMenuVerticalItem, { items: menuItems })),
            fixture('MaxSideMenuMobile.vue', h(MaxSideMenuMobile, { visible: visible.value, items: menuItems, 'data-motion-owner': 'side-menu-fixture' })),
            h(SideMenuProducer),
            fixture('MaxTopMenu.vue', h(MaxTopMenu, { addItems: [] })),
            fixture('MaxTopMenuSearchBar.vue', h(MaxTopMenuSearchBar, { screen: 'mobile' })),
            fixture('MaxTopToolbar.vue', h(MaxTopToolbar)),
            h(ToolbarProducer),
            fixture('MaxTopToolbarSubmenu.vue', h(MaxTopToolbarSubmenu, { id: 'motion-submenu', parentId: 'motion-parent', level: 0, items: [{ label: 'Subação', icon: 'mdi:arrow-right' }] })),
            fixture('MaxUserAvatar.vue', h(MaxUserAvatar, { name: 'Usuário', remove: true, imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E' })),
            fixture('MaxUserSection.vue', h(MaxUserSection, { name: 'Usuário', userId: 1 })),
            fixture('MaxAuthCard.vue', h(MaxAuthCard, { title: 'Entrar' })),
            fixture('MaxApp.vue', h(MaxApp, { screen: 'desktop' }, { blank: () => h('p', 'Aplicação') }))
        ])
    });
    app.directive('tooltip', Tooltip);
    app.use(createPinia());
    app.use(router);
    await router.push('/');
    await router.isReady();
    app.mount(host);
    await nextTick();
    await frames(12);
    for (const trigger of host.querySelectorAll<HTMLElement>('button, input, [role="button"]')) trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    host.querySelector<HTMLElement>('[data-motion-fixture="MaxImage.vue"] img')?.click();
    host.querySelector<HTMLElement>('[data-motion-fixture="MaxPopover.vue"] button')?.click();
    await frames(2);
}

afterEach(async () => {
    app?.unmount();
    host?.remove();
    app = undefined;
    host = undefined;
    remainingVisible = undefined;
    autonomousVisible = undefined;
    baseOverlayVisible = undefined;
    baseOverlayTarget?.remove();
    baseOverlayTarget = undefined;
    tableLoadingState = undefined;
    tableFieldsLoadingState = undefined;
    if (autocompleteRequestInterceptor !== undefined) axios.interceptors.request.eject(autocompleteRequestInterceptor);
    autocompleteRequestInterceptor = undefined;
    await emulateReducedMotion('no-preference');
});

describe('R18/E10-09 — prefers-reduced-motion no Chromium real', () => {
    it('classifica cada SFC com motion e confirma cobertura explícita no módulo carregado pelo Chromium', () => {
        const components = classifiedComponents();
        expect(components).toHaveLength(59);
        expect(new Set(components.map(({ category }) => category))).toEqual(new Set<MotionClass>([
            'keyframe-high-risk', 'layout-transition', 'micro-interaction'
        ]));
        for (const { file, source } of components) expect(source, `${file} não declara política reduced-motion`).toMatch(/prefers-reduced-motion/i);

    });

    it('mede duração, iteração e transform computados para todos os componentes classificados em reduce e no-preference', async () => {
        await emulateReducedMotion('no-preference');
        await mountRealComponents();
        const targets = [
            host!.querySelector<HTMLElement>('.max-ai-icon')!,
            host!.querySelector<HTMLElement>('.fade-enter-active')!,
            host!.querySelector<HTMLElement>('.slide-vertical-animation-enter-active')!
        ];
        expect(targets).not.toContain(null);
        const normal = targets.map((target) => getComputedStyle(target));
        expect(normal).toHaveLength(3);
        for (const style of normal) {
            expect(style.animationDuration).not.toBe('1e-05s');
            expect(style.transitionDuration).not.toBe('1e-05s');
            expect(style.transform).toMatch(/^(none|matrix\()/);
        }

        await emulateReducedMotion('reduce');
        await nextFrame();
        const reduced = targets.map((target) => getComputedStyle(target));
        expect(reduced).toHaveLength(3);
        for (const style of reduced) {
            expect(style.animationDuration).toBe('1e-05s');
            expect(style.animationIterationCount).toBe('1');
            expect(style.transitionDuration).toBe('1e-05s');
            expect(style.transform).toMatch(/^(none|matrix\()/);
        }
    });

    it('preserva o lifecycle de entrada e saída das primitivas reais com reduce', async () => {
        await emulateReducedMotion('reduce');
        host = document.createElement('div');
        document.body.append(host);
        const visible = ref(false);
        const Fixture = defineComponent({
            setup: () => () => h('div', [
                h(TransitionFade, null, { default: () => visible.value ? h('span', { id: 'fade-target' }, 'fade') : null }),
                h(MaxTransitionUp, null, { default: () => visible.value ? h('span', { id: 'slide-target' }, 'slide') : null })
            ])
        });
        app = createApp(Fixture);
        app.mount(host);
        visible.value = true;
        await nextTick();
        await nextFrame();
        await nextFrame();
        expect(host.querySelector('#fade-target')).not.toBeNull();
        expect(host.querySelector('#slide-target')).not.toBeNull();
        expect(getComputedStyle(host.querySelector('#slide-target')!).animationDuration).toBe('1e-05s');
        expect(getComputedStyle(host.querySelector('#slide-target')!).transform).toBe('none');
        host.querySelector('#fade-target')?.dispatchEvent(new TransitionEvent('transitionend', { propertyName: 'opacity' }));
        host.querySelector('#slide-target')?.dispatchEvent(new AnimationEvent('animationend', { animationName: 'slide-up-in-reduced' }));
        await nextTick();
        visible.value = false;
        await nextTick();
        // Espera frames de pintura reais; não injeta transitionend/animationend
        // nem usa timer. Assim o Chromium entrega o término nativo ao Vue.
        await frames(12);
        expect(host.querySelector('#fade-target')).toBeNull();
        expect(host.querySelector('#slide-target')).toBeNull();
    });

    it('monta e mede os 19 SFCs autônomos reais da família A nos dois modos', async () => {
        await emulateReducedMotion('no-preference');
        await mountAutonomousFixtures();
        const fixtures = [...host!.querySelectorAll<HTMLElement>('[data-motion-fixture]')];
        expect(fixtures).toHaveLength(19);

        await exerciseFixtureStates(fixtures);
        // MaxTransitionFadeLight só atribui sua classe de transição durante o
        // lifecycle Vue; alternar o slot produz o alvo real antes do CSSOM.
        autonomousVisible!.value = false;
        await nextTick();
        await nextFrame();
        const targets = captureFixtureTargets(fixtures);

        await emulateReducedMotion('reduce');
        await frames(2);
        for (const target of targets) assertReducedTarget(target);
        assertFixtureCleanup(fixtures);
    });

    it('monta os quatro SFCs estruturais com seus providers reais e alterna seus estados', async () => {
        await emulateReducedMotion('no-preference');
        await mountStructuralFixtures();
        const fixtures = [...host!.querySelectorAll<HTMLElement>('[data-motion-fixture]')];
        expect(fixtures.map((fixture) => fixture.dataset.motionFixture).sort()).toEqual([
            'MaxAccordionItem.vue', 'MaxTab.vue', 'MaxTabItem.vue', 'MaxTabList.vue'
        ]);
        expect(host!.querySelector('.max-accordion-item-content')).not.toBeNull();
        expect(host!.querySelector('[role="tabpanel"]')).not.toBeNull();
        await exerciseFixtureStates(fixtures);
        const targets = captureFixtureTargets(fixtures);

        await emulateReducedMotion('reduce');
        await frames(2);
        for (const target of targets) assertReducedTarget(target);
        assertFixtureCleanup(fixtures);
    });

    it('monta os quatro seletores reais, abre os overlays e mede os dois modos', async () => {
        await emulateReducedMotion('no-preference');
        await mountSelectFixtures();
        const fixtures = [...host!.querySelectorAll<HTMLElement>('[data-motion-fixture]')];
        expect(fixtures.map((fixture) => fixture.dataset.motionFixture).sort()).toEqual([
            'MaxChips.vue', 'MaxInputSelect.vue', 'MaxTagSelect.vue', 'MaxTagsList.vue'
        ]);
        expect(document.body.querySelector('[role="listbox"]')).not.toBeNull();
        await exerciseFixtureStates(fixtures);
        const targets = captureFixtureTargets(fixtures);
        await emulateReducedMotion('reduce');
        await frames(2);
        for (const target of targets) assertReducedTarget(target);
        assertFixtureCleanup(fixtures);
    });

    it('monta, abre, reduz e remove o overlay real de MaxUserSection', async () => {
        await emulateReducedMotion('no-preference');
        await mountUserSectionFixture();
        const trigger = host!.querySelector<HTMLElement>('.user-profile-trigger')!;
        trigger.click();
        await nextTick();
        await frames(2);
        const menuId = trigger.getAttribute('aria-controls');
        expect(menuId).toBeTruthy();
        const overlay = document.getElementById(menuId!) as HTMLElement | null;
        expect(overlay).not.toBeNull();
        const style = getComputedStyle(overlay!);
        expect(style.transitionDuration).not.toBe('0s');
        await emulateReducedMotion('reduce');
        await frames(2);
        expect(getComputedStyle(overlay!).transitionDuration).toMatch(/^(0s|1e-05s)$/);
        trigger.click();
        await nextTick();
        await frames(12);
        expect(document.body.querySelector('.max-user-section-overlay')).toBeNull();
    });

    it('monta os 32 SFCs restantes das famílias C--G com providers e mede os dois modos', async () => {
        await emulateReducedMotion('no-preference');
        await mountRemainingFixtures();
        const fixtures = [...host!.querySelectorAll<HTMLElement>('[data-motion-fixture]')];
        expect(fixtures).toHaveLength(32);
        const expected = [
            'MaxApp.vue', 'MaxAuthCard.vue', 'MaxBottomMenu.vue', 'MaxDividers.vue', 'MaxDrawer.vue', 'MaxImage.vue',
            'MaxInputAutoCompleteApi.vue', 'MaxInputCode.vue', 'MaxInputCodeToolbar.vue', 'MaxInputDatePicker.vue',
            'MaxInputFileUpload.vue', 'MaxInputFileUploadBig.vue', 'MaxInputIconPicker.vue', 'MaxInputMarkdown.vue',
            'MaxInputMarkdownToolbar.vue', 'MaxLoadScreenTarget.vue', 'MaxMenuVerticalItem.vue', 'MaxModal.vue', 'MaxPdfView.vue',
            'MaxPopover.vue', 'MaxSideMenuMobile.vue', 'MaxStats.vue', 'MaxTable.vue', 'MaxTableFields.vue', 'MaxToast.vue',
            'MaxTopMenu.vue', 'MaxTopMenuSearchBar.vue', 'MaxTopToolbar.vue', 'MaxTopToolbarSubmenu.vue', 'MaxUserAvatar.vue',
            'MaxUserSection.vue', 'base/MaxBaseOverlay.vue'
        ];
        expect(fixtures.map((fixture) => fixture.dataset.motionFixture).sort()).toEqual(expected);
        await exerciseFixtureStates(fixtures);
        const popoverTarget = captureMotionTarget(
            'MaxPopover.vue',
            fixtures.find((fixture) => fixture.dataset.motionFixture === 'MaxPopover.vue')!
        );
        const popoverTrigger = host!.querySelector<HTMLElement>('[data-motion-fixture="MaxPopover.vue"] button[aria-controls]')!;
        const popoverId = popoverTrigger.getAttribute('aria-controls')!;
        expect(popoverTrigger.getAttribute('aria-expanded')).toBe('true');
        document.getElementById(popoverId)?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await nextTick();
        await frames(12);
        expect(popoverTrigger.getAttribute('aria-expanded')).toBe('false');
        expect(document.getElementById(popoverId)).toBeNull();
        host!.querySelector<HTMLElement>('[data-motion-fixture="MaxInputDatePicker.vue"] .max-datepicker-input')?.click();
        await nextTick();
        await frames(2);
        expect(document.body.querySelector('.max-datepicker-panel')).not.toBeNull();
        const dateTarget = captureMotionTarget(
            'MaxInputDatePicker.vue',
            fixtures.find((fixture) => fixture.dataset.motionFixture === 'MaxInputDatePicker.vue')!
        );
        host!.querySelector<HTMLElement>('[data-motion-fixture="MaxInputIconPicker.vue"] .icon-picker-trigger')?.click();
        await nextTick();
        await frames(2);
        expect(document.body.querySelector('.max-icon-picker-drawer')).not.toBeNull();
        baseOverlayVisible!.value = true;
        await nextTick();
        await nextFrame();
        const baseOverlayMotionTarget = captureMotionTarget(
            'base/MaxBaseOverlay.vue',
            fixtures.find((fixture) => fixture.dataset.motionFixture === 'base/MaxBaseOverlay.vue')!
        );
        const autocompleteInput = host!.querySelector<HTMLInputElement>('[data-motion-fixture="MaxInputAutoCompleteApi.vue"] .max-autocomplete-input')!;
        autocompleteInput.value = 'movimento';
        autocompleteInput.dispatchEvent(new Event('input', { bubbles: true }));
        await nextTick();
        await frames(2);
        const autocompleteTarget = captureMotionTarget(
            'MaxInputAutoCompleteApi.vue',
            fixtures.find((fixture) => fixture.dataset.motionFixture === 'MaxInputAutoCompleteApi.vue')!
        );
        host!.querySelector<HTMLElement>('[data-motion-fixture="MaxModal.vue"] .max-modal-trigger')?.click();
        await nextTick();
        await nextFrame();
        expect(document.body.querySelector('.max-modal')).not.toBeNull();
        const modalTarget = captureMotionTarget(
            'MaxModal.vue',
            fixtures.find((fixture) => fixture.dataset.motionFixture === 'MaxModal.vue')!
        );
        tableLoadingState!.value = true;
        tableFieldsLoadingState!.value = true;
        await nextTick();
        await frames(2);
        expect(host!.querySelector('[data-motion-fixture="MaxTable.vue"] .max-table-spinner')).not.toBeNull();
        expect(host!.querySelector('[data-motion-fixture="MaxTableFields.vue"] .max-table-spinner')).not.toBeNull();
        const targets = [
            dateTarget,
            popoverTarget,
            autocompleteTarget,
            modalTarget,
            baseOverlayMotionTarget,
            ...captureFixtureTargets(fixtures.filter((fixture) => !['MaxInputDatePicker.vue', 'MaxInputAutoCompleteApi.vue', 'MaxModal.vue', 'MaxPopover.vue', 'MaxUserSection.vue', 'base/MaxBaseOverlay.vue'].includes(fixture.dataset.motionFixture!)))
        ];
        // Estados de overlay reais: preview, popover e toast foram ativados
        // acima por seus gatilhos/store; drawer e base overlay saem pelo mesmo
        // estado público que os exibiu.
        expect(document.body.querySelector('.max-image-modal')).not.toBeNull();
        expect(document.body.querySelector('.max-popover-dialog')).toBeNull();
        expect(host!.querySelector('.max-toast-item')).not.toBeNull();
        remainingVisible!.value = false;
        useSystemStore().side_menu_open = false;
        await nextTick();
        // O Drawer declara saída de 300ms; aguardar a transição real evita
        // confundir um frame de leave com um Teleport já limpo.
        await new Promise<void>((resolve) => window.setTimeout(resolve, 350));
        expect(document.body.querySelector('.max-drawer-mask')).toBeNull();
        expect(document.body.querySelector('.max-drawer[data-motion-owner="side-menu-fixture"]')).toBeNull();
        expect(baseOverlayTarget!.querySelector('.max-base-overlay')).toBeNull();
        const loading = useLoadingStore();
        expect(document.querySelector('#motion-target .load-screen')).not.toBeNull();
        expect(document.querySelector('#motion-target .max-loader-icon-div')).not.toBeNull();
        if (loadingHandle) loading.end(loadingHandle, { done_duration: 0 });
        loading.reset();
        await nextTick();
        expect(document.querySelector('#motion-target .load-screen')).toBeNull();
        await emulateReducedMotion('reduce');
        await frames(3);
        for (const target of targets) assertReducedTarget(target);
        tableLoadingState!.value = false;
        tableFieldsLoadingState!.value = false;
        await nextTick();
        await frames(2);
        expect(host!.querySelector('[data-motion-fixture="MaxTable.vue"] .max-table-spinner')).toBeNull();
        expect(host!.querySelector('[data-motion-fixture="MaxTableFields.vue"] .max-table-spinner')).toBeNull();
        assertFixtureCleanup(fixtures);
    });
});
