# Plano de Implementação — Issue #74

## Descrição e Causa Raiz

### Problema
No arquivo de teste `tests/components/MaxInputFileProject.test.ts` (linhas 79 a 97), o teste unitário intitulado `'covers axios.catch na onFileUpload e formData uploadData e onChange'` apresenta um falso positivo grave (asserção superficial/inexistente):
1. O teste afirma validar o callback `onChange` do seletor de arquivos (`useFileDialog`), porém a invocação é encapsulada sob uma condicional defensiva desnecessária: `if (onChangeCallback) onChangeCallback([{ name: 'file_test.png' }]);` (linha 89). Se o callback não for capturado ou for `undefined`, o teste não acusa erro e prossegue silenciosamente.
2. Não há nenhuma asserção sobre o processamento e efeitos colaterais da chamada de `onChangeCallback`:
   - Não verifica se o estado reativo `wrapper.vm.temp_files` foi alimentado com o novo arquivo;
   - Não verifica se a função `reset()` do `useFileDialog` foi acionada (para permitir novas seleções);
   - Não verifica se as propriedades do arquivo foram enriquecidas e normalizadas pelo método `convertItem` (`id`, `name`, `extension`, `message_type`, `in_server`, `to_request_ai`);
   - Não verifica a geração ou descarte de `objectURL`.
3. A única asserção em todo o teste é `expect(consoleSpy).toHaveBeenCalled();` (linha 95), proveniente exclusivamente da invocação manual posterior `wrapper.vm.sendFile([file])` com um objeto `File` diferente (`test.png`), o qual simula a rejeição de `axios.post`.
4. Agravantes de acoplamento e falso positivo:
   - O teste agrupa três responsabilidades completamente distintas em um único bloco de código: o callback `onChange` do file dialog, o envio com `uploadData` via `FormData` e a captura de erro de rede no `axios.post`.
   - Nenhuma asserção valida o conteúdo de `FormData` ou os dados passados em `uploadData: { a: 1, b: { c: 2 } }`.
   - No componente real (`src/components/MaxInputFileProject.vue`), a adição de arquivos via `onChange` aciona `count_to_upload`, disparando automaticamente `sendFile` se `props.auto` for `true` (padrão). Ao chamar `wrapper.vm.sendFile([file])` manualmente na sequência, ocorrem duas chamadas concorrentes a `sendFile`, gerando um cenário confuso e frágil.
   - Caso a linha 89 (`if (onChangeCallback)...`) seja inteiramente comentada ou removida, ou caso a implementação de `onChange` no componente `MaxInputFileProject.vue:122-127` seja quebrada ou excluída, o teste continua passando com status `PASSED` (falso positivo absoluto).

### Causa Raiz Comprovada
- **Localização Exata:** `tests/components/MaxInputFileProject.test.ts:79-97` (com foco na linha 89) e `tests/components/MaxInputFileProject.test.ts:16-20`.
- **Trecho do Código com Problema:**
```typescript
// tests/components/MaxInputFileProject.test.ts:16-20
useFileDialog: () => ({
    open: openMock,
    reset: vi.fn(),
    onChange: vi.fn((cb) => { onChangeCallback = cb; })
}),

// tests/components/MaxInputFileProject.test.ts:79-97
it('covers axios.catch na onFileUpload e formData uploadData e onChange', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-ignore
    axios.post.mockRejectedValue(new Error('Network error'));
    const wrapper = mount(MaxInputFileProject, {
        props: { files: [], url: '/upload', uploadData: { a: 1, b: { c: 2 } } },
        global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
    });

    // cover onChange callback
    if (onChangeCallback) onChangeCallback([{ name: 'file_test.png' }]);


    const file = new File(['content'], 'test.png', { type: 'image/png' });
    wrapper.vm.sendFile([file]);
    await new Promise((r) => setTimeout(r, 10));
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
});
```

