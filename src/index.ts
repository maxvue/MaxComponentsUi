// Importação essencial do CSS gerado pelo UnoCSS. O vite-plugin-css-injected-by-js injeta
// estes estilos na tag <head> em tempo de import no runtime do consumidor. NÃO REMOVER.
import 'virtual:uno.css';

import { defineAsyncComponent } from 'vue';
import PrimeVue from 'primevue/config';

import { MaxStyle } from './styles/style';
import ptBR from './locales/pt-br';

// NÃO REMOVER O INPUTBASE DO INDEX.TS
export { default as InputBase } from './components/InputBase.vue';

export { default as MaxIcon } from './components/MaxIcon.vue';
export { default as MaxAiIcon } from './components/MaxAiIcon.vue';
export { default as MaxIconAi } from './components/MaxAiIcon.vue';
export { default as MaxDoneIcon } from './components/MaxDoneIcon.vue';
export { default as MaxWaitIcon } from './components/MaxWaitIcon.vue';
export { default as MaxErrorIcon } from './components/MaxErrorIcon.vue';
export { default as MaxGrid } from './components/MaxGrid.vue';
export { default as MaxDividers } from './components/MaxDividers.vue';
export { default as MaxDivider } from './components/MaxDividers.vue';
export type { MaxDividersProps } from './components/MaxDividers.vue';

// Button
export { default as MaxButton } from './components/MaxButton.vue';
export { default as MaxIconButton } from './components/MaxIconButton.vue';
export { default as MaxIconConfirm } from './components/MaxIconConfirm.vue';
export { default as MaxButtonIconConfirm } from './components/MaxIconConfirm.vue';
export { default as MaxButtonConfirm } from './components/MaxButtonConfirm.vue';
export { default as MaxLikeButton } from './components/MaxLikeButton.vue';
export { default as LikeButton } from './components/MaxLikeButton.vue';

// Titles && Strings
export { default as MaxTitle1 } from './components/MaxTitle1.vue';
export { default as MaxTitle2 } from './components/MaxTitle2.vue';

// Auth
export { default as MaxAuthCard } from './components/MaxAuthCard.vue';
export { default as AuthCard } from './components/MaxAuthCard.vue';
export { clearAuthOtpCache } from './helpers/clearAuthOtpCache';
export type { AuthProvider, AuthOtpEndpoint, AuthMode, AuthStep, AuthLabels } from './components/MaxAuthCard.vue';

// Tabs
export { default as MaxTabs } from './components/MaxTabs.vue';
export { default as Tabs } from './components/MaxTabs.vue';
export { default as MaxTabList } from './components/MaxTabList.vue';
export { default as TabList } from './components/MaxTabList.vue';
export { default as MaxTab } from './components/MaxTab.vue';
export { default as Tab } from './components/MaxTab.vue';
export { default as MaxTabPanels } from './components/MaxTabPanels.vue';
export { default as TabPanels } from './components/MaxTabPanels.vue';
export { default as MaxTabPanel } from './components/MaxTabPanel.vue';
export { default as TabPanel } from './components/MaxTabPanel.vue';
export { default as MaxTabItem } from './components/MaxTabItem.vue';
export { default as TabItem } from './components/MaxTabItem.vue';

// Accordion
export { default as MaxAccordion } from './components/MaxAccordion.vue';
export { default as Accordion } from './components/MaxAccordion.vue';
export { default as MaxAccordionItem } from './components/MaxAccordionItem.vue';
export { default as AccordionItem } from './components/MaxAccordionItem.vue';

// Drawer
export { default as MaxDrawer } from './components/MaxDrawer.vue';
export { default as Drawer } from './components/MaxDrawer.vue';

export * from './stores';


// Input Text
export { default as MaxInputText } from './components/MaxInputText.vue';
export { default as InputText } from './components/MaxInputText.vue';
export { default as InputField } from './components/MaxInputText.vue';

// Phone Field
export { default as MaxPhoneField } from './components/MaxPhoneField.vue';
export { default as PhoneField } from './components/MaxPhoneField.vue';
export { default as InputPhone } from './components/MaxPhoneField.vue';

