import { Ref } from 'vue';
type ResetRef<T> = Ref<T> & {
    reset(): void;
    initialData: T;
};
export declare function useDefaultReset<T>(initialData: T): ResetRef<T>;
export {};
//# sourceMappingURL=useDefaultReset.d.ts.map