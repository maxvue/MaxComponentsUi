# Plano de Implementação — Issue #62

## Descrição e Causa Raiz

### Problema
No arquivo de ponto de entrada da biblioteca (`src/index.ts`), diversos tipos TypeScript utilizados por consumidores e componentes são reexportados diretamente de Single File Components (`.vue`):
- `MaxDividersProps` a partir de `./components/MaxDividers.vue` (`src/index.ts:23`);
- `AuthProvider`, `AuthOtpEndpoint`, `AuthMode`, `AuthStep`, `AuthLabels` a partir de `./components/MaxAuthCard.vue` (`src/index.ts:42`);
- `MaxImageProps`, `MaxImageEditPayload` a partir de `./components/MaxImage.vue` (`src/index.ts:157`).

Ao executar a checagem de tipos estática do TypeScript (`npx tsc --noEmit`), o compilador emite 8 erros fatais `TS2614`:
```text
src/index.ts:23:15 - error TS2614: Module '"*.vue"' has no exported member 'MaxDividersProps'.
src/index.ts:42:15 - error TS2614: Module '"*.vue"' has no exported member 'AuthProvider'.
src/index.ts:42:29 - error TS2614: Module '"*.vue"' has no exported member 'AuthOtpEndpoint'.
src/index.ts:42:46 - error TS2614: Module '"*.vue"' has no exported member 'AuthMode'.
src/index.ts:42:56 - error TS2614: Module '"*.vue"' has no exported member 'AuthStep'.
src/index.ts:42:66 - error TS2614: Module '"*.vue"' has no exported member 'AuthLabels'.
src/index.ts:157:15 - error TS2614: Module '"*.vue"' has no exported member 'MaxImageProps'.
src/index.ts:157:30 - error TS2614: Module '"*.vue"' has no exported member 'MaxImageEditPayload'.
```

### Agravantes
1. **Falha de Compilação Estática e CI:** Pipelines e ferramentas de análise estática que usam o compilador TypeScript padrão (`tsc`) falham ao analisar o ponto de entrada da biblioteca.
2. **Fragilidade para Consumidores:** Projetos consumidores que importam tipos via `@maxvue/max-components-ui` podem sofrer erros de resolução caso dependam da emissão de tipos (`.d.ts`) gerada sem processamento Vue ou executem checagem estática `tsc`.
3. **Acoplamento Inadequado SFC-to-SFC:** Adicionalmente, componentes de layout (`MaxApp.vue`, `MaxPageLayout.vue`, `MaxPageMobileLayout.vue`) realizam `import type` de `BottomTab` e `MenuGroup` diretamente de `MaxBottomMenu.vue` e `MaxSideMenuMobile.vue`, violando o desacoplamento de contratos de tipo da camada de apresentação.

### Causa Raiz Comprovada
- **Localização:**
  - `src/index.ts:23` (`export type { MaxDividersProps } from './components/MaxDividers.vue';`)
  - `src/index.ts:42` (`export type { AuthProvider, AuthOtpEndpoint, AuthMode, AuthStep, AuthLabels } from './components/MaxAuthCard.vue';`)
  - `src/index.ts:157` (`export type { MaxImageProps, MaxImageEditPayload } from './components/MaxImage.vue';`)
  - `env.d.ts:3-7` (Declaração de módulo ambiente `declare module '*.vue'` que exporta unicamente `default: DefineComponent`)

- **Fluxo Causal:**
  ```text
  tsc --noEmit (Compilador TypeScript puro)
    │
    ▼
  src/index.ts (Módulo TypeScript nativo)
    │
    ▼
  Tentativa de resolver exportações nomeadas de tipo (named type exports) de arquivos .vue
    │
    ▼
  Consulta a env.d.ts (ou resolução de tipos *.vue)
    │
    ▼
  O módulo '*.vue' só declara export default (const component: DefineComponent<{}, {}, any>)
    │
    ▼
  Erro TS2614: Module '"*.vue"' has no exported member '...'
  ```

