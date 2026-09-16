/**
 * R24/F29 — Tree-shaking e Budget de Bytes do MaxButton
 *
 * Valida:
 * 1. Grafo transitivo minificado do MaxButton ≤ 238.886 bytes (teto estrito R24/F29).
 * 2. Ausência de CSS global alheio ao MaxButton no subpath granular.
 * 3. CSS global é estritamente opt-in (não injetado pelos componentes individuais).
 * 4. sideEffects declara apenas o entry raiz e arquivos CSS/SCSS.
 * 5. Subpath ./components/* existe no mapa de exports.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(__dirname, '../../dist');
const PKG_PATH = path.resolve(__dirname, '../../package.json');

// Tetos de bytes congelados no BASELINE.md (R24/F29)
const BASELINE_BYTES = 477_773;
const TETO_MAXBUTTON_BYTES = 238_886;

// Resolve o grafo transitivo de importações a partir de um arquivo .js no dist/
function resolveGrafoTransitivo(entrada: string, visitados = new Set<string>()): Set<string> {
    if (visitados.has(entrada)) return visitados;

    let caminho = entrada;
    if (!fs.existsSync(caminho) && !caminho.endsWith('.js')) caminho = caminho + '.js';

    if (!fs.existsSync(caminho)) return visitados;

    visitados.add(caminho);
    const conteudo = fs.readFileSync(caminho, 'utf-8');

    // Captura imports/exports com caminhos relativos (./ ou ../)
    const regexImport = /(?:import|export)[^"']*["'](\.{1,2}\/[^"']+)["']/g;
    let match: RegExpExecArray | null;

    while ((match = regexImport.exec(conteudo)) !== null) {
        const importPath = match[1];
        if (importPath.endsWith('.map') || importPath.endsWith('.css')) continue;

        let resolvido = path.resolve(path.dirname(caminho), importPath);
        if (!resolvido.endsWith('.js') && !fs.existsSync(resolvido)) resolvido = resolvido + '.js';


        resolveGrafoTransitivo(resolvido, visitados);
    }

    return visitados;
}

describe('R24/F29 — Tree-shaking: Grafo Transitivo e Budgets do MaxButton', () => {
    let pkg: Record<string, unknown>;
    let distExiste: boolean;
    let grafoBytesTotal: number;
    let arquivosGrafo: { arquivo: string; bytes: number }[];
    let cssAlheioPresenteNoGrafo: boolean;

    beforeAll(() => {
        pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
        distExiste = fs.existsSync(DIST_DIR);

        arquivosGrafo = [];
        grafoBytesTotal = 0;
        cssAlheioPresenteNoGrafo = false;

        if (distExiste) {
            const entradaMaxButton = path.join(DIST_DIR, 'components/MaxButton.es.js');
            const arquivos = resolveGrafoTransitivo(entradaMaxButton);

            for (const arquivo of arquivos) {
                if (arquivo.endsWith('.map')) continue;
                if (!fs.existsSync(arquivo)) continue;

                const bytes = fs.statSync(arquivo).size;
                const relativo = path.relative(DIST_DIR, arquivo);

                grafoBytesTotal += bytes;
                arquivosGrafo.push({ arquivo: relativo, bytes });

                // CSS alheio: arquivos style-*.js no grafo do MaxButton
                // indicam que o CSS global foi puxado pelo subpath granular
                if (/^style-[^/]+\.js$/.test(relativo)) cssAlheioPresenteNoGrafo = true;

            }

            // Ordenar por tamanho decrescente para facilitar diagnóstico
            arquivosGrafo.sort((a, b) => b.bytes - a.bytes);
        }
    });

    it('deve registrar o baseline de 477.773 bytes como referência histórica', () => {
        // Este teste documenta o ponto de partida; não impõe limite sobre o baseline.
        expect(BASELINE_BYTES).toBe(477_773);
    });

    it('grafo transitivo do MaxButton deve ser <= 238.886 bytes (teto estrito R24/F29)', () => {
        expect(distExiste, 'dist/ deve existir obrigatoriamente (build prévio obrigatório)').toBe(true);

        const detalhes = arquivosGrafo
            .map(({ arquivo, bytes }) => `  ${bytes.toString().padStart(8)} bytes  ${arquivo}`)
            .join('\n');

        expect(
            grafoBytesTotal,
            `Grafo transitivo do MaxButton (${grafoBytesTotal} bytes) excede o teto de ${TETO_MAXBUTTON_BYTES} bytes.\n` +
            `Arquivos no grafo:\n${detalhes}`
        ).toBeLessThanOrEqual(TETO_MAXBUTTON_BYTES);
    });

    it('grafo transitivo do MaxButton nao deve conter CSS global alheio (style-*.js)', () => {
        expect(distExiste, 'dist/ deve existir obrigatoriamente (build prévio obrigatório)').toBe(true);

        const cssEncontrados = arquivosGrafo
            .filter(({ arquivo }) => /^style-[^/]+\.js$/.test(arquivo))
            .map(({ arquivo }) => arquivo);

        expect(
            cssAlheioPresenteNoGrafo,
            `CSS global alheio detectado no grafo do MaxButton: ${cssEncontrados.join(', ')}\n` +
            'O subpath ./components/MaxButton nao deve puxar CSS global automaticamente.'
        ).toBe(false);
    });

    it('o subpath ./components/MaxButton.es.js nao deve injetar CSS inline via document.createElement', () => {
        expect(distExiste, 'dist/ deve existir obrigatoriamente (build prévio obrigatório)').toBe(true);

        // Verificar todos os arquivos do grafo por injeção de CSS inline
        for (const { arquivo } of arquivosGrafo) {
            const caminho = path.join(DIST_DIR, arquivo);
            if (!fs.existsSync(caminho)) continue;

            const conteudo = fs.readFileSync(caminho, 'utf-8');

            // Padrão de injeção de CSS do vite-plugin-css-injected-by-js
            const temInjecaoCss = conteudo.includes('document.createElement("style")') ||
                conteudo.includes('document.createElement(\'style\')');

            expect(
                temInjecaoCss,
                `Arquivo ${arquivo} no grafo do MaxButton injeta CSS via document.createElement.\n` +
                'CSS global deve ser opt-in: importado apenas via ./style.css ou ./styles.css.'
            ).toBe(false);
        }
    });

    it('sideEffects deve listar apenas CSS/SCSS e nao conter o entry raiz (index.es.js)', () => {
        const sideEffects = pkg.sideEffects as string[];

        expect(Array.isArray(sideEffects)).toBe(true);
        expect(sideEffects).toContain('**/*.css');
        expect(sideEffects).toContain('**/*.scss');
        expect(sideEffects).toContain('./dist/style.css');
        expect(sideEffects).not.toContain('./dist/index.es.js');

        // Entries modulares livres de side-effect (tree-shaking granular)
        expect(sideEffects).not.toContain('./dist/stores.es.js');
        expect(sideEffects).not.toContain('./dist/preset.es.js');
        expect(sideEffects).not.toContain('./dist/resolver.es.js');
        expect(sideEffects).not.toContain('./dist/styles.es.js');
    });

    it('o mapa de exports deve conter subpath ./components/* para tree-shaking granular', () => {
        const exports = pkg.exports as Record<string, unknown>;

        expect(exports['./components/*']).toBeDefined();

        // O padrao do subpath de componente deve incluir types e import
        const componentEntry = exports['./components/*'] as Record<string, string>;
        expect(componentEntry.types).toBeDefined();
        expect(componentEntry.import).toBeDefined();
    });

    it('o arquivo de entrada do MaxButton (./components/MaxButton.es.js) deve existir em dist/', () => {
        expect(distExiste, 'dist/ deve existir obrigatoriamente (build prévio obrigatório)').toBe(true);

        const entradaMaxButton = path.join(DIST_DIR, 'components/MaxButton.es.js');
        expect(
            fs.existsSync(entradaMaxButton),
            'dist/components/MaxButton.es.js deve existir (subpath ./components/MaxButton)'
        ).toBe(true);
    });

    it('o subpath ./components/* deve gerar exports individuais para todos os componentes .vue', () => {
        expect(distExiste, 'dist/ deve existir obrigatoriamente (build prévio obrigatório)').toBe(true);

        const componentesDir = path.resolve(__dirname, '../../src/components');
        const vueFiles = fs.readdirSync(componentesDir)
            .filter((f) => f.endsWith('.vue'))
            .map((f) => f.replace('.vue', ''));

        const arquivosDistComponentes = fs.readdirSync(path.join(DIST_DIR, 'components'))
            .filter((f) => f.endsWith('.es.js'))
            .map((f) => f.replace('.es.js', ''));

        // Cada componente .vue deve ter um arquivo .es.js correspondente em dist/components/
        for (const componente of vueFiles) expect(
            arquivosDistComponentes.includes(componente),
            `dist/components/${componente}.es.js nao encontrado. ` +
                `Componente ${componente}.vue deve ter um entry granular.`
        ).toBe(true);

    });
});
