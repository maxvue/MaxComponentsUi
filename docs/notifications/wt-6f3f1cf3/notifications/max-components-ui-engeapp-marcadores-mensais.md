# Atenção — start em todos os meses do histórico

- Data: 13/10/2026.
- Local: `/home/johnattas/GitHub/engeapp/resources/Vue/Pages/CommercialProposalDetailPage.vue:143–147`.
- Evidência: o elemento `.month-item` de um `v-for` possui o token estático `s2-30-start` em cada repetição, dentro de um MaxGrid.
- Impacto esperado após a correção planejada: cada mês passará a começar um segmento de linha separado. Não será uma grade de vários meses na mesma linha. Trata-se de consequência verificável da nova semântica, não de confirmação de intenção do usuário para esse trecho.
- Atenção adicional: o histórico externo usa `s3-10-start`, com teto de largura de 200px, enquanto o input interno usa `s10-11`, com mínimo de 200px. Padding/conteúdo podem causar overflow independentemente da quebra; não foi feita medição visual nesta sessão.
- Ação proposta: responsável pelo Engeapp revisar marcadores e largura do histórico em tarefa autorizada própria, caso queira múltiplos meses por linha e painel mais largo. Não alterar cálculos nem dados.
- Estado: notificado; fora do escopo de edição desta worktree. Nenhuma correção no consumidor executada.
