# Plano de Implementação — Issue #64

> **Issue:** #64 — [Audit] MaxPdfView: useFocusTrap isolado em .viewPDF prende navegacao por teclado e impede acesso aos controles de zoom e fechar  
> **Componente:** `src/components/MaxPdfView.vue`  
> **Status:** Planejado (`planned: true`)

---

### Descrição e Causa Raiz

#### Problema Detalhado
O componente [MaxPdfView.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-64/src/components/MaxPdfView.vue) opera como um modal em tela cheia com overlay escuro para visualização de documentos PDF, oferecendo controles de zoom (*Zoom in*, *Zoom out*) e fechamento (*Close*).

Para conformidade com as diretrizes de acessibilidade (WAI-ARIA Modal Dialog), o componente utiliza o helper `useFocusTrap(el)` para confinar a navegação via teclado dentro do diálogo enquanto este estiver aberto (`is_open = true`).

Contudo, a estrutura atual do template apresenta uma desconexão entre o container do diálogo e a barra de ferramentas de controle:
1. O elemento referenciado por `el` (`ref="el"`), decorado com `role="dialog"`, `aria-modal="true"`, `aria-label="Visualizador de PDF"` e `@keydown="trap.onKeydown"`, é exclusivamente a `<div class="viewPDF">`.
2. A barra de botões com as ações de zoom e fechar (`.pdf-div-bar-tools`) está renderizada **fora** de `<div class="viewPDF">`, posicionada como elemento irmão adjacente no template.

#### Agravantes
1. **Confinamento Indevido (Keyboard Trap Isolado):** Ao abrir o visualizador (`is_open = true`), `trap.activate()` consulta os elementos focáveis unicamente dentro de `el.value` (`.viewPDF`). Como o renderizador do PDF (`VuePdfEmbed`) e o loading não contêm elementos interativos focáveis nativos (botões, links ou inputs), a lista de elementos focáveis de `el` é vazia.
2. **Bloqueio Completo da Navegação por Teclado:** Se o foco do teclado for posicionado em `.viewPDF`, o listener `@keydown="trap.onKeydown"` intercepta qualquer pressionamento da tecla `Tab`. Como os botões estão situados fora de `el`, o foco nunca é transferido para a barra `.pdf-div-bar-tools`. Usuários que dependem exclusivamente de teclado ficam incapacitados de utilizar o zoom ou acionar o botão de fechar.
3. **Quebra Semântica de Acessibilidade (WAI-ARIA Dialog):** Semanticamente, os controles de ação do diálogo pertencem à superfície da caixa de diálogo modal (`role="dialog"`). Renderizá-los fora do landmark do diálogo rompe a árvore de acessibilidade para tecnologias assistivas (leitores de tela).
4. **Ausência de Rótulos Acessíveis e Tabindex nos Botões:** Os botões `<MaxButton>` da barra não possuem atributos `aria-label` explícitos (`aria-label="Diminuir zoom"`, `aria-label="Aumentar zoom"`, `aria-label="Fechar visualizador de PDF"`) nem `tabindex="0"`, dificultando a leitura por leitores de tela e impedindo a correta seleção pelo `useFocusTrap`.
5. **Inconsistência Visual na Animação de Fechamento (Fade-out):** O estilo inline `:style="{ opacity: opacity }"` está associado apenas a `.viewPDF`. Ao disparar `closePDF()`, o fundo escuro realiza o fade-out durante 500ms, enquanto a barra `.pdf-div-bar-tools` permanece com opacidade total até o unmount abrupto de `is_open = false`.

---

