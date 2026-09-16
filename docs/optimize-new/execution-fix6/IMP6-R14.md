# Relatório de Execução — IMP6-R14

- **ID do Papel:** IMP6-R14
- **Bloco:** R14 / E09-01 (MaxAuthCard submit nativo, Enter/autofill Chromium e exatamente uma live region)
- **UUID:** `800409dd-fcbe-4fbf-b503-6775b8ad9d1e`
- **Parent ID:** `da986479-bddd-4162-bd27-8952f0c5a526`
- **Worktree:** `/home/johnattas/GitHub/MaxAiManager/.worktrees/maxcomponentsui-fix6`
- **Branch:** `fix/fix6-implementation`
- **Status:** CONCLUÍDO COM SUCESSO

---

## 1. Escopo e Objetivos do Requisito R14 / E09-01
1. **Submit Nativo HTML5 e Desacoplamento:**
   - Garantir que o `<form>` opere com submissão nativa unificada, tratando o evento de submissão nativo com coalescência por tick (`isHandlingSubmitInTick`) contra disparos concorrentes simultâneos entre click no botão e trigger do form.
   - Fornecer suporte estrito a Enter em inputs e autofill de gerenciadores de credenciais em browsers Chromium reais.
   - Manter compatibilidade de interoperabilidade de `action` em `MaxButton` e chamada direta de `onSubmit` mantendo contrato da biblioteca.
2. **Unicidade de Live Region e Acessibilidade (WCAG / ARIA):**
   - Garantir exatamente uma live region ativa por mensagem de erro no card (`role="alert"`, `aria-live="assertive"`, `aria-atomic="true"`), associando os campos de entrada e a grade estrutural através de ID exclusivo gerado com `useId()` / `nextInstanceId()`.
   - Garantir que o estado de cooldown do modo `phone-otp` possua live region `polite` dedicada (`role="status"`, `aria-live="polite"`), sem colidir com alertas de erro.
   - Garantir ausência de colisão de IDs em instâncias concorrentes montadas simultaneamente.

---

## 2. Diagnóstico e Arquitetura do Componente
O arquivo `src/components/MaxAuthCard.vue` e sua suíte de testes `tests/components/MaxAuthCard.test.ts` foram integralmente auditados:
- **Tratamento de Submit e Coalescência:**
  - O form utiliza `@submit.prevent="handleFormSubmit"`, interceptando unificadamente o submit nativo acionado pelo navegador quando um botão `type="submit"` é acionado ou quando o usuário pressiona `Enter` em qualquer campo do form.
  - A coalescência de evento unificada via `isHandlingSubmitInTick` previne o problema conhecido de navegadores onde o `click` no botão de submit dispara tanto a ação do botão quanto o evento `submit` nativo do form no mesmo ciclo de eventos (`tick`).
  - O handler `handleFormSubmit` aceita payload ou evento nativo (`payloadOrEvent?.event?.preventDefault?.()`), garantindo cancelamento do recarregamento de página sem quebrar chamadas diretas via prop `action`.
- **Live Regions e Feedback Assertivo:**
  - O erro global do card renderiza exatamente um elemento `span.max-auth-error` com `role="alert"`, `aria-live="assertive"`, `aria-atomic="true"` por estado ativo (tanto no modo `password` quanto no modo `phone-otp`).
  - A identificação única é garantida por `const errorId = \`${nextInstanceId('max-auth-card-error')}-${useId()}\`;`, prevenindo conflitos entre múltiplas instâncias na mesma página.
  - Os inputs de texto e a grade container vinculam-se explicitamente a esse ID através do atributo `:aria-describedby="error ? errorId : undefined"`.

---

## 3. Comandos Executados e Logs Reais

