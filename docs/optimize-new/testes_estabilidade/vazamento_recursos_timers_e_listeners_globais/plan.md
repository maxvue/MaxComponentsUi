# Plano de implementação — ciclo de vida dos timers locais

## Objetivo e resultado esperado

Dar identidade, renovação e teardown aos timers restantes. Retry deve reiniciar sua janela completa e nenhum callback pode alterar componente desmontado ou estado mais novo.

## Escopo e fora de escopo

- Escopo: `MaxInputFileUpload`, `MaxInputFileUploadBig`, `MaxTabItem`, `MaxMaps` e feedback de cópia do `MaxToast`.
- Fora: timers já rastreados em outros componentes/store e redesenho dos fluxos.

## Arquivos-alvo

- Os cinco componentes acima.
- Testes correspondentes em `tests/components/MaxInputFileUpload.test.ts`, `MaxInputFileUploadBig.test.ts`, `MaxTabs.test.ts`/arquivo equivalente, `MaxMaps.test.ts` e `MaxToast.test.ts`.
- Opcionalmente criar `src/composables/useResettableTimeout.ts` e teste se ao menos três consumidores mantiverem a mesma semântica.

## Dependências e ordem

1. Reproduzir retry em 2,9 s e unmount com fake timers.
2. Corrigir uploads e Toast com handles renováveis.
3. Substituir delays arbitrários de Tab/Maps por lifecycle Vue quando possível.
4. Centralizar helper somente após comprovar API comum.

## Passos detalhados

1. Nos uploads, agendar a ocultação diretamente no evento de erro, limpar handle anterior e nunca zerar seleção recente por timeout antigo.
2. Limpar o timer ao iniciar nova tentativa/sucesso e no unmount; novo erro renova 3.000 ms mesmo se `showError` já estiver `true`.
3. No Toast, manter handle/token do feedback copiado; nova cópia cancela a anterior e unmount cancela tudo sem apagar toasts globais.
4. Em `MaxTabItem`, substituir 0/10 ms por sequência `onMounted` + `nextTick`, atribuindo ID antes de selecionar; verificar flag de montagem antes de cada efeito.
5. Em `MaxMaps`, remover espera fixa de 50 ms e ativar após mount/`nextTick`; se a integração exigir atraso real, guardar handle e cancelá-lo.
6. Todo callback deve validar geração/montagem antes de escrever refs ou chamar provider.

## Migração e compatibilidade

- Durações visíveis permanecem 3 s e 2 s.
- Props, emits e store global de toast não mudam.
- A seleção inicial de tabs e montagem do mapa mantêm ordem funcional, sem contrato de milissegundos arbitrário.

## Testes pertinentes

- Erro, +2.900 ms, novo erro, +100 ms: erro novo continua; some somente 3 s após o segundo.
- Selecionar arquivo novo entre timers não apaga a seleção.
- Duas cópias seguidas limpam apenas o toast vigente; unmount impede mutação.
- Desmontar Tab/Maps antes do flush produz zero chamadas/escritas.
- Executar `vi.runAllTimers()` após cada unmount e exigir zero timer pendente.
- A11y: estados de erro/cópia continuam anunciados; benchmark de runtime não se aplica.

## Critérios de aceite

- Cada efeito temporário possui no máximo um handle vigente por instância.
- Retry recebe janela integral e timeout anterior não altera dados novos.
- Após unmount, avançar todos os timers produz zero efeito observável.
- Tabs/Maps não dependem de delays 0/10/50 ms quando `nextTick` resolve a ordem.
- Testes focados, type-check, suíte e build passam.

## Riscos, rollback e validação final

- Riscos: mudança na ordem de Teleport da tab e SDK de Maps exigir macrotask. Mitigar com teste de integração; se necessário, usar timeout rastreado, não fire-and-forget.
- Rollback: restaurar atraso apenas com handle/cleanup e guard de geração.
- Validar fake timers, retries, unmount, tabs dinâmicas, mapa, Toast, suíte completa e build.
