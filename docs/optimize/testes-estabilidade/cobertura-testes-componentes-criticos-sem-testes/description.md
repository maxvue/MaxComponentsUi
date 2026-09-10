# Ausência de Testes Unitários Automatizados em Componentes Críticos

## 1. Contexto e Diagnóstico Técnico
Uma biblioteca de componentes de UI corporativa necessita de uma rede de segurança abrangente com testes unitários em Vitest para proteger os componentes contra regressões visuais, quebras de contrato de slots, perda de acessibilidade e falhas em eventos reativos.

O projeto possui 146 arquivos de teste na raiz de `tests/`, cobrindo 90 componentes em `tests/components/`. Entretanto, uma auditoria automatizada revelou que **23 componentes em `src/components/` não possuem arquivos de teste unitário dedicados**.

Dentre esses 23 componentes, descartando wrappers visuais triviais (como transições simples ou ícones estáticos), identificou-se uma lacuna crítica de cobertura em **subcomponentes estruturais compostos, ferramentas de navegação e componentes de layout**.

## 2. Inventário de Componentes Críticos sem Testes

### A. Subcomponentes do Sistema de Abas (Tabs)
- `src/components/MaxTabList.vue`: Gerencia a lista de abas, navegação por teclado (ArrowLeft/ArrowRight), acessibilidade WAI-ARIA (`role="tablist"`).
- `src/components/MaxTabPanels.vue`: Container de painéis de abas.
- `src/components/MaxTabPanel.vue`: Painel individual com controle de visibilidade baseado na aba ativa (`role="tabpanel"`, `v-show` / `aria-labelledby`).
*Nota:* Embora `MaxTabs.vue` e `MaxTab.vue` possuam testes básicos, a composição integrada com `MaxTabList`, `MaxTabPanels` e `MaxTabPanel` não é coberta unitariamente.

### B. Subcomponente do Sistema de Acordeão (Accordion)
- `src/components/MaxAccordionItem.vue`: Responsável pelo controle de cabeçalho clicável, expansão/colapso, animação de altura, acessibilidade (`aria-expanded`, `aria-controls`) e injeção do contexto do `MaxAccordion`.

### C. Navegação e Top Toolbar do App Shell
- `src/components/MaxTopToolbar.vue`: Barra superior com botões de ação dinâmica, filtros e menus contextuais.
- `src/components/MaxTopToolbarSubmenu.vue`: Submenu flutuante com suporte a múltiplos itens e ações.
- `src/components/MaxTopMenuSearchBar.vue`: Campo de busca global com debounce, histórico, atalhos de teclado e integração com stores (`useSearchBarStore`).
- `src/components/MaxMenuVerticalItem.vue`: Renderizador recursivo de itens de menu lateral, manipulando rotas ativas, ícones, badges e permissões.

### D. Barra de Ferramentas de Código
- `src/components/MaxInputCodeToolbar.vue`: Contém 356 linhas de código com seletor de linguagem nativo, ações de formatação, indentação, desfazer/refazer, alternância de minimapa e atalhos de teclado. Possui testes embutidos dentro de `tests/components/MaxInputCode.test.ts`, porém **esse arquivo de teste está falhando e não roda na CI** devido ao erro de resolução do `@monaco-editor/loader`.

### E. Container e Loading
- `src/components/MaxLoadScreenTarget.vue`: Target reativo para renderizar telas de loading overlay contextualizadas.
- `src/components/MaxContainerApp.vue`: Container base do app shell.

## 3. Impacto Técnico
- **Regressão não Detectada em Refatorações:** Qualquer alteração em injeções de contexto (`provide`/`inject`) nos componentes compostos (como Tabs e Accordion) quebra silenciosamente sem sinalização pelo Vitest.
- **Vulnerabilidade em Acessibilidade (a11y):** Sem testes que verifiquem atributos ARIA (`aria-selected`, `aria-expanded`, `tabindex`), atualizações de código podem tornar os componentes inacessíveis para leitores de tela sem que a equipe perceba.
- **Falsa Sensação de Cobertura:** A presença de testes apenas nos componentes-pai (ex.: `MaxTabs.vue`) mascara a falta de validação das propriedades e slots dos filhos (`MaxTabList`, `MaxTabPanel`).

## 4. Recomendações de Resolução
1. **Criar Suítes de Testes Unitários Dedicadas em `tests/components/`:**
   - `tests/components/MaxAccordionItem.test.ts`: testar expansão, evento de clique, atributos ARIA e slots `title` e `default`.
   - `tests/components/MaxTabList.test.ts` e `tests/components/MaxTabPanel.test.ts`: testar sincronização com `activeValue`, visibilidade e repasse de atributos.
   - `tests/components/MaxTopMenuSearchBar.test.ts`: testar digitação, debounce, limpeza de busca e emissão de eventos.
   - `tests/components/MaxMenuVerticalItem.test.ts`: testar destaque da rota ativa (`is-active`), renderização de badge e navegação via router.
2. **Separar `MaxInputCodeToolbar.test.ts`:**
   - Extrair os testes do toolbar para um arquivo independente que não dependa do runtime de `MaxInputCode` nem de `@monaco-editor/loader`, garantindo sua execução imediata.
3. **Estabelecer Meta de Cobertura:**
   - Definir meta de 100% de componentes com arquivo de teste em `tests/components/` como critério de aceitação de pull requests.
