# 03 — MaxApp.vue: template referencia componentes/variáveis inexistentes

**Severidade:** Crítica
**Categoria:** Bug / Código órfão
**Arquivos:** `src/components/MaxApp.vue:1-45`

## Problema

O `<script setup>` está **vazio**, mas o template referencia `PageLayout`, `LoadScreen`, `VoipDialer`, `VoipReverbListener`, `IncomingCallModal`, `user` e `system` — nada importado ou definido. Além disso há **três slots `authenticated`/`login` duplicados**, cada um com fallback `<RouterView />`, o que renderizaria a rota até 3 vezes simultaneamente.

```html
<slot name="authenticated"><RouterView /></slot>
<slot name="authenticated"><PageLayout :screen="system.type_device">...
<template v-if="user.status?.server?.get?.is_success && system?.user?.data?.id">
```

Parece código de app consumidor colado na lib (junto com `useApp.Store.ts` e `useLogin.Store.ts`). O arquivo está excluído do tsconfig (por isso o type-check passa), mas **continua no `components-manifest.json`** — o resolver oferece `<MaxApp>` para apps consumidoras e o import falha (ver achado 14).

## Correção sugerida

Remover `MaxApp.vue` da lib (junto com as stores órfãs — achado 04), ou reescrevê-lo com imports reais e props/slots definidos. Em ambos os casos, regenerar o manifesto (`npx tsx src/scripts/generateResolver.ts`).
