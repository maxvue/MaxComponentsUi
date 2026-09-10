# Histórico de Auditoria, Linha do Tempo de Atividades e Comparador de Revisões (Activity & Revision Log)

## 1. Visão Geral no Directus

No **Directus Studio (Vue 3)**, a rastreabilidade e governança de dados são tratadas como cidadãos de primeira classe através de duas coleções de sistema nativas: `directus_activity` e `directus_revisions`.

### Mecânica e Experiência no Directus:
- **Painel Lateral de Atividades (Activity Sidebar):**
  - Ao inspecionar qualquer registro no Directus Studio, o usuário pode expandir a barra lateral de informações e selecionar a aba **Activity & Revisions**.
  - Exibe uma linha do tempo vertical em tempo real consolidando todas as ações: criação, atualizações de campos, comentários internos, uploads de arquivos anexos e transições de status.
- **Deltas de Alteração em Nível de Campo (Field-Level Diffs):**
  - A cada mutação (`PATCH`), o Directus grava o delta exato dos campos modificados (`data` com valores antigos vs novos).
  - O operador clica em qualquer ponto da linha do tempo e visualiza um comparador visual de diff:
    - **Visualização Dividida (Split):** Coluna "Antes" (vermelho/âmbar) e "Depois" (verde).
    - **Destaque Semântico:** Identifica alterações em strings longas, objetos JSON aninhados, arrays de relações e booleanos.
- **Mecanismo de Rollback Instantâneo (Reverter para esta versão):**
  - Na visualização de qualquer revisão histórica, há o botão **Revert to this version**.
  - O sistema recarrega a foto histórica daquele instante no formulário ativo do Vue 3, destacando os campos que serão restaurados antes da confirmação final do operador.
- **Comentários Colaborativos Contextualizados:**
  - Usuários podem inserir comentários com formatação rica, menções (`@usuario`) e notificações diretas vinculadas a uma revisão específica daquele registro.

---

## 2. Situação Atual no Engeapp / MaxComponentsUi

No **Engeapp**, o rastreamento de alterações é tecnicamente deficitário e carece de interface dedicada para os operadores:

1. **Logs Ocultos no Backend sem Interface Amigável:**
   - O backend Laravel pode registrar eventos via pacotes como `spatie/laravel-activitylog` ou colunas `created_at` / `updated_at`, mas esses dados quase nunca chegam estruturados ao front-end.
   - Quando expostos, costumam ser tabelas genéricas com JSON bruto (`properties: {"old": ..., "attributes": ...}`), incompreensíveis para engenheiros e analistas comerciais.
2. **Ausência de Componentes de Linha do Tempo e Comparação no MaxComponentsUi:**
   - O design system não possui componentes de `MaxTimeline`, `MaxActivityItem`, `MaxFieldDiff` ou `MaxAuditLogDrawer`.
   - Não há suporte na biblioteca para destacar visualmente o que mudou entre duas versões de uma mesma entidade.
3. **Impossibilidade de Reversão Rápida (Rollback):**
   - Se um estagiário ou integrador parceiro altera acidentalmente a potência do inversor, a tensão de fornecimento ou o disjuntor de um projeto já aprovado, não existe meio no frontend de auditar ou desfazer a modificação. É necessário recorrer a backups do banco de dados ou ao suporte de infraestrutura.

---

## 3. Valor Agregado para o Engeapp

O processo de homologação de projetos solares junto às concessionárias (ex: CEMIG, CPFL, Enel, Neoenergia) é altamente rigoroso e sujeito a exigências técnicas formais (Resoluções Normativas da ANEEL 1.000/2021 e 1.059/2023). 

### Casos de Uso Críticos no Engeapp:
- **Investigação Imediata de Reprovações na Concessionária:**
  - Se a concessionária reprova um projeto de 150 kW alegando que a ART ou o disjuntor informado divergiu da análise de carga anterior, o coordenador de engenharia abre a linha do tempo do projeto e descobre exatamente quem realizou a última alteração no campo `disjuntor_geral_amperes`, em que data/hora e qual era o valor aprovado anteriormente.
- **Auditoria de Conflitos entre Integrador Solar e Engenharia:**
  - Integradores comerciais frequentemente atualizam dados do cliente final (endereço, titular da fatura, login da agência virtual). O histórico de auditoria previne disputas de responsabilidade sobre dados alterados incorretamente.
- **Restauração Segura em 1 Clique:**
  - Caso um campo crítico tenha sido corrompido ou sobrescrito por engano antes do envio de uma réplica de parecer de acesso, o engenheiro pode reverter os campos afetados em segundos.
- **Comunicação Interna Vinculada ao Projeto:**
  - Anotações como *"Aguardando cliente enviar nova fatura com código do imóvel legível"* ficam registradas na linha do tempo do projeto, acessíveis por toda a equipe.

---

## 4. Especificação Técnica Proposta

### 4.1 Modelo de Dados e Contrato da API

