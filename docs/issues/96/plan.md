# Plano de implementação — Issue #96

## Escopo e diagnóstico

### Descrição e Causa Raiz

**Veracidade: bug confirmado em execução na revisão atual.** Este documento é somente um plano; nenhuma correção ou teste persistente foi implementado nesta etapa.

O `MaxInputDiscount` calcula o preço líquido corretamente, mas deixa de publicar `update:price` quando somente o valor bruto muda. Um pai usando `v-model:price` conserva o preço antigo, embora a API exposta do filho já retorne o preço recalculado. Isso pode transmitir valores desatualizados a totais e persistências feitas pela aplicação consumidora; essas consequências são riscos, não ocorrências verificadas em um backend deste repositório.

**Causa Raiz Comprovada:**

1. `src/components/MaxInputDiscount.vue:L85-96` declara `gross`, seu alias `startValue`, `price` e seu alias de entrada `endValue`.
2. `src/components/MaxInputDiscount.vue:L187-192` deriva `effectiveGross` de `gross ?? startValue ?? 0`, convertendo strings com `Number` e normalizando `NaN` para zero. Alterar qualquer entrada efetivamente selecionada invalida esse `computed`.
3. `src/components/MaxInputDiscount.vue:L218-243` inicializa e interpreta o buffer do desconto, sem depender de mudanças posteriores no bruto.
4. `src/components/MaxInputDiscount.vue:L262-272` deriva `currentPrice` de `effectiveGross`, desconto e tipo: percentual usa `gross - gross * discount / 100`; monetário usa `gross - discount`, ambos com duas casas decimais.
5. `src/components/MaxInputDiscount.vue:L310-317` publica os três valores em `emitValues`, mas esse método é acionado por interação com o campo, não por alteração do bruto. Exemplos: `L347-362`, `L387-388`, `L396-413` e `L416-440`.
6. `src/components/MaxInputDiscount.vue:L450-475` observa apenas mudanças de `modelValue` e `discount` para recalcular o buffer e emitir preço. Não há observador de `effectiveGross`, `gross` ou `startValue`.
7. `src/components/MaxInputDiscount.vue:L477-497` observa o preço externo, mas sua fonte é somente `props.price ?? props.endValue`: mudar o bruto sem mudar o preço não executa o callback, apesar de o callback ler `effectiveGross`.
8. `src/components/MaxInputDiscount.vue:L499-502` emite o preço na montagem, uma única vez. Não cobre atualizações posteriores.

**Fluxo causal e rastreamento reverso:**

```text
Estado reativo do pai (gross/startValue)
    → prop selecionada → effectiveGross → currentPrice recalculado
    → NÃO há publicação de update:price para esta origem
    → estado price do pai permanece no valor da montagem

Rastreamento reverso do preço desatualizado:
price do pai ← último update:price (montagem/interação/outros watchers)
             ← currentPrice ← effectiveGross + desconto + tipo

Entrada inversa já existente:
price/endValue do pai → watcher externo → buffer de desconto
                     → update:modelValue e update:discount → pai
```

O campo visual mostra o desconto (`src/components/MaxInputDiscount.vue:L29-46` e `L256-260`), não o preço líquido; por isso pode parecer correto enquanto o estado financeiro do consumidor está desatualizado. O componente importa somente Vue e `InputBase` (`L69-70`). **Store, API/Rotas, Controller/Service e DB não participam deste fluxo na biblioteca**; o estado do pai é a fronteira pública comprovada. Não é necessário inventar ou alterar camadas de uma aplicação externa.

**Reprodução executada, sem gravar scripts ou alterar código-fonte:** o SFC real foi lido e seu `script setup` compilado com `@vue/compiler-sfc` e TypeScript em memória. Um renderer Vue mínimo montou um pai reativo com listener `update:price`, repassando o preço ao filho. Somente a renderização visual foi omitida e `InputBase` substituído; fórmulas, watchers e ciclo de montagem vieram do componente real. Após a emissão inicial, o bruto mudou de 200 para 300 e foram aguardados dois `nextTick`.

