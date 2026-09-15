import { createApp, h, ref } from 'vue';
import { createPinia } from 'pinia';
import MaxBaseOverlay from '../../src/components/base/MaxBaseOverlay.vue';
import MaxPopover from '../../src/components/MaxPopover.vue';
import '../../src/themes/tokens.scss';
import '../../src/themes/params.scss';

const target = document.createElement('button');
target.textContent = 'Gatilho do overlay';
target.style.cssText = 'position:fixed;left:90px;top:120px;width:80px;height:30px';
document.body.append(target);

const visible = ref(true);
const app = createApp({
    setup: () => () => h('main', [
        h(MaxBaseOverlay, {
            visible: visible.value,
            target,
            matchTargetWidth: true,
            'onUpdate:visible': (value: boolean) => { visible.value = value; }
        }, {
            default: () => h('div', { style: 'width:400px;height:400px' }, 'Conteúdo rolável do overlay sob pinch-zoom')
        }),
        h(MaxPopover, { title: 'Popover sob pinch-zoom', width: 300 }, {
            default: () => h('div', { style: 'height:400px' }, 'Conteúdo rolável do popover sob pinch-zoom')
        })
    ])
});
app.directive('tooltip', {});
app.use(createPinia());
app.mount('#app');
