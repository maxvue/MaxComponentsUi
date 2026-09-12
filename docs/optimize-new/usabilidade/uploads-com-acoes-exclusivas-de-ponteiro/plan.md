# Plano de implementação — upload plenamente operável por teclado

## Objetivo e escopo

Permitir escolher e remover arquivos em `MaxInputFile` com controles nativos nomeados, mantendo drop e paste como métodos adicionais e respeitando disabled.

## Fora de escopo

Não alterar protocolo de upload, validação de arquivos, drag-and-drop, colagem ou ciclo de Object URLs, tratados em achados próprios.

## Arquivos

- Alterar `src/components/MaxInputFile.vue` e `tests/components/MaxInputFile.test.ts`.
- Alterar tipos/documentação para prop `disabled` e nomes, se ainda ausentes.
- Coordenar com isolamento de paste/cleanup de URLs.

## Ordem e passos

Dependência: integrar antes o contrato de atributos do `InputBase` e coordenar o mesmo arquivo com o achado de paste/URLs.

1. Criar regressões teclado/leitor.
2. Substituir chooser visual por `label for=<input-id>` ou button nativo que aciona input; esconder input com classe visually-hidden, não `display:none` quando a associação exigir foco.
3. Usar ID único e nome acessível derivado do label sem HTML.
4. Substituir lixeira `div` por `button type=button` com `aria-label="Remover <nome>"` e área de toque preservada.
5. Propagar disabled ao chooser/input/removers e impedir drop/paste.
6. Manter `stopPropagation` necessário para remoção não reabrir chooser.
7. Anunciar atualização da lista/erros em região live moderada, sem repetir todo conteúdo.
8. Validar slots: documentar responsabilidades ou fornecer slot props com attrs acessíveis obrigatórios.

## Migração e testes

Classes podem ser mantidas nos novos buttons. Eventos/v-model não mudam. Unitários cobrem Enter/Space, remoção, disabled e nomes; integração cobre Tab, chooser mock, drop/paste e lista; axe/leitor valida foco/nome/live. Benchmark não se aplica.

## Aceite

Chooser/remover alcançáveis por Tab e acionáveis por Enter/Space; todos têm nomes específicos; disabled impede todos os métodos; ponteiro continua; axe sem violações.

## Riscos e rollback

Button dentro de container clicável pode disparar duas ações; remover click amplo ou controlar bubbling. Slots podem reintroduzir div; expor contrato/teste. Rollback mantém input nativo visível/focável como fallback seguro.

## Validação final

Testes MaxInputFile, navegação teclado/axe, drop/paste e cleanup, suíte, type-check, lint e `git diff --check`.
