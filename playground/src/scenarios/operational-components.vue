<template>
    <main class="operational-components">
        <h2>Componentes operacionais reutilizáveis</h2>
        <section><h3>Diagnóstico e detalhes</h3><MaxDescriptionList :items="details" /><MaxCodeBlock label="Resposta técnica" code="status: 200\nresultado: concluído" copyable /></section>
        <section><h3>Estado e consumo</h3><MaxSaveIndicator state="saved" /><MaxUsageMeter label="Armazenamento" :used="72" :limit="100" unit="MB" /></section>
        <section><h3>Mensagem e anexos</h3><MaxChatMessage id="demo-message" author="Suporte" text="Olá! Este é um exemplo demonstrativo." time-label="10:30" /><MaxAttachmentList :files="attachments" /></section>
        <section><h3>Prévia e quadro</h3><MaxSocialPostPreview author="Equipe editorial" caption="Uma prévia genérica de conteúdo." :media="[]" /><MaxKanbanBoard :columns="columns" /></section>
        <section><h3>Mídia e ação</h3><MaxCopyButton text="Exemplo sem dados pessoais" /><MaxAudioPlayer src="" /></section>
    </main>
</template>

<script setup lang="ts">
    import { MaxAttachmentList, MaxAudioPlayer, MaxChatMessage, MaxCodeBlock, MaxCopyButton, MaxDescriptionList, MaxKanbanBoard, MaxSaveIndicator, MaxSocialPostPreview, MaxUsageMeter } from '../../../src';
    import type { MaxPreviewFile } from '../../../src/types/filePreview';
    import type { MaxKanbanColumn } from '../../../src/types/kanbanBoard';

    const details = [{ id: 'operation', label: 'Operação', value: 'Demonstração' }, { id: 'result', label: 'Status', value: 'Concluída' }];
    const attachments: MaxPreviewFile[] = [];
    const columns: MaxKanbanColumn[] = [{ id: 'todo', title: 'A fazer', items: [{ id: 'review', title: 'Revisar conteúdo' }] }, { id: 'done', title: 'Concluído', items: [] }];
</script>

<style lang="scss" scoped>
.operational-components { display: grid; gap: 18px; padding: 16px; }
.operational-components section { display: grid; gap: 10px; padding: 14px; border: 1px solid var(--background-300, #cbd5e1); border-radius: 8px; }
</style>