// Inputs
export { default as MaxColorPicker } from './components/MaxColorPicker.vue';
export { default as MaxInputIconPicker } from './components/MaxInputIconPicker.vue';
export { default as InputIconPicker } from './components/MaxInputIconPicker.vue';
export { default as IconPicker } from './components/MaxInputIconPicker.vue';
export { default as MaxInputAutoComplete } from './components/MaxInputAutoComplete.vue';
export { default as MaxInputAutoCompleteApi } from './components/MaxInputAutoCompleteApi.vue';
export { default as MaxInputCep } from './components/MaxInputCep.vue';
export { default as MaxInputCheckbox } from './components/MaxInputCheckbox.vue';
export { default as MaxInputCoordinateDecimalLat } from './components/MaxInputCoordinateDecimalLat.vue';
export { default as MaxInputCoordinateDecimalLng } from './components/MaxInputCoordinateDecimalLng.vue';
export { default as MaxCreditCard } from './components/MaxCreditCard.vue';
export { default as MaxInputCpfCnpj } from './components/MaxInputCpfCnpj.vue';
export { default as MaxInputCreditCard } from './components/MaxInputCreditCard.vue';
export { default as MaxInputCreditCardCvv } from './components/MaxInputCreditCardCvv.vue';
export { default as MaxInputCreditCardDate } from './components/MaxInputCreditCardDate.vue';
export { default as MaxInputDatePicker } from './components/MaxInputDatePicker.vue';
export { default as MaxInputField } from './components/MaxInputText.vue';
export { default as MaxInputFile } from './components/MaxInputFile.vue';
export { default as MaxInputFileProject } from './components/MaxInputFileProject.vue';
export { default as MaxInputFileUpload } from './components/MaxInputFileUpload.vue';
export { default as MaxInputFileUploadBig } from './components/MaxInputFileUploadBig.vue';
export { default as MaxInputFileUploadButton } from './components/MaxInputFileUploadButton.vue';
export { default as MaxInputNumber } from './components/MaxInputNumber.vue';
export { default as MaxInputOTP } from './components/MaxInputOTP.vue';
export { default as MaxInputOtp } from './components/MaxInputOTP.vue';
export { default as InputOTP } from './components/MaxInputOTP.vue';
export { default as InputOtp } from './components/MaxInputOTP.vue';
export { default as MaxInputPhoneMail } from './components/MaxInputPhoneMail.vue';
export { default as MaxInputRadio } from './components/MaxInputRadio.vue';
export { default as MaxInputSearch } from './components/MaxInputSearch.vue';
export { default as MaxInputSelect } from './components/MaxInputSelect.vue';
export { default as MaxTagsList } from './components/MaxTagsList.vue';
export { default as MaxTagSelect } from './components/MaxTagSelect.vue';
export { default as MaxInputSelectTag } from './components/MaxTagSelect.vue';
export { default as MaxSelectTag } from './components/MaxTagSelect.vue';
export { default as MaxChips } from './components/MaxChips.vue';
export { default as Chips } from './components/MaxChips.vue';
export { default as MaxInputSwitch } from './components/MaxInputSwitch.vue';
export { default as MaxInputTextArea } from './components/MaxInputTextArea.vue';
export { default as MaxInputTextList } from './components/MaxInputTextList.vue';
// Async: o MaxInputMarkdown arrasta o tiptap inteiro (starter-kit + 8 extensões, ~350 KB);
// como export estático ele entraria no bundle eager de TODOS os apps consumidores, mesmo sem uso.
// Mesmo padrão de MaxPdfView/MaxLoaderAi (deps pesadas sob demanda).
export const MaxInputMarkdown = defineAsyncComponent(() => import('./components/MaxInputMarkdown.vue'));
export { default as MaxInputMarkdownToolbar } from './components/MaxInputMarkdownToolbar.vue';
export { default as MaxInputToggle } from './components/MaxInputToggle.vue';
export { default as MaxInputTypeAddress } from './components/MaxInputTypeAddress.vue';
export { default as MaxGridCols } from './components/MaxGridCols.vue';

// Loaders
export { default as MaxLoader } from './components/MaxLoader.vue';
export { default as MaxLoaderAi } from './components/MaxLoaderAi.vue';
export { default as MaxLoaderIcon } from './components/MaxLoaderIcon.vue';
export { default as MaxLoadScreen } from './components/MaxLoadScreen.vue';
export { default as MaxLoadScreenTarget } from './components/MaxLoadScreenTarget.vue';

// App shell — layout
export { default as MaxContainerApp } from './components/MaxContainerApp.vue';
export { default as MaxBottomMenu } from './components/MaxBottomMenu.vue';
export { default as MaxSideMenu } from './components/MaxSideMenu.vue';
export { default as MaxSideMenuMobile } from './components/MaxSideMenuMobile.vue';
export { default as MaxMenuVerticalItem } from './components/MaxMenuVerticalItem.vue';
export { default as MaxTopMenu } from './components/MaxTopMenu.vue';
export { default as MaxTopMenuSearchBar } from './components/MaxTopMenuSearchBar.vue';
export { default as MaxTopToolbar } from './components/MaxTopToolbar.vue';
export { default as MaxTopToolbarSubmenu } from './components/MaxTopToolbarSubmenu.vue';
// O MaxUserSection é exportado mais abaixo, junto do seu alias UserSection.
export { default as MaxPageContent } from './components/MaxPageContent.vue';
export { default as MaxPageLayout } from './components/MaxPageLayout.vue';
export { default as MaxPageMobileLayout } from './components/MaxPageMobileLayout.vue';
export { default as MaxApp } from './components/MaxApp.vue';

