# Plano de implementação — disabled completo nos selects

## Objetivo e escopo

Remover `MaxInputSelect` e `MaxTagSelect` desabilitados da ordem de Tab, anunciar `aria-disabled=true` e impedir abertura por qualquer entrada, restaurando tudo ao reabilitar.

## Fora de escopo

Não alterar seleção, filtragem, estilo geral ou semântica de opções individualmente desabilitadas; o foco é o controle composto disabled.

## Arquivos

- Alterar os dois SFCs e seus testes em `tests/components/`.
- Coordenar atributos com a migração de `InputBase`.

## Ordem e passos

1. Criar testes falhando para mouse, Enter, Space, setas e Tab.
2. Definir `:tabindex="disabled ? -1 : 0"` e `:aria-disabled="disabled ? 'true' : undefined"` no dono do combobox.
3. Preservar guards e fechar/resetar overlay se `disabled` mudar para true enquanto aberto.
4. Bloquear foco programático/handlers de filtro e devolver foco de forma segura.
5. Ao voltar a false, restaurar tabindex, abertura e teclado sem remontar estado selecionado.
6. Garantir classe/cursor/opacidade coerentes e option disabled independente.

## Migração e testes

Sem API nova. Mudança de tab order é correção. Unitários cobrem toggle dinâmico e todos os gatilhos; integração teclado/axe valida anúncio e overlay teleportado. Benchmark não se aplica.

## Aceite

Disabled tem tabindex -1/aria-disabled true, nunca abre/emite e fecha se ativado; enabled restaura tabindex 0 e comportamento; axe passa.

## Riscos e rollback

Fechar ao desabilitar pode disparar eventos; manter contrato atual de hide. Foco já presente precisa destino previsível. Rollback preserva ARIA mesmo se o fechamento dinâmico precisar ser revertido.

## Validação final

Testes dos dois selects, navegação Tab manual, axe, suíte, type-check, lint e `git diff --check`.
