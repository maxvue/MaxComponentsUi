# Fricção Severa em Navegação de Datas Históricas e Falta de Limites no DatePicker (`MaxInputDatePicker`)

## Contexto e Componentes Afetados
- **Componentes:** `MaxInputDatePicker.vue`.
- **Categoria:** Inputs e formulários / Affordance e usabilidade.
- **Severidade:** Alta.
- **Heurística Violada:** Nielsen #7 (Flexibilidade e Eficiência de Uso) e Nielsen #5 (Prevenção de Erros).

---

## Descrição do Problema

O componente de calendário [`MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue) foi desenvolvido com controle exclusivo de avanço e recuo mensal único:

```html
<div class="max-datepicker-header">
    <button type="button" class="max-datepicker-nav-btn" @click.stop="prevMonth">
        <MaxIcon icon="lucide:chevron-left" size="1.1" />
    </button>
    <div class="max-datepicker-title">
        {{ monthNames[currentMonth] }} {{ currentYear }}
    </div>
    <button type="button" class="max-datepicker-nav-btn" @click.stop="nextMonth">
        <MaxIcon icon="lucide:chevron-right" size="1.1" />
    </button>
</div>
```

### 1. Inviabilidade Prática para Seleção de Datas Históricas
Não há seletor de anos, visualização de décadas ou dropdown de meses rápidos.
Para selecionar uma data de nascimento comum em cadastros de clientes (ex.: 15 de maio de 1985), partindo do ano corrente (2026), o usuário precisaria clicar **492 vezes** no botão de mês anterior!
O título central (`monthNames[currentMonth] currentYear`) é um texto estático não interativo.

### 2. Ausência de Limites de Data (`minDate` e `maxDate`)
O componente não possui propriedades de contenção como `minDate` ou `maxDate`.
Em fluxos onde datas futuras são terminantemente proibidas (como data de nascimento ou data de emissão de documento), ou onde datas passadas são inválidas (como agendamentos, vencimentos ou propostas), o calendário permite a seleção de qualquer dia do passado ou futuro sem qualquer restrição visual (nenhum dia fica desabilitado).

---

## Evidência no Código

1. [`MaxInputDatePicker.vue:35-45`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue#L35-L45): Apenas as funções `prevMonth` e `nextMonth` existem para alterar o período exibido.
2. [`MaxInputDatePicker.vue:97-146`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue#L97-L146): Inexistência de props `minDate`, `maxDate`, `view` ('date' | 'month' | 'year') ou `yearNavigator`.
3. [`MaxInputDatePicker.vue:53-68`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue#L53-L68): Cada célula de dia calcula apenas `is-other-month`, `is-selected` e `is-today`, sem checagem de intervalo permitido (`is-disabled`).

---

## Impacto na Experiência do Usuário (UX)

1. **Abandono de Fluxos de Cadastro:** Usuários que tentam preencher datas distantes desistem de usar o seletor visual e são forçados a digitar manualmente. Se a máscara falhar ou for contra-intuitiva, o cadastro trava.
2. **Erros de Validação Desnecessários:** Permitir que o usuário clique em uma data de agendamento no passado para só depois dizer que a data é inválida é uma falha elementar de prevenção de erros no design de interface.

---

## Recomendações de Solução

1. **Navegador Rápido de Mês e Ano (Year/Month Picker):**
   - Tornar o título do cabeçalho clicável para alternar entre as visões: Dias -> Meses do Ano -> Grade de Anos (década).
   - Ou adicionar dois selects compactos no cabeçalho para selecionar diretamente o Ano e o Mês.
2. **Propriedades `minDate` e `maxDate`:**
   - Adicionar `minDate?: Date | string` e `maxDate?: Date | string`.
   - Desabilitar visualmente os dias fora do limite permitido (`disabled`, opacidade reduzida, cursor `not-allowed`) e ignorar eventos de clique nessas células.
3. **Botão de Atalho "Hoje" / "Limpar":**
   - Fornecer rodapé opcional no painel com botões "Hoje" (seleciona a data atual) e "Limpar" (reseta o valor).