Saída observada, com asserções de que o preço interno mudou, o pai permaneceu desatualizado e nenhuma nova emissão ocorreu:

```json
{"prop":"gross","tipo":"percent","bruto":300,"descontoInterno":10,"precoInterno":270,"precoPai":180,"eventos":[180]}
{"prop":"startValue","tipo":"percent","bruto":300,"descontoInterno":10,"precoInterno":270,"precoPai":180,"eventos":[180]}
{"prop":"gross","tipo":"currency","bruto":300,"descontoInterno":20,"precoInterno":280,"precoPai":180,"eventos":[180]}
```

A reprodução confirma o problema de sincronização, mas não substitui testes de DOM ou a suíte completa. Os testes atuais cobrem fórmula inicial (`tests/components/MaxInputDiscount.test.ts:L45-54`, `L82-101`) e preço externo (`L103-113`), sem testar alteração posterior do bruto.

### Arquivos afetados

| Arquivo | Alteração prevista |
| --- | --- |
| `src/components/MaxInputDiscount.vue` | Observar mudanças do bruto efetivo e publicar o preço final ao consumidor, preservando o fluxo inverso. |
| `tests/components/MaxInputDiscount.test.ts` | Acrescentar regressões unitárias e integração com pai reativo, sem remover asserções existentes. |
| `docs/issues/96/plan.md` | Registro deste planejamento; único arquivo preenchido nesta etapa. |

Não há necessidade prevista de alterar `InputBase`, stores, resolvers, exports, dependências, lockfile, estilos ou playground.

### Execuções propostas

1. Usar a worktree pré-alocada da tarefa, preservando a branch e trabalhos pendentes. Conferir o estado inicial antes de implementar; não executar commit, merge, push ou publicação sem autorização específica.
2. Acrescentar em `tests/components/MaxInputDiscount.test.ts` o bloco completo de testes descrito abaixo, seguindo o ambiente `happy-dom` e a configuração existentes em `vitest.config.ts:L23-27`. Usar `mount`, props/eventos públicos e um pai reativo para testar o retorno real de `v-model:price`; não depender de campos internos não expostos.
3. Em `MaxInputDiscount.vue`, adicionar uma sincronização restrita a **`effectiveGross`**, em vez de observar separadamente os dois aliases ou criar um observador global de `currentPrice`. Isso mantém a precedência `gross > startValue` e evita ampliar a correção para outras origens de alteração do preço.
4. Programar o novo watcher com `flush: 'post'`, sem `immediate`, para ler `currentPrice` depois dos watchers existentes de desconto/preço e das atualizações do componente. Manter a emissão inicial no `onMounted` intacta. Não usar timers ou `nextTick` recursivo para sincronização.
5. No callback, ler o preço calculado e compará-lo numericamente ao preço externo efetivo (`props.price ?? props.endValue`, quando informado). Se o consumidor já refletir o resultado, não reenviar o mesmo valor; caso contrário, emitir apenas `update:price` com `currentPrice.value`. Sem preço externo informado, publicar o resultado da mudança do bruto normalmente.
6. **Não chamar `emitValues()` para mudanças exclusivas do bruto:** o desconto e o tipo não mudaram, portanto não devem surgir `update:modelValue`, `update:discount`, `update:type_discount` ou `type-change` artificiais. Não converter o preço antigo em outro desconto só porque o bruto mudou.
7. Preservar o watcher inverso de `price/endValue`: uma mudança explícita de preço pelo pai continua recalculando o desconto. Quando bruto e preço forem alterados explicitamente no mesmo lote, deixar o watcher inverso processar a entrada de preço antes de publicar o resultado final. Quando bruto e desconto mudarem juntos, o resultado deve usar ambos os valores finais. Comprovar essas interações nos testes, evitando publicar um preço intermediário que sobrescreva uma entrada explícita do pai.
8. Preservar integralmente a normalização, as fórmulas, os arredondamentos, a máscara, a conversão por símbolo, a validação e as assinaturas públicas. `endValue` permanece alias de **entrada**; não criar `update:endValue` como parte desta issue.
9. Manter a mudança localizada no bloco de sincronização e nos testes. Caso seja indispensável tocar alguma tag de abertura, mantê-la em linha única conforme `AGENTS.md`; não reformatar o template inteiro nem alterar estilos por oportunidade.
10. Depois de implementar **todo o bloco e seus testes**, executar a validação em lote. Corrigir falhas causalmente ligadas à mudança em um único lote e só então revalidar. Falhas preexistentes devem ser documentadas e diagnosticadas, não corrigidas silenciosamente fora do escopo.