---

## Arquivos Afetados

1. `src/types/dividers.ts` *(Novo)* — Definição da interface `MaxDividersProps`.
2. `src/types/auth.ts` *(Novo)* — Definição das interfaces e tipos de autenticação (`AuthProvider`, `AuthOtpEndpoint`, `AuthMode`, `AuthStep`, `AuthLabels`, `AuthOtpSession`).
3. `src/types/image.ts` *(Novo)* — Definição das interfaces `MaxImageProps` e `MaxImageEditPayload`.
4. `src/types/app.ts` — Adição das interfaces de navegação/menu `BottomTab` e `MenuGroup`.
5. `src/types/index.ts` — Reexportação dos novos módulos de tipos (`dividers`, `auth`, `image`).
6. `src/index.ts` — Remoção das linhas de reexport direto de `.vue` (L23, L42, L157), mantendo a exportação limpa e segura via `export * from './types'`.
7. `src/components/MaxDividers.vue` — Importação de `MaxDividersProps` a partir de `../types`.
8. `src/components/MaxAuthCard.vue` — Importação de `AuthProvider`, `AuthOtpEndpoint`, `AuthMode`, `AuthStep`, `AuthLabels` a partir de `../types`.
9. `src/components/MaxImage.vue` — Importação de `MaxImageProps`, `MaxImageEditPayload` a partir de `../types`.
10. `src/components/MaxBottomMenu.vue` — Importação de `BottomTab` a partir de `../types`.
11. `src/components/MaxSideMenuMobile.vue` — Importação de `MenuGroup` a partir de `../types`.
12. `src/components/MaxApp.vue` — Atualização de importação de `BottomTab` e `MenuGroup` a partir de `../types`.
13. `src/components/MaxPageLayout.vue` — Atualização de importação de `BottomTab` e `MenuGroup` a partir de `../types`.
14. `src/components/MaxPageMobileLayout.vue` — Atualização de importação de `BottomTab` e `MenuGroup` a partir de `../types`.
15. `tests/types/index-exports.test.ts` *(Novo)* — Suíte de testes automatizados para validar que todos os tipos são exportados pelo índice da biblioteca e pelo módulo de tipos.

---

## Execuções Propostas

### 1. Criação dos Arquivos de Tipos em `src/types/`

#### `src/types/dividers.ts`
Extrair a interface com documentação completa:
```typescript
/**
 * Propriedades para o componente MaxDividers.
 */
export interface MaxDividersProps {
    /** Direção do divisor: 'in-column' (colunas horizontais) ou 'in-line' (linhas verticais) */
    direction?: 'in-column' | 'in-line';
    /** Flag booleana de atalho para dividir em duas linhas empilhadas (<MaxDividers in-line>) */
    inLine?: boolean;
    /** Flag booleana de atalho para dividir em duas colunas lado a lado (<MaxDividers in-column>) */
    inColumn?: boolean;
    /** Painel atualmente ativo no mobile (1 para primeiro, 2 para segundo) - controle v-model padrão */
    modelValue?: 1 | 2;
    /** Painel atualmente ativo no mobile com controle v-model:active */
    active?: 1 | 2;
    /** Breakpoint em pixels ou alias ('sm', 'md', 'lg', 'xl') abaixo do qual ativa o modo mobile (padrão 1024) */
    breakpoint?: number | 'sm' | 'md' | 'lg' | 'xl';
    /** Força explicitamente o modo mobile (true) ou desktop (false), ignorando o resize de tela */
    mobile?: boolean;
    /** Proporções entre o primeiro e o segundo painel no desktop (ex: [35, 65] ou [4, 8]) */
    sizes?: [number, number] | string;
    /** Tamanho fixo do primeiro painel no desktop (ex: '380px' ou '30%') */
    firstSize?: string;
    /** Espaçamento entre os painéis no modo desktop (padrão '1rem') */
    gap?: string | number;
    /** Habilita barra divisora arrastável para redimensionamento manual no desktop */
    resizable?: boolean;
    /** Se true, exibe barra de cabeçalho com botão de voltar no topo do segundo painel no mobile */
    showBackButton?: boolean;
    /** Ícone do botão voltar no mobile (padrão 'mdi:arrow-left') */
    backButtonIcon?: string;
    /** Título exibido na barra superior do segundo painel no mobile */
    secondTitle?: string;
    /** Desativa animação de transição deslizante no mobile se true */
    disabledTransition?: boolean;
}
```

