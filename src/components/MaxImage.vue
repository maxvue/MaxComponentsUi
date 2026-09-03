<template>
    <div class="max-image" :style="containerStyle">
        <slot name="image">
            <img
                ref="imgRef"
                :src="currentSrc"
                :alt="props.alt"
                class="max-image__preview-trigger"
                :class="[props.imageClass, { 'max-image--pointer': props.preview }]"
                :style="imageStyleComputed"
                @click="onImageClick"
            />
        </slot>

        <!-- Lightbox / Preview Modal -->
        <Teleport to="body">
            <Transition name="max-image-zoom">
                <div
                    v-if="isOpen"
                    ref="modalRef"
                    class="max-image-modal"
                    role="dialog"
                    aria-modal="true"
                    :aria-label="props.alt || 'Visualizador de Imagem'"
                    tabindex="-1"
                    @click.self="onBackdropClick"
                    @keydown.esc="closePreview"
                >
                    <div class="max-image-modal__viewport" @click.self="onBackdropClick">
                        <!-- Imagem ampliada no modo preview normal -->
                        <div
                            v-if="!isCropping"
                            class="max-image-modal__image-wrapper"
                            @click.self="onBackdropClick"
                        >
                            <img
                                :src="currentSrc"
                                :alt="props.alt"
                                class="max-image-modal__img"
                                :style="{ transform: `scale(${zoomScale})` }"
                            />
                        </div>

                        <!-- Modo de Recorte (Cropper) -->
                        <div
                            v-else
                            class="max-image-crop-stage"
                            ref="cropStageRef"
                        >
                            <img
                                ref="cropImgRef"
                                :src="currentSrc"
                                :alt="props.alt"
                                class="max-image-crop-stage__img"
                                @load="onCropImgLoaded"
                            />
                            <!-- Crop Overlay com a Crop Box -->
                            <div
                                v-if="cropReady"
                                class="max-image-crop-overlay"
                            >
                                <div
                                    class="max-image-crop-box"
                                    :style="cropBoxStyle"
                                    @pointerdown.stop="onCropBoxPointerDown"
                                >
                                    <div class="max-image-crop-grid">
                                        <div class="max-image-crop-grid-line max-image-crop-grid-line--h1"></div>
                                        <div class="max-image-crop-grid-line max-image-crop-grid-line--h2"></div>
                                        <div class="max-image-crop-grid-line max-image-crop-grid-line--v1"></div>
                                        <div class="max-image-crop-grid-line max-image-crop-grid-line--v2"></div>
                                    </div>
                                    <!-- Alças nos 4 cantos -->
                                    <div
                                        class="max-image-crop-handle max-image-crop-handle--tl"
                                        @pointerdown.stop="(e) => onHandlePointerDown(e, 'tl')"
                                    ></div>
                                    <div
                                        class="max-image-crop-handle max-image-crop-handle--tr"
                                        @pointerdown.stop="(e) => onHandlePointerDown(e, 'tr')"
                                    ></div>
                                    <div
                                        class="max-image-crop-handle max-image-crop-handle--bl"
                                        @pointerdown.stop="(e) => onHandlePointerDown(e, 'bl')"
                                    ></div>
                                    <div
                                        class="max-image-crop-handle max-image-crop-handle--br"
                                        @pointerdown.stop="(e) => onHandlePointerDown(e, 'br')"
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <!-- Barra de Ferramentas Flutuante -->
                        <div class="max-image-modal__toolbar">
                            <template v-if="!isCropping">
                                <!-- Editar (Recortar imagem) -->
                                <MaxIconButton
                                    v-if="props.allowEdit"
                                    icon="lucide:crop"
                                    :size="1.2"
                                    light
                                    title="Recortar imagem"
                                    aria-label="Recortar imagem"
                                    @click="startCrop"
                                />
                                <!-- Aumentar Zoom -->
                                <MaxIconButton
                                    icon="lucide:zoom-in"
                                    :size="1.2"
                                    light
                                    title="Aumentar Zoom"
                                    aria-label="Aumentar Zoom"
                                    @click="zoomIn"
                                />
                                <!-- Diminuir Zoom -->
                                <MaxIconButton
                                    icon="lucide:zoom-out"
                                    :size="1.2"
                                    light
                                    title="Diminuir Zoom"
                                    aria-label="Diminuir Zoom"
                                    @click="zoomOut"
                                />
                                <!-- Sair -->
                                <MaxIconButton
                                    icon="ic:round-close"
                                    :size="1.2"
                                    light
                                    title="Sair"
                                    aria-label="Sair"
                                    @click="closePreview"
                                />
                            </template>

                            <template v-else>
                                <!-- Confirmar Recorte -->
                                <MaxIconButton
                                    icon="lucide:check"
                                    :size="1.2"
                                    light
                                    title="Confirmar Recorte"
                                    aria-label="Confirmar Recorte"
                                    @click="confirmCrop"
                                />
                                <!-- Cancelar Recorte -->
                                <MaxIconButton
                                    icon="ic:round-close"
                                    :size="1.2"
                                    light
                                    title="Cancelar Recorte"
                                    aria-label="Cancelar Recorte"
                                    @click="cancelCrop"
                                />
                            </template>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
    import MaxIconButton from './MaxIconButton.vue';
    import { useScrollLock } from '../helpers/useScrollLock';
    import type { MaxImageProps, MaxImageEditPayload } from '../types';

    const props = withDefaults(defineProps<MaxImageProps>(), {
        src: '',
        alt: '',
        preview: true,
        allowEdit: false,
        fit: 'cover'
    });

    const emit = defineEmits<{
        'update:src': [src: string];
        'edit': [payload: MaxImageEditPayload];
        'crop': [payload: MaxImageEditPayload];
        'show': [];
        'hide': [];
    }>();

    const scrollLock = useScrollLock();
    const currentSrc = ref(props.src);

    watch(() => props.src, (newVal) => {
        currentSrc.value = newVal || '';
    });

    const isOpen = ref(false);
    const zoomScale = ref(1);
    const isCropping = ref(false);
    const cropReady = ref(false);

    const imgRef = ref<HTMLImageElement | null>(null);
    const cropImgRef = ref<HTMLImageElement | null>(null);
    const cropStageRef = ref<HTMLElement | null>(null);
    const modalRef = ref<HTMLElement | null>(null);

    // Estado da caixa de recorte
    const cropBox = ref({
        x: 0,
        y: 0,
        width: 100,
        height: 100
    });

    const cropBoxStyle = computed(() => ({
        left: `${cropBox.value.x}px`,
        top: `${cropBox.value.y}px`,
        width: `${cropBox.value.width}px`,
        height: `${cropBox.value.height}px`
    }));

    const containerStyle = computed(() => ({
        display: 'inline-block',
        width: props.width ? (typeof props.width === 'number' ? `${props.width}px` : props.width) : undefined,
        height: props.height ? (typeof props.height === 'number' ? `${props.height}px` : props.height) : undefined
    }));

    const imageStyleComputed = computed(() => {
        const baseStyle: Record<string, string> = {
            objectFit: props.fit
        };
        if (props.width) baseStyle.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
        if (props.height) baseStyle.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
        return [baseStyle, props.imageStyle];
    });

    const onImageClick = () => {
        if (!props.preview) return;
        openPreview();
    };

    const openPreview = () => {
        isOpen.value = true;
        zoomScale.value = 1;
        isCropping.value = false;
        scrollLock.lock();
        emit('show');
        nextTick(() => {
            modalRef.value?.focus();
        });
    };

    const closePreview = () => {
        if (!isOpen.value) return;
        isOpen.value = false;
        isCropping.value = false;
        zoomScale.value = 1;
        scrollLock.unlock();
        emit('hide');
    };

    const onBackdropClick = (event: MouseEvent) => {
        if (event.target === event.currentTarget) closePreview();
    };

    const zoomIn = () => {
        if (zoomScale.value < 4) zoomScale.value = Math.min(4, +(zoomScale.value + 0.25).toFixed(2));
    };

    const zoomOut = () => {
        if (zoomScale.value > 0.25) zoomScale.value = Math.max(0.25, +(zoomScale.value - 0.25).toFixed(2));
    };

    const startCrop = () => {
        isCropping.value = true;
        cropReady.value = false;
        zoomScale.value = 1;
    };

    const cancelCrop = () => {
        isCropping.value = false;
        cropReady.value = false;
    };

    const onCropImgLoaded = () => {
        initCropBox();
    };

    const initCropBox = () => {
        if (!cropImgRef.value) return;
        const imgWidth = cropImgRef.value.clientWidth;
        const imgHeight = cropImgRef.value.clientHeight;

        if (imgWidth === 0 || imgHeight === 0) return;

        const boxWidth = Math.max(40, Math.round(imgWidth * 0.8));
        const boxHeight = Math.max(40, Math.round(imgHeight * 0.8));
        const boxX = Math.round((imgWidth - boxWidth) / 2);
        const boxY = Math.round((imgHeight - boxHeight) / 2);

        cropBox.value = {
            x: boxX,
            y: boxY,
            width: boxWidth,
            height: boxHeight
        };
        cropReady.value = true;
    };

    // Arraste da Caixa de Recorte
    let isDraggingBox = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let boxInitialX = 0;
    let boxInitialY = 0;

    const onCropBoxPointerDown = (e: PointerEvent) => {
        if (!cropImgRef.value) return;
        isDraggingBox = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        boxInitialX = cropBox.value.x;
        boxInitialY = cropBox.value.y;

        window.addEventListener('pointermove', onCropBoxPointerMove);
        window.addEventListener('pointerup', onCropBoxPointerUp);
        window.addEventListener('pointercancel', onCropBoxPointerUp);
    };

    const onCropBoxPointerMove = (e: PointerEvent) => {
        if (!isDraggingBox || !cropImgRef.value) return;
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        const maxX = cropImgRef.value.clientWidth - cropBox.value.width;
        const maxY = cropImgRef.value.clientHeight - cropBox.value.height;

        cropBox.value.x = Math.max(0, Math.min(maxX, boxInitialX + deltaX));
        cropBox.value.y = Math.max(0, Math.min(maxY, boxInitialY + deltaY));
    };

    const onCropBoxPointerUp = () => {
        isDraggingBox = false;
        window.removeEventListener('pointermove', onCropBoxPointerMove);
        window.removeEventListener('pointerup', onCropBoxPointerUp);
        window.removeEventListener('pointercancel', onCropBoxPointerUp);
    };

    // Redimensionamento pelas alças nos 4 cantos
    type HandleType = 'tl' | 'tr' | 'bl' | 'br';
    let activeHandle: HandleType | null = null;
    let handleStartX = 0;
    let handleStartY = 0;
    let handleInitialBox = { x: 0, y: 0, width: 0, height: 0 };

    const onHandlePointerDown = (e: PointerEvent, handle: HandleType) => {
        activeHandle = handle;
        handleStartX = e.clientX;
        handleStartY = e.clientY;
        handleInitialBox = { ...cropBox.value };

        window.addEventListener('pointermove', onHandlePointerMove);
        window.addEventListener('pointerup', onHandlePointerUp);
        window.addEventListener('pointercancel', onHandlePointerUp);
    };

    const onHandlePointerMove = (e: PointerEvent) => {
        if (!activeHandle || !cropImgRef.value) return;
        const deltaX = e.clientX - handleStartX;
        const deltaY = e.clientY - handleStartY;
        const imgW = cropImgRef.value.clientWidth;
        const imgH = cropImgRef.value.clientHeight;
        const minSize = 30;

        let newX = handleInitialBox.x;
        let newY = handleInitialBox.y;
        let newW = handleInitialBox.width;
        let newH = handleInitialBox.height;

        if (activeHandle === 'tl') {
            newX = Math.min(handleInitialBox.x + handleInitialBox.width - minSize, Math.max(0, handleInitialBox.x + deltaX));
            newY = Math.min(handleInitialBox.y + handleInitialBox.height - minSize, Math.max(0, handleInitialBox.y + deltaY));
            newW = handleInitialBox.width + (handleInitialBox.x - newX);
            newH = handleInitialBox.height + (handleInitialBox.y - newY);
        } else if (activeHandle === 'tr') {
            newY = Math.min(handleInitialBox.y + handleInitialBox.height - minSize, Math.max(0, handleInitialBox.y + deltaY));
            newW = Math.max(minSize, Math.min(imgW - handleInitialBox.x, handleInitialBox.width + deltaX));
            newH = handleInitialBox.height + (handleInitialBox.y - newY);
        } else if (activeHandle === 'bl') {
            newX = Math.min(handleInitialBox.x + handleInitialBox.width - minSize, Math.max(0, handleInitialBox.x + deltaX));
            newW = handleInitialBox.width + (handleInitialBox.x - newX);
            newH = Math.max(minSize, Math.min(imgH - handleInitialBox.y, handleInitialBox.height + deltaY));
        } else if (activeHandle === 'br') {
            newW = Math.max(minSize, Math.min(imgW - handleInitialBox.x, handleInitialBox.width + deltaX));
            newH = Math.max(minSize, Math.min(imgH - handleInitialBox.y, handleInitialBox.height + deltaY));
        }

        cropBox.value = {
            x: Math.round(newX),
            y: Math.round(newY),
            width: Math.round(newW),
            height: Math.round(newH)
        };
    };

    const onHandlePointerUp = () => {
        activeHandle = null;
        window.removeEventListener('pointermove', onHandlePointerMove);
        window.removeEventListener('pointerup', onHandlePointerUp);
        window.removeEventListener('pointercancel', onHandlePointerUp);
    };

    const applyCropPayload = async (payload: MaxImageEditPayload) => {
        currentSrc.value = payload.dataUrl;
        emit('update:src', payload.dataUrl);
        emit('edit', payload);
        emit('crop', payload);

        if (props.onEdit) await props.onEdit(payload);

        isCropping.value = false;
        cropReady.value = false;
    };

    const confirmCrop = async () => {
        if (!cropImgRef.value) return;
        const img = cropImgRef.value;
        const naturalW = img.naturalWidth || img.clientWidth;
        const naturalH = img.naturalHeight || img.clientHeight;
        const clientW = img.clientWidth;
        const clientH = img.clientHeight;

        if (clientW === 0 || clientH === 0) return;

        const scaleX = naturalW / clientW;
        const scaleY = naturalH / clientH;

        const sx = cropBox.value.x * scaleX;
        const sy = cropBox.value.y * scaleY;
        const sWidth = cropBox.value.width * scaleX;
        const sHeight = cropBox.value.height * scaleY;

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(sWidth);
        canvas.height = Math.round(sHeight);
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

        const isJpeg = currentSrc.value.includes('image/jpeg') || /\.jpe?g$/i.test(currentSrc.value);
        const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
        const dataUrl = canvas.toDataURL(mimeType);

        const blob: Blob | null = await new Promise((resolve) => {
            canvas.toBlob((b) => resolve(b), mimeType);
        });

        const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';
        const file = blob ? new File([blob], `cropped.${extension}`, { type: mimeType }) : null;

        const payload: MaxImageEditPayload = {
            dataUrl,
            blob,
            file,
            width: canvas.width,
            height: canvas.height,
            mimeType
        };

        await applyCropPayload(payload);
    };

    const onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen.value) closePreview();
    };

    onMounted(() => {
        window.addEventListener('keydown', onKeydown);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('keydown', onKeydown);
        if (isOpen.value) scrollLock.unlock();
    });

    defineExpose({
        openPreview,
        closePreview,
        startCrop,
        confirmCrop,
        cancelCrop,
        applyCropPayload,
        isCropping,
        isOpen,
        zoomScale
    });
