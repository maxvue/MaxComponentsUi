# Divergência entre tokens de dispositivo do preset e quebras do MaxGrid

- Data: 2026-10-13; revisão `3b9c5ce94b68f7cae3186152a70f2bd80016cecd`.
- Localização: `src/presetMaxUno.ts:83–121` e `src/components/base/gridSlotRows.ts:17,69–109`.
- Evidência por leitura: o preset aceita até dois sufixos entre `start`, `end`, `desktop`, `mobile`, `tablet`; o parser do MaxGrid aceita apenas um `start` ou `end`, sem dispositivo. Portanto `s7-end-mobile` pode gerar dimensões e `break-after` em media query, mas não é reconhecido como fronteira de segmento pelo MaxGrid.
- Impacto: expectativa de quebra responsiva pode não ser atendida. Propriedades CSS de fragmentação não comandam wrap em flexbox comum. Dimensões do token continuam incondicionais.
- Outro limite observado: a regex do preset aceita `s-50-start-end`, mas o gerador escolhe somente a primeira posição; o parser do grid rejeita esse token. Não promover essas combinações ambíguas.
- Escopo atual: documentação somente. A spec exige explicar a limitação, não implementar suporte responsivo nem modificar parsers.
- Próxima ação: se houver pedido específico de suporte responsivo, definir contrato comum, testes geométricos e comportamento de atualização antes de implementar. Nenhum teste foi executado nesta sessão.
