# Achado UX-03: mensagens de formulário são truncadas ou omitidas

## Resumo

`InputBase` reserva uma única linha de altura fixa e aplica ellipsis ao feedback sem alternativa para acessar o texto completo. Além disso, `done === false` pode produzir borda/ícone de erro sem nenhuma mensagem explicativa.

## Severidade e prioridade

- Severidade: alta.
- Prioridade: P1.

## Componentes impactados

`InputBase` e todos os componentes que usam sua área compartilhada de mensagem.

## Evidências

- `src/components/InputBase.vue:227-230,341-364`: grade fixa de 19 px, mensagem de 16 px e `white-space: nowrap/ellipsis` ocultam conteúdo longo.
- `src/components/InputBase.vue:211-220`: `done === false` ativa o estado de erro, mas `displayMessage` retorna vazio quando não existe prop textual.
- Em viewport estreito, regras de negócio em português são cortadas sem tooltip, expansão ou descrição alternativa.

## Causa-raiz

A densidade visual foi implementada como restrição rígida de altura, e o estado booleano de validade foi separado do requisito de explicar como corrigir o campo.

## Impacto

- Mensagens de regra de negócio podem ficar irrecuperáveis.
- Estado visual sem explicação impede correção e aumenta tentativa e erro.
- A região viva existe, mas não anuncia conteúdo quando o erro é apenas booleano.

## Reprodução e verificação

Exibir mensagem longa em campo estreito e inspecionar o texto visível. Montar `InputBase` com `done=false` sem `error/message` e observar estado vermelho sem conteúdo.

## Direção de solução

Permitir feedback multilinha ou fornecer expansão/descrição acessível equivalente. Exigir mensagem para invalidade ou definir fallback informativo coerente com o contrato do campo.

## Critérios de aceite

- Mensagem necessária fica integralmente acessível em qualquer largura suportada.
- Estado de erro sempre possui explicação associada.
- A solução preserva alinhamento compacto sem ocultar instrução.
- Testes cobrem texto longo, viewport estreito e erro booleano sem mensagem.

## Contraevidências consideradas

A reserva fixa preserva alinhamento entre campos; isso não justifica ocultar informação necessária. O ciclo `touched/dirty/submitted` está no achado canônico de validação e o loading de `MaxIconButton` no achado de estados assíncronos.
