# Catálogo de Componentes — MaxComponentsUi

Referência completa dos **59 componentes** disponíveis na biblioteca.
Todos os componentes utilizam `<script setup lang="ts">` e suportam v-model quando aplicável.

---

## Índice

- [Base](#base)
- [Botões](#botões)
- [Tipografia](#tipografia)
- [Inputs de Texto](#inputs-de-texto)
- [Inputs Especializados](#inputs-especializados)
- [Telefone](#telefone)
- [Arquivos e Upload](#arquivos-e-upload)
- [Tabelas](#tabelas)
- [Layout e Grid](#layout-e-grid)
- [Overlays (Modal, Popover)](#overlays)
- [Ícones e Status](#ícones-e-status)
- [Loaders](#loaders)
- [Transições e Animações](#transições-e-animações)
- [Display e Outros](#display-e-outros)

---

## Base

### InputBase

O **wrapper fundamental** para quase todos os componentes de entrada.
Gerencia labels flutuantes (FloatLabel), ícones, mensagens de erro/atenção/sucesso e estados de validação.

**Arquivo:** [`src/components/InputBase.vue`](src/components/InputBase.vue)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `label` | `string` | — | Rótulo exibido acima ou dentro do campo |
| `icon` / `i` | `string` | — | Ícone Iconify (ex: `'mdi:user'`) |
| `iconLeft` | `string` | — | Ícone à esquerda |
| `iconRight` | `string` | — | Ícone à direita |
| `iconPos` | `'left' \| 'right'` | `'left'` | Posição do ícone |
| `message` / `msg` | `string` | — | Mensagem de feedback abaixo do input |
| `iconMessage` | `string` | — | Ícone ao lado da mensagem |
| `error` | `string \| boolean` | — | Mensagem/estado de erro (destaque vermelho) |
| `caution` | `string \| boolean` | — | Mensagem/estado de atenção (destaque laranja) |
| `done` | `string \| boolean` | — | Indica preenchimento correto (ícone ✓ verde) |
| `required` | `boolean` | — | Exibe asterisco de obrigatório |
| `disabled` | `boolean` | — | Desabilita o campo |
| `float` | `boolean` | — | Ativa estilo FloatLabel |
| `textCenter` | `boolean` | `false` | Centraliza o texto |
| `inLine` | `boolean` | `false` | Layout inline (label ao lado do campo) |
| `dark` | `boolean \| number` | `0.5` | Opacidade do ícone para fundos claros |
| `light` | `boolean \| number` | `false` | Opacidade do ícone para fundos escuros |
| `options` | `any[]` | — | Lista de opções (passthrough para selects) |
| `groupOptions` | `SelectGroupOptions` | — | Opções agrupadas |
| `default` | `any` | — | Valor padrão |

**Atributos HTML especiais:**
- `input-click` — Estilo compacto (20px) sem bordas
- `no-message` / `no-messages` — Remove o espaço da mensagem
- `slim` — Estilo ultra-compacto (22px)

---

## Botões

### MaxButton

Botão estendido do PrimeVue com suporte a ícones Iconify, navegação por rota e callback de ação.
Quando usado **sem `label`**, renderiza automaticamente como `MaxIconButton`.

**Arquivo:** [`src/components/MaxButton.vue`](src/components/MaxButton.vue)
**Aliases:** `Button`, `Botao`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `label` | `string` | — | Texto do botão (se ausente, renderiza como IconButton) |
| `icon` / `i` | `string` | — | Ícone Iconify |
| `iconLeft` | `string` | — | Ícone à esquerda |
| `iconRight` | `string` | — | Ícone à direita |
| `severity` | `string` | `'primary'` | `'secondary'`, `'success'`, `'info'`, `'warning'`, `'help'`, `'danger'`, `'contrast'` |
| `size` | `'small' \| 'large'` | — | Tamanho |
| `disabled` | `boolean` | `false` | Desabilita |
| `loading` | `boolean` | `false` | Exibe ícone de carregamento |
| `variant` | `'outlined' \| 'text' \| 'link'` | — | Variante visual |
| `route` | `string` | `null` | Rota de navegação ao clicar |
| `params` / `data` / `query` | `any` | `null` | Parâmetros para a rota |
| `action` | `() => void` | — | Callback ao clicar |
| `dark` / `light` | `number` | `0.6` | Opacidade do ícone |
| `sizeIcon` / `iconSize` | `number \| string` | `1.4` | Tamanho do ícone |

**Eventos:** `click`

---

### MaxIconButton

Botão que exibe **apenas um ícone**, com efeito de hover (scale 1.3) e suporte a navegação/callback.
Possui proteção contra clique duplo (200ms).

**Arquivo:** [`src/components/MaxIconButton.vue`](src/components/MaxIconButton.vue)
**Aliases:** `IconButton`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `icon` / `i` | `string` | — | Ícone Iconify (ex: `'mdi:pencil'`) |
| `route` | `string` | `null` | Rota de navegação ao clicar |
| `params` / `data` / `query` | `any` | `null` | Parâmetros/dados para a rota |
| `blank` | `string` | — | URL para abrir em nova aba |
| `size` | `string \| number` | `1` | Multiplicador de tamanho (em unidades de 16px) |
| `rotate` | `number` | — | Rotação em graus |
| `flip` | `string` | — | `'horizontal'`, `'vertical'`, `'xy'` |
| `dark` | `number` | `0.4` | Opacidade para fundos claros |
| `light` | `number` | — | Opacidade para fundos escuros |
| `checked` | `boolean` | — | Exibe badge de check |
| `plus` | `boolean` | — | Exibe badge de adição |
| `hoverColor` | `string` | — | Cor CSS no hover |
| `action` | `() => void` | — | Callback ao clicar |

**Eventos:** `action`

---

### MaxIconConfirm

Botão de ícone que exige **confirmação via popover** antes de executar a ação.
Ao clicar, abre o `MaxPopoverConfirm` posicionado sobre o botão com mensagem e botões de aceitar/rejeitar.

**Arquivo:** [`src/components/MaxIconConfirm.vue`](src/components/MaxIconConfirm.vue)
**Aliases:** `IconConfirm`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `icon` / `i` | `string` | — | Ícone Iconify do botão |
| `message` | `string` | `'Deseja continuar?'` | Mensagem de confirmação exibida no popover |
| `messageIcon` | `string` | — | Ícone exibido ao lado da mensagem |
| `acceptProps` | `{ label, icon?, action }` | `{ label: 'Sim' }` | Configuração do botão de aceitar |
| `rejectProps` | `{ label, icon?, action }` | `{ label: 'Não' }` | Configuração do botão de rejeitar |
| `size` / `scale` | `string \| number` | — | Tamanho do ícone |
| `dark` | `number` | `0.4` | Opacidade para fundos claros |
| `loading` | `boolean` | `false` | Estado de carregamento |
| `rotate` | `number` | — | Rotação em graus |

**Exemplo de uso:**
```vue
<MaxIconConfirm
  icon="mdi:delete"
  message="Deseja excluir este item?"
  :acceptProps="{ label: 'Sim, excluir', icon: 'mdi:check', action: () => excluir(item) }"
  :rejectProps="{ label: 'Cancelar', action: () => {} }"
/>
```

---

## Tipografia

### MaxTitle1

Título principal com subtítulo opcional. Estilo grande e proeminente.

**Arquivo:** [`src/components/MaxTitle1.vue`](src/components/MaxTitle1.vue)
**Aliases:** `Title1`, `T1`

| Prop (via attrs) | Tipo | Descrição |
|------|------|-----------|
| `h1` | `string` | Texto do título principal |
| `h2` | `string` | Texto do subtítulo |

---

### MaxTitle2

Título secundário com subtítulo opcional. Estilo menor e mais sutil (uppercase, fonte 0.9rem).

**Arquivo:** [`src/components/MaxTitle2.vue`](src/components/MaxTitle2.vue)
**Aliases:** `Title2`, `T2`

| Prop (via attrs) | Tipo | Descrição |
|------|------|-----------|
| `h1` | `string` | Texto do título (uppercase, weight 500) |
| `h2` | `string` | Texto do subtítulo (weight 300, renderizado com v-html) |

---

## Inputs de Texto

> Todos os inputs de texto utilizam `InputBase` como wrapper e herdam suas props (label, icon, error, done, required, etc.).
> Todos possuem sistema de **validação automática**: ao perder o foco (`@blur`), o estado `done`/`caution`/`error` é calculado.

### MaxInputText

Input de texto padrão com suporte a v-model, validação de obrigatoriedade e comparação com valor alvo.

**Arquivo:** [`src/components/MaxInputText.vue`](src/components/MaxInputText.vue)
**Aliases:** `InputText`, `InputField`, `MaxInputField`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any` | `''` | Valor do campo (v-model) |
| `label` | `string` | — | Rótulo do campo |
| `icon` / `i` | `string` | — | Ícone Iconify |
| `disabled` | `boolean` | `false` | Desabilita o campo |
| `float` | `boolean` | — | Ativa FloatLabel |
| `msg` / `message` | `string` | — | Mensagem de feedback |
| `done` | `boolean` | `undefined` | Estado de validação manual |
| `error` | `string \| boolean` | — | Mensagem de erro |
| `caution` | `string \| boolean` | `undefined` | Estado de atenção |
| `required` | `boolean` | `false` | Campo obrigatório (valida automaticamente) |
| `targetValue` | `string` | — | Valor esperado para comparação (exibe erro se diferente) |

**Eventos:** `update:modelValue`

**Validação automática:**
- Se `required=true` e vazio → erro "Campo obrigatório"
- Se `targetValue` definido e diferente → erro "Valor esperado: ..."
- Personalizável via atributos: `err-msg`, `error-message`, `error-msg`

---

### MaxInputTextArea

Área de texto multi-linha com redimensionamento automático.

**Arquivo:** [`src/components/MaxInputTextArea.vue`](src/components/MaxInputTextArea.vue)
**Aliases:** `InputTextArea`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any` | `''` | Valor (v-model) |
| `autoResize` | `boolean` | `true` | Redimensiona automaticamente conforme o conteúdo |
| `rows` | `number` | `3` | Número inicial de linhas |
| `maxRows` | `number` | `10` | Máximo de linhas (para autoResize) |
| `minRows` | `number` | — | Mínimo de linhas |
| `autofocus` | `boolean` | — | Foco automático ao montar |
| `wrap` | `string` | — | Comportamento de quebra de linha |
| + todas as props do `InputBase` | | |

**Atributos HTML especiais:**
- `no-border` — Remove a borda do textarea

**Eventos:** `update:modelValue`

---

### MaxInputNumber

Campo numérico com formatação de decimais, prefixo e sufixo.

**Arquivo:** [`src/components/MaxInputNumber.vue`](src/components/MaxInputNumber.vue)
**Aliases:** `InputNumber`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any` | `''` | Valor numérico (v-model) |
| `prefix` | `string` | — | Prefixo exibido (ex: `'R$'`) |
| `suffix` | `string` | — | Sufixo exibido (ex: `'kWh'`) |
| `placeholder` | `string` | — | Texto de placeholder |
| `minFractionDigits` | `number` | `2` | Casas decimais mínimas |
| `required` | `boolean` | `false` | Campo obrigatório |
| `targetValue` | `string` | — | Valor para comparação |
| + todas as props do `InputBase` | | |

**Eventos:** `update:modelValue`

---

### MaxInputSearch

Campo de busca com ícone de pesquisa (ou loading) e debounce de 300ms.
Emite `search` apenas quando o texto tem mais de 1 caractere.

**Arquivo:** [`src/components/MaxInputSearch.vue`](src/components/MaxInputSearch.vue)
**Aliases:** `InputSearch`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `string` | `''` | Texto de busca (v-model) |
| `isLoading` | `boolean` | `false` | Exibe ícone de loading no lugar da lupa |
| + props de `InputBase` via `useAttrs()` | | |

**Eventos:** `update:modelValue`, `search` (emitido com debounce de 300ms)

---

## Inputs Especializados

### MaxInputCep

Input para **CEP** com máscara automática (`00.000-000`) e validação de dígitos.

**Arquivo:** [`src/components/MaxInputCep.vue`](src/components/MaxInputCep.vue)
**Aliases:** `InputCep`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any` | `''` | Valor do CEP (apenas números) |
| `loading` | `boolean` | `false` | Exibe ícone de loading à direita |
| `targetValue` | `string` | — | Valor alvo para comparação |
| `required` | `boolean` | `false` | Campo obrigatório |
| + todas as props do `InputBase` | | |

**Máscara:** `##.### - ###`
**Eventos:** `update:modelValue`, `complete` (emitido quando CEP válido — 8 dígitos)
**Erros automáticos:** "CEP inválido", "Campo obrigatório"

---

### MaxInputCpfCnpj

Input para **CPF ou CNPJ** com detecção automática do tipo pelo tamanho.
Possui validação de **dígito verificador** integrada.

**Arquivo:** [`src/components/MaxInputCpfCnpj.vue`](src/components/MaxInputCpfCnpj.vue)
**Aliases:** `InputCpfCnpj`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `string \| null` | `''` | Valor do documento (apenas números) |
| `cpf` | `boolean` | — | Força modo CPF (máscara e validação) |
| `cnpj` | `boolean` | — | Força modo CNPJ (máscara e validação) |
| `required` | `boolean` | `false` | Campo obrigatório |
| + todas as props do `InputBase` | | |

**Máscara dinâmica:** `###.###.###-##` (CPF) ↔ `##.###.###/####-##` (CNPJ)
**Eventos:** `update:modelValue` (debounce 500ms), `complete`
**Erros automáticos:** "CPF inválido", "CNPJ inválido", "Documento inválido"

---

### MaxInputDatePicker

Selecionador de data baseado no DatePicker do PrimeVue.

**Arquivo:** [`src/components/MaxInputDatePicker.vue`](src/components/MaxInputDatePicker.vue)
**Aliases:** `InputDatePicker`

Herda todas as props do `InputBase` + props do DatePicker PrimeVue.

---

### MaxInputSelect

Campo de seleção (dropdown) com suporte a opções simples, agrupadas e carregamento dinâmico.

**Arquivo:** [`src/components/MaxInputSelect.vue`](src/components/MaxInputSelect.vue)
**Aliases:** `InputSelect`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any` | `null` | Valor selecionado |
| `options` | `SelectItem[]` | — | Lista de opções |
| `groupOptions` | `SelectGroupOptions` | — | Opções agrupadas |
| `loadOptions` | `() => Promise<any[]>` | — | Função para carregar opções ao abrir |
| `optionValue` | `string` | `'value'` | Campo do valor |
| `optionLabel` | `string` | `'label'` | Campo do label |
| `optionName` | `string` | `'name'` | Campo do nome exibido |
| `default` | `any` | — | Valor padrão quando vazio |

**Eventos:** `update:modelValue`, `before-show`

---

### MaxInputAutoComplete

Campo de autocomplete com opções locais.

**Arquivo:** [`src/components/MaxInputAutoComplete.vue`](src/components/MaxInputAutoComplete.vue)
**Aliases:** `InputAutoComplete`

Herda props do `InputBase` + props do AutoComplete PrimeVue.

---

### MaxInputAutoCompleteApi

Autocomplete que busca dados de uma **API externa** conforme o usuário digita.

**Arquivo:** [`src/components/MaxInputAutoCompleteApi.vue`](src/components/MaxInputAutoCompleteApi.vue)
**Aliases:** `InputAutoCompleteApi`

Herda props do `InputBase` + props do AutoComplete PrimeVue.

---

### MaxInputCheckbox

Checkbox estilizado com integração ao `InputBase`.

**Arquivo:** [`src/components/MaxInputCheckbox.vue`](src/components/MaxInputCheckbox.vue)
**Aliases:** `InputCheckbox`

---

### MaxInputRadio

Grupo de radio buttons.

**Arquivo:** [`src/components/MaxInputRadio.vue`](src/components/MaxInputRadio.vue)
**Aliases:** `InputRadio`

---

### MaxInputSwitch

Switch (interruptor) on/off.

**Arquivo:** [`src/components/MaxInputSwitch.vue`](src/components/MaxInputSwitch.vue)
**Aliases:** `InputSwitch`

---

### MaxInputToggle

Toggle com opções visuais (botões segmentados, similar ao `SelectButton`).

**Arquivo:** [`src/components/MaxInputToggle.vue`](src/components/MaxInputToggle.vue)
**Aliases:** `InputToggle`

---

### MaxInputCoordinateDecimalLat

Input para **latitude** em formato decimal com validação de faixa (-90 a 90).

**Arquivo:** [`src/components/MaxInputCoordinateDecimalLat.vue`](src/components/MaxInputCoordinateDecimalLat.vue)
**Aliases:** `InputCoordinateDecimalLat`

---

### MaxInputCoordinateDecimalLng

Input para **longitude** em formato decimal com validação de faixa (-180 a 180).

**Arquivo:** [`src/components/MaxInputCoordinateDecimalLng.vue`](src/components/MaxInputCoordinateDecimalLng.vue)
**Aliases:** `InputCoordinateDecimalLng`

---

### MaxInputPhoneMail

Input combinado para **telefone ou e-mail** com detecção automática do tipo.

**Arquivo:** [`src/components/MaxInputPhoneMail.vue`](src/components/MaxInputPhoneMail.vue)
**Aliases:** `InputPhoneMail`

---

### MaxInputTypeAddress

Input para endereço com formatação de tipo (rua, avenida, etc.).

**Arquivo:** [`src/components/MaxInputTypeAddress.vue`](src/components/MaxInputTypeAddress.vue)
**Aliases:** `InputTypeAddress`

---

## Telefone

### MaxPhoneField

Campo de **telefone internacional** com seletor de DDI, bandeira do país e máscara dinâmica.

**Arquivo:** [`src/components/MaxPhoneField.vue`](src/components/MaxPhoneField.vue)
**Aliases:** `PhoneField`, `InputPhone`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `string` | `''` | Valor completo (DDI + número, v-model) |
| `noLabel` | `boolean` | `false` | Oculta o label "Telefone" |
| `noIcon` | `boolean` | `false` | Oculta o ícone do WhatsApp à direita |
| + todas as props do `InputBase` | | |

**Funcionalidades:**
- Detecção automática de DDI ao receber valor via v-model (tenta 3, 2, 1 dígito)
- Máscara `(##) 9 #### - ####` para celular BR / `(##) #### - ####` para fixo BR
- Formato livre para números estrangeiros
- Suporte a colagem (Ctrl+V) desativa a máscara temporariamente (50ms)
- Filtro de países por nome ou código DDI
- Debounce de 500ms na emissão do `update:modelValue`

---

## Arquivos e Upload

### MaxInputFile

Área de **seleção de arquivos** com drag-and-drop, drop zone e suporte a **colagem (Ctrl+V)**.
Exibe pré-visualização dos arquivos selecionados (imagens com thumbnail, demais com ícone + tamanho).

**Arquivo:** [`src/components/MaxInputFile.vue`](src/components/MaxInputFile.vue)
**Aliases:** `InputFile`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `File[]` | `[]` | Lista de arquivos selecionados (v-model) |
| `label` | `string` | — | Texto descritivo na zona de drop |

**Atributos HTML especiais:**
- `no-view` / `no-preview` — Oculta a pré-visualização dos arquivos
- `size-files` / `size-preview` — `'mini'` para exibição compacta (apenas ícones)

**Eventos:** `update:modelValue`
**Slots:** `button` (zona de clique), `filesPreview` (pré-visualização)

---

### MaxInputFileUpload

Componente completo para **upload de arquivos com integração a backend**.
Suporta múltiplos arquivos, progresso de upload, thumbnails por tipo (PDF, JPG, PNG) e token CSRF.

**Arquivo:** [`src/components/MaxInputFileUpload.vue`](src/components/MaxInputFileUpload.vue)
**Aliases:** `InputFileUpload`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any[]` | `[]` | Arquivos já enviados (v-model) |
| `token` | `string` | — | Token CSRF enviado via header `X-CSRF-TOKEN` |
| `uploadData` | `Record<string, any>` | `{}` | Dados extras anexados ao FormData (ex: `{ project_id: 123 }`) |
| `label` | `string` | `''` | Rótulo descritivo exibido na área de upload |
| `responseField` | `string` | `'file'` | Campo da resposta JSON da API que contém os dados do arquivo |

**Atributos HTML especiais:**
- `accept` — Tipos de arquivo aceitos (padrão: `.pdf, .jpg, .jpeg, .png, .doc, .docx`)
- `multiple` — Permite múltiplos arquivos (padrão: `true`)
- `auto` — Envia automaticamente ao selecionar (padrão: `true`)
- `disabled` — Desabilita o upload
- `label-disabled` — Texto exibido quando desabilitado

**Eventos:** `file-click` (clique em arquivo), `upload-error` (erro no upload)
**Slots:** `default` (conteúdo do label), `error` (mensagem de erro)

---

### MaxInputFileUploadBig

Versão com **área de upload grande** (ocupa toda a largura/altura disponível).
Inclui animações Lottie para estados de upload e erro.
Wrapper sobre `MaxInputFileUpload` com classe `no-style`.

**Arquivo:** [`src/components/MaxInputFileUploadBig.vue`](src/components/MaxInputFileUploadBig.vue)
**Aliases:** `InputFileUploadBig`

Herda todos os atributos do `MaxInputFileUpload` via `useAttrs()`.

**Slots:** `default`, `uploading` (animação durante upload), `error` (animação de erro)

---

### MaxInputFileUploadButton

Upload simplificado em formato de **botão compacto** (30px de largura).
Ideal para colunas ou barras de ferramentas.

**Arquivo:** [`src/components/MaxInputFileUploadButton.vue`](src/components/MaxInputFileUploadButton.vue)
**Aliases:** `InputFileUploadButton`

Herda atributos do `MaxInputFileUpload` via `useAttrs()`.

**Atributos HTML especiais:**
- `ico` / `icon` / `i` — Ícone do botão (padrão: `'material-symbols:upload-rounded'`)
- `label` — Label textual ao lado do ícone

**Eventos:** `upload` (emitido com os dados do arquivo enviado)

---

### MaxInputFileProject

Área de **upload para projetos** com drag-and-drop e seleção de arquivos via diálogo.
Inclui botão de processamento por IA e checklist de documentos (comentado no código).

**Arquivo:** [`src/components/MaxInputFileProject.vue`](src/components/MaxInputFileProject.vue)
**Aliases:** `InputFileProject`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `filesCheck` | `any` | — | Dados de verificação de arquivos |
| `ready` | `boolean` | `false` | Exibe a checklist de documentos |

**Eventos:** `files-selected` (lista de `File[]`), `process-ai` (clique no botão de IA)

---

## Tabelas

### MaxTable

Tabela baseada no **DataTable do PrimeVue** com estilos Max aplicados (linhas listradas, cabeçalho azul escuro, bordas arredondadas).
Calcula automaticamente a largura da coluna de botões.

**Arquivo:** [`src/components/MaxTable.vue`](src/components/MaxTable.vue)
**Aliases:** `Table`

Aceita todas as props do DataTable PrimeVue via `v-bind`.

**Slots:**
- Todos os slots nativos do DataTable
- `buttons` — Coluna de ações (largura auto-calculada com base no conteúdo)

**Métodos expostos:** `width` — largura calculada da coluna de botões

**Exemplo:**
```vue
<MaxTable :value="dados" stripedRows>
  <Column field="name" header="Nome" />
  <Column field="email" header="Email" />
  <template #buttons="{ data }">
    <MaxIconButton icon="mdi:pencil" @action="editar(data)" />
    <MaxIconConfirm icon="mdi:delete" :acceptProps="{ label: 'Sim', action: () => excluir(data) }" />
  </template>
</MaxTable>
```

---

### MaxTableFields

Tabela **editável declarativa** — cada coluna pode renderizar inputs automaticamente com base na propriedade `input` do `MaxTableColumn`.

**Arquivo:** [`src/components/MaxTableFields.vue`](src/components/MaxTableFields.vue)
**Aliases:** `TableFields`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `list` | `any[] \| Record<string, any>` | `{}` | Dados da tabela |
| `columns` | `MaxTableColumn[]` | `[]` | Definição das colunas (veja [TYPES.md](docs/TYPES.md)) |
| `buttons` | `MaxTableButtons[]` | — | Botões de ação por linha |
| `headerButton` | `string` | — | Texto do cabeçalho da coluna de botões |
| `emptyMessage` | `string` | `'Nenhum registro encontrado'` | Mensagem quando vazio |
| `id` | `string` | ULID gerado | Identificador da tabela |

**Tipos de input suportados:** `text`, `input`, `number`, `select`, `date`, `checkbox`, `textarea`, `increment`, `phone-number`, `auto-complete`, `auto-complete-api`

**Eventos:** `update:field` — `{ row, field, value, index? }`

**Slots:**
- `header-{field}` — Customizar cabeçalho de uma coluna
- `{col.slot}` — Customizar conteúdo de uma coluna
- `buttons` — Customizar botões de ação
- `empty` — Estado vazio

---

### MaxTableColumn

Componente de estilos para coluna individual. Aplica a estilização Max (cabeçalho azul, linhas listradas) ao `DataTable`.
Sem props próprias — funciona como container de estilos CSS.

**Arquivo:** [`src/components/MaxTableColumn.vue`](src/components/MaxTableColumn.vue)
**Aliases:** `TableColumn`

---

## Layout e Grid

### MaxGrid

Sistema de **grid flexível** (flexbox com wrap) para organizar componentes lado a lado.
Gap padrão de 13px vertical × 8px horizontal.

**Arquivo:** [`src/components/MaxGrid.vue`](src/components/MaxGrid.vue)
**Aliases:** `Grid`

| Prop | Tipo | Descrição |
|------|------|-----------|
| `label` | `string` | Label exibido acima do grid (estilo fieldset, posicionado absolute) |
| `labelCenter` | `boolean` | Centraliza o label horizontalmente |

**Uso com shortcuts de tamanho:**
```vue
<MaxGrid>
  <MaxInputText s50 v-model="nome" label="Nome" />     <!-- 50% da largura -->
  <MaxInputText s50 v-model="email" label="Email" />    <!-- 50% da largura -->
  <MaxInputText s100 v-model="obs" label="Observação" /> <!-- 100% da largura -->
</MaxGrid>
```

---

### MaxGridCols

Grid baseado em **CSS Grid** com 24 colunas. Filhos controlam quantas colunas ocupam via `grid-column: span N`.

**Arquivo:** [`src/components/MaxGridCols.vue`](src/components/MaxGridCols.vue)
**Aliases:** `GridCols`

Sem props — recebe atributos via `useAttrs()`.

**Estrutura CSS:** `grid-template-columns: repeat(24, 1fr)`, gap de 15px × 10px.

**Uso:**
```vue
<MaxGridCols>
  <MaxInputText style="grid-column: span 12;" v-model="nome" label="Nome" /> <!-- 12 de 24 colunas -->
  <MaxInputText style="grid-column: span 12;" v-model="email" label="Email" />
</MaxGridCols>
```

---

## Overlays

### MaxModal

Modal flutuante **centralizado na tela** com overlay escuro (60% opacidade), título/subtítulo e animação de fade.
Usa `useModalStore` para controle de visibilidade global (apenas um modal por vez).

**Arquivo:** [`src/components/MaxModal.vue`](src/components/MaxModal.vue)
**Aliases:** `Modal`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `icon` / `i` | `string` | — | Ícone do botão gatilho |
| `label` | `string` | — | Label do botão gatilho (se presente, usa MaxButton em vez de MaxIconButton) |
| `title` | `string` | `'Titulo'` | Título do modal |
| `subtitle` | `string` | `'Sub Titulo'` | Subtítulo |
| `size` / `scale` | `string \| number` | — | Tamanho do ícone |
| `loading` | `boolean` | `false` | Estado de carregamento |
| `dark` | `number` | `0.4` | Opacidade do ícone para fundos claros |
| `route` | `string` | — | Rota de navegação |
| `rotate` | `number` | — | Rotação do ícone |

**Slots:**
- `button` — Personalizar o botão gatilho
- `header` — Personalizar o cabeçalho (título + botão fechar)
- `content` — Conteúdo principal
- `default` — Conteúdo alternativo

---

### MaxPopover

Popover flutuante com **posicionamento inteligente** (detecta bordas da tela e inverte direção) e seta direcional.

**Arquivo:** [`src/components/MaxPopover.vue`](src/components/MaxPopover.vue)
**Aliases:** `Popover`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `icon` / `i` | `string` | — | Ícone do botão gatilho |
| `label` | `string` | — | Label do botão gatilho |
| `title` | `string` | `'Titulo'` | Título do popover |
| `subTitle` | `string` | `'Sub Titulo'` | Subtítulo |
| `size` / `sizeIcon` | `string \| number` | — | Tamanho do ícone |
| `dark` | `number` | `0.4` | Opacidade do ícone |
| `loading` | `boolean` | `false` | Estado de carregamento |

**Métodos expostos:** `show()`, `hide()`, `toggle()`

**Slots:** `button`, `header`, `content`, `default`

**Posicionamento automático:**
- Abre abaixo do botão por padrão
- Inverte para cima se não houver espaço abaixo
- Ajusta horizontalmente se sair da tela

---

### MaxPopoverConfirm

Popover de **confirmação global** renderizado em posição fixed.
Não possui props — é controlado exclusivamente pelo `useConfirmStore`.
Deve ser colocado uma única vez no layout raiz.

**Arquivo:** [`src/components/MaxPopoverConfirm.vue`](src/components/MaxPopoverConfirm.vue)
**Aliases:** `PopoverConfirm`

**Funcionalidades:**
- Exibe mensagem de confirmação com ícone de interrogação
- Botões de aceitar e rejeitar configuráveis via `useConfirmStore`
- Posicionamento inteligente (inverte se sair da tela)
- Overlay com clique para fechar

**Uso:** Normalmente disparado indiretamente por `MaxIconConfirm` ou `MaxTogglePopover`.

---

### MaxTogglePopover

Botão que alterna visibilidade do **popover de confirmação** (idêntico ao `MaxIconConfirm` no comportamento).
Diferença: permite usar label para botões textuais.

**Arquivo:** [`src/components/MaxTogglePopover.vue`](src/components/MaxTogglePopover.vue)
**Aliases:** `TogglePopover`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `icon` / `i` | `string` | — | Ícone do botão |
| `label` | `string` | — | Label textual (se presente, usa MaxButton) |
| `message` | `string` | `'Deseja continuar?'` | Mensagem de confirmação |
| `messageIcon` | `string` | — | Ícone ao lado da mensagem |
| `acceptProps` | `{ label, icon?, action }` | `{ label: 'Sim' }` | Botão de aceitar |
| `rejectProps` | `{ label, icon?, action }` | `{ label: 'Não' }` | Botão de rejeitar |
| `size` / `scale` | `string \| number` | — | Tamanho do ícone |
| `dark` | `number` | `0.4` | Opacidade do ícone |
| `loading` | `boolean` | `false` | Estado de carregamento |

---

## Ícones e Status

### MaxIcon

Componente de ícone padronizado que busca SVGs do **Iconify** via API, com cache em localStorage.
Os ícones são agrupados em lote para minimizar requisições.

**Arquivo:** [`src/components/MaxIcon.vue`](src/components/MaxIcon.vue)
**Aliases:** `Icon`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `icon` / `i` | `string` | — | Nome do ícone Iconify (ex: `'mdi:home'`, `'ph:file-pdf-light'`) |
| `size` | `string \| number` | `'1rem'` | Tamanho (em `rem` se número, ou com unidade CSS) |
| `rotate` | `number` | — | Rotação em graus |
| `flip` | `string` | — | `'horizontal'`, `'vertical'`, `'h'`, `'v'`, `'x'`, `'y'`, `'xy'` |
| `dark` | `number` | — | Opacidade para fundos claros (ex: `0.5` → `rgba(0,0,0,0.5)`) |
| `light` | `number` | — | Opacidade para fundos escuros (ex: `0.5` → `rgba(255,255,255,0.5)`) |
| `color` | `string` | — | Cor CSS fixa |
| `hoverColor` / `colorHover` | `string` | — | Cor no hover |
| `checked` | `boolean` | — | Exibe sub-ícone de check (✓) no canto inferior direito |
| `plus` | `boolean` | — | Exibe sub-ícone de adição (+) no canto inferior direito |

**Atributos dinâmicos via HTML:**
- `color-blue-600` → `color: var(--blue-600) !important`
- `color-hover-red-500` / `hover-red-500` → cor de hover via variável CSS
- `pointer` → ativa efeito de hover com escurecimento automático (13% darker)

---

### MaxDoneIcon

Ícone estático de **sucesso** (check verde dentro de círculo). Tamanho fixo de 24×24px.
Utiliza SVG inline com fundo branco circular atrás do ícone para visibilidade.

**Arquivo:** [`src/components/MaxDoneIcon.vue`](src/components/MaxDoneIcon.vue)
**Aliases:** `DoneIcon`

Sem props. Cor: `var(--green-b-500)`.

---

### MaxWaitIcon

Ícone **animado de espera** (ampulheta que gira). Tamanho fixo de 24×24px.
Animação SVG com duração de 2s por ciclo (areia descendo + rotação de 180°).

**Arquivo:** [`src/components/MaxWaitIcon.vue`](src/components/MaxWaitIcon.vue)
**Aliases:** `WaitIcon`

Sem props.

---

### MaxErrorIcon

Ícone estático de **erro** (X vermelho dentro de círculo). Tamanho fixo de 24×24px.
Possui sombra sutil para destaque visual.

**Arquivo:** [`src/components/MaxErrorIcon.vue`](src/components/MaxErrorIcon.vue)
**Aliases:** `ErrorIcon`

Sem props. Cor: `var(--red-b-575)`.

---

## Loaders

### MaxLoader

Indicador de carregamento visual de tela inteira. Usa `MaxLoaderIcon` (spinner) com label opcional.
Ocupa 100% do container pai com fundo `var(--background-0)`.

**Arquivo:** [`src/components/MaxLoader.vue`](src/components/MaxLoader.vue)
**Aliases:** `Loader`

| Atributo (via attrs) | Tipo | Descrição |
|------|------|-----------|
| `show` | `boolean` | Controla visibilidade (padrão: `true`) |
| `label` | `string` | Texto exibido abaixo do spinner |

---

### MaxLoaderAi

Loader temático para **processamentos de IA**. Exibe animação Lottie (400×400px) com overlay semitransparente (70% opacidade).

**Arquivo:** [`src/components/MaxLoaderAi.vue`](src/components/MaxLoaderAi.vue)
**Aliases:** `LoaderAi`

| Atributo (via attrs) | Tipo | Descrição |
|------|------|-----------|
| `show` | `boolean` | Controla visibilidade (padrão: `true`) |
| `label` | `string` | Texto exibido abaixo da animação |

---

### MaxLoaderIcon

Spinner SVG **inline** com gradiente e animação de rotação infinita (1s linear).
Tamanho fixo de 55×55px. Cor: `var(--orange-300)`.

**Arquivo:** [`src/components/MaxLoaderIcon.vue`](src/components/MaxLoaderIcon.vue)
**Aliases:** `LoaderIcon`

Sem props. Usado internamente por `MaxLoader`.

---

## Transições e Animações

### MaxAnimateFade

Animação avançada de **fade in/out** usando `motion-v` (Motion One).
Suporta três estados: conteúdo visível, loading e erro.

**Arquivo:** [`src/components/MaxAnimateFade.vue`](src/components/MaxAnimateFade.vue)
**Aliases:** `AnimateFade`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `show` | `boolean` | `false` | Exibe o conteúdo do slot padrão |
| `duration` | `number` | `0.15` | Duração da animação em segundos |
| `loading` | `boolean` | — | Se `show=false` e `loading=true`, exibe o `MaxLoader` |
| `label` | `string` | — | Label do loader |
| `loadingIcon` | `string` | — | Ícone do loader |
| `error` | `boolean` | — | Se `show=false` e `error=true`, exibe ícone + mensagem de erro |
| `errorIcon` | `string` | — | Ícone de erro (ex: `'wordpress:caution'`) |
| `errorMessage` / `errorMsg` | `string` | — | Mensagem de erro exibida |
| `transparent` | `boolean` | — | Fundo transparente no estado loading |

**Exemplo:**
```vue
<MaxAnimateFade :show="dados.length > 0" loading error-message="Falha ao carregar">
  <MeuConteudo :dados="dados" />
</MaxAnimateFade>
```

---

### TransitionFade

Transição de **fade simples** usando `<Transition>` do Vue. Duração de 0.2s com delay de 0.2s na saída.

**Arquivo:** [`src/components/TransitionFade.vue`](src/components/TransitionFade.vue)

Sem props. Wrap o conteúdo filho com transição de opacidade.

```vue
<TransitionFade>
  <div v-if="visivel">Conteúdo</div>
</TransitionFade>
```

---

### MaxTransitionFadeLight

Transição de **fade suave** (0.5s) sem delay. Mais lenta que `TransitionFade`.

**Arquivo:** [`src/components/MaxTransitionFadeLight.vue`](src/components/MaxTransitionFadeLight.vue)
**Aliases:** `TransitionFadeLight`

Sem props.

---

### MaxTransitionUp

Transição de **slide vertical** — conteúdo entra de baixo para cima (150px) com fade.
Delay de 0.2s na entrada, 0.2s na saída.

**Arquivo:** [`src/components/MaxTransitionUp.vue`](src/components/MaxTransitionUp.vue)
**Aliases:** `TransitionUp`

Sem props.

---

## Display e Outros

### MaxBadgeComponent

Badge com ícone, cor dinâmica e texto. Calcula automaticamente cores de texto e ícone com base na cor de fundo (claro/escuro).

**Arquivo:** [`src/components/MaxBadgeComponent.vue`](src/components/MaxBadgeComponent.vue)
**Aliases:** `BadgeComponent`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `icon` / `i` | `string` | — | Ícone Iconify exibido dentro do badge |
| `label` / `value` / `msg` / `text` / `number` | `string` | — | Texto do badge (múltiplos aliases) |
| `size` / `scale` | `string \| number` | — | Tamanho (PrimeVue: `'lg'`, `'xl'`) |
| `color` / `bgColor` | `string` | `'var(--orange-600)'` | Cor de fundo do badge |
| `textColor` | `string` | (auto) | Cor do texto (calculada automaticamente se omitida) |
| `iconColor` | `string` | — | Cor do ícone |
| `iconValue` | `string` | — | Valor exibido no círculo colorido (ex: quantidade) |
| `overlay` | `boolean` | — | Usa `OverlayBadge` do PrimeVue em vez de `Badge` |

**Atributos dinâmicos:**
- `color-red-600` → define cor de fundo via variável CSS

---

### MaxEmptyDiv

Placeholder visual para **áreas vazias**. Exibe ícone e label opcionais dentro de um container com fundo sutil.

**Arquivo:** [`src/components/MaxEmptyDiv.vue`](src/components/MaxEmptyDiv.vue)
**Aliases:** `EmptyDiv`

| Atributo (via attrs) | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `icon` | `string` | `'ph:empty'` | Ícone Iconify exibido |
| `iconSize` | `number` | `2` | Tamanho do ícone |
| `label` | `string` | — | Texto exibido (renderizado com v-html) |

**Atributos HTML especiais:**
- `transparent` — Fundo transparente sem borda
- `nospace` — Posicionamento absoluto (ocupa todo o pai)

**Slots:** `default`, `icon`, `label`

---

### MaxLink

Link estilizado usando `<router-link>` do Vue Router.

**Arquivo:** [`src/components/MaxLink.vue`](src/components/MaxLink.vue)
**Aliases:** `Link`

| Prop | Tipo | Descrição |
|------|------|-----------|
| `route_name` | `string` | Nome da rota Vue Router |
| `route` | `string` | Alias para `route_name` |

**Slots:** `default` (conteúdo do link)

---

### MaxLogo

Exibição de **logotipo** com link para a home (`/`). Possui efeito de hover (scale 1.1).

**Arquivo:** [`src/components/MaxLogo.vue`](src/components/MaxLogo.vue)
**Aliases:** `Logo`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `src` | `string` | `'get_file?file=logo.svg'` | URL da imagem do logotipo |
| `rounded` | `boolean` | `false` | Aplica borda arredondada |

**Atributos HTML especiais de tamanho:**
- `pp` — max-width: 50px
- `p` — max-width: 100px
- `m` — max-width: 150px
- `g` — max-width: 200px
- `gg` — max-width: 250px
- `fill` — Fundo `var(--sky-950)`
- `rounded-3` — border-radius: 3rem

---

### MaxMaps

Integração com **Google Maps** usando `vue3-google-map`.
Exibe mapa satélite com marcador arrastável (draggable).

**Arquivo:** [`src/components/MaxMaps.vue`](src/components/MaxMaps.vue)
**Aliases:** `Maps`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `{ latitude: number, longitude: number } \| null` | `null` | Coordenadas (v-model) |

O mapa é renderizado apenas quando `latitude` e `longitude` são válidos.
Zoom padrão: 20. Tipo do mapa: satélite.

**Eventos:** `update:modelValue` (emitido ao arrastar o marcador, com 7 casas decimais)

---

### MaxPdfView

Visualizador de PDF embutido em **modal fullscreen** com backdrop blur.
Inclui barra de ferramentas com zoom in/out e botão fechar.

**Arquivo:** [`src/components/MaxPdfView.vue`](src/components/MaxPdfView.vue)
**Aliases:** `PdfView`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `file` | `string` | `''` | URL do arquivo PDF. O modal abre automaticamente quando o valor muda |

**Funcionalidades:**
- Spinner de progresso com porcentagem durante carregamento
- Zoom incrementos de 5% (in/out)
- Clique fora do PDF para fechar
- Animação de fade (0.6s)

> **Nota:** O componente `vue-pdf-embed` está comentado no código — a renderização do PDF pode estar desabilitada.

---

### MaxUserAvatar

Avatar do usuário com suporte a **imagem ou iniciais** (2 primeiras letras do nome).
Exibe tooltip com o nome completo.

**Arquivo:** [`src/components/MaxUserAvatar.vue`](src/components/MaxUserAvatar.vue)
**Aliases:** `UserAvatar`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `imageUrl` | `string` | — | URL da imagem do avatar (se fornecida, exibe a imagem) |
| `name` | `string` | — | Nome do usuário (gera iniciais se sem imagem, tooltip) |
| `showTooltip` | `boolean` | `true` | Exibe tooltip com o nome ao hover |
| `routeImage` | `string \| null` | — | Rota para carregar a imagem dinamicamente |
| `requestImageData` | `string \| null` | — | Dados para a requisição de imagem |

**Exemplo:**
```vue
<!-- Com imagem -->
<MaxUserAvatar imageUrl="/fotos/joao.jpg" name="João Silva" />

<!-- Sem imagem (exibe "JO") -->
<MaxUserAvatar name="João Silva" />
```

---

### MaxMsgLabels

Exibição de **mensagens de validação** (erro, aviso, obrigatório). Componente legado usado internamente por `InputBase`.

**Arquivo:** [`src/components/MaxMsgLabels.vue`](src/components/MaxMsgLabels.vue)
**Aliases:** `MsgLabels`

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `noErrors` | `boolean` | `false` | Oculta completamente o componente |
| `typeSelect` | `string` | — | Classe CSS adicional (ex: `'select'`) |
| `obrigatorio` | `boolean` | `false` | Exibe asterisco (*) de obrigatório |
| `msgError` | `string` | — | Mensagem de erro (destaque vermelho) |
| `msg` | `string` | — | Mensagem informativa (cor neutra) |

---

### MaxTextInputFloatLabel

**⚠️ Componente descontinuado.** Renderiza uma `<div>` vazia.
Mantido apenas para compatibilidade retroativa.

**Arquivo:** [`src/components/MaxTextInputFloatLabel.vue`](src/components/MaxTextInputFloatLabel.vue)
**Aliases:** `TextInputFloatLabel`

Sem props. Use `InputBase` com `float` no lugar.
