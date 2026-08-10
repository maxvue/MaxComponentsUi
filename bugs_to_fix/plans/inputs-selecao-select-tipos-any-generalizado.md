# Uso generalizado de `any` nos inputs de seleção anula a tipagem da API pública

- **Categoria:** melhoria
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputSelect.vue:68`, `src/components/MaxInputSelect.vue:73`, `src/components/MaxInputSelect.vue:107`, `src/components/MaxTagSelect.vue:46`, `src/components/MaxInputAutoComplete.vue:24`, `src/components/MaxInputFileUpload.vue:88`, `src/components/MaxInputFileProject.vue:46`
- **Domínio:** inputs-selecao-arquivo

## Problema

Os componentes de seleção e arquivo usam `any` de forma sistemática em posições que definem a API pública, e não apenas em detalhes internos:

**Declarações de `attrs` como `any`** — anulam qualquer verificação sobre o que é repassado adiante:
- `MaxInputSelect.vue:68` — `const attrs: any = useAttrs();`
- `MaxTagSelect.vue:46` — idem
- `MaxInputFileUpload.vue:88` — idem
- `MaxInputIconPicker.vue:95` — idem
- `MaxInputToggle.vue:28` — idem

**Props públicas tipadas como `any`:**
- `MaxInputSelect.vue:73` — `modelValue: any`
- `MaxInputSelect.vue:107` — `options?: any[]`
- `MaxInputAutoComplete.vue:24-25` — `modelValue: any; options: any;` (o segundo nem sequer é `any[]`)
- `MaxTagSelect.vue` — mesmo par
- `MaxInputFileProject.vue:46` — `uploadData?: any`

**Handlers e callbacks:**
- `MaxInputFileUpload.vue:135-173` — `onSelectHandler`, `onUploadHandler`, `onError`, `onBeforeUpload` recebem todos `event: any`; `event.xhr.response` (linha 146) e `event.formData` (linha 165) são acessados sem qualquer garantia de forma.
- `MaxInputSelect.vue:167` — `async function before_show(event: any)`, com o cast `@before-show="(before_show as any)"` no template (linhas 6 e 33) para silenciar o compilador.
- `MaxInputFileProject.vue:117` — `const sendFile = (files: any)`, seguido de manipulação livre (`files['files'] ?? files`, linha 139).

**Casts que apagam erros em vez de resolvê-los:**
- `MaxInputSelect.vue:26` e `48` — `options.find((option: any) => ...)`
- `MaxInputMarkdown.vue:97` e `111` — `(editor.storage as Record<string, any>).markdown.getMarkdown()`
- `MaxInputFileUploadBig.vue:73` e `MaxInputFileProject.vue:94` — `useDropZone(drop_zone_ref as any, ...)`

Isso contraria diretamente a orientação de tipagem estrita adotada no projeto e contrasta com `MaxListBox.vue`, que define e usa tipos reais (`LoadOptionsContext`, `LoadOptionsResult`, importados de `../types` na linha 96) para a mesma classe de problema — carregamento assíncrono de opções.

## Impacto

A API pública dos componentes mais usados da biblioteca não oferece autocomplete nem verificação nas apps consumidoras: passar `option-value` com um nome de campo inexistente, ou um `options` com forma errada, compila sem reclamação e falha em runtime. Internamente, `event: any` nos handlers de upload significa que `event.xhr.response` pode ser `undefined` sem que o compilador avise — precisamente o cenário do `try/catch` da linha 145. E `attrs: any` torna impossível saber, ao ler o componente, quais atributos ele realmente consome.

Isso também encarece a migração do PrimeVue: sem tipos, não há como o compilador apontar os pontos de acoplamento ao substituir cada componente.

## Plano de correção

Abordagem incremental, priorizando a API pública sobre o interno:

1. **Definir tipos de opção compartilhados** em `src/types/`, seguindo o precedente de `LoadOptionsContext`/`LoadOptionsResult`:
   ```ts
   export interface SelectOption {
       value?: string | number | null;
       label?: string;
       name?: string;
       icon?: string;
       iconSize?: string | number;
       sub_label?: string;
       color?: string;
       [key: string]: unknown;
   }
   ```
   O index signature preserva a flexibilidade real (campos customizados via `optionValue`/`optionLabel`) sem abrir mão da verificação dos campos conhecidos.
2. **Aplicar em `options?: SelectOption[]`** em `MaxInputSelect`, `MaxTagSelect` e `MaxInputAutoComplete`.
3. **Tipar os eventos de upload** do PrimeVue: importar os tipos de evento de `primevue/fileupload` (`FileUploadUploadEvent`, `FileUploadErrorEvent`, `FileUploadSelectEvent`, `FileUploadBeforeUploadEvent`) em `MaxInputFileUpload.vue`, substituindo os quatro `event: any`. Isso é ganho imediato e de baixo risco, pois os tipos já existem.
4. **Trocar `attrs: any` por `Record<string, unknown>`** e adicionar acessos explícitos onde os valores são consumidos — `unknown` obriga a narrow, que é exatamente o que falta hoje.
5. **`modelValue: any`**: manter genérico é defensável para um select, mas preferir `unknown` ou um genérico `<T>` no componente, para que a app consumidora recupere a inferência.
6. Eliminar os casts `as any` remanescentes resolvendo a causa (ex.: tipar `before_show` com a assinatura correta do evento do PrimeVue elimina o cast do template).

## Verificação

- `npm run type-check` (`vue-tsc`) passa a cada etapa — a migração é incremental e cada passo deve ficar verde antes do seguinte.
- `npm run lint` sem novos avisos de `@typescript-eslint/no-explicit-any`.
- `npm run test` inteiro verde: a tipagem não deve alterar comportamento algum.
- Verificação manual no playground: o autocomplete do editor passa a sugerir os campos de `SelectOption` ao escrever `:options="[{ ... }]"`.
