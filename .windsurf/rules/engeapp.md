---
trigger: always_on
---

# DIRETRIZES DE COMPORTAMENTO E IDIOMA

1. Sempre responda, comente códigos, planeje tarefas e interaja estritamente em Português do Brasil (pt-BR).
2. Vá direto ao ponto. Respostas curtas, simples e objetivas. Zero saudações, despedidas ou conversas desnecessárias ("fluff").
3. Para cada problema, sempre que possível, forneça duas ou mais opções de resolução, indicando explicitamente qual é a mais recomendada.

# STACK TECNOLÓGICA

- Backend:
    1. PHP 8.5
    2. MariaDB 11
    3. Laravel 13
    4. Laravel Horizon para Jobs
    5. Laravel Reverb para Websockets
    6. Meilisearch
    7. Redis

- Frontend:
    1. Vue 3.6
    2. TypeScript
    3. Pinia
    4. Vue Router 5 (SPA)
    5. Vite 8
    6. UnoCss (Sem Tailwind).
    7. Unplugin Auto Import
    8. Unplugin Vue Components
    9. PrimeVue

# SERVIDOR EM PRODUÇÃO

- Ryzen 7 5700X
- Ram 64Gb
- GPU: GTX 1050Ti
- 3x SSD NVME em Raid ZFS (1 Redundância)
- Sistema Operacional: Proxmox - 9.0.3
- Servidor Web: CT LXC - CloudPanel com 16Gb de Ram e 6 Cores
- Otimizações: Octane com FrankenPHP
- VM NAS: Unraid
    1. Seafile
    2. Meilisearch

# COMPUTADOR DE DESENVOLVIMENTO

- Ryzen 9 5950X
- Ram 32Gb
- GPU: RTX 3070Ti
- 2x SSD NVME em Raid 0
- Sistema Operacional: Linux Cachy OS
- Servidor Web: Valet Linux

# DESCRIÇÃO DO NEGÓCIO

- Sistema de gestão de clientes e projetos fotovoltaicos.
    1. Emissão de documentos para homologação na concessionária.
    2. Sistema de controle e gerenciamento de Clientes, Integradores de energia solar e Documentos
    3. API oficial WhatsApp Cloud para atendimento e gerenciamento de reclamações
    4. Api de Pagamentos EFI/Inter para gestão de cobranças e recebimentos

# REGRAS ESTRITAS DE DESENVOLVIMENTO

1. VUE.JS:
    - Use EXCLUSIVAMENTE Composition API. Jamais utilize Options API.
    - A linguagem padrão para scripts é sempre TypeScript => <script setup lang="ts">
    - A linguagem padrão para style é sempre Scss => <style lang="scss">
    - A ordem estrutural obrigatória nos arquivos `.vue` (SFC) é: 1º `<template>`, 2º `<script setup>`, 3º `<style>`.
    - Ao responder sobre JavaScript, converta e responda aplicando os conceitos e tipagens do TypeScript.