```typescript
// Estrutura de eventos de auditoria e revisões
export interface ActivityLogItem {
    id: string;
    action: 'create' | 'update' | 'delete' | 'comment' | 'rollback';
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    created_at: string; // ISO 8601
    comment?: string;
    diff?: Record<string, {
        field_label: string;
        old_value: any;
        new_value: any;
    }>;
    version_number: number;
}
```

### 4.2 Store Pinia: `useActivityLogStore`

```typescript
// src/stores/useActivityLog.Store.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import type { ActivityLogItem } from '../types';

export const useActivityLogStore = defineStore('activityLog', () => {
    const activities = ref<ActivityLogItem[]>([]);
    const loading = ref(false);
    const selectedRevision = ref<ActivityLogItem | null>(null);

    const fetchActivities = async (entityType: string, entityId: string | number) => {
        loading.value = true;
        try {
            const response = await axios.get(`/api/v1/audit/${entityType}/${entityId}/activities`);
            activities.value = response.data.data;
        } finally {
            loading.value = false;
        }
    };

    const addComment = async (entityType: string, entityId: string | number, comment: string) => {
        const response = await axios.post(`/api/v1/audit/${entityType}/${entityId}/comments`, {
            comment
        });
        activities.value.unshift(response.data.data);
    };

    const rollbackToRevision = async (entityType: string, entityId: string | number, revisionId: string) => {
        loading.value = true;
        try {
            const response = await axios.post(`/api/v1/audit/${entityType}/${entityId}/revisions/${revisionId}/rollback`);
            activities.value.unshift(response.data.data);
            return response.data.updated_entity;
        } finally {
            loading.value = false;
        }
    };

    return {
        activities,
        loading,
        selectedRevision,
        fetchActivities,
        addComment,
        rollbackToRevision
    };
});
```

---

## 5. Componentes de UI Sugeridos para o MaxComponentsUi

### 5.1 `MaxActivityTimeline.vue`

Componente reusável de linha do tempo com renderização de avatares, tags de ação, badges e deltas de campos alterados.