- **Fluxo Causal e Rastreamento Reverso de Dados:**
  1. *Fluxo Real do Componente (`src/components/MaxInputFileProject.vue`):*
     `useFileDialog({ directory: false })` ➔ expõe `{ open, reset, onChange }` ➔ `onChange((files: any) => { if (files && size(files) > 0) { temp_files.value = [...temp_files.value, ...(files ?? [])]; reset(); } })` ➔ A reatividade atualiza `count_files` ➔ `watch(count_files)` dispara `temp_files.value.forEach(convertItem)` (onde cada arquivo ganha `id`, `name`, `extension`, `message_type`, `in_server = false`, `to_request_ai = true`, além de gerar `objectURL` via `URL.createObjectURL`) ➔ `count_to_upload` computa arquivos com `!in_server` ➔ `watch(count_to_upload)` verifica `if (props.auto && count_to_upload.value > 0) sendFile(files_to_upload.value)`.
  2. *Fluxo Viciado no Teste Atual:*
     O mock de `useFileDialog` instancia `reset: vi.fn()` internamente sem expor uma referência espiã (`resetMock`), impossibilitando assertar se o reset do diálogo ocorreu ➔ O teste armazena o callback em `onChangeCallback` ➔ Na linha 89, invoca `if (onChangeCallback) onChangeCallback([{ name: 'file_test.png' }])` sem nenhuma asserção sobre `wrapper.vm.temp_files`, sem asserção sobre `reset()`, e tolerando `undefined` silenciosamente ➔ Na linha 93, chama `wrapper.vm.sendFile([file])` manualmente ➔ Apenas aguarda 10ms e verifica `expect(consoleSpy).toHaveBeenCalled()` ➔ A asserção é satisfeita unicamente pela falha do `sendFile` manual ➔ O teste dá `PASSED` indevidamente mesmo que o `onChange` não tenha operado nada.

---

## Arquivos Afetados

1. `tests/components/MaxInputFileProject.test.ts` — Refatoração e desacoplamento do teste vácuo em testes atômicos e estritos:
   - Exposição do mock `resetMock = vi.fn()` no mock do composable `@maxvue/max-use` / `useFileDialog`;
   - Inclusão de `beforeEach` para limpeza e reinicialização dos mocks (`vi.clearAllMocks()`, `onChangeCallback = undefined`);
   - Criação de teste específico para validar a adição de arquivos via `onChange`, invocação de `reset()` e normalização via `convertItem`;
   - Criação de teste de caso de borda para `onChange` recebendo lista vazia ou nula;
   - Criação de teste dedicado para validação de `FormData` e serialização correta de `uploadData` em `sendFile`;
   - Criação de teste dedicado para tratamento de erro no `axios.post` (`axios.catch`) e revogação de URLs em `finally`.

---

## Execuções Propostas

### 1. Refatoração na Infraestrutura de Mock em `tests/components/MaxInputFileProject.test.ts`

- Declarar `resetMock` como mock de nível superior para que seja acessível nas asserções:
```typescript
let onChangeCallback: ((files: any) => void) | undefined;
const openMock = vi.fn();
const resetMock = vi.fn();

vi.mock('@maxvue/max-use', () => ({
    getRoute: vi.fn(),
    useDropZone: () => ({ isOverDropZone: { value: false } }),
    useFileDialog: () => ({
        open: openMock,
        reset: resetMock,
        onChange: vi.fn((cb) => { onChangeCallback = cb; })
    }),
    ulid: vi.fn(() => '12345'),
    size: vi.fn((arr) => arr?.length || 0),
    isBlank: vi.fn((val) => !val)
}));
```

- Adicionar gancho `beforeEach` para garantir isolamento limpo entre os testes:
```typescript
beforeEach(() => {
    vi.clearAllMocks();
    onChangeCallback = undefined;
});
```

### 2. Substituição do Teste Frágil por Testes Atômicos com Asserções Estritas

