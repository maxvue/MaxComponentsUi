# Quinta ocorrência não é necessariamente a última do mês

- Data: 16/10/2026.
- Projeto: `/home/johnattas/GitHub/SocialMedia`, consultado somente em leitura.

## Localização e evidência

- `resources/Vue/Sections/SocialMedia/ThemeScheduleBuilder.vue:93–95`: a opção de valor `5` é rotulada “Último (5º)”.
- `app/Services/SocialMedia/ThemeScheduleService.php:191–208`: conta as ocorrências do dia da semana, retorna a de número `nth` e retorna `null` quando ela não existe.
- `app/Http/Controllers/SocialMedia/ThemeController.php:273`: aceita `nth` entre 1 e 5; não há valor distinto de “último” nesse contrato.

## Impacto

Quem escolhe “Último” pode esperar uma data em todos os meses; o servidor pode não gerar data nos meses sem quinta ocorrência daquele dia. A divergência é de rótulo versus semântica, não comprovação de evento real perdido nesta sessão.

## Encaminhamento

Novo input reutilizável deve dizer “5ª ocorrência” e manter o código `5`. Corrigir o texto da tela ou introduzir regra real de último dia depende de tarefa separada; não alterar cálculo do servidor ou dados existentes neste plano.
