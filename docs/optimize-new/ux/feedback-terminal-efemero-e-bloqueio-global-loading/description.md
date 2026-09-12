# Achado UX-06: feedback terminal efêmero e bloqueio global acidental no sistema de loading

## Resumo

O loading centralizado apaga estados `done` e `error` aproximadamente 500 ms depois de não restarem operações pendentes. Além disso, quando o seletor de um alvo local não existe, o componente faz fallback silencioso para `body`, enquanto sua máscara usa um pseudo-elemento fixo do tamanho da viewport. Assim, uma operação local pode bloquear toda a aplicação e um erro pode desaparecer antes de ser percebido. A camada não expõe `role="status"`, live region ou `aria-busy`, nem inertiza o conteúdo encoberto: o bloqueio é apenas visual.

## Severidade e prioridade

- Severidade: alta.
- Prioridade: P1.

## Evidências

- `src/stores/useLoading.Store.ts:116-120`: `error()` apenas troca o status para `error`.
- `src/stores/useLoading.Store.ts:128-149`: o watcher considera pendentes somente `loading` e `waiting`; quando o total chega a zero, limpa todos os itens após debounce de 500 ms, incluindo `error` e `done`.
- `src/components/MaxLoadScreenTarget.vue:52-68`: seletor ausente ou inválido retorna `body` sem tornar a degradação observável.
- `src/components/MaxLoadScreenTarget.vue:2-22`: mensagens são `div`s visuais sem região viva, estado ou indicação programática de ocupação.
- `src/components/MaxLoadScreen.vue:2-7,20-27`: alvos viram camadas de viewport sem bloqueio programático; um botão encoberto ainda pode ser acionado por foco/Enter.
- `src/components/MaxLoader.vue:2-7` e `MaxLoaderAi.vue:3-10`: loaders genéricos são silenciosos por padrão, embora aceitem ARIA por fallthrough.
- `src/components/MaxLoadScreenTarget.vue:72-92`: a camada é absoluta, mas `::after` é `fixed`, cobre `100vw × 100vh` e usa `z-index` elevado.
- `src/components/MaxLoadScreenTarget.vue:94-109`: painel tem largura mínima de 500 px e só recebe contenção parcial abaixo de 768 px.

## Componentes afetados

- `MaxLoadScreen.vue` e `MaxLoadScreenTarget.vue`.
- `useLoadingStore` e qualquer fluxo consumidor de `start`, `update`, `end`, `stop` ou `error`.
- Indiretamente, inicialização da aplicação e rotinas do `useSystemStore`.

## Causa-raiz

Uma única fila representa simultaneamente três responsabilidades diferentes: bloquear interação durante trabalho pendente, registrar progresso e comunicar resultado terminal. A limpeza é orientada à ausência de pendências, não ao tempo necessário para compreender/dispensar o resultado. A resolução tolerante de alvo também privilegia manter o Teleport montado, sem preservar o escopo UX solicitado pelo consumidor.

## Impacto

- Falhas podem parecer travamentos breves ou desaparecer sem diagnóstico nem recuperação.
- Uma operação de seção pode impedir ações não relacionadas em toda a página.
- Usuários de leitor de tela não recebem anúncio consistente de início, conclusão ou falha.
- O fallback silencioso torna erros de integração difíceis de distinguir de bloqueios globais intencionais.

## Reprodução e verificação

1. Monte `MaxLoadScreen` e chame `loading.start({ key: 'x', target: '#painel', message: 'Salvando' })` sem existir `#painel`; confirme que o conteúdo é teleportado ao `body` e a máscara fixa cobre a viewport.
2. Chame `loading.error('x')`; meça a permanência da mensagem. Após o debounce, o target é esvaziado sem ação do usuário.
3. Inspecione a árvore de acessibilidade durante `loading`, `done` e `error`; não há região viva nem estado ocupado associado ao alvo.
4. Repita com duas operações no mesmo target: uma em erro e outra pendente. O erro permanece apenas enquanto a outra está pendente, demonstrando que sua duração depende de estado alheio.

## Direção de solução

Separar estado de bloqueio do histórico/feedback terminal. Manter erro até dispensa ou recuperação explícita e conclusão por duração configurável. Resolver alvo ausente de modo explícito, sem ampliar automaticamente o escopo. Fazer a máscara respeitar os limites do alvo, marcar a região ocupada com `aria-busy`, anunciar transições com parcimônia e usar `inert`/disabled quando a operação realmente bloquear interação, sem roubar foco.

## Critérios de aceite

- Um erro permanece legível até ação do usuário ou política de duração explícita e testada.
- `done` e `error` não são removidos apenas porque não há `loading`/`waiting`.
- Alvo local ausente não bloqueia o `body` silenciosamente.
- Máscara local não cobre áreas fora do alvo.
- Início e resultado são anunciados por tecnologia assistiva; o alvo expõe ocupação enquanto aplicável.
- Conteúdo visualmente bloqueado não continua acionável por teclado ou atalhos.
- Testes cobrem alvo válido, alvo ausente, múltiplas operações, erro, conclusão e recuperação.

## Possíveis contraevidências

- O debounce de 500 ms reduz flicker entre operações encadeadas, mas não garante tempo de leitura do resultado.
- Um slot permite substituir a apresentação, porém não altera limpeza, fallback ou escopo da máscara.
- Para `target: 'body'`, cobrir a viewport pode ser intencional; o problema é aplicar o mesmo efeito a operações locais e ao fallback implícito.
- Loaders genéricos aceitam ARIA por fallthrough; isso não fornece defaults nem resolve o contrato do overlay bloqueante.
