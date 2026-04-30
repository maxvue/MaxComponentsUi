<template>
    <div class="playground">
        <header class="playground__header">
            <h1>MaxComponentsUi - Playground</h1>
            <p>Teste dos componentes da biblioteca</p>
        </header>

        <main class="playground__main">
            <section class="component-section">
                <h2>Inputs</h2>
                <div class="component-grid">
                    <div class="component-item bg-red-100 p-4">
                        <h3>Básico</h3>
                        <Grid>
                            <MaxInputText label="Input text required 50%" v-model="value.a" required s50 />
                            <MaxInputText label="Input text required 25%" v-model="value.b" required s25 />
                            <div s25></div>
                        </Grid>

                        <h3>Icon</h3>
                        <Grid>
                            <MaxInputText label="Icon Left 20%" v-model="value.e" s20 icon="humbleicons:box" />
                            <MaxInputText label="Icon Right 20%" v-model="value.e" s20 iconRight="humbleicons:box" />
                            <MaxInputText label="Icon Left Right 10%" v-model="value.e" s10 icon="humbleicons:box" iconRight="humbleicons:box" />
                            <MaxInputText label="Icon Loading 10%" v-model="value.e" s10 iconRight="loading" />
                        </Grid>

                        <h3>Message</h3>
                        <Grid>
                            <MaxInputText label="Mensagem 20%" v-model="value.e" s20 message="Mensagem simples" />
                            <MaxInputText label="Mensagem com icone 20%" v-model="value.e" s20 message="Mensagem com ícone" icon-message="humbleicons:box" />
                            <div s60></div>
                        </Grid>

                        <h3>Especiais</h3>
                        <Grid>
                            <MaxPhoneField v-model="value.e" s80 message="Mensagem simples" />
                            <div s60></div>
                        </Grid>
                    </div>
                </div>
            </section>
        </main>

        <main class="playground__main">
            <section class="component-section">
                <h2>Button</h2>
                <div class="component-grid">
                    <div class="component-item">
                        <h3>Básico</h3>
                        <Button label="Botão Primário" @click="handleClick" />
                    </div>

                    <div class="component-item">
                        <h3>Severidades</h3>
                        <div class="button-group">
                            <Button label="Successs" severity="success" @click="handleClick" />
                            <Button label="Info" severity="info" @click="handleClick" />
                            <Button label="Warning" severity="warning" @click="handleClick" />
                            <Button label="Danger" severity="danger" @click="handleClick" />
                        </div>
                    </div>

                    <div class="component-item">
                        <h3>Tamanhos</h3>
                        <div class="button-group">
                            <Button label="Pequeno" size="small" @click="handleClick" />
                            <Button label="Normal" @click="handleClick" />
                            <Button label="Grande" size="large" @click="handleClick" />
                        </div>
                    </div>

                    <div class="component-item">
                        <h3>Variantes</h3>
                        <div class="button-group">
                            <Button label="Outlined" variant="outlined" @click="handleClick" />
                            <Button label="Text" variant="text" @click="handleClick" />
                            <Button label="Link" variant="link" @click="handleClick" />
                        </div>
                    </div>

                    <div class="component-item">
                        <h3>Com Ícones</h3>
                        <div class="button-group">
                            <Button label="Salvar" :icon="icont" @click="icont = icont === 'tdesign:icon' ? 'la:truck-loading' : 'tdesign:icon'" iconPos="right" />
                            <Button label="Excluir" icon="tdesign:icon" severity="danger" @click="handleClick" />
                        </div>
                    </div>

                    <div class="component-item">
                        <h3>Estados</h3>
                        <div class="button-group">
                            <Button label="Normal" @click="handleClick" />
                            <Button label="Carregando" loading @click="handleClick" iconPos="right" />
                            <Button label="Desabilitado" disabled @click="handleClick" />
                        </div>
                    </div>
                </div>
            </section>

            <section class="component-section">
                <h2>Eventos</h2>
                <div class="component-item">
                    <p>Último clique: {{ lastClickEvent || 'Nenhum' }}</p>
                    <Button label="Clique em mim" @click="handleDetailedClick" />
                </div>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import MaxInputText from '@/components/MaxInputText.vue';
    import Button from '@/components/MaxButton.vue';
    import Grid from '@/components/Grid.vue';
    import MaxPhoneField from '@/components/MaxPhoneField.vue';

    const lastClickEvent = ref<string>('');

    const value = ref({
        a: '',
        b: '',
        c: '',
        d: '',
        e: ''
    });

    const handleClick = () => {
        console.log('Botão clicado!');
    };

    const icont = ref('tdesign:icon');

    const handleDetailedClick = (event: MouseEvent) => {
        const timestamp = new Date().toLocaleTimeString();
        lastClickEvent.value = `Botão clicado às ${timestamp} - Coordenadas: (${event.clientX}, ${event.clientY})`;
    };
</script>

<style lang="scss">
    .playground {
        min-height: 100vh;
        padding: 2rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

        &__header {
            text-align: center;
            color: white;
            margin-bottom: 3rem;

            h1 {
                font-size: 2.5rem;
                margin-bottom: 0.5rem;
                font-weight: 700;
            }

            p {
                font-size: 1.2rem;
                opacity: 0.9;
            }
        }

        &__main {
            max-width: 1200px;
            margin: 0 auto;
        }
    }

    .component-section {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

        h2 {
            color: #333;
            font-size: 1.8rem;
            margin-bottom: 1.5rem;
            border-bottom: 2px solid #667eea;
            padding-bottom: 0.5rem;
        }
    }

    .component-grid {
        display: grid;
        gap: 2rem;
    }

    .component-item {
        h3 {
            color: #555;
            font-size: 1.2rem;
            margin-bottom: 1rem;
            font-weight: 600;
        }

        p {
            color: #666;
            margin-bottom: 1rem;
            font-family: monospace;
            background: #f5f5f5;
            padding: 0.5rem;
            border-radius: 4px;
        }
    }

    .button-group {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        align-items: center;
    }
</style>
