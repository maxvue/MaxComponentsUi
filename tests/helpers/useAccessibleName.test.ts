import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { h } from 'vue';
import { mount } from '@vue/test-utils';
import {
    resolveAriaLabelledby,
    computeAccessibleNameFromIdrefs,
    computeAccessibleName,
    getSlotText,
    isElementAccessible,
    getElementAccessibleText,
    validateDialogA11y
} from '../../src/helpers/useAccessibleName';
import MaxModal from '../../src/components/MaxModal.vue';
import MaxPopover from '../../src/components/MaxPopover.vue';

describe('useAccessibleName (R08)', () => {
    let testContainer: HTMLDivElement;

    beforeEach(() => {
        testContainer = document.createElement('div');
        testContainer.id = 'test-accessibility-container';
        document.body.appendChild(testContainer);
    });

    afterEach(() => {
        if (testContainer && testContainer.parentNode) testContainer.parentNode.removeChild(testContainer);

        document.body.innerHTML = '';
    });

    describe('isElementAccessible', () => {
        it('retorna true para elemento visível e anexado ao DOM', () => {
            const el = document.createElement('div');
            el.textContent = 'Texto Visível';
            testContainer.appendChild(el);

            expect(isElementAccessible(el)).toBe(true);
        });

        it('retorna false para elemento nulo, indefinido ou desconectado do DOM', () => {
            expect(isElementAccessible(null)).toBe(false);
            expect(isElementAccessible(undefined)).toBe(false);

            const detached = document.createElement('div');
            detached.textContent = 'Desconectado';
            expect(isElementAccessible(detached)).toBe(false);
        });

        it('retorna false para elemento com atributo hidden ou propriedade hidden', () => {
            const el = document.createElement('div');
            el.hidden = true;
            testContainer.appendChild(el);

            expect(isElementAccessible(el)).toBe(false);

            el.hidden = false;
            el.setAttribute('hidden', '');
            expect(isElementAccessible(el)).toBe(false);
        });

        it('retorna false para elemento com aria-hidden="true"', () => {
            const el = document.createElement('div');
            el.setAttribute('aria-hidden', 'true');
            testContainer.appendChild(el);

            expect(isElementAccessible(el)).toBe(false);
        });

        it('retorna false para elemento com atributo inert ou propriedade inert', () => {
            const el = document.createElement('div');
            el.setAttribute('inert', '');
            testContainer.appendChild(el);

            expect(isElementAccessible(el)).toBe(false);

            const el2 = document.createElement('div');
            (el2 as any).inert = true;
            testContainer.appendChild(el2);

            expect(isElementAccessible(el2)).toBe(false);
        });

        it('retorna false para elemento com estilo inline display: none ou visibility: hidden', () => {
            const elDisplay = document.createElement('div');
            elDisplay.style.display = 'none';
            testContainer.appendChild(elDisplay);
            expect(isElementAccessible(elDisplay)).toBe(false);

            const elVis = document.createElement('div');
            elVis.style.visibility = 'hidden';
            testContainer.appendChild(elVis);
            expect(isElementAccessible(elVis)).toBe(false);
        });

        it('retorna false quando qualquer ancestral possui aria-hidden="true"', () => {
            const ancestor = document.createElement('div');
            ancestor.setAttribute('aria-hidden', 'true');
            const parent = document.createElement('div');
            const child = document.createElement('span');
            child.textContent = 'Filho Oculto';

            ancestor.appendChild(parent);
            parent.appendChild(child);
            testContainer.appendChild(ancestor);

            expect(isElementAccessible(child)).toBe(false);
        });

        it('retorna false quando qualquer ancestral possui atributo inert', () => {
            const ancestor = document.createElement('section');
            ancestor.setAttribute('inert', 'true');
            const child = document.createElement('h2');
            child.textContent = 'Título Inerte';

            ancestor.appendChild(child);
            testContainer.appendChild(ancestor);

            expect(isElementAccessible(child)).toBe(false);
        });

        it('retorna false quando qualquer ancestral possui hidden ou display: none', () => {
            const ancestor = document.createElement('div');
            ancestor.style.display = 'none';
            const child = document.createElement('span');
            ancestor.appendChild(child);
            testContainer.appendChild(ancestor);

            expect(isElementAccessible(child)).toBe(false);

            const hiddenAncestor = document.createElement('div');
            hiddenAncestor.hidden = true;
            const child2 = document.createElement('span');
            hiddenAncestor.appendChild(child2);
            testContainer.appendChild(hiddenAncestor);

            expect(isElementAccessible(child2)).toBe(false);
        });

        it('retorna false quando ancestral possui visibility: hidden sem override no filho', () => {
            const ancestor = document.createElement('div');
            ancestor.style.visibility = 'hidden';
            const child = document.createElement('span');
            ancestor.appendChild(child);
            testContainer.appendChild(ancestor);

            expect(isElementAccessible(child)).toBe(false);
        });
    });

    describe('resolveAriaLabelledby com múltiplos IDREFs', () => {
        it('retorna undefined para entrada undefined, vazia ou apenas espaços', () => {
            expect(resolveAriaLabelledby(undefined)).toBeUndefined();
            expect(resolveAriaLabelledby('')).toBeUndefined();
            expect(resolveAriaLabelledby('    ')).toBeUndefined();
        });

        it('resolve ID único existente e visível com texto', () => {
            const h = document.createElement('h2');
            h.id = 'unico-id-1';
            h.textContent = 'Título Principal';
            testContainer.appendChild(h);

            expect(resolveAriaLabelledby('unico-id-1')).toBe('unico-id-1');
        });

        it('descarta ID inexistente/órfão e retorna undefined', () => {
            expect(resolveAriaLabelledby('id-completamente-inexistente')).toBeUndefined();
        });

        it('em múltiplos IDs, preserva apenas os IDs válidos e descarta órfãos', () => {
            const el1 = document.createElement('span');
            el1.id = 'parte-1';
            el1.textContent = 'Prefixo';
            testContainer.appendChild(el1);

            const el2 = document.createElement('span');
            el2.id = 'parte-2';
            el2.textContent = 'Sufixo';
            testContainer.appendChild(el2);

            const result = resolveAriaLabelledby('parte-1  orfao-desconhecido   parte-2');
            expect(result).toBe('parte-1 parte-2');
        });

        it('preserva IDs existentes mesmo quando o rótulo ainda está vazio', () => {
            const elVazio = document.createElement('span');
            elVazio.id = 'id-vazio';
            elVazio.textContent = '    ';
            testContainer.appendChild(elVazio);

            const elValido = document.createElement('span');
            elValido.id = 'id-valido';
            elValido.textContent = 'Conteúdo';
            testContainer.appendChild(elValido);

            // A validade de um IDREF depende da existência do alvo, não do
            // conteúdo instantâneo: o texto pode ser preenchido depois.
            expect(resolveAriaLabelledby('id-vazio id-valido')).toBe('id-vazio id-valido');
            expect(resolveAriaLabelledby('id-vazio')).toBe('id-vazio');
        });

        it('preserva IDs que apontam para rótulos ocultos por CSS', () => {
            const elOculto = document.createElement('span');
            elOculto.id = 'id-oculto-css';
            elOculto.style.display = 'none';
            elOculto.textContent = 'Texto Invisível';
            testContainer.appendChild(elOculto);

            const elVisivel = document.createElement('span');
            elVisivel.id = 'id-visivel-css';
            elVisivel.textContent = 'Texto Visível';
            testContainer.appendChild(elVisivel);

            // O algoritmo AccName usa o conteúdo de referências explícitas mesmo
            // que elas estejam ocultas. Removê-las altera o nome anunciado.
            expect(resolveAriaLabelledby('id-oculto-css id-visivel-css')).toBe('id-oculto-css id-visivel-css');
            expect(resolveAriaLabelledby('id-oculto-css')).toBe('id-oculto-css');
        });

        it('preserva IDs cujos rótulos estão sob ancestrais aria-hidden ou inert', () => {
            const containerAriaHidden = document.createElement('div');
            containerAriaHidden.setAttribute('aria-hidden', 'true');
            const filhoOculto = document.createElement('span');
            filhoOculto.id = 'id-filho-aria-hidden';
            filhoOculto.textContent = 'Filho Inacessível';
            containerAriaHidden.appendChild(filhoOculto);
            testContainer.appendChild(containerAriaHidden);

            const containerInert = document.createElement('div');
            containerInert.setAttribute('inert', '');
            const filhoInert = document.createElement('span');
            filhoInert.id = 'id-filho-inert';
            filhoInert.textContent = 'Filho Inerte';
            containerInert.appendChild(filhoInert);
            testContainer.appendChild(containerInert);

            const elValido = document.createElement('span');
            elValido.id = 'id-valido-fora';
            elValido.textContent = 'Válido';
            testContainer.appendChild(elValido);

            expect(resolveAriaLabelledby('id-filho-aria-hidden id-filho-inert id-valido-fora')).toBe('id-filho-aria-hidden id-filho-inert id-valido-fora');
            expect(resolveAriaLabelledby('id-filho-aria-hidden id-filho-inert')).toBe('id-filho-aria-hidden id-filho-inert');
        });

        it('retorna undefined em ambiente sem document disponível', () => {
            expect(resolveAriaLabelledby('qualquer-id', null as any)).toBeUndefined();
        });
    });

    describe('computeAccessibleNameFromIdrefs e computeAccessibleName', () => {
        it('concatena o texto de múltiplos IDREFs válidos com espaço simples', () => {
            const t1 = document.createElement('span');
            t1.id = 'txt-1';
            t1.textContent = 'Relatório';
            testContainer.appendChild(t1);

            const t2 = document.createElement('span');
            t2.id = 'txt-2';
            t2.textContent = 'Financeiro 2026';
            testContainer.appendChild(t2);

            expect(computeAccessibleNameFromIdrefs('txt-1 txt-2')).toBe('Relatório Financeiro 2026');
        });

        it('respeita aria-label do elemento alvo referenciado', () => {
            const target = document.createElement('button');
            target.id = 'btn-target';
            target.setAttribute('aria-label', 'Nome Semântico do Botão');
            target.textContent = 'Ignorado';
            testContainer.appendChild(target);

            expect(getElementAccessibleText(target)).toBe('Nome Semântico do Botão');
            expect(computeAccessibleNameFromIdrefs('btn-target')).toBe('Nome Semântico do Botão');
        });

        it('computeAccessibleName prioriza aria-labelledby sobre aria-label', () => {
            const h = document.createElement('h2');
            h.id = 'rotulo-labelledby';
            h.textContent = 'Título por Labelledby';
            testContainer.appendChild(h);

            const dialog = document.createElement('div');
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-labelledby', 'rotulo-labelledby');
            dialog.setAttribute('aria-label', 'Título por Aria-Label');
            testContainer.appendChild(dialog);

            expect(computeAccessibleName(dialog)).toBe('Título por Labelledby');
        });

        it('computeAccessibleName faz fallback para aria-label se aria-labelledby apontar para nós inválidos', () => {
            const dialog = document.createElement('div');
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-labelledby', 'id-inexistente-12345');
            dialog.setAttribute('aria-label', 'Fallback Direto');
            testContainer.appendChild(dialog);

            expect(computeAccessibleName(dialog)).toBe('Fallback Direto');
        });

        it('computeAccessibleName faz fallback para textContent interno se não houver atributos ARIA', () => {
            const dialog = document.createElement('div');
            dialog.setAttribute('role', 'dialog');
            dialog.textContent = '  Conteúdo textual interno do diálogo  ';
            testContainer.appendChild(dialog);

            expect(computeAccessibleName(dialog)).toBe('Conteúdo textual interno do diálogo');
        });
    });

    describe('getSlotText', () => {
        it('retorna string vazia para função de slot nula ou indefinida', () => {
            expect(getSlotText(null)).toBe('');
            expect(getSlotText(undefined)).toBe('');
        });

        it('extrai texto de VNode string simples', () => {
            const slotFn = () => 'Texto do Slot';
            expect(getSlotText(slotFn)).toBe('Texto do Slot');
        });

        it('extrai texto de árvore de VNodes com elementos aninhados e normaliza espaços', () => {
            const slotFn = () => [
                h('span', 'Primeira parte'),
                h('strong', ' segunda parte ')
            ];
            expect(getSlotText(slotFn)).toBe('Primeira parte segunda parte');
        });

        it('retorna string vazia para slot contendo apenas tags vazias ou espaços', () => {
            const slotFn = () => [h('div', '   '), h('span', '')];
            expect(getSlotText(slotFn)).toBe('');
        });

        it('captura graciosamente erros internos na execução do slot', () => {
            const faultySlot = () => {
                throw new Error('Falha no slot');
            };
            expect(getSlotText(faultySlot)).toBe('');
        });
    });

    describe('validateDialogA11y (validação estrutural local)', () => {
        it('aprova diálogo com role="dialog" e nome acessível válido via aria-labelledby', () => {
            const titleEl = document.createElement('h2');
            titleEl.id = 'modal-title-valid';
            titleEl.textContent = 'Confirmar Ação';
            testContainer.appendChild(titleEl);

            const dialog = document.createElement('div');
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-labelledby', 'modal-title-valid');
            testContainer.appendChild(dialog);

            const result = validateDialogA11y(dialog);
            expect(result.passes).toBe(true);
            expect(result.violations).toHaveLength(0);
            expect(result.accessibleName).toBe('Confirmar Ação');
        });

        it('aprova diálogo com role="alertdialog" e nome via aria-label', () => {
            const dialog = document.createElement('div');
            dialog.setAttribute('role', 'alertdialog');
            dialog.setAttribute('aria-label', 'Aviso Importante');
            testContainer.appendChild(dialog);

            const result = validateDialogA11y(dialog);
            expect(result.passes).toBe(true);
            expect(result.violations).toHaveLength(0);
            expect(result.accessibleName).toBe('Aviso Importante');
        });

        it('reprova diálogo com ID órfão em aria-labelledby', () => {
            const dialog = document.createElement('div');
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-labelledby', 'id-orfao-fantasma');
            testContainer.appendChild(dialog);

            const result = validateDialogA11y(dialog);
            expect(result.passes).toBe(false);
            expect(result.violations.some((v) => v.id === 'aria-valid-attr-value')).toBe(true);
            expect(result.violations.some((v) => v.id === 'aria-dialog-name')).toBe(true);
        });

        it('aceita diálogo nomeado por elemento oculto referenciado', () => {
            const hiddenTitle = document.createElement('div');
            hiddenTitle.id = 'titulo-oculto-axe';
            hiddenTitle.hidden = true;
            hiddenTitle.textContent = 'Título Oculto';
            testContainer.appendChild(hiddenTitle);

            const dialog = document.createElement('div');
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-labelledby', 'titulo-oculto-axe');
            testContainer.appendChild(dialog);

            const result = validateDialogA11y(dialog);
            expect(result.passes).toBe(true);
            expect(result.accessibleName).toBe('Título Oculto');
        });

        it('reprova elemento com role inválido', () => {
            const div = document.createElement('div');
            div.setAttribute('role', 'banner');
            div.setAttribute('aria-label', 'Meu Banner');
            testContainer.appendChild(div);

            const result = validateDialogA11y(div);
            expect(result.passes).toBe(false);
            expect(result.violations.some((v) => v.id === 'aria-role')).toBe(true);
        });
    });

    describe('Emulação de getByRole("dialog", { name })', () => {
        function getByRoleDialog(container: HTMLElement, options: { name: string | RegExp }): HTMLElement {
            const dialogs = Array.from(container.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]'));
            const matching = dialogs.filter((d) => {
                const accName = computeAccessibleName(d);
                if (typeof options.name === 'string') return accName === options.name;

                return options.name.test(accName);
            });

            if (matching.length === 0) throw new Error(`Não foi encontrado elemento com role="dialog" e nome acessível correspondente a "${options.name}".`);

            if (matching.length > 1) throw new Error(`Foram encontrados múltiplos elementos com role="dialog" e nome "${options.name}".`);


            return matching[0];
        }

        it('localiza diálogo pelo nome acessível composto de múltiplos IDREFs', () => {
            const h1 = document.createElement('span');
            h1.id = 'sec-title';
            h1.textContent = 'Editar Usuário';
            testContainer.appendChild(h1);

            const h2 = document.createElement('span');
            h2.id = 'sec-code';
            h2.textContent = '#4029';
            testContainer.appendChild(h2);

            const dialog = document.createElement('div');
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-labelledby', 'sec-title sec-code');
            testContainer.appendChild(dialog);

            const found = getByRoleDialog(testContainer, { name: 'Editar Usuário #4029' });
            expect(found).toBe(dialog);
        });

        it('lança erro ao buscar diálogo por nome quando referências são órfãs e diálogo não tem fallback', () => {
            const dialog = document.createElement('div');
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-labelledby', 'referencia-orfana');
            testContainer.appendChild(dialog);

            expect(() => {
                getByRoleDialog(testContainer, { name: 'Título Qualquer' });
            }).toThrow();
        });
    });

    describe('Integração com componentes reais (MaxModal e MaxPopover)', () => {
        it('MaxModal aceita múltiplos IDREFs em ariaLabelledby e combina os textos', async () => {
            const p1 = document.createElement('div');
            p1.id = 'ext-parte-1';
            p1.textContent = 'Exclusão de Projeto';
            document.body.appendChild(p1);

            const p2 = document.createElement('div');
            p2.id = 'ext-parte-2';
            p2.textContent = 'Confirmação';
            document.body.appendChild(p2);

            const wrapper = mount(MaxModal, {
                props: {
                    ariaLabelledby: 'ext-parte-1 ext-parte-2'
                },
                global: {
                    stubs: {
                        Teleport: true,
                        MaxIconButton: {
                            template: '<button aria-label="Fechar"></button>'
                        }
                    }
                },
                attachTo: document.body
            });

            const vm = wrapper.vm as any;
            vm.open();
            await wrapper.vm.$nextTick();

            const modalEl = wrapper.find('.max-modal').element as HTMLElement;
            expect(modalEl.getAttribute('aria-labelledby')).toBe('ext-parte-1 ext-parte-2');
            expect(computeAccessibleName(modalEl)).toBe('Exclusão de Projeto Confirmação');

            const a11y = validateDialogA11y(modalEl);
            expect(a11y.passes).toBe(true);

            wrapper.unmount();
            p1.remove();
            p2.remove();
        });

        it('MaxModal filtra IDs órfãos passados em ariaLabelledby mantendo os válidos', async () => {
            const p1 = document.createElement('div');
            p1.id = 'ext-valido-modal';
            p1.textContent = 'Título Existente';
            document.body.appendChild(p1);

            const wrapper = mount(MaxModal, {
                props: {
                    ariaLabelledby: 'ext-valido-modal  id-orfao-fantasma'
                },
                global: {
                    stubs: {
                        Teleport: true,
                        MaxIconButton: {
                            template: '<button aria-label="Fechar"></button>'
                        }
                    }
                },
                attachTo: document.body
            });

            const vm = wrapper.vm as any;
            vm.open();
            await wrapper.vm.$nextTick();

            const modalEl = wrapper.find('.max-modal').element as HTMLElement;
            expect(modalEl.getAttribute('aria-labelledby')).toBe('ext-valido-modal');
            expect(computeAccessibleName(modalEl)).toBe('Título Existente');

            wrapper.unmount();
            p1.remove();
        });

        it('MaxModal aplica fallback "Diálogo" quando slot header é completamente vazio', async () => {
            const wrapper = mount(MaxModal, {
                slots: {
                    header: '   '
                },
                global: {
                    stubs: {
                        Teleport: true,
                        MaxIconButton: {
                            template: '<button aria-label="Fechar"></button>'
                        }
                    }
                },
                attachTo: document.body
            });

            const vm = wrapper.vm as any;
            vm.open();
            await wrapper.vm.$nextTick();

            const modalEl = wrapper.find('.max-modal').element as HTMLElement;
            expect(modalEl.getAttribute('aria-labelledby')).toBeNull();
            expect(modalEl.getAttribute('aria-label')).toBe('Diálogo');
            expect(computeAccessibleName(modalEl)).toBe('Diálogo');

            const a11y = validateDialogA11y(modalEl);
            expect(a11y.passes).toBe(true);

            wrapper.unmount();
        });

        it('MaxPopover resolve múltiplos IDREFs externos válidos', async () => {
            const extH = document.createElement('h3');
            extH.id = 'popover-ext-title';
            extH.textContent = 'Detalhes do Registro';
            document.body.appendChild(extH);

            const wrapper = mount(MaxPopover, {
                props: {
                    ariaLabelledby: 'popover-ext-title',
                    label: 'Abrir'
                },
                attachTo: document.body
            });

            const vm = wrapper.vm as any;
            vm.toggle();
            await wrapper.vm.$nextTick();

            const popoverEl = document.querySelector('.max-popover-dialog') as HTMLElement;
            expect(popoverEl).not.toBeNull();
            expect(popoverEl.getAttribute('aria-labelledby')).toBe('popover-ext-title');
            expect(computeAccessibleName(popoverEl)).toBe('Detalhes do Registro');

            wrapper.unmount();
            extH.remove();
        });

        it('MaxPopover preserva referência externa oculta para manter o nome explícito', async () => {
            const hiddenH = document.createElement('h3');
            hiddenH.id = 'popover-hidden-ref';
            hiddenH.style.display = 'none';
            hiddenH.textContent = 'Título Oculto';
            document.body.appendChild(hiddenH);

            const wrapper = mount(MaxPopover, {
                props: {
                    ariaLabelledby: 'popover-hidden-ref',
                    label: 'Abrir',
                    title: 'Título Fallback'
                },
                attachTo: document.body
            });

            const vm = wrapper.vm as any;
            vm.toggle();
            await wrapper.vm.$nextTick();

            const popoverEl = document.querySelector('.max-popover-dialog') as HTMLElement;
            expect(popoverEl).not.toBeNull();
            expect(popoverEl.getAttribute('aria-labelledby')).toBe('popover-hidden-ref');
            expect(computeAccessibleName(popoverEl)).toBe('Título Oculto');

            wrapper.unmount();
            hiddenH.remove();
        });
    });
});