- **Teste 1 — Validação do callback `onChange` e chamada de `reset()`:**
  Garante que `onChangeCallback` foi registrado, que arquivos selecionados atualizam `temp_files`, que `reset()` foi chamado e que os itens receberam os atributos de `convertItem`.
```typescript
it('atualiza temp_files e chama reset() ao selecionar arquivos via useFileDialog onChange', async () => {
    const wrapper = mount(MaxInputFileProject, {
        props: { files: [], auto: false },
        global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
    });

    expect(onChangeCallback).toBeDefined();

    const mockFile = { name: 'documento_novo.png', type: 'image/png' };
    onChangeCallback!([mockFile]);
    await wrapper.vm.$nextTick();

    expect(resetMock).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.temp_files).toHaveLength(1);
    expect(wrapper.vm.temp_files[0]).toMatchObject({
        id: '12345',
        name: 'documento_novo.png',
        extension: 'png',
        message_type: 'image',
        in_server: false,
        to_request_ai: true
    });
});
```

- **Teste 2 — Caso de borda de `onChange` com lista vazia ou nula:**
  Garante que quando `onChange` recebe `[]` ou `null`, `temp_files` não é alterado e `reset()` não é invocado.
```typescript
it('não altera temp_files nem chama reset() quando onChange recebe lista vazia ou nula', async () => {
    const wrapper = mount(MaxInputFileProject, {
        props: { files: [], auto: false },
        global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
    });

    expect(onChangeCallback).toBeDefined();

    onChangeCallback!([]);
    onChangeCallback!(null as any);
    await wrapper.vm.$nextTick();

    expect(resetMock).not.toHaveBeenCalled();
    expect(wrapper.vm.temp_files).toHaveLength(0);
});
```

- **Teste 3 — Serialização de `uploadData` em `FormData` no `sendFile`:**
  Garante que a construção de `FormData` converte valores primitivos diretamente e objetos aninhados com `JSON.stringify`, além de anexar o arquivo com o nome correto.
```typescript
it('monta FormData com uploadData serializado e arquivos ao executar sendFile', async () => {
    // @ts-ignore
    axios.post.mockResolvedValue({ data: { success: true } });

    const wrapper = mount(MaxInputFileProject, {
        props: {
            files: [],
            url: '/api/upload',
            uploadData: { category: 'docs', meta: { folderId: 42 } },
            auto: false
        },
        global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
    });

    const file = new File(['conteudo'], 'recibo.pdf', { type: 'application/pdf' });
    wrapper.vm.sendFile([file]);
    await new Promise((r) => setTimeout(r, 10));

    expect(axios.post).toHaveBeenCalledTimes(1);
    const [targetUrl, formDataArg, configArg] = (axios.post as any).mock.calls[0];

    expect(targetUrl).toBe('/api/upload');
    expect(formDataArg).toBeInstanceOf(FormData);
    expect(formDataArg.get('category')).toBe('docs');
    expect(formDataArg.get('meta')).toBe(JSON.stringify({ folderId: 42 }));
    expect(configArg.withCredentials).toBe(true);
});
```

- **Teste 4 — Tratamento de erro (`axios.catch`) e log no `console.error`:**
  Garante que quando `axios.post` falha, o erro é capturado e registrado com a mensagem `'Erro ao enviar arquivo. '`.
```typescript
it('captura erro do axios e exibe no console.error ao falhar envio em sendFile', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const networkError = new Error('Falha de conexão');
    // @ts-ignore
    axios.post.mockRejectedValue(networkError);

    const wrapper = mount(MaxInputFileProject, {
        props: { files: [], url: '/api/upload', auto: false },
        global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
    });

    const file = new File(['teste'], 'falha.png', { type: 'image/png' });
    wrapper.vm.sendFile([file]);
    await new Promise((r) => setTimeout(r, 10));

    expect(consoleSpy).toHaveBeenCalledWith('Erro ao enviar arquivo. ', networkError);
    consoleSpy.mockRestore();
});
```

