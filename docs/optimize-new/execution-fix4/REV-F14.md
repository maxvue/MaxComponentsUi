# Relatório de Refutação Adversarial Independente — Bloco F14 (REV-F14)

## Metadados do Subagente
- **Subagente**: `REV-F14` (Grupo B — Refutação Independente)
- **ID Real da Plataforma**: `5ea35eb1-8be5-4dc1-b199-bda687fc4b9a`
- **Parent ID**: `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Horário Inicial (Rodada 1)**: `2026-09-15T07:49:59-03:00`
- **Horário Final (Rodada 1)**: `2026-09-15T07:58:30-03:00` (Veredito: `REJEITADO`)
- **Horário Inicial (Rodada 2)**: `2026-09-15T08:08:10-03:00`
- **Horário Final (Rodada 2)**: `2026-09-15T08:11:30-03:00` (Veredito: `ACEITO`)
- **Tarefa Original**: Auditoria adversarial e refutação independente da implementação do Bloco F14 (`MaxBaseVirtualScroller.vue`, `src/types/listbox.ts`, `tests/components/base/MaxBaseVirtualScroller.test.ts`) em relação ao contrato listbox, navegação por teclado, seleção e garantia de não-referenciação de nós desmontados em `aria-activedescendant`.
- **Veredito Final**: **`ACEITO`**

---

## 1. Sumário Executivo do Veredito

Na Rodada 1, a auditoria independente de `REV-F14` refutou a implementação inicial devido ao descompasso temporal síncrono em `onScroll`, que permitia a `aria-activedescendant` reter a referência a um elemento que já havia sido desmontado do DOM pelo motor de virtualização.

Na **Rodada 2**, o implementador `IMP-F14` acolheu a refutação e substituiu integralmente a abordagem imperativa por um **`computed` reativo canônico**, atrelado sincronicamente a `virtualizer.value.getVirtualItems()`.

Após submeter a nova versão a uma bateria rigorosa de 5 testes adversariais independentes, **todas as tentativas de refutação falharam**:
1. Durante scroll forçado profundo em coleção virtualizada de 10.000 itens (`scrollTop = 40000`), no exato instante em que o nó focado deixa de existir no DOM físico, `aria-activedescendant` torna-se estritamente `undefined`.
2. Ao realizar scroll de volta ao topo, `aria-activedescendant` é restaurado de forma determinística apontando para o elemento re-montado.
3. `isSelected` agora reconhece perfeitamente tanto objetos quanto identificadores primitivos extraídos via `getItemValue`, inclusive sob seleção múltipla (`multiple: true`).
4. A blindagem semântica no modo neutro/genérico foi comprovada: sem roles espúrias, sem `tabindex`, sem `aria-activedescendant` e sem interceptação indevida de teclado.
5. A suíte oficial (`37/37`), a regressão do consumidor `MaxListBox` (`87/87`), o `type-check` (`vue-tsc`) e o `eslint` passaram com código de saída 0.

---

## 2. Bateria de Testes Adversariais Independentes (Rodada 2)

Executados diretamente em ambiente isolado via Vitest:

| # | Cenário Adversarial | Resultado | Detalhes Técnicos |
|---|---|---|---|
| 1 | **Scroll profundo forçado em 10.000 itens** | **APROVADO** | Ao aplicar `scrollTop = 40000`, o item 0 é desmontado (`exists() === false`) e `aria-activedescendant` passa imediatamente para `undefined`. Ao rolar para `scrollTop = 0`, o nó reaparece no DOM e o atributo é restaurado para `"adv-10k-option-0"`. |
| 2 | **Foco em nó distante via teclado (`End`)** | **APROVADO** | Navegação rápida para o item 999 aciona o scroll do virtualizador; `aria-activedescendant` sincroniza com o nó final montado. |
| 3 | **Acessibilidade e seleção com Objeto e Primitivo** | **APROVADO** | `isSelected` valida `modelValue` sendo o objeto `{ id: 20, ... }`, o primitivo `30` e arrays com tipos mistos, atribuindo `aria-selected="true"` sem discrepâncias. |
| 4 | **Modo Neutro/Genérico (Sem Semântica Espúria)** | **APROVADO** | Container sem `role` não emite `tabindex`, `aria-activedescendant`, `aria-selected` nem intercepta eventos de teclado (`ArrowDown`, `Enter`). |
| 5 | **Teclado com Itens Desabilitados nos Extremos e Meio** | **APROVADO** | `Home`, `ArrowDown` e `End` pulam corretamente nós desabilitados no início (0), meio (2) e fim (4), focando apenas itens habilitados. |

### Evidência de Execução dos Testes Adversariais:
```bash
npx vitest run tests/components/base/temp_adv.test.ts
```
```
 ✓ tests/components/base/temp_adv.test.ts (5 tests) 308ms
   ✓ Testes Adversariais Independentes (Rodada 2) - REV-F14 (5)
     ✓ Cenário 1: Virtualização com 10.000 itens e scroll profundo forçado: aria-activedescendant NUNCA aponta para nó fora do DOM e restaura ao voltar 105ms
     ✓ Cenário 2: Foco em nó distante via teclado (End) em 1000 itens 36ms
     ✓ Cenário 3: Imposição de Acessibilidade no modo listbox (nome, teclado, seleção com objeto e primitivo, aria-selected) 67ms
     ✓ Cenário 4: Ausência de semântica espúria no modo neutro/genérico 34ms
     ✓ Cenário 5: Teclado navega pulando itens desabilitados no início, meio e fim 65ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  1.20s
```

---

## 3. Evidências de Validação da Suíte do Repositório

### A. Testes Unitários de `MaxBaseVirtualScroller.test.ts`:
```bash
npx vitest run tests/components/base/MaxBaseVirtualScroller.test.ts
```
```
 Test Files  1 passed (1)
      Tests  37 passed (37)
   Start at  08:10:01
   Duration  1.18s
```

### B. Regressão de Consumidor (`MaxListBox.test.ts`):
```bash
npx vitest run tests/components/MaxListBox.test.ts
```
```
 Test Files  1 passed (1)
      Tests  87 passed (87)
   Start at  08:10:24
   Duration  3.65s
```

### C. Type-check e Linters:
```bash
npm run type-check
npx eslint src/components/base/MaxBaseVirtualScroller.vue src/types/listbox.ts tests/components/base/MaxBaseVirtualScroller.test.ts
```
**Resultado**: 0 erros, 0 avisos.

---

## 4. Conclusão e Veredito Final

A implementação do Bloco F14 cumpre com rigor técnico exemplar todas as exigências do prompt `instructions_to_implementation_fix4.md`, as diretrizes WAI-ARIA 1.2 e os critérios de conformidade WCAG 1.3.1 e 4.1.2.

O veredito final é **`ACEITO`**.
