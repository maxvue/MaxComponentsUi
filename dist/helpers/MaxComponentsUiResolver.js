import manifest from '../components-manifest.json';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
// NÃO MODIFICAR ESTE RESOLVER SEM QUE HAJA UMA INSTRUÇÃO DIRETA PARA ISSO.
export function MaxComponentsUiResolver() {
    return {
        type: 'component',
        resolve: (name) => {
            const originalName = manifest.aliases[name];
            if (originalName)
                return {
                    name: originalName,
                    from: '@maxvue/max-components-ui'
                };
            const primeVueResolvers = PrimeVueResolver();
            for (const resolver of primeVueResolvers) {
                const result = (typeof resolver === 'function' ? resolver(name) : resolver.resolve(name));
                if (result)
                    return {
                        name: result.name,
                        from: '@maxvue/max-components-ui'
                    };
            }
        }
    };
}
