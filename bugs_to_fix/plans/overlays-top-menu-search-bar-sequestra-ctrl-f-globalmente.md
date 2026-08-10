# MaxTopMenuSearchBar sequestra Ctrl+F globalmente, inclusive quando o campo está invisível ou o foco está em outro input

- **Categoria:** acessibilidade
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTopMenuSearchBar.vue:38-49`
- **Domínio:** overlays-navegacao

## Problema

```
const keys = useMagicKeys();
const isCtrlF = keys['Control+F'];

whenever(isCtrlF, () => input_search_ref.value?.setFocus?.());

/** Impede o Ctrl+F nativo do navegador enquanto a barra existe. */
const handleSearchKeydown = (event: KeyboardEvent): void => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') event.preventDefault();
};

onMounted(() => document.addEventListener('keydown', handleSearchKeydown));
onUnmounted(() => document.removeEventListener('keydown', handleSearchKeydown));
```

O listener é registrado no `document` e **não tem nenhuma condição**: enquanto o componente existir, qualquer Ctrl+F (ou Cmd+F no macOS) em qualquer lugar da página é bloqueado e redireciona o foco para a barra de busca do topo.

Problemas:

1. **Remove uma função essencial do navegador sem alternativa.** A busca nativa da página (Ctrl+F / Cmd+F) é a única maneira de muitos usuários — especialmente com baixa visão ou dificuldades cognitivas — localizarem conteúdo em uma tela longa. A busca do topo filtra dados do backend, não faz busca textual na página: não é um substituto.
2. **Sequestra o atalho mesmo em contextos inapropriados.** Se o usuário estiver digitando em um `<textarea>` de observações, ou com um `MaxModal` aberto por cima, o Ctrl+F ainda tira o foco do que ele está fazendo e o joga na barra do topo — perdendo o cursor.
3. **`preventDefault` incondicional em `metaKey`.** No macOS, Cmd+F é a busca da página, mas o handler também intercepta combinações onde `metaKey` está pressionado por outros motivos.
4. **Detecção inconsistente.** O `useMagicKeys` observa `'Control+F'` (linha 39) enquanto o `preventDefault` observa `ctrlKey || metaKey` (linha 45). No macOS, Cmd+F é bloqueado pelo segundo mas **não** foca o campo pelo primeiro — o atalho simplesmente deixa de funcionar, sem substituto.
5. **`whenever(isCtrlF, ...)` sem escopo de componente.** `whenever` registra um watcher; se ele não for automaticamente descartado no unmount pelo escopo de efeito do componente (comportamento padrão do VueUse/`@maxvue/max-use` quando chamado no `setup`), o handler sobrevive à desmontagem. Confirmar o comportamento do helper em `@maxvue/max-use`.

O teste existente (`tests/components/MaxTopMenu.test.ts:263-296`) cobre apenas placeholder, digitação e slot — nada do comportamento de atalho. O componente tem 44,4% de cobertura de branches, consistente com os ramos de `handleSearchKeydown` nunca exercitados.

## Impacto

Perda de uma funcionalidade universal do navegador em toda a aplicação, sem opção de desativar. Foco roubado durante digitação. No macOS, o atalho fica quebrado nos dois sentidos.

## Plano de correção

1. Adicionar uma prop `captureSearchShortcut?: boolean` (default a definir com o time — recomendo `false`, tornando o sequestro opt-in).
2. Restringir o `preventDefault` (linha 45) ao caso em que ele realmente vai focar o campo, unificando a detecção com a do `useMagicKeys`:
   ```
   const handleSearchKeydown = (event: KeyboardEvent): void => {
       if (! props.captureSearchShortcut) return;
       if (! (event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'f') return;
       event.preventDefault();
       input_search_ref.value?.setFocus?.();
   };
   ```
   e remover o `useMagicKeys`/`whenever` (linhas 38-41), que hoje duplica a detecção com uma condição diferente.
3. Não interceptar quando o foco estiver em um campo editável que não seja a própria barra: `if (document.activeElement instanceof HTMLTextAreaElement) return;` e equivalente para `<input>` de outro componente e `[contenteditable]`.
4. Documentar o atalho de forma visível (ex.: um `title`/placeholder "Pesquisar (Ctrl+F)") para que o comportamento não seja surpreendente quando habilitado.
5. Confirmar que o `whenever` é descartado no unmount; se não for, envolvê-lo em `effectScope` ou removê-lo conforme o passo 2.

## Verificação

- Teste em `tests/components/MaxTopMenu.test.ts` (bloco `MaxTopMenuSearchBar`): com `captureSearchShortcut: false` (default), disparar `keydown` com `ctrlKey: true, key: 'f'` e afirmar que `preventDefault` **não** foi chamado.
- Teste com a prop ligada: afirmar que `preventDefault` foi chamado e que `setFocus` do input foi invocado.
- Teste de contexto: com um `<textarea>` focado, afirmar que o atalho não é interceptado.
- Teste de vazamento: montar, desmontar e disparar o atalho; afirmar que `setFocus` não é chamado.
- `npx vitest run tests/components/MaxTopMenu.test.ts` e conferir a subida das branches de 44,4%.
