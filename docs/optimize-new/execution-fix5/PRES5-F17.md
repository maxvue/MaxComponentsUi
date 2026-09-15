# PRES5-F17 — preservação de reconciliação e callbacks de upload

- Papel: auditoria somente leitura do bloco aceito F17 (`E07-02` e `E07-03`).
- Agente: `/root/pres5_f17`.
- Parent: `/root`.
- Início: `2026-09-15T17:47:37-03:00`.
- Fim: `2026-09-15T17:47:57-03:00`.
- HEAD auditado: `847202ef`.
- Escopo exclusivo: `src/components/MaxInputFileProject.vue`,
  `src/components/MaxInputFileUpload.vue` e os grupos F17 de seus testes
  componentes correspondentes. Nenhum arquivo de produção ou teste foi alterado.

## Comando e saída

```text
$ npx vitest run tests/components/MaxInputFileProject.test.ts tests/components/MaxInputFileUpload.test.ts -t 'Reconciliação e Resiliência de Upload|Invalidar Geração no Unmount' --reporter=verbose

Test Files  2 passed (2)
Tests  5 passed | 39 skipped (44)
Duration  1.91s
exit 0
```

## Cobertura confirmada

1. Quando o pai reconcilia `props.files` durante upload automático, arquivos
   locais `queued`/`uploading` continuam presentes; os itens novos do servidor
   são adicionados e o upload local termina em `succeeded`.
2. Uma rejeição de auto-upload é capturada: publica `upload-error`, marca o
   arquivo como `failed` e não deixa rejeição não tratada.
3. Tentativas concorrentes de retry do mesmo arquivo produzem apenas uma
   requisição e preservam a transição final para `succeeded`.
4. No unmount de `MaxInputFileUpload`, os handlers XHR (`load`, `error`,
   `abort` e `progress`) são anulados antes do abort.
5. Callbacks manuais tardios após unmount não emitem eventos, não atualizam o
   modelo/estado e não iniciam novo XHR.

## Veredito

**ACEITO.** F17 permanece preservado no HEAD auditado com cinco casos focais
capazes de detectar as regressões de reconciliação, rejeição automática, retry
duplicado e callbacks tardios.
