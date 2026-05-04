<template>
    <div :class="`input-project-div ${isOverDropZone ? 'in-drop' : 'not-in-drop'}`" ref="drop_zone_ref" @click.stop="() => open()">
        <div class="open-files" pointer>
            <div class="instruction">
                Insira fotos dos documentos ou Documentos em PDF aqui
                <br />
                para registrar os dados automaticamente.
            </div>
            <div>Clique aqui ou arraste e solte os documentos para carregar.</div>
            <Icon icon="material-symbols:folder-open" size="2" />
        </div>
        <div class="file-list">
            <div v-for="file in filesRg" :key="file.name" class="file-item" pointer>
                <div v-tooltip.top="'Documento de identificação'">
                    <Icon i="mdi:identification-card" size="2" />
                </div>
            </div>
            <div v-for="file in filesFatura" :key="file.name" pointer>
                <div v-tooltip.top="'Fatura de Energia'">
                    <Icon i="fa7-solid:file-invoice-dollar" size="2" />
                </div>
            </div>
            <div v-for="file in filesListaEquipamentos" :key="file.name" pointer>
                <div v-tooltip.top="'Kit Fotovoltaico'">
                    <Icon i="mingcute:solar-panel-line" size="2" />
                </div>
            </div>
        </div>
        <div class="check-list-upload-files" v-if="ready">
            <div class="item">
                <IconCheck :value="filesRg.length > 0" />
                <div>Documento de identificação (RG ou CNH)</div>
            </div>
            <div class="item">
                <IconCheck :value="filesFatura.length > 0" />
                <div>Fatura de Energia</div>
            </div>
            <div class="item">
                <IconCheck :value="filesQuadroAberto.length > 0" />
                <div>Foto do quadro medidor aberto</div>
            </div>
            <div class="item">
                <IconCheck :value="filesQuadroFechado.length > 0" />
                <div>Foto do quadro medidor fechado</div>
            </div>
            <div class="item">
                <IconCheck :value="filesListaEquipamentos.length > 0" />
                <div>Lista de Equipamentos do kit fotovoltaico</div>
            </div>
        </div>
        <div class="icon-make-ai" @click.stop="$emit('process-ai')">
            <IconButton i="hugeicons:ai-file" size="1.3" v-tooltip.left="'Processar arquivos'" />
        </div>
    </div>
</template>
<script setup lang="ts">
    const props = withDefaults(
        defineProps<{
            filesRg?: any[];
            filesFatura?: any[];
            filesQuadroAberto?: any[];
            filesQuadroFechado?: any[];
            filesListaEquipamentos?: any[];
            ready?: boolean;
        }>(),
        {
            filesRg: () => [],
            filesFatura: () => [],
            filesQuadroAberto: () => [],
            filesQuadroFechado: () => [],
            filesListaEquipamentos: () => [],
            ready: false
        }
    );

    const emit = defineEmits(['files-selected', 'process-ai']);

    // REFS
    const drop_zone_ref: Ref = ref(null);

    const { isOverDropZone } = useDropZone(drop_zone_ref, {
        onDrop,
        multiple: true,
        preventDefaultForUnhandled: false
    });

    const { open, reset, onChange } = useFileDialog({
        directory: false
    });

    onChange((files) => {
        if (files) emit('files-selected', Array.from(files));
        reset();
    });

    function onDrop(files: File[] | null) {
        if (files) emit('files-selected', files);
    }
</script>

<style lang="scss">
    .input-project-div {
        width: 100%;
        height: 300px;
        position: relative;
        outline: 3px dashed var(--background-300);
        border-radius: 0.8rem;
        display: grid;
        place-items: center;

        .open-files {
            display: grid;
            place-items: center;
            text-align: center;
            gap: 5px;
            color: var(--background-600);

            .instruction {
                text-align: center;
            }

            .icon-div {
                color: var(--background-600);
            }
        }

        &.not-in-drop {
            &:hover {
                outline: 3px dashed var(--background-600);

                .open-files {
                    color: var(--background-750);

                    .icon-div {
                        color: var(--background-750);
                    }
                }
            }
        }

        &.in-drop {
            outline: 3px dashed var(--background-600);
            background-color: var(--background-200);
        }

        .check-list-upload-files {
            position: absolute;
            top: 0.5rem;
            left: 1rem;

            .item {
                display: grid;
                grid-template-columns: auto 1fr;
                place-items: center start;
                gap: 0.5rem;
                height: 30px;
                color: var(--background-650);
                font-size: 0.9rem;
            }
        }

        .icon-make-ai {
            width: 32px;
            height: 32px;
            position: absolute;
            bottom: 10px;
            right: 10px;
        }
    }
</style>