### Testes de regressão e validação em lote

Adicionar os cenários abaixo, preferencialmente parametrizados quando compartilham o mesmo contrato:

| Cenário | Evidência esperada |
| --- | --- |
| Pai reativo, `gross=200`, desconto percentual 10 e `v-model:price` | Montagem recebe 180; alterar somente `gross` para 300 faz o pai receber 270, mantendo desconto 10 e display `10,0 %`. |
| Mesmo fluxo usando somente `startValue` | 180 → 270; comprova cobertura do alias pelo bruto efetivo. |
| Desconto monetário 20, `gross` 200 → 300 | Preço 180 → 280; desconto permanece 20. Cobrir também `type_discount='value'`, alias monetário existente. |
| Precedência dos aliases | Com `gross` informado, mudar somente `startValue` não muda preço nem emite sincronização; remover `gross` ativa o alias e publica seu resultado. |
| Bruto numérico em string | `'200'` → `'300'` produz 180 → 270; trocar 300 por `'300'` não provoca emissão adicional porque o valor efetivo não mudou. |
| Zero e entrada inválida já normalizada | Com desconto percentual 10, bruto 200 → 0 produz preço zero; 200 → string inválida segue o mesmo resultado. Não adicionar regras novas para negativos/infinito. |
| Arredondamento | Bruto 100,01 → 100,02, desconto 10%, preço segue 90,01 → 90,02, sem mudar a precisão do desconto. |
| Montagem e eventos | A emissão inicial continua única; uma mudança isolada do bruto que altera o preço gera uma nova publicação, sem eventos de desconto/tipo. |
| Retorno do preço emitido ao filho | Após `update:price`, aguardar estabilização e verificar ausência de novas emissões ou ciclos e preservação do desconto. Não basta checar `wrapper.emitted` sem repassar a prop. |
| Preço externo independente | Com bruto 200, atualizar `price` para 160 continua produzindo desconto 20. Repetir com `endValue` sem `price`. |
| Bruto e desconto no mesmo lote | De 200/10% para 300/20%, pai termina em 240, sem valor intermediário sobrescrevendo o resultado final nem ciclo de realimentação. |
| Bruto e preço explícito no mesmo lote | De 200/10%/180 para bruto 300 e preço 240, preservar a entrada explícita: desconto final 20%, preço final 240; não sobrescrever por 270. |
| Sem binding de preço | Um consumidor apenas com listener recebe o novo preço ao mudar o bruto. |
| Limites e interação | Manter testes atuais de teclado, limpeza, símbolo, `disabled`, mensagens e limites; incluir mudança de bruto em modo monetário verificando atualização do limite derivado sem alterar o desconto. |

Usar `await wrapper.setProps(...)`, `nextTick` e/ou `flushPromises` de forma determinística para aguardar os watchers e o retorno do pai, sem atrasos arbitrários. Desmontar os wrappers de integração e respeitar a política de console do projeto. Não fazer chamadas reais de rede.

**Validação de fechamento do lote de implementação**, sem executar agora:

```bash
npm run test
npm run type-check:test
npm run lint
npm run build
```

