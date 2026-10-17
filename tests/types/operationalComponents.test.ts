import { expectTypeOf, it } from 'vitest';
import type { MaxCopyButtonProps, MaxKanbanBoardProps, MaxSocialPostPreviewProps, MaxPreviewFile } from '../../src';

it('expõe tipos públicos dos componentes operacionais', () => {
    expectTypeOf<MaxCopyButtonProps['text']>().toEqualTypeOf<string>();
    expectTypeOf<MaxKanbanBoardProps['columns']>().toMatchTypeOf<readonly unknown[]>();
    expectTypeOf<MaxSocialPostPreviewProps['media']>().toMatchTypeOf<readonly unknown[]>();
    expectTypeOf<MaxPreviewFile['id']>().toEqualTypeOf<string>();
});