#### `src/types/auth.ts`
Extrair as interfaces e tipos do MaxAuthCard:
```typescript
/** Provedor de login social configurável */
export interface AuthProvider {
    /** Identificador enviado no evento `social` (ex: 'google') */
    id: string;
    /** Rótulo exibido no botão */
    label: string;
    /** Ícone (ex: 'mdi:google') */
    icon: string;
    /** Classe(s) CSS opcional(is) para customizar a cor de marca */
    class?: string;
}

/** Endpoint de envio/validação de código OTP ordenado por prioridade */
export interface AuthOtpEndpoint {
    /** URL do endpoint no backend (ex: '/api/auth/otp/whatsapp') */
    url?: string;
    /** Rótulo do botão de ação/reenvio (ex: 'Receber via WhatsApp') */
    label: string;
    /** Canal de comunicação (ex: 'whatsapp', 'sms') */
    channel?: 'whatsapp' | 'sms' | string;
    /** Ícone do botão (ex: 'ic:baseline-whatsapp', 'mdi:message-text-outline') */
    icon?: string;
    /** Payload extra opcional enviado junto aos eventos */
    payload?: Record<string, any>;
}

/** Estado da sessão OTP salvo em cache */
export interface AuthOtpSession {
    phone: string;
    timestamp: number;
    channel?: string;
    endpointIndex?: number;
}

export type AuthMode = 'password' | 'phone-otp';
export type AuthStep = 'phone' | 'code';

/** Textos do card (todos com default pt-BR) */
export interface AuthLabels {
    email?: string;
    password?: string;
    remember?: string;
    forgot?: string;
    submit?: string;
    socialDivider?: string;
    registerPrompt?: string;
    register?: string;
    phone?: string;
    phonePlaceholder?: string;
    code?: string;
    codePlaceholder?: string;
    codeTitle?: string;
    sendCode?: string;
    verifyCode?: string;
    resendCode?: string;
    resendIn?: string;
    changePhone?: string;
    codeSentTo?: string;
    didNotReceive?: string;
}
```

#### `src/types/image.ts`
Extrair as interfaces do MaxImage:
```typescript
import type { StyleValue } from 'vue';

export interface MaxImageEditPayload {
    /** Data URL em base64 da imagem resultante */
    dataUrl: string;
    /** Objeto Blob pronto para envio via FormData/API */
    blob: Blob | null;
    /** Objeto File gerado pronto para envio multipart/form-data */
    file: File | null;
    /** Largura da imagem recortada */
    width: number;
    /** Altura da imagem recortada */
    height: number;
    /** Tipo MIME (ex: 'image/png' ou 'image/jpeg') */
    mimeType: string;
}

export interface MaxImageProps {
    /** URL ou Data URI da imagem */
    src?: string;
    /** Texto alternativo da imagem */
    alt?: string;
    /** Largura da imagem inline */
    width?: string | number;
    /** Altura da imagem inline */
    height?: string | number;
    /** Ajuste da imagem no contêiner */
    fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    /** Se permite abrir visualização ampliada em tela cheia ao clicar */
    preview?: boolean;
    /** Se permite edição/recorte da imagem na barra de ferramentas */
    allowEdit?: boolean;
    /** Classes CSS adicionais para a tag img */
    imageClass?: string | string[] | Record<string, boolean>;
    /** Estilos inline para a tag img */
    imageStyle?: StyleValue;
    /** Função assíncrona ou síncrona executada ao salvar a edição para envio ao backend */
    onEdit?: (payload: MaxImageEditPayload) => void | Promise<void>;
}
```

