# Plano de implementação — overlays seguros em SSR

## Objetivo e resultado esperado

Permitir renderização server-side aberta e fechada de Drawer, Modal, PDF e confirmação sem acessar DOM global, mantendo listeners, trap de foco e scroll lock corretos após mount/hidratação.

## Escopo e fora de escopo

- Escopo: fronteira browser-only compartilhada, idempotência e suíte SSR/hidratação.
- Fora: redesenhar overlays, alterar stores ou resolver toda acessibilidade de dialogs.

## Arquivos-alvo

- Criar `src/composables/useBrowserEventListener.ts` e teste unitário.
- Alterar `src/helpers/useFocusTrap.ts`.
- Alterar `src/components/MaxDrawer.vue`, `MaxModal.vue`, `MaxPdfView.vue` e `MaxPopoverConfirm.vue`.
- Criar `tests/ssr/overlays.ssr.test.ts` e `tests/ssr/overlays.hydration.test.ts`.
- `package.json`/`package-lock.json`: declarar `@vue/server-renderer` em dev se não estiver disponível diretamente, após o plano do lockfile.

## Dependências e ordem

1. Criar teste Node que falha hoje para os quatro componentes fechados/abertos.
2. Tornar helpers DOM-safe e idempotentes.
3. Migrar listeners dos componentes.
4. Adicionar hidratação cliente e regressões de foco/scroll.
5. Coordenar com planos de cleanup, posicionamento e dialogs.

## Passos detalhados

1. A primitiva de evento deve observar estado reativo, anexar somente após `onMounted`, remover no fechamento/unmount e ser no-op sem `window`/`document`.
2. Em `useFocusTrap`, proteger `document`, `HTMLElement` e callbacks `nextTick`; ativação SSR não captura foco nem agenda acesso tardio.
3. Substituir `document.add/removeEventListener` diretos pelo helper nos quatro componentes, preservando Escape e evitando duplicação.
4. Manter `useScrollLock` com guard existente e garantir simetria do contador somente no cliente.
5. Separar emits/estado puro dos efeitos DOM: watcher imediato pode calcular estado no servidor, mas listeners/foco/lock aguardam mount.
6. Na hidratação de overlay inicialmente aberto, ativar uma vez listener, trap e lock; fechado não ativa nada.

## Migração e compatibilidade

- Props, emits, Teleport, foco devolvido e bloqueio de scroll permanecem.
- HTML SSR deve ser hidratável sem divergência; efeitos de DOM começam apenas no cliente.
- Nenhum acesso browser deve ocorrer no escopo de módulo/setup durante SSR.

## Testes pertinentes

- `renderToString` em ambiente Node para cada componente aberto/fechado, com Pinia/stubs mínimos reais.
- Espionar globals com getters que lançam para provar ausência de acesso.
- Hidratar HTML aberto/fechado e contar listener, trap e lock; alternar e desmontar.
- Manter testes de Escape, restauração de foco e scroll concorrente.
- A11y: confirmar nome/role atuais e foco inicial após hidratação; benchmark não se aplica.

## Critérios de aceite

- Oito cenários SSR (4 × aberto/fechado) concluem sem `ReferenceError` e sem acesso aos getters DOM.
- Hidratação emite zero mismatch warning.
- Aberto registra um listener; fechado/unmounted registra zero.
- Trap e scroll lock funcionam uma vez no cliente e nunca no servidor.
- Testes focados, type-check, suíte e build passam.

## Riscos, rollback e validação final

- Riscos: overlay inicialmente aberto não ativar no cliente, emissão duplicada e contador de lock assimétrico. Mitigar com testes de hidratação e idempotência.
- Rollback: manter guards locais mesmo se o helper compartilhado for revertido; nunca restaurar acesso DOM sem proteção.
- Validar render Node, hidratação, Escape, foco, scroll lock, cleanup, type-check e build.
