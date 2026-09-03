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

                        <h3>Textarea</h3>
                        <MaxGrid>
                            <MaxInputTextArea label="Auto-resize padrão (maxRows 10)" v-model="textAreaValue1" s50 />
                            <MaxInputTextArea label="Auto-resize com maxRows 4 (com scroll)" v-model="textAreaValue2" :maxRows="4" s50 />
                            <MaxInputTextArea label="Sem auto-resize (rows 3 fixo com scroll)" v-model="textAreaValue3" :autoResize="false" :rows="3" s50 />
                        </MaxGrid>

                        <h3>Markdown Editor (MaxInputMarkdown)</h3>
                        <MaxGrid>
                            <MaxInputMarkdown
                                label="Conteúdo Rico em Markdown"
                                v-model="markdownValue"
                                placeholder="Digite seu texto formatado ou cole imagens com Ctrl+V..."
                                minHeight="200px"
                                maxHeight="400px"
                                s100
                            />
                            <MaxInputMarkdown
                                label="Markdown Desabilitado"
                                v-model="markdownDisabledValue"
                                disabled
                                minHeight="120px"
                                s50
                            />
                            <MaxInputMarkdown
                                label="Markdown Obrigatório"
                                v-model="markdownRequiredValue"
                                required
                                minHeight="120px"
                                s50
                            />
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

            <section class="component-section">
                <h2>Tabs, Accordion e Drawer</h2>
                <div class="component-grid">
                    <div class="component-item">
                        <h3>Tabs</h3>
                        <MaxTabs v-model:value="tab_ativa">
                            <MaxTabList>
                                <MaxTab value="0">Dados</MaxTab>
                                <MaxTab value="1">Anexos</MaxTab>
                                <MaxTab value="2" disabled>Bloqueada</MaxTab>
                            </MaxTabList>
                            <MaxTabPanels>
                                <MaxTabPanel value="0">Conteúdo dos dados</MaxTabPanel>
                                <MaxTabPanel value="1">Conteúdo dos anexos</MaxTabPanel>
                                <MaxTabPanel value="2">Conteúdo bloqueado</MaxTabPanel>
                            </MaxTabPanels>
                        </MaxTabs>

                        <h3>Tabs scrollable</h3>
                        <MaxTabs v-model:value="tab_scrollable_ativa" scrollable>
                            <MaxTabList>
                                <MaxTab v-for="n in 10" :key="n" :value="String(n)">Aba {{ n }}</MaxTab>
                            </MaxTabList>
                            <MaxTabPanels>
                                <MaxTabPanel v-for="n in 10" :key="n" :value="String(n)">Conteúdo da aba {{ n }}</MaxTabPanel>
                            </MaxTabPanels>
                        </MaxTabs>
                    </div>

                    <div class="component-item">
                        <h3>Accordion</h3>
                        <MaxAccordion v-model:value="painel_aberto">
                            <MaxAccordionItem value="a">
                                <template #header>Primeira seção</template>
                                <template #content>Conteúdo da primeira seção.</template>
                            </MaxAccordionItem>
                            <MaxAccordionItem value="b">
                                <template #header>Segunda seção</template>
                                <template #content>Conteúdo da segunda seção.</template>
                            </MaxAccordionItem>
                            <MaxAccordionItem value="c">
                                <template #header>Terceira seção</template>
                                <template #content>Conteúdo da terceira seção.</template>
                            </MaxAccordionItem>
                        </MaxAccordion>

                        <h3>Accordion múltiplo</h3>
                        <!-- Sem `value`: os itens recebem item-1, item-2, item-3 por ordem de montagem. -->
                        <MaxAccordion v-model:value="paineis_abertos" multiple>
                            <MaxAccordionItem>
                                <template #header>Primeira seção</template>
                                <template #content>Conteúdo da primeira seção.</template>
                            </MaxAccordionItem>
                            <MaxAccordionItem>
                                <template #header>Segunda seção</template>
                                <template #content>Conteúdo da segunda seção.</template>
                            </MaxAccordionItem>
                            <MaxAccordionItem>
                                <template #header>Terceira seção</template>
                                <template #content>Conteúdo da terceira seção.</template>
                            </MaxAccordionItem>
                        </MaxAccordion>
                    </div>

                    <div class="component-item">
                        <h3>Drawer</h3>
                        <div class="button-group">
                            <MaxButton label="Abrir drawer (direita)" @click="drawer_visivel = true" />
                            <MaxButton label="Abrir drawer (esquerda)" @click="drawer_visivel_esquerda = true" />
                            <MaxButton label="Abrir drawer (topo)" @click="drawer_visivel_topo = true" />
                            <MaxButton label="Abrir drawer (base)" @click="drawer_visivel_base = true" />
                        </div>

                        <MaxDrawer v-model:visible="drawer_visivel" header="Menu lateral" position="right">
                            <p>Conteúdo do drawer.</p>
                            <template #footer>
                                <MaxButton label="Fechar" @click="drawer_visivel = false" />
                            </template>
                        </MaxDrawer>

                        <MaxDrawer v-model:visible="drawer_visivel_esquerda" header="Menu esquerdo" position="left">
                            <p>Conteúdo do drawer à esquerda.</p>
                            <template #footer>
                                <MaxButton label="Fechar" @click="drawer_visivel_esquerda = false" />
                            </template>
                        </MaxDrawer>

                        <MaxDrawer v-model:visible="drawer_visivel_topo" header="Menu superior" position="top">
                            <p>Conteúdo do drawer no topo.</p>
                            <template #footer>
                                <MaxButton label="Fechar" @click="drawer_visivel_topo = false" />
                            </template>
                        </MaxDrawer>

                        <MaxDrawer v-model:visible="drawer_visivel_base" header="Menu inferior" position="bottom">
                            <p>Conteúdo do drawer na base.</p>
                            <template #footer>
                                <MaxButton label="Fechar" @click="drawer_visivel_base = false" />
                            </template>
                        </MaxDrawer>
                    </div>
                </div>
            </section>

            <section class="component-section">
                <h2>MaxListBox</h2>
                <div class="component-grid">
                    <div class="component-item">
                        <h3>Local com filtro</h3>
                        <MaxListBox
                            v-model="listBoxValue"
                            :options="listBoxOptions"
                            filter
                            title="Registros"
                            height="320px"
                        />
                        <p>Selecionado: {{ listBoxValue ?? 'nenhum' }}</p>
                    </div>

                    <div class="component-item">
                        <h3>Duas linhas + badge</h3>
                        <MaxListBox
                            v-model="listBoxValue"
                            :options="listBoxOptions"
                            two-lines
                            :item-height="56"
                            height="320px"
                        />
                    </div>

                    <div class="component-item">
                        <h3>Virtual scroll (2000 itens)</h3>
                        <MaxListBox
                            v-model="bigListValue"
                            :options="bigListOptions"
                            filter
                            height="320px"
                        />
                    </div>

                    <div class="component-item">
                        <h3>API paginada (scroll infinito)</h3>
                        <MaxListBox
                            v-model="apiListValue"
                            :load-options="fakeLoadOptions"
                            filter
                            :page-size="20"
                            height="320px"
                            @load-error="lastClickEvent = 'erro ao carregar'"
                        />
                    </div>
                    <section class="component-section">
                        <h2>MaxImage (Visualizador e Editor de Imagem)</h2>
                        <div class="component-grid">
                            <div class="component-item">
                                <h3>Visualização com Zoom (Clique para abrir maior)</h3>
                                <p style="margin-bottom: 12px; color: #666; font-size: 0.9rem;">
                                    Clique na imagem para abrir em tela cheia com efeito de zoom in, controles flutuantes de zoom (+ / -) e fechamento pelo backdrop ou botão sair.
                                </p>
                                <MaxImage
                                    :src="sampleImage1"
                                    alt="Paisagem Abstrata"
                                    width="280px"
                                    height="180px"
                                    style="border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                                />
                            </div>

                            <div class="component-item">
                                <h3>Com Edição e Recorte (allow-edit="true" e on-edit)</h3>
                                <p style="margin-bottom: 12px; color: #666; font-size: 0.9rem;">
                                    Abra a visualização e clique no ícone de corte na barra flutuante para recortar a imagem.
                                </p>
                                <MaxImage
                                    v-model:src="sampleImage2"
                                    alt="Aurora Boreal"
                                    width="280px"
                                    height="180px"
                                    allow-edit
                                    :on-edit="handleImageEdit"
                                    style="border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                                />
                                <p v-if="lastEditedInfo" style="margin-top: 8px; color: #10b981; font-weight: 500; font-size: 0.85rem;">
                                    {{ lastEditedInfo }}
                                </p>
                            </div>
                        </div>
                    </section>
        </main>
    </div>
