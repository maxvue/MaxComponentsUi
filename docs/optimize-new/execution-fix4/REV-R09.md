# Relatório de Refutação Independente — Bloco R09 / F11

- **Subagente:** `REV-R09` (Grupo B — Refutação Independente)
- **ID da Plataforma:** `f7f4827b-742a-466e-9933-b9b2437d5d4c`
- **Parent ID:** `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Horário Inicial:** 2026-09-15T10:23:22-03:00
- **Horário Final:** 2026-09-15T10:35:00-03:00
- **Veredito:** **ACEITO**

---

## 1. Escopo da Auditoria Adversarial

Auditoria independente e tentativa de refutação das correções implementadas por `IMP-R09` no **Bloco R09 / F11** (`escala-z-index-sem-contrato` e `popovers-e-pdf-sem-clamp-mobile`):
1. Verificação da escala canônica de z-index de 11 níveis (`--max-layer-*` e `--max-z-index-*`) e capacidade de override local/global via CSS.
2. Análise da ausência de literais despadronizados/órfãos (como 9999, 99999, 100000) e integridade do stacking context entre componentes vs. stacking interno local (0, 1, 2, 10).
3. Testes em Chromium real cobrindo:
   - Viewport ultra-estreito de 280px (Galaxy Fold fechado) e 320px sem transbordamento visual.
   - Orientação horizontal restrita (landscape 568x320) com scroll interno e botões operáveis.
   - Zoom visual de 200%.
   - Hit-testing via `document.elementFromPoint(x, y)` comprovando que camadas de maior z-index capturam o ponteiro.
   - Override contextual dinâmico de `--max-z-index-*` alterando a ordem no motor Blink.
4. Validação matemática e computacional de safe-areas (`env(safe-area-inset-*)`) e `visualViewport` em `useActiveOverlayPosition`.

---

## 2. Testes Adversariais Executados e Evidências

### Teste 1: Validação de Tokens Canônicos e Ausência de Literais Proibidos
- **Comando:** `npx vitest run tests/themes/layers.test.ts`
- **Resultado:** **APROVADO (6/6 testes)**
- **Evidência:**
```text
✓ Escala Semântica de Camadas (Stacking Layers) (6)
  ✓ declara todos os 11 tokens canônicos de camadas em :root com valores numéricos corretos
  ✓ declara a família correspondente de tokens semânticos --max-z-index-*
  ✓ respeita a ordem estritamente ascendente dos níveis visuais
  ✓ mantém aliases legados mapeados para a escala canônica com fallback idêntico
  ✓ suporta override direto de --max-z-index-* e --max-layer-* via CSS sem quebrar camadas
  ✓ rejeita literais arbitrários legados (9999, 99999, 100000, 999999) nos componentes
```

### Teste 2: Composição de Camadas e Composable de Posicionamento Ativo
- **Comando:** `npx vitest run tests/components/layerComposition.test.ts tests/composables/useActiveOverlayPosition.test.ts`
- **Resultado:** **APROVADO (16/16 testes)**
- **Evidência:**
```text
✓ tests/composables/useActiveOverlayPosition.test.ts (6 tests) 16ms
✓ tests/components/layerComposition.test.ts (10 tests) 83ms
Test Files  2 passed (2)
Tests  16 passed (16)
```

### Teste 3: Suíte no Chromium Real (Blink / Playwright)
- **Comando:** `npx vitest run --config vitest.browser.config.ts tests/browser/layersMobileClamp.browser.ts`
- **Resultado:** **APROVADO (5/5 testes)**
- **Evidência:**
```text
✓ |chromium| tests/browser/layersMobileClamp.browser.ts (5 tests) 360ms
  ✓ adapta e faz clamp de MaxPopover em viewport estreito de 280px sem transbordar 75ms
  ✓ adapta MaxPopoverConfirm em 320px e em landscape (568x320) com scroll interno e ações acessíveis 100ms
  ✓ preserva clamp e limites visuais sob zoom de 200% 83ms
  ✓ valida hit-testing (elementFromPoint) e ordem de sobreposição com tokens canônicos 50ms
  ✓ suporta override direto de --max-z-index-* via CSS alterando a hierarquia no motor Blink 50ms
```

### Teste 4 (Adversarial): Compilação Sass com Múltiplos Overrides Aninhados
- **Cenário:** Injeção de regras SCSS que sobrescrevem tokens `--max-z-index-*` em múltiplos níveis de aninhamento de seletores.
- **Resultado:** **APROVADO**
- **Evidência:**
```text
--- COMPILADO COM SUCESSO ---
✓ Override popover OK (--max-z-index-popover: 3500)
✓ Override modal OK (--max-z-index-modal: 4000)
✓ Override aninhado OK (--max-z-index-dropdown: 5000)
```

### Teste 5 (Adversarial): Posicionamento e Clamp Extremo com Notches e Safe-Area
- **Cenário:** Simulação em 280x600 px com notch lateral de 16px à esquerda/direita, 40px top e 34px bottom, elemento âncora colado na extremidade inferior direita.
- **Resultado:** **APROVADO**
- **Evidência:**
```text
openUp: true
calculated top: 296 minTop: 48 maxBottom: 558
calculated left: 24 minLeft: 24 maxRight: 256
✓ Clamp responsivo em 280px com safe-area e espaço restrito aprovado com sucesso!
```

### Teste 6: Inspeção de Ocorrências Globais de `z-index:`
- **Comando:** `git grep -n 'z-index:' src/components/`
- **Análise:** Todos os valores literais restantes no código pertencem estritamente a empilhamento contextual interno (stacking context do próprio componente: 0, 1, 2, 5, 10 para ícones, botões de ação interna ou bordas sobrepostas), conforme autorizado pelo item R09 de `instructions_to_implementation_fix4.md`. Todas as fronteiras inter-componentes e portais utilizam os tokens semânticos `--max-layer-*` e `--max-z-index-*`.

---

## 3. Conclusão e Veredito

A implementação do **Bloco R09 / F11** atende rigorosamente aos critérios contratuais:
1. A escala de 11 camadas canônicas é completa, ordenada e suporta overrides dinâmicos sem colapsar a hierarquia.
2. A integração com `visualViewport` e `safe-area` em `useActiveOverlayPosition` e nos componentes de overlay garante comportamento resiliente em viewports móveis de 280px, 320px, modo horizontal (landscape) e zoom de 200%.
3. O teste em Chromium real valida `elementFromPoint` e a renderização física no motor Blink.

Veredito final: **ACEITO**.
