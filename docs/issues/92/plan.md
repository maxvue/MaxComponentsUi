# Plano de execução — Issue #92

## Escopo

Planejar a correção do ciclo de vida de `useMaxPiniaSaveTracker`, sem implementar código-fonte nesta etapa. Trabalho realizado na worktree pré-alocada `wt-implement-issue-92`; somente este plano é alterado. O arquivo de destino já existia, vazio. Não executar commit, push, publicação ou integração Git.

## Descrição e Causa Raiz

**Veracidade: bug confirmado por inspeção e reprodução em runtime em 19/10/2026.** Severidade moderada: perda do feedback de salvamento após remontagem e retenção de callbacks; não há evidência de perda de dados nem de falha no salvamento efetivo.

### Causa Raiz Comprovada

1. `src/composables/useMaxPiniaSaveTracker.ts:L5` define `trackedStores` no módulo, compartilhado por todas as chamadas. Em `L19-21`, uma store anteriormente rastreada é descartada antes da criação dos watchers de sucesso e erro (`L23-42`). O `WeakSet` não impede coleta de lixo sozinho, mas sua marca continua presente enquanto a store sobreviver no Pinia.
2. A destruição do escopo, em `src/composables/useMaxPiniaSaveTracker.ts:L83-90`, interrompe os watchers e remove o listener, porém não desfaz aquela marca. Ao remontar com a mesma store, o novo escopo não instala watchers: o bloqueio em `L20` continua verdadeiro. Limpar somente os watchers não restaura o rastreamento.
3. Cada chamada registra uma nova closure em `pinia.use`, em `src/composables/useMaxPiniaSaveTracker.ts:L48-51`. Nenhuma parte do cleanup cancela ou neutraliza essa closure. No Pinia 4.0.3 instalado, `node_modules/pinia/dist/pinia.js:L823-839` mantém os plugins em `_p` ou na fila privada anterior à instalação; `L1276-1282` executa esses plugins dentro do escopo da nova store. Não há função de cancelamento retornada por `use`.
4. Assim, um plugin antigo pode rastrear uma store criada depois do descarte do consumidor. Seus novos watchers entram em um array que já foi esvaziado e cujo cleanup não será chamado novamente. Como o plugin roda no escopo da store, podem continuar notificando sem nenhum `MaxApp` ativo. Os callbacks também conservam o contexto do rastreador antigo.

### Fluxo causal e rastreamento reverso

`MaxApp.setup` (`src/components/MaxApp.vue:L270`) → `useMaxPiniaSaveTracker` → stores existentes em `pinia._s` (`L45-46`) ou futuras via plugin (`L48-51`) → leitura de `status.server.save.is_success/is_error` (`L24-40`) → `useSystemStore.notifySaveSuccess/notifySaveError` (`src/stores/useSystem.Store.ts:L187-212`) → `save_status/save_message` → indicador desktop/mobile em `src/components/MaxTopMenu.vue:L16-25` e `L70-79`.

No sentido inverso, o indicador ausente decorre da ausência de chamada às ações do sistema; isso decorre do watcher não reinstalado, apesar da transição reativa na mesma store. O canal alternativo `document.status-updated` (`src/composables/useMaxPiniaSaveTracker.ts:L53-80`) pode mascarar a falha e deve ficar ausente no teste principal.

API/Rotas ⇄ Controller/Service ⇄ DB: não participam do defeito demonstrado. O contrato de entrada é o estado reativo da store, normalmente produzido pelo MaxPinia consumidor. Uma mutação local reproduz a falha sem HTTP, backend ou banco; não inventar rotas ou alterações nesses níveis.

### Reprodução já executada e limites

Foi executado um script Node via entrada padrão, sem criar arquivos de teste: leitura do composable original, `typescript.transpileModule` somente em memória e importação por `data:`. Vue 3.6.0-rc.10 e Pinia 4.0.3 reais; apenas `useSystemStore` substituído por contadores de notificações. `createApp({}).use(pinia)` instala os plugins sem montar DOM. `effectScope().run(() => useMaxPiniaSaveTracker(pinia))` reproduz a propriedade relevante do escopo de `setup`; `scope.stop()` reproduz seu descarte. Não houve `document` nem emissão de eventos.

