# Revisão Adversarial — Lotes de Interações e Semântica (Lotes 02 e 03)

- **Revisor:** `REV7-INTERACOES`
- **Lotes Auditados:** Lote 02 (`IMP7-L02`), Lote 03 (`IMP7-L03`)
- **Commit Avaliado (Lote 02):** `c1293286`

## 1. Verificações Adversariais — Lote 02
- **Fechamento Síncrono e Race Conditions (`F07/E04-02`):** Testado acionamento rápido de dois cliques anteriores a `nextTick` e cliques fora do container em Chromium real. Confirmado que listeners globais são removidos síncronamente e o estado interno não permite acionamento de `onClose` redundante.
- **Pilha de Foco e Escape Concorrente (`R07/E04-04`):** Verificada pilha aninhada A→B→A com reversão ao trigger. O componente filho absorve o Escape sem fechar o pai inadvertidamente.
- **Offsets de Viewport e Zoom (`R09/E04-06`, `R09/E04-07`):** Testado clamp com viewports restritas (280px e 320px), rotação de landscape e zoom de 200%. Nenhum z-index arbitrário (`z-index: 9999`) é utilizado.
- **Acessibilidade de Botão e Ícones (`F15/E06-03`, `E08-04`):** Confirmada presença obrigatória de `aria-label` descritivo para ícones não mapeados e suporte padrão de botão acessível em `MaxTagSelect`.

## 2. Parecer do Lote 02
Aprovado com distinção no ambiente Chromium real e suíte unitária.

## 3. Verificações Adversariais — Lote 03
- **Commit Avaliado (Lote 03):** `865dda7f`
- **Tentativa de Injeção de Desconexão ARIA (`R04/E03-02`):** Testada remoção forçada de atributos. Confirmado que a matriz de 25 famílias associa perfeitamente label (`for`/`id`), `aria-required`, `aria-invalid` e `aria-describedby` somente quando a mensagem correspondente existe.
- **Contratos e Listbox em Scroller (`F14/E06-01`, `F14/E06-02`):** Testada emissão rápida de eventos de teclado (setas para cima/baixo, Home, End) com scroll virtualizado longo. Confirmado que `aria-activedescendant` acompanha com fidelidade o item focado e atende a todas as diretrizes axe-core.
- **Submissão Única e Live Regions (`R14/E09-01`):** Confirmado que `MaxAuthCard` não intercepta o formulário nativo com duplo `@submit.prevent` nem cria múltiplas regiões vivas concorrentes para a mesma mensagem.

## 4. Parecer Final dos Lotes 02 e 03 (Onda A)
Ambos os lotes foram aprovados sem desvios, mocks indevidos ou enfraquecimento de assertivas.
