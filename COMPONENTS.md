# Catálogo de Componentes - MaxComponentsUi

Esta biblioteca fornece uma série de componentes Vue 3 prontos para uso, baseados no PrimeVue e estilizados para o ecossistema Max.

## Categorias

- [Base](#base)
- [Botões](#botões)
- [Inputs de Texto](#inputs-de-texto)
- [Inputs Especializados](#inputs-especializados)
- [Arquivos e Upload](#arquivos-e-upload)
- [Layout e Grid](#layout-e-grid)
- [Feedback e Outros](#feedback-e-outros)

---

## Base

### [InputBase](src/components/InputBase.vue)
O wrapper fundamental para quase todos os componentes de entrada. Gerencia rótulos (labels), ícones, mensagens de erro e estados de validação.

---

## Botões

### [MaxButton](src/components/MaxButton.vue)
Botão estendido do PrimeVue com suporte a ícones, badges, loading animado e contagem regressiva.
- **Exportado como:** `MaxButton`, `Button`, `Botao`.

### [IconButton](src/components/Components/IconButton.vue)
Um botão simplificado focado apenas em ícones.

---

## Inputs de Texto

### [MaxInputText](src/components/MaxInputText.vue)
Input de texto padrão.
- **Exportado como:** `MaxInputText`, `InputText`, `InputField`.

### [MaxInputTextArea](src/components/MaxInputTextArea.vue)
Área de texto multi-linha com redimensionamento automático.

### [MaxInputNumber](src/components/MaxInputNumber.vue)
Campo numérico com suporte a formatação.

---

## Inputs Especializados

### [MaxInputCep](src/components/MaxInputCep.vue)
Input com máscara para CEP (00.000-000) e validação automática.

### [MaxInputCpfCnpj.vue](src/components/MaxInputCpfCnpj.vue)
Input dinâmico para CPF ou CNPJ com máscara e validação conforme o tamanho do dado.

### [MaxInputDatePicker](src/components/MaxInputDatePicker.vue)
Selecionador de data.

### [MaxInputSelect](src/components/MaxInputSelect.vue)
Campo de seleção (Dropdown).

### [MaxInputAutoCompleteApi](src/components/MaxInputAutoCompleteApi.vue)
Autocomplete que busca dados diretamente de uma API externa.

---

## Arquivos e Upload

### [MaxInputFileUpload](src/components/MaxInputFileUpload.vue)
Componente completo para upload de arquivos.

### [MaxInputFile](src/components/MaxInputFile.vue)
Input simples para seleção de arquivo.

---

## Layout e Grid

### [Grid](src/components/Grid.vue)
Sistema de grid flexível para organizar componentes.

### [MaxTable](src/components/MaxTable.vue)
Tabela de dados baseada no DataTable do PrimeVue com estilos Max aplicados.

---

## Feedback e Outros

### [Loader](src/components/Components/Loader.vue)
Indicador de carregamento visual.

### [MaxUserAvatar](src/components/MaxUserAvatar.vue)
Exibição de avatar do usuário com suporte a iniciais ou imagem.

### [MaxIcon](src/components/MaxIcon.vue)
Componente de ícone padronizado utilizando Iconify.
