import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useModalStore = defineStore('modal', () => {
    const stack = ref<string[]>([]);

    // Retrocompatibilidade total: show_id reflete o ID do topo da pilha
    const show_id = computed<string | null>({
        get: () => stack.value[stack.value.length - 1] ?? null,
        set: (newId: string | null) => {
            if (newId === null) stack.value = [];
            else if (!stack.value.includes(newId)) stack.value = [...stack.value, newId];

        }
    });

    const top = computed<string | null>(() => stack.value[stack.value.length - 1] ?? null);

    const isOpen = (id: string) => stack.value.includes(id);
    const contains = isOpen;

    const isTop = (id: string) => stack.value.length > 0 && stack.value[stack.value.length - 1] === id;

    const getIndex = (id: string) => stack.value.indexOf(id);

    const push = (id: string) => {
        if (!stack.value.includes(id)) stack.value = [...stack.value, id];
    };

    const remove = (id: string) => {
        stack.value = stack.value.filter((item) => item !== id);
    };

    const pop = (id?: string) => {
        if (id) remove(id);
        else stack.value = stack.value.slice(0, -1);
    };

    const show = (id: string) => {
        push(id);
    };

    const hide = (id?: string) => {
        if (id) pop(id);
        else stack.value = [];
    };

    const toggle = (id: string) => {
        if (isOpen(id)) pop(id);
        else push(id);
    };

    return {
        stack,
        show_id,
        top,
        contains,
        isOpen,
        isTop,
        getIndex,
        push,
        remove,
        pop,
        show,
        hide,
        toggle
    };
});