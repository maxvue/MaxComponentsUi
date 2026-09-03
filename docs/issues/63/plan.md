# Plano de Implementação — Issue #63

## Descrição e Causa Raiz

### Problema Relatado
No componente [`MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-63/src/components/MaxInputDatePicker.vue), o watcher reativo responsável por sincronizar a propriedade `modelValue` com o estado interno `internalDate` e o texto exibido `displayValue` tenta converter strings em objetos `Date` nativos concatenando `'T00:00:00'` caso o valor recebido não contenha `'T'` nem espaço (`new Date(typeof val === 'string' && !val.includes('T') && !val.includes(' ') ? val + 'T00:00:00' : val)`).

Quando uma data no formato brasileiro `DD/MM/YYYY` (ex.: `'15/05/2026'`, que é o formato padrão do próprio componente e amplamente utilizado em formulários no Brasil) é passada no `modelValue` / `v-model`, a expressão executa `new Date('15/05/2026T00:00:00')`. Nos motores JavaScript modernos (V8 / Node / browsers), essa construção resulta em `Invalid Date` (`NaN`), pois o parser ISO 8601 exige o formato `YYYY-MM-DD` antes do delimitador `T`.

Como consequência, a validação `if (!isNaN(dateObj.getTime()))` falha e o bloco `else` é executado, limpando `internalDate.value = null` e `displayValue.value = ''`.

### Agravantes e Impactos
1. **Perda de Dados em Formulários de Edição:** Se um componente consumidor carregar dados prévios formatados em `DD/MM/YYYY` (ex.: de uma API legada ou preenchimento de usuário), o campo inicializa em branco.
2. **Reset Indesejado do `v-model` Pai:** Como o componente possui um segundo watcher sincronizando `internalDate` de volta para `modelValue` (`watch(internalDate, (newDate) => { if (!newDate) { if (modelValue.value !== '') modelValue.value = ''; } })`), o valor `null` de `internalDate` emite `update:modelValue` com string vazia `''`, apagando o dado no formulário pai.
3. **Corrupção Silenciosa de Datas Ambíguas:** Caso a data em formato brasileiro possua dia $\le 12$ (por exemplo, `'05/06/2026'` para 5 de Junho de 2026) e não houvesse o `'T00:00:00'`, o construtor `new Date('05/06/2026')` interpretaria no padrão norte-americano `MM/DD/YYYY` (6 de Maio de 2026), invertendo dia e mês silenciosamente.

---

### Causa Raiz Comprovada
- **Arquivo e Linhas:** [`src/components/MaxInputDatePicker.vue:L226-L260`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-63/src/components/MaxInputDatePicker.vue#L226-L260)
- **Trecho causador:**
  ```ts
  226: watch(
  227:     modelValue,
  228:     (val) => {
  229:         if (!val) {
  230:             if (internalDate.value !== null) internalDate.value = null;
  231:             if (!isTyping.value) displayValue.value = '';
  232:             return;
  233:         }
  234:         const dateObj =
  235:             val instanceof Date
  236:                 ? val
  237:                 : new Date(typeof val === 'string' && !val.includes('T') && !val.includes(' ') ? val + 'T00:00:00' : val);
  238:         if (!isNaN(dateObj.getTime())) {
  239:             if (!internalDate.value || internalDate.value.getTime() !== dateObj.getTime()) {
  240:                 internalDate.value = dateObj;
  241:                 currentMonth.value = dateObj.getMonth();
  242:                 currentYear.value = dateObj.getFullYear();
  243:             }
  244:             if (!isTyping.value) {
  245:                 const d = String(dateObj.getDate()).padStart(2, '0');
  246:                 const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  247:                 const y = String(dateObj.getFullYear());
  248:                 displayValue.value = `${d}/${m}/${y}`;
  249:             }
  250:         } else {
  251:             if (internalDate.value !== null) internalDate.value = null;
  252:             if (!isTyping.value) displayValue.value = '';
  253:         }
  254:     },
  255:     { immediate: true }
  256: );
  ```

---

### Rastreamento Reverso de Dados
1. **Consumidor / Formulário Pai (UI / Template):**
   `<MaxInputDatePicker v-model="form.data_nascimento" />` (onde `form.data_nascimento = "15/05/2026"`).
2. **Prop / Model (`MaxInputDatePicker.vue:L84`):**
   `const modelValue = defineModel<any>({ default: '' });` recebe `"15/05/2026"`.
3. **Watcher `modelValue` (`MaxInputDatePicker.vue:L236-240`):**
   Avalia `new Date('15/05/2026T00:00:00')` ➔ retorna `Invalid Date` (`NaN`).
4. **Tratamento de Erro no Watcher (`MaxInputDatePicker.vue:L252-257`):**
   Cai no bloco `else`: `internalDate.value = null` e `displayValue.value = ''`.
5. **Watcher Inverso `internalDate` (`MaxInputDatePicker.vue:L263-268`):**
   Detecta `newDate === null` e emite `modelValue.value = ''`, sobrescrevendo o estado original do formulário pai.

---

## Arquivos Afetados

1. [`src/components/MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-63/src/components/MaxInputDatePicker.vue)
   - Implementação da função utilitária `parseDateValue` para interpretar de forma resiliente datas nos formatos:
     - Instâncias de `Date` (ex.: `new Date()`);
     - Timestamps numéricos (ex.: `1718409600000`);
     - Padrão brasileiro `DD/MM/YYYY` ou `DD-MM-YYYY` com ou sem componente de hora (ex.: `'15/05/2026'`, `'15/05/2026 14:30:00'`);
     - Padrão ISO `YYYY-MM-DD` ou `YYYY-MM-DD HH:mm:ss` / `YYYY-MM-DDTHH:mm:ss` (ex.: `'2026-05-15'`, `'2026-05-15 14:30:00'`);
     - Validação estrita de limites de calendário (evita overflow de dias como `31/02/2026`);
     - Fallback seguro para strings genéricas interpretáveis por `new Date()`.
   - Substituição da instanciação ingênua `new Date(...)` dentro do watcher de `modelValue` pela chamada a `parseDateValue`.
