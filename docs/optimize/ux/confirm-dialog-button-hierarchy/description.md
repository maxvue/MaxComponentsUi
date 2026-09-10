# Ausência de Hierarquia Visual e Risco em Diálogos de Confirmação (`MaxPopoverConfirm`)

## Contexto e Componentes Afetados
- **Componentes:** `MaxPopoverConfirm.vue`, `MaxButtonConfirm.vue`, `MaxIconConfirm.vue`, `src/stores/useConfirm.Store.ts`.
- **Categoria:** Ações e botões / Prevenção de perda de dados e segurança em ações destrutivas.
- **Severidade:** Alta.
- **Heurística Violada:** Nielsen #5 (Prevenção de Erros), Nielsen #4 (Consistência e Padrões) e Nielsen #8 (Design Estético e Minimalista).

---

## Descrição do Problema

Em diálogos de confirmação disparados por botões ou ícones para ações críticas (ex: exclusão de registros, cancelamento de propostas, descarte de alterações), o componente [`MaxPopoverConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPopoverConfirm.vue#L22-L25) renderiza os botões "Não" e "Sim" com exatamente o mesmo peso visual e estilo padrão de botão primário preenchido (`MaxButton` default com fundo azul/marca):

```html
<MaxGrid class="popover-confirm-actions">
    <MaxButton class="popover-confirm-btn" :action="reject" :label="confirm_store.rejectProps.label" :icon="confirm_store.rejectProps.icon" />
    <MaxButton class="popover-confirm-btn" :action="accept" :label="confirm_store.acceptProps.label" :icon="confirm_store.acceptProps.icon" />
</MaxGrid>
```

Além disso, a interface [`ConfirmProps`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/types/index.ts#L192-L209) não permite configurar a severidade (`severity`) ou variante (`variant`) dos botões de rejeição e aceitação, engessando ambas as ações no mesmo formato visual.

---

## Evidência no Código

1. Em [`MaxPopoverConfirm.vue:22-25`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPopoverConfirm.vue#L22-L25), nenhum `severity` ou `variant` é repassado aos botões de ação.
2. Em [`MaxButton.vue:126-128`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L126-L128), o botão sem `severity`/`variant` recebe estilo primário sólido:
   ```scss
   background: var(--max-primary-500);
   color: #fff;
   border-color: var(--max-primary-500);
   ```
3. Em [`types/index.ts:192-209`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/types/index.ts#L192-L209), a tipagem aceita apenas `label`, `icon` e `action`:
   ```ts
   export interface ConfirmProps {
       message?: string;
       messageIcon?: string | null;
       rejectProps?: { label: string; icon?: string; action?: (event?: any) => void };
       acceptProps?: { label: string; icon?: string; action?: (event?: any) => void };
   }
   ```
4. Em [`MaxPopoverConfirm.vue:164-166`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPopoverConfirm.vue#L164-L166), o ícone é fixado com cor vermelha (`color: var(--red-600)`), mesmo para confirmações não destrutivas (ex.: "Deseja salvar as alterações?"), gerando dissonância cognitiva com os dois botões azuis idênticos.

---

## Impacto na Experiência do Usuário (UX)

1. **Risco Crítico de Ação Acidental:** Quando os botões de cancelar ("Não") e confirmar ("Sim") possuem a mesma cor, forma e destaque, o usuário pode clicar no botão errado por memória motora ou pressa, disparando exclusões irreversíveis.
2. **Carga Cognitiva Elevada:** O usuário é forçado a ler atentamente os dois botões a cada clique porque não há pista visual imediata (affordance) indicando qual botão é seguro e qual é a ação destrutiva.
3. **Falta de Semântica Visual:** Boas práticas de Design System exigem que a ação de recusa/cancelamento seja secundária (outline ou text) e que ações perigosas usem destaque de perigo (`severity="danger"`).

---

## Recomendações de Solução

1. **Hierarquia Padrão Segura:**
   - O botão `reject` ("Não") deve ter variante secundária ou outline por padrão: `:variant="'outlined'"` ou `:severity="'secondary'"`.
   - O botão `accept` ("Sim") deve refletir o teor da ação: permitir definir `:severity="props.severity ?? 'danger'"` para ações destrutivas ou `'primary'` para fluxos normais.
2. **Extensão de `ConfirmProps`:**
   - Adicionar propriedades `severity` e `variant` em `rejectProps` e `acceptProps`.
3. **Ícone Semântico Configurável:**
   - Adequar a cor do ícone do popover (`messageIcon`) ao tipo de mensagem (perigo = vermelho, pergunta/aviso = âmbar/azul), evitando ícone vermelho fixo com botões azuis em qualquer pergunta.
