# Documentação Técnica: Inputs Semânticos do Max Components UI

Este documento descreve os dez componentes de entrada semântica adicionados à biblioteca `@maxvue/max-components-ui`:

1. **Seletores Semânticos (baseados em `MaxInputSelect` e `InputBase`)**:
   - `MaxInputEntity`
   - `MaxInputGender`
   - `MaxInputWeekday`
   - `MaxInputMonth`
   - `MaxInputTime`
   - `MaxInputYear`

2. **Entradas Textuais Semânticas (baseadas em `InputBase` e `useInputValidation`)**:
   - `MaxInputEmail`
   - `MaxInputUrl`
   - `MaxInputPassword`
   - `MaxInputSlug`

---

## 1. Princípios Arquiteturais e Responsabilidades

- **Desacoplamento de Backend**: Os componentes fornecem validação e contratos tipados de interface no cliente. Não realizam requisições HTTP diretas nem consultas remotas de unicidade ou autorização.
- **Responsabilidade do MaxPinia**: As telas consumidoras utilizam stores `@maxvue/max-pinia` para operações de GET, cache e salvamento debounced (`options.save`). Os componentes semânticos não encapsulam chamadas de rede nem persistem segredos em cache local.
- **Segurança de Senha e Credenciais**: O `MaxInputPassword` realiza confirmação literal contra `targetValue` sem expor o valor secreto em mensagens de feedback, atributos ARIA, títulos ou texto do DOM. Não armazena senhas em storage ou loggers.
- **Acessibilidade**: Todos os campos conectam rótulos via `<label :for="inputId">`, atributos ARIA (`aria-describedby`, `aria-required`, `aria-invalid`, `aria-label`, `aria-pressed`), suportam navegação por teclado e estados `disabled`.
- **Formatação de Template**: Conforme diretrizes canônicas, tags de abertura são mantidas estritamente em uma única linha no template.

---

## 2. Seletores Semânticos

### 2.1. `MaxInputEntity`
- **Finalidade**: Selecionar tipo de entidade (Pessoa Física ou Pessoa Jurídica).
- **Valores aceitos**: `'PF' | 'PJ' | null`.
- **Rótulo padrão**: `'Entidade'`.
- **Placeholder padrão**: `'Selecione o tipo de entidade'`.
- **Opções fixas**:
  - `{ value: 'PF', label: 'Pessoa Física', name: 'Pessoa Física' }`
  - `{ value: 'PJ', label: 'Pessoa Jurídica', name: 'Pessoa Jurídica' }`
- **Exemplo de uso**:
```html
<MaxInputEntity v-model="form.entityType" label="Tipo de Pessoa" clearable />
```

### 2.2. `MaxInputGender`
- **Finalidade**: Selecionar gênero biológico/cadastral.
- **Valores aceitos**: `'M' | 'F' | null`.
- **Rótulo padrão**: `'Gênero'`.
- **Placeholder padrão**: `'Selecione o gênero'`.
- **Opções fixas**:
  - `{ value: 'M', label: 'Masculino', name: 'Masculino' }`
  - `{ value: 'F', label: 'Feminino', name: 'Feminino' }`
- **Exemplo de uso**:
```html
<MaxInputGender v-model="form.gender" clearable />
```

### 2.3. `MaxInputWeekday`
- **Finalidade**: Selecionar dia da semana para agendamentos ou rotinas.
- **Valores aceitos**: `'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null`.
- **Rótulo padrão**: `'Dia da semana'`.
- **Placeholder padrão**: `'Selecione o dia da semana'`.
- **Opções fixas (ordem segunda a domingo)**:
  - Segunda-feira (`'monday'`) até Domingo (`'sunday'`).
- **Exemplo de uso**:
```html
<MaxInputWeekday v-model="schedule.weekday" clearable />
```

### 2.4. `MaxInputMonth`
- **Finalidade**: Selecionar mês calendário com valor estritamente numérico.
- **Valores aceitos**: `1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null`.
- **Rótulo padrão**: `'Mês'`.
- **Placeholder padrão**: `'Selecione o mês'`.
- **Opções**: Janeiro (`1`) a Dezembro (`12`). Emite e aceita números inteiros.
- **Exemplo de uso**:
```html
<MaxInputMonth v-model="filter.month" clearable />
```

### 2.5. `MaxInputTime`
- **Finalidade**: Seleção de horário independente de data ou fuso horário.
- **Valores aceitos**: `string | null` no formato `HH:mm`.
- **Props específicas**:
  - `minTime?: string` (padrão `'00:00'`)
  - `maxTime?: string` (padrão `'23:59'`)
  - `stepMinutes?: number` (padrão `30`, intervalo válido 1 a 1440)
- **Rótulo padrão**: `'Horário'`.
- **Placeholder padrão**: `'Selecione o horário'`.
- **Comportamento**: Gera horários entre `minTime` e `maxTime` com passo de `stepMinutes`. Se a faixa for inválida ou invertida, a lista permanece vazia sem loop.
- **Exemplo de uso**:
```html
<MaxInputTime v-model="appointment.time" min-time="08:00" max-time="18:00" :step-minutes="15" clearable />
```

### 2.6. `MaxInputYear`
- **Finalidade**: Seleção de ano com faixa controlada.
- **Valores aceitos**: `number | null` (inteiro entre 1 e 9999).
- **Props específicas**:
  - `minYear?: number` (padrão: ano corrente - 1)
  - `maxYear?: number` (padrão: ano corrente + 1)
