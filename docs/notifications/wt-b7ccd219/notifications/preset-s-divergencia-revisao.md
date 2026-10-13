# Divergência de revisão da regra s

- Data: 2026-10-13.
- Local: `src/presetMaxUno.ts:81–83` da worktree `wt-b7ccd219`, comparado por leitura à raiz `/home/johnattas/GitHub/MaxComponentsUi/src/presetMaxUno.ts:83–95`.
- Evidência: a worktree define `flex: 1 0 calc(n% - 8px)` e aceita somente o número; a raiz define `flex: 1 1 0%`, mínimo `n × 20px` e máximo padrão `n × 24px`, com sufixos `full`, `max` e numérico. A regra da raiz coincide com a fornecida pelo usuário.
- Impacto: documentação nova nesta branch pode ser interpretada como funcionalidade já presente nela; teste local da regra nova falharia sem integração. Mesmos nomes possuem significados diferentes entre revisões.
- Próxima ação: responsável confirmar integração/revisão pretendida ou manter nota documental explícita de disponibilidade. Não portar a regra ou alterar testes no escopo documental. Não houve execução de teste nem investigação de outras worktrees.
