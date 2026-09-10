# Acoplamento Residual com PrimeVue no Core, Barrel e Função de Instalação

## 1. Contexto e Diagnóstico Técnico
A biblioteca `@maxvue/max-components-ui` tem como meta estratégica a independência completa de pacotes do PrimeVue (`primevue/*`, `@primevue/*`, `@primeuix/*`), motivada pela mudança de licenciamento a partir da versão 5 da referida biblioteca (que deixa de ser open source).

Durante a auditoria estrita do core, constatou-se que o ponto central de entrada da biblioteca (`src/index.ts`) e o arquivo de estilos principais (`src/styles/style.ts`) ainda mantêm acoplamento rígido em runtime com o PrimeVue:
1. `src/index.ts` importa o configurador global do PrimeVue (`import PrimeVue from 'primevue/config';`).
2. A função de inicialização pública `install` registra compulsoriamente o PrimeVue na instância da aplicação Vue consumidora via `app.use(PrimeVue, ...)`.
3. O tema padrão (`src/styles/style.ts`) baseia-se diretamente na função `definePreset` e no tema `Aura` do pacote `@primeuix/themes`.
4. O `package.json` declara dependências diretas de `@primevue/auto-import-resolver`, além de `devDependencies` e `peerDependencies` vinculadas a `primevue` e `@primeuix/themes`.

## 2. Evidências no Código-Fonte

### A. Importação e Registro Obrigatório em `src/index.ts`
[src/index.ts:L6-L10](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/index.ts#L6-L10) e [src/index.ts:L233-L251](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/index.ts#L233-L251):
```typescript
import { defineAsyncComponent } from 'vue';
import PrimeVue from 'primevue/config';

import { MaxStyle } from './styles/style';
import ptBR from './locales/pt-br';
...
export const install = (app: any, options: any = {}) => {
    const { theme: userTheme, locale: userLocale, ripple: userRipple, ...rest } = options;

    app.use(PrimeVue, {
        ...rest,
        locale: userLocale || ptBR,
        ripple: userRipple ?? true,
        theme: {
            ...userTheme,
            preset: userTheme?.preset ?? MaxStyle,
            options: {
                darkModeSelector: '.dark',
                prefix: 'max',
                ...userTheme?.options
            }
        }
    });
    app.directive('tooltip', Tooltip);
};
```

### B. Dependência de Tema em `src/styles/style.ts`
[src/styles/style.ts:L1-L4](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/styles/style.ts#L1-L4):
```typescript
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

export const MaxStyle = definePreset(Aura, {
    semantic: {
        primary: { ... },
        ...
```

### C. Dependências Declaradas em `package.json`
[package.json:L56](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/package.json#L56), [package.json:L83](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/package.json#L83), [package.json:L104](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/package.json#L104), [package.json:L138-L140](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/package.json#L138-L140):
```json
"dependencies": {
    "@primevue/auto-import-resolver": "^4.5.5",
    ...
},
"devDependencies": {
    "@primeuix/themes": "^2.0.3",
    "primevue": "^4.5.5",
    ...
},
"peerDependencies": {
    "@primeuix/themes": "^2.0.0",
    "primevue": "^4.5.0",
    ...
}
```

## 3. Impacto Técnico
- **Impossibilidade de Desacoplamento:** Qualquer aplicação que utilize `@maxvue/max-components-ui` é obrigada a manter `primevue` e `@primeuix/themes` instalados, aumentando significativamente o bundle final.
- **Risco de Quebra no PrimeVue 5:** Projetos consumidores ficarão travados na versão 4 ou sofrerão quebras de compatibilidade irreversíveis quando migrarem para versões posteriores do ecossistema Vue/PrimeVue.
- **Inconsistência de Arquitetura:** Enquanto mais de 90 componentes Max já foram reescritos de forma nativa e independente (usando UnoCSS, Tailwind e SVG nativo), o boot da biblioteca ainda acopla a infraestrutura antiga.

## 4. Recomendações de Resolução
1. **Desacoplar a função `install` do `src/index.ts`:**
   - Tornar o plugin PrimeVue opcional ou criar um adapter separado caso o consumidor queira utilizar coexistência legada.
   - A biblioteca principal `@maxvue/max-components-ui` não deve invocar `app.use(PrimeVue)` no entry point padrão.
2. **Substituir o tema `@primeuix/themes` por Tokens CSS Nativos / UnoCSS:**
   - Migrar os tokens semânticos de `MaxStyle` diretamente para variáveis CSS nativas (`:root`, `.dark`) ou para o preset do UnoCSS (`uno.config.ts`), eliminando a necessidade do `definePreset(Aura, ...)`.
3. **Remover PrimeVue de `peerDependencies` e `dependencies`:**
   - Mover qualquer pacote residual de PrimeVue para `devDependencies` enquanto a transição estiver sendo finalizada, ou expurgá-los completamente na Fase 2.