2. [`tests/components/MaxInputDatePicker.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-63/tests/components/MaxInputDatePicker.test.ts)
   - Adição de casos de testes unitários para validar valores iniciais em `DD/MM/YYYY`, `DD/MM/YYYY HH:mm:ss`, `DD-MM-YYYY`, rejeição de datas brasileiras inválidas no calendário e atualização dinâmica de props.

---

## Execuções Propostas

### Passo a Passo da Correção Cirúrgica

1. **Criação da função auxiliar `parseDateValue` em [`src/components/MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-63/src/components/MaxInputDatePicker.vue):**
   No bloco `<script setup lang="ts">`, implementar:
   ```ts
   const parseDateValue = (val: unknown): Date | null => {
       if (!val) return null;
       if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

       if (typeof val === 'number') {
           const d = new Date(val);
           return isNaN(d.getTime()) ? null : d;
       }
       if (typeof val !== 'string') return null;

       const trimmed = val.trim();
       if (!trimmed) return null;

       // Formato brasileiro: DD/MM/YYYY ou DD-MM-YYYY (com ou sem hora)
       const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[\sT](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
       if (brMatch) {
           const day = parseInt(brMatch[1], 10);
           const month = parseInt(brMatch[2], 10) - 1;
           const year = parseInt(brMatch[3], 10);
           const hour = brMatch[4] ? parseInt(brMatch[4], 10) : 0;
           const minute = brMatch[5] ? parseInt(brMatch[5], 10) : 0;
           const second = brMatch[6] ? parseInt(brMatch[6], 10) : 0;

           if (month >= 0 && month <= 11 && year >= 1000 && year <= 9999) {
               const date = new Date(year, month, day, hour, minute, second);
               if (
                   date.getFullYear() === year &&
                   date.getMonth() === month &&
                   date.getDate() === day &&
                   date.getHours() === hour &&
                   date.getMinutes() === minute &&
                   date.getSeconds() === second
               ) return date;

           }
           return null;
       }

       // Formato ISO: YYYY-MM-DD ou YYYY-MM-DD HH:mm:ss ou YYYY-MM-DDTHH:mm:ss
       const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[\sT](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
       if (isoMatch) {
           const year = parseInt(isoMatch[1], 10);
           const month = parseInt(isoMatch[2], 10) - 1;
           const day = parseInt(isoMatch[3], 10);
           const hour = isoMatch[4] ? parseInt(isoMatch[4], 10) : 0;
           const minute = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;
           const second = isoMatch[6] ? parseInt(isoMatch[6], 10) : 0;

           if (month >= 0 && month <= 11 && year >= 1000 && year <= 9999) {
               const date = new Date(year, month, day, hour, minute, second);
               if (
                   date.getFullYear() === year &&
                   date.getMonth() === month &&
                   date.getDate() === day &&
                   date.getHours() === hour &&
                   date.getMinutes() === minute &&
                   date.getSeconds() === second
               ) return date;

           }
           return null;
       }

       const fallback = new Date(trimmed);
       return isNaN(fallback.getTime()) ? null : fallback;
   };
   ```

