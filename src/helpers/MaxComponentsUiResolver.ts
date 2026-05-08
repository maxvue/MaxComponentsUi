import type { ComponentResolver } from 'unplugin-vue-components/types';
import manifest from '../components-manifest.json';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';

type ResultResolver = { name: string; from: string } | undefined | null;

// NÃO MODIFICAR ESTE RESOLVER SEM QUE HAJA UMA INSTRUÇÃO DIRETA PARA ISSO.
export function MaxComponentsUiResolver(): ComponentResolver {
    return {
        type: 'component',
        resolve: (name: string) => {
            const originalName = (manifest.aliases as Record<string, string>)[name];
            if (originalName){
                console.log('Max Resolved', { name: name, result: originalName });
                return {
                    name: originalName,
                    from: '@maxvue/max-components-ui'
                };
            }

            const primeVueResolvers = PrimeVueResolver();
            for (const resolver of primeVueResolvers) {
                const result = (typeof resolver === 'function' ? resolver(name) : resolver.resolve(name)) as ResultResolver;
                if (result) {
                    const return_result = {
                        name: name,
                        from: '@maxvue/max-components-ui/prime'
                    };
                    console.log('Prime Resolved', { name: name, primeResult: result, return_result: return_result });
                    return return_result;
                }
            }
            console.log('Not Resolved', { name: name });
        }
    };
}

export const resolver = MaxComponentsUiResolver;