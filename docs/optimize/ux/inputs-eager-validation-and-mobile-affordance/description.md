# Validação Prematura Agressiva (Eager Validation) e Falta de Affordance Mobile em Inputs Específicos

## Contexto e Componentes Afetados
- **Componentes:** `MaxInputCpfCnpj.vue`, `MaxInputCep.vue`, `MaxInputPhone.vue`.
- **Categoria:** Inputs e formulários / Affordance e estados de feedback.
- **Severidade:** Alta.
- **Heurística Violada:** Nielsen #5 (Prevenção de Erros), Nielsen #1 (Visibilidade do Status) e Nielsen #8 (Design Estético e Minimalista).

---

## Descrição do Problema

Durante a auditoria de componentes especializados de entrada de dados, foram identificados três problemas críticos de interação humana:

### 1. Validação Agressiva no Primeiro Dígito (Eager Validation) em `MaxInputCpfCnpj`
No componente [`MaxInputCpfCnpj.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue#L125-L154), as propriedades computadas `caution` e `error_msg` avaliam a validade do documento em tempo real a cada caractere digitado:
```ts
const caution = computed(() => {
    if (props.caution !== undefined) return props.caution;
    const only_numbers = onlyNumbers(temp_value.value ?? '');
    if (only_numbers.length === 0) return false;
    return done.value === false;
});
```
Assim que o usuário digita o primeiro dígito do CPF (ex: `'1'`), `only_numbers.length === 1` (> 0). Como um dígito isolado não é um CPF válido, `done.value` torna-se `false`, disparando imediatamente `caution = true` e exibindo `"CPF inválido"` em vermelho/laranja enquanto o usuário ainda está no meio da digitação.
**Princípio de UX:** O usuário nunca deve ser acusado de cometer um erro enquanto ainda está digitando uma sequência válida em progresso. A validação deve ser adiada para o evento de `blur` ou até que a máscara esteja completa (11 dígitos para CPF, 14 para CNPJ).

### 2. Teclado Inadequado no Mobile (Falta de `inputmode="numeric"` / `inputmode="tel"`)
Nos três componentes (`MaxInputCpfCnpj`, `MaxInputCep`, `MaxInputPhone`), os inputs HTML são declarados com `type="text"` sem a declaração do atributo `inputmode="numeric"` ou `inputmode="tel"`.
Ao tocar no campo em smartphones e tablets (iOS e Android), o teclado virtual padrão aberto é o QWERTY alfanumérico com letras minúsculas, forçando o usuário a tocar no botão `123` em todos os campos para conseguir preencher CEP, CPF ou telefone.

### 3. Coerção de String Resultando no Label `"Telefonefalse"` em `MaxInputPhone`
Em [`MaxInputPhone.vue:2`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputPhone.vue#L2), há um bug evidente de interpolação:
```html
:label="props.noLabel ? undefined : props.label ?? ('Telefone' + String(props.noLabel)) "
```
Como `props.noLabel` possui o valor padrão `false`, a expressão avalia: `'Telefone' + String(false)` = **`"Telefonefalse"`**.
Todo usuário que utiliza o componente `MaxInputPhone` sem definir um rótulo customizado visualiza o texto `"Telefonefalse"` renderizado como label do campo.

### 4. Ícone de Loading Inexistente em `MaxInputCep`
Em [`MaxInputCep.vue:2`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCep.vue#L2):
```html
:icon-right="loading ? 'loading' : undefined"
```
O ícone `'loading'` não existe no repositório de ícones Iconify sem prefixo e falha silenciosamente (retorna 404 na API). Enquanto o sistema consulta a API de CEP nos bastidores, nenhum spinner é exibido, deixando o usuário sem qualquer feedback de espera.

---

## Evidência no Código

1. [`MaxInputCpfCnpj.vue:125-130`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue#L125-L130): Validação disparada em qualquer string com tamanho > 0.
2. [`MaxInputPhone.vue:2`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputPhone.vue#L2): `('Telefone' + String(props.noLabel))` gerando `"Telefonefalse"`.
3. [`MaxInputCep.vue:2`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCep.vue#L2) e [`MaxInputCep.vue:3`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCep.vue#L3): ausência de `inputmode="numeric"` e ícone inválido `:icon-right="loading ? 'loading' : undefined"`.

---

## Impacto na Experiência do Usuário (UX)

1. **Ansiedade e Irritação Visual:** Ver uma advertência de erro a cada letra/número digitado confunde o usuário e gera a falsa impressão de que seu documento foi rejeitado de antemão.
2. **Fricção Móvel Grave:** Ter que alternar manualmente o teclado virtual de letras para números em múltiplos campos numéricos dobra o tempo e os toques necessários para completar um cadastro móvel.
3. **Percepção de Amadorismo do Produto:** Exibir o rótulo `"Telefonefalse"` degrada a credibilidade visual da interface diante do cliente final.

---

## Recomendações de Solução

1. **Validação Lazy ou Condicionada ao Término da Máscara:**
   - Em `MaxInputCpfCnpj`, ativar o estado de erro apenas quando o campo sofrer `blur` (após ser tocado pelo usuário) ou quando atingir os 11 ou 14 dígitos e o algoritmo de verificação falhar.
2. **Atributos de Entrada Mobile:**
   - Adicionar `inputmode="numeric"` em `MaxInputCpfCnpj`, `MaxInputCep` e `MaxInputCreditCard`.
   - Adicionar `type="tel"` e `inputmode="tel"` em `MaxInputPhone`.
3. **Correção do Label Default em `MaxInputPhone`:**
   - Corrigir a expressão do label para `props.label ?? 'Telefone'`.
4. **Substituição do Spinner de Loading:**
   - Em `MaxInputCep`, substituir `'loading'` por um componente spinner real ou ícone válido como `svg-spinners:180-ring` ou `line-md:loading-loop`.
