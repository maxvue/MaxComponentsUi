# Plano de Migração — MaxIconConfirm

> Plano autossuficiente de revalidação e confirmação de independência do PrimeVue.

---

## 1. Componente

- **Nome:** `MaxIconConfirm`
- **Caminho:** `src/components/MaxIconConfirm.vue`
- **Nível de dificuldade:** `baixa`
- **Objetivo da migração:** Revalidar a independência do PrimeVue. O componente é um botão em formato de ícone que aciona o popover global de confirmação via `useConfirmStore`.

---

## 2. Dependências do PrimeVue

Originalmente presumia-se que dependesse de um substituto do PrimeVue para a diretiva `v-tooltip`. No entanto, uma auditoria da árvore comprovou:
1. `src/directives/tooltip.ts` é uma implementação nativa própria, sem qualquer import de PrimeVue.
2. O componente encapsula `MaxIconButton`, que por sua vez utiliza `MaxIcon` (ambos com zero dependências do PrimeVue).
3. A store `useConfirmStore` é pura em Pinia.

Portanto, a árvore de dependências inteira já é completamente livre de PrimeVue.

---

## 3. Dependências internas

| Dependência | Origem | Papel | Ação na migração |
|-------------|--------|-------|------------------|
| `MaxIconButton` | `./MaxIconButton.vue` | Botão baseado exclusivamente em ícone. | Preservar. |
| `useConfirmStore` | `../stores/useConfirm.Store.ts` | Store de confirmação com popover. | Preservar. |

---

## 4. API pública a preservar

- **Props:**
  - `icon`: nome do ícone
  - `confirmMessage`: texto do popover
  - `action`: função a ser executada na confirmação
  - Props de layout: `size`, `color`, `disabled`, `tooltip`
- **Comportamento observável:**
  - Clique no ícone abre confirmação sem disparar a ação imediatamente.
  - Confirmação dispara `action()`.

---

## 5. Estratégia de substituição

Nenhuma alteração de código necessária. Item resolvido por revalidação (zero imports de PrimeVue).

---

## 6. Passos de implementação

1. Validar a inexistência de imports PrimeVue no arquivo e nos subcomponentes filhos.
2. Rodar a suíte de testes unitários para confirmar que todos os comportamentos estão preservados.

---

## 7. Estilos

- Preservar estilos SCSS scoped e tokens de cores do design system.

---

## 8. Testes / verificação

- `npx vitest run tests/components/MaxIconConfirm.test.ts`
- Conferir asserções de clique e exibição.

---

## 9. Skills necessárias

- `.claude/skills/vue-max-components-ui-development-best-practices`
- `.claude/skills/vue-vitest-testing-best-practices`

---

## 10. Riscos e pontos de atenção

- Nenhum. A árvore é 100% nativa.
