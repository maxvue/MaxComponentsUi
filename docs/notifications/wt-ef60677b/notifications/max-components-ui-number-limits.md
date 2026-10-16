# MaxInputNumber: limites numéricos não implementados

## Localização e evidência

- `src/components/MaxInputNumber.vue:40–84`: props incluem casas decimais, mas não min/max/step.
- `src/components/MaxInputNumber.vue:11–23`: elemento nativo é input type=text.
- `src/components/MaxInputNumber.vue:102–112,125–129`: parser remove caracteres não numéricos e validação não verifica intervalos.
- Consumidor `MaxAiManager/resources/Vue/Sections/Settings/Ai/ModalAiModel.vue:66–87,130–149` passa min/max para contexto, percentual e esperas.

## Impacto

Os limites passados pelo consumidor não são garantidos por este componente; atributos de intervalo em um input textual não substituem validação. A validação de servidor não foi auditada, portanto não se conclui que dados inválidos sejam persistidos.

## Encaminhamento

Correção global fora do escopo do planejamento dos dez novos inputs. Abrir análise específica com regressões antes de mudar o comportamento legado. O plano propõe controle numérico interno isolado com limites reais para não depender desta lacuna. Nenhum código corrigido nesta sessão.
