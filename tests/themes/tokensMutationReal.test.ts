/**
 * R17/F23A — Mutation Test Real de Tokens CSS
 *
 * Este teste substitui as matrizes hardcoded do tokens.test.ts por leitura
 * dinâmica do CSS compilado real a partir do SCSS fonte. Além disso, implementa
 * um mutation test genuíno: compila em memória uma versão mutada do token e prova
 * que o mesmo teste falha — sem modificar nenhum arquivo rastreado pelo git.
 *
 * Cobre todas as severidades e estados dos tokens de foco e seleção (light/dark).
 */

import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import * as sass from 'sass';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─────────────────────────────────────────────
// Utilitários de extração do CSS compilado
// ─────────────────────────────────────────────


/**
 * Extrai as declarações `--token: valor;` de um bloco seletor.
 * Suporta valores com múltiplos `:` (ex.: `var(--x, #fff)`).
 */
function extrairBlockVars(css: string, selector: string): Record<string, string> {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
    if (!match) return {};
    const out: Record<string, string> = {};
    for (const decl of match[1].split(';')) {
        const [name, ...rest] = decl.split(':');
        if (!name || !rest.length) continue;
        const key = name.trim();
        if (key.startsWith('--')) out[key] = rest.join(':').trim();
    }
    return out;
}

// ─────────────────────────────────────────────
// CSS compilado real do tokens.scss
// ─────────────────────────────────────────────

const TOKENS_SCSS_PATH = resolve(__dirname, '../../src/themes/tokens.scss');
const COLORS_SCSS_PATH = resolve(__dirname, '../../src/themes/colors.scss');
const MAX_BUTTON_PATH = resolve(__dirname, '../../src/components/MaxButton.vue');
const CSS_REAL = sass.compile(TOKENS_SCSS_PATH).css;
const ROOT_REAL = extrairBlockVars(CSS_REAL, ':root');
const DARK_REAL = extrairBlockVars(CSS_REAL, '.dark');
const CSS_CORES = sass.compile(COLORS_SCSS_PATH).css;

function extrairTodasAsVars(css: string, selector: string): Record<string, string> {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const blocos = css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g'));
    const vars: Record<string, string> = {};
    for (const bloco of blocos) Object.assign(vars, extrairBlockVars(bloco[0], selector));
    return vars;
}

const CORES_ROOT = extrairTodasAsVars(CSS_CORES, ':root');
const CORES_DARK = {
    ...CORES_ROOT,
    ...extrairTodasAsVars(CSS_CORES, '.dark')
};

function extrairEstiloScssDoComponente(arquivo: string): string {
    const sfc = fs.readFileSync(arquivo, 'utf-8');
    const style = /<style lang="scss" scoped>([\s\S]*?)<\/style>/.exec(sfc)?.[1];
    if (!style) throw new Error(`Style SCSS ausente em ${arquivo}`);
    return style;
}

const CSS_MAX_BUTTON = sass.compileString(extrairEstiloScssDoComponente(MAX_BUTTON_PATH)).css;

// ─────────────────────────────────────────────
// Resolução de variáveis CSS (para cálculo de contraste)
// ─────────────────────────────────────────────

function resolverCssVar(valor: string, escopo: Record<string, string>, visitados = new Set<string>()): string {
    const val = valor.trim();
    if (!val.startsWith('var(')) return /^#[0-9a-fA-F]{3}$/.test(val)
        ? `#${[...val.slice(1)].map((canal) => canal.repeat(2)).join('')}`
        : val;
    const corpo = val.slice(4, -1);
    let profundidade = 0;
    const separador = [...corpo].findIndex((char) => {
        if (char === '(') profundidade += 1;
        if (char === ')') profundidade -= 1;
        return char === ',' && profundidade === 0;
    });
    const nome = (separador < 0 ? corpo : corpo.slice(0, separador)).trim();
    const fallback = separador < 0 ? '' : corpo.slice(separador + 1).trim();
    if (visitados.has(nome)) return fallback ? resolverCssVar(fallback, escopo, visitados) : val;
    if (escopo[nome]) {
        const proximaVisita = new Set(visitados).add(nome);
        return resolverCssVar(escopo[nome], escopo, proximaVisita);
    }
    return fallback ? resolverCssVar(fallback, escopo, visitados) : val;
}

