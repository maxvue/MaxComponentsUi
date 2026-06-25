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
                    <div class="component-item">
                        <h3>Básico</h3>
                        <MaxGrid >
                            <MaxInputText label="Input text required 50%" v-model="value.a" required s50 />
                            <MaxInputText label="Input text required 25%" v-model="value.b" required s25 />
                            <div s25></div>
                        </MaxGrid>

                        <h3>Icon</h3>
                        <MaxGrid>
                            <MaxInputText label="Icon Left 20%" v-model="value.e" s20 icon="humbleicons:box" />
                            <MaxInputText label="Icon Right 20%" v-model="value.e" s20 iconRight="humbleicons:box" />
                            <MaxInputText label="Icon Left Right 10%" v-model="value.e" s10 icon="humbleicons:box" iconRight="humbleicons:box" />
                            <MaxInputText label="Icon Loading 10%" v-model="value.e" s10 iconRight="loading" />
                        </MaxGrid>

                        <h3>Message</h3>
                        <MaxGrid>
                            <MaxInputText label="Mensagem 20%" v-model="value.e" s20 message="Mensagem simples" />
                            <MaxInputText label="Mensagem com icone 20%" v-model="value.e" s20 message="Mensagem com ícone" icon-message="humbleicons:box" />
                            <div s60></div>
                        </MaxGrid>

                        <h3>Especiais</h3>
                        <MaxGrid>
                            <MaxPhoneField v-model="value.e" s80 message="Mensagem simples" />
                            <MaxInputSelect v-model="selectValue" :options="options" s40 label="Select básico" />
                            <MaxInputSelect v-model="selectValue" :options="optionsWithIcons" s40 label="Select com ícones" icon="humbleicons:box" />
                            <div s60></div>
                        </MaxGrid>

                        <h3>Icon Picker</h3>
                        <MaxGrid>
                            <MaxInputIconPicker v-model="iconValue" label="Ícone da categoria" s33 />
                            <MaxInputIconPicker v-model="iconValue" label="Com cor" color="#6366f1" s33 />
                            <MaxInputIconPicker v-model="iconValue" label="Obrigatório" required s33 />
                            <MaxInputIconPicker v-model="iconValue" label="Desabilitado" disabled s33 />
                            <div s66 style="display:flex;align-items:center;gap:8px;padding-top:8px;">
                                <span style="font-size:0.85rem;color:#888;">Selecionado:</span>
                                <MaxIcon v-if="iconValue" :i="iconValue" size="1.4" />
                                <code style="font-size:0.8rem;">{{ iconValue || '—' }}</code>
                            </div>
                        </MaxGrid>
                    </div>
                </div>
            </section>
        </main>

        <main class="playground__main">
            <section class="component-section">
                <T1 h1="Button" h2="Botões" />
                <div class="component-grid">
                    <div class="component-item">
                        <h3>Básico</h3>
                        <MaxButton label="Botão Primário" @click="handleClick" />
                    </div>

                    <div class="component-item">
                        <h3>Severidades</h3>
                        <div class="button-group">
                            <MaxButton label="Successs" severity="success" @click="handleClick" />
                            <MaxButton label="Info" severity="info" @click="handleClick" />
                            <MaxButton label="Warning" severity="warning" @click="handleClick" />
                            <MaxButton label="Danger" severity="danger" @click="handleClick" />
                        </div>
                    </div>

                    <div class="component-item">
                        <h3>Tamanhos</h3>
                        <div class="button-group">
                            <MaxButton label="Pequeno" size="small" @click="handleClick" />
                            <MaxButton label="Normal" @click="handleClick" />
                            <MaxButton label="Grande" size="large" @click="handleClick" />
                        </div>
                    </div>

                    <div class="component-item">
                        <h3>Variantes</h3>
                        <div class="button-group">
                            <MaxButton label="Outlined" variant="outlined" @click="handleClick" />
                            <MaxButton label="Text" variant="text" @click="handleClick" />
                            <MaxButton label="Link" variant="link" @click="handleClick" />
                        </div>
                    </div>

                    <div class="component-item">
                        <h3>Com Ícones</h3>
                        <div class="button-group">
                            <MaxButton label="Salvar" :icon="icont" @click="icont = icont === 'tdesign:icon' ? 'la:truck-loading' : 'tdesign:icon'" iconPos="right" />
                            <MaxButton label="Excluir" icon="tdesign:icon" severity="danger" @click="handleClick" />
                        </div>
                    </div>


                    <div class="component-item">
                        <h3>Estados</h3>
                        <div class="button-group">
                            <MaxButton label="Normal" @click="handleClick" />
                            <MaxButton label="Carregando" loading @click="handleClick" iconPos="right" />
                            <MaxButton label="Desabilitado" disabled @click="handleClick" />
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

    const lastClickEvent = ref<string>('');

    const iconValue = ref('');

    const value = ref({
        a: '',
        b: '',
        c: '',
        d: '',
        e: ''
    });

    const selectValue = ref();

    const options = ref([
        { name: 'Opção1', label: 'Opção1 Label', value: 1 },
        { name: 'Opção2', label: 'Opção2 Label', value: 2 },
        { name: 'Opção3', label: 'Opção3 Label', value: 3 }
    ]);

    const optionsWithIcons = ref([
        { name: 'Opção1', label: 'Opção1 Label', value: 1, icon: 'humbleicons:box' },
        { name: 'Opção2', label: 'Opção2 Label', value: 2, icon: 'humbleicons:user' },
        { name: 'Opção3', label: 'Opção3 Label', value: 3, icon: 'humbleicons:star' }
    ]);

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
        padding: 2rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        overflow: auto;
        width: 100vw;
        height: 100vh;

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
        box-shadow: 0 10px 30px rgb(0 0 0 / 10%);

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
            font-weight: 600 ;
        }
    }

    .button-group {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        align-items: center;
    }
</style>