</template>

<script setup lang="ts">

    import { ref } from 'vue';
    import type { MaxImageEditPayload } from '../../src';

    const sampleImage1 = ref('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600');
    const sampleImage2 = ref('https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600');
    const lastEditedInfo = ref<string>('');

    const handleImageEdit = (payload: MaxImageEditPayload) => {
        lastEditedInfo.value = `Recortado com sucesso! Resolução: ${payload.width}x${payload.height}px (${payload.mimeType})`;
    };

    const lastClickEvent = ref<string>('');

    const iconValue = ref('');

    const textAreaValue1 = ref('Linha 1\nLinha 2\nLinha 3');
    const textAreaValue2 = ref('Texto longo com maxRows=4...\nLinha 1\nLinha 2\nLinha 3\nLinha 4\nLinha 5\nLinha 6\nLinha 7');
    const textAreaValue3 = ref('Texto com scroll interno fixo em 3 linhas\nLinha 1\nLinha 2\nLinha 3\nLinha 4\nLinha 5');
    const markdownValue = ref('# Título Principal\n\nEste é um exemplo de texto **negrito**, *itálico* e `código inline`.\n\n- Item 1\n- Item 2\n\n> Citação importante do sistema.\n\n### Anexos e Mídias\n\n![Exemplo de Imagem](https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400)\n\nConsulte o documento: [Manual do Usuário.pdf](https://raw.githubusercontent.com/mozilla/pdf.js/master/test/pdfs/helloworld.pdf)');
    const markdownDisabledValue = ref('**Conteúdo somente leitura**');
    const markdownRequiredValue = ref('');

    const value = ref({
        a: '',
        b: '',
        c: '',
        d: '',
        e: ''
    });

    const selectValue = ref();

    const listBoxValue = ref(null);
    const bigListValue = ref(null);
    const apiListValue = ref(null);

    const listBoxOptions = ref([
        { value: 1, label: 'Construtora Alfa', sub_label: 'CNPJ 11.111.111/0001-11', icon: 'mdi:office-building', badge: '12' },
        { value: 2, label: 'Beta Engenharia', sub_label: 'CNPJ 22.222.222/0001-22', icon: 'mdi:office-building', badge: '3' },
        { value: 3, label: 'Gama Incorporadora', sub_label: 'CNPJ 33.333.333/0001-33', icon: 'mdi:office-building' },
        { value: 4, label: 'Delta Obras (inativa)', sub_label: 'CNPJ 44.444.444/0001-44', icon: 'mdi:office-building', disabled: true }
    ]);

    const bigListOptions = ref(
        Array.from({ length: 2000 }, (_, i) => ({
            value: i,
            label: `Registro ${i}`,
            sub_label: `código ${1000 + i}`
        }))
    );

    /**
     * Simula uma API paginada com latência, para testar o scroll infinito.
     *
     * Diferente do stub ingênuo, o filtro de busca é aplicado de fato sobre a
     * base completa antes de paginar: o `total` retornado reflete o tamanho do
     * conjunto já filtrado. Isso é essencial porque o componente auto-preenche
     * o painel buscando páginas seguintes sempre que a página atual não cobre a
     * altura visível (ver MaxListBox.vue -> fillViewportIfNeeded) — se `total`
     * não refletisse a busca, uma busca sem resultados nunca fecharia
     * `hasMore` e o auto-preenchimento buscaria página atrás de página
     * indefinidamente (até o limite de segurança MAX_AUTO_FILL_PAGES).
     */
    async function fakeLoadOptions({ page, search, pageSize }: { page: number; search: string; pageSize: number }) {
        await new Promise((resolve) => setTimeout(resolve, 400));

        const allItems = Array.from({ length: 137 }, (_, i) => ({
            value: i,
            label: `Item remoto ${i}`,
            sub_label: `código ${2000 + i}`
        }));

        const filtered = search
            ? allItems.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
            : allItems;

        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize);

        return { items, total };
    }

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

    const tab_ativa = ref('0');
    const tab_scrollable_ativa = ref('1');
    const painel_aberto = ref<string | undefined>('a');
    const paineis_abertos = ref<string[]>(['a']);
    const drawer_visivel = ref(false);
    const drawer_visivel_esquerda = ref(false);
    const drawer_visivel_topo = ref(false);
    const drawer_visivel_base = ref(false);
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
