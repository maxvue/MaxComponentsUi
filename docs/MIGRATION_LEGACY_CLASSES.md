# Guia de Migração: Classes Legadas `.p-*` para Classes Canônicas `.max-*`

Este guia documenta o mapeamento entre os seletores legados herdados do PrimeVue (`.p-*`) e a anatomia canônica semântica do Max Design System (`.max-*`), estabelecendo o contrato de compatibilidade e o cronograma de depreciação.

---

## 1. Contexto e Motivação

Durante a migração dos 37 componentes do PrimeVue para implementações 100% nativas em Vue 3, classes com prefixo `.p-*` foram mantidas temporariamente como aliases de compatibilidade para evitar quebras em aplicações consumidoras que customizavam estilos via seletores legados.

A arquitetura interna da `@maxvue/max-components-ui` adota **exclusivamente** classes canônicas `.max-*` para toda a sua estrutura, estilização interna e regras de layout.

---

## 2. Cronograma de Depreciação

| Fase | Status | Descrição |
|---|---|---|
| **Fase 1 (Migração)** | Concluída | Eliminação de 100% dos imports PrimeVue de componentes e runtime. |
| **Fase 2 (Transição)** | **Ativa (Atual)** | Aliases `.p-*` preservados no DOM como classes secundárias. Estilos internos usam `.max-*`. |
| **Fase 3 (Depreciação)** | Próxima Major (v2.0) | Remoção definitiva dos aliases `.p-*` do DOM dos componentes. |

---

## 3. Mapeamento de Classes

A tabela a seguir apresenta os seletores legados mais comuns e seus equivalentes canônicos no Max Components UI:

### Formulários e Entradas

| Classe Legada (`.p-*`) | Classe Canônica (`.max-*`) | Descrição |
|---|---|---|
| `.p-inputtext` | `.max-input-native` | Campo nativo de entrada de texto (`<input>`, `<textarea>`) |
| `.p-inputnumber` | `.max-input-number` | Wrapper do controle de entrada numérica |
| `.p-chips` | `.max-chips` | Contêiner de seleção de tags/chips |
| `.p-chips-token` | `.max-chip` / `.chip-item` | Item individual de chip selecionado |
| `.p-select` / `.p-dropdown` | `.max-select` | Gatilho e wrapper do dropdown de seleção |
| `.p-select-label` | `.max-select-label` | Rótulo/conteúdo visual da opção selecionada |
| `.p-select-overlay` | `.max-select-overlay` | Painel flutuante de opções |
| `.p-select-item` | `.max-select-item` | Opção individual na lista do select |
| `.p-autocomplete` | `.max-autocomplete` | Wrapper do componente de autocompletar |
| `.p-autocomplete-input` | `.max-autocomplete-input` | Campo de digitação com autocompletar |
| `.p-autocomplete-overlay` | `.max-autocomplete-overlay` | Painel de sugestões do autocomplete |
| `.p-toggleswitch` | `.max-switch-toggle` | Alternador liga/desliga |
| `.p-checkbox` | `.max-input-checkbox` | Caixa de seleção |
| `.p-radiobutton` | `.max-input-radio` | Botão de opção rádio |
| `.p-datepicker` / `.p-calendar` | `.max-datepicker-wrapper` | Seletor e calendário de datas |

### Botões e Ações

| Classe Legada (`.p-*`) | Classe Canônica (`.max-*`) | Descrição |
|---|---|---|
| `.p-button` | `.max-button` | Botão primário e secundário |
| `.p-button-icon` | `.max-button-icon` | Ícone interno de botão |
| `.p-button-label` | `.max-button-label` | Rótulo textual de botão |
| `.p-icon-button` | `.max-icon-button` | Botão com apenas ícone |

### Overlays, Modais e Navegação

| Classe Legada (`.p-*`) | Classe Canônica (`.max-*`) | Descrição |
|---|---|---|
| `.p-dialog` | `.max-modal` | Janela modal de diálogo |
| `.p-dialog-header` | `.max-modal-header` | Cabeçalho do modal |
| `.p-dialog-content` | `.max-modal-content` | Conteúdo do modal |
| `.p-drawer` | `.max-drawer` | Painel lateral retrátil (gaveta) |
| `.p-popover` | `.max-popover` | Painel flutuante de conteúdo contextual |
| `.p-tooltip` | `.max-tooltip` | Dica de contexto flutuante |
| `.p-menubar` | `.max-top-toolbar` | Barra de menu superior |
| `.p-avatar` | `.max-avatar` | Imagem ou iniciais de avatar de usuário |

### Tabelas e Coleções

| Classe Legada (`.p-*`) | Classe Canônica (`.max-*`) | Descrição |
|---|---|---|
| `.p-datatable` | `.max-table` / `.max-datatable` | Contêiner principal da tabela de dados |
| `.p-datatable-table` | `.max-table-element` | Elemento `<table>` interno |
| `.p-datatable-header` | `.max-table-header` | Cabeçalho superior da tabela |
| `.p-datatable-thead` | `.max-table-thead` | Linhas de cabeçalho (`<thead>`) |
| `.p-datatable-tbody` | `.max-table-tbody` | Corpo de dados (`<tbody>`) |
| `.p-paginator` | `.max-paginator` | Controles de paginação de dados |

---

## 4. Recomendações para Aplicações Consumidoras

1. **Substitua seletores em folhas de estilo locais**:
   ```scss
   // Antes (legado):
   :deep(.p-select) {
       border-radius: 8px;
   }

   // Depois (canônico):
   :deep(.max-select) {
       border-radius: 8px;
   }
   ```

2. **Evite `!important` desnecessário**: A anatomia canônica `.max-*` possui menor especificidade que os antigos seletores aninhados, facilitando sobrescritas limpas.

3. **Utilize tokens do Design System**: Sempre que possível, utilize variáveis semânticas CSS (`--max-primary-500`, `--background-200`, `--max-focus-ring`) em vez de valores literais de cores e tamanhos.