#### Causa Raiz Comprovada
- **Arquivo e Linhas:** [src/components/MaxPdfView.vue:L3-L41](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-64/src/components/MaxPdfView.vue#L3-L41)
- **Trecho com Defeito:**
```html
<template>
    <div v-if="is_open">
        <div
            class="viewPDF"
            ref="el"
            role="dialog"
            aria-modal="true"
            aria-label="Visualizador de PDF"
            :style="{opacity: opacity}"
            @keydown="trap.onKeydown"
        >
            <div class="space" aria-hidden="true" @click="closePDF" />
            <div class="meio">
                <Transition>
                    <div class="loading" v-if="isLoading" @click="closePDF">
                        <div class="conjunto">
                            <div class="texto">Loading</div>
                            <div class="circle">
                                <div class="max-spinner" role="status" aria-label="Custom ProgressSpinner"></div>
                            </div>
                            <div class="percent">{{ percent }}%</div>
                        </div>
                    </div>
                </Transition>

                <div class="pdfDiv">
                    <VuePdfEmbed :annotation-layer="false" :textLayer="false" :source="props.file" :width="size.width" :height="size.height" @rendered="rendered" @loaded="loaded" @progress="progressPdf">
                        <template #before-page="slotProps">
                            <div class="header-page">Página {{ slotProps.page }} de {{ total }}</div>
                        </template>
                    </VuePdfEmbed>
                </div>
            </div>
            <div class="space" aria-hidden="true" @click="closePDF" />
        </div>
        <div class="pdf-div-bar-tools">
            <MaxButton icon="iconamoon:zoom-out-light" flex text @click="Zoom('out')" />
            <MaxButton icon="lucide:zoom-in" flex text @click="Zoom('in')" />
            <MaxButton icon="ic:round-close" flex text @click="closePDF" />
        </div>
    </div>
</template>
```

- **Fluxo Causal:**
  1. `props.file` é fornecido ➔ `watch(is_open)` ativa `trap.activate()`.
  2. `useFocusTrap(el)` busca nós focáveis via `el.value.querySelectorAll(FOCUSABLE)`.
  3. `el` referencia exclusivamente `.viewPDF`. A barra `.pdf-div-bar-tools` (e seus botões) está fora de `el`.
  4. Pressionamentos da tecla `Tab` acionam `trap.onKeydown` em `.viewPDF`, que restringe a navegação aos elementos internos de `el`.
  5. Os botões de zoom e fechar tornam-se inacessíveis para navegação por teclado.

- **Rastreamento Reverso de Dados (UI ⇄ Store ⇄ API/Rotas ⇄ Controller/Service ⇄ DB):**
  - **UI (Apresentação / Acessibilidade):** `<div class="viewPDF" ref="el" role="dialog" @keydown="trap.onKeydown">` e `<div class="pdf-div-bar-tools">` em [MaxPdfView.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-64/src/components/MaxPdfView.vue#L1-L42).
  - **Estado Reativo e Helpers:** `is_open`, `trap = useFocusTrap(el)` e `scroll_lock = useScrollLock()` em `MaxPdfView.vue`.
  - **Consumidores / Telas da Aplicação:** Telas e modais do sistema que exibem relatórios, contratos, projetos fotovoltaicos e comprovantes de homologação via `MaxPdfView`.
  - **API / Storage / DB:** Endpoints do backend Laravel que fornecem URLs ou fluxos binários de arquivos PDF (armazenados em Seafile / S3 / storage local), repassados ao componente através da prop `file`.

---

### Arquivos Afetados

| Arquivo | Descrição da Modificação |
|---|---|
| [src/components/MaxPdfView.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-64/src/components/MaxPdfView.vue) | Mover `.pdf-div-bar-tools` para dentro de `.viewPDF` (integrando a barra ao escopo de `ref="el"` e `role="dialog"`) e adicionar `aria-label` e `tabindex="0"` aos botões. |
| [tests/components/MaxPdfView.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-64/tests/components/MaxPdfView.test.ts) | Adicionar testes unitários para validar que a barra de ferramentas está contida no diálogo, que os botões possuem `aria-label` e `tabindex="0"`, e que o focus trap alcança os controles de zoom e fechar. |

---

### Execuções Propostas

#### Passo 1 — Reestruturação do Template no SFC (`src/components/MaxPdfView.vue`)
Mover o bloco `<div class="pdf-div-bar-tools">` para o interior de `<div class="viewPDF">`, mantendo-o dentro do elemento que detém `ref="el"`, `role="dialog"`, `aria-modal="true"`, `aria-label="Visualizador de PDF"`, `:style="{opacity: opacity}"` e `@keydown="trap.onKeydown"`:

```html
<template>
    <div v-if="is_open">
        <div
            class="viewPDF"
            ref="el"
            role="dialog"
            aria-modal="true"
            aria-label="Visualizador de PDF"
            :style="{opacity: opacity}"
            @keydown="trap.onKeydown"
        >
            <div class="space" aria-hidden="true" @click="closePDF" />
            <div class="meio">
                <Transition>
                    <div class="loading" v-if="isLoading" @click="closePDF">
                        <div class="conjunto">
                            <div class="texto">Loading</div>
                            <div class="circle">
                                <div class="max-spinner" role="status" aria-label="Custom ProgressSpinner"></div>
                            </div>
                            <div class="percent">{{ percent }}%</div>
                        </div>
                    </div>
                </Transition>

                <div class="pdfDiv">
                    <VuePdfEmbed :annotation-layer="false" :textLayer="false" :source="props.file" :width="size.width" :height="size.height" @rendered="rendered" @loaded="loaded" @progress="progressPdf">
                        <template #before-page="slotProps">
                            <div class="header-page">Página {{ slotProps.page }} de {{ total }}</div>
                        </template>
                    </VuePdfEmbed>
                </div>
            </div>
            <div class="space" aria-hidden="true" @click="closePDF" />

            <div class="pdf-div-bar-tools">
                <MaxButton icon="iconamoon:zoom-out-light" aria-label="Diminuir zoom" tabindex="0" flex text @click="Zoom('out')" />
                <MaxButton icon="lucide:zoom-in" aria-label="Aumentar zoom" tabindex="0" flex text @click="Zoom('in')" />
                <MaxButton icon="ic:round-close" aria-label="Fechar visualizador de PDF" tabindex="0" flex text @click="closePDF" />
            </div>
        </div>
    </div>
</template>
```

> **Nota sobre CSS:** A classe `.pdf-div-bar-tools` possui `position: fixed; top: 30px; left: 30px;`. De acordo com a especificação do CSS Grid, elementos com posicionamento fora de fluxo (`position: fixed`/`absolute`) não ocupam células no grid (`1fr calc(0.6 * 100vw) 1fr`), preservando exatamente o layout e as posições de `.space` e `.meio`.

#### Passo 2 — Atributos Acessíveis nos Botões de Controle
Adicionar rótulos descritivos e navegabilidade explícita em cada botão:
- Botão Zoom Out: `aria-label="Diminuir zoom"`, `tabindex="0"`
- Botão Zoom In: `aria-label="Aumentar zoom"`, `tabindex="0"`
- Botão Fechar: `aria-label="Fechar visualizador de PDF"`, `tabindex="0"`

#### Passo 3 — Atualização da Suíte de Testes (`tests/components/MaxPdfView.test.ts`)
Adicionar casos de teste que validam:
1. Presença de `.pdf-div-bar-tools` como filha direta do container `.viewPDF` (`role="dialog"`).
2. Presença dos atributos `aria-label` e `tabindex="0"` nos botões da barra.
3. Inclusão dos botões na lista de elementos focáveis pelo `useFocusTrap`.

---

### Especificação de Teste TDD (Red-Green)

Arquivo: [tests/components/MaxPdfView.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-64/tests/components/MaxPdfView.test.ts)

#### Casos de Teste a Adicionar:

```typescript
it('renderiza a barra de ferramentas .pdf-div-bar-tools dentro do container dialog .viewPDF', async () => {
    const wrapper = mountPdf({ file: 'teste.pdf' });
    await wrapper.vm.$nextTick();

    const dialog = wrapper.find('.viewPDF');
    expect(dialog.exists()).toBe(true);

    const toolbarInsideDialog = dialog.find('.pdf-div-bar-tools');
    expect(toolbarInsideDialog.exists()).toBe(true);
});

it('possui atributos acessíveis (aria-label e tabindex) nos botões da barra de ferramentas', async () => {
    const wrapper = mount(MaxPdfView, {
        props: { file: 'teste.pdf' },
        global: { stubs: { VuePdfEmbed: true } }
    });
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('.pdf-div-bar-tools [aria-label]');
    expect(buttons.length).toBe(3);

    const labels = buttons.map((b) => b.attributes('aria-label'));
    expect(labels).toContain('Diminuir zoom');
    expect(labels).toContain('Aumentar zoom');
    expect(labels).toContain('Fechar visualizador de PDF');

    const tabindexes = buttons.map((b) => b.attributes('tabindex'));
    expect(tabindexes.every((t) => t === '0')).toBe(true);
});

it('permite que o foco do teclado (focus trap) acesse os controles da barra de ferramentas', async () => {
    const wrapper = mount(MaxPdfView, {
        props: { file: 'teste.pdf' },
        global: { stubs: { VuePdfEmbed: true } },
        attachTo: document.body
    });
    await wrapper.vm.$nextTick();

    const dialog = wrapper.find('.viewPDF');
    const buttons = dialog.findAll('.pdf-div-bar-tools [aria-label]');
    expect(buttons.length).toBe(3);

    // Simula tecla Tab no dialog
    const firstButton = buttons[0].element as HTMLElement;
    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);

    wrapper.unmount();
});
```

- **Fase Red:** No estado atual do código:
  - `expect(dialog.find('.pdf-div-bar-tools').exists()).toBe(true)` falha porque a barra é irmã e não filha de `.viewPDF`.
  - `expect(buttons.length).toBe(3)` falha porque os botões não possuem `aria-label` nem `tabindex="0"`.
- **Fase Green:** Após mover `.pdf-div-bar-tools` para dentro de `.viewPDF` e adicionar os atributos de acessibilidade, todos os novos testes e os 9 testes pré-existentes passam com sucesso.

---

### Banco de Dados

- **Nenhuma** migration necessária (alteração restrita a acessibilidade e template do componente front-end).

---

### Riscos de Quebra e Não-Regressão

- **Preservação de Layout e Posicionamento:** Como `.pdf-div-bar-tools` utiliza `position: fixed; top: 30px; left: 30px;`, sua posição na tela permanece inalterada mesmo sendo filha de `.viewPDF` (que ocupa `100vw` e `100vh`).
- **Comportamento de Zoom e Fechamento:** Os handlers `@click="Zoom('out')"`, `@click="Zoom('in')"` e `@click="closePDF"` mantêm o mesmo funcionamento e reatividade.
- **Transição de Opacidade Sincronizada:** A barra `.pdf-div-bar-tools` passa a acompanhar o fade-out de `opacity` ao fechar, evitando que a barra de ferramentas fique visualmente órfã durante os 500ms da animação de saída.
- **Suíte de Testes Existente:** Todos os 9 testes já existentes em `tests/components/MaxPdfView.test.ts` (fechamento por clique em `.space`, tecla Escape, scroll lock, debounce/timers e zoom) devem continuar passando com 100% de sucesso.

---

### Validação

1. Execução dos testes automatizados unitários:
   ```bash
   npx vitest run tests/components/MaxPdfView.test.ts
   ```
2. Verificação de tipagem TypeScript:
   ```bash
   npm run type-check
   ```
3. Verificação de estilo e linting:
   ```bash
   npm run lint
   ```

---

### Skills Aplicáveis

- `systematic-debugging-best-practices`
- `planning-with-files`
- `vue-debugging-best-practices`
- `tdd`
- `code-review`
- `production-code-audit`
