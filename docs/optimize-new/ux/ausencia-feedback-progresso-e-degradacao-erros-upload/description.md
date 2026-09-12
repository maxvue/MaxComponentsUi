# Achado UX-04: upload sem progresso recuperável e com drop inerte

## Resumo

`MaxInputFileUpload` executa XHR sem expor progresso real e apaga erro e seleção após três segundos, prejudicando diagnóstico e retry. Seleção, transporte e feedback não formam um estado recuperável único.

## Severidade e prioridade

- Severidade: alta.
- Prioridade: P1.

## Componentes impactados

- `MaxInputFileUpload`.

## Evidências

- `src/components/MaxInputFileUpload.vue:185-190`: `showError` agenda limpeza do erro e de `files` em 3 s.
- `src/components/MaxInputFileUpload.vue:224-262`: o XHR trata conclusão/erro, mas não registra `xhr.upload.onprogress`.

## Causa-raiz

Seleção, transporte e feedback foram implementados como fluxos separados, sem máquina comum de `idle/selecting/uploading/error/success` nem estado persistente de tentativa recuperável.

## Impacto

- O usuário não estima duração de uploads longos.
- O erro desaparece e a seleção é perdida antes de uma nova tentativa.

## Reprodução e verificação

Simular XHR lento e rejeitado e observar a ausência de progresso, a limpeza após 3 s e a impossibilidade de repetir a tentativa com a seleção original.

## Direção de solução

Unificar seleção e transporte em estado explícito, expor progresso, preservar seleção para retry e apresentar erro persistente.

## Critérios de aceite

- Progresso real é exposto e anunciado.
- Erro persiste até correção/dispensa e preserva os arquivos para retry.
- Testes cobrem progresso, rejeição, retry e preservação de arquivos.

## Contraevidências consideradas

- `MaxInputFileUpload` já implementa drop e emite `upload-error`; aplicações podem fornecer UI externa.
- `MaxInputFileProject` possui problemas próprios de ingestão/concorrência e `MaxInputFileUploadBig` possui defaults visuais remotos; ambos estão documentados em achados canônicos específicos.