Sequência: criar store com ambos os flags falsos; ativar primeiro escopo; alterar sucesso para verdadeiro e aguardar `nextTick`; destruir escopo; voltar sucesso para falso e aguardar; ativar segundo escopo; alterar sucesso para verdadeiro e aguardar. Depois, destruir o segundo escopo, criar outra store e alterar seu sucesso para verdadeiro.

Resultados observados, com asserções concluídas sem erro:

```json
{"cenario":"remontagem de escopo, mesmo Pinia e mesma store, sem document/status-updated","notificacoesPrimeiraMontagem":1,"notificacoesAposRemontagem":0,"esperadoAposRemontagem":1,"pluginsIniciais":0,"pluginsAposDuasMontagens":2}
{"cenario":"store criada depois de todos os escopos destruídos","notificacoesIndevidas":1,"esperado":0,"pluginsRetidos":2}
```

Essa prova isola o composable, não constitui execução completa de montagem de `MaxApp` em DOM. O teste integrado de remontagem será acrescentado na implementação. Os testes existentes em `tests/components/MaxPiniaSaveIndicator.test.ts:L234-335` cobrem a primeira montagem e o evento global, mas não desmontagem/remontagem nem crescimento de plugins. Nesta etapa não foram executados Vitest, tipos, lint ou build e não há alegação de correção aplicada.

## Arquivos afetados

| Arquivo | Alteração prevista |
| --- | --- |
| `src/composables/useMaxPiniaSaveTracker.ts` | Corrigir propriedade dos efeitos, idempotência do plugin e reativação por instância Pinia. |
| `tests/composables/useMaxPiniaSaveTracker.test.ts` | Novo conjunto isolado de regressões de ciclo de vida, stores futuras e plugins. |
| `tests/components/MaxPiniaSaveIndicator.test.ts` | Acrescentar remontagem real de `MaxApp` com o mesmo Pinia e cleanup dos wrappers usados nos novos cenários. |
| `docs/issues/92/plan.md` | Este planejamento e, na execução, registro dos resultados pertinentes. |

`MaxApp.vue`, `MaxTopMenu.vue` e `useSystem.Store.ts` são pontos de rastreamento e validação, não alvos de alteração. Não alterar dependências, lockfile, exports, estilos ou backend.

## Execuções propostas

1. Escrever os casos de regressão antes do código produtivo, preservando as asserções existentes. Usar Pinia/Vue reais e mockar apenas a fronteira do sistema nos testes isolados; não mockar `watch`, `pinia.use` ou a identidade das stores. As evidências atuais já demonstram o estado defeituoso; observar a política de validação em lote abaixo.
2. Substituir o `WeakSet` global por um registro privado `WeakMap<Pinia, TrackerRegistry>` no próprio composable. Cada instância Pinia terá um único plugin despachante e um estado de rastreamento reutilizável, com consumidores ativos e deduplicação de stores por identidade. Não criar abstrações externas nem nova API pública.
3. Registrar o plugin apenas na primeira criação do registro, inclusive quando o Pinia ainda não estiver instalado. O plugin deve consultar o estado atual do registro e ser inerte quando não houver consumidores. **Manter esse único despachante por toda a vida do Pinia**, sem remover o registro do `WeakMap` nas desmontagens: recriá-lo registraria novos plugins. Não editar `_p`, não substituir `pinia.use` e não tentar manipular a fila privada anterior à instalação.
4. Na transição de zero para um consumidor, criar um escopo de efeitos próprio e destacado (`effectScope(true)`), vincular a store de sistema ao mesmo Pinia resolvido e percorrer as stores existentes. Criar todos os watchers, inclusive os originados por plugins tardios, via `scope.run`. Isso evita vincular os efeitos compartilhados ao primeiro componente ou ao escopo incidental de uma store. Preservar a assinatura `useMaxPiniaSaveTracker(customPinia?: Pinia): void` e a resolução do Pinia customizado/ativo.
5. Enquanto houver consumidores, instalar somente um par de watchers por store e um listener `status-updated` por registro ativo. Manter o contrato de borda falso → verdadeiro, a mensagem de erro e os flags locais do fallback; não introduzir deduplicação nova entre evento e watcher, pois esse é outro problema. Consumidores simultâneos do mesmo Pinia não devem duplicar notificações.
6. Registrar uma liberação idempotente no `onScopeDispose` de cada consumidor. Ao sair o último: parar o escopo compartilhado e todos os watchers; remover o listener; limpar as coleções de stores, handles e consumidores; resetar o estado do fallback e liberar referências à store de sistema e closures do ciclo encerrado. Deixar apenas o despachante inerte e metadados mínimos. Não parar efeitos enquanto outro consumidor ainda estiver ativo.
7. Ao reativar o mesmo registro, criar efeitos novos para todas as stores ainda existentes e para as criadas no intervalo inativo; não notificar imediatamente por flags que já estavam verdadeiros. Stores futuras devem consultar o registro ativo, nunca capturar o contexto da primeira montagem. Deduplicar por identidade, não por `$id`, para permitir recriação de stores. Não substituir `$dispose` nem introduzir descoberta de escopos internos de stores; a liberação garantida nesta issue ocorre na saída do último consumidor.
8. Preservar o uso fora de um escopo: não registrar `onScopeDispose` sem escopo nem adicionar avisos novos; explicitar em comentário que, nesse caso, a assinatura atual não oferece liberação automática e o uso é de duração da aplicação. Não prometer cleanup de um consumidor sem escopo nem ampliar a API para resolver esse contrato nesta issue. Verificar SSR sem `document`.
9. Revisar o lote completo, manter tipagem explícita do estado interno e acesso estreito ao formato opcional `status.server.save`, seguir o estilo do projeto e executar os gates previstos. Não fazer alterações cosméticas em outros componentes.

## Testes de regressão e validação em lote

Adicionar a matriz abaixo; sempre aguardar `nextTick` entre transições relevantes para não confundir batching com perda de observação:

| Cenário | Asserção obrigatória |
| --- | --- |
| Mesma store, mesmo Pinia, três ciclos de montagem/desmontagem | Uma notificação por nova transição de sucesso e de erro em cada ciclo, sem evento global; zero após o descarte. |
| Dez ciclos consecutivos | `pinia.use` recebe somente um plugin do rastreador; em Pinia instalado, incremento de `_p.length` permanece em um, descontando plugins preexistentes. |
| Pinia ainda não instalado durante os ciclos | Espiar `pinia.use`; instalar depois e confirmar um único registro e rastreamento funcional, sem depender apenas de `_p.length`. |
| Store criada após todos os consumidores saírem | Nenhuma notificação enquanto inativo; rastreamento passa a funcionar quando um novo consumidor entra. |
| Store criada depois da montagem/remontagem | Sucesso e erro geram uma chamada cada; depois da última desmontagem, nenhuma chamada adicional. |
| Dois consumidores simultâneos | Uma chamada por transição; descartar o primeiro não interrompe o segundo; descartar o último encerra os efeitos compartilhados. |
| Duas instâncias Pinia | Estado, destino das notificações e cleanup isolados, inclusive passando `customPinia` diferente do ativo. |
| Store sem status, substituição do objeto status e flags já verdadeiros | Sem exceção; observar novas transições após substituição; sem notificação imediata ou repetida para verdadeiro → verdadeiro. |
| Descartar e recriar store com o mesmo `$id` | Nova identidade passa a ser observada sem bloqueio ou duplicação; após sair o último consumidor, nenhuma das duas identidades notifica. Não ampliar o contrato de descarte individual de stores. |
| Evento global isolado | Uma chamada por transição com consumidor; após saída do último, nenhuma; remontagem reinstala exatamente um listener e renova os flags locais. |
| SSR e chamada sem escopo | Sem acesso indevido a `document`, sem warning de hook fora de escopo e sem multiplicação do plugin. Usar Pinia exclusivo e descartar os recursos ao final. |
| Integração `MaxApp` | Montar, desmontar e remontar com o mesmo Pinia; preparar autenticação como nos testes atuais, limpar estado anterior do indicador e alternar falso → verdadeiro sem `status-updated`; indicador e `aria-label` corretos para sucesso e erro. |

Nos novos testes, desmontar wrappers, parar escopos e descartar Pinia ao final; restaurar spies/listeners e limpar timers falsos. Medir contagens diferenciais para plugins de terceiros. Para efeitos compartilhados, incluir stores anteriores e posteriores ao primeiro consumidor, garantindo que a destruição de seu escopo não derrube a observação do consumidor restante.

