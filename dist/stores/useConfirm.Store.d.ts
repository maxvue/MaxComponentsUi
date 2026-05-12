import { Ref } from 'vue';
export declare const useConfirmStore: import('pinia').StoreDefinition<"confirm.popover", Pick<{
    message: Ref<string, string>;
    messageIcon: Ref<string | null, string | null>;
    rejectProps: Ref<{
        label: string;
        icon?: string;
        action: (event?: any) => void;
    }, {
        label: string;
        icon?: string;
        action: (event?: any) => void;
    }>;
    acceptProps: Ref<{
        label: string;
        icon?: string;
        action: (event?: any) => void;
    }, {
        label: string;
        icon?: string;
        action: (event?: any) => void;
    }>;
    show: Ref<boolean, boolean>;
    x: Ref<number, number>;
    y: Ref<number, number>;
    width: Ref<number, number>;
    height: Ref<number, number>;
    count_loadeds: Ref<number, number>;
    hide: () => void;
}, "x" | "y" | "width" | "height" | "message" | "messageIcon" | "rejectProps" | "acceptProps" | "show" | "count_loadeds">, Pick<{
    message: Ref<string, string>;
    messageIcon: Ref<string | null, string | null>;
    rejectProps: Ref<{
        label: string;
        icon?: string;
        action: (event?: any) => void;
    }, {
        label: string;
        icon?: string;
        action: (event?: any) => void;
    }>;
    acceptProps: Ref<{
        label: string;
        icon?: string;
        action: (event?: any) => void;
    }, {
        label: string;
        icon?: string;
        action: (event?: any) => void;
    }>;
    show: Ref<boolean, boolean>;
    x: Ref<number, number>;
    y: Ref<number, number>;
    width: Ref<number, number>;
    height: Ref<number, number>;
    count_loadeds: Ref<number, number>;
    hide: () => void;
}, never>, Pick<{
    message: Ref<string, string>;
    messageIcon: Ref<string | null, string | null>;
    rejectProps: Ref<{
        label: string;
        icon?: string;
        action: (event?: any) => void;
    }, {
        label: string;
        icon?: string;
        action: (event?: any) => void;
    }>;
    acceptProps: Ref<{
        label: string;
        icon?: string;
        action: (event?: any) => void;
    }, {
        label: string;
        icon?: string;
        action: (event?: any) => void;
    }>;
    show: Ref<boolean, boolean>;
    x: Ref<number, number>;
    y: Ref<number, number>;
    width: Ref<number, number>;
    height: Ref<number, number>;
    count_loadeds: Ref<number, number>;
    hide: () => void;
}, "hide">>;
//# sourceMappingURL=useConfirm.Store.d.ts.map