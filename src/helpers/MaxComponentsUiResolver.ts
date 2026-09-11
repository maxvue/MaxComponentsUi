import type { ComponentResolver } from 'unplugin-vue-components/types';
import manifest from '../components-manifest.json';

const aliases = manifest.aliases as Record<string, string>;
const componentNames = new Set(manifest.components as string[]);

/**
 * Resolver unplugin-vue-components para @maxvue/max-components-ui.
 * Resolve componentes nativos iniciados com Max e seus aliases canônicos.
 */
export function MaxComponentsUiResolver(): ComponentResolver {
    return {
        type: 'component',
        resolve: (name: string) => {
            // 1. Checa se o nome é um alias conhecido (ex: Botao -> MaxButton, InputField -> MaxInputText)
            const resolvedName = aliases[name];
            if (resolvedName) return {
                name: resolvedName,
                from: '@maxvue/max-components-ui'
            };

            // 2. Checa se o nome é um componente nativo Max registrado
            if (componentNames.has(name)) return {
                name,
                from: '@maxvue/max-components-ui'
            };

            // Não resolve componentes de bibliotecas externas (PrimeVue, etc.)
            return undefined;
        }
    };
}

export const resolver = MaxComponentsUiResolver;