2. **Atualização do Watcher de `modelValue` em [`src/components/MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-63/src/components/MaxInputDatePicker.vue):**
   Substituir a atribuição de `dateObj` por `const dateObj = parseDateValue(val);`:
   ```ts
   // Sincroniza modelValue -> internalDate e displayValue
   watch(
       modelValue,
       (val) => {
           if (!val) {
               if (internalDate.value !== null) internalDate.value = null;

               if (!isTyping.value) displayValue.value = '';

               return;
           }
           const dateObj = parseDateValue(val);
           if (dateObj) {
               if (!internalDate.value || internalDate.value.getTime() !== dateObj.getTime()) {
                   internalDate.value = dateObj;
                   currentMonth.value = dateObj.getMonth();
                   currentYear.value = dateObj.getFullYear();
               }
               if (!isTyping.value) {
                   const d = String(dateObj.getDate()).padStart(2, '0');
                   const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                   const y = String(dateObj.getFullYear());
                   displayValue.value = `${d}/${m}/${y}`;
               }
           } else {
               if (internalDate.value !== null) internalDate.value = null;

               if (!isTyping.value) displayValue.value = '';

           }
       },
       { immediate: true }
   );
   ```

3. **Atualização da Suíte de Testes em [`tests/components/MaxInputDatePicker.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-63/tests/components/MaxInputDatePicker.test.ts):**
   Adicionar os novos cenários de teste cobrindo a interpretação de datas nos formatos `DD/MM/YYYY`, `DD/MM/YYYY HH:mm:ss`, `DD-MM-YYYY` e rejeição de inválidas.

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Falha Prévia)
Adicionar os seguintes casos de teste em `tests/components/MaxInputDatePicker.test.ts`:
```ts
it('converte string DD/MM/YYYY para Date internamente e preenche displayValue', async () => {
    const wrapper = mountDatePicker({ modelValue: '15/05/2026' });
    const ib = wrapper.findComponent(InputBase);
    const input = wrapper.find('input');

    expect(ib.props('done')).toBe(true);
    expect((wrapper.vm as any).internalDate).not.toBeNull();
    expect((wrapper.vm as any).internalDate.getFullYear()).toBe(2026);
    expect((wrapper.vm as any).internalDate.getMonth()).toBe(4); // Maio = 4 (0-indexed)
    expect((wrapper.vm as any).internalDate.getDate()).toBe(15);
    expect(input.element.value).toBe('15/05/2026');
    expect((wrapper.vm as any).displayValue).toBe('15/05/2026');
});

it('converte string DD/MM/YYYY HH:mm:ss para Date internamente', async () => {
    const wrapper = mountDatePicker({ modelValue: '15/05/2026 14:30:00' });
    const ib = wrapper.findComponent(InputBase);
    const input = wrapper.find('input');

    expect(ib.props('done')).toBe(true);
    expect((wrapper.vm as any).internalDate).not.toBeNull();
    expect((wrapper.vm as any).internalDate.getHours()).toBe(14);
    expect((wrapper.vm as any).internalDate.getMinutes()).toBe(30);
    expect(input.element.value).toBe('15/05/2026');
});

it('converte string DD-MM-YYYY para Date internamente', async () => {
    const wrapper = mountDatePicker({ modelValue: '15-05-2026' });
    const input = wrapper.find('input');

    expect((wrapper.vm as any).internalDate).not.toBeNull();
    expect((wrapper.vm as any).internalDate.getDate()).toBe(15);
    expect(input.element.value).toBe('15/05/2026');
});

it('rejeita data brasileira inválida no calendário (ex: 31/02/2026) mantendo internalDate nulo', async () => {
    const wrapper = mountDatePicker({ modelValue: '31/02/2026' });
    const ib = wrapper.findComponent(InputBase);
    const input = wrapper.find('input');

    expect(ib.props('done')).toBe(false);
    expect((wrapper.vm as any).internalDate).toBeNull();
    expect(input.element.value).toBe('');
});

it('atualiza internalDate e displayValue quando modelValue muda dinamicamente para DD/MM/YYYY', async () => {
    const wrapper = mountDatePicker({ modelValue: '' });
    await wrapper.setProps({ modelValue: '20/11/2025' });

    expect((wrapper.vm as any).internalDate).not.toBeNull();
    expect((wrapper.vm as any).internalDate.getFullYear()).toBe(2025);
    expect((wrapper.vm as any).internalDate.getMonth()).toBe(10); // Novembro = 10
    expect((wrapper.vm as any).internalDate.getDate()).toBe(20);
    expect(wrapper.find('input').element.value).toBe('20/11/2025');
});
```
*Execução Red:* No código atual sem `parseDateValue`, os testes que utilizam formato brasileiro falham pois `internalDate` é definido como `null` e `displayValue` como `''`.

