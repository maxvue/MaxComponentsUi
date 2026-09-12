# Plano de implementação — cobertura real do cache IndexedDB

## Objetivo e resultado esperado

Substituir o mock global inerte por uma implementação IndexedDB determinística e testar abertura/upgrade, transações, sanitização, limpeza, falhas e migração do store sem promises pendentes.

## Escopo e fora de escopo

- Escopo: infraestrutura `fake-indexeddb`, isolamento de bancos, testes do `iconIdb` e integração `localStorage → IndexedDB`.
- Fora: redesenhar o schema/cache, mudar política de falha silenciosa ou otimizar persistência; o delta é tratado em `cache-icones-reprocessa-colecao-inteira`.

## Arquivos-alvo

- `package.json` e `package-lock.json`: adicionar `fake-indexeddb` em desenvolvimento após reparar o lockfile.
- `tests/setup.ts`: remover o request que nunca dispara e instalar a factory funcional.
- Criar `tests/helpers/indexedDbTestUtils.ts` para factory fresca, exclusão e timeout.
- Reestruturar `tests/helpers/iconIdb.test.ts`.
- Atualizar `tests/stores/useIcon.Store.test.ts` e `tests/stores/useIconStore.cache-sanitize.test.ts` para migração ponta a ponta.

## Dependências e ordem

1. Executar depois do plano `lockfile_irreproduzivel_e_audit_indisponivel`.
2. Introduzir factory/cleanup isolados e comprovar que a suíte global não compartilha bancos.
3. Cobrir caminho feliz do helper.
4. Cobrir eventos de erro/abort/blocked com doubles locais controlados.
5. Adicionar migração do store e integrar com o plano de cache incremental.

## Passos detalhados

1. Instalar `fake-indexeddb` apenas como dev dependency; expor uma nova `IDBFactory` por teste que precise de isolamento.
2. Remover de `tests/setup.ts` o mock que retorna sempre o mesmo request sem callbacks. Não manter fallback silencioso capaz de pendurar promise.
3. Na fixture, resetar `resetIconsIDBConnection`, fechar conexões e excluir `max_icons_db` entre casos; envolver operações em timeout curto com mensagem diagnóstica.
4. Testar `onupgradeneeded`: banco versão 1 e object store `icons` com `keyPath: 'name'`.
5. Gravar lote válido, aguardar `tx.oncomplete`, reabrir/carregar e comparar registros; verificar sobrescrita pela mesma chave.
6. Persistir SVG malicioso diretamente pelo fake IDB e provar sanitização/descarto na leitura; testar sentinelas e lote vazio.
7. Testar `clear`, memoização/reabertura após `close` e `resetIconsIDBConnection`.
8. Para `request.onerror`, `blocked`, `tx.onerror` e `tx.onabort`, usar doubles mínimos locais que disparem callbacks; exigir resolução segura e nunca promise pendente.
9. Na integração, sem mockar o helper, semear `localStorage`, inicializar `useIconStore`, aguardar transação, verificar remoção da chave e leitura do registro numa nova instância/factory.

## Migração e compatibilidade

- Nenhuma mudança de produção ou `DB_VERSION` é necessária para este achado.
- Testes SSR continuam removendo/restaurando `indexedDB` localmente.
- Se o plano incremental alterar helpers tipados, compartilhar a mesma fixture e ajustar expectativas sem duplicar infraestrutura.

## Testes e cobertura

- Caminho feliz: upgrade, put múltiplo, getAll, overwrite, clear, close/reopen.
- Segurança: SVG válido/malicioso e ausência de `waiting`/vazio.
- Falhas: abertura lança, `onerror`, `blocked`, erro e abort de transação.
- Migração ponta a ponta e degradação SSR.
- Todas as promises terminam dentro do timeout definido (por exemplo, 250 ms com fake timers reais).
- Meta focada para `src/helpers/iconIdb.ts`: ao menos 90% de linhas/statements/functions e 80% de branches.
- A11y e benchmark não se aplicam; medir apenas duração determinística para detectar teste pendurado.

## Critérios de aceite

- Nenhum mock global de IndexedDB deixa callbacks indefinidamente inertes.
- Todos os estados de request/transação têm teste determinístico.
- Migração localStorage→IDB é verificada por leitura real após reinicialização.
- Cobertura focada atinge os limites definidos.
- Suíte não deixa banco/conexão entre testes e passa sem handles abertos.
- Type-check, suíte completa e build passam.

## Riscos, rollback e validação final

- Riscos: estado global entre testes, semântica do fake divergir do browser e conflito com cache incremental. Mitigar com factory por teste, um smoke test em navegador e execução ordenada dos planos.
- Rollback: restringir `fake-indexeddb` ao arquivo do helper se afetar a suíte global; nunca restaurar o mock pendente.
- Validar testes repetidos (`--repeat`), timeout, cobertura, suíte completa e smoke em Chromium/Firefox antes de concluir.
