import type { ComponentResolver } from 'unplugin-vue-components/types';
import manifest from '../components-manifest.json';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';

type ResultResolver = { name: string; from: string } | undefined | null;

// Nomes realmente re-exportados por src/prime/index.ts. Usado para não
// oferecer imports de '@maxvue/max-components-ui/prime' que não existem de
// verdade (o PrimeVueResolver reconhece nomes que prime/index.ts não
// re-exporta, ex.: FloatLabel).
const primeExportNames = new Set(manifest.primeExports as string[]);

// NÃO MODIFICAR ESTE RESOLVER SEM QUE HAJA UMA INSTRUÇÃO DIRETA PARA ISSO.
export function MaxComponentsUiResolver(): ComponentResolver {
    // Instanciado uma única vez e reutilizado em todas as chamadas de
    // resolve, em vez de recriar a cada resolução de componente.
    const primeVueResolvers = PrimeVueResolver();

    return {
        type: 'component',
        resolve: (name: string) => {
            const originalName = (manifest.aliases as Record<string, string>)[name];
            if (originalName) return {
                name: originalName,
                from: '@maxvue/max-components-ui'
            };

            if (!primeExportNames.has(name)) return;

            for (const resolver of primeVueResolvers) {
                // O `result` do PrimeVueResolver é descartado deliberadamente:
                // ele aponta para o caminho interno do PrimeVue (ex.:
                // 'primevue/datatable'), mas o objetivo aqui é sempre importar
                // de '@maxvue/max-components-ui/prime', não do PrimeVue direto.
                // O `result` só serve para confirmar que o PrimeVueResolver
                // reconhece o nome.
                const result = (typeof resolver === 'function' ? resolver(name) : resolver.resolve(name)) as ResultResolver;
                if (result) {
                    const return_result = {
                        name: name,
                        from: '@maxvue/max-components-ui/prime'
                    };
                    return return_result;
                }
            }
        }
    };
}

export const resolver = MaxComponentsUiResolver;