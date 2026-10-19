# Especificação técnica — interrupção do ciclo de falhas de ícones

- Data: 19/10/2026.
- Projeto: `@maxvue/max-components-ui` 1.1.20.
- Worktree e branch: `wt-a13d5b54`.
- Raiz obrigatória: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-a13d5b54`.
- Base investigada: `89f2f0a4125c8c035116cfcde34f02d25840c492`; working tree inicialmente limpa.
- Estado: proposta para revisão; nenhuma implementação nem teste executado nesta sessão.

## 1. Contexto & Objetivo

O usuário relata repetição de `Erro na obtenção do ícone iconmind:log-level-duotone-thin`, emitido em `src/stores/useIcon.Store.ts:221`, até a página travar. O objetivo é fazer a busca de um ícone indisponível terminar de forma estável, sem repetição ilimitada de requisições, mensagens ou efeitos reativos, mantendo os demais ícones e a interface funcionando.

### Evidências e limites

1. `getIcon()` testa o valor por veracidade, em `useIcon.Store.ts:74–75`. O limite por ícone grava `''`, em `:223`. Uma chamada posterior interpreta esse sentinela como ausência e escreve `'waiting'` novamente.
2. `MaxIcon.vue:165–167` usa `watchEffect()` para chamar `getIcon()`. As leituras síncronas feitas na store também podem ser dependências do efeito. Mudanças no cache podem provocar novas chamadas sem mudança da prop.
3. O watcher da store observa a fila e todo `errors`, com `deep: true`, debounce de 50 ms e maxWait de 150 ms. Não há reserva de ícones em andamento durante a requisição principal e o fallback. Alterações na fila/erros podem iniciar trabalho sobreposto para o mesmo nome.
4. Em `:192–200`, uma string rejeitada por `sanitizeSvg()` ainda causa remoção do erro e `continue`, sem sair de `'waiting'` nem entrar no fallback. Esse caso precisa participar do mesmo fluxo limitado de ausência.
5. A rota principal possui limite global de quatro falhas e recuperação após 30 segundos. Essa recuperação de rede é diferente de reenfileirar um ícone já esgotado.
6. O nome informado não foi encontrado em `src`. Não foi consultado nenhum serviço de ícones, nem reproduzido o travamento no consumidor. A investigação demonstra caminhos compatíveis com o relato, não comprova a disponibilidade do nome ou a causa da primeira resposta ausente.
7. Lockfile: Vue `3.6.0-rc.10`, MaxUse `1.1.47`; MaxPinia é peer opcional `^0.2.0`, não disponível no caminho local inspecionado. A documentação oficial geral do Vue confirma a diferença entre `watch` e `watchEffect`; não foi obtida documentação específica dessa versão RC.

## 2. Escopo

### Incluído

- Corrigir o significado de `''` como estado terminal na instância da store.
- Restringir o gatilho de `MaxIcon` ao nome solicitado, em vez das leituras internas da store.
- Impedir dois ciclos simultâneos de principal/fallback para o mesmo nome.
- Encaminhar SVG rejeitado ao fluxo de ausência, sem apagar indevidamente seu contador.
- Limitar mensagens por ícone esgotado e manter a recuperação de rede existente.
- Cobrir o caso real relatado, concorrência, cache, fallback e descarte da store com testes.

### Fora do escopo

- Trocar o nome `iconmind:log-level-duotone-thin`, escolher outro desenho ou presumir que ele existe no fornecedor.
- Alterar backend, rotas, contrato HTTP, configurações, dependências, versões, exports ou esquema do IndexedDB.
- Migrar toda a infraestrutura de ícones, adicionar novo cache, nova API pública de retry ou nova interface visual.
- Tornar o peer MaxPinia obrigatório, criar stores/GETs de página ou instalar o plugin para este reparo.
- Corrigir achados externos registrados nas notificações, publicar pacote, integrar Git ou executar deploy.

## 3. Arquitetura & Mudanças Técnicas

### Arquivos

| Situação | Caminho | Responsabilidade |
|---|---|---|
| Existente, alterar | `src/stores/useIcon.Store.ts` | Sentinela estável, reserva por nome, conclusão de ciclos e tratamento uniforme de ausência |
| Existente, alterar | `src/components/MaxIcon.vue` | Substituir o gatilho amplo por `watch(icon_name, callback, { immediate: true })` |
| Existente, atualizar | `tests/stores/useIcon.Store.test.ts` | Regressões de retry/fallback/rede; remover a necessidade de manipular artificialmente a fila para simular retry |
| Existente, atualizar | `tests/stores/useIconStore.test.ts` | Contrato de `getIcon()` com entrada terminal |
| Existente, atualizar se necessário | `tests/stores/useIconStore.cache-sanitize.test.ts` | Preservar migração dos sentinelas e segurança |
| Existente, atualizar | `tests/components/MaxIcon.test.ts` | Componente real, mudança de props e estado terminal |
| Novo, proposto | `tests/browser/MaxIconRetry.browser.ts` | Ausência estável, várias instâncias e interface utilizável em Chromium |

`src/helpers/iconIdb.ts`, `sanitizeSvg.ts`, `maxAppConfig.ts`, `tests/setup.ts`, `tests/browser.setup.ts` e configurações Vitest são referências de contrato, não alvos previstos de alteração.

### Contratos preservados

- Mesmas exportações da store: `getIcon`, `list_icons_waiting_request`, `icons_data`, `saveCache`, `debouncedSaveCache`.
- `getIcon()` continua síncrono e retorna SVG para sucesso e `null` para ausente, pendente, inválido ou terminal. `''` fica no mapa como sentinela, não como SVG retornado.
- `icons_data` conserva a representação pública: SVG sanitizado, `'waiting'` e `''`. Não trocar esses valores por objetos ou novos sentinelas públicos.
- `list_icons_waiting_request` continua representando entradas `'waiting'`; a reserva de execução é interna e não muda esse contrato.
- Mesmos nomes, alias `i` com precedência sobre `icon`, dimensões, cores, tooltip, subícones e HTML de `MaxIcon`. O getter de SVG continua puro.
- Principal GET em lote com `icons[]`, fallback SVG configurável e POST consolidado com `icons`; para uma entrada, manter também `icon` e `svg` na raiz.
- Apenas SVG sanitizado é persistido/sincronizado. Não persistir falhas definitivas, contadores ou reservas. Manter migração do localStorage e cache no IndexedDB.
- Usar a biblioteca MaxComponentsUi existente e helpers MaxUse já empregados, sem imports diretos substitutos de terceiros. Manter compatibilidade com aplicações que usam MaxPinia. Não substituir o transporte especializado por uma nova camada de GET/save/cache: trata-se de reparo da store de infraestrutura existente, não de novo fluxo de página.

### Decisões propostas

1. **Terminal até recriação da store:** reconhecer explicitamente uma entrada própria com `''` e retornar `null`, sem reenfileirar. Chamadas repetidas, remontagem de componentes e reset global de rede não reabrem esse ícone. Uma nova instância da store pode tentar novamente; não criar expiração automática por ícone nesta mudança.
2. **Quatro ciclos de ausência:** manter `MAX_ICON_RETRIES = 4`. Cada principal bem-sucedida que não entregar SVG utilizável, seguida de fallback sem SVG válido, conta uma falha por nome. Ao atingir quatro, escrever `''` e emitir uma única mensagem `Erro na obtenção do ícone` para aquele esgotamento. Não registrar essa mensagem a cada leitura/re-renderização.
3. **Falha de transporte é recuperável:** preservar o orçamento global de quatro falhas, pausa de 30 segundos e fallback na falha da principal. Esse caminho não deve converter queda transitória de rede em ausência definitiva. As mensagens de transporte permanecem limitadas ao orçamento de requisições, sem loop rápido após o limite. A pausa pode se repetir se a rede continuar indisponível, como hoje.
4. **Reserva por nome:** manter um conjunto interno por instância, reservando antes do primeiro `await` e liberando em `finally` somente ao terminar principal e fallback. Filtrar a seleção por reserva e orçamento antes de chamar `fetch`. Não reenviar um nome enquanto seu fallback estiver pendente.
5. **Continuidade da fila:** ao liberar reservas, garantir novo agendamento com debounce dos nomes elegíveis que chegaram durante o trabalho. Não depender só de mutações ocorridas enquanto um callback retornou por reserva. Não realizar polling nem criar timer por ícone esgotado. Preservar agrupamento e o debounce atual.
6. **Resultados por nome:** consolidar alterações sobre o estado vigente, sem reaplicar snapshot antigo que sobrescreva sucesso de outro lote. Dados inválidos não limpam o contador. Sucesso válido limpa somente o erro correspondente e não duplica persistência/POST.
7. **Descarte:** depois de `$dispose()` não reagendar, persistir, sincronizar ou emitir mensagens por conclusões tardias. Limpar timers internos e reservas. Uma resposta tardia não pode reativar o fluxo.

### Fluxo esperado

```text
nome inválido -> null, sem fila
SVG em memória -> SVG, sem rede
entrada '' -> null, sem fila
entrada nova -> waiting -> seleção com debounce + reserva por nome
  principal com SVG válido -> sucesso + cache
  principal sem SVG utilizável -> fallback
    válido -> sucesso + cache + sincronização em lote
    inválido/ausente -> contador por nome -> retry limitado OU '' terminal
  principal com erro de transporte -> contador global + fallback
    recuperação -> sucesso + cache + sincronização
    sem recuperação -> waiting; respeitar limite global e pausa de 30 s
