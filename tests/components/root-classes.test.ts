import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';

import InputBase from '../../src/components/InputBase.vue';
import MaxInputText from '../../src/components/MaxInputText.vue';
import MaxInputTextArea from '../../src/components/MaxInputTextArea.vue';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';
import MaxInputCep from '../../src/components/MaxInputCep.vue';
import MaxInputCpfCnpj from '../../src/components/MaxInputCpfCnpj.vue';
import MaxInputPhone from '../../src/components/MaxInputPhone.vue';
import MaxInputPhoneMail from '../../src/components/MaxInputPhoneMail.vue';
import MaxInputSearch from '../../src/components/MaxInputSearch.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxInputSwitch from '../../src/components/MaxInputSwitch.vue';
import MaxInputCheckbox from '../../src/components/MaxInputCheckbox.vue';
import MaxInputRadio from '../../src/components/MaxInputRadio.vue';
import MaxInputToggle from '../../src/components/MaxInputToggle.vue';
import MaxInputAutoComplete from '../../src/components/MaxInputAutoComplete.vue';
import MaxInputDatePicker from '../../src/components/MaxInputDatePicker.vue';
import MaxColorPicker from '../../src/components/MaxColorPicker.vue';
import MaxTagSelect from '../../src/components/MaxTagSelect.vue';
import MaxTagsList from '../../src/components/MaxTagsList.vue';
import MaxListBox from '../../src/components/MaxListBox.vue';
import MaxInputCoordinateDecimalLat from '../../src/components/MaxInputCoordinateDecimalLat.vue';
import MaxInputCoordinateDecimalLng from '../../src/components/MaxInputCoordinateDecimalLng.vue';
import MaxInputCreditCard from '../../src/components/MaxInputCreditCard.vue';
import MaxInputCreditCardCvv from '../../src/components/MaxInputCreditCardCvv.vue';
import MaxInputCreditCardDate from '../../src/components/MaxInputCreditCardDate.vue';
import MaxInputTypeAddress from '../../src/components/MaxInputTypeAddress.vue';
import MaxInputMarkdownToolbar from '../../src/components/MaxInputMarkdownToolbar.vue';
import MaxTextInputFloatLabel from '../../src/components/MaxTextInputFloatLabel.vue';
import MaxBaseInput from '../../src/components/base/MaxBaseInput.vue';
import MaxInputFileProject from '../../src/components/MaxInputFileProject.vue';
import MaxInputFileUpload from '../../src/components/MaxInputFileUpload.vue';
import MaxInputFileUploadBig from '../../src/components/MaxInputFileUploadBig.vue';
import MaxInputFileUploadButton from '../../src/components/MaxInputFileUploadButton.vue';
import MaxIconButton from '../../src/components/MaxIconButton.vue';
import MaxButtonConfirm from '../../src/components/MaxButtonConfirm.vue';
import MaxIconConfirm from '../../src/components/MaxIconConfirm.vue';
import MaxAiIcon from '../../src/components/MaxAiIcon.vue';
import MaxDoneIcon from '../../src/components/MaxDoneIcon.vue';
import MaxErrorIcon from '../../src/components/MaxErrorIcon.vue';
import MaxWaitIcon from '../../src/components/MaxWaitIcon.vue';
import MaxBadgeComponent from '../../src/components/MaxBadgeComponent.vue';
import MaxContainerApp from '../../src/components/MaxContainerApp.vue';
import MaxBottomMenu from '../../src/components/MaxBottomMenu.vue';
import MaxSideMenu from '../../src/components/MaxSideMenu.vue';
import MaxMenuVerticalItem from '../../src/components/MaxMenuVerticalItem.vue';
import MaxTopMenu from '../../src/components/MaxTopMenu.vue';
import MaxTopMenuSearchBar from '../../src/components/MaxTopMenuSearchBar.vue';
import MaxTopToolbarSubmenu from '../../src/components/MaxTopToolbarSubmenu.vue';
import MaxUserSection from '../../src/components/MaxUserSection.vue';
import MaxLink from '../../src/components/MaxLink.vue';
import MaxTabs from '../../src/components/MaxTabs.vue';
import MaxTabList from '../../src/components/MaxTabList.vue';
import MaxModal from '../../src/components/MaxModal.vue';
import MaxPopover from '../../src/components/MaxPopover.vue';
import MaxTogglePopover from '../../src/components/MaxTogglePopover.vue';
import MaxAuthCard from '../../src/components/MaxAuthCard.vue';
import MaxLoaderAi from '../../src/components/MaxLoaderAi.vue';
import MaxLogo from '../../src/components/MaxLogo.vue';
import MaxMaps from '../../src/components/MaxMaps.vue';
import MaxMsgLabels from '../../src/components/MaxMsgLabels.vue';
import MaxPdfView from '../../src/components/MaxPdfView.vue';

