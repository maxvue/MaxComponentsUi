type __VLS_PublicProps = {
    modelValue?: any;
};
declare const _default: import('vue').DefineComponent<__VLS_PublicProps, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (value: any) => any;
}, string, import('vue').PublicProps, Readonly<__VLS_PublicProps> & Readonly<{
    "onUpdate:modelValue"?: ((value: any) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    element: {
        $props: import('primevue/datepicker').DatePickerProps & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
        $slots: import('primevue/datepicker').DatePickerSlots;
        $emit: ((e: "input", event: Event) => void) & ((e: "show") => void) & ((e: "hide") => void) & ((e: "update:modelValue", value: Date | Date[] | (Date | null)[] | null | undefined) => void) & ((e: "value-change", value: Date | Date[] | (Date | null)[] | null | undefined) => void) & ((e: "blur", event: import('primevue/datepicker').DatePickerBlurEvent) => void) & ((e: "focus", event: Event) => void) & ((e: "date-select", value: Date) => void) & ((e: "today-click", date: Date) => void) & ((e: "clear-click", event: Event) => void) & ((e: "month-change", event: import('primevue/datepicker').DatePickerMonthChangeEvent) => void) & ((e: "year-change", event: import('primevue/datepicker').DatePickerYearChangeEvent) => void) & ((e: "keydown", event: Event) => void);
    } | null;
}, any>;
export default _default;
//# sourceMappingURL=MaxInputDatePicker.vue.d.ts.map