# Gerenciador Avançado de Arquivos e Ativos Técnicos (File Asset Library)

## 1. Visão Geral no Directus

A **Biblioteca de Arquivos do Directus (Directus File Library - `directus_files`)** é amplamente reconhecida como uma das implementações de gerenciamento de ativos mais ergonômicas em aplicações Vue 3 empresariais:

### Características Centrais do Directus Studio:
- **Hierarquia de Pastas Virtuais e Navegação Fluida:**
  - Suporte a pastas aninhadas ilimitadas com permissões de acesso por grupo/perfil.
  - Navegação instantânea via árvore lateral expansível e breadcrumbs de navegação.
  - Operações de arrastar e soltar (*drag-and-drop*) para mover arquivos entre diretórios.
- **Visualização Dupla (Grid de Cards vs. Tabela Detalhada):**
  - **Modo Grid:** Exibe miniaturas em alta definição geradas dinamicamente pelo backend com recorte inteligente, badges de extensão (`PDF`, `DWG`, `PNG`, `DOCX`) e tamanho legível.
  - **Modo Tabela:** Apresenta colunas ordenáveis de metadados técnicos (nome original, tipo MIME, dimensões em pixels, peso em KB/MB, data de upload e usuário proprietário).
- **Inspeção de Metadados e Pré-visualizador Integrado:**
  - Drawer lateral que abre instantaneamente ao selecionar um ativo, contendo um visualizador embutido para PDFs, imagens vetoriais SVG e fotos com zoom.
  - Permite edição inline de título amigável, tags para busca rápida e metadados customizados.
- **Ações em Lote (Batch Operations):**
  - Seleção múltipla rápida (via clique com `Shift` ou caixa de seleção) permitindo: download compactado em `.zip` sob demanda gerado em segundo plano, movimentação em massa entre pastas, exclusão e aplicação de tags coletivas.
- **Seletor de Arquivos Integrado aos Formulários (File Picker Drawer):**
  - Qualquer campo de anexo em um formulário pode abrir a Biblioteca de Arquivos como uma gaveta lateral (*drawer*), permitindo reaproveitar arquivos já existentes no sistema ou arrastar novos sem sair da tela.

---

## 2. Situação Atual no Engeapp / MaxComponentsUi

No **Engeapp**, o gerenciamento de arquivos técnicos e documentos de clientes é fragmentado e terceirizado:

1. **Dependência de Ferramenta Externa Desalinhada (`VueFinder`):**
   - O Engeapp adota o componente de terceiros `VueFinder` integrado ao `Spatie MediaLibrary`.
   - O `VueFinder` possui identidade visual própria, não consome os tokens de estilo do MaxComponentsUi (`MaxStyle`), ignora o UnoCSS presetMaxUno e não se integra de forma transparente às stores do Pinia ou ao ciclo de vida dos componentes Max.
2. **Uploaders Isolados e Desconectados:**
   - Componentes como `MaxInputFileProject.vue` e `MaxInputFileUploadBig.vue` funcionam apenas como áreas de soltura locais (dropzones) focadas na extração de dados via IA (Gemini).
   - Eles não conversam com uma biblioteca centralizada de arquivos corporativos.
3. **Ausência de Repositório Central de Equipamentos e Modelos:**
   - Cada vez que um engenheiro elabora a homologação de um projeto com um inversor *Growatt 50kW*, ele precisa baixar o PDF do datasheet da internet ou procurá-lo no seu computador pessoal e fazer o upload novamente para aquele projeto.
   - Isso gera centenas de arquivos idênticos duplicados no storage (S3/local), desperdício de banda e impossibilidade de atualizar uma ficha técnica desatualizada em escala.
4. **Falta de Pré-visualização Ágil de Documentos Técnicos:**
   - Engenheiros precisam rotineiramente conferir memoriais descritivos, procurações e diagramas unifilares antes de enviá-los às concessionárias de energia. Hoje, o sistema frequentemente exige o download local do arquivo para que o usuário possa abri-lo no Adobe Reader.

---

## 3. Valor Agregado para o Engeapp

A rotina de uma empresa de engenharia e homologação solar envolve milhares de documentos técnicos regulatórios:
- **Datasheets e Manuais de Fabricantes:** Inversores (WEG, Deye, Growatt, Fronius, Sungrow), Módulos Fotovoltaicos (Canadian, Jinko, JA Solar, Trina), Estruturas de Fixação.
- **Certificados e Homologações INMETRO:** Portarias e laudos laboratoriais obrigatórios para concessão de parecer de acesso.
- **Documentos Padronizados de Concessionárias:** Formulários específicos de solicitação de acesso para cada distribuidora (CEMIG ND-5.30, CPFL GED-13, Enel CNC-OMBR, etc.), procurações com firma reconhecida e cartas de anuência.

### Benefícios Diretos:
- **Montagem de Kits de Homologação 4x Mais Rápida:** Ao invés de buscar e subir 10 arquivos manualmente por projeto, o engenheiro simplesmente clica em "Selecionar da Biblioteca" e marca os datasheets oficiais já homologados pela equipe técnica.
- **Redução Massiva de Custos de Armazenamento:** A reutilização de registros de arquivos por ID vinculados a múltiplos projetos elimina a duplicação desnecessária de PDFs pesados.
- **Garantia de Qualidade e Conformidade:** O gestor de engenharia pode atualizar o datasheet oficial de um modelo de módulo em uma pasta central ("Equipamentos > Módulos > Canadian"), garantindo que todos os novos projetos usem a versão mais recente e válida no INMETRO.

---

## 4. Especificação Técnica Proposta

### 4.1 Tipagem de Dados

```typescript
export interface FileFolderItem {
    id: string;
    parent_id: string | null;
    name: string;
    icon?: string;
    color?: string;
    files_count: number;
}

export interface FileAssetItem {
    id: string;
    folder_id: string | null;
    title: string;
    filename_download: string;
    filesize: number; // bytes
    type: string; // MIME type: application/pdf, image/png, etc.
    url: string;
    thumbnail_url?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}
```

### 4.2 Store Pinia: `useFileManagerStore`

