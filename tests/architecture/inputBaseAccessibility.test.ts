import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import fs from 'fs';
import path from 'path';
import MaxInputText from '../../src/components/MaxInputText.vue';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';
import MaxInputTextArea from '../../src/components/MaxInputTextArea.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxChips from '../../src/components/MaxChips.vue';
import MaxInputDatePicker from '../../src/components/MaxInputDatePicker.vue';
import MaxInputCpfCnpj from '../../src/components/MaxInputCpfCnpj.vue';
import MaxInputSwitch from '../../src/components/MaxInputSwitch.vue';

const COMPONENTS_DIR = path.resolve(__dirname, '../../src/components');

function getComponentsUsingInputBase(): string[] {
    const results: string[] = [];
    const files = fs.readdirSync(COMPONENTS_DIR).filter((f) => f.endsWith('.vue'));

    for (const file of files) {
        const content = fs.readFileSync(path.join(COMPONENTS_DIR, file), 'utf-8');
        if (/<InputBase\b/.test(content)) results.push(file);
    }

    return results;
}

describe('Auditoria Arquitetural: Acessibilidade de InputBase e Consumidores', () => {
    it('todos os 25 componentes que consomem InputBase devem vincular inputAttrs ao elemento interativo no slot', () => {
        const consumers = getComponentsUsingInputBase();
        expect(consumers.length).toBe(25);

        const unmigrated: string[] = [];
        for (const file of consumers) {
            const content = fs.readFileSync(path.join(COMPONENTS_DIR, file), 'utf-8');
            const hasInputAttrs = /<template\s+#default=["']\{[^}]*inputAttrs[^}]*\}["']/.test(content);
            if (!hasInputAttrs) unmigrated.push(file);
        }

        expect(unmigrated).toEqual([]);
    });

    describe('Conexão acessível de controles representativos', () => {
        it('MaxInputText conecta id, label, aria-required, aria-invalid e aria-describedby', () => {
            const wrapper = mount(MaxInputText, {
                props: {
                    modelValue: '',
                    label: 'Nome completo',
                    required: true,
                    error: 'Campo obrigatório'
                }
            });

            const input = wrapper.find('input');
            const label = wrapper.find('label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(label.exists()).toBe(true);
            expect(input.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(input.attributes('id'));
            expect(input.attributes('aria-required')).toBe('true');
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
        });

        it('MaxInputNumber conecta id, label, aria-required e aria-describedby', () => {
            const wrapper = mount(MaxInputNumber, {
                props: {
                    modelValue: 0,
                    label: 'Quantidade',
                    required: true,
                    msg: 'Informe a quantidade'
                }
            });

            const input = wrapper.find('input');
            const label = wrapper.find('label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(input.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(input.attributes('id'));
            expect(input.attributes('aria-required')).toBe('true');
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
        });

        it('MaxInputTextArea conecta id, label e aria-required no elemento textarea', () => {
            const wrapper = mount(MaxInputTextArea, {
                props: {
                    modelValue: '',
                    label: 'Observações',
                    required: true,
                    error: 'Texto obrigatório'
                }
            });

            const textarea = wrapper.find('textarea');
            const label = wrapper.find('label');
            const message = wrapper.find('.input-message');

            expect(textarea.exists()).toBe(true);
            expect(textarea.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(textarea.attributes('id'));
            expect(textarea.attributes('aria-required')).toBe('true');
            expect(textarea.attributes('aria-invalid')).toBe('true');
            expect(textarea.attributes('aria-describedby')).toBe(message.attributes('id'));
        });

        it('MaxInputSelect conecta atributos de combobox e inputAttrs no gatilho', () => {
            const wrapper = mount(MaxInputSelect, {
                props: {
                    modelValue: null,
                    options: [{ id: 1, name: 'Opção 1' }],
                    label: 'Categoria',
                    required: true,
                    error: 'Selecione uma categoria'
                }
            });

            const combobox = wrapper.find('.max-select[role="combobox"]');
            const label = wrapper.find('label');
            const message = wrapper.find('.input-message');

            expect(combobox.exists()).toBe(true);
            expect(combobox.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(combobox.attributes('id'));
            expect(combobox.attributes('aria-required')).toBe('true');
            expect(combobox.attributes('aria-invalid')).toBe('true');
            expect(combobox.attributes('aria-describedby')).toBe(message.attributes('id'));
        });

        it('MaxChips conecta inputAttrs no input de digitação de tags', () => {
            const wrapper = mount(MaxChips, {
                props: {
                    modelValue: ['vue'],
                    label: 'Tags',
                    required: true
                }
            });

            const input = wrapper.find('input');
            const label = wrapper.find('label');

            expect(input.exists()).toBe(true);
            expect(input.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(input.attributes('id'));
            expect(input.attributes('aria-required')).toBe('true');
        });

        it('MaxInputDatePicker conecta inputAttrs no input nativo mascarado', () => {
            const wrapper = mount(MaxInputDatePicker, {
                props: {
                    modelValue: '',
                    label: 'Data de Nascimento',
                    required: true,
                    error: 'Data obrigatória'
                }
            });

            const input = wrapper.find('input');
            const label = wrapper.find('label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(input.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(input.attributes('id'));
            expect(input.attributes('aria-required')).toBe('true');
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
        });

        it('MaxInputCpfCnpj conecta inputAttrs no input de documento', () => {
            const wrapper = mount(MaxInputCpfCnpj, {
                props: {
                    modelValue: '',
                    label: 'CPF/CNPJ',
                    required: true,
                    error: 'Documento inválido'
                }
            });

            const input = wrapper.find('input');
            const label = wrapper.find('label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(input.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(input.attributes('id'));
            expect(input.attributes('aria-required')).toBe('true');
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
        });

        it('MaxInputSwitch conecta inputAttrs no elemento role="switch"', () => {
            const wrapper = mount(MaxInputSwitch, {
                props: {
                    modelValue: false,
                    label: 'Notificações',
                    required: true
                }
            });

            const toggle = wrapper.find('[role="switch"]');
            const label = wrapper.find('label');

            expect(toggle.exists()).toBe(true);
            expect(toggle.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(toggle.attributes('id'));
            expect(toggle.attributes('aria-required')).toBe('true');
        });

        it('instâncias múltiplas no mesmo contexto geram IDs únicos garantindo que labels não colidam', () => {
            const TestContainer = {
                components: { MaxInputText },
                template: '<div><MaxInputText model-value="" label="Campo 1" /><MaxInputText model-value="" label="Campo 2" /></div>'
            };
            const wrapper = mount(TestContainer);
            const inputs = wrapper.findAll('input');

            expect(inputs.length).toBe(2);
            const id1 = inputs[0].attributes('id');
            const id2 = inputs[1].attributes('id');

            expect(id1).toBeTruthy();
            expect(id2).toBeTruthy();
            expect(id1).not.toBe(id2);
        });
    });
});