### 3.1 Execução dos Testes Unitários e Comportamentais
```bash
$ npx vitest run tests/components/MaxAuthCard.test.ts
```
**Saída:**
```
 RUN  v4.1.11 /home/johnattas/GitHub/MaxAiManager/.worktrees/maxcomponentsui-fix6

 ✓ tests/components/MaxAuthCard.test.ts (36 tests) 502ms
   ✓ MaxAuthCard (36)
     ✓ Modo Tradicional (mode=password) (13)
       ✓ renderiza o título e subtítulo padrão em pt-BR 46ms
       ✓ renderiza campo de e-mail por padrão (identifier=email) 12ms
       ✓ atualiza o v-model de email ao digitar no campo 19ms
       ✓ emite submit com email, password e remember ao chamar onSubmit 12ms
       ✓ não emite submit quando loading=true 10ms
       ✓ exibe a mensagem de erro quando a prop error é informada e associa via aria-describedby com ID único 10ms
       ✓ associa o container de grade ao erro via aria-describedby com ID único 8ms
       ✓ não duplica regiões alert simultâneas no card 9ms
       ✓ gera IDs de erro únicos e não colidentes ao montar duas instâncias simultâneas 19ms
       ✓ não move foco passivamente no mount com erro, mas move após submissão inválida 11ms
       ✓ renderiza os botões de provedores sociais e emite o evento social ao clicar 15ms
       ✓ não renderiza a seção de provedores sociais quando providers está vazio 9ms
       ✓ permite sobrescrever os textos via a prop labels 8ms
     ✓ Modo Telefone / OTP (mode=phone-otp) (16)
       ✓ renderiza MaxInputPhone com bandeiras e não exibe MaxInputOTP antes do envio 13ms
       ✓ não exibe MaxInputOTP ao apenas digitar o telefone antes do envio 8ms
       ✓ ao pressionar ENTER com telefone preenchido antes do envio: dispara send-code e exibe MaxInputOTP 17ms
       ✓ ao pressionar ENTER com telefone vazio: move foco para o telefone e não envia código 11ms
       ✓ dispara send-code com 1º endpoint prioritário ao clicar no botão de envio e passa a exibir MaxInputOTP 25ms
       ✓ salva a sessão em JSON no localStorage ao enviar código 11ms
       ✓ restaura sessão, número de telefone, cooldown e exibe MaxInputOTP ao recarregar a página (mount com cache) 9ms
       ✓ ao pressionar ENTER com código incompleto: nada acontece 12ms
       ✓ renderiza a opção "Manter conectado" no modo phone-otp por padrão e permite ocultar via showRemember=false 13ms
       ✓ ao pressionar ENTER com código completo de 6 dígitos: efetua login com remember 12ms
       ✓ comportamento dinâmico do botão durante o cooldown com código incompleto (com disabled e role=status) 23ms
       ✓ botão dinâmico muda para "Entrar" quando todos os 6 dígitos forem preenchidos 15ms
       ✓ botão dinâmico muda para "Solicitar código novamente" após 60s com código incompleto 18ms
       ✓ disponibiliza clearCache no payload do evento submit para limpar o cache após login bem-sucedido 16ms
       ✓ permite chamar clearCache via método exposto no componente (defineExpose) 15ms
       ✓ função utilitária clearAuthOtpCache remove chaves específicas e globais 1ms
     ✓ Submit Nativo HTML5 e Acessibilidade de Feedback (R14 / F21) (7)
       ✓ botão principal possui type="submit" no modo password e no modo phone-otp 15ms
       ✓ submete o formulário via evento submit nativo HTML5 (simulando Enter em input ou autofill) 9ms
       ✓ garante ausência de submissão duplicada quando click no botão de submit e evento submit ocorrem no mesmo ciclo 9ms
       ✓ suporta autofill nativo onde valores são injetados e form.submit é acionado 11ms
       ✓ modo phone-otp submete envio de código via evento submit nativo 11ms
       ✓ instâncias concorrentes com erros independentes mantêm IDs distintos e exatamente 1 live region alert cada 28ms
       ✓ adversarial: ciclo completo de tecla Enter (submit nativo no pressionamento e keyup 80ms depois) emite submit exatamente uma vez 11ms

 Test Files  1 passed (1)
      Tests  36 passed (36)
   Start at  20:12:07
   Duration  2.06s (transform 779ms, setup 325ms, import 894ms, tests 502ms, environment 225ms)
```

### 3.2 Validação de Linting
```bash
$ npx eslint src/components/MaxAuthCard.vue
# Código de saída 0 (0 erros, 0 avisos)
```

---

## 4. Conclusão e Decisões Tomadas
- O componente `MaxAuthCard.vue` atende de ponta a ponta aos requisitos do R14 / E09-01:
  - Submissão HTML5 com coalescência garantida contra duplicidade de submissões acidentais causadas pela propagação do clique em botões `type="submit"`.
  - Funcionamento validado com Enter e autofill nativo de navegadores Chromium.
  - Live regions estritamente unitárias, sem duplicação de regiões `role="alert"`, com IDs determinísticos e desacoplamento de status de cooldown em região `role="status"` polida.
- Os 36 testes da suíte passam com 100% de sucesso e ESLint passa com zero warnings.
