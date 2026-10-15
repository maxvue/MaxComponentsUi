# MaxSteps — CSS responsivo não acompanha integralmente o override mobile

- Data: 15/10/2026.
- Local: `src/components/MaxSteps.vue:210–220, 979–997`; cobertura relacionada em `tests/components/MaxSteps.test.ts:404–420`.
- Evidência: o computed prioriza `isMobile` e depois `mobile`, permitindo `false` explícito; entretanto, a media query `(width <= 768px)` aplica o mixin mobile e oculta labels sem consultar esse override. A suíte unitária confirma existência de labels no DOM, não a visibilidade CSS real.
- Impacto: em viewport estreita, uma instância explicitamente não mobile pode ter classes/DOM de desktop e estilo mobile com labels ocultos. Há também necessidade de revisar separadamente a fronteira CSS inclusiva de 768px versus o helper de breakpoint; a semântica exata deste último não foi verificada nesta sessão.
- Limite da evidência: divergência identificada por leitura; sem execução de browser. Não afirmar resultado de teste nem falha do MaxUse.
- Encaminhamento: definir e testar em tarefa própria a precedência entre overrides e media query. Preservar essa política no ajuste atual de largura para não ampliar o escopo.
