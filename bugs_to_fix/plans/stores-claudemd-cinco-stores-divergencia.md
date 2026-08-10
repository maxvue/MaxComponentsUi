# CLAUDE.md documenta "cinco stores" mas o barrel exporta doze

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `CLAUDE.md` (seção "Stores (Pinia)"), `src/stores/index.ts:1-12`
- **Domínio:** stores-barrel

## Problema

O `CLAUDE.md` afirma textualmente: *"Cinco stores exportadas pelo barrel `src/stores/index.ts`"*, listando apenas `useIconStore`, `usePopoverStore`, `useToastStore`, `useConfirmStore` e `useModalStore`.

O barrel real (`src/stores/index.ts`) tem 12 linhas de `export *`, exportando **doze** stores:

```
useIcon.Store, useLoading.Store, useUser.Store, useSystem.Store, useLogin.Store,
useSearchBar.Store, useListMenus.Store, useTopToolbar.Store, usePopover.Store,
useToast.Store, useConfirm.Store, useModal.Store
```

Verificado: os doze arquivos existem em `src/stores/` e todos estão no barrel. **Não há divergência de export** — o barrel está correto e completo. A divergência é **exclusivamente de documentação**: sete stores do app shell (`useLoadingStore`, `useUserStore`, `useSystemStore`, `useLoginStore`, `useSearchBarStore`, `useListMenusStore`, `useTopToolbarStore`) não estão documentadas.

## Impacto

Baixo em runtime, relevante em manutenção. Um agente ou desenvolvedor que use o `CLAUDE.md` como fonte de verdade concluirá que as stores do app shell (`MaxApp`, `MaxSideMenu`, `MaxTopMenu`, login) não fazem parte da API pública da biblioteca, e pode:
- Alterá-las sem tratá-las como contrato público (elas *são* exportadas do pacote via `src/index.ts:63` → `export * from './stores'`).
- Não escrever testes para elas (o que já ocorreu — ver achados de `falta-de-teste`).
- Duplicar funcionalidade já existente.

## Plano de correção

1. Atualizar a seção "Stores (Pinia)" do `CLAUDE.md` para listar as doze stores, agrupadas por finalidade:
   - **UI/Overlays:** `useIconStore`, `usePopoverStore`, `useToastStore`, `useConfirmStore`, `useModalStore`
   - **App shell:** `useSystemStore`, `useUserStore`, `useLoadingStore`, `useLoginStore`, `useListMenusStore`, `useTopToolbarStore`, `useSearchBarStore`
2. Registrar explicitamente que as stores do app shell dependem de `configureMaxApp()` (rotas) e, no caso de `useUserStore`/`useListMenusStore`, do plugin `@maxvue/max-pinia` para efetivamente carregar dados.
3. Documentar que `useSystemStore` e `useTopToolbarStore` chamam `useRoute()`/`useRouter()` e portanto só podem ser instanciadas dentro de um contexto com `vue-router` instalado.

## Verificação

- Conferir que a contagem no `CLAUDE.md` bate com `wc -l src/stores/index.ts` (12) e com `ls src/stores/*.Store.ts | wc -l` (12).
- `npm run test` deve continuar verde (mudança apenas documental).
