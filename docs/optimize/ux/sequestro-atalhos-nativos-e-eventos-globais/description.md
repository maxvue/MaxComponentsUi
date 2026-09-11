# Achado UX-01: Sequestro Agressivo de Comportamentos Nativos e Atalhos Globais sem Escopo ou Opt-out

## Severidade: Crítica

### Componentes Impactados
- [`MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopMenuSearchBar.vue)
- [`MaxInputPhone.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputPhone.vue)
- [`MaxInputFile.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFile.vue)

---

## 1. Sintoma Observado vs Causa Raiz Profunda

### Sintomas Observados
1. **Bloqueio Total da Pesquisa Nativa do Navegador (`Ctrl+F` / `Cmd+F`)**: Em qualquer tela ou módulo da aplicação em que o cabeçalho superior (`MaxTopMenuSearchBar`) esteja montado (ex.: listagem de clientes, tabelas de faturamento, relatórios de projetos), o atalho padrão universal do navegador `Ctrl+F` (Windows/Linux) ou `Cmd+F` (macOS) tem seu comportamento nativo sumariamente cancelado via `event.preventDefault()`. Em vez de abrir o mecanismo de busca in-page do navegador para localizar termos na tela atual, o foco é forçado para o campo de pesquisa do menu superior ou abre uma gaveta mobile. O usuário perde a capacidade de pesquisar conteúdo na página atual.
2. **Incompatibilidade com macOS e Mouse em Inputs de Telefone**: O componente `MaxInputPhone` utiliza a biblioteca `@maxvue/max-use` com `useMagicKeys()` escutando as teclas literais `ctrl` e `v`. Usuários no macOS que utilizam o atalho nativo do sistema operacional (`Cmd+V` / `metaKey`) ou usuários que utilizam o menu de contexto do mouse (Botão direito -> Colar) não ativam o estado `noMask`, resultando em números colados com perda de dígitos ou corrupção do formato.
3. **Sequestro Global de Eventos de Colagem (`paste`) por Componentes de Upload**: O componente `MaxInputFile` escuta o evento `'paste'` no objeto global `window` (`useEventListener(window, 'paste', handlePaste)`). Se um usuário estiver editando outro campo de texto em um formulário extenso (ou até mesmo dentro de um modal com um editor de texto) e colar uma imagem ou captura de tela que esteja na área de transferência, o `MaxInputFile` intercepta o evento, cancela o comportamento do campo focado (`event.preventDefault()`) e anexa o arquivo a si próprio. Caso existam dois ou mais componentes `MaxInputFile` na mesma página (ex.: "Documento Frente" e "Documento Verso"), ambos anexam o arquivo simultaneamente.

### Causa Raiz Profunda
A causa raiz é a **violação do princípio de isolamento e contenção de eventos no DOM** e o **desrespeito às convenções de atalhos e ergonomia do navegador (Web UX)**:
- **Violação de Convenções Globais**: Na Web moderna, a barra de pesquisa global de um aplicativo/dashboard corporativo adota convencionalmente `Ctrl+K` / `Cmd+K` ou a tecla `/` (padrão consolidado no GitHub, Slack, Linear, Google Docs, Notion, Tailwind, etc.). O atalho `Ctrl+F` / `Cmd+F` é uma função intrínseca do user-agent para acessibilidade e inspeção de texto. Tomar posse de `Ctrl+F` sem consentimento explícito do usuário e sem parametrização por prop é considerado uma grave falha de usabilidade (W3C User Agent Accessibility Guidelines).
- **Abuso de Listeners Globais em `window`/`document`**: Em vez de manipular eventos no próprio ciclo do elemento focalizado (`@paste` nativo no container ou input), os componentes instanciam ouvintes em `window` que capturam eventos emitidos em qualquer parte da aplicação, sem validação de `event.target`, active element ou contexto do usuário.

---

## 2. Evidência Técnica

### Evidência 1: Sequestro explícito de `Ctrl+F` e duplicidade de listeners em `MaxTopMenuSearchBar.vue`
Localização: [`MaxTopMenuSearchBar.vue#L108-L129`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopMenuSearchBar.vue#L108-L129)

```ts
    const keys = useMagicKeys();
    const isCtrlF = keys['Control+F'];
    const isEscape = keys['Escape'];

    whenever(isCtrlF, () => {
        if (isMobile.value) openSearch();
        else input_search_ref.value?.setFocus?.();
    });

    whenever(isEscape, () => {
        if (is_open.value) closeSearch();
    });

    /** Impede o Ctrl+F nativo do navegador enquanto a barra existe. */
    const handleSearchKeydown = (event: KeyboardEvent): void => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') event.preventDefault();
        if (event.key === 'Escape' && is_open.value) closeSearch();
    };

    onMounted(() => document.addEventListener('keydown', handleSearchKeydown));
    onUnmounted(() => document.removeEventListener('keydown', handleSearchKeydown));
```

Note que o comentário técnico admite expressamente a intenção: `/** Impede o Ctrl+F nativo do navegador enquanto a barra existe. */`. Não existe nenhuma prop (`shortcut?: boolean | string`) que permita desligar ou alterar este comportamento.

### Evidência 2: Escuta de teclado dependente de plataforma em `MaxInputPhone.vue`
Localização: [`MaxInputPhone.vue#L116-L118`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputPhone.vue#L116-L118)

```ts
    const { ctrl, v } = useMagicKeys();
    watch(() => [ctrl.value, v.value], () => noMask.value = ctrl.value && v.value && onFocus.value);
```

No macOS, a tecla padrão de colagem é `Command` (`metaKey`), e não `Control`. Assim, `ctrl.value` é sempre falso ao teclar `Cmd+V`, quebrando o desbloqueio temporário de máscara para todos os usuários de Mac. Além disso, a colagem via ponteiro do mouse (menu de contexto do sistema operacional) nunca dispara `ctrl` + `v`.

### Evidência 3: Escuta global incondicional de colagem em `MaxInputFile.vue`
Localização: [`MaxInputFile.vue#L187-L215`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFile.vue#L187-L215)

```ts
    const handlePaste = (event: ClipboardEvent) => {
        if (!event.clipboardData) return;
        const filesFound: File[] = [];
        const items = event.clipboardData.items;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                // ...
            }
        }
        // ...
        if (filesFound.length > 0) {
            event.preventDefault();
            addFiles(filesFound);
        }
    };

    useEventListener(window, 'paste', handlePaste);
```

Ao registrar `useEventListener(window, 'paste', handlePaste)`, qualquer operação de colagem em qualquer elemento da página dispara este manipulador. Se o usuário estiver preenchendo um campo de texto em outra aba ou modal e colar acidentalmente ou intencionalmente um arquivo da área de transferência (como um anexo em um chat ou editor de texto rico), o `MaxInputFile` rouba o evento e previne a propagação padrão com `event.preventDefault()`.

---

## 3. Impacto na Experiência do Usuário Final e no Produto

1. **Frustração Operacional Imediata (Pesquisa Quebrada)**: Usuários de sistemas corporativos e analistas financeiros/operacionais usam intensamente o `Ctrl+F` do navegador para auditar tabelas de centenas de linhas e termos técnicos em páginas densas. A impossibilidade de usar a busca nativa gera a percepção de um sistema "travado" ou hostil ao usuário.
2. **Exclusão de Usuários macOS e Perda de Produtividade em Inputs**: Falhas de compatibilidade cross-platform causam retrabalho constante e frustração desnecessária para operadores que utilizam o ecossistema Apple.
3. **Efeitos Colaterais Críticos em Formulários Compostos**: Colar dados em uma tela com uploads resulta em arquivos indesejados sendo anexados silenciosamente, podendo levar ao envio de documentos confidenciais ou incorretos em cadastros de projetos de homologação fotovoltaica.

---

## 4. Recomendações de Solução Arquitetural de UX
1. **Migrar Atalho da Barra de Busca para `Ctrl+K` / `Cmd+K`**:
   - Alterar o atalho default para `mod+k` (onde `mod` cobre `Ctrl` no Windows/Linux e `Cmd` no macOS).
   - Tornar o atalho configurável ou desativável via prop (`:shortcut="false"` ou `:shortcut="'mod+k'"`).
   - Adicionar uma badge visual discreta de affordance no próprio campo de busca (ex.: `[ Ctrl K ]` ou `[ ⌘ K ]`), comunicando a existência do atalho antes que o usuário precise adivinhar.
2. **Substituir `useMagicKeys` em `MaxInputPhone` pelo Evento Nativo `@paste`**:
   - Adicionar um listener `@paste="onPaste"` diretamente na tag `<input>`, tratando os dados via `event.clipboardData.getData('text')` de forma agnóstica a SO e dispositivo de entrada.
3. **Restringir o Escopo de Colagem em `MaxInputFile`**:
   - Vincular a escuta de `paste` ao container do componente com verificação de foco ativo (`tabindex="0"`) ou escopo do elemento, jamais ao objeto global `window`.
