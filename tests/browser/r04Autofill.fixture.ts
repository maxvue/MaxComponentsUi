import { createApp, h, ref } from 'vue';
import { createPinia } from 'pinia';
import MaxInputText from '../../src/components/MaxInputText.vue';

const email = ref('');

const app = createApp({
    render: () => h('form', { id: 'r04-autofill-form' }, [
        h(MaxInputText, {
            modelValue: email.value,
            'onUpdate:modelValue': (value: string | number | undefined) => { email.value = String(value ?? ''); },
            label: 'E-mail profissional',
            name: 'email',
            autocomplete: 'email',
            required: true
        })
    ])
});

app.use(createPinia());
app.directive('tooltip', {});
app.mount('#app');