#### `src/types/app.ts`
Adicionar as interfaces `BottomTab` e `MenuGroup`:
```typescript
import type { MenuItem } from './index';

/** Item de aba para o menu inferior móvel (MaxBottomMenu). */
export interface BottomTab {
    id: string;
    icon?: string;
    label?: string;
    route?: string;
    badge?: number | string;
    disabled?: boolean;
    action?: () => void;
}

/** Grupo de itens para o menu lateral móvel (MaxSideMenuMobile). */
export interface MenuGroup {
    id?: string;
    title?: string;
    items: MenuItem[];
    class?: string;
    role?: string;
}
```

### 2. Atualização de `src/types/index.ts`
Reexportar os novos módulos no final de `src/types/index.ts`:
```typescript
// Tipos do MaxDividers
export type * from './dividers';

// Tipos do MaxAuthCard
export type * from './auth';

// Tipos do MaxImage
export type * from './image';
```

### 3. Atualização de `src/index.ts`
Remover as linhas 23, 42 e 157:
- Linha 23 (`export type { MaxDividersProps } from './components/MaxDividers.vue';`) ➔ Remover (já exportado por `export * from './types'`).
- Linha 42 (`export type { AuthProvider, ... } from './components/MaxAuthCard.vue';`) ➔ Remover (já exportado por `export * from './types'`).
- Linha 157 (`export type { MaxImageProps, ... } from './components/MaxImage.vue';`) ➔ Remover (já exportado por `export * from './types'`).

### 4. Atualização das Importações nos Componentes Vue
- `src/components/MaxDividers.vue`: Alterar declaração local para `import type { MaxDividersProps } from '../types';`
- `src/components/MaxAuthCard.vue`: Alterar declaração local para `import type { AuthProvider, AuthOtpEndpoint, AuthOtpSession, AuthMode, AuthStep, AuthLabels } from '../types';`
- `src/components/MaxImage.vue`: Alterar declaração local para `import type { MaxImageProps, MaxImageEditPayload } from '../types';`
- `src/components/MaxBottomMenu.vue`: Alterar declaração local para `import type { BottomTab } from '../types';`
- `src/components/MaxSideMenuMobile.vue`: Alterar declaração local para `import type { MenuGroup } from '../types';`
- `src/components/MaxApp.vue`: Alterar `import type { BottomTab } from './MaxBottomMenu.vue'` e `import type { MenuGroup } from './MaxSideMenuMobile.vue'` para `import type { BottomTab, MenuGroup } from '../types';`
- `src/components/MaxPageLayout.vue`: Alterar para `import type { BottomTab, MenuGroup } from '../types';`
- `src/components/MaxPageMobileLayout.vue`: Alterar para `import type { BottomTab, MenuGroup } from '../types';`

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Falha Prévia)
Executar a validação de tipo com o compilador TypeScript puro:
```bash
npx tsc --noEmit
```
**Resultado Red:** Falha imediata com código de saída 2 e 8 erros `TS2614` em `src/index.ts`.

