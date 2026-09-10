# Desaparecimento Forçado de Erros Críticos e Truncamento de Mensagens no Toast (`MaxToast`)

## Contexto e Componentes Afetados
- **Componentes:** `MaxToast.vue`, `src/stores/useToast.Store.ts`.
- **Categoria:** Overlays e feedback / Estados de feedback (error, caution, loading).
- **Severidade:** Alta.
- **Heurística Violada:** Nielsen #1 (Visibilidade do Status do Sistema), Nielsen #9 (Ajudar usuários a reconhecer e recuperar-se de erros) e Diretrizes WCAG 2.2.4 (Tempo Ajustável).

---

## Descrição do Problema

O sistema de notificações rápidas [`MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxToast.vue) e sua store [`useToast.Store.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/stores/useToast.Store.ts) possuem duas deficiências sérias de experiência do usuário:

1. **Impossibilidade de Toast Persistente (Sticky Toast):**
   Em sistemas corporativos, mensagens de erro crítico (ex.: falha de autorização, transação bancária rejeitada, erro de conexão com API) não devem sumir sozinhas, exigindo clique de confirmação do usuário (`duration: 0`). No entanto, a função `startTimer` na store possui um clamp mínimo forçado:
   ```ts
   const startTimer = (toast: ToastItem, delay?: number): void => {
       const targetDelay = delay ?? toast.remaining;
       const ms = Math.max(targetDelay, 500);
       toast.timerId = setTimeout(() => remove(toast.id), ms);
       toast.paused = false;
   };
   ```
   Se a aplicação passar `duration: 0` intencionalmente para tornar o erro persistente, o código calcula `Math.max(0, 500) = 500ms`, fazendo o toast desaparecer em meio segundo!

2. **Truncamento Agressivo de Título e Mensagem:**
   No CSS do [`MaxToast.vue:158-176`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxToast.vue#L158-L176):
   - O título possui `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`.
   - A mensagem possui `-webkit-line-clamp: 2; overflow: hidden;`.
   Não há mecanismo de "Ver mais", tooltip para texto expandido ou cópia do erro. Se uma mensagem de erro contiver 3 ou mais linhas (ex.: detalhes de validação ou resposta de servidor), o usuário perde informações cruciais para entender o que deu errado.

3. **Limpeza Indesejada no Desmonte:**
   Em `MaxToast.vue:65-67`, `onBeforeUnmount(() => toastStore.clear())` limpa toda a fila de toasts se o componente desmontar (por exemplo, durante transições de layout ou rotas), descartando feedbacks de sucesso ou erro que deveriam persistir entre telas.

---

## Evidência no Código

1. [`src/stores/useToast.Store.ts:65-70`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/stores/useToast.Store.ts#L65-L70):
   ```ts
   const targetDelay = delay ?? toast.remaining;
   const ms = Math.max(targetDelay, 500);
   toast.timerId = setTimeout(() => remove(toast.id), ms);
   ```
2. [`src/components/MaxToast.vue:158-177`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxToast.vue#L158-L177):
   ```scss
   .max-toast-title {
       white-space: nowrap;
       overflow: hidden;
       text-overflow: ellipsis;
   }
   .max-toast-message {
       display: -webkit-box;
       -webkit-line-clamp: 2;
       -webkit-box-orient: vertical;
       overflow: hidden;
   }
   ```

---

## Impacto na Experiência do Usuário (UX)

1. **Perda de Diagnóstico:** Usuários que recebem falhas críticas não conseguem ler o erro a tempo (desaparece em 4 segundos ou em 500ms se configurado com 0), gerando ansiedade e impossibilidade de reportar o problema ao suporte.
2. **Corte de Contexto em Telas Menores:** Títulos informativos como "Falha ao gerar proposta comercial do cliente" são cortados na metade ("Falha ao gerar proposta com..."), forçando o usuário a adivinhar o objeto da falha.
3. **Violação de Acessibilidade (WCAG):** Pessoas com dificuldades de leitura, dislexia ou deficiência motora não têm tempo hábil para processar mensagens efêmeras de erro.

---

## Recomendações de Solução

1. **Suporte a `duration: 0` (Persistência):**
   - Na store, se `toast.duration === 0`, não agendar o timer de auto-remoção e ocultar a barra de progresso. O toast deve permanecer até o usuário clicar no botão de fechar.
   - Definir `duration: 0` como recomendação ou padrão para severidade `'error'`.
2. **Expansão de Mensagens Longas:**
   - Permitir clique na mensagem para expandir ("Ver mais / Ver menos") ou exibir tooltip quando houver truncamento via ellipsis.
   - Fornecer botão discreto de "Copiar mensagem" para facilitar abertura de chamados técnicos.
3. **Remover `toastStore.clear()` do `onBeforeUnmount`:**
   - Toasts devem ter ciclo de vida global da aplicação, permanecendo visíveis após redirecionamentos de rota (ex: redirecionar para tela de login com toast de sucesso "Conta criada com sucesso").
