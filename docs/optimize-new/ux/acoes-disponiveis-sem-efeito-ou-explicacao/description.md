# Achado UX-11: ações disponíveis sem efeito ou explicação

## Resumo

Alguns controles mantêm aparência e semântica de ação mesmo quando deliberadamente não farão nada, ou descartam entrada inválida e fecham o contexto sem explicar. Isso quebra a relação previsível entre rótulo, clique e resultado.

## Severidade e prioridade

- Severidade: média-alta. Prioridade: P2.

## Evidências

- `src/components/MaxAuthCard.vue:62-69,396-407,495-507`: durante cooldown, o CTA permanece habilitado, mostra “Solicitar novamente (Ns)” e o clique termina em no-op.
- `src/components/MaxInputMarkdownToolbar.vue:162-172,186-196`: entradas de link/imagem usam placeholder sem label e ação genérica “OK”.
- `src/components/MaxInputMarkdownToolbar.vue:284-290,305-309`: URL rejeitada por `isSafeUrl` não gera mensagem; o popover fecha e perde contexto.

## Componentes afetados

`MaxAuthCard` e `MaxInputMarkdownToolbar`.

## Causa-raiz

Disponibilidade, validação e microcopy são tratadas como detalhes visuais, não como estados do contrato de ação. O controle não comunica por que não pode agir nem mantém entrada para correção.

## Impacto

Cliques repetidos, dúvida sobre responsividade e perda de texto digitado. Rótulos genéricos não preservam o vocabulário da ação.

## Reprodução e verificação

Solicite OTP e clique durante cooldown. No Markdown, informe URL insegura/inválida e pressione “OK”.

## Direção de solução

Refletir indisponibilidade em estado disabled com explicação/contagem, manter foco e entrada em validação rejeitada, exibir correção específica e usar rótulos verbais (“Inserir link”).

## Critérios de aceite

- Todo controle habilitado produz resultado ou feedback imediato.
- Cooldown é perceptível e anunciado sem CTA enganoso.
- URL inválida preserva entrada, explica o motivo e permite correção.
- Ação e feedback usam o mesmo verbo/contexto.

## Possíveis contraevidências

Manter o CTA focável pode tornar a contagem visível, e rejeitar URL insegura é correto. O problema é a ausência de estado e explicação, não a validação/cooldown em si.