Implementar todo o bloco autorizado e seus testes antes de executar testes, tipos ou build. Validar o conjunto uma vez, agrupar correções de falhas e revalidar depois de concluir as correções; não testar após cada microedição. Para revisão funcional desta issue, executar os dois arquivos de testes juntos, `type-check`, `type-check:test` e `lint`. Se a etapa seguinte já exigir o gate completo de pré-release, usar diretamente `npm run verify`, sem executar antes seus componentes isolados na mesma revisão. Não corrigir falhas preexistentes fora do escopo sem estabelecer causalidade e obter autorização.

## Banco de dados

Nenhuma. Sem migration, mudança de schema ou atualização de dados.

## Riscos de quebra e Não-Regressão

- **Efeitos vinculados ao escopo errado:** um singleton com watchers criados no primeiro componente ainda falharia em consumidores simultâneos. Cobrir ambos os tipos de store e parada de consumidores em ordens diferentes; o escopo destacado deve ser o proprietário real.
- **Desativar sem liberar:** um simples booleano ou um `WeakSet` local não resolve sozinho callbacks acumulados nem retenção do contexto antigo. Verificar limite constante de plugins, remoção de listeners e ausência de chamadas de stores futuras no intervalo inativo. Não alegar prova de coleta de lixo apenas com contagem de plugins.
- **Romper plugins alheios ou fila pré-instalação:** evitar remoção por splice e dependência de fila privada. Testar um plugin de terceiro antes/depois e preservar sua execução; `_s` permanece somente leitura para descoberta, como no código atual.
- **Duplicação ou perda com consumidores concorrentes:** manter contagem de consumidores e deduplicação por identidade dentro de cada Pinia. Cleanup deve ser idempotente e só interromper efeitos na última liberação.
- **Contaminação entre Pinia/SSR:** usar `WeakMap` e a store de sistema do Pinia correspondente; testar duas instâncias. O fallback de evento global continua sem identificação de Pinia, como hoje: não atribuir isolamento novo a esse canal.
- **Quebra visual ou semântica de salvamento:** preservar sucesso por 3s, erro por 20s, prioridade do erro, mensagem, acessibilidade e apresentação desktop/mobile, cobertas pela suíte existente. Não alterar contratos do MaxPinia nem o comportamento de duplicidade entre seus dois canais nesta issue.
- **Uso sem escopo:** continua sem liberação automática pela API atual. Documentar esse limite, não usar tal caminho para provar cleanup de `MaxApp` e não introduzir uma alteração pública incompatível.

## Validação

Comando funcional conclusivo após a implementação, com os novos cenários acima presentes:

```bash
npx vitest run tests/composables/useMaxPiniaSaveTracker.test.ts tests/components/MaxPiniaSaveIndicator.test.ts
```

Critérios de aceite: remontagem restaura watchers de sucesso e erro; notificações inexistentes sem consumidor; exatamente um plugin do rastreador por Pinia independentemente do número de ciclos; consumidores simultâneos não duplicam chamadas nem interrompem uns aos outros; listeners e efeitos do ciclo encerrado são liberados; indicador integrado continua correto. Tipos e lint devem passar no lote funcional. Antes de eventual release/integração que exija os gates completos, executar `npm run verify`, preservando consumidores, navegador, cobertura, benchmarks, integridade e segurança. Nenhum desses comandos publica o pacote; não executar `release`.

## Skills Aplicáveis

- `vue-debugging-best-practices`: diagnóstico de efeitos, scopes e ciclo de vida; ler as referências disponíveis sobre cleanup antes da implementação. A referência `reference/cleanup-side-effects.md` apontada pela skill não está presente nesta worktree; não tratá-la como consultada.
- `vue-pinia-state-management-best-practices`: limites entre composable, store de sistema e instâncias Pinia, respeitando o contexto de biblioteca sem inventar rotas.
- `vue-typescript-best-practices`: assinatura e tipagem dos estados reativos e dos contratos opcionais de store.
- `vitest-skill` e `javascript-testing-patterns`: spies, isolamento de testes, timers e validação de runtime.
- `test-driven-development`: escrever os testes de regressão antes da correção; coordenar sua execução com a regra mandatória de validação em lote e a evidência negativa já obtida nesta análise.
- `code-review`: revisar correção, simplicidade, compatibilidade, retenção de referências e comprovação dos testes antes de eventual integração.
- `technical-documentation-best-practices`: manter o planejamento e o registro de evidências fiéis aos arquivos e comandos reais.

Não presumir disponibilidade de skills citadas apenas como exemplos no relato; não há necessidade de delegação ou de subagentes nesta tarefa.
