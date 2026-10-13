# Testes mockados do preset divergem da regra geradora atual

- Data: 2026-10-13; revisão `3b9c5ce94b68f7cae3186152a70f2bd80016cecd`.
- Localização: `tests/preset/presetMaxUno.test.ts:433–490` versus `src/presetMaxUno.ts:83–125`.
- Evidência por leitura: `stylesFor` retorna `rule[1](match)` e os testes comparam esse resultado a um objeto literal. A implementação atual usa `function* (match, { symbols })`, que retorna um iterador e espera contexto do UnoCSS. Além disso, o teste considera `s-50-start-end` inválido, mas a regex atual aceita dois sufixos.
- Impacto: o contrato esperado pelo harness mockado está desatualizado; pode bloquear validação integral futura e não comprova CSS efetivamente gerado. Isso é divergência estática, não relato de execução/falha com código de saída.
- Localização adicional: `tests/preset/presetMaxUno.test.ts:157` ainda nomeia o token como porcentagem, embora a fórmula corrente seja em pixels.
- Escopo atual: não alterar esses testes, enfraquecer asserções ou ajustar runtime para satisfazer expectativa antiga dentro da atualização documental.
- Próxima ação: na execução, registrar qualquer falha real e diagnosticar em lote. Solicitar autorização para tarefa separada de atualização do harness, mantendo geração real e análise de media queries. Não contornar gates nem declarar suíte aprovada com falha vigente.