- **Rótulo padrão**: `'Ano'`.
- **Placeholder padrão**: `'Selecione o ano'`.
- **Exemplo de uso**:
```html
<MaxInputYear v-model="filter.year" :min-year="2020" :max-year="2030" clearable />
```

---

## 3. Entradas Textuais Semânticas

### 3.1. `MaxInputEmail`
- **Finalidade**: Entrada de e-mail com validação estrita via `@maxvue/max-use`.
- **Configurações nativas**: `type="email"`, `inputmode="email"`, `autocomplete="email"` (com `suggestions`), `spellcheck="false"`, `autocapitalize="none"` (padrão sem `suggestions` é `autocomplete="off"`).
- **Preservação de caracteres**: Mantém caixa original e formato digitado (incluindo plus addressing como `usuario+filtro@empresa.com`).
- **Validação**: Valida após blur ou submit. Neutro se vazio e opcional. Exibe `'Campo obrigatório'` se vazio e required. Exibe `'E-mail inválido'` se formato incorreto.
- **Exemplo de uso**:
```html
<MaxInputEmail v-model="user.email" required />
```

### 3.2. `MaxInputUrl`
- **Finalidade**: Entrada de URLs HTTP/HTTPS com validação via `URL` nativa.
- **Configurações nativas**: `type="url"`, `inputmode="url"`, `autocomplete="url"` (com `suggestions`), `spellcheck="false"`, `autocapitalize="none"` (padrão sem `suggestions` é `autocomplete="off"`).
- **Regras de validação**:
  - Aceita apenas esquemas `http:` e `https:`.
  - Exige hostname válido (suporta domínios, `localhost`, endereços IP e portas).
  - Rejeita URLs relativas, sem protocolo, esquemas executáveis (`javascript:`, `data:`), credenciais embutidas (`user:pass@`) ou espaços em branco.
- **Exemplo de uso**:
```html
<MaxInputUrl v-model="provider.apiUrl" placeholder="https://api.openai.com/v1" required />
```

### 3.3. `MaxInputPassword`
- **Finalidade**: Entrada segura de senha com botão de alternância de visibilidade e confirmação.
- **Props específicas**:
  - `toggleVisibility?: boolean` (padrão `true`): Exibe botão com ícone de olho para revelar/ocultar senha.
  - `autocomplete?: string` (padrão `'off'`, ou `'current-password'` com a prop `suggestions`; utilize `'new-password'` em formulários de cadastro ou redefinição).
  - `minLength?: number`: Valida comprimento mínimo da senha.
  - `targetValue?: string`: Valor para confirmação de senha. Comparação literal estrita (sensível a caixa, acentos e espaços).
- **Segurança**: A mensagem de erro em caso de divergência é sempre a constante `'As senhas não coincidem'`. O valor esperado NUNCA é injetado no DOM ou na mensagem de erro.
- **Exemplo de uso**:
```html
<MaxInputPassword v-model="auth.password" autocomplete="new-password" :min-length="8" required />
<MaxInputPassword v-model="auth.passwordConfirm" label="Confirme a Senha" :target-value="auth.password" autocomplete="new-password" required />
```

### 3.4. `MaxInputSlug`
- **Finalidade**: Identificador amigável em URLs no formato kebab-case.
- **Formato obrigatório**: `^[a-z0-9]+(?:-[a-z0-9]+)*$` (apenas letras minúsculas, números e hífens simples internos).
- **Props específicas**:
  - `normalizeOnBlur?: boolean` (padrão `false`): Quando ativado, executa `slugify` do `@maxvue/max-use` no evento de blur caso haja caracteres especiais ou maiúsculas, atualizando o modelo automaticamente.
- **Exemplo de uso**:
```html
<MaxInputSlug v-model="project.slug" normalize-on-blur placeholder="meu-novo-projeto" required />
```

---

## 4. Métodos Expostos nos Componentes Textuais

Todos os quatro componentes textuais implementam `defineExpose`:
- `focus(options?: FocusOptions): void`
- `setFocus(): void`

---

## 5. Cuidados em Server-Side Rendering (SSR)

- Os componentes foram implementados sem acesso a `window` ou `document` durante a fase de avaliação do módulo ou setup inicial.
- No `MaxInputYear`, o ano de referência é capturado na inicialização da instância no cliente. Em ambientes SSR onde o servidor e o cliente podem executar em fusos horários ou datas limítrofes diferentes, informe explicitamente `minYear` e `maxYear` nas props.

---

## 6. Checklist de Adoção Futura nas Aplicações

Para adotar os novos componentes nas aplicações do ecossistema Max (`Engeapp`, `MaxAiManager`, `SocialMedia`):

1. **Substituição de Selects Manuais de Entidade e Gênero**:
   - Substituir `MaxInputSelect` com options estáticas em `ClientProjectData.vue` por `MaxInputEntity` e `MaxInputGender`.
2. **Substituição de Campos de E-mail e Senha**:
   - Em `ResetPasswordPage.vue`, `ForgotPassword.vue` e `Register.vue`, substituir `MaxInputText` por `MaxInputEmail` e `MaxInputPassword`.
   - Conectar confirmação via `:target-value="password"`.
3. **Substituição de Campos de URL de Provedores e Redes**:
   - Em `ModalAiProvider.vue` e `ThemeContentList.vue`, adotar `MaxInputUrl`.
4. **Agendamento no SocialMedia**:
   - Em `ThemeScheduleBuilder.vue` e `TabCalendar.vue`, utilizar `MaxInputTime`, `MaxInputWeekday`, `MaxInputMonth` e `MaxInputYear`.