// Data & Display
export { default as MaxBadgeComponent } from './components/MaxBadgeComponent.vue';
// Async: o MaxChart arrasta o chart.js (~200 KB) por import dinâmico dentro do
// componente; como export estático ele ainda assim entraria no grafo eager.
export const MaxChart = defineAsyncComponent(() => import('./components/MaxChart.vue'));
export { default as MaxEmptyDiv } from './components/MaxEmptyDiv.vue';
export { default as MaxLink } from './components/MaxLink.vue';
export { default as MaxListBox } from './components/MaxListBox.vue';
export { default as ListBox } from './components/MaxListBox.vue';
export { default as Listbox } from './components/MaxListBox.vue';
export { default as MaxLogo } from './components/MaxLogo.vue';
// Async: o MaxMaps arrasta o vue3-google-map — fora do bundle eager, carrega só quando usado em tela.
export const MaxMaps = defineAsyncComponent(() => import('./components/MaxMaps.vue'));
export { default as MaxPdfView } from './components/MaxPdfView.vue';
export { default as MaxTable } from './components/MaxTable.vue';
export { default as MaxTableFields } from './components/MaxTableFields.vue';
export { default as MaxTableColumn } from './components/MaxTableColumn.vue';

// Utils / Others
export { default as MaxMsgLabels } from './components/MaxMsgLabels.vue';
export { default as MaxTextInputFloatLabel } from './components/MaxTextInputFloatLabel.vue';
export { default as MaxTransitionFadeLight } from './components/MaxTransitionFadeLight.vue';
export { default as MaxTransitionUp } from './components/MaxTransitionUp.vue';
export { default as TransitionFade } from './components/TransitionFade.vue';
export { default as MaxAnimateFade } from './components/MaxAnimateFade.vue';
export { default as MaxUserAvatar } from './components/MaxUserAvatar.vue';
export { default as MaxUserSection } from './components/MaxUserSection.vue';
export { default as UserSection } from './components/MaxUserSection.vue';
export { default as MaxPopoverConfirm } from './components/MaxPopoverConfirm.vue';
export { default as MaxPopover } from './components/MaxPopover.vue';
export { default as MaxTogglePopover } from './components/MaxTogglePopover.vue';
export { default as MaxModal } from './components/MaxModal.vue';
export { default as MaxPopoverMenu } from './components/MaxPopoverMenu.vue';
export { default as MaxToast } from './components/MaxToast.vue';
export { Toast } from './helpers/Toast';

// Configuração do app shell (MaxApp) — deve ser chamada no boot da aplicação.
export { configureMaxApp, getMaxAppConfig, resetMaxAppConfig } from './helpers/maxAppConfig';
export { clearMaxCache, registerMaxCacheKey, isMaxCacheKey, ICON_CACHE_KEY } from './helpers/maxCacheKeys';


import Tooltip from './directives/tooltip';


/**
 * @param {import('vue').App} app
 * @param {any} options
 */
export const install = (app: any, options: any = {}) => {
    const { theme: userTheme, locale: userLocale, ripple: userRipple, ...rest } = options;

    app.use(PrimeVue, {
        ...rest,
        locale: userLocale || ptBR,
        ripple: userRipple ?? true,
        theme: {
            ...userTheme,
            preset: userTheme?.preset ?? MaxStyle,
            options: {
                darkModeSelector: '.dark',
                prefix: 'max',
                ...userTheme?.options
            }
        }
    });
    app.directive('tooltip', Tooltip);
};

export default {
    install
};


export * from './types';
export type * from './types/chart';


// ESTE ARQUIVO CONTÉM OS COMPONENTES DO PRIME VUE QUE NÃO EXISTEM NO MAX COMPONENTS UI
// ESTE ARQUIVO É USADO PARA EXPORTAR OS COMPONENTES DO PRIME VUE PARA SEREM ACESSADOS COMO SE FOSSEM DO MAX COMPONENTS UI
// IMPORTAÇÃO DEFAULT NÃO FUNCIONA POIS OS COMPONENTES SÃO EXPORTADOS COM DEFAULT DO VITE
// NÃO TEM REFERÊNCIA COM AUTOIMPORT. O AUTOIMPORT USA A BIBLIOTECA COMPLETA DO PRIMEVUE...