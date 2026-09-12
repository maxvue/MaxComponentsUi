# Achado UX-09: editor de lista captura Tab sem rota de saída

## Resumo

`MaxInputTextList` intercepta toda tecla Tab para inserir quatro espaços. O comportamento é útil para edição indentada, mas não oferece tecla alternativa, configuração ou instrução para mover o foco ao próximo controle, aprisionando a navegação sequencial dentro do editor.

## Severidade e prioridade

- Severidade: média.
- Prioridade: P2.

## Evidências

- `src/components/MaxInputTextList.vue:73-99`: qualquer Tab chama `preventDefault()` e altera o texto, com ou sem seleção.
- Não há prop que desative a captura, tratamento de `Escape` seguido de Tab nem instrução acessível sobre como abandonar o campo.
- Focus traps e retorno de foco de overlays foram retirados deste achado e permanecem no documento canônico `usabilidade/ausencia-focus-trap-overlays-flutuantes`.

## Componentes afetados

`MaxInputTextList` e formulários que posicionam ações ou campos após o editor.

## Causa-raiz

Um atalho de edição foi implementado sem conciliar o contrato de navegação por Tab do formulário.

## Impacto

Usuários de teclado não conseguem alcançar o próximo controle pela sequência convencional e podem interpretar o formulário como travado.

## Reprodução e verificação

Focar o textarea e pressionar Tab/Shift+Tab repetidamente; o foco permanece no editor enquanto espaços são inseridos.

## Direção de solução

Oferecer captura configurável e rota de saída descobrível, como Escape seguido de Tab, mantendo indentação quando explicitamente habilitada.

## Critérios de aceite

- Existe caminho documentado e testado para sair pelo teclado.
- A opção de inserir Tab não impede Shift+Tab/navegação quando desativada.
- A instrução fica disponível a tecnologias assistivas.

## Contraevidências consideradas

Editores de código frequentemente capturam Tab, mas precisam oferecer mecanismo alternativo de navegação; o recurso de indentação não é removido pelo achado.