```typescript
// src/stores/useFileManager.Store.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import type { FileFolderItem, FileAssetItem } from '../types';

export const useFileManagerStore = defineStore('fileManager', () => {
    const currentFolderId = ref<string | null>(null);
    const folders = ref<FileFolderItem[]>([]);
    const files = ref<FileAssetItem[]>([]);
    const selectedFileIds = ref<string[]>([]);
    const viewMode = ref<'grid' | 'table'>('grid');
    const searchQuery = ref('');
    const loading = ref(false);
    const activePreviewFile = ref<FileAssetItem | null>(null);

    const filteredFiles = computed(() => {
        if (!searchQuery.value.trim()) return files.value;
        const q = searchQuery.value.toLowerCase();
        return files.value.filter(f => 
            f.title.toLowerCase().includes(q) || 
            f.filename_download.toLowerCase().includes(q) ||
            f.tags?.some(t => t.toLowerCase().includes(q))
        );
    });

    const loadFolder = async (folderId: string | null = null) => {
        loading.value = true;
        currentFolderId.value = folderId;
        selectedFileIds.value = [];
        try {
            const [foldersRes, filesRes] = await Promise.all([
                axios.get('/api/v1/files/folders', { params: { parent_id: folderId } }),
                axios.get('/api/v1/files', { params: { folder_id: folderId } })
            ]);
            folders.value = foldersRes.data.data;
            files.value = filesRes.data.data;
        } finally {
            loading.value = false;
        }
    };

    const toggleSelect = (id: string) => {
        const idx = selectedFileIds.value.indexOf(id);
        if (idx > -1) {
            selectedFileIds.value.splice(idx, 1);
        } else {
            selectedFileIds.value.push(id);
        }
    };

    const downloadZip = async (ids: string[]) => {
        const res = await axios.post('/api/v1/files/download-zip', { ids }, { responseType: 'blob' });
        const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `arquivos_engeapp_${Date.now()}.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return {
        currentFolderId,
        folders,
        files,
        filteredFiles,
        selectedFileIds,
        viewMode,
        searchQuery,
        loading,
        activePreviewFile,
        loadFolder,
        toggleSelect,
        downloadZip
    };
});
```

---

## 5. Componentes de UI Sugeridos para o MaxComponentsUi

### 5.1 `MaxFileManager.vue`

Componente unificado de exploração de arquivos com barra de ferramentas, árvore de diretórios e área de conteúdo.

```html
<template>
    <div class="max-file-manager">
        <!-- Barra de Ferramentas Superior -->
        <header class="manager-toolbar">
            <div class="toolbar-left">
                <button type="button" class="btn-new-folder" @click="handleCreateFolder">
                    <MaxIcon i="iconoir:folder-plus" size="1.1" />
                    Nova Pasta
                </button>
                <button type="button" class="btn-upload" @click="triggerUpload">
                    <MaxIcon i="iconoir:upload" size="1.1" />
                    Fazer Upload
                </button>
            </div>

            <div class="toolbar-search">
                <input
                    v-model="fileStore.searchQuery"
                    type="text"
                    placeholder="Buscar arquivos ou tags..."
                    class="search-input"
                />
            </div>

            <div class="toolbar-actions">
                <div v-if="fileStore.selectedFileIds.length > 0" class="batch-actions">
                    <span class="batch-count">{{ fileStore.selectedFileIds.length }} selecionado(s)</span>
                    <button type="button" class="batch-btn" @click="fileStore.downloadZip(fileStore.selectedFileIds)">
                        <MaxIcon i="iconoir:download" size="1.1" />
                        Baixar .ZIP
                    </button>
                </div>

                <div class="view-mode-toggle">
                    <button
                        type="button"
                        class="toggle-btn"
                        :class="{ active: fileStore.viewMode === 'grid' }"
                        @click="fileStore.viewMode = 'grid'"
                    >
                        <MaxIcon i="iconoir:view-grid" size="1.1" />
                    </button>
                    <button
                        type="button"
                        class="toggle-btn"
                        :class="{ active: fileStore.viewMode === 'table' }"
                        @click="fileStore.viewMode = 'table'"
                    >
                        <MaxIcon i="iconoir:view-list" size="1.1" />
                    </button>
                </div>
            </div>
        </header>

        <!-- Corpo Principal: Pastas e Arquivos -->
        <div class="manager-layout">
            <!-- Navegador de Pastas Lateral -->
            <aside class="folders-sidebar">
                <h4 class="sidebar-title">Pastas</h4>
                <ul class="folder-list">
                    <li
                        class="folder-item"
                        :class="{ active: fileStore.currentFolderId === null }"
                        @click="fileStore.loadFolder(null)"
                    >
                        <MaxIcon i="iconoir:folder" size="1.1" />
                        <span class="folder-name">Todos os Arquivos</span>
                    </li>
                    <li
                        v-for="folder in fileStore.folders"
                        :key="folder.id"
                        class="folder-item"
                        :class="{ active: fileStore.currentFolderId === folder.id }"
                        @click="fileStore.loadFolder(folder.id)"
                    >
                        <MaxIcon :i="folder.icon || 'iconoir:folder'" size="1.1" />
                        <span class="folder-name">{{ folder.name }}</span>
                        <span class="folder-count">{{ folder.files_count }}</span>
                    </li>
                </ul>
            </aside>

            <!-- Área Central de Conteúdo -->
            <main class="content-area">
                <!-- Modo Grid -->
                <div v-if="fileStore.viewMode === 'grid'" class="files-grid">
                    <div
                        v-for="file in fileStore.filteredFiles"
                        :key="file.id"
                        class="file-card"
                        :class="{ selected: fileStore.selectedFileIds.includes(file.id) }"
                        @click="fileStore.toggleSelect(file.id)"
                        @dblclick="fileStore.activePreviewFile = file"
                    >
                        <div class="card-thumbnail">
                            <img
                                v-if="isImage(file.type) && file.thumbnail_url"
                                :src="file.thumbnail_url"
                                :alt="file.title"
                                class="thumbnail-img"
                            />
                            <MaxIcon v-else :i="getFileMimeIcon(file.type)" size="3" class="mime-icon" />
                            <span class="extension-tag">{{ getExtension(file.filename_download) }}</span>
                        </div>
                        <div class="card-info">
                            <span class="file-title" :title="file.title">{{ file.title }}</span>
                            <span class="file-size">{{ formatSize(file.filesize) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Modo Tabela -->
                <div v-else class="files-table-wrapper">
                    <table class="files-table">
                        <thead>
                            <tr>
                                <th class="th-check">#</th>
                                <th>Nome do Arquivo</th>
                                <th>Formato</th>
                                <th>Tamanho</th>
                                <th>Data de Envio</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="file in fileStore.filteredFiles"
                                :key="file.id"
                                :class="{ selected: fileStore.selectedFileIds.includes(file.id) }"
                                @click="fileStore.toggleSelect(file.id)"
                                @dblclick="fileStore.activePreviewFile = file"
                            >
                                <td class="td-check">
                                    <input
                                        type="checkbox"
                                        :checked="fileStore.selectedFileIds.includes(file.id)"
                                        @click.stop="fileStore.toggleSelect(file.id)"
                                    />
                                </td>
                                <td class="td-name">
                                    <div class="file-cell">
                                        <MaxIcon :i="getFileMimeIcon(file.type)" size="1.2" />
                                        <span>{{ file.title }}</span>
                                    </div>
                                </td>
                                <td>{{ file.type }}</td>
                                <td>{{ formatSize(file.filesize) }}</td>
                                <td>{{ new Date(file.created_at).toLocaleDateString('pt-BR') }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </main>
        </div>

        <!-- Visualizador Lateral de Prévia (Drawer) -->
        <MaxDrawer
            v-if="fileStore.activePreviewFile"
            :visible="true"
            position="right"
            :header="fileStore.activePreviewFile.title"
            @update:visible="(val: boolean) => { if (!val) fileStore.activePreviewFile = null; }"
        >
            <div class="preview-content">
                <div v-if="isImage(fileStore.activePreviewFile.type)" class="image-preview">
                    <img :src="fileStore.activePreviewFile.url" :alt="fileStore.activePreviewFile.title" />
                </div>
                <div v-else-if="fileStore.activePreviewFile.type === 'application/pdf'" class="pdf-preview">
                    <iframe :src="fileStore.activePreviewFile.url" class="pdf-iframe" />
                </div>
                <div class="meta-section">
                    <h4>Informações Técnicas</h4>
                    <p><strong>Nome Original:</strong> {{ fileStore.activePreviewFile.filename_download }}</p>
                    <p><strong>Tamanho:</strong> {{ formatSize(fileStore.activePreviewFile.filesize) }}</p>
                    <p><strong>Formato:</strong> {{ fileStore.activePreviewFile.type }}</p>
                    <a :href="fileStore.activePreviewFile.url" download class="btn-download">
                        <MaxIcon i="iconoir:download" size="1.1" />
                        Baixar Arquivo
                    </a>
                </div>
            </div>
        </MaxDrawer>
    </div>
</template>

<script setup lang="ts">
    import { onMounted } from 'vue';
    import { useFileManagerStore } from '../stores/useFileManager.Store';
    import MaxIcon from './MaxIcon.vue';
    import MaxDrawer from './MaxDrawer.vue';

    const fileStore = useFileManagerStore();

    onMounted(() => {
        fileStore.loadFolder(null);
    });

    const isImage = (mime: string) => mime.startsWith('image/');

    const getFileMimeIcon = (mime: string) => {
        if (mime === 'application/pdf') return 'iconoir:doc-star';
        if (mime.startsWith('image/')) return 'iconoir:media-image';
        if (mime.includes('spreadsheet') || mime.includes('csv')) return 'iconoir:table';
        return 'iconoir:page';
    };

    const getExtension = (filename: string) => {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop()?.toUpperCase() : 'ARQ';
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const handleCreateFolder = () => {
        const name = window.prompt('Nome da nova pasta:');
        if (name) {
            // Chamada de criação de pasta
        }
    };

    const triggerUpload = () => {
        // Dispara seletor de arquivos nativo do navegador
    };
</script>

<style lang="scss" scoped>
.max-file-manager {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background-color: var(--background-0);
    border: 1px solid var(--background-200);
    border-radius: 0.75rem;
    overflow: hidden;

    .manager-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem 1.25rem;
        background-color: var(--background-50);
        border-bottom: 1px solid var(--background-200);
        gap: 1rem;

        .toolbar-left {
            display: flex;
            align-items: center;
            gap: 0.5rem;

            .btn-new-folder,
            .btn-upload {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                padding: 0.5rem 0.875rem;
                border-radius: 0.5rem;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                border: 1px solid var(--background-300);
                background-color: var(--background-0);
                color: var(--background-800);
                transition: all 0.2s ease;

                &:hover {
                    background-color: var(--background-100);
                }
            }

            .btn-upload {
                background-color: var(--primary-600);
                border-color: var(--primary-600);
                color: #ffffff;

                &:hover {
                    background-color: var(--primary-700);
                }
            }
        }

        .toolbar-search {
            flex: 1;
            max-width: 24rem;

            .search-input {
                width: 100%;
                padding: 0.5rem 0.875rem;
                border-radius: 0.5rem;
                border: 1px solid var(--background-300);
                background-color: var(--background-0);
                color: var(--background-800);
                font-size: 0.875rem;

                &:focus {
                    outline: none;
                    border-color: var(--primary-500);
                }
            }
        }

        .toolbar-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .batch-actions {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                .batch-count {
                    font-size: 0.8125rem;
                    color: var(--background-600);
                }

                .batch-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.4rem 0.65rem;
                    border-radius: 0.375rem;
                    border: 1px solid var(--background-300);
                    background-color: var(--background-0);
                    color: var(--background-700);
                    font-size: 0.75rem;
                    cursor: pointer;
                }
            }

            .view-mode-toggle {
                display: flex;
                border: 1px solid var(--background-300);
                border-radius: 0.375rem;
                overflow: hidden;

                .toggle-btn {
                    padding: 0.4rem 0.6rem;
                    background-color: var(--background-0);
                    border: none;
                    color: var(--background-500);
                    cursor: pointer;

                    &.active {
                        background-color: var(--background-200);
                        color: var(--background-900);
                    }
                }
            }
        }
    }

    .manager-layout {
        display: flex;
        flex: 1;
        overflow: hidden;

        .folders-sidebar {
            width: 16rem;
            border-right: 1px solid var(--background-200);
            background-color: var(--background-50);
            padding: 1rem;
            overflow-y: auto;

            .sidebar-title {
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--background-400);
                margin: 0 0 0.75rem 0.5rem;
            }

            .folder-list {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;

                .folder-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 0.875rem;
                    color: var(--background-700);
                    transition: background-color 0.15s;

                    &:hover {
                        background-color: var(--background-150);
                    }

                    &.active {
                        background-color: var(--primary-100);
                        color: var(--primary-800);
                        font-weight: 500;
                    }

                    .folder-name {
                        flex: 1;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .folder-count {
                        font-size: 0.75rem;
                        color: var(--background-400);
                    }
                }
            }
        }

        .content-area {
            flex: 1;
            padding: 1.25rem;
            overflow-y: auto;

            .files-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
                gap: 1rem;

                .file-card {
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--background-200);
                    border-radius: 0.625rem;
                    overflow: hidden;
                    background-color: var(--background-0);
                    cursor: pointer;
                    transition: border-color 0.2s, box-shadow 0.2s;

                    &:hover {
                        border-color: var(--background-400);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
                    }

                    &.selected {
                        border-color: var(--primary-500);
                        box-shadow: 0 0 0 2px var(--primary-500);
                    }

                    .card-thumbnail {
                        height: 7.5rem;
                        background-color: var(--background-100);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        overflow: hidden;

                        .thumbnail-img {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }

                        .mime-icon {
                            color: var(--background-400);
                        }

                        .extension-tag {
                            position: absolute;
                            bottom: 0.35rem;
                            right: 0.35rem;
                            background-color: rgba(0, 0, 0, 0.65);
                            color: #ffffff;
                            font-size: 0.625rem;
                            font-weight: 700;
                            padding: 0.15rem 0.35rem;
                            border-radius: 0.25rem;
                        }
                    }

                    .card-info {
                        padding: 0.625rem 0.75rem;
                        display: flex;
                        flex-direction: column;
                        gap: 0.25rem;

                        .file-title {
                            font-size: 0.8125rem;
                            font-weight: 500;
                            color: var(--background-800);
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }

                        .file-size {
                            font-size: 0.75rem;
                            color: var(--background-400);
                        }
                    }
                }
            }

            .files-table-wrapper {
                width: 100%;
                overflow-x: auto;

                .files-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;

                    th {
                        text-align: left;
                        padding: 0.75rem 1rem;
                        border-bottom: 2px solid var(--background-200);
                        color: var(--background-500);
                        font-weight: 600;
                    }

                    td {
                        padding: 0.75rem 1rem;
                        border-bottom: 1px solid var(--background-150);
                        color: var(--background-700);

                        .file-cell {
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            font-weight: 500;
                            color: var(--background-800);
                        }
                    }

                    tr:hover td {
                        background-color: var(--background-50);
                    }

                    tr.selected td {
                        background-color: var(--primary-50);
                    }
                }
            }
        }
    }

    .preview-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;

        .image-preview img {
            max-width: 100%;
            border-radius: 0.5rem;
        }

        .pdf-iframe {
            width: 100%;
            height: 30rem;
            border: 1px solid var(--background-300);
            border-radius: 0.5rem;
        }

        .meta-section {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;

            .btn-download {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                margin-top: 1rem;
                padding: 0.65rem 1rem;
                background-color: var(--primary-600);
                color: #ffffff;
                text-decoration: none;
                border-radius: 0.5rem;
                font-weight: 500;
                width: fit-content;
            }
        }
    }
}
</style>
```

### 5.2 `MaxInputFilePicker.vue` (Integração nos Formulários)

Substitui os inputs de arquivo estáticos atuais por um controle flexível com duas opções:
1. Botão "Escolher da Biblioteca de Equipamentos" (abre `MaxFileManager` em um Drawer).
2. Área de arrastar e soltar arquivos locais com upload direto e geração imediata de thumbnail.
