# Plano de execução — Issue #91

## Correção do ciclo de vida do seletor de país de MaxInputPhone

### Descrição e Causa Raiz

**Veracidade: bug confirmado no código atual e reproduzido em runtime nesta etapa de planejamento.** O fechamento ou desmonte durante o `await nextTick()` de `open()` não cancela sua continuação. Assim, o componente remove os listeners antes de eles existirem e, depois, a abertura pendente registra `scroll` e `resize` em `window`, mesmo sem overlay ou componente montado.

**Causa Raiz Comprovada:**

| Evidência | Localização | Papel no fluxo causal |
| --- | --- | --- |
| Clique do seletor chama `toggle`; teclado chama `onTriggerKeydown` | `src/components/MaxInputPhone.vue:L5-16`, `src/components/MaxInputPhone.vue:L417-420`, `src/components/MaxInputPhone.vue:L436-441` | Inicia `open()` sem aguardar sua conclusão. |
| Abertura altera o estado e suspende até a atualização do DOM | `src/components/MaxInputPhone.vue:L388-395` | Cria a janela em que fechamento/desmonte pode ocorrer. |
| Continuação executa posicionamento, foco, rolagem e registro global incondicionalmente | `src/components/MaxInputPhone.vue:L396-401` | Não verifica se a abertura ainda é válida após a suspensão. |
| Fechamento cancela RAF, altera `isOpen` e remove listeners | `src/components/MaxInputPhone.vue:L404-415` | Limpa apenas recursos já adquiridos; não invalida a continuação pendente. Seu retorno antecipado também impede uma limpeza posterior quando `isOpen` já está falso. |
| Desmonte chama apenas `close` | `src/components/MaxInputPhone.vue:L480` | A limpeza ocorre antes da retomada de `open`, sem uma segunda limpeza posterior. |
| Listeners referenciam função que agenda RAF e consulta refs da instância | `src/components/MaxInputPhone.vue:L349-372` | Mantêm uma cadeia de referências ao estado do componente e permitem trabalho após o encerramento. |
| Overlay depende de `isOpen` | `src/components/MaxInputPhone.vue:L42-98` | Ausência do overlay não impede que listeners sejam registrados. |

**Rastreamento reverso e fronteiras:** `window.scroll/resize` → `onScrollOrResize` → RAF → `updatePosition` → refs `select_el`, `overlay_el` e `position` → instância de `MaxInputPhone`. Na origem: UI do seletor → `toggle`/teclado → `open` → estado local `isOpen` → `nextTick` → listeners globais. No caminho concorrente: fechamento ou `onBeforeUnmount` → `close` → remoção anterior à aquisição tardia.

Não há Store ⇄ API/Rotas ⇄ Controller/Service ⇄ DB nesse fluxo: o dropdown usa estado local e a constante `country_ddi_flags`, declarada em `src/constants/ddiFlags.ts:L10` e consumida em `src/components/MaxInputPhone.vue:L156`, `src/components/MaxInputPhone.vue:L299-305`. Carregamento de bandeiras não participa da causa raiz. `useOverlayZIndex` calcula somente o empilhamento; não gerencia esses listeners (`src/composables/useOverlayZIndex.ts:L40-88`).

**Reprodução observada, sem criar ou alterar código-fonte:** execução de `node --input-type=module` via entrada padrão, dentro da worktree, compilando em memória o SFC atual com `@vue/compiler-sfc` e TypeScript, montando com Vue Test Utils e Happy DOM. Foram usados Vue, `@maxvue/max-use`, Maska, constantes e composables reais; apenas `InputBase` foi substituído por um componente que renderiza o slot padrão com `inputAttrs`, para isolar o ciclo de vida do dropdown. RAF foi instrumentado com um contador e listeners foram observados preservando seu registro real. Não foi uma execução da suíte Vitest nem de navegador real.

Procedimento determinístico:

1. Montar o componente e obter `.max-phone-select`.
2. Disparar `dispatchEvent(new MouseEvent('click', { bubbles: true }))` sincronamente.
3. Sem qualquer `await` entre as ações, executar `wrapper.unmount()`; no segundo cenário, disparar outro clique no seletor para fechá-lo.
4. Drenar `nextTick()` e a continuação das promises.
5. Inspecionar a ordem dos registros/remoções e disparar `scroll`/`resize` para verificar atividade residual.

Saída da reprodução bem-sucedida:

```json
{"cenario":"desmonte imediato","eventos":["remove:scroll:true","remove:resize:false","add:scroll:true","add:resize:false"],"framesAposCleanup":1,"overlay":false}
{"cenario":"fechamento imediato","eventos":["remove:scroll:true","remove:resize:false","add:scroll:true","add:resize:false"],"framesAposCleanup":1,"overlay":false}
```

O último campo de cada evento indica `options === true`: `scroll` usa captura e `resize` não informa opções. As duas adições posteriores às remoções, seguidas de um RAF após eventos globais, comprovam o defeito. Não foi medido tamanho de heap; a retenção potencial decorre dos listeners persistentes, não de uma medição de memória. Uma primeira tentativa do harness falhou por interoperabilidade do export do stub de `InputBase`; corrigido somente em memória, o harness produziu a evidência acima sem modificar o componente.

**Agravantes e cobertura preexistente:**

- O problema também acontece ao abrir e fechar no mesmo turno, mantendo a instância montada.
- Os guardas de refs nulas em `updatePosition` evitam erro de DOM, mas não removem os listeners nem impedem o agendamento de RAF.
- Repetir o problema com novas instâncias pode acumular callbacks distintos. Eventos repetidos na mesma instância são limitados pelo RAF e a deduplicação nativa de listeners; não atribuir a eles multiplicação de listeners idênticos.
- Os testes atuais validam abertura normal, `disabled`, teclado e fechamento após a abertura completa, mas aguardam o tick antes do cleanup (`tests/components/MaxInputPhone.test.ts:L192-201`, `tests/components/MaxInputPhone.test.ts:L235-273`, `tests/components/MaxInputPhone.test.ts:L346-388`). Não cobrem a intercalação reproduzida.

### Arquivos afetados

| Arquivo | Alteração prevista |
| --- | --- |
| `src/components/MaxInputPhone.vue` | Invalidar aberturas pendentes, validar a continuação após `nextTick` e garantir cleanup idempotente de listeners/RAF. |
| `tests/components/MaxInputPhone.test.ts` | Acrescentar regressões de fechamento/desmonte síncrono e de reabertura, com instrumentação isolada dos efeitos globais. |
| `docs/issues/91/plan.md` | Este plano, único arquivo preenchido nesta etapa; atualizar posteriormente apenas se houver evidências relevantes da execução. |

Nenhuma alteração prevista em `InputBase`, composables compartilhados, stores, exports, estilos, dependências, lockfile ou configuração de testes. A worktree pré-alocada deve ser preservada; suas pastas já estão ignoradas em `.gitignore:L68-69`.

### Execuções propostas

1. **Manter o escopo local.** Executar a futura implementação na worktree dedicada, preservando mudanças preexistentes. Não publicar, commitar, integrar ou atualizar dependências sem autorização específica.
2. **Adicionar as regressões no arquivo existente.** Usar `mountPhoneField`, o ambiente atual e seletores públicos. Para provocar a corrida, disparar eventos DOM nativos sem aguardar entre abertura e fechamento/desmonte. Não usar `await wrapper.trigger('click')` antes do cleanup: isso perderia a janela de falha.
3. **Identificar cada abertura com uma geração local.** Declarar um contador numérico não reativo junto ao estado de controle do overlay. Em `open()`, após respeitar o guarda `props.disabled`, incrementar o contador e capturar seu valor numa variável local antes de alterar `isOpen` ou aguardar o tick. Não expor esse controle na API pública.
4. **Validar a continuação antes de qualquer efeito pós-tick.** Imediatamente após `await nextTick()`, retornar se `isOpen.value` estiver falso ou se a geração capturada diferir da geração corrente. Só então executar `updatePosition`, foco, rolagem e adição dos dois listeners. A geração impede que uma abertura antiga seja tratada como atual no ciclo abrir → fechar → reabrir, em que apenas verificar `isOpen` seria insuficiente para distinguir operações.
5. **Invalidar e limpar em `close()`.** Incrementar a geração antes de qualquer possível retorno; tornar a limpeza idempotente, removendo o retorno antecipado baseado apenas em `isOpen`. Cancelar e zerar o RAF pendente, definir `isOpen` como falso e remover sempre os listeners com a mesma função e as opções atuais: captura `true` para `scroll`, sem captura para `resize`. Remover um listener inexistente é seguro. Preservar `onBeforeUnmount(close)` para que o desmonte use o mesmo caminho de invalidação/limpeza.
6. **Preservar contratos e comportamento válido.** Não mudar o fluxo de `disabled`, máscara, DDI, debounce, slots, ARIA, Teleport, virtualização ou z-index. Manter a callback de eventos estável, o agrupamento por RAF e o foco normal; não antecipar o registro para antes do tick nem introduzir temporizadores ou bibliotecas.
7. **Concluir o bloco e validar em lote.** Implementar todos os ajustes e os testes antes de executar testes, tipos, lint ou build. Depois executar o lote descrito abaixo, diagnosticar falhas, concluir as correções em conjunto e revalidar as etapas afetadas. Não corrigir baseline sem nexo causal e autorização.

### Testes de regressão e validação em lote

Adicionar um bloco de ciclo de vida a `tests/components/MaxInputPhone.test.ts`, próximo dos testes de listeners/RAF existentes, cobrindo:

| Cenário | Ação | Resultado obrigatório |
| --- | --- | --- |
| Desmonte antes da retomada | Clique DOM nativo e `wrapper.unmount()` sem `await` intermediário; depois drenar o tick/promises. | Nenhuma adição tardia dos callbacks do dropdown; overlay ausente; `scroll` e `resize` posteriores não agendam RAF. |
| Fechamento antes da retomada | Dois cliques síncronos no seletor; só depois drenar as microtarefas. | `aria-expanded="false"`, overlay ausente, nenhuma aquisição tardia de listeners nem RAF após eventos globais. |
| Abrir → fechar → reabrir no mesmo turno | Três cliques síncronos e drenagem do tick/promises. | Overlay aberto e foco no filtro; apenas a abertura atual executa seus efeitos pós-tick e registra um par de listeners. O fechamento seguinte deixa zero recursos ativos. |
| Abertura completa e desmonte | Abrir, aguardar conclusão, disparar scroll com RAF controlado e desmontar. | RAF cancelado pelo mesmo identificador; ambos os listeners removidos com a callback e captura correspondentes; eventos seguintes sem novo RAF. |
| Fechamento repetido e novo ciclo válido | Abrir normalmente, fechar e desmontar; repetir montagem/abertura/fechamento com nova instância. | Cleanup repetido sem exceções ou callbacks residuais; nenhuma interferência entre instâncias. |
| Abertura normal e desabilitada | Preservar testes de clique, teclado e `disabled`; verificar foco na abertura válida. | Abertura válida ainda registra o par de listeners e posiciona o overlay; `disabled` não abre nem registra listeners do dropdown. |

**Instrumentação e isolamento:**

- Observar `window.addEventListener` e `window.removeEventListener` sem impedir o funcionamento real. Filtrar pelos tipos e pela identidade da callback do dropdown; não contar listeners de outras dependências.
- Comparar também a ordem de aquisição e remoção, não apenas a existência de chamadas a `removeEventListener`.
- Controlar `requestAnimationFrame`/`cancelAnimationFrame` com identificadores determinísticos; limpar contadores após a montagem/cleanup e antes dos eventos usados como prova. Usar os mesmos globais que o runtime utiliza.
- Na reabertura, verificar que só a continuação vigente produz efeitos, por exemplo pelo par de registros e pelo foco do filtro, sem expor estado interno novo.
- Drenar a continuação de `open` antes das asserções finais; manter `nextTick` real, sem mock que esconda a suspensão.
- Restaurar spies e globais em `finally`/teardown. Se um teste executar sobre a versão defeituosa, remover explicitamente quaisquer callbacks capturadas e cancelar RAFs pendentes, mesmo com o componente já desmontado. Limpar `document.body` isoladamente não remove listeners em `window`.
- Manter o `enableAutoUnmount(afterEach)` existente e evitar desmonte manual duplicado no gerenciamento das novas fixtures. Não alterar `tests/setup.ts` para acomodar a correção.

**Lote de validação após a implementação completa:**

```bash
npx vitest run tests/components/MaxInputPhone.test.ts tests/components/MaxInputPhoneMail.test.ts
npm run type-check
npm run type-check:test
npm run lint:check
npm run build
```

Depois do lote focal, executar `npm run test` como regressão transversal se a entrega não utilizar o gate completo. `type-check` valida o código e `type-check:test` valida as novas fixtures; o build é a verificação de distribuição, não a prova da corrida. O roteiro não deve repetir comandos já cobertos por um agregado sobre a mesma revisão: se a entrega for de pré-release, usar `npm run verify` como gate completo no lugar desse lote mais a suíte geral, sem repeti-los separadamente. Navegador, cobertura, benchmarks, consumidores e integridade permanecem incluídos no gate de release; esta etapa de planejamento não executa nem declara esse gate aprovado.

### Banco de dados

Nenhuma migration. Não há persistência, schema, controller, serviço ou rota envolvidos.

### Riscos de quebra e Não-Regressão

| Possível regressão | Prevenção e prova |
| --- | --- |
| Guarda cancela a abertura correta numa reabertura rápida | Geração local por abertura; teste de três cliques no mesmo turno e foco/overlay válidos ao final. |
| Limpeza remove o listener errado ou deixa captura ativa | Mesma identidade da função e mesmas opções de registro/remoção; teste de eventos posteriores sem RAF. |
| Alteração elimina o posicionamento ou foco da abertura válida | Manter a ordem dos efeitos após o tick; testar foco, overlay e registro normal, além das regressões existentes de teclado. |
| RAF pendente sobrevive ao fechamento/desmonte | Preservar cancelamento e reset do identificador; controlar o RAF e verificar o cancelamento exato e ausência de novos agendamentos. |
| Teste passa apesar do vazamento ou polui casos seguintes | Não usar ausência de overlay ou `removeEventListener` isoladamente como prova; verificar aquisições tardias e atividade residual; teardown explícito de callbacks e mocks. |
| Mudança acidental em telefone/consumidores | Não tocar máscara, parsing, debounce, aliases ou props; executar testes existentes de `MaxInputPhone` e `MaxInputPhoneMail`, tipos e build. |
| Expansão para uma refatoração global de overlays | Limitar a correção a `open`/`close` e controle local; nenhum composable novo ou dependência adicional. |

Não há quebra de contrato público planejada. `open` e `close` são funções internas; `defineExpose` permanece com `unmaskedValue`, `noMask` e `handlePaste` (`src/components/MaxInputPhone.vue:L472-478`). Preservar classes existentes e a independência do PrimeVue. Repetições indevidas de efeitos da abertura cancelada são removidas intencionalmente; abertura vigente e fechamento devem manter a experiência atual.

### Validação

**Prova conclusiva da correção na futura implementação:**

```bash
npx vitest run tests/components/MaxInputPhone.test.ts tests/components/MaxInputPhoneMail.test.ts
```

O comando só comprova a correção quando contiver e aprovar as novas asserções: nenhuma aquisição após fechamento/desmonte síncrono, nenhum RAF após eventos globais nesses estados, um único par válido no ciclo de reabertura e remoção/cancelamento completos no fechamento subsequente. Aprovar apenas os testes preexistentes não basta. A reprodução desta análise já demonstra o comportamento defeituoso anterior à correção.

**Critérios de aceite:**

1. Nenhuma continuação cancelada executa posicionamento, foco, rolagem ou registro global após o tick.
2. A última abertura válida segue funcional, incluindo clique, teclado, foco e virtualização.
3. Depois de fechamento ou desmonte não há listeners do dropdown nem RAF pendente.
4. Testes novos e preexistentes, tipos, lint e build aprovados, ou limitações/falhas reportadas sem alegar conclusão verde.
5. Diff da implementação restrito aos arquivos previstos, revisado quanto à corrida e à retrocompatibilidade; sem publicação ou integração Git implícita.

**Estado desta etapa:** somente análise, reprodução isolada e preenchimento deste plano. Nenhuma correção, teste permanente ou alteração de código-fonte foi implementada; a suíte do projeto, tipos, lint e build não foram executados nesta fase.

### Skills Aplicáveis

Skills curadas presentes em `.opencode/skills/` a seguir durante a execução:

- `vue-debugging-best-practices`: ciclo de vida, efeitos colaterais e continuação assíncrona após cleanup. Nesta worktree, os guias `reference/` mencionados pela skill não estão presentes; usar a evidência do código e a reprodução, sem presumir consulta a esses arquivos.
- `vue-vitest-testing-best-practices`: fixtures isoladas, Vue Test Utils, spies e teardown. Aplicar os princípios, respeitando a configuração real desta biblioteca: `happy-dom` e `tests/**/*.{test,spec}.ts` (`vitest.config.ts:L23-29`), não os caminhos de aplicação Engeapp citados genericamente pela skill. A ausência deliberada de `await` entre os eventos iniciais é essencial para este teste de concorrência.
- `vue-typescript-best-practices`: contador local tipado, refs e SFC; preservar imports explícitos e convenções reais da biblioteca, sem introduzir stores ou DTOs de aplicação.
- `code-review` (`code-review-and-quality`): revisão final da correção e dos testes quanto a concorrência, simplicidade, arquitetura, segurança e desempenho, antes de eventual integração autorizada.
- `technical-documentation-best-practices`: manter evidências, limitações e comandos de validação fiéis ao código.
