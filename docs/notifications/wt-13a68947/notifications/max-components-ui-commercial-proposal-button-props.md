# Notificação — Atributos `[confirm]` e `[cancel]` com Colchetes Literais em `MaxButton` (`CommercialProposalDetailPage.vue`)

## 1. Localização
- **Arquivo (consumidor `engeapp`):** `/home/johnattas/GitHub/engeapp/resources/Vue/Pages/CommercialProposalDetailPage.vue`
- **Linhas afetadas:** `15`, `59`, `67`, `358`, `359`, `362`, `367`, `412`, `413`

## 2. Impacto
No componente `MaxButton` (`@maxvue/max-components-ui`), `confirm` e `cancel` são props booleanas (`confirm?: boolean`, `cancel?: boolean`) que aplicam as variantes visuais e semânticas de confirmação e cancelamento.

Nas linhas citadas de `CommercialProposalDetailPage.vue`, essas props foram escritas com colchetes literais (`[confirm]` e `[cancel]`), por exemplo:
```html
<MaxButton label="Salvar Proposta" icon="mdi:content-save-outline" [confirm] :loading="proposalStore.saving" @click="saveProposal" />
<MaxButton label="Não, continuar aqui" [cancel] icon="mdi:close" @click="homologationModalRef?.toggle()" />
```

Como o template compiler do Vue 3 trata `[confirm]` como um atributo HTML literal de nome `[confirm]` (e não como a prop booleana `confirm`), as props `props.confirm` e `props.cancel` permanecem `false` em tempo de execução, impedindo que os botões recebam a estilização de confirmação/cancelamento do `MaxButton` (diferentemente da linha `288` do mesmo arquivo, onde `confirm` foi escrito sem colchetes e funciona como esperado).

## 3. Evidência e Recomendação
- **Evidência:** Comparação entre as linhas `15, 59, 67, 358, 359, 362, 367, 412, 413` (`[confirm]` / `[cancel]`) e a linha `288` (`confirm`) de `/home/johnattas/GitHub/engeapp/resources/Vue/Pages/CommercialProposalDetailPage.vue`, confrontada com `MaxButtonProps` em `src/components/MaxButton.vue`.
- **Recomendação:** Substituir `[confirm]` por `confirm` e `[cancel]` por `cancel` no arquivo consumidor `CommercialProposalDetailPage.vue` em tarefa dedicada no repositório `engeapp`.
