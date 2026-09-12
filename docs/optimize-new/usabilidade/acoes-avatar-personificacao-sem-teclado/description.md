# Ações de avatar e personificação são exclusivas de mouse

## Resumo
Ações condicionais de remover avatar e encerrar personificação são divs clicáveis sem nome, papel, foco ou teclado.

## Severidade e prioridade
Média/alta — P1. WCAG 2.1.1 e 4.1.2.

## Evidências
`src/components/MaxUserAvatar.vue:10,159-178`: remoção é div clicável. `src/components/MaxUserSection.vue:37-46`: encerrar personificação é click-only dentro do gatilho principal; teclado no pai abre o menu.

## Afetados
MaxUserAvatar com `remove` e MaxUserSection com `isImpersonated` não compacto.

## Causa-raiz
Estado visual condicional adicionou ação sem usar componente de botão.

## Impacto e reprodução
Tabular pelos componentes: nenhuma parada alcança remover/encerrar, enquanto clique funciona.

## Direção de correção
Usar botões nativos irmãos, com nomes contextuais e área touch adequada.

## Critérios de aceite
Ações funcionam por Enter/Espaço, têm nome único e não ficam aninhadas no gatilho do perfil.

## Contraevidências
O menu de usuário principal possui roving e retorno de foco; deve ser preservado.