</script>

<style lang="scss">
    .max-image {
        position: relative;

        &__preview-trigger {
            display: block;
            max-width: 100%;
            height: auto;
            transition: opacity 0.2s ease;
        }

        &--pointer {
            cursor: pointer;

            &:hover {
                opacity: 0.92;
            }
        }
    }

    // Modal Lightbox em Tela Cheia
    .max-image-modal {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background-color: rgb(0 0 0 / 50%);
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
        user-select: none;

        &__viewport {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            max-width: 90vw;
            max-height: 90vh;
        }

        &__image-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            max-width: 90vw;
            max-height: calc(90vh - 65px);
            overflow: hidden;
        }

        &__img {
            max-width: 90vw;
            max-height: calc(90vh - 65px);
            object-fit: contain;
            transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: auto;
            border-radius: 4px;
            box-shadow: 0 8px 30px rgb(0 0 0 / 40%);
        }

        &__toolbar {
            margin-top: 14px;
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgb(30 41 59 / 85%);
            backdrop-filter: blur(8px);
            padding: 8px 16px;
            border-radius: 9999px;
            border: 1px solid rgb(255 255 255 / 15%);
            box-shadow: 0 4px 20px rgb(0 0 0 / 40%);
            z-index: 10;
        }
    }

    // Efeito de Zoom in ao entrar e Zoom out ao sair
    .max-image-zoom-enter-active,
    .max-image-zoom-leave-active {
        transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);

        .max-image-modal__viewport {
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
    }

    .max-image-zoom-enter-from,
    .max-image-zoom-leave-to {
        opacity: 0;

        .max-image-modal__viewport {
            transform: scale(0.7);
        }
    }

    .max-image-zoom-enter-to,
    .max-image-zoom-leave-from {
        opacity: 1;

        .max-image-modal__viewport {
            transform: scale(1);
        }
    }

    // Modo de Recorte (Cropper)
    .max-image-crop-stage {
        position: relative;
        max-width: 90vw;
        max-height: calc(90vh - 65px);
        display: inline-block;
        overflow: hidden;

        &__img {
            max-width: 90vw;
            max-height: calc(90vh - 65px);
            object-fit: contain;
            display: block;
            user-select: none;
            -webkit-user-drag: none;
        }
    }

    .max-image-crop-overlay {
        position: absolute;
        inset: 0;
        pointer-events: auto;
    }

    .max-image-crop-box {
        position: absolute;
        box-sizing: border-box;
        border: 2px solid #fff;
        box-shadow: 0 0 0 9999px rgb(0 0 0 / 60%), 0 0 8px rgb(0 0 0 / 50%);
        cursor: move;
        touch-action: none;
    }

    .max-image-crop-grid {
        position: absolute;
        inset: 0;
        pointer-events: none;

        &-line {
            position: absolute;
            background-color: rgb(255 255 255 / 35%);

            &--h1 { top: 33.333%; left: 0; right: 0; height: 1px; }
            &--h2 { top: 66.666%; left: 0; right: 0; height: 1px; }
            &--v1 { left: 33.333%; top: 0; bottom: 0; width: 1px; }
            &--v2 { left: 66.666%; top: 0; bottom: 0; width: 1px; }
        }
    }

    .max-image-crop-handle {
        position: absolute;
        width: 14px;
        height: 14px;
        background-color: #fff;
        border: 1px solid rgb(0 0 0 / 30%);
        border-radius: 2px;
        box-shadow: 0 1px 4px rgb(0 0 0 / 40%);
        touch-action: none;

        &--tl { top: -7px; left: -7px; cursor: nwse-resize; }
        &--tr { top: -7px; right: -7px; cursor: nesw-resize; }
        &--bl { bottom: -7px; left: -7px; cursor: nesw-resize; }
        &--br { bottom: -7px; right: -7px; cursor: nwse-resize; }
    }
</style>
