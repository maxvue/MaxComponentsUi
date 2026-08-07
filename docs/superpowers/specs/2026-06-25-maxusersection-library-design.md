# MaxUserSection — adaptação para a biblioteca

## Objetivo

Adaptar `MaxUserSection.vue`, trazido do projeto Engeapp, para funcionar como
componente reutilizável da biblioteca `@maxvue/max-components-ui`. O componente
exibe nome do usuário, empresa (opcional), avatar e um menu dropdown.

## Problema atual

O componente está acoplado ao app:

- Stores inexistentes na lib: `useSystemStore`, `useUserStore`, `useLoadingStore`
- `vue-router` e `ziggy-js` (`useRouter`, `useRoute`)
- `apiPostRoute` (chamada de API)
- Componentes `UserAvatar`, `Icon`, `TieredMenu` sem import (auto-import do app)

## Design

Componente totalmente prop-driven que emite eventos. O app consumidor decide
navegação, chamadas de API e estado.

### Props

- `name?: string`
- `companyName?: string` (opcional)
- `userId?: string | number`
- `avatarUrl?: string`
- `darkMode?: boolean`
- `isImpersonated?: boolean`
- `version?: string` — exibido como última linha do menu
- `items?: any[]` — sobrescreve o menu padrão; se ausente, usa o menu padrão pt-BR
- Labels (defaults pt-BR): `labelProfile='Meu perfil'`,
  `labelSettings='Configurações'`, `labelDarkModeOn='Ativar Modo escuro'`,
  `labelDarkModeOff='Desativar Modo escuro'`, `labelSupport='Suporte'`,
  `labelLogout='Sair'`, `labelEndImpersonate='SAIR'`,
  `labelEndImpersonateSub='(RETORNAR)'`

### Emits

`profile`, `settings`, `toggleDarkMode`, `support`, `logout`, `endImpersonate`.

### Internos

- `UserAvatar` → `MaxUserAvatar`; `Icon` → `MaxIcon`; mantém PrimeVue `TieredMenu`.
- `items` padrão computado a partir das labels; cada `exec` emite o evento correspondente.
- Remove o `watch` de darkMode (estado é do app via prop + evento `toggleDarkMode`).
- Mantém o SCSS atual (usa CSS vars do tema).
- Registra em `src/index.ts` (aliases `MaxUserSection` / `UserSection`) e regenera
  o manifest do resolver.

## Fora de escopo

Persistência de darkMode, navegação e chamadas de API — responsabilidade do app.
