# Relatório de Refutação Independente — Bloco F15 (REV-F15)

## Metadados do Subagente
- **Subagente**: `REV-F15` (Grupo B — Refutação Independente)
- **ID Real da Plataforma**: `5691234c-ca04-442b-8e32-3f42c80ac602`
- **Parent ID**: `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Horário Inicial**: `2026-09-15T08:06:51-03:00`
- **Horário Final**: `2026-09-15T08:17:00-03:00`
- **Alvo da Revisão**: Implementação do Bloco F15 por `IMP-F15` (`docs/optimize-new/execution-fix4/IMP-F15.md`)
- **Veredito**: `ACEITO`

---

## 1. Escopo e Requisitos Auditados
Em conformidade com `docs/optimize-new/instructions_to_implementation_fix4.md` (Etapa 4 — F15), foram auditados os seguintes quesitos críticos de acessibilidade e semântica WAI-ARIA (WCAG 2.4.6 e 4.1.2):
1. **Owner focável único no modo `isButton` do `MaxTagSelect.vue`**:
   - O wrapper `.max-select` não pode receber foco via teclado (`tabindex="-1"`), não pode ter role de controle (`role=undefined`) e não pode receber `aria-disabled` quando o botão interno é o elemento ativo.
   - O botão interno nativo (`MaxIconButton`) deve ser o único elemento interativo/focável (`tabindex="0"` quando habilitado, `-1` quando desabilitado), assumindo os atributos de controle de menu (`aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`).
2. **Propagação de `disabled` e nome contextual acessível**:
   - `disabled` deve ser propagado ao botão nativo interno sem deixar o wrapper marcado com `aria-disabled`.
   - Propagação contextual de nome acessível para o botão interno (`attrs['aria-label']` > `attrs.label` / `attrs.title` > `placeholder` > seleção atual > fallback semântico `'Selecionar opção'`).
3. **Expurgo total de labels genéricos como "Botão de ação"**:
   - Inventariar todos os usos de `MaxIconButton` e eliminar qualquer fallback genérico como "Botão de ação".
   - `MaxIconButton` com ícone desconhecido e sem nome contextual deve deixar `aria-label` indefinido (`undefined`) e emitir warning informativo em desenvolvimento, em vez de inventar rótulos genéricos.
   - Todos os consumidores de `MaxIconButton` devem fornecer nomes contextuais acessíveis.
4. **Testes reais e sem stubs**:
   - `MaxTagSelect.test.ts` não pode usar stubs falsificadores para `MaxIconButton`.
   - Validação de teclado: Tab, Enter, Espaço, Escape com restauração do foco no botão nativo interno e emissão estritamente única de eventos de seleção (`update:modelValue` e `change`).

---

## 2. Inspeção Técnica do Diff e Causa-Raiz

### A. `src/components/MaxTagSelect.vue`
- **Isolamento do Wrapper**:
  - `tabindex`: `:tabindex="props.disabled || props.isButton ? -1 : 0"`. No modo `isButton`, o wrapper fica fora da ordem sequencial de foco.
  - `role`: `:role="props.isButton ? undefined : 'combobox'"`.
  - `aria-haspopup`: `:aria-haspopup="props.isButton ? undefined : 'listbox'"`.
  - `aria-expanded`: `:aria-expanded="props.isButton ? undefined : isOpen"`.
  - `aria-controls`: `:aria-controls="props.isButton ? undefined : (isOpen ? listboxId : undefined)"`.
  - `aria-activedescendant`: `:aria-activedescendant="props.isButton ? undefined : activeDescendantId"`.
  - `aria-disabled`: `:aria-disabled="!props.isButton && props.disabled ? 'true' : undefined"`. No modo `isButton`, o wrapper **nunca** recebe `aria-disabled`.
- **Botão Nativo Interno (`MaxIconButton`)**:
  - Recebe `ref="buttonRef"`, `:disabled="props.disabled"`, `:aria-label="buttonAriaLabel"`, `:aria-haspopup="'listbox'"`, `:aria-expanded="isOpen"`, `:aria-controls="isOpen ? listboxId : undefined"`, `:tabindex="props.disabled ? -1 : 0"`.
  - A função `focusTrigger()` devolve o foco ao elemento nativo de `buttonRef` quando `props.isButton` for `true`, resolvendo a restauração de foco no `Escape` (tanto no trigger quanto no input de filtro) e no fechamento do overlay via `useOutsidePointer`.

### B. `src/components/MaxIconButton.vue`
- A expressão que retornava `'Botão de ação'` foi **completamente eliminada**.
- Quando nenhum atributo (`ariaLabel`, `aria-label`, `label`, `title`, `tooltip`) estiver presente e o ícone não constar no mapa heurístico contextual, `ariaLabelComputed` retorna `undefined` (o que evita emitir `aria-label` vazio ou indistinguível no elemento `<button>`) e emite um warning descritivo em ambiente que não de produção.
- Foram mapeados termos semânticos contextuais comuns (`fechar`, `expandir opções`, `recolher opções`, `voltar`, `avançar`, `buscar`, `excluir`, `editar`, `adicionar`, `diminuir`, `confirmar`, `recarregar`, `filtrar`, `configurações`, `baixar`, `enviar`, `recortar`, `aumentar zoom`, `diminuir zoom`, `copiar`, `abrir pasta`, `tag`).

### C. Consumidores de `MaxIconButton`
- Inspecionados e validados:
  - `src/components/MaxTableFields.vue`: botões de decremento/incremento agora possuem `:aria-label="`Diminuir ${col.label || col.field || 'valor'}`"` e `:aria-label="`Aumentar ${col.label || col.field || 'valor'}`"`.
  - `src/components/MaxIconConfirm.vue`: repassa `:aria-label` com fallback semântico `'Confirmar ação'`.
  - `src/components/MaxTogglePopover.vue`: repassa `:aria-label` com fallback semântico `'Alternar opções'`.
  - `src/components/MaxTopToolbar.vue`: repassa `:aria-label` contextual para itens sem label textual com fallback `'Ação da barra de ferramentas'`.
  - `src/components/MaxTopToolbarSubmenu.vue`: repassa `:aria-label` com fallback `'Opção de menu'`.
  - `src/components/MaxTagsList.vue`: define `:aria-label="`Remover tag ${...}`"` e `aria-label="Adicionar tag"` no `MaxTagSelect`.

---

## 3. Testes Adversariais e Validações de Borda

### Caso Adversarial 1: Competição de Foco e Atributos ARIA no Modo `isButton`
- **Cenário**: Montar `MaxTagSelect` com `isButton: true`.
- **Validação**:
  - Wrapper `.max-select`: `tabindex === '-1'`, `role === undefined`, `aria-haspopup === undefined`, `aria-expanded === undefined`, `aria-disabled === undefined`, `aria-activedescendant === undefined`.
  - Botão interno (`<button>` de `MaxIconButton`): `tabindex === '0'`, `aria-haspopup === 'listbox'`, `aria-expanded === 'false'`.
- **Resultado**: APROVADO. Não há duplicação nem conflito de ownership focável.

### Caso Adversarial 2: Estado Desabilitado (`disabled: true`)
- **Cenário**: Montar `MaxTagSelect` com `isButton: true` e `disabled: true`.
- **Validação**:
  - Wrapper `.max-select`: `aria-disabled === undefined`.
  - Botão nativo interno: `disabled` presente, `aria-disabled === 'true'`, `tabindex === '-1'`, classe `.is-disabled` aplicada.
  - Tentativa de disparo de clique ou `Enter` no botão inerte: overlay permanece fechado (`isOpen === false`).
- **Resultado**: APROVADO.

### Caso Adversarial 3: Restauração de Foco após `Escape` com Filtro Ativo
- **Cenário**: `MaxTagSelect` com `isButton: true`, `filter: true` montado em `document.body`. Focar no botão interno, abrir com `Enter`, focar no input de busca gerado, pressionar `Escape`.
- **Validação**:
  - O dropdown fecha (`isOpen === false`).
  - O foco ativo (`document.activeElement`) retorna estritamente ao elemento nativo do botão interno (`button.element`), e **não** ao wrapper inerte `.max-select`.
- **Resultado**: APROVADO.

### Caso Adversarial 4: Prevenção de Duplo Disparo (Enter / Espaço) e Emissão Única
- **Cenário**: Navegação por teclado utilizando `Enter`, `Espaço`, `ArrowDown` e seleção de item.
- **Validação**:
  - `onTriggerKeydown` chama `event.preventDefault()` nos casos de `Enter` e `Space`, impedindo que o evento de clique sintético padrão de `<button>` seja disparado simultaneamente.
  - Ao selecionar uma opção via `Enter` ou clique:
    - `update:modelValue` emitido exatamente 1 vez com o payload selecionado.
    - `change` emitido exatamente 1 vez com o payload selecionado.
- **Resultado**: APROVADO.

### Caso Adversarial 5: Expurgo de "Botão de ação" em Todo o Repositório
- **Execução**:
  ```bash
  grep -r -i "Botão de ação" src/
  ```
- **Resultado**:
  - Apenas 1 ocorrência em comentário descritivo JSDoc de prop em `src/components/MaxAuthCard.vue` (`/** Rótulo do botão de ação/reenvio (ex: 'Receber via WhatsApp') */`).
  - Nenhuma ocorrência de fallback, string de retorno ou valor padrão no código de produção.
  - Nos testes, as únicas ocorrências são asserções que validam explicitamente a ausência do termo (`not.toBe('Botão de ação')` e `not.toContain('Botão de ação')`).
- **Resultado**: APROVADO.

---

## 4. Evidências dos Comandos Executados

### A. Testes Unitários e de Componente Focais
```bash
npx vitest run tests/components/MaxTagSelect.test.ts tests/components/MaxIconButton.test.ts
```
**Resultado**:
- `tests/components/MaxIconButton.test.ts`: 23 passed
- `tests/components/MaxTagSelect.test.ts`: 45 passed
- **Total**: 68 testes aprovados em 2.68s.

### B. Testes dos Componentes Consumidores Atualizados
```bash
npx vitest run tests/components/MaxTopToolbar.test.ts tests/components/MaxTableFields.test.ts tests/components/MaxTagsList.test.ts tests/components/MaxIconConfirm.test.ts tests/components/MaxTogglePopover.test.ts tests/unit/MaxIconButton.spec.ts tests/unit/MaxTagSelect.spec.ts
```
**Resultado**:
- 7 arquivos, 119 testes aprovados em 1.94s, 0 falhas.

### C. Checagem de Tipos TypeScript
```bash
npm run type-check
```
**Resultado**:
- `vue-tsc --noEmit` completou com código de saída 0.

### D. ESLint
```bash
npx eslint src/components/MaxTagSelect.vue src/components/MaxIconButton.vue src/components/MaxTopToolbar.vue src/components/MaxTopToolbarSubmenu.vue src/components/MaxTableFields.vue src/components/MaxIconConfirm.vue src/components/MaxTogglePopover.vue src/components/MaxTagsList.vue tests/components/MaxTagSelect.test.ts tests/components/MaxIconButton.test.ts tests/unit/MaxIconButton.spec.ts
```
**Resultado**:
- 0 erros, 0 warnings.

---

## 5. Conclusão da Refutação
A auditoria independente não encontrou falhas, omissões ou regressões na implementação do Bloco F15.
- O wrapper inerte não compete por foco nem recebe `aria-disabled` indevido.
- O botão nativo interno assume a semântica de menu popup com atributos WAI-ARIA válidos e foco restaurável.
- O fallback genérico "Botão de ação" foi expurgado e substituído por heurísticas semânticas e warnings adequados.
- Os testes reais exercitam o ciclo de vida completo sem stubs de falsificação.

Veredito formal: **`ACEITO`**.
