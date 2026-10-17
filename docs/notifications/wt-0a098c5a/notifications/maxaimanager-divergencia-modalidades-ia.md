# Divergência entre modalidades de preço da tela e enums de IA

- Data: 16/10/2026.
- Projeto: `/home/johnattas/GitHub/MaxAiManager`, consultado somente em leitura.
- Fora do escopo: corrigir consumidores ou migrar preços.

## Localização e evidência

- `resources/Vue/Sections/Settings/Ai/ModelPriceRulesEditor.vue:256–267`: oferece valores `image`, `document`, `video`, `audio` e `audio_live`.
- `app/Enums/AiPriceItemType.php:16–19,24,31`: valores canônicos relacionados incluem `live_audio`, `document_process`, `image_process`, `video_process` e `audio_process`.
- `resources/Vue/Sections/Settings/Ai/ModelPriceRulesEditor.vue:280–283`: operações de cache oferecidas são `read` e `write`.
- `app/Enums/AiCacheOperation.php:7–9`: enum também contém `storage`.

## Impacto e limite

Há incompatibilidade textual comprovada entre catálogos. Não foi comprovado, nesta sessão, o efeito de todos os aliases sobre cada cálculo/salvamento. Uma substituição direta pelo novo seletor canônico pode apresentar valores antigos como inválidos; inferir equivalência e converter automaticamente pode alterar o significado de regras de cobrança.

## Encaminhamento

Na biblioteca, planejar catálogo canônico e retenção visível de desconhecidos, sem conversão automática. Antes de adoção no aplicativo, investigar a cadeia completa de serialização/cálculo e aprovar separadamente a compatibilidade/migração necessária. Nenhum dado real ou valor financeiro foi consultado ou modificado.
