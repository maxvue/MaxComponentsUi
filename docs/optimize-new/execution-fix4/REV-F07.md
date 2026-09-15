# Relatório de Refutação Independente — Bloco F07

- **Subagente**: `REV-F07` (Grupo B de Refutação Independente)
- **ID da Plataforma**: `14e4ed37-5dc7-4fa8-a0dc-b4bb0ed23436`
- **Parent ID**: `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Início**: `2026-09-15T06:25:42-03:00`
- **Término**: `2026-09-15T06:35:10-03:00`
- **Veredito**: `ACEITO`

---

## 1. Escopo da Auditoria Adversarial

O subagente `REV-F07` auditou de forma independente e adversária a implementação do bloco **F07** (`src/helpers/useOutsidePointer.ts` e `tests/helpers/useOutsidePointer.test.ts`), entregue pelo subagente `IMP-F07`.

A auditoria teve como objetivos tentar refutar ou encontrar brechas nas seguintes garantias técnicas:
1. **Unificação de Listeners/Dispatchers**: garantia de que não há listeners globais duplicados ou redundantes (especialmente eliminação de `keydown` em `window`).
2. **Isolamento de Camadas (Stack)**: garantia de que o fechamento afeta estritamente o topo da pilha (`topOverlay`), eliminando a falha anterior em que a camada inferior era considerada parte do topo (`inside`).
3. **Clique-through e Foco**: garantia de que cliques fora fecham o topo sem dead-clicks e sem roubar o foco (`restoreFocus`) quando outro controle for ativado.
4. **Resiliência a Âncora Desconectada**: fechamento gracioso do overlay em eventos de resize/scroll quando o trigger é removido do DOM, e fallback seguro na restauração de foco.
5. **Zoom e Redimensionamento com `visualViewport`**: suporte e limpeza de listeners na API de viewport visual.
6. **Contagem Zero Absoluta de Listeners**: garantia de que a desmontagem e fechamento de múltiplas instâncias zera rigorosamente todos os listeners em `document`, `window` e `visualViewport`.

---

## 2. Bateria de Testes Adversariais Executados

Para tentar quebrar a implementação de `IMP-F07`, foram concebidos e executados 6 cenários adversariais de estresse extremo:

### Caso Adversarial 1: Stack triplo profundo com fechamento cirúrgico
- **Cenário**: 3 overlays abertos simultaneamente (`Layer 1 -> Layer 2 -> Layer 3`). O usuário clica na `Layer 2` (camada intermediária).
- **Comportamento Esperado**: Apenas a `Layer 3` deve fechar; `Layer 2` e `Layer 1` permanecem abertas. Em seguida, clique em `Layer 1` fecha apenas `Layer 2`. Por fim, clique fora fecha `Layer 1`.
- **Resultado**: Aprovado. A verificação `topOverlay.elements()` é estrita e não vaza para camadas ancestrais.

### Caso Adversarial 2: Topo não dismissable bloqueia fechamento indevido de camadas inferiores
- **Cenário**: `Layer 1` (dismissable) com `Layer 2` modal no topo (`dismissable: false`). O usuário clica fora de tudo.
- **Comportamento Esperado**: Nenhuma camada fecha. O overlay não-dismissable do topo impede que o clique fora atinja e feche camadas de baixo inadvertidamente.
- **Resultado**: Aprovado. `canDismiss` do topo é respeitado e não delega o fechamento para camadas inferiores.

### Caso Adversarial 3: Proteção contra drag/seleção de texto acidental (arraste de dentro para fora e vice-versa)
- **Cenário**: Usuário inicia `pointerdown` dentro do overlay e solta `click` fora (ex.: seleção de texto longa). Em seguida, inicia fora e solta dentro.
- **Comportamento Esperado**: Em nenhum desses dois casos o overlay deve fechar. Apenas se o ponteiro iniciar FORA e terminar FORA é que deve solicitar fechamento.
- **Resultado**: Aprovado. `startedInsideTop || isInsideTop` protege contra falso fechamento em operações de seleção e arraste.

### Caso Adversarial 4: Desmontagem em ordem aleatória/desordenada e verificação de zero vazamento de listeners
- **Cenário**: 5 instâncias abertas concorrentemente com monitoramento de resize e scroll. Desmontagem dos wrappers em ordem caótica (índices 2, 4, 0, 1, 3).
- **Comportamento Esperado**: O dispatcher global deve permanecer ativo enquanto houver >= 1 overlay aberto, mantendo contagem estável de listeners globais únicos. Ao desmontar o último, a contagem de listeners em `document` e `window` deve zerar com precisão cirúrgica (`getActiveOutsidePointerListenersCount() === 0`).
- **Resultado**: Aprovado. Todos os listeners foram removidos e a contagem zerou sem vazamento residual no DOM/window.

### Caso Adversarial 5: Destruição simultânea do trigger e do previousActiveElement
- **Cenário**: Overlay aberto; tanto o elemento trigger explícito quanto o elemento com foco anterior são destruídos e removidos do DOM. O usuário pressiona Escape.
- **Comportamento Esperado**: O fechamento deve ocorrer graciosamente sem lançar `TypeError` ou tentar invocar `.focus()` em nós desconectados.
- **Resultado**: Aprovado. Validação segura com `.isConnected` e verificação de nós no DOM.

### Caso Adversarial 6: visualViewport acionado durante reposicionamento com âncora desconectada
- **Cenário**: Simulação de zoom/redimensionamento via `window.visualViewport` enquanto o trigger é desanexado do documento.
- **Comportamento Esperado**: `handleGlobalReposition` deve interceptar que `trigger.isConnected === false`, fechar o overlay graciosamente e não disparar reposicionamento errático. Ao desmontar, listeners de `visualViewport` são 100% limpos.
- **Resultado**: Aprovado.

---

## 3. Evidências de Execução dos Gates

1. **Suíte Oficial Unitária de F07**:
   ```bash
   npx vitest run tests/helpers/useOutsidePointer.test.ts
   ```
   - **Resultado**: `13 passed (13)` em 739ms.

2. **Bateria Adversarial Independente**:
   ```bash
   npx vitest run tests/helpers/useOutsidePointer.adversarial.test.ts
   ```
   - **Resultado**: `6 passed (6)` em 715ms.

3. **Verificação de Tipos TypeScript (`vue-tsc`)**:
   ```bash
   npm run type-check
   ```
   - **Resultado**: Código de saída `0`, sem erros de tipagem.

4. **Verificação de Regressão nos Consumidores**:
   ```bash
   npx vitest run tests/components/MaxBaseOverlay.test.ts tests/components/MaxTagSelect.test.ts tests/components/MaxInputDatePicker.test.ts tests/components/MaxInputAutoComplete.test.ts tests/components/MaxPopoverMenu.test.ts tests/components/MaxUserSection.test.ts
   ```
   - **Resultado**: `5 files passed, 125 passed (125 tests)` em 2.79s.

5. **Linting e Estilo (`eslint`)**:
   ```bash
   npx eslint src/helpers/useOutsidePointer.ts tests/helpers/useOutsidePointer.test.ts
   ```
   - **Resultado**: Código de saída `0`, 0 erros, 0 warnings.

---

## 4. Conclusão e Veredito

A implementação realizada por `IMP-F07` em `src/helpers/useOutsidePointer.ts` sana rigorosamente todos os requisitos especificados para o bloco **F07**:
- Dispõe de dispatcher global unificado;
- Fecha estritamente a camada do topo da pilha;
- Não rouba foco indevidamente no clique-through;
- Trata âncoras desconectadas e fallback de foco sem exceções;
- Integra e limpa listeners em `window.visualViewport`;
- Zera rigorosamente a contagem de listeners no encerramento de todas as instâncias;
- Elimina listeners duplicados no `window`.

Veredito final: **`ACEITO`**.
