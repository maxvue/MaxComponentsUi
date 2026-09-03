import { describe, it, expectTypeOf } from 'vitest';
import type {
    MaxDividersProps,
    AuthProvider,
    AuthOtpEndpoint,
    AuthMode,
    AuthStep,
    AuthLabels,
    MaxImageProps,
    MaxImageEditPayload,
    BottomTab,
    MenuGroup
} from '../../src/index';
import type {
    MaxDividersProps as TypesMaxDividersProps,
    AuthProvider as TypesAuthProvider,
    MaxImageProps as TypesMaxImageProps,
    BottomTab as TypesBottomTab,
    MenuGroup as TypesMenuGroup
} from '../../src/types';

describe('TypeScript Type Exports — src/index and src/types', () => {
    it('exporta corretamente MaxDividersProps a partir do ponto de entrada', () => {
        expectTypeOf<MaxDividersProps>().toEqualTypeOf<TypesMaxDividersProps>();
        expectTypeOf<MaxDividersProps>().toHaveProperty('direction');
        expectTypeOf<MaxDividersProps>().toHaveProperty('inLine');
        expectTypeOf<MaxDividersProps>().toHaveProperty('inColumn');
        expectTypeOf<MaxDividersProps>().toHaveProperty('resizable');
    });

    it('exporta corretamente tipos de autenticação a partir do ponto de entrada', () => {
        expectTypeOf<AuthProvider>().toEqualTypeOf<TypesAuthProvider>();
        expectTypeOf<AuthMode>().toEqualTypeOf<'password' | 'phone-otp'>();
        expectTypeOf<AuthStep>().toEqualTypeOf<'phone' | 'code'>();
        expectTypeOf<AuthLabels>().toHaveProperty('email');
        expectTypeOf<AuthOtpEndpoint>().toHaveProperty('label');
    });

    it('exporta corretamente tipos de imagem a partir do ponto de entrada', () => {
        expectTypeOf<MaxImageProps>().toEqualTypeOf<TypesMaxImageProps>();
        expectTypeOf<MaxImageProps>().toHaveProperty('src');
        expectTypeOf<MaxImageProps>().toHaveProperty('allowEdit');
        expectTypeOf<MaxImageEditPayload>().toHaveProperty('dataUrl');
        expectTypeOf<MaxImageEditPayload>().toHaveProperty('blob');
    });

    it('exporta corretamente tipos de layout e navegação', () => {
        expectTypeOf<BottomTab>().toEqualTypeOf<TypesBottomTab>();
        expectTypeOf<BottomTab>().toHaveProperty('id');
        expectTypeOf<MenuGroup>().toEqualTypeOf<TypesMenuGroup>();
        expectTypeOf<MenuGroup>().toHaveProperty('items');
    });
});