/**
 * Calcula luminância relativa de uma cor hexadecimal (WCAG 2.x).
 */
function luminanciaHex(hex: string): number {
    const limpo = hex.replace('#', '');
    const r = parseInt(limpo.slice(0, 2), 16) / 255;
    const g = parseInt(limpo.slice(2, 4), 16) / 255;
    const b = parseInt(limpo.slice(4, 6), 16) / 255;
    const srgb = [r, g, b].map((v) =>
        v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/**
 * Calcula a razão de contraste WCAG entre duas cores hexadecimais.
 */
function razaoContraste(hex1: string, hex2: string): number {
    const l1 = luminanciaHex(hex1);
    const l2 = luminanciaHex(hex2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function misturarSobreSuperficie(foreground: string, superficie: string, percentual: number): string {
    const canais = (hex: string) => [0, 2, 4].map((inicio) => parseInt(hex.slice(inicio + 1, inicio + 3), 16));
    const [fr, fg, fb] = canais(foreground);
    const [sr, sg, sb] = canais(superficie);
    const misturar = (frente: number, tras: number) => Math.round(frente * percentual + tras * (1 - percentual));
    return `#${[misturar(fr, sr), misturar(fg, sg), misturar(fb, sb)].map((canal) => canal.toString(16).padStart(2, '0')).join('')}`;
}

function extrairDeclaracao(css: string, seletor: string, propriedade: 'background' | 'color'): string {
    const escaped = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const bloco = new RegExp(`${escaped}[^\\{]*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
    const valor = new RegExp(`(?:^|;)\\s*${propriedade}:\\s*([^;]+);`).exec(bloco)?.[1]?.trim();
    if (!valor) throw new Error(`${propriedade} ausente em regra compilada ${seletor}`);
    return valor.replace(/ !important$/, '');
}

type EstadoBotao = 'repouso' | 'hover';
type ParDeBotao = { severidade: string; estado: EstadoBotao; fundo: string; texto: string };

const SEVERIDADES_SOLIDAS = [
    ['primary', '.max-button'],
    ['secondary', '.max-button.max-button-secondary'],
    ['success', '.max-button.max-button-success'],
    ['info', '.max-button.max-button-info'],
    ['warning', '.max-button.max-button-warning'],
    ['danger', '.max-button.max-button-danger'],
    ['whatsapp', '.max-button.max-button-whatsapp'],
    ['help', '.max-button.max-button-help'],
    ['contrast', '.max-button.max-button-contrast']
] as const;

const VARIANTES_TRANSPARENTES = ['outlined', 'text', 'link', 'dashed'] as const;
const ESTADOS_VARIANTE = ['repouso', 'hover', 'focus-visible', 'active', 'disabled'] as const;

/**
 * A matriz é derivada das regras compiladas, e não de pares de cores escritos
 * no teste. Fundo transparente é resolvido contra a superfície real do tema.
 * `disabled` é coberto como estado (opacidade/cursor), mas é uma exceção WCAG
 * para contraste de conteúdo inativo.
 */
function validarMatrizDeVariantes(cssTokens: string, escopo: Record<string, string>, modo: 'light' | 'dark'): void {
    const superficie = resolverCssVar('var(--background-0, #ffffff)', escopo);
    for (const variante of VARIANTES_TRANSPARENTES) {
        for (const [severidade] of SEVERIDADES_SOLIDAS) {
            const classe = severidade === 'primary' ? '' : `.max-button-${severidade}`;
            const seletor = `.max-button.max-button-${variante}${classe}`;
            const seletorDeCor = variante === 'dashed' && severidade !== 'primary'
                ? seletor
                : variante === 'dashed'
                    ? '.max-button.max-button-dashed'
                    : seletor;
            const texto = resolverCssVar(extrairDeclaracao(CSS_MAX_BUTTON, seletorDeCor, 'color'), escopo);

            for (const estado of ESTADOS_VARIANTE) {
                if (estado === 'disabled') {
                    const blocoDisabled = /\.max-button:disabled\s*\{([^}]*)\}/.exec(CSS_MAX_BUTTON)?.[1] ?? '';
                    // A ausência de `color` é esperada: disabled herda a cor e reduz opacidade.
                    expect(blocoDisabled, `${modo}/${variante}/${severidade}/disabled deve reduzir opacidade`).toMatch(/opacity:\s*0\.6/);
                    expect(blocoDisabled, `${modo}/${variante}/${severidade}/disabled não deve substituir color`).not.toMatch(/(?:^|;)\s*color:/);
                    continue;
                }

                if (estado === 'focus-visible') {
                    const anel = resolverCssVar(escopo['--max-focus-ring-color'] ?? '', escopo);
                    expect(anel, `${modo}/${variante}/${severidade}/focus: anel deve resolver`).toMatch(/^#[0-9a-fA-F]{6}$/);
                    expect(razaoContraste(anel, superficie), `${modo}/${variante}/${severidade}/focus: contraste do anel insuficiente`).toBeGreaterThanOrEqual(3);
                    continue;
                }

                if (estado === 'active' && variante === 'dashed') {
                    expect(
                        extrairDeclaracao(CSS_MAX_BUTTON, '.max-button.max-button-dashed:active', 'background'),
                        `${modo}/dashed/${severidade}/active deve preservar fundo transparente`
                    ).toMatch(/^transparent/);
                }

                expect(texto, `${modo}/${variante}/${severidade}/${estado}: texto deve resolver`).toMatch(/^#[0-9a-fA-F]{6}$/);
                expect(superficie, `${modo}/${variante}/${severidade}/${estado}: superfície deve resolver`).toMatch(/^#[0-9a-fA-F]{6}$/);
                const fundo = estado === 'hover' && (variante === 'outlined' || variante === 'text')
                    ? misturarSobreSuperficie(texto, superficie, 0.1)
                    : superficie;
                expect(razaoContraste(texto, fundo), `${modo}/${variante}/${severidade}/${estado}: contraste insuficiente`).toBeGreaterThanOrEqual(4.5);
            }
        }
    }
}

/** Estados que herdam a cor/fundo sólido precisam continuar no gate: a
 * ausência de uma regra :active não é uma lacuna, mas a cascata real que
 * preserva o estado de repouso. Focus-visible mede o anel compilado contra a
 * superfície adjacente; disabled confirma a exceção de conteúdo inativo. */
function validarEstadosSolidos(cssTokens: string, escopo: Record<string, string>, modo: 'light' | 'dark'): void {
    const superficie = resolverCssVar('var(--background-0, #ffffff)', escopo);
    const blocoDisabled = /\.max-button:disabled\s*\{([^}]*)\}/.exec(CSS_MAX_BUTTON)?.[1] ?? '';
    expect(blocoDisabled, `${modo}/solid/disabled deve reduzir opacidade`).toMatch(/opacity:\s*0\.6/);
    expect(blocoDisabled, `${modo}/solid/disabled não deve substituir color`).not.toMatch(/(?:^|;)\s*color:/);

    for (const [severidade, seletor] of SEVERIDADES_SOLIDAS) {
        const seletorEscuro = `:global(.dark) ${seletor}`;
        const seletorEfetivo = modo === 'dark' && severidade === 'contrast' ? seletorEscuro : seletor;
        const fundoRepouso = resolverCssVar(extrairDeclaracao(CSS_MAX_BUTTON, seletorEfetivo, 'background'), escopo);
        const textoRepouso = resolverCssVar(extrairDeclaracao(CSS_MAX_BUTTON, seletorEfetivo, 'color'), escopo);
        const fundoAtivo = fundoRepouso;
        const textoAtivo = textoRepouso;

        // MaxButton não declara :active para sólidos: o CSSOM preserva as
        // declarações de repouso. Validamos explicitamente esse fallback da cascata.
        expect(razaoContraste(fundoAtivo, textoAtivo), `${modo}/solid/${severidade}/active: contraste insuficiente`).toBeGreaterThanOrEqual(4.5);

        const anel = resolverCssVar(escopo['--max-focus-ring-color'] ?? '', escopo);
        expect(razaoContraste(anel, superficie), `${modo}/solid/${severidade}/focus-visible: contraste do anel insuficiente`).toBeGreaterThanOrEqual(3);
        expect(razaoContraste(fundoRepouso, textoRepouso), `${modo}/solid/${severidade}/disabled: par herdado deve ser mensurável`).toBeGreaterThanOrEqual(4.5);
    }
}

function paresSolidosDoCssCompilado(escopo: Record<string, string>, modo: 'light' | 'dark'): ParDeBotao[] {
    return SEVERIDADES_SOLIDAS.flatMap(([severidade, seletor]) => {
        const regras = (['repouso', 'hover'] as const).map((estado) => {
            const regra = estado === 'hover' ? `${seletor}:hover` : seletor;
            const regraDark = `:global(.dark) ${regra}`;
            const seletorEfetivo = modo === 'dark' && severidade === 'contrast' ? regraDark : regra;
            return {
                severidade,
                estado,
                fundo: resolverCssVar(extrairDeclaracao(CSS_MAX_BUTTON, seletorEfetivo, 'background'), escopo),
                texto: resolverCssVar(extrairDeclaracao(CSS_MAX_BUTTON, seletorEfetivo, 'color'), escopo)
            };
        });
        return regras;
    });
}

function executarGateDeContraste(cssTokens: string): void {
    const raizTokens = extrairBlockVars(cssTokens, ':root');
    const darkTokens = extrairBlockVars(cssTokens, '.dark');
    const escopoLight = { ...CORES_ROOT, ...raizTokens };
    const escopoDark = { ...CORES_DARK, ...raizTokens, ...darkTokens };
    const pares = [
        ['foco light', raizTokens['--max-focus-ring-color'], raizTokens['--max-focus-ring-offset-color'], 3],
        ['foco dark', darkTokens['--max-focus-ring-color'], darkTokens['--max-focus-ring-offset-color'], 3],
        ['seleção light', raizTokens['--max-selection-background'], raizTokens['--max-selection-content'], 4.5],
        ['seleção hover light', raizTokens['--max-selection-hover-background'], raizTokens['--max-selection-hover-content'], 4.5],
        ['seleção dark', darkTokens['--max-selection-background'], darkTokens['--max-selection-content'], 4.5],
        ['seleção hover dark', darkTokens['--max-selection-hover-background'], darkTokens['--max-selection-hover-content'], 4.5]
    ] as const;
    for (const [nome, fundoToken, textoToken, minimo] of pares) {
        const escopo = nome.includes('dark') ? escopoDark : escopoLight;
        const fundo = resolverCssVar(fundoToken ?? '', escopo);
        const texto = resolverCssVar(textoToken ?? '', escopo);
        expect(fundo, `${nome}: fundo deve resolver para hexadecimal`).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(texto, `${nome}: texto deve resolver para hexadecimal`).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(razaoContraste(fundo, texto), `${nome}: contraste insuficiente`).toBeGreaterThanOrEqual(minimo);
    }
    for (const modo of ['light', 'dark'] as const) {
        const escopo = modo === 'light' ? escopoLight : escopoDark;
        for (const par of paresSolidosDoCssCompilado(escopo, modo)) {
            expect(par.fundo, `${modo}/${par.severidade}/${par.estado}: fundo deve resolver`).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(par.texto, `${modo}/${par.severidade}/${par.estado}: texto deve resolver`).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(razaoContraste(par.fundo, par.texto), `${modo}/${par.severidade}/${par.estado}: contraste insuficiente`).toBeGreaterThanOrEqual(4.5);
        }
        validarMatrizDeVariantes(cssTokens, escopo, modo);
        validarEstadosSolidos(cssTokens, escopo, modo);
    }
}

// ─────────────────────────────────────────────
// Tokens de foco e seleção — derivados do CSS real
// ─────────────────────────────────────────────

/** Tokens canônicos de foco que DEVEM existir em :root */
const TOKENS_FOCO_LIGHT = [
    '--max-focus-ring-color',
    '--max-focus-ring-offset-color',
    '--max-focus-ring',
    '--max-focus-outline'
] as const;

/** Tokens canônicos de foco que DEVEM existir em .dark */
const TOKENS_FOCO_DARK = [...TOKENS_FOCO_LIGHT] as const;

/** Severidades dos tokens de borda de botão (todas devem estar em :root e .dark) */
const SEVERIDADES_BOTAO = [
    'primary',
    'secondary',
    'info',
    'success',
    'warn',
    'help',
    'danger',
    'contrast'
] as const;

/** Estados de seleção que devem ter contraste adequado */
const PARES_SELECAO_LIGHT: Array<{ bg: string; fg: string }> = [
    {
        bg: resolverCssVar(ROOT_REAL['--max-selection-background'] ?? '', ROOT_REAL),
        fg: resolverCssVar(ROOT_REAL['--max-selection-content'] ?? '', ROOT_REAL)
    },
    {
        bg: resolverCssVar(ROOT_REAL['--max-selection-hover-background'] ?? '', ROOT_REAL),
        fg: resolverCssVar(ROOT_REAL['--max-selection-hover-content'] ?? '', ROOT_REAL)
    }
];

const PARES_SELECAO_DARK: Array<{ bg: string; fg: string }> = [
    {
        bg: resolverCssVar(DARK_REAL['--max-selection-background'] ?? '', DARK_REAL),
        fg: resolverCssVar(DARK_REAL['--max-selection-content'] ?? '', DARK_REAL)
    },
    {
        bg: resolverCssVar(DARK_REAL['--max-selection-hover-background'] ?? '', DARK_REAL),
        fg: resolverCssVar(DARK_REAL['--max-selection-hover-content'] ?? '', DARK_REAL)
    }
];

// ─────────────────────────────────────────────
// Testes — leitura dinâmica do CSS compilado
// ─────────────────────────────────────────────

describe('R17/F23A — CSS compilado de tokens: foco, seleção e severidades', () => {
    // ── 1. Tokens de foco existem no CSS compilado ──────────────────────────
    describe('Tokens de foco canônicos — presença no CSS compilado', () => {
        it.each(TOKENS_FOCO_LIGHT)(
            'token de foco %s existe em :root (CSS compilado, sem hardcode)',
            (token) => {
                expect(
                    ROOT_REAL[token],
                    `Token ${token} ausente em :root do CSS compilado`
                ).toBeDefined();
                expect(ROOT_REAL[token]).not.toBe('');
            }
        );

        it.each(TOKENS_FOCO_DARK)(
            'token de foco %s existe em .dark (CSS compilado, sem hardcode)',
            (token) => {
                expect(
                    DARK_REAL[token],
                    `Token ${token} ausente em .dark do CSS compilado`
                ).toBeDefined();
                expect(DARK_REAL[token]).not.toBe('');
            }
        );
    });

    // ── 2. Contraste do anel de foco light (>= 3:1 WCAG 2.4.11) ────────────
    describe('Contraste do anel de foco — light/dark derivados do CSS real', () => {
        it('anel de foco light: cor vs offset >= 3:1 (WCAG 2.4.11)', () => {
            const ringColor = resolverCssVar(ROOT_REAL['--max-focus-ring-color'] ?? '', ROOT_REAL);
            const offsetColor = resolverCssVar(
                ROOT_REAL['--max-focus-ring-offset-color'] ?? '',
                ROOT_REAL
            );

            // Valores resolvidos não podem ser vazios ou referências não resolvidas
            expect(ringColor).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(offsetColor).toMatch(/^#[0-9a-fA-F]{6}$/);

            const contraste = razaoContraste(ringColor, offsetColor);
            expect(
                contraste,
                `Contraste do foco light ${ringColor} vs ${offsetColor} = ${contraste.toFixed(2)}:1 — deve ser >= 3:1`
            ).toBeGreaterThanOrEqual(3.0);
        });

        it('anel de foco dark: cor vs offset >= 3:1 (WCAG 2.4.11)', () => {
            const ringColor = resolverCssVar(DARK_REAL['--max-focus-ring-color'] ?? '', DARK_REAL);
            const offsetColor = resolverCssVar(
                DARK_REAL['--max-focus-ring-offset-color'] ?? '',
                DARK_REAL
            );

            expect(ringColor).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(offsetColor).toMatch(/^#[0-9a-fA-F]{6}$/);

            const contraste = razaoContraste(ringColor, offsetColor);
            expect(
                contraste,
                `Contraste do foco dark ${ringColor} vs ${offsetColor} = ${contraste.toFixed(2)}:1 — deve ser >= 3:1`
            ).toBeGreaterThanOrEqual(3.0);
        });
    });

    // ── 3. Contraste de seleção light/dark (>= 4.5:1 WCAG 1.4.3) ───────────
    describe('Contraste de seleção — todos os estados light/dark', () => {
        it.each(PARES_SELECAO_LIGHT.map((p, i) => [i === 0 ? 'default' : 'hover', p] as const))(
            'seleção light estado=%s contraste bg vs fg >= 4.5:1',
            (_estado, par) => {
                expect(
                    par.bg,
                    'Cor de fundo da seleção deve resolver para hex'
                ).toMatch(/^#[0-9a-fA-F]{6}$/);
                expect(
                    par.fg,
                    'Cor de foreground da seleção deve resolver para hex'
                ).toMatch(/^#[0-9a-fA-F]{6}$/);
                expect(razaoContraste(par.bg, par.fg)).toBeGreaterThanOrEqual(4.5);
            }
        );

        it.each(PARES_SELECAO_DARK.map((p, i) => [i === 0 ? 'default' : 'hover', p] as const))(
            'seleção dark estado=%s contraste bg vs fg >= 4.5:1',
            (_estado, par) => {
                expect(
                    par.bg,
                    'Cor de fundo da seleção dark deve resolver para hex'
                ).toMatch(/^#[0-9a-fA-F]{6}$/);
                expect(
                    par.fg,
                    'Cor de foreground da seleção dark deve resolver para hex'
                ).toMatch(/^#[0-9a-fA-F]{6}$/);
                expect(razaoContraste(par.bg, par.fg)).toBeGreaterThanOrEqual(4.5);
            }
        );
    });

    // ── 4. Tokens de borda de botão — todas as severidades ──────────────────
    describe('Tokens de borda de botão — todas as severidades em light e dark', () => {
        // Gera entradas explícitas como array de [token, escopo, nomeEscopo]
        const entradasLight: Array<[string, string]> = SEVERIDADES_BOTAO.map(
            (sev) => [`--max-button-${sev}-border-color`, sev]
        );
        const entradasDark: Array<[string, string]> = SEVERIDADES_BOTAO.map(
            (sev) => [`--max-button-${sev}-border-color`, sev]
        );

        it.each(entradasLight)(
            'token %s (severidade=%s) existe em :root com valor não vazio',
            (token) => {
                expect(
                    ROOT_REAL[token],
                    `Token ${token} ausente em :root do CSS compilado`
                ).toBeDefined();
                expect(ROOT_REAL[token]).not.toBe('');
            }
        );

        it.each(entradasDark)(
            'token %s (severidade=%s) existe em .dark com valor não vazio',
            (token) => {
                expect(
                    DARK_REAL[token],
                    `Token ${token} ausente em .dark do CSS compilado`
                ).toBeDefined();
                expect(DARK_REAL[token]).not.toBe('');
            }
        );
    });

    // ── 5. CSS compilado não possui referências não resolvidas ───────────────
    it('CSS compilado não contém placeholders de token não resolvidos', () => {
        // Não deve haver {token.path} do PrimeVue nem variáveis SCSS não interpoladas
        expect(CSS_REAL).not.toMatch(/\{[a-z.]+\}/);
    });

    it('gate compartilhado aprova foco, seleção e todas as ações sólidas em light/dark', () => {
        executarGateDeContraste(CSS_REAL);
    });

    // ── 6. Cobertura dos aliases --z-* legados ───────────────────────────────
    describe('Aliases legados --z-* existem e referenciam --max-z-index-*', () => {
        const ALIASES_Z = [
            '--z-dropdown',
            '--z-sticky',
            '--z-modal-backdrop',
            '--z-modal',
            '--z-popover',
            '--z-toast',
            '--z-tooltip'
        ] as const;

        it.each(ALIASES_Z)('alias %s existe em :root', (alias) => {
            expect(ROOT_REAL[alias], `Alias ${alias} ausente em :root`).toBeDefined();
        });

        it.each(ALIASES_Z)(
            'alias %s referencia --max-z-index-* ou --max-layer-* (sem valor hardcoded)',
            (alias) => {
                const valor = ROOT_REAL[alias] ?? '';
                // O valor deve ser uma referência var(), não um literal numérico puro
                expect(valor).toMatch(/^var\(--max-/);
            }
        );
    });
});

// ─────────────────────────────────────────────
// MUTATION TEST REAL (R17/F23A)
// ─────────────────────────────────────────────
// Compila em memória uma versão mutada do token e prova que o mesmo
// teste de contraste FALHA — sem modificar nenhum arquivo rastreado pelo git.
// ─────────────────────────────────────────────

describe('R17/F23A — Mutation test real: token mutado em memória causa falha detectável', () => {
    /**
     * Lê o SCSS original e substitui em memória um valor de token,
     * compilando sem gravar em disco.
     *
     * Retorna o CSS compilado da versão mutada.
     */
    function compilarComMutacao(tokenOriginal: string, valorMutado: string): string {
        const conteudoOriginal = fs.readFileSync(TOKENS_SCSS_PATH, 'utf-8');

        // Substitui APENAS a primeira ocorrência do token no :root
        // de modo a simular uma mutação pontual e realista
        const conteudoMutado = conteudoOriginal.replace(
            new RegExp(`(${tokenOriginal.replace(/[-]/g, '\\-')}:\\s*)([^;]+)(;)`, ''),
            `$1${valorMutado}$3`
        );

        // Compila inteiramente em memória — nenhum arquivo temporário é criado
        return sass.compileString(conteudoMutado, {
            importers: [
                {
                    findFileUrl(url: string) {
                        const base = resolve(__dirname, '../../src/themes');
                        return new URL('file://' + path.join(base, url));
                    }
                }
            ],
            logger: sass.Logger.silent
        }).css;
    }

    it('a mesma regra de aceite falha para CSS realmente mutado, sem inverter o limiar', () => {
        // Cor com contraste INSUFICIENTE contra branco (#ffffff): cinza claro
        const COR_MUTADA_BAIXO_CONTRASTE = '#aaaaaa'; // contraste ~1.95:1 vs #ffffff

        const cssMutado = compilarComMutacao('--max-button-primary-action-content', COR_MUTADA_BAIXO_CONTRASTE);
        expect(() => executarGateDeContraste(CSS_REAL)).not.toThrow();
        expect(() => executarGateDeContraste(cssMutado)).toThrow(/contraste insuficiente/);
    });

    it('mutation test real usa apenas compilação em memória: nenhum arquivo tmp rastreável é criado', () => {
        // Verifica que o worktree não possui arquivos temporários de tokens gerados pelo teste
        const worktreeRoot = resolve(__dirname, '../..');
        const arquivosInDesejados = [
            path.join(worktreeRoot, 'src/themes/tokens.mutated.scss'),
            path.join(worktreeRoot, 'src/themes/tokens.tmp.scss'),
            path.join(worktreeRoot, 'src/themes/_tokens_mutation.scss')
        ];

        for (const arquivo of arquivosInDesejados) expect(
            fs.existsSync(arquivo),
            `Arquivo temporário rastreável NÃO deve existir: ${arquivo}`
        ).toBe(false);


        // Verifica que o arquivo tokens.scss original não foi modificado pelo teste
        const conteudoAtual = fs.readFileSync(TOKENS_SCSS_PATH, 'utf-8');
        expect(
            conteudoAtual,
            'O arquivo tokens.scss original não deve ser modificado pelos testes de mutação'
        ).not.toContain('#aaaaaa');
        expect(conteudoAtual).not.toContain('#e0e0e0');
    });

    it('CSS real difere do CSS mutado: a mutação é detectável por comparação de saída compilada', () => {
        const cssMutado = compilarComMutacao('--max-button-primary-action-content', '#aaaaaa');

        // O CSS mutado deve ser diferente do CSS real (prova que a mutação foi aplicada)
        expect(cssMutado).not.toBe(CSS_REAL);

        // E o CSS real deve conter o valor correto
        expect(CSS_REAL).toContain('#00768e');
        // O CSS mutado deve conter o valor mutado
        expect(cssMutado).toContain('#aaaaaa');
    });
});
