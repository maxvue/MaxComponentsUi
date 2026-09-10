# Plano de Implementação: Desacoplamento Residual do PrimeVue no Core, Barrel e Função de Instalação

## 1. Diagnóstico e Objetivo

A biblioteca `@maxvue/max-components-ui` adota como diretriz arquitetural a **independência total de pacotes do ecossistema PrimeVue** (`primevue/*`, `@primevue/*`, `@primeuix/*`), viabilizando um core 100% autônomo, leve e livre dos riscos associados a licenças comerciais fechadas (como as da v5+ do PrimeVue).

Atualmente, o ponto de entrada da biblioteca ([src/index.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/index.ts#L6-L10)) e a definição de estilos padrão ([src/styles/style.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/styles/style.ts#L1-L4)) contêm acoplamento residual em tempo de execução:
1. `src/index.ts` importa o configurador global `PrimeVue from 'primevue/config'`.
2. A função pública `install` executa obrigatoriamente `app.use(PrimeVue, ...)`, forçando qualquer aplicação consumidora a manter o PrimeVue instalado em seu runtime.
3. `src/styles/style.ts` invoca `definePreset(Aura, ...)` da biblioteca `@primeuix/themes`.
4. O [package.json](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/package.json#L138-L140) ainda lista `primevue` e `@primeuix/themes` no bloco `peerDependencies`.

**Objetivo:**
Eliminar por completo a obrigatoriedade e as importações de PrimeVue e `@primeuix/themes` no core da biblioteca. A função `install` registrará as diretivas nativas (como `tooltip`) e proverá contexto nativo da MaxComponentsUi tipado com `App` do Vue 3, e os tokens semânticos de estilo serão exportados como estruturas de dados TypeScript puras, sem invocar o motor de temas do PrimeVue.

---

## 2. Arquivos a Modificar

- [src/index.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/index.ts): Remover `import PrimeVue`, desvincular o `app.use(PrimeVue)` da função `install` e adicionar tipagem estrita com `App` e `MaxPluginOptions`.
- [src/styles/style.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/styles/style.ts): Remover dependência de `@primeuix/themes/aura` e `definePreset`, convertendo `MaxStyle` em objeto constante de tokens de cores semânticas.
- [package.json](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/package.json): Remover `@primeuix/themes` e `primevue` do bloco `peerDependencies`.
- [tests/core/install.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/core/install.test.ts): Criar suíte de testes unitários validando o boot do plugin sem qualquer dependência externa.

---

## 3. Especificação Técnica Cirúrgica

### A. Refatoração de `src/styles/style.ts`

Substituir o uso de `definePreset(Aura, ...)` por uma constante tipada pura contendo a paleta semântica corporativa:

```typescript
export interface SemanticColorPalette {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
}

export interface MaxThemePreset {
    semantic: {
        primary: SemanticColorPalette;
        success: SemanticColorPalette;
        info: SemanticColorPalette;
        warning: SemanticColorPalette;
        danger: SemanticColorPalette;
    };
}

export const MaxStyle: MaxThemePreset = {
    semantic: {
        primary: {
            50: '#67C8DB',
            100: '#56C2D7',
            200: '#46BCD4',
            300: '#2EA4BC',
            400: '#178DA5',
            500: '#00768E',
            600: '#005F77',
            700: '#004860',
            800: '#003048',
            900: '#001931',
            950: '#00152A'
        },
        success: {
            50: '#E8FDF3',
            100: '#D4FCE8',
            200: '#A5F3D3',
            300: '#6EE7B7',
            400: '#34D399',
            500: '#10B981',
            600: '#059669',
            700: '#047857',
            800: '#065F46',
            900: '#064E3B',
            950: '#054232'
        },
        info: {
            50: '#F0F9FF',
            100: '#E0F2FE',
            200: '#BAE6FD',
            300: '#7DD3FC',
            400: '#38BDF8',
            500: '#0EA5E9',
            600: '#0284C7',
            700: '#0369A1',
            800: '#075985',
            900: '#0C4A6E',
            950: '#0A3F5E'
        },
        warning: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
            950: '#662D0D'
        },
        danger: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            300: '#FCA5A5',
            400: '#F87171',
            500: '#EF4444',
            600: '#DC2626',
            700: '#B91C1C',
            800: '#991B1B',
            900: '#7F1D1D',
            950: '#6C1919'
        }
    }
};
```

### B. Refatoração de `src/index.ts`

1. Eliminar a importação de `PrimeVue` e do locale legado:
```typescript
// ANTES:
// import PrimeVue from 'primevue/config';
// import ptBR from './locales/pt-br';

// DEPOIS:
import type { App, Plugin } from 'vue';
import Tooltip from './directives/tooltip';
import { MaxStyle } from './styles/style';
```

2. Definir a interface de configuração `MaxPluginOptions` e a assinatura estrita de `install`:
```typescript
export interface MaxPluginOptions {
    /** Tema customizado ou tokens semânticos */
    theme?: Record<string, unknown>;
    /** Prefixos customizados de classe */
    prefix?: string;
    /** Habilita efeito de ripple nos componentes compatíveis */
    ripple?: boolean;
    /** Chaves adicionais extensíveis */
    [key: string]: unknown;
}

/**
 * Função de inicialização do plugin Vue MaxComponentsUi.
 * Registra diretivas globais e configura tokens do ecossistema Max.
 */
export const install: Plugin['install'] = (app: App, options: MaxPluginOptions = {}) => {
    // Registra a diretiva nativa autônoma de Tooltip
    app.directive('tooltip', Tooltip);

    // Provê as opções de configuração para componentes que realizam inject
    app.provide('maxComponentsOptions', options);
};

export default {
    install
};
```

### C. Ajuste em `package.json`

Remover do bloco `peerDependencies`:
```json
// ANTES:
"peerDependencies": {
    "@primeuix/themes": "^2.0.0",
    "pinia": "^4.0.0",
    "primevue": "^4.5.0",
    "vue": "^3.6.0 || ^3.6.0-rc.5",
    "vue-router": "^5.2.0"
}

// DEPOIS:
"peerDependencies": {
    "pinia": "^4.0.0",
    "vue": "^3.6.0 || ^3.6.0-rc.5",
    "vue-router": "^5.2.0"
}
```

### D. Criação do Teste de Unidade `tests/core/install.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createApp, defineComponent, inject } from 'vue';
import MaxComponentsUi, { install, MaxStyle } from '../../src/index';

describe('Plugin MaxComponentsUi (Core Install)', () => {
    it('deve instalar o plugin na aplicação Vue sem invocar PrimeVue', () => {
        const app = createApp(defineComponent({ template: '<div>App</div>' }));
        app.use(MaxComponentsUi);

        // Verifica registro da diretiva nativa tooltip
        expect(app.directive('tooltip')).toBeDefined();
    });

    it('deve disponibilizar as opções fornecidas via injeção', () => {
        let injectedOptions: any = null;
        const TestComponent = defineComponent({
            setup() {
                injectedOptions = inject('maxComponentsOptions');
                return () => null;
            }
        });

        const app = createApp(TestComponent);
        app.use(install, { ripple: false, customSetting: 'teste' });

        const mountPoint = document.createElement('div');
        app.mount(mountPoint);

        expect(injectedOptions).toEqual({ ripple: false, customSetting: 'teste' });
        app.unmount();
    });

    it('deve exportar MaxStyle como objeto de tokens semânticos sem dependência externa', () => {
        expect(MaxStyle).toBeDefined();
        expect(MaxStyle.semantic.primary[500]).toBe('#00768E');
        expect(MaxStyle.semantic.danger[500]).toBe('#EF4444');
    });
});
```

---

## 4. Garantia de Retrocompatibilidade

1. **Assinatura do Plugin:** `app.use(MaxComponentsUi)` e `app.use(install, options)` continuam funcionando de forma idêntica.
2. **Exportação de Estilos:** Códigos que importavam `MaxStyle` para inspecionar `MaxStyle.semantic.primary` continuarão tendo acesso aos mesmos valores hexadecimais de forma sincrônica.
3. **Sem Quebra para Consumidores:** Nenhuma aplicação externa terá falha de compilação por chamar `app.use(MaxComponentsUi, { ripple: true })`.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. **Verificação de Tipos TypeScript:**
   ```bash
   npm run type-check
   ```
   *Critério:* Compilação limpa sem erros em `src/index.ts` ou `src/styles/style.ts`.

2. **Execução da Suíte de Testes Unitários:**
   ```bash
   npx vitest run tests/core/install.test.ts
   ```
   *Critério:* Todos os 3 testes do arquivo devem passar com sucesso.

3. **Validação de Desacoplamento:**
   Executar busca estrita por referências a PrimeVue no ponto de entrada:
   ```bash
   git grep "primevue" src/index.ts src/styles/style.ts
   ```
   *Critério:* Nenhuma ocorrência de import ou chamada em `src/index.ts` e `src/styles/style.ts`.