Criar o arquivo de teste `tests/types/index-exports.test.ts`:
```typescript
import { describe, it, expectTypeOf } from 'vitest';
import type {
    MaxDividersProps,
    AuthProvider,
    AuthOtpEndpoint,
    AuthMode,
    AuthStep,
    AuthLabels,
    MaxImageProps,
    MaxImageEditPayload,
    BottomTab,
    MenuGroup
} from '../../src/index';
import type {
    MaxDividersProps as TypesMaxDividersProps,
    AuthProvider as TypesAuthProvider,
    MaxImageProps as TypesMaxImageProps,
    BottomTab as TypesBottomTab,
    MenuGroup as TypesMenuGroup
} from '../../src/types';

describe('TypeScript Type Exports — src/index and src/types', () => {
    it('exporta corretamente MaxDividersProps a partir do ponto de entrada', () => {
        expectTypeOf<MaxDividersProps>().toEqualTypeOf<TypesMaxDividersProps>();
        expectTypeOf<MaxDividersProps>().toHaveProperty('direction');
        expectTypeOf<MaxDividersProps>().toHaveProperty('inLine');
        expectTypeOf<MaxDividersProps>().toHaveProperty('inColumn');
        expectTypeOf<MaxDividersProps>().toHaveProperty('resizable');
    });

    it('exporta corretamente tipos de autenticação a partir do ponto de entrada', () => {
        expectTypeOf<AuthProvider>().toEqualTypeOf<TypesAuthProvider>();
        expectTypeOf<AuthMode>().toEqualTypeOf<'password' | 'phone-otp'>();
        expectTypeOf<AuthStep>().toEqualTypeOf<'phone' | 'code'>();
        expectTypeOf<AuthLabels>().toHaveProperty('email');
        expectTypeOf<AuthOtpEndpoint>().toHaveProperty('label');
    });

    it('exporta corretamente tipos de imagem a partir do ponto de entrada', () => {
        expectTypeOf<MaxImageProps>().toEqualTypeOf<TypesMaxImageProps>();
        expectTypeOf<MaxImageProps>().toHaveProperty('src');
        expectTypeOf<MaxImageProps>().toHaveProperty('allowEdit');
        expectTypeOf<MaxImageEditPayload>().toHaveProperty('dataUrl');
        expectTypeOf<MaxImageEditPayload>().toHaveProperty('blob');
    });

    it('exporta corretamente tipos de layout e navegação', () => {
        expectTypeOf<BottomTab>().toEqualTypeOf<TypesBottomTab>();
        expectTypeOf<BottomTab>().toHaveProperty('id');
        expectTypeOf<MenuGroup>().toEqualTypeOf<TypesMenuGroup>();
        expectTypeOf<MenuGroup>().toHaveProperty('items');
    });
});
```

### 2. Etapa Green (Sucesso Pós-Correção)
Após mover os tipos para `src/types/` e atualizar os imports:
1. `npx tsc --noEmit` executa com código de saída 0 (zero erros).
2. `npm run type-check` (`vue-tsc --noEmit`) executa com código de saída 0.
3. `npx vitest run tests/types/index-exports.test.ts` passa com sucesso em todas as asserções de tipo.

---

## Banco de Dados

- **Nenhuma** migration necessária (refatoração exclusiva de tipagem TypeScript no frontend).

---

## Riscos de Quebra e Não-Regressão

- **Superfície de API Pública (Public API Surface):** 100% preservada. Nenhum tipo foi renomeado, removido ou teve suas propriedades alteradas. Consumidores que importam de `@maxvue/max-components-ui` continuarão a importar exatamente os mesmos tipos com as mesmas assinaturas.
- **Isolamento de Tipos e Bundling:** Como todas as importações usam `import type` e `export type`, a emissão de código JavaScript pelo Vite/Rollup não sofre alteração em tempo de execução (`type-only erasure`), prevenindo injeções acidentais no bundle de produção.
- **Não-Regressão:** A suíte completa de testes unitários (132 arquivos e 1777+ testes) continuará passando normalmente.

---

## Validação

- Compilação estática TypeScript pura:
  ```bash
  npx tsc --noEmit
  ```
- Checagem de tipos Vue/TypeScript:
  ```bash
  npm run type-check
  ```
- Execução da nova suíte de testes de tipos:
  ```bash
  npx vitest run tests/types/index-exports.test.ts
  ```
- Suíte completa de testes:
  ```bash
  npm test
  ```
- Linting e formatação:
  ```bash
  npm run lint
  ```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices`
- `planning-with-files`
- `vue-debugging-best-practices`
- `tdd`
- `code-review`
- `production-code-audit`
