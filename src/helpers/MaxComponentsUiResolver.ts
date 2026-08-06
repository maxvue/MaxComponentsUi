import type { ComponentResolver } from 'unplugin-vue-components/types';
import manifest from '../components-manifest.json';

export function MaxComponentsUiResolver(): ComponentResolver {
    return {
        type: 'component',
        resolve: (name: string) => {
            const aliases = manifest.aliases as Record<string, string>;
            const components = manifest.components as Record<string, string> | string[];
            const originalName = aliases?.[name] || (Array.isArray(components) ? components.find((c) => c === name) : components?.[name]);
            if (originalName) return {
                name: originalName,
                from: '@maxvue/max-components-ui'
            };

            if (name.startsWith('Max')) return {
                name: name,
                from: '@maxvue/max-components-ui'
            };

            return undefined;
        }
    };
}

export const resolver = MaxComponentsUiResolver;