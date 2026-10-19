# Plano de implementação — Issue #90 — MaxImage

## Escopo e situação

Planejamento elaborado em 19/10/2026 na worktree pré-alocada `wt-implement-issue-90`. Bug confirmado na revisão atual por inspeção do código e reprodução isolada das funções reais. Nesta etapa, somente este plano é preenchido; nenhuma correção, teste persistente, alteração de dependências ou integração Git é executada.

### Descrição e Causa Raiz

Ao confirmar um recorte e desmontar `MaxImage` enquanto a codificação do canvas ou a leitura opcional em base64 ainda está pendente, a continuação assíncrona permanece executável. O cleanup revoga somente a URL existente naquele instante. A continuação cria outra URL depois desse cleanup, sem haver um novo ciclo de desmontagem para revogá-la. O registro de Object URLs mantém o blob associado alocado até revogação ou encerramento do documento, mesmo sem o componente na tela.

**Causa Raiz Comprovada:**

| Evidência | Local exato | Papel causal |
| --- | --- | --- |
| Botão de confirmação | `src/components/MaxImage.vue:L167-175` | A UI dispara `confirmCrop()`. |
| Captura da imagem e geometria | `src/components/MaxImage.vue:L537-554` | A função captura `img` antes da suspensão; o desaparecimento posterior do template ref não invalida a execução já iniciada. |
| Primeira suspensão | `src/components/MaxImage.vue:L590-607` | O callback de `canvas.toBlob()` resolve uma Promise sem verificar o ciclo de vida. A continuação trata o resultado mesmo após desmontagem. |
| Segunda suspensão opcional | `src/components/MaxImage.vue:L609-620` | `includeDataUrl=true` aguarda `FileReader.onloadend/onerror`, também sem verificar desmontagem. |
| Continuação até aplicação | `src/components/MaxImage.vue:L623-635` | Cria `File` e payload e chama `applyCropPayload()` incondicionalmente. |
| Alocação e notificações | `src/components/MaxImage.vue:L519-534` | `applyCropPayload()` revoga a URL anterior, cria outra em L522, atualiza `currentSrc`, emite eventos e chama `onEdit`; não há guarda de descarte. Após aguardar `onEdit`, ainda modifica estado. |
| Cleanup insuficiente | `src/components/MaxImage.vue:L238-244` e `src/components/MaxImage.vue:L705-714` | `onBeforeUnmount()` revoga a URL ativa, mas não marca a instância como descartada nem impede alocações futuras. |

**Rastreamento reverso de dados e fronteiras:** a URL retida nasce em `URL.createObjectURL(payload.blob)` ← payload em `confirmCrop()` ← `canvas.toBlob()` e, opcionalmente, `FileReader` ← canvas desenhado com imagem e `cropBox` ← acionamento da UI. Na volta, `currentSrc` alimenta a imagem inline e `previewEffectiveSrc` (`src/components/MaxImage.vue:L14-18`, `L235-251`), e `update:src`, `edit`, `crop` e `props.onEdit` entregam o resultado ao consumidor (`L526-530`). O contrato público é `src/types/image.ts:L3-16` e `L49-52`.

Não existe cadeia de persistência UI ⇄ Store ⇄ API/Rotas ⇄ Controller/Service ⇄ DB neste recorte: o blob e a URL pertencem à instância e às APIs do navegador. `useModalStore` só gerencia a pilha visual (`src/components/MaxImage.vue:L231-234`, `L318-328`, `L705-713`; `src/stores/useModal.Store.ts:L4-5`, `L26-32`). Um eventual envio ao backend é responsabilidade do consumidor de `onEdit`, sem rota, controller ou banco envolvidos na causa demonstrada.

**Verificação da veracidade realizada:** foi executado um comando Node via entrada padrão, sem criar arquivos, extraindo do SFC as funções `confirmCrop`, `applyCropPayload`, `revokeActiveObjectUrl` e o callback de `onBeforeUnmount`, mais o helper real de dimensões. Os trechos TypeScript foram transpilados somente em memória. Refs, canvas, FileReader e lifecycle foram substituídos por doubles controlados. Em dois cenários, manteve-se pendente primeiro `toBlob` e depois `FileReader`; executou-se o callback de desmontagem, zerou-se o ref da imagem e só então liberou-se a conclusão. Ambos terminaram com uma chamada a `createObjectURL` após o descarte e nenhuma chamada a `revokeObjectURL`.

