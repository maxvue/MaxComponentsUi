# Plano de implementação

## Objetivo e resultado esperado

Preservar indentação por Tab em `MaxInputTextList` quando desejada, mas oferecer uma rota de saída previsível, configurável, documentada e anunciada a tecnologias assistivas.

## Escopo e fora de escopo

- Em escopo: captura de Tab/Shift+Tab, Escape, instrução acessível e foco do textarea.
- Fora de escopo: focus traps de overlays, realce de sintaxe e algoritmo de Enter/indentação automática.

## Arquivos a alterar/criar

- `src/components/MaxInputTextList.vue`
- `tests/components/MaxInputTextList.test.ts`

## Dependências e ordem

1. Definir prop e atalho de escape.
2. Associar instrução ao textarea.
3. Cobrir edição e navegação em formulário real.

## Passos de implementação

1. Adicionar prop `indentWithTab` com default compatível e documentar que `false` preserva Tab/Shift+Tab nativos.
2. Quando a captura estiver ativa, permitir Escape seguido de Tab ou Shift+Tab sair do editor; Escape arma somente a próxima navegação e qualquer outra tecla cancela o estado.
3. Manter inserção de quatro espaços e seleção atuais apenas para Tab não precedido por Escape; não modificar valor quando a intenção for navegar.
4. Gerar instrução estável (“Pressione Escape e depois Tab para sair do editor”) e associá-la ao textarea via `aria-describedby`, combinando IDs recebidos pelo consumidor.
5. Tornar o estado armado perceptível por status discreto, sem anúncio repetitivo, e preservar indicador de foco visível.

## Migração e compatibilidade

O default mantém o comportamento de edição atual. A nova prop é aditiva. Preservar props, v-model, classes, rolagem sincronizada e Enter. Documentar como optar pela navegação Tab convencional.

## Testes

- Unitários: Tab indenta, seleção é indentada, `indentWithTab=false` não previne Tab/Shift+Tab e Escape arma uma única saída.
- Integração: formulário com controles anterior/posterior comprova foco para frente e para trás.
- Acessibilidade: instrução possui ID existente, está no `aria-describedby` e o foco continua visível.

## Critérios de aceite mensuráveis

- Há ao menos uma rota por teclado testada para sair em ambas as direções.
- Com captura desativada, zero chamadas a `preventDefault` para Tab/Shift+Tab.
- Escape+Tab não altera o texto e move foco exatamente uma vez.
- Indentação e scroll existentes continuam passando.

## Riscos e rollback

Escape pode ter significado para dialogs ancestrais. Conter o evento somente ao armar saída e documentar precedência; testar dentro de modal. Em conflito, adotar atalho configurável mantendo a prop de desativação.

## Validação final

Executar a suíte de `MaxInputTextList`, lint/typecheck e navegar manualmente por um formulário, inclusive dentro de modal, com captura ligada e desligada.
