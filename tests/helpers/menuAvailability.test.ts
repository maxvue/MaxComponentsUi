import { describe, it, expect } from 'vitest';
import { isCurrentMenuUnavailable } from '../../src/helpers/menuAvailability';

describe('isCurrentMenuUnavailable (Helper puro de disponibilidade)', () => {
    describe('Valores e tipos de is_disponible (comparação booleana estrita)', () => {
        it('retorna true quando is_disponible é explicitamente false na raiz', () => {
            const items = [{ route: 'financeiro', is_disponible: false }];
            expect(isCurrentMenuUnavailable(items, { name: 'financeiro' })).toBe(true);
        });

        it('retorna true quando is_disponible é false em details', () => {
            const items = [{ details: { route: 'financeiro', is_disponible: false } }];
            expect(isCurrentMenuUnavailable(items, { name: 'financeiro' })).toBe(true);
        });

        it('prevalece a raiz sobre details quando a raiz define boolean true', () => {
            const items = [{ route: 'financeiro', is_disponible: true, details: { is_disponible: false } }];
            expect(isCurrentMenuUnavailable(items, { name: 'financeiro' })).toBe(false);
        });

        it('usa details como fallback quando a raiz é null', () => {
            const items = [{ route: 'financeiro', is_disponible: null, details: { is_disponible: false } }];
            expect(isCurrentMenuUnavailable(items, { name: 'financeiro' })).toBe(true);
        });

        it('retorna false quando is_disponible é explicitamente true', () => {
            const items = [{ route: 'financeiro', is_disponible: true }];
            expect(isCurrentMenuUnavailable(items, { name: 'financeiro' })).toBe(false);
        });

        it('retorna false quando is_disponible está ausente (undefined)', () => {
            const items = [{ route: 'financeiro' }];
            expect(isCurrentMenuUnavailable(items, { name: 'financeiro' })).toBe(false);
        });

        it('retorna false quando is_disponible é null em raiz e details', () => {
            const items = [{ route: 'financeiro', is_disponible: null, details: { is_disponible: null } }];
            expect(isCurrentMenuUnavailable(items, { name: 'financeiro' })).toBe(false);
        });

        it('retorna false para string "false" (não realiza coerção de tipos)', () => {
            const items = [{ route: 'financeiro', is_disponible: 'false' as any }];
            expect(isCurrentMenuUnavailable(items, { name: 'financeiro' })).toBe(false);
        });

        it('retorna false para número 0 (não realiza coerção de tipos falsy)', () => {
            const items = [{ route: 'financeiro', is_disponible: 0 as any }];
            expect(isCurrentMenuUnavailable(items, { name: 'financeiro' })).toBe(false);
        });
    });

    describe('Identidade e correspondência de rotas', () => {
        it('corresponde via route direto com snakeCase', () => {
            const items = [{ route: 'painel-solar', is_disponible: false }];
            expect(isCurrentMenuUnavailable(items, { name: 'painel_solar' })).toBe(true);
        });

        it('corresponde via rota legado', () => {
            const items = [{ rota: 'clientes_lista', is_disponible: false }];
            expect(isCurrentMenuUnavailable(items, { name: 'clientes-lista' })).toBe(true);
        });

        it('corresponde via page_component na raiz', () => {
            const items = [{ page_component: 'relatorios_gerais', is_disponible: false }];
            expect(isCurrentMenuUnavailable(items, { name: 'relatorios-gerais' })).toBe(true);
        });

        it('corresponde via details.route e details.page_component', () => {
            const item1 = [{ details: { route: 'faturamento_mensal', is_disponible: false } }];
            expect(isCurrentMenuUnavailable(item1, { name: 'faturamento-mensal' })).toBe(true);

            const item2 = [{ details: { page_component: 'faturamento_anual', is_disponible: false } }];
            expect(isCurrentMenuUnavailable(item2, { name: 'faturamento-anual' })).toBe(true);
        });

        it('corresponde caminho iniciado com "/" por igualdade exata com route.path sem snakeCase', () => {
            const items = [{ route: '/app/admin/solar-settings', is_disponible: false }];
            expect(isCurrentMenuUnavailable(items, { path: '/app/admin/solar-settings' })).toBe(true);
            expect(isCurrentMenuUnavailable(items, { path: '/app/admin/solar_settings' })).toBe(false);
        });

        it('não corresponde por prefixo de caminho parcial', () => {
            const items = [{ route: '/app/admin', is_disponible: false }];
            expect(isCurrentMenuUnavailable(items, { path: '/app/admin/detalhes' })).toBe(false);
        });

        it('corresponde por aliases em matches (array de strings)', () => {
            const items = [{
                route: 'clientes',
                matches: ['clientes_show', 'clientes_edit'],
                is_disponible: false
            }];
            expect(isCurrentMenuUnavailable(items, { name: 'clientes_show' })).toBe(true);
            expect(isCurrentMenuUnavailable(items, { name: 'clientes_edit' })).toBe(true);
            expect(isCurrentMenuUnavailable(items, { name: 'clientes_create' })).toBe(false);
        });

        it('corresponde matches contendo caminhos iniciados por "/"', () => {
            const items = [{
                route: 'clientes',
                matches: ['/clientes/novo', '/clientes/detalhes'],
                is_disponible: false
            }];
            expect(isCurrentMenuUnavailable(items, { path: '/clientes/novo' })).toBe(true);
            expect(isCurrentMenuUnavailable(items, { path: '/clientes/outros' })).toBe(false);
        });
    });

    describe('Precedência e resolução entre múltiplos candidatos', () => {
        it('destino direto tem prioridade absoluta sobre alias matches', () => {
            const items = [
                {
                    id: 'item-alias',
                    route: 'dashboard',
                    matches: ['relatorio_vendas'],
                    is_disponible: false
                },
                {
                    id: 'item-direto',
                    route: 'relatorio_vendas',
                    is_disponible: true
                }
            ];

            // O item com rota direta é true (disponível); o item com matches é false (indisponível).
            // Como direto vence alias, a disponibilidade do item direto prevalece (false para unavailable).
            expect(isCurrentMenuUnavailable(items, { name: 'relatorio_vendas' })).toBe(false);
        });

        it('item mais profundo na hierarquia vence na mesma classe (profundidade de subitens)', () => {
            const items = [
                {
                    id: 'pai',
                    route: 'configuracoes',
                    is_disponible: false,
                    subitems: [
                        {
                            id: 'filho',
                            route: 'configuracoes',
                            is_disponible: true
                        }
                    ]
                }
            ];

            // Filho está na profundidade 1, pai na 0. Ambos têm destino direto.
            // Filho mais profundo vence (disponível = true, unavailable = false).
            expect(isCurrentMenuUnavailable(items, { name: 'configuracoes' })).toBe(false);
        });

        it('subitem indisponível vence pai disponível para a rota do subitem', () => {
            const items = [
                {
                    id: 'pai',
                    route: 'solar',
                    is_disponible: true,
                    subitems: [
                        {
                            id: 'filho',
                            route: 'solar_calculadora',
                            is_disponible: false
                        }
                    ]
                }
            ];

            expect(isCurrentMenuUnavailable(items, { name: 'solar_calculadora' })).toBe(true);
        });

        it('empates na mesma classe e profundidade escolhem a primeira ocorrência na ordem', () => {
            const items = [
                { id: 'primeiro', route: 'perfil', is_disponible: false },
                { id: 'segundo', route: 'perfil', is_disponible: true }
            ];

            // Primeiro item encontrado na lista vence o empate.
            expect(isCurrentMenuUnavailable(items, { name: 'perfil' })).toBe(true);
        });
    });

    describe('Sem herança implícita e isolamento', () => {
        it('pai indisponível sem destino ou com destino diferente não bloqueia filhos com rota própria', () => {
            const items = [
                {
                    id: 'pai',
                    title: 'Gestão Solar',
                    is_disponible: false,
                    subitems: [
                        {
                            id: 'filho',
                            route: 'projetos',
                            is_disponible: true
                        }
                    ]
                }
            ];

            expect(isCurrentMenuUnavailable(items, { name: 'projetos' })).toBe(false);
        });

        it('pai indisponível com destino próprio não bloqueia filho disponível com destino próprio', () => {
            const items = [
                {
                    id: 'pai',
                    route: 'solar_pai',
                    is_disponible: false,
                    subitems: [
                        {
                            id: 'filho',
                            route: 'solar_filho',
                            is_disponible: true
                        }
                    ]
                }
            ];

            expect(isCurrentMenuUnavailable(items, { name: 'solar_filho' })).toBe(false);
            expect(isCurrentMenuUnavailable(items, { name: 'solar_pai' })).toBe(true);
        });

        it('não bloqueia rotas que não possuem correspondência nos menus', () => {
            const items = [
                { route: 'painel', is_disponible: false },
                { route: 'usuarios', is_disponible: false }
            ];

            expect(isCurrentMenuUnavailable(items, { name: 'outra_rota' })).toBe(false);
        });
    });

    describe('Hierarquia flexível de subitens e proteção contra ciclos', () => {
        it('extrai subitens de items e children', () => {
            const items1 = [{
                route: 'pai',
                items: [{ route: 'filho_items', is_disponible: false }]
            }];
            expect(isCurrentMenuUnavailable(items1, { name: 'filho_items' })).toBe(true);

            const items2 = [{
                route: 'pai',
                children: [{ route: 'filho_children', is_disponible: false }]
            }];
            expect(isCurrentMenuUnavailable(items2, { name: 'filho_children' })).toBe(true);
        });

        it('extrai subitens dentro de details.subitems', () => {
            const items = [{
                route: 'pai',
                details: {
                    subitems: [{ route: 'sub_details', is_disponible: false }]
                }
            }];
            expect(isCurrentMenuUnavailable(items, { name: 'sub_details' })).toBe(true);
        });

        it('resiste a referências cíclicas em subitens sem estourar pilha', () => {
            const cyclicItem: any = { route: 'ciclico', is_disponible: false };
            cyclicItem.subitems = [cyclicItem];

            expect(() => isCurrentMenuUnavailable([cyclicItem], { name: 'ciclico' })).not.toThrow();
            expect(isCurrentMenuUnavailable([cyclicItem], { name: 'ciclico' })).toBe(true);
        });
    });

    describe('Casos degenerados e limites', () => {
        it('retorna false para items nulos ou vazios', () => {
            expect(isCurrentMenuUnavailable(null, { name: 'inicio' })).toBe(false);
            expect(isCurrentMenuUnavailable(undefined, { name: 'inicio' })).toBe(false);
            expect(isCurrentMenuUnavailable([], { name: 'inicio' })).toBe(false);
        });

        it('retorna false para rota vazia ou nula', () => {
            const items = [{ route: 'inicio', is_disponible: false }];
            expect(isCurrentMenuUnavailable(items, null)).toBe(false);
            expect(isCurrentMenuUnavailable(items, undefined)).toBe(false);
            expect(isCurrentMenuUnavailable(items, {})).toBe(false);
            expect(isCurrentMenuUnavailable(items, { name: '', path: '' })).toBe(false);
        });

        it('ignora itens que não são objetos na lista', () => {
            const items = [null, undefined, 'string', 123, { route: 'valido', is_disponible: false }];
            expect(isCurrentMenuUnavailable(items as any, { name: 'valido' })).toBe(true);
        });
    });
});