Executar esses comandos uma vez por revisão completa; `build` já inclui a checagem de tipos de produção. A suíte completa já inclui as regressões do componente, dispensando repeti-las isoladamente sobre o mesmo conteúdo. Se houver uma etapa de release posteriormente autorizada, usar `npm run verify` como gate completo, em vez de repetir manualmente seus componentes. Não executar release/publicação como consequência deste plano.

### Banco de dados

Nenhuma.

### Riscos de quebra e Não-Regressão

- **Realimentação bidirecional:** preço publicado retorna como prop e pode acionar o cálculo inverso. Testar o pai real e a estabilização, incluindo valores com arredondamento; o desconto deve permanecer intacto em mudanças exclusivas de bruto.
- **Ordem de watchers:** bruto, desconto e preço podem mudar no mesmo ciclo. O watcher pós-atualização e a comparação com o preço externo devem preservar as entradas explícitas e o resultado final; confirmar ambos os cenários simultâneos antes de considerar a solução concluída.
- **Emissões duplicadas/efeitos no consumidor:** listeners podem disparar recálculos ou salvamentos. Contar as emissões em montagem e mudança isolada de bruto; evitar reemitir o resultado já refletido no preço externo. Não generalizar esta issue para refatorar todas as emissões existentes.
- **Aliases:** observar o bruto normalizado evita reagir ao alias ignorado. Testar precedência, troca de fonte e normalização equivalente.
- **Mudança financeira esperada:** consumidores que antes conservavam um preço obsoleto passarão a receber o novo valor. Isso é a correção do contrato, mas pode revelar lógica externa dependente do defeito; não mudar a fórmula para contornar essa situação.
- **Máscara, limites e acessibilidade:** não alterar `InputBase`, markup ou estilos. Preservar testes existentes e a atualização dos limites derivados do bruto, sem truncar descontos ou adicionar novas regras comerciais.
- **Baseline:** esta etapa executou somente a reprodução de estado/eventos em memória; não há afirmação de aprovação da suíte, lint, tipos ou build. Se a implementação encontrar falha preexistente, registrar evidência e separar da regressão da issue.

### Validação

O comando automatizado conclusivo do lote é `npm run test`, contendo um teste nomeado **`sincroniza o preço do pai ao alterar somente gross`** em `tests/components/MaxInputDiscount.test.ts`.

Esse teste deve montar o pai com vínculo bidirecional real, receber 180 na montagem, mudar apenas o bruto para 300, aguardar estabilização e exigir preço do pai igual a **270**, desconto igual a **10**, uma única nova emissão de preço e nenhuma emissão adicional de desconto/tipo. Na revisão diagnosticada, a expectativa de 270 falharia porque o pai conserva 180, conforme a reprodução acima.

A entrega só estará validada após esse contrato e os demais cenários passarem, sem erros de console/loops, junto dos gates de tipos de testes, lint e build. Este planejamento não executa a implementação nem declara esses gates aprovados.

### Skills Aplicáveis

- `vue-debugging-best-practices`: rastrear dependências de computed/watchers, divergência pai/filho e ordem de atualização.
- `vue-vitest-testing-best-practices`: integração com pai reativo, isolamento e asserções de props/eventos públicos. Aplicar a configuração real desta biblioteca (`tests/components`, `happy-dom`), não os caminhos de aplicações Engeapp citados genericamente na skill.
- `vue-typescript-best-practices`: preservar tipos de props e eventos, sem introduzir `any` nos novos testes.
- `vue-eslint-stylelint-quality-standards`: respeitar formatação e lint, com `AGENTS.md` local prevalecendo em diferenças de convenção.
- `code-review`: revisar a futura correção quanto a realimentação, emissão duplicada e compatibilidade antes de integração.
- `technical-documentation-best-practices`: manter diagnóstico e evidências fiéis ao código, separando fatos verificados de validações futuras.
