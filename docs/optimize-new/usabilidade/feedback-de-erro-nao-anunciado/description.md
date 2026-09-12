# Feedback de erro e recuperação não são anunciados de forma consistente

## Resumo
Erros visuais em autenticação e a falha de clipboard não têm live region, vínculo com controle ou alternativa acionável consistente.

## Severidade e prioridade
Média — P2. WCAG 3.3.1, 3.3.3 e 4.1.3.

## Evidências
- `src/components/MaxAuthCard.vue:30,60`: erro em `span` sem alert/live nem vínculo aos campos.
- `src/components/MaxToast.vue:97-107`: falha de clipboard é capturada sem feedback ou alternativa.

## Afetados
MaxAuthCard e ação de cópia do MaxToast.

## Causa-raiz
Estados de falha são tratados como renderização local/temporária, sem contrato de anúncio, persistência e recuperação.

## Impacto e reprodução
Forçar falha e usar leitor: a mudança pode passar despercebida e o clipboard falha silenciosamente.

## Direção de correção
Usar alert/status conforme urgência, ligar erro ao controle e oferecer recuperação ou cópia manual.

## Critérios de aceite
Falhas são anunciadas uma vez, persistem tempo suficiente, identificam causa/campo e apresentam recuperação operável.

## Contraevidências
InputBase possui live region e role alert quando recebe erro; o problema é que estes fluxos não a usam ou não a conectam. O erro persistente de `MaxInputFileUpload` permanece no achado UX específico de upload.