### 3. Padrões de Código e Estilo
- Garantir conformidade total com `eslint.config.js`:
  - 4 espaços de indentação;
  - Aspas simples (`'`);
  - Sem vírgula no último elemento (`comma-dangle: never`);
  - Ponto e vírgula obrigatório (`semi: always`).

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Comprovação da Falha / Falso Positivo)
- **Cenário de Falso Positivo Original:**
  No teste atual (`tests/components/MaxInputFileProject.test.ts:79-97`), caso a linha 89 (`if (onChangeCallback) onChangeCallback([{ name: 'file_test.png' }]);`) seja comentada ou caso a implementação de `onChange` em `src/components/MaxInputFileProject.vue:122-127` seja removida, o teste continua passando com `PASSED` porque apenas valida `expect(consoleSpy).toHaveBeenCalled()`.
- **Comportamento Red Desejado:**
  Com os novos testes implementados:
  - Se a lógica de `onChange` for alterada ou removida em `MaxInputFileProject.vue`, o teste `'atualiza temp_files e chama reset() ao selecionar arquivos via useFileDialog onChange'` falha com:
    `AssertionError: expected [] to have length 1`
    e
    `AssertionError: expected resetMock to have been called 1 times, but was called 0 times`.
  - Se `uploadData` deixar de ser serializado ou anexado ao `FormData`, o teste `'monta FormData com uploadData serializado e arquivos ao executar sendFile'` falha com:
    `AssertionError: expected null to be '{"folderId":42}'`.

### 2. Etapa Green (Validação Pós-Refatoração)
- Ao executar `npx vitest run tests/components/MaxInputFileProject.test.ts` com o componente `MaxInputFileProject.vue` íntegro, todos os testes (incluindo os 4 testes atômicos refatorados e os 5 testes existentes) passam com sucesso comprovando asserções reais sobre estado interno, spies e integração com FormData.

---

## Banco de dados

- **Nenhuma** migration necessária (alteração exclusiva na suíte de testes unitários do front-end).

---

## Riscos de quebra e Não-Regressão

- **Riscos de Contrato / Componente:** Nenhum. Nenhuma alteração é realizada no código-fonte de produção de `src/components/MaxInputFileProject.vue`. Trata-se puramente de uma refatoração da suíte de testes unitários para eliminar asserções vácuas e falsos positivos.
- **Garantia de Não-Regressão:**
  - Os testes preexistentes no mesmo arquivo (`deve renderizar...`, `deve atualizar a lista...`, `renderiza um MaxButton...`, `desmontar MaxInputFileProject revoga todas as Object URLs...`, `remover um arquivo da lista revoga sua Object URL`) continuam íntegros e passando.
  - Execução completa da suíte de testes do projeto via `npx vitest run`.
  - Checagem estática de tipos com `npx vue-tsc --noEmit`.
  - Verificação de estilo e lint com `npx eslint tests/components/MaxInputFileProject.test.ts`.

---

## Validação

- **Execução dos Testes Unitários do Componente:**
  ```bash
  npx vitest run tests/components/MaxInputFileProject.test.ts
  ```
- **Execução Completa da Suíte de Testes:**
  ```bash
  npx vitest run
  ```
- **Checagem de Tipos TypeScript:**
  ```bash
  npx vue-tsc --noEmit
  ```
- **Checagem de Linter e Estilo:**
  ```bash
  npx eslint tests/components/MaxInputFileProject.test.ts
  ```

---

## Skills Aplicáveis

- `vue-vitest-testing-best-practices`
- `vue-debugging-best-practices`
- `vue-components`
- `vue-max-stack-frontend-best-practices`
- `javascript-testing-patterns`
- `test-driven-development`
- `code-review-and-quality`
- `vue-eslint-stylelint-quality-standards`