Saída observada em cada cenário: `desmontagem-concluida → createObjectURL(desmontado=true) → emit(update:src) → emit(edit) → emit(crop)`. Isso demonstra a corrida no fluxo real extraído, não uma medição de heap nem uma montagem completa em Vue/Chromium. A primeira tentativa do harness falhou por export residual do helper; removido esse detalhe apenas na transformação em memória, os dois cenários concluíram com asserções atendidas. A reprodução de integração no componente montado será incorporada na implementação.

**Lacuna dos testes atuais:** `tests/components/MaxImage.test.ts:L392-419` e `tests/browser/MaxImage.browser.ts:L448-486` desmontam depois de o recorte terminar. `tests/unit/MaxImage.adversarial.spec.ts:L100-225` verifica substituição e revogação de URLs com codificação imediata. Nenhum desses cenários exercita a conclusão pendente após o cleanup. Portanto, o cleanup existente não constitui correção deste bug.

### Arquivos afetados

Alterações previstas na futura implementação:

- `src/components/MaxImage.vue`: estado privado de descarte e guardas nas fronteiras assíncronas e na aplicação do payload.
- `tests/components/MaxImage.test.ts`: regressões determinísticas para conclusão tardia, chamada exposta e continuidade do caminho válido.
- `tests/browser/MaxImage.browser.ts`: regressão no componente realmente montado/desmontado em Chromium, mantendo a infraestrutura existente.

Arquivo desta etapa: `docs/issues/90/plan.md`. `src/types/image.ts`, `src/helpers/imageCrop.ts`, `src/stores/useModal.Store.ts`, configurações e dependências permanecem inalterados. A suíte adversarial existente será executada como proteção, sem modificação prevista.

### Execuções propostas

1. Trabalhar exclusivamente na worktree pré-alocada, preservando branch e alterações preexistentes. Não realizar commit, push, publicação ou limpeza da worktree sem autorização correspondente.
2. Acrescentar os testes de regressão descritos abaixo ao bloco autorizado, com callbacks de resolução controlados, sem sleeps arbitrários e sem alterar a API pública para facilitar testes.
3. Introduzir uma variável privada booleana, não reativa, por instância, por exemplo `isDisposed`, inicialmente falsa. Torná-la verdadeira como primeira ação de `onBeforeUnmount()`, antes de revogar a URL e liberar listeners/modal/foco/scroll. Não reverter esse estado nem colocá-lo em store compartilhada.
4. Fazer `confirmCrop()` retornar imediatamente quando a instância já estiver descartada, antes de escrever `cropError` ou acessar DOM. Revalidar o descarte logo após o `await` de `toBlob`, antes de tratar blob nulo, iniciar FileReader ou criar `File`. Aplicar a mesma regra ao tratamento de exceção da codificação, evitando erro de UI tardio.
5. Revalidar após o bloco de leitura opcional com FileReader, inclusive quando houver falha e fallback, antes da criação de `File`/payload e de `applyCropPayload()`. O resultado tardio deve ser simplesmente descartado: não criar URL para revogá-la em seguida.
6. Proteger também a entrada de `applyCropPayload()` antes de qualquer revogação, criação de URL, alteração de estado, emissão ou chamada de `onEdit`. O método é exposto em `src/components/MaxImage.vue:L716-724`, portanto não basta proteger somente seu chamador atual.
7. Após o `await props.onEdit(payload)`, revalidar o descarte antes das escritas finais em `isCropping`, `cropReady` e `cropError`. Uma chamada de consumidor iniciada legitimamente antes da desmontagem não deve ser cancelada retroativamente; preserve sua semântica de retorno/rejeição.
8. Preservar o caminho montado: uma compressão via `toBlob`, dataUrl somente quando solicitado, nenhuma chamada a `canvas.toDataURL`, conteúdo/formato do payload, sequência de notificações e revogação da URL anterior. Não modificar cancelamento do editor, fechamento do preview, troca de `src` ou concorrência entre recortes nesta issue.
9. Não adicionar AbortController, timer, watcher ou abstração global para esta correção. `toBlob` não fornece cancelamento nesse contrato; a garantia necessária é invalidar suas continuações. Abortar FileReader não é requisito para impedir a URL tardia e adicionaria tratamento de abort/resolução fora do escopo mínimo.
10. Concluir componente e todos os testes do bloco antes de executar testes, tipos ou build. Validar o conjunto, diagnosticar as falhas, aplicar correções em lote e só então revalidar. Revisar o diff e preservar contratos e classes existentes, sem reformatação ampla do template.

### Testes de regressão e validação em lote

Em `tests/components/MaxImage.test.ts`, reutilizar `mountImage`, Pinia e dimensões controladas da imagem. Usar spies restaurados em `finally`/cleanup, remover cada wrapper do controle de desmontagem quando necessário e restaurar globais. Não deixar o cleanup do teste esconder o vazamento medido.

| Caso | Arranjo e ação | Asserções conclusivas |
| --- | --- | --- |
| `toBlob` pendente ao desmontar | Guardar callback, iniciar `confirmCrop()` sem aguardar a Promise, desmontar, resolver com blob e aguardar a Promise original. | Nenhuma nova URL; nenhum `update:src`, `edit`, `crop` ou `onEdit` relativo ao recorte descartado; Promise conclui sem erro. |
| FileReader pendente ao desmontar | `includeDataUrl=true`; resolver `toBlob` enquanto montado; confirmar que `readAsDataURL` iniciou; desmontar; liberar `onloadend`. | Mesmas garantias; prova específica da segunda fronteira, sem testar acidentalmente só a primeira. |
| Fallback tardio do FileReader | Repetir com `onerror` seguido de `onloadend`, como no navegador. | Não aplicar payload após descarte; não gerar URL pelo fallback. |
| URL anterior e segundo recorte pendente | Aplicar primeiro recorte válido, iniciar outro, desmontar, resolver o segundo. | Primeira URL revogada exatamente uma vez; nenhuma segunda URL alocada; conjunto de URLs vivas da instância vazio. |
| Blob nulo tardio | Resolver callback com `null` após desmontar. | Sem mutação tardia de `cropError`, sem URL e sem notificações. Manter teste existente de erro recuperável quando montado. |
| `onEdit` pendente | Aplicar payload montado com Promise de consumidor controlada, capturar refs/estado expostos, desmontar e resolver consumidor. | URL já existente revogada no desmonte e nenhuma escrita final de estado após a resolução; callback iniciado antes do descarte não é chamado novamente. |
| Método exposto após descarte | Guardar referência a `applyCropPayload`, desmontar e invocá-la com payload válido. | Retorno inerte, sem URL, alteração de `currentSrc`, eventos ou `onEdit`. |
| Isolamento entre instâncias | Desmontar instância A com codificação pendente e concluir recorte em B montada. | A descarta o resultado; B continua criando e revogando sua própria URL normalmente. |
| Caminho válido | Concluir ainda montado, com e sem dataUrl. | Contrato de Blob/File/dimensões/MIME/eventos preservado, uma compressão e zero `toDataURL`; cleanup normal permanece efetivo. |

Em `tests/browser/MaxImage.browser.ts`, acrescentar caso determinístico de `toBlob` pendente: carregar imagem válida, iniciar recorte, capturar callback, chamar `app.unmount()`, definir `activeApp=null`, concluir callback e aguardar a Promise de `confirmCrop()` guardada antes do desmonte. Medir chamadas e conjunto de URLs por identificador, separando a URL da imagem-fonte criada pelo próprio helper. Fazer as asserções antes do `afterEach`, que revoga URLs de fixtures e poderia mascarar a falha. Restaurar os spies e revogar eventual URL vazada pelo teste em `finally`, somente depois das asserções. Manter os testes reais de canvas/FileReader e os orçamentos de performance existentes, sem afrouxá-los.

Não executar validações por microedição. O ciclo da implementação será: escrever o bloco completo e suas regressões → validar em lote → corrigir o conjunto das falhas relacionadas → revalidar a revisão corrigida. Se for necessário comprovar o estado vermelho, executar as novas regressões sobre a revisão anterior em ambiente isolado, sem descartar trabalho ou reverter arquivos do usuário.

### Banco de dados

Nenhuma.

### Riscos de quebra e Não-Regressão

- **Guarda excessiva:** confundir preview fechado ou recorte cancelado com componente desmontado bloquearia usos atuais. A guarda representa exclusivamente descarte definitivo da instância; testar caminho válido e isolamento.
- **URL anterior perdida ou revogada duas vezes:** preservar `revokeActiveObjectUrl()` idempotente e watcher de `src`; testar sequência de recortes, troca externa de imagem e desmontagem com recorte pendente.
- **Proteção incompleta:** cobrir somente `toBlob` deixa FileReader e método exposto vulneráveis. Os casos independentes acima são obrigatórios.
- **Contrato público:** não alterar props, emits, `defineExpose`, assinatura Promise dos métodos, `MaxImageEditPayload` nem comportamento de erro do consumidor. Testar payload com/sem dataUrl, erro recuperável e `onEdit` assíncrono.
- **Limite da correção:** não tentar cancelar upload ou outro efeito externo já iniciado por `onEdit`; não introduzir política nova de concorrência, cancelamento do editor ou troca de fonte.
- **Falso positivo de teste:** spies globais, mocks síncronos, espera incorreta e cleanup de fixtures podem esconder a corrida. Asserir que a etapa está pendente antes de desmontar e aguardar explicitamente sua conclusão depois.
- **Limpeza visual:** manter remoção da pilha modal, listeners, foco e scroll existentes. Executar suíte atual de MaxImage e revisão do diff, sem mudanças de CSS/PrimeVue/dependências.

### Validação

Critério de aceite: nenhum resultado cuja etapa de codificação/leitura conclua depois do início do desmonte pode alocar Object URL, publicar recorte ou iniciar `onEdit`. URLs legitimamente criadas antes do desmonte continuam sendo revogadas; a instância montada conserva o comportamento anterior.

Executar, na futura implementação e após concluir todo o bloco, a partir da worktree:

```bash
npx vitest run tests/components/MaxImage.test.ts tests/unit/MaxImage.adversarial.spec.ts
npm run test:browser -- tests/browser/MaxImage.browser.ts
npm run type-check
npm run type-check:test
npm run lint
npm run build
```

As novas regressões com callbacks controlados são a prova direta da correção; saída zero dos testes antigos sem esses cenários não basta. Os demais comandos verificam compatibilidade e integridade do pacote. Não afirmar sucesso enquanto houver falhas ou etapas pendentes. Se a entrega for pré-release, usar `npm run verify` no lugar da bateria parcial sobre a mesma revisão, sem repetir suas etapas isoladamente e sem executar release/publicação.

Nesta etapa de planejamento, nenhum desses gates de implementação foi executado. A veracidade foi demonstrada por inspeção e pelo harness isolado descrito acima; não se declara aprovação de testes Vue/Chromium nem correção já implementada.

### Skills Aplicáveis

- `vue-debugging-best-practices`: diagnóstico de ciclo de vida, refs e efeitos assíncronos após descarte. O guia `reference/cleanup-side-effects.md` citado pela skill não está presente nesta cópia; usar o código observado e a documentação oficial de lifecycle como evidência, sem presumir conteúdo ausente.
- `vue-components` e `vue-typescript-best-practices`: Composition API, estado privado por instância e preservação dos contratos tipados.
- `vitest-skill` e `javascript-testing-patterns`: callbacks/Promises controlados, spies, isolamento e restauração de globais nos testes existentes.
- `superpowers`: plano com critérios verificáveis, implementação cirúrgica e revisão adversarial; aplicar a validação em lote determinada pelo AGENTS.md do projeto.
- `code-review`: revisão final da implementação e dos testes, focada em recursos, fronteiras assíncronas e retrocompatibilidade.
- `technical-documentation-best-practices`: manter o plano fiel aos caminhos, linhas, comandos e limites efetivamente verificados.

Referência de apoio consultada: documentação oficial Vue de lifecycle, `https://vuejs.org/api/composition-api-lifecycle.html`, via Context7. Nenhuma skill ausente deve ser inventada ou tratada como disponível.