fim do ciclo -> liberar reserva -> agendar somente pendências elegíveis
```

## 4. Plano de Execução Faseado

1. Conferir worktree, alterações existentes, integridade e isolamento por leitura; não instalar nem corrigir ambiente sem autorização.
2. Implementar como um lote coeso a correção da store, o gatilho explícito do componente e todos os testes correspondentes.
3. Revisar transições, concorrência, segurança do SVG e compatibilidade antes dos comandos de validação.
4. Executar validações de integridade, suíte completa, tipos, lint, build e navegador depois de concluir o lote. Diagnosticar e corrigir falhas em conjunto; reaproveitar checks válidos da mesma revisão.
5. Realizar o aceite manual em ambiente local isolado; registrar limitações de acesso ao consumidor, sem confundir mocks com disponibilidade real do fornecedor.
6. Entregar evidências e estado de execução; manter worktree para integração pelo MaxCode. Não commitar, trocar branch, publicar ou limpar a worktree.

## 5. Critérios de Aceite & Validação

- Para o nome relatado, principal sem ícone e fallback 404: no máximo quatro ciclos por instância, `''` final, nenhuma nova chamada/log após novas leituras, remontagens ou avanço além de 30 segundos.
- Dez componentes com o mesmo nome não multiplicam as tentativas: no máximo uma principal e um fallback simultâneos para esse nome.
- Fallback lento, chegada de novos nomes, ordem invertida de respostas e lotes mistos não causam duplicação, perda de sucesso nem pendência elegível esquecida.
- String principal rejeitada pelo sanitizador segue para fallback; fallback rejeitado também consome o orçamento de ausência. Nunca inserir conteúdo não sanitizado em `v-html`, cache ou POST.
- Após quatro falhas de transporte não há loop rápido; após 30 segundos a fila não terminal pode recuperar; terminal não volta à fila.
- SVG válido principal/fallback, migração de cache, rotas customizadas e POST consolidado continuam funcionando. Falha no POST não derruba a interface.
- Troca de props carrega o novo nome; mudanças em `icons_data` não disparam novas solicitações do componente com o mesmo nome. Descarte impede trabalho tardio.
- No Chromium isolado, a página continua aceitando interação com botão/campo após esgotar o ícone. Contagens de rede e console ficam estáveis durante janela finita observada.
- Comandos confirmados em `package.json`: `npm run check:lockfile`, `npm run test`, `npm run type-check`, `npm run type-check:test`, `npm run lint`, `npm run build`, `npm run test:browser`. Execução futura detalhada em `plan.md`; nenhum foi executado nesta sessão.
- `npm run verify` é o gate de pré-release. Não executar release nem substituir esse gate por validação parcial quando houver solicitação futura de publicação; tampouco repetir suas etapas isoladas na mesma revisão se ele for escolhido.