describe('Root Component Identifier Classes', () => {
    let pinia: any;
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
    });

    const defaultGlobal = {
        stubs: {
            MaxIcon: true,
            RouterLink: { template: '<a><slot /></a>' },
            MaxButton: true,
            MaxIconButton: true,
            Teleport: true
        }
    };

    it('InputBase possui classe max-input-base', () => {
        const wrapper = mount(InputBase, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-base');
    });

    it('MaxInputText possui classe max-input-text no wrapper pai', () => {
        const wrapper = mount(MaxInputText, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-text');
    });

    it('MaxInputTextArea possui classe max-input-text-area no wrapper pai', () => {
        const wrapper = mount(MaxInputTextArea, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-text-area');
    });

    it('MaxInputNumber possui classe max-input-number no wrapper pai', () => {
        const wrapper = mount(MaxInputNumber, { props: { modelValue: 0 }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-number');
    });

    it('MaxInputCep possui classe max-input-cep no wrapper pai', () => {
        const wrapper = mount(MaxInputCep, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-cep');
    });

    it('MaxInputCpfCnpj possui classe max-input-cpf-cnpj no wrapper pai', () => {
        const wrapper = mount(MaxInputCpfCnpj, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-cpf-cnpj');
    });

    it('MaxInputPhone possui classe max-input-phone no wrapper pai', () => {
        const wrapper = mount(MaxInputPhone, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-phone');
    });

    it('MaxInputPhoneMail possui classe max-input-phone-mail no wrapper pai', () => {
        const wrapper = mount(MaxInputPhoneMail, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-phone-mail');
    });

    it('MaxInputSearch possui classe max-input-search no wrapper pai', () => {
        const wrapper = mount(MaxInputSearch, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-search');
    });

    it('MaxInputSelect possui classe max-input-select no wrapper pai', () => {
        const wrapper = mount(MaxInputSelect, { props: { modelValue: '', options: [] }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-select');
    });

    it('MaxInputSwitch possui classe max-input-switch no wrapper pai', () => {
        const wrapper = mount(MaxInputSwitch, { props: { modelValue: false }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-switch');
    });

    it('MaxInputCheckbox possui classe max-input-checkbox', () => {
        const wrapper = mount(MaxInputCheckbox, { props: { modelValue: false }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-checkbox');
    });

    it('MaxInputRadio possui classe max-input-radio', () => {
        const wrapper = mount(MaxInputRadio, { props: { modelValue: '', value: 'a' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-radio');
    });

    it('MaxInputToggle possui classe max-input-toggle', () => {
        const wrapper = mount(MaxInputToggle, { props: { modelValue: false }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-toggle');
    });

    it('MaxInputAutoComplete possui classe max-input-auto-complete no wrapper pai', () => {
        const wrapper = mount(MaxInputAutoComplete, { props: { modelValue: '', options: [] }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-auto-complete');
    });

    it('MaxInputDatePicker possui classe max-input-date-picker no wrapper pai', () => {
        const wrapper = mount(MaxInputDatePicker, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-date-picker');
    });

    it('MaxColorPicker possui classe max-color-picker no wrapper pai', () => {
        const wrapper = mount(MaxColorPicker, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-color-picker');
    });

    it('MaxTagSelect possui classe max-tag-select no wrapper pai', () => {
        const wrapper = mount(MaxTagSelect, { props: { modelValue: [] }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-tag-select');
    });

    it('MaxTagsList possui classe max-tags-list', () => {
        const wrapper = mount(MaxTagsList, { props: { tags: [] }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-tags-list');
    });

    it('MaxListBox possui classe max-list-box', () => {
        const wrapper = mount(MaxListBox, { props: { options: [] }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-list-box');
    });

    it('MaxInputCoordinateDecimalLat possui classe max-input-coordinate-decimal-lat no wrapper pai', () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, { props: { modelValue: 0 }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-coordinate-decimal-lat');
    });

    it('MaxInputCoordinateDecimalLng possui classe max-input-coordinate-decimal-lng no wrapper pai', () => {
        const wrapper = mount(MaxInputCoordinateDecimalLng, { props: { modelValue: 0 }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-coordinate-decimal-lng');
    });

    it('MaxInputCreditCard possui classe max-input-credit-card no wrapper pai', () => {
        const wrapper = mount(MaxInputCreditCard, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-credit-card');
    });

    it('MaxInputCreditCardCvv possui classe max-input-credit-card-cvv no wrapper pai', () => {
        const wrapper = mount(MaxInputCreditCardCvv, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-credit-card-cvv');
    });

    it('MaxInputCreditCardDate possui classe max-input-credit-card-date no wrapper pai', () => {
        const wrapper = mount(MaxInputCreditCardDate, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-credit-card-date');
    });

    it('MaxInputTypeAddress possui classe max-input-type-address no wrapper pai', () => {
        const wrapper = mount(MaxInputTypeAddress, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-type-address');
    });

    it('MaxInputMarkdownToolbar possui classe max-input-markdown-toolbar', () => {
        const wrapper = mount(MaxInputMarkdownToolbar, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-markdown-toolbar');
    });

    it('MaxTextInputFloatLabel possui classe max-text-input-float-label', () => {
        const wrapper = mount(MaxTextInputFloatLabel, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-text-input-float-label');
    });

    it('MaxBaseInput possui classe max-base-input', () => {
        const wrapper = mount(MaxBaseInput, { props: { modelValue: '' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-base-input');
    });

    it('MaxInputFileProject possui classe max-input-file-project', () => {
        const wrapper = mount(MaxInputFileProject, { props: { label: 'Projeto', route: 'test' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-file-project');
    });

    it('MaxInputFileUpload possui classe max-input-file-upload', () => {
        const wrapper = mount(MaxInputFileUpload, { props: { route: 'test' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-file-upload');
    });

    it('MaxInputFileUploadBig possui classe max-input-file-upload-big', () => {
        const wrapper = mount(MaxInputFileUploadBig, { props: { route: 'test' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-file-upload-big');
    });

    it('MaxInputFileUploadButton possui classe max-input-file-upload-button', () => {
        const wrapper = mount(MaxInputFileUploadButton, { props: { route: 'test' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-input-file-upload-button');
    });

    it('MaxIconButton possui classe max-icon-button', () => {
        const wrapper = mount(MaxIconButton, { props: { icon: 'home' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-icon-button');
    });

    it('MaxButtonConfirm possui classe max-button-confirm', () => {
        const wrapper = mount(MaxButtonConfirm, { props: { label: 'Confirmar' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-button-confirm');
    });

    it('MaxIconConfirm possui classe max-icon-confirm', () => {
        const wrapper = mount(MaxIconConfirm, { props: { icon: 'trash' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-icon-confirm');
    });

    it('MaxAiIcon possui classe max-ai-icon', () => {
        const wrapper = mount(MaxAiIcon, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-ai-icon');
    });

    it('MaxDoneIcon possui classe max-done-icon', () => {
        const wrapper = mount(MaxDoneIcon, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-done-icon');
    });

    it('MaxErrorIcon possui classe max-error-icon', () => {
        const wrapper = mount(MaxErrorIcon, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-error-icon');
    });

    it('MaxWaitIcon possui classe max-wait-icon', () => {
        const wrapper = mount(MaxWaitIcon, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-wait-icon');
    });

    it('MaxBadgeComponent possui classe max-badge-component', () => {
        const wrapper = mount(MaxBadgeComponent, { props: { label: 'Badge' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-badge-component');
    });

    it('MaxContainerApp possui classe max-container-app', () => {
        const wrapper = mount(MaxContainerApp, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-container-app');
    });

    it('MaxBottomMenu possui classe max-bottom-menu', () => {
        const wrapper = mount(MaxBottomMenu, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-bottom-menu');
    });

    it('MaxSideMenu possui classe max-side-menu', () => {
        const wrapper = mount(MaxSideMenu, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-side-menu');
    });

    it('MaxMenuVerticalItem possui classe max-menu-vertical-item', () => {
        const wrapper = mount(MaxMenuVerticalItem, {
            props: { items: [{ details: { icon: 'home', route: 'test' } }] },
            global: defaultGlobal
        });
        expect(wrapper.find('.max-menu-vertical-item').classes()).toContain('max-menu-vertical-item');
    });

    it('MaxTopMenu possui classe max-top-menu', () => {
        const wrapper = mount(MaxTopMenu, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-top-menu');
    });

    it('MaxTopMenuSearchBar possui classe max-top-menu-search-bar', () => {
        const wrapper = mount(MaxTopMenuSearchBar, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-top-menu-search-bar');
    });

    it('MaxTopToolbarSubmenu possui classe max-top-toolbar-submenu', () => {
        const wrapper = mount(MaxTopToolbarSubmenu, { props: { items: [] }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-top-toolbar-submenu');
    });

    it('MaxUserSection possui classe max-user-section', () => {
        const wrapper = mount(MaxUserSection, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-user-section');
    });

    it('MaxLink possui classe max-link', () => {
        const wrapper = mount(MaxLink, { props: { route: 'home' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-link');
    });

    it('MaxTabList possui classe max-tab-list', () => {
        const wrapper = mount(MaxTabs, {
            props: { value: '0' },
            slots: { default: '<MaxTabList />' },
            global: { ...defaultGlobal, components: { MaxTabList } }
        });
        expect(wrapper.find('.max-tab-list').exists()).toBe(true);
    });

    it('MaxModal possui classe max-modal', async () => {
        const wrapper = mount(MaxModal, { global: { ...defaultGlobal, stubs: { teleport: true } } });
        (wrapper.vm as any).open();
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.max-modal').exists()).toBe(true);
    });

    it('MaxPopover possui classe max-popover', () => {
        const wrapper = mount(MaxPopover, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-popover');
    });

    it('MaxTogglePopover possui classe max-toggle-popover', () => {
        const wrapper = mount(MaxTogglePopover, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-toggle-popover');
    });

    it('MaxAuthCard possui classe max-auth-card', () => {
        const wrapper = mount(MaxAuthCard, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-auth-card');
    });

    it('MaxLoaderAi possui classe max-loader-ai', () => {
        const wrapper = mount(MaxLoaderAi, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-loader-ai');
    });

    it('MaxLogo possui classe max-logo', () => {
        const wrapper = mount(MaxLogo, { global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-logo');
    });

    it('MaxMaps possui classe max-maps', () => {
        const wrapper = mount(MaxMaps, { props: { modelValue: { latitude: -23.5, longitude: -46.6 } }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-maps');
    });

    it('MaxMsgLabels possui classe max-msg-labels', () => {
        const wrapper = mount(MaxMsgLabels, { props: { msg: 'Erro' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-msg-labels');
    });

    it('MaxPdfView possui classe max-pdf-view', () => {
        const wrapper = mount(MaxPdfView, { props: { file: 'doc.pdf' }, global: defaultGlobal });
        expect(wrapper.classes()).toContain('max-pdf-view');
    });
});
