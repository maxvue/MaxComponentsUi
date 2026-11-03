import { describe, it, expect } from 'vitest';
import { getMenuItemIconSize } from '../../src/helpers/menuHelpers';
import type { MenuIconPosition } from '../../src/types/app';

describe('getMenuItemIconSize', () => {
    describe('Posição side', () => {
        it('deve respeitar size_side na raiz com maior precedência', () => {
            const item = {
                size_side: '1.8rem',
                side_size: '1.6rem',
                size: '2.0rem',
                details: {
                    size_side: '1.4rem',
                    side_size: '1.3rem',
                    size: '1.7rem'
                }
            };
            expect(getMenuItemIconSize(item, 'side', '1.5')).toBe('1.8rem');
        });

        it('deve usar side_size na raiz quando size_side não estiver presente', () => {
            const item = {
                side_size: '1.6rem',
                size: '2.0rem',
                details: {
                    size_side: '1.4rem'
                }
            };
            expect(getMenuItemIconSize(item, 'side', '1.5')).toBe('1.6rem');
        });

        it('deve preferir específico em details (details.size_side) sobre genérico na raiz (size)', () => {
            const item = {
                size: '2.0rem',
                details: {
                    size_side: '1.4rem',
                    side_size: '1.3rem'
                }
            };
            expect(getMenuItemIconSize(item, 'side', '1.5')).toBe('1.4rem');
        });

        it('deve usar details.side_size quando details.size_side não estiver presente e superar genérico na raiz', () => {
            const item = {
                size: '2.0rem',
                details: {
                    side_size: '1.3rem'
                }
            };
            expect(getMenuItemIconSize(item, 'side', '1.5')).toBe('1.3rem');
        });

        it('deve usar genérico size na raiz quando não houver específicos da posição', () => {
            const item = {
                size: '1.75',
                details: {
                    size: '1.2'
                }
            };
            expect(getMenuItemIconSize(item, 'side', '1.5')).toBe('1.75');
        });

        it('deve usar genérico em details.size quando não houver tamanho na raiz nem específico', () => {
            const item = {
                details: {
                    size: '1.25rem'
                }
            };
            expect(getMenuItemIconSize(item, 'side', '1.5')).toBe('1.25rem');
        });

        it('deve retornar fallback quando nenhum campo for informado', () => {
            const item = {
                label: 'Item sem tamanho'
            };
            expect(getMenuItemIconSize(item, 'side', '1.5')).toBe('1.5');
        });

        it('deve ignorar campos de outras posições como bottom e top', () => {
            const item = {
                size_bottom: '2.5rem',
                bottom_size: '2.2rem',
                size_top: '1.8rem',
                top_size: '1.9rem',
                details: {
                    size_bottom: '2.0rem',
                    size_top: '1.7rem'
                }
            };
            expect(getMenuItemIconSize(item, 'side', '1.5')).toBe('1.5');
        });
    });

    describe('Posição bottom', () => {
        it('deve resolver na ordem correta para bottom', () => {
            expect(getMenuItemIconSize({ size_bottom: 24 }, 'bottom', '1.3')).toBe(24);
            expect(getMenuItemIconSize({ bottom_size: '22px' }, 'bottom', '1.3')).toBe('22px');
            expect(getMenuItemIconSize({ size: '1.5rem', details: { size_bottom: '1.4rem' } }, 'bottom', '1.3')).toBe('1.4rem');
            expect(getMenuItemIconSize({ size: '1.5rem', details: { bottom_size: '1.2rem' } }, 'bottom', '1.3')).toBe('1.2rem');
            expect(getMenuItemIconSize({ size: '1.7rem' }, 'bottom', '1.3')).toBe('1.7rem');
            expect(getMenuItemIconSize({ details: { size: '1.6rem' } }, 'bottom', '1.3')).toBe('1.6rem');
            expect(getMenuItemIconSize({}, 'bottom', '1.3')).toBe('1.3');
        });

        it('deve ignorar campos de side e top em bottom', () => {
            const item = {
                size_side: '2.0rem',
                size_top: '1.8rem'
            };
            expect(getMenuItemIconSize(item, 'bottom', '1.3')).toBe('1.3');
        });
    });

    describe('Posição top', () => {
        it('deve resolver na ordem correta para top', () => {
            expect(getMenuItemIconSize({ size_top: '1.9rem' }, 'top', '1.2')).toBe('1.9rem');
            expect(getMenuItemIconSize({ top_size: '1.8rem' }, 'top', '1.2')).toBe('1.8rem');
            expect(getMenuItemIconSize({ size: '2.5rem', details: { size_top: '1.5rem' } }, 'top', '1.2')).toBe('1.5rem');
            expect(getMenuItemIconSize({ size: '2.5rem', details: { top_size: '1.4rem' } }, 'top', '1.2')).toBe('1.4rem');
            expect(getMenuItemIconSize({ size: '1.6rem' }, 'top', '1.2')).toBe('1.6rem');
            expect(getMenuItemIconSize({ details: { size: '1.3rem' } }, 'top', '1.2')).toBe('1.3rem');
            expect(getMenuItemIconSize({}, 'top', '1.2')).toBe('1.2');
        });

        it('deve ignorar campos de side e bottom em top', () => {
            const item = {
                size_side: '2.0rem',
                size_bottom: '1.8rem'
            };
            expect(getMenuItemIconSize(item, 'top', '1.2')).toBe('1.2');
        });
    });

    describe('Tipos de valores, unidades e formatação', () => {
        it('deve aceitar números finitos não negativos', () => {
            expect(getMenuItemIconSize({ size: 1.5 }, 'side', '1.5')).toBe(1.5);
            expect(getMenuItemIconSize({ size: 2 }, 'side', '1.5')).toBe(2);
            expect(getMenuItemIconSize({ size: 0 }, 'side', '1.5')).toBe(0);
        });

        it('deve preservar o zero explícito sem substituir por fallback', () => {
            expect(getMenuItemIconSize({ size: 0 }, 'side', '1.5')).toBe(0);
            expect(getMenuItemIconSize({ size_side: '0' }, 'side', '1.5')).toBe('0');
            expect(getMenuItemIconSize({ size: '0px' }, 'bottom', '1.3')).toBe('0px');
            expect(getMenuItemIconSize({ details: { size_top: 0 } }, 'top', '1.2')).toBe(0);
        });

        it('deve aceitar strings decimais puras', () => {
            expect(getMenuItemIconSize({ size: '1.75' }, 'side', '1.5')).toBe('1.75');
            expect(getMenuItemIconSize({ size: ' 2.5 ' }, 'side', '1.5')).toBe('2.5');
        });

        it('deve aceitar unidades válidas suportadas', () => {
            const units = ['px', 'rem', 'em', 'vw', 'vh', 'vmin', 'vmax'];
            for (const u of units) {
                const val = `1.5${u}`;
                expect(getMenuItemIconSize({ size: val }, 'side', '1.5')).toBe(val);
                expect(getMenuItemIconSize({ size: `20${u.toUpperCase()}` }, 'side', '1.5')).toBe(`20${u.toUpperCase()}`);
            }
        });

        it('deve descartar valores inválidos e passar para o próximo candidato ou fallback', () => {
            const invalids = [
                -1,
                -0.5,
                NaN,
                Infinity,
                -Infinity,
                '-1',
                '-2rem',
                '',
                '   ',
                null,
                undefined,
                true,
                false,
                {},
                [],
                '50%',
                '100%',
                'calc(100% - 10px)',
                'var(--icon-size)',
                'small',
                'medium',
                'large',
                'auto',
                'invalid-unit'
            ];

            for (const inv of invalids) {
                // Se candidato prioritário for inválido, deve pegar o próximo válido
                const itemComProximo = {
                    size_side: inv,
                    size: '1.8rem'
                };
                expect(getMenuItemIconSize(itemComProximo, 'side', '1.5')).toBe('1.8rem');

                // Se todos forem inválidos, deve retornar o fallback
                const itemApenasInvalido = {
                    size_side: inv,
                    size: inv
                };
                expect(getMenuItemIconSize(itemApenasInvalido, 'side', '1.5')).toBe('1.5');
            }
        });
    });

    describe('Robustez, imutabilidade e não herança', () => {
        it('deve lidar com item null, undefined ou tipos não-objeto com segurança', () => {
            expect(getMenuItemIconSize(null, 'side', '1.5')).toBe('1.5');
            expect(getMenuItemIconSize(undefined, 'bottom', '1.3')).toBe('1.3');
            expect(getMenuItemIconSize('string-item', 'top', '1.2')).toBe('1.2');
            expect(getMenuItemIconSize(123, 'side', '1.5')).toBe('1.5');
        });

        it('não deve mutar o objeto de entrada nem seu details', () => {
            const item = {
                size_side: '1.8rem',
                details: {
                    size: '1.2rem'
                }
            };
            const snapshot = JSON.stringify(item);
            getMenuItemIconSize(item, 'side', '1.5');
            expect(JSON.stringify(item)).toBe(snapshot);
        });

        it('subitem sem tamanho não deve herdar tamanho do pai automaticamente', () => {
            const parent = {
                size_side: '2.0rem',
                subitems: [
                    { label: 'Filho sem tamanho' }
                ]
            };
            const child = parent.subitems[0];
            // O pai tem 2.0rem, mas o filho resolve independentemente
            expect(getMenuItemIconSize(parent, 'side', '1.5')).toBe('2.0rem');
            expect(getMenuItemIconSize(child, 'side', '1.0')).toBe('1.0');
        });

        it('retorna fallback quando a posição for desconhecida', () => {
            const item = { size: '1.8rem' };
            expect(getMenuItemIconSize(item, 'unknown' as MenuIconPosition, '1.5')).toBe('1.5');
        });
    });
});