```html
<template>
    <div class="max-activity-timeline">
        <div class="timeline-header">
            <h3 class="timeline-title">Histórico de Alterações</h3>
            <span class="timeline-count">{{ activities.length }} eventos</span>
        </div>

        <div v-if="loading" class="timeline-loading">
            <MaxLoaderIcon i="loading" size="2" />
            <span>Carregando histórico...</span>
        </div>

        <div v-else-if="activities.length === 0" class="timeline-empty">
            <MaxIcon i="iconoir:clock-rotate-right" size="2.5" />
            <p>Nenhuma atividade registrada até o momento.</p>
        </div>

        <ul v-else class="timeline-list">
            <li
                v-for="item in activities"
                :key="item.id"
                class="timeline-item"
                :class="`action-${item.action}`"
            >
                <div class="item-line" />
                <div class="item-node">
                    <MaxIcon :i="getActionIcon(item.action)" size="1" />
                </div>

                <div class="item-content">
                    <header class="content-header">
                        <div class="user-meta">
                            <span class="user-name">{{ item.user.name }}</span>
                            <span class="action-label">{{ getActionLabel(item.action) }}</span>
                        </div>
                        <time class="event-time" :title="item.created_at">{{ formatRelativeTime(item.created_at) }}</time>
                    </header>

                    <!-- Comentário de texto -->
                    <div v-if="item.comment" class="comment-box">
                        <p class="comment-text">{{ item.comment }}</p>
                    </div>

                    <!-- Visualizador de deltas de campos alterados -->
                    <div v-if="item.diff && Object.keys(item.diff).length > 0" class="diff-container">
                        <div
                            v-for="(diffData, fieldName) in item.diff"
                            :key="fieldName"
                            class="diff-field-row"
                        >
                            <span class="field-title">{{ diffData.field_label || fieldName }}:</span>
                            <div class="field-values">
                                <span class="old-value">{{ formatVal(diffData.old_value) }}</span>
                                <MaxIcon i="iconoir:arrow-right" size="0.9" class="diff-arrow" />
                                <span class="new-value">{{ formatVal(diffData.new_value) }}</span>
                            </div>
                        </div>
                    </div>

                    <footer v-if="item.action === 'update' && item.diff" class="content-footer">
                        <button
                            type="button"
                            class="rollback-button"
                            @click="emit('rollback', item)"
                        >
                            <MaxIcon i="iconoir:undo" size="0.9" />
                            Reverter para esta versão
                        </button>
                    </footer>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
    import type { ActivityLogItem } from '../types';
    import MaxIcon from './MaxIcon.vue';
    import MaxLoaderIcon from './MaxLoaderIcon.vue';

    const props = defineProps<{
        activities: ActivityLogItem[];
        loading?: boolean;
    }>();

    const emit = defineEmits<{
        (e: 'rollback', item: ActivityLogItem): void;
    }>();

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'create': return 'iconoir:plus-circle';
            case 'update': return 'iconoir:edit-pencil';
            case 'delete': return 'iconoir:trash';
            case 'comment': return 'iconoir:chat-bubble';
            case 'rollback': return 'iconoir:undo';
            default: return 'iconoir:activity';
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'create': return 'criou o registro';
            case 'update': return 'atualizou campos';
            case 'delete': return 'removeu dados';
            case 'comment': return 'adicionou um comentário';
            case 'rollback': return 'reverteu para versão anterior';
            default: return 'realizou uma alteração';
        }
    };

    const formatVal = (val: any) => {
        if (val === null || val === undefined) return '(vazio)';
        if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    };

    const formatRelativeTime = (isoString: string) => {
        // Formatação simples ou integração com Day.js
        const date = new Date(isoString);
        return date.toLocaleString('pt-BR');
    };
</script>

<style lang="scss" scoped>
.max-activity-timeline {
    display: flex;
    flex-direction: column;
    width: 100%;

    .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--background-200);
        margin-bottom: 1rem;

        .timeline-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--background-800);
            margin: 0;
        }

        .timeline-count {
            font-size: 0.8125rem;
            color: var(--background-500);
        }
    }

    .timeline-loading,
    .timeline-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
        color: var(--background-500);
        gap: 0.75rem;
    }

    .timeline-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;

        .timeline-item {
            position: relative;
            display: flex;
            gap: 1rem;

            .item-line {
                position: absolute;
                top: 2rem;
                bottom: -1.75rem;
                left: 1rem;
                width: 2px;
                background-color: var(--background-200);
            }

            &:last-child .item-line {
                display: none;
            }

            .item-node {
                width: 2rem;
                height: 2rem;
                border-radius: 50%;
                background-color: var(--background-100);
                border: 2px solid var(--background-300);
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--background-700);
                z-index: 1;
                flex-shrink: 0;
            }

            &.action-update .item-node {
                border-color: var(--primary-500);
                color: var(--primary-600);
                background-color: var(--background-0);
            }

            &.action-rollback .item-node {
                border-color: var(--red-600);
                color: var(--red-600);
            }

            .item-content {
                flex: 1;
                background-color: var(--background-50);
                border: 1px solid var(--background-200);
                border-radius: 0.75rem;
                padding: 0.875rem 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.625rem;

                .content-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    .user-meta {
                        display: flex;
                        align-items: center;
                        gap: 0.35rem;
                        font-size: 0.875rem;

                        .user-name {
                            font-weight: 600;
                            color: var(--background-800);
                        }

                        .action-label {
                            color: var(--background-500);
                        }
                    }

                    .event-time {
                        font-size: 0.75rem;
                        color: var(--background-400);
                    }
                }

                .comment-box {
                    background-color: var(--background-0);
                    padding: 0.625rem 0.875rem;
                    border-radius: 0.5rem;
                    border-left: 3px solid var(--primary-500);

                    .comment-text {
                        margin: 0;
                        font-size: 0.875rem;
                        color: var(--background-700);
                        line-height: 1.4;
                    }
                }

                .diff-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                    background-color: var(--background-0);
                    border-radius: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid var(--background-200);

                    .diff-field-row {
                        display: flex;
                        align-items: baseline;
                        font-size: 0.8125rem;
                        gap: 0.5rem;

                        .field-title {
                            font-weight: 500;
                            color: var(--background-600);
                            min-width: 7rem;
                        }

                        .field-values {
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            flex-wrap: wrap;

                            .old-value {
                                color: var(--red-600);
                                text-decoration: line-through;
                                background-color: rgba(239, 68, 68, 0.1);
                                padding: 0.1rem 0.35rem;
                                border-radius: 0.25rem;
                            }

                            .diff-arrow {
                                color: var(--background-400);
                            }

                            .new-value {
                                color: var(--green-600);
                                font-weight: 600;
                                background-color: rgba(34, 197, 94, 0.1);
                                padding: 0.1rem 0.35rem;
                                border-radius: 0.25rem;
                            }
                        }
                    }
                }

                .content-footer {
                    display: flex;
                    justify-content: flex-end;
                    padding-top: 0.25rem;

                    .rollback-button {
                        background: none;
                        border: 1px solid var(--background-300);
                        color: var(--background-700);
                        font-size: 0.75rem;
                        font-weight: 500;
                        padding: 0.35rem 0.65rem;
                        border-radius: 0.375rem;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.35rem;
                        transition: background-color 0.2s, border-color 0.2s;

                        &:hover {
                            background-color: var(--background-200);
                            border-color: var(--background-400);
                            color: var(--background-900);
                        }
                    }
                }
            }
        }
    }
}
</style>
```

### 5.2 `MaxAuditDrawer.vue` (Integração na Visualização de Projetos)

Gaveta lateral aberta via atalho de teclado ou botão na barra superior do projeto ("Histórico / Auditoria"), permitindo alternar entre abas de "Todas as Atividades", "Revisões de Dados" e "Comentários da Equipe".
