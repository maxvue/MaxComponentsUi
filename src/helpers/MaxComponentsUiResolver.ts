import type { ComponentResolver } from 'unplugin-vue-components/types';
import manifest from '../components-manifest.json';

// NÃO MODIFICAR ESTE RESOLVER SEM QUE HAJA UMA INSTRUÇÃO DIRETA PARA ISSO.
export function MaxComponentsUiResolver(): ComponentResolver {
    const aliases = manifest.aliases as Record<string, string>;

    return {
        type: 'component',
        resolve: (name: string) => {
            const originalName = aliases[name];
            if (originalName) return {
                name: originalName,
                from: '@maxvue/max-components-ui'
            };

        }
    };
}

export const resolver = MaxComponentsUiResolver;