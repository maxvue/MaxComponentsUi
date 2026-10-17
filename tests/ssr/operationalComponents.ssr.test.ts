// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import MaxDescriptionList from '../../src/components/MaxDescriptionList.vue';
import MaxSaveIndicator from '../../src/components/MaxSaveIndicator.vue';
import MaxUsageMeter from '../../src/components/MaxUsageMeter.vue';
import MaxChatMessage from '../../src/components/MaxChatMessage.vue';
import MaxCopyButton from '../../src/components/MaxCopyButton.vue';
import MaxCodeBlock from '../../src/components/MaxCodeBlock.vue';
import MaxAttachmentList from '../../src/components/MaxAttachmentList.vue';
import MaxAudioPlayer from '../../src/components/MaxAudioPlayer.vue';
import MaxSocialPostPreview from '../../src/components/MaxSocialPostPreview.vue';
import MaxKanbanBoard from '../../src/components/MaxKanbanBoard.vue';

describe('componentes operacionais em SSR', () => {
    it('renderiza sem acessar globals de navegador', async () => {
        expect(typeof window).toBe('undefined');
        const html = await renderToString(createSSRApp({ render: () => h('main', [h(MaxCopyButton, { text: 'SSR' }), h(MaxCodeBlock, { code: 'texto' }), h(MaxDescriptionList, { items: [{ id: 'a', label: 'Estado', value: false }] }), h(MaxSaveIndicator, { state: 'saved' }), h(MaxUsageMeter, { used: null, limit: null, label: 'Uso' }), h(MaxAttachmentList, { files: [] }), h(MaxAudioPlayer, { src: '' }), h(MaxChatMessage, { id: 'm1', author: 'Sistema', text: 'SSR' }), h(MaxSocialPostPreview, { author: 'Equipe', media: [] }), h(MaxKanbanBoard, { columns: [] })]) }));
        expect(html).toContain('Não');
        expect(html).toContain('Salvo');
        expect(html).toContain('SSR');
    });
});
