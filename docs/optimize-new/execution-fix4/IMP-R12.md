# Relatório de Implementação — Bloco R12 / F19

- **Subagente:** `IMP-R12`
- **ID da Plataforma:** `d25bcb86-4d20-4dc5-a3fd-dd2b964f6f74`
- **Parent ID:** `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Horário Inicial:** 2026-09-15T11:27:59-03:00
- **Horário Final:** 2026-09-15T11:36:00-03:00
- **Status:** CONCLUÍDO COM SUCESSO

---

## 1. Escopo e Objetivos da Tarefa

Implementação, padronização e validação formal do **Bloco R12 / F19** cobrindo acessibilidade de seleção de arquivos (file choosers) e alternativas operáveis e perceptíveis para componentes gráficos complexos (`MaxChart` e `MaxMaps`):

1. **Associação Nativa de File Choosers (`MaxInputFileUpload` e `MaxInputFileProject`)**:
   - Associação nativa entre o gatilho visual e o input file subjacente utilizando elemento semântico `<label :for="inputId">`.
   - Garantia de que o `<input type="file">` permaneça no DOM com classe acessível (`sr-only` / `clip: rect(0,0,0,0)`), eliminando `display: none !important` que impedia tecnologia assistiva de alcançar o controle.
   - Suporte completo a navegação e acionamento por teclado com `tabindex="0"`, `role="button"` e manipuladores nativos para teclas `Enter` e `Espaço` (`@keydown.enter.prevent` e `@keydown.space.prevent`).
   - Gerenciamento rigoroso de estado desabilitado (`is-disabled`, `aria-disabled="true"`, `tabindex="-1"`, prevenção de clique/keydown).

2. **Alternativas Operáveis e Perceptíveis em Componentes Gráficos (`MaxChart` e `MaxMaps`)**:
   - **`MaxChart.vue`**:
     * Contêiner da tabela acessível configurado com `role="region"`, `tabindex="0"` e `aria-label` descritivo (`accessibleRegionLabel`).
     * Sumário textual semântico via `.max-chart-accessible-summary` com `tabindex="0"` e `aria-live="polite"` descrevendo o número de séries e itens.
     * Estilização `.sr-only-focusable` aprimorada com `:focus` e `:focus-within` para expansão visual perceptível no foco por teclado (`position: static`, `outline` de foco do design system e elevação).
     * Células operáveis com botões nativos (`.max-chart-cell-btn`) com suporte a seleção de dados via teclado (`Enter`/`Espaço`).
   - **`MaxMaps.vue`**:
     * Região de controles acessíveis configurada com `role="region"`, `tabindex="0"` e `aria-label="Controles acessíveis de coordenadas do mapa"`.
     * Sumário semântico `.map-accessible-summary` com `tabindex="0"` e `aria-live="polite"` expondo latitude e longitude com 5 casas decimais.
     * Expansão visual e foco perceptível com `position: absolute`, `outline` semântico de foco e `box-shadow` no tema claro e escuro.
     * Controles operáveis por teclado para ajuste manual de coordenadas e movimentação direcional (Norte, Sul, Leste, Oeste).

3. **Validação Rigorosa em Chromium Real**:
   - Criação e execução de suíte de testes ponta a ponta com Chromium real (`tests/browser/fileChooserAndGraphAlternatives.browser.ts`) validando foco, clique, dispatched events, expansão de bounding box e acionamento por teclado.

---

## 2. Arquivos Modificados e Criados

### Modificados:
- `src/components/MaxInputFileUpload.vue`:
  - Input file oculto via técnica acessível (posição absoluta, clip 1px, opacidade zero) em vez de `display: none`.
  - Atribuição de `inputId` gerado/propagado e associação semântica através de `<label :for="isDisabled ? undefined : inputId">`.
  - Suporte a teclado `Enter` e `Espaço`, `aria-disabled` e supressão de eventos quando `disabled`.
  - Focus rings visíveis compatíveis com os tokens do design system (`--max-focus-outline`).
- `src/components/MaxInputFileProject.vue`:
  - Input file nativo inserido com ID único e vinculado via `<label :for="...">` no botão/área de upload.
  - Eventos de teclado `Enter` e `Espaço` disparando a seleção nativa.
  - Bloqueio completo de interação quando a prop `disabled` está ativa.
- `src/components/MaxChart.vue`:
  - Wrapper da tabela alternativa marcado com `role="region"`, `tabindex="0"` e `:aria-label="accessibleRegionLabel"`.
  - Bloco de sumário acessível (`.max-chart-accessible-summary`) com `tabindex="0"` e `aria-live="polite"`.
  - Expansão visual ao receber foco (`:focus`, `:focus-within`) e estilo para botões de célula (`.max-chart-cell-btn`).
- `src/components/MaxMaps.vue`:
  - Painel de controles com `role="region"`, `tabindex="0"` e `aria-label`.
  - Sumário dinâmico `.map-accessible-summary` com `tabindex="0"` e `aria-live="polite"`.
  - Estilização aprimorada de foco com contorno de foco do design system e elevação.
- `tests/components/MaxInputFileUpload.test.ts`:
  - Atualizado para verificar associação do label `:for`, atributos ARIA, acionamento por teclado e integridade de eventos.
- `tests/components/MaxInputFileProject.test.ts`:
  - Atualizado para validar label semântico, input file acessível e controle de teclado.
- `tests/components/MaxChart.test.ts`:
  - Validação da região acessível, sumário com `aria-live="polite"` e navegação na tabela.
- `tests/components/MaxMaps.test.ts`:
  - Validação de região semântica, sumário de coordenadas e acionamento de controles por teclado.

### Criados:
- `tests/browser/fileChooserAndGraphAlternatives.browser.ts`:
  - Suíte de 5 testes executados no Chromium real cobrindo `MaxInputFileUpload`, `MaxInputFileProject`, `MaxChart` e `MaxMaps`.

---

## 3. Comandos Executados e Evidências

### 3.1. Testes Unitários de Componente
```bash
npx vitest run tests/components/MaxInputFileUpload.test.ts tests/components/MaxInputFileProject.test.ts tests/components/MaxChart.test.ts tests/components/MaxMaps.test.ts
```
**Resultado:**
- 4 arquivos de teste, **67 testes executados, 67 aprovados (100% sucesso)**.
- Duração: 1.46s.

### 3.2. Testes de Browser no Chromium Real
```bash
npx vitest --config vitest.browser.config.ts run tests/browser/fileChooserAndGraphAlternatives.browser.ts
```
**Resultado:**
- 1 arquivo de teste, **5 testes executados no Chromium real, 5 aprovados (100% sucesso)**.
  * `✓ associa label :for nativo ao input file, recebe foco visível e aciona via Enter e Espaço` (54ms)
  * `✓ impede acionamento por teclado e clique quando MaxInputFileUpload está desabilitado` (32ms)
  * `✓ associa label :for nativo e suporta acionamento por teclado em MaxInputFileProject` (34ms)
  * `✓ expõe região acessível em MaxChart perceptível ao foco com navegação e seleção por teclado` (99ms)
  * `✓ expõe controles acessíveis em MaxMaps perceptíveis ao foco com sumário semântico navegável` (133ms)
- Duração: 2.32s.

### 3.3. Checagem de Tipagem e Lint
```bash
npm run type-check
npx eslint src/components/MaxInputFileUpload.vue src/components/MaxInputFileProject.vue src/components/MaxChart.vue src/components/MaxMaps.vue tests/components/MaxInputFileUpload.test.ts tests/components/MaxInputFileProject.test.ts tests/components/MaxChart.test.ts tests/components/MaxMaps.test.ts tests/browser/fileChooserAndGraphAlternatives.browser.ts
```
**Resultado:**
- `npm run type-check`: 0 erros.
- `eslint`: 0 erros, 0 warnings.

---

## 4. Riscos Avaliados e Mitigações

1. **Risco de clique duplo no acionamento nativo de `<label :for="...">`:**
   - *Mitigação:* As funções `onChooserClick` e `onChooserKeydown` coordenam a propagação do evento nativo com o trigger programático e limpam `target.value = ''` no `@change`, evitando loops ou disparos duplicados em múltiplos navegadores.
2. **Risco de quebra de layout com `<input type="file">` não oculto por `display: none`:**
   - *Mitigação:* Utilizada técnica canônica de acessibilidade com `position: absolute`, dimensões 1px x 1px, margem negativa, `clip: rect(0,0,0,0)` e `opacity: 0`, garantindo ausência total de impacto no fluxo visual e compatibilidade com leitores de tela.
3. **Risco de poluição visual das tabelas acessíveis de gráficos e mapas:**
   - *Mitigação:* Os elementos permanecem recolhidos (`sr-only-focusable`) e expandem exclusivamente quando recebem foco pelo teclado (`:focus`, `:focus-within`), assegurando experiência limpa para usuários apontadores e total autonomia para usuários de teclado/tecnologia assistiva.

---

## 5. Conclusão

O Bloco R12 / F19 foi implementado e validado com sucesso, com todos os requisitos de acessibilidade cumpridos integralmente, 100% dos testes unitários e de browser no Chromium real aprovados, zero erros de tipagem e estrita conformidade com as regras do repositório.
