# Plano de Migração — MaxButtonConfirm

> Plano autossuficiente de revalidação e confirmação de independência do PrimeVue.

---

## 1. Componente

- **Nome:** `MaxButtonConfirm`
- **Caminho:** `src/components/MaxButtonConfirm.vue`
- **Nível de dificuldade:** `baixa`
- **Objetivo da migração:** Revalidar a independência do PrimeVue. O componente é um wrapper que combina o botão de ação com o popover de confirmação global (`useConfirmStore`), dependendo exclusivamente do componente `MaxButton`.

---

## 2. Dependências do PrimeVue

Nenhum import direto de PrimeVue existia neste componente. Sua única dependência transitiva era:
1. `MaxButton` (`src/components/MaxButton.vue`), que originalmente importava `primevue/button`.
2. A diretiva `v-tooltip`, cuja implementação no projeto é 100% própria (`src/directives/tooltip.ts`) registrada em `src/index.ts` com zero imports do PrimeVue.

Com a migração do item #19 (`MaxButton`) para botão HTML nativo concluída, `MaxButtonConfirm` torna-se automaticamente livre de dependências do PrimeVue.

---

## 3. Dependências internas

| Dependência | Origem | Papel | Ação na migração |
|-------------|--------|-------|------------------|
| `MaxButton` | `./MaxButton.vue` | Botão visual que dispara a confirmação. | Preservar integralmente (já migrado no item #19). |
| `useConfirmStore` | `../stores/useConfirm.Store.ts` | Governa a abertura e o callback do modal/popover de confirmação. | Preservar. |

---

## 4. API pública a preservar

- **Props:**
  - `confirmMessage` (ou label do popup)
  - `onConfirm` / `action`
  - Todas as props repassadas para `MaxButton` (`label`, `icon`, `severity`, `size`, `disabled`, `loading`)
- **Comportamento observável:**
  - Ao clicar no botão, abrir o popover de confirmação via `useConfirmStore`.
  - Não disparar a ação definitiva sem a confirmação do usuário.

---

## 5. Estratégia de substituição

Nenhuma alteração de código necessária no componente. A resolução é feita por revalidação da árvore de dependências após a conclusão da etapa #19 (`MaxButton`).

---

## 6. Passos de implementação

1. Validar a migração do #19 `MaxButton`.
2. Executar a suíte de testes unitários `tests/components/MaxButtonConfirm.test.ts`.
3. Verificar a ausência de imports de PrimeVue na árvore (`MaxButtonConfirm` → `MaxButton`).

---

## 7. Estilos

- Preservar os estilos semânticos definidos em `MaxButtonConfirm.vue` e as variantes de cores providas pelo design system.

---

## 8. Testes / verificação

- `npx vitest run tests/components/MaxButtonConfirm.test.ts` (ou testes de confirmação correspondentes).
- Garantir que todos os asserts passem sem regressão.

---

## 9. Skills necessárias

- `.claude/skills/vue-max-components-ui-development-best-practices`
- `.claude/skills/vue-vitest-testing-best-practices`

---

## 10. Riscos e pontos de atenção

- Garantir que `MaxButton` mantenha repasse fiel de atributos e eventos para que o fluxo de clique do `useConfirmStore` não sofra regressão.
