# Migração: Independência do PrimeVue

Documentação de controle do esforço para remover **100% da dependência do PrimeVue** da
`@maxvue/max-components-ui`, preservando a API pública, os estilos e o comportamento
atuais.

**Motivação:** a partir do PrimeVue 5 a biblioteca deixará de ser open source.

---

## Arquivos

| Arquivo | Papel |
|---|---|
| [`execution.md`](execution.md) | **Protocolo do agente executor.** Abra uma sessão nova e diga *"Leia `prime_vue_migration/execution.md` e execute"*. |
| [`status.yaml`](status.yaml) | **Fonte de verdade do progresso.** 38 itens com status de execução e de verificação. |
| [`plans/`](plans/) | Um plano de implementação por item (ou grupo de itens). |

---

## Como usar

```
Leia prime_vue_migration/execution.md e execute.
```

O agente roda em loop: pega o próximo item pendente, implementa, testa, dispara um
subagente verificador (Opus 5), e só avança quando aprovado. Ele para sozinho quando
todos os itens estiverem concluídos — ou quando encontrar o item 36, que exige uma
decisão sua.

---

## O mapa

**34 arquivos** de `src/` referenciam o PrimeVue hoje, a partir de **três** pacotes
distintos — `primevue`, `@primeuix/themes` e `@primevue/auto-import-resolver`. Eles
consomem **19 primitivas**:

`InputText` · `Select` · `Button` · `AutoComplete` · `DatePicker` · `InputNumber` ·
`Checkbox` · `ToggleSwitch` · `ColorPicker` · `Menu` · `Drawer` · `VirtualScroller` ·
`FileUpload` · `ProgressSpinner` · `DataTable` · `Column` · `Badge` · `OverlayBadge` ·
`Avatar` · `Tooltip`

### Fases

| Fase | ids | Conteúdo |
|---|---|---|
| **0 — Primitivas base** | 1–5 | `MaxBaseInput`, `MaxBaseOverlay`, `MaxBaseSpinner`, `MaxBaseVirtualScroller`, `v-tooltip` |
| **1 — Inputs de texto** | 6–15 | 10 componentes que só dependem de `MaxBaseInput` |
| **2 — Autônomos** | 16–22 | Button, Badge, Avatar, Checkbox, Toggle, Number, PdfView |
| **3 — Overlays** | 23–32 | Select, PhoneField, TagSelect, AutoComplete(+Api), DatePicker, ColorPicker, PopoverMenu, IconPicker, FileUpload |
| **4 — Tabela** | 33–34 | `MaxTable` + `MaxTableColumn` (conjunto indivisível) |
| **5 — Infraestrutura** | 35, 36, 38, 37 | Tema, `prime/index.ts`, resolver, plugin `install()` |

### Restrições de ordem que importam

- **`MaxBaseInput` (id 1) primeiro** — destrava 10 inputs.
- **`MaxInputSelect` (23) antes** de `MaxPhoneField` (24) e `MaxTagSelect` (25).
- **`MaxInputAutoComplete` (26) antes** de `MaxInputAutoCompleteApi` (27).
- **Conjuntos indivisíveis** (migram na mesma passada): {11,12}, {13,14,15}, {33,34}.
- **id 37 por último** — é ele que desinstala as dependências.

---

## Ponto de partida (05/08/2026)

Parte do trabalho **já estava feita** de um esforço anterior. Estes componentes já são
PrimeVue-free e servem de **referência do padrão da casa**:

`InputBase` · `MaxInputSwitch` · `MaxInputRadio` · `MaxInputTextList` ·
`MaxInputTextArea` · `MaxModal` · `MaxPopover` · `MaxToast` · `MaxTableFields` ·
`MaxInputFileUploadBig` · `MaxInputFileUploadButton` · `MaxInputFileProject`

> `InputBase.vue` — o wrapper central de todos os inputs — **já está migrado**. Isso
> reduz muito o risco da Fase 1.

---

## Critério de saída

Quando este comando retornar **vazio**, a migração está completa:

```bash
grep -rn "primevue\|@primeuix\|@primevue" src/ --include='*.vue' --include='*.ts'
```

⚠️ O padrão precisa das três alternativas: `@primevue/auto-import-resolver` é um pacote
**separado** que um `npm uninstall primevue` não remove.

---

## Decisão pendente

O item **36** (`src/prime/index.ts`) re-exporta ~110 componentes crus do PrimeVue como
um entry point público (`@maxvue/max-components-ui/prime`). Removê-lo é breaking change
para apps consumidoras; mantê-lo mantém a dependência.

O agente vai levantar quem realmente usa o quê, apresentar quatro opções e **parar neste
item**, seguindo para os demais. Veja [`plans/36-prime-index.md`](plans/36-prime-index.md).

---

## Princípios da migração

0. 🔒 **`InputBase.vue` é intocável e obrigatório.** Ele já é PrimeVue-free e **não é
   alterado por nenhum item** da migração. Continua sendo o elemento **mais externo** de
   todo componente de input — só o que está *dentro* dele muda. É ele que fornece label,
   ícones, os estados `done`/`error`/`caution`/`required` e a linha de mensagem; perdê-lo
   é regressão silenciosa (o campo continua digitável, só perde label e feedback).
1. **A API pública é sagrada.** Props, eventos, slots e `v-model` não mudam de nome,
   tipo ou semântica.
2. **API do PrimeVue replicada** — mas em conflito, **o componente existente prevalece**.
3. **Classes `p-*` preservadas.** O SCSS deste repo e das apps consumidoras dependem
   delas.
4. **Acessibilidade não regride.** O PrimeVue entregava ARIA e teclado de graça; a
   reimplementação precisa entregar o mesmo.
5. **Teste que não falha quando o código quebra não é teste.** Cada item passa pelo teste
   da mutação.
6. **Evidência antes de afirmação.** Nenhum "passou" sem a saída do comando.
