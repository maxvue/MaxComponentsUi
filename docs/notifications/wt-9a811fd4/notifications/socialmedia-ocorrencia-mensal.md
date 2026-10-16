# Divergência — quinta ocorrência não equivale à última

Data: 16/10/2026. Projeto consultado: SocialMedia. Achado fora do escopo de implementação.

## Localização e evidência

- `/home/johnattas/GitHub/SocialMedia/resources/Vue/Sections/SocialMedia/ThemeScheduleBuilder.vue:93-95`: a opção com valor numérico `5` recebe o rótulo “Último (5º)”.
- `/home/johnattas/GitHub/SocialMedia/app/Http/Controllers/SocialMedia/ThemeController.php:273`: ocorrência aceita inteiro de 1 a 5.
- `/home/johnattas/GitHub/SocialMedia/app/Services/SocialMedia/ThemeScheduleService.php:191-208`: o serviço conta as ocorrências do dia no mês e retorna a enésima; se não encontrar, retorna `null`. Não calcula a última ocorrência como alternativa.

## Impacto

Quem escolhe “Último” pode esperar uma data em mês com quatro ocorrências, mas o serviço não produz essa data para `5`. Evidência estática; não foi executada agenda nem teste funcional.

## Encaminhamento

O novo `MaxInputMonthOccurrence` propõe rótulos de primeira a quinta ocorrência, preservando o valor `5` e sem prometer “último”. Uma correção da tela existente ou suporte real a “último” exige tarefa/autorização própria; nenhum arquivo desse projeto foi alterado.
