# Divergência — ligação do editor de regras de preço

Data: 16/10/2026. Projeto consultado: MaxAiManager. Achado fora do escopo de implementação.

## Localização e evidência

- `/home/johnattas/GitHub/MaxAiManager/resources/Vue/Sections/Settings/Ai/ModalAiModel.vue:164-169`: o pai passa `input-rules`/`output-rules` e escuta `update:input-rules`/`update:output-rules`.
- `/home/johnattas/GitHub/MaxAiManager/resources/Vue/Sections/Settings/Ai/ModelPriceRulesEditor.vue:231-254`: o filho declara `pricesInput`/`pricesOutput`, com arrays vazios como padrão, e emite `update:pricesInput`/`update:pricesOutput`.

Esses nomes não são equivalentes por conversão camelCase/kebab-case: `input-rules` corresponderia a `inputRules`, não a `pricesInput`.

## Impacto e limites

A ligação declarada pode deixar o editor sem as regras do model e impedir que suas emissões atualizem o formulário pai. Constatação do desacordo de contrato por leitura; não houve montagem em navegador ou validação do salvamento.

## Encaminhamento

Revisar e alinhar os contratos em tarefa própria, com teste de edição/carregamento e persistência. A criação do `MaxInputAiBillingUnit` não deve tentar corrigir ou mascarar essa integração. Nenhum arquivo do MaxAiManager foi alterado.
