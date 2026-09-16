# Execução corretiva otimizada — Fix 7

## Objetivo

Concluir os 27 requisitos ainda pendentes do plano original sem repetir a burocracia do fix6. Este é o ponto de entrada. Leia integralmente `docs/optimize-new/fix7/00-coordenacao-e-aceite.md` e depois os sete lotes indicados por ele.

## Regras essenciais

- Capture o baseline real no início com `git fetch origin dev` e `git rev-parse origin/dev`; não use SHA histórico como HEAD atual.
- Use 12 papéis principais: sete líderes de implementação persistentes, três revisores adversariais e dois verificadores finais.
- Os líderes podem criar, em conjunto, no máximo seis auxiliares opcionais para subtarefas realmente independentes. Limite total: 18 agentes; profundidade máxima: líder → auxiliar. Auxiliares não criam outros agentes.
- A capacidade maior do Antigravity é intencionalmente limitada: o pico útil é três líderes e até seis auxiliares. Paralelize somente manifests disjuntos; vagas ociosas são preferíveis a agentes redundantes.
- Reutilize o responsável por `follow-up` em correções. Não crie agente novo para retry, relatório ou repetição de comando.
- Cada agente recebe apenas seu lote, baseline, arquivos relevantes e erro atual. Não envie todo o histórico nem os 89 relatórios do fix6.
- Durante a implementação, rode testes direcionados. Gates integrais somente nos pontos definidos pelo coordenador.
- Evidência: matriz de 27 linhas, uma por requisito atômico, sete relatórios de lote, três revisões e dois aceites finais. Logs completos ficam em arquivos de log, não copiados para Markdown ou prompts.
- Não reduza thresholds, remova/afrouxe testes ou introduza `.skip`, `.todo`, `.only`, assert tautológico, retorno antecipado, `catch` vazio ou mock do comportamento sob teste.

## Ordem

1. Coordenador: `00-coordenacao-e-aceite.md`.
2. Onda A paralela: lotes `01`, `02` e `03`, com pico máximo de nove agentes.
3. Integração e revisão adversarial da Onda A.
4. Onda B paralela: lotes `04`, `05` e `06`, respeitando o saldo global de seis auxiliares.
5. Integração e revisão adversarial da Onda B.
6. Lote `07`, após `01`, `05` e `06` estarem integrados.
7. Revisão transversal, reparos pelos implementadores originais e gates finais.

Não declare sucesso com requisito aberto ou bloqueado. Bloqueio externo comprovado pode encerrar honestamente a sessão, mas nunca ser apresentado como conclusão.