### 2. Etapa Green (Sucesso Pós-Correção)
Com a implementação de `parseDateValue`, o componente reconhece `DD/MM/YYYY`, instancia o `Date` correto e popula `displayValue` e `internalDate`, fazendo todos os testes passarem.

---

## Banco de Dados

- **Nenhuma** migration ou alteração de banco de dados necessária (componente frontend puro).

---

## Riscos de Quebra e Não-Regressão

### Mapeamento de Riscos
1. **Quebra de formatos ISO suportados anteriormente (`YYYY-MM-DD`, `YYYY-MM-DD HH:mm:ss`, `Date`):**
   - **Mitigação:** A regex de padrão ISO e a verificação `val instanceof Date` continuam explicitamente contempladas em `parseDateValue` com testes dedicados.
2. **Shift de Fuso Horário (Timezone Offset):**
   - **Mitigação:** Ao instanciar `new Date(year, month, day, hour, minute, second)`, a data é gerada no fuso local da máquina cliente, eliminando distorções de dias causadas pelo parsing UTC padrão de strings ISO curtas.
3. **Validação de datas inexistentes (ex.: 29/02 em anos não bissextos ou 31/04):**
   - **Mitigação:** A checagem `date.getFullYear() === year && date.getMonth() === month && date.getDate() === day` descarta transbordamentos automáticos do motor JavaScript.
4. **Impacto em outros componentes:**
   - **Mitigação:** O formato emitido via `update:modelValue` (`YYYY-MM-DD HH:mm:ss`) e o display visual (`DD/MM/YYYY`) permanecem 100% idênticos, garantindo compatibilidade com componentes que consomem `MaxInputDatePicker` (ex.: `MaxTableFields`).

---

## Validação

Execuções automatizadas para comprovar a eficácia da implementação e garantir não-regressão:

```bash
# 1. Executar a suíte de testes unitários do MaxInputDatePicker
npx vitest run tests/components/MaxInputDatePicker.test.ts

# 2. Executar toda a suíte de testes da biblioteca
npm test

# 3. Executar verificação de tipos TypeScript
npm run type-check

# 4. Executar verificação de estilização e lint
npm run lint
```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices`
- `planning-with-files`
- `vue-debugging-best-practices`
- `tdd`
- `code-review`
- `production-code-audit`
