import { describe, it, expect, expectTypeOf } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { MaxButtonsType } from '../../src/types';

const SOURCE = readFileSync(resolve(__dirname, '../../src/types/index.ts'), 'utf8');

describe('types — MaxButtonsType', () => {
    it('não importa tipos do PrimeVue', () => {
        expect(SOURCE).not.toMatch(/from 'primevue/);
    });

    it('preserva as props herdadas que os consumidores usam', () => {
        expectTypeOf<MaxButtonsType>().toHaveProperty('outlined');
        expectTypeOf<MaxButtonsType>().toHaveProperty('text');
        expectTypeOf<MaxButtonsType>().toHaveProperty('rounded');
        expectTypeOf<MaxButtonsType>().toHaveProperty('raised');
        expectTypeOf<MaxButtonsType>().toHaveProperty('link');
        expectTypeOf<MaxButtonsType>().toHaveProperty('plain');
        expectTypeOf<MaxButtonsType>().toHaveProperty('fluid');
        expectTypeOf<MaxButtonsType>().toHaveProperty('disabled');
        expectTypeOf<MaxButtonsType>().toHaveProperty('badge');
        expectTypeOf<MaxButtonsType>().toHaveProperty('badgeClass');
        expectTypeOf<MaxButtonsType>().toHaveProperty('badgeSeverity');
        expectTypeOf<MaxButtonsType>().toHaveProperty('loadingIcon');
        expectTypeOf<MaxButtonsType>().toHaveProperty('iconClass');
        expectTypeOf<MaxButtonsType>().toHaveProperty('as');
        expectTypeOf<MaxButtonsType>().toHaveProperty('asChild');
    });

    it('preserva as props próprias e seus tipos estreitados', () => {
        expectTypeOf<MaxButtonsType['variant']>().toEqualTypeOf<'outlined' | 'text' | 'link' | undefined>();
        expectTypeOf<MaxButtonsType['iconPos']>().toEqualTypeOf<'left' | 'right' | undefined>();
        expectTypeOf<MaxButtonsType['dashed']>().toEqualTypeOf<boolean | undefined>();
    });

    it('aceita um objeto de props realista', () => {
        const props: MaxButtonsType = {
            label: 'Salvar',
            icon: 'check',
            severity: 'success',
            variant: 'outlined',
            outlined: true,
            loading: false,
            disabled: false,
            size: '2'
        };
        expect(props.label).toBe('Salvar');
    });
});
