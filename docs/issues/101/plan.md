# Plano da issue #101 — Documentação da pilha do MaxModal

## Escopo e diagnóstico

Planejamento elaborado em 19/10/2026 na worktree pré-alocada `wt-implement-issue-101`. O arquivo de destino já existia vazio. Nesta etapa, somente este plano é preenchido; a correção e os testes descritos abaixo ficam para a execução autorizada posteriormente. Não há commit, publicação ou integração Git previstos nesta etapa.

### Descrição e Causa Raiz

**Veracidade: confirmada.** O defeito é documental, não uma falha do empilhamento. `COMPONENTS.md:L1515-1516` apresenta o MaxModal e afirma literalmente: “Usa `useModalStore` para controle de visibilidade global (apenas um modal por vez).” Essa exclusividade não corresponde ao código atual, tampouco aos testes de contrato já existentes. A correção ainda é necessária porque a afirmação permanece no documento consultado.

**Causa Raiz Comprovada:** o contrato escrito em `COMPONENTS.md:L1516` confunde exclusividade do modal no topo com exclusividade de abertura. O estado efetivo é uma pilha, e a visibilidade depende de pertencer à pilha, não de ser o topo:

| Evidência | Comportamento comprovado |
| --- | --- |
| `src/stores/useModal.Store.ts:L5-19` | `stack` armazena vários IDs; `show_id` e `top` leem o último ID; `isOpen(id)` verifica inclusão em toda a pilha. |
| `src/stores/useModal.Store.ts:L22-40` | `isTop(id)` identifica o último ID; `show(id)` chama `push(id)`, que acrescenta um ID novo sem remover os anteriores. |
| `src/stores/useModal.Store.ts:L30-46` | `hide(id)` remove somente o ID indicado; `hide()` sem argumento limpa a pilha inteira. |
| `src/components/MaxModal.vue:L362-388` | `is_show` usa `isOpen(id)` no controle pela store; `isTopModal` usa `isTop(id)`; os índices da pilha definem camadas progressivas. |
| `src/components/MaxModal.vue:L8-11` | O backdrop é renderizado com `v-if="is_show"`; o painel inferior recebe `aria-hidden="true"` e `inert`; somente o topo recebe `aria-modal="true"`. |
| `src/components/MaxModal.vue:L342-357` e `L483-484` | Fechamento por backdrop ou Escape é condicionado a ser o topo, respeitando as opções de fechamento. Isso não torna exclusivos os modais abertos. |
| `tests/stores/useModalStore.test.ts:L48-67` | Já existe contrato para vários IDs abertos e promoção do anterior ao remover o topo. |
| `tests/components/MaxModal.test.ts:L857-965` | Já existem cenários para dois modais renderizados, fechamento somente do topo por Escape, camadas progressivas e atributos acessíveis das camadas inferiores. |

**Fluxo causal e rastreamento reverso:**

1. UI: o gatilho chama `toggle()` (`src/components/MaxModal.vue:L3`), que chama `open()` quando fechado (`L598-600`). `open()` insere o próprio ID na store (`L580-587`). Alternativamente, o consumidor chama diretamente `useModalStore().show(id)`.
2. Store: `show('a')` → `push('a')` → `['a']`; `show('b')` → `push('b')` → `['a', 'b']` (`src/stores/useModal.Store.ts:L26-40`). Não há substituição do primeiro ID.
3. Retorno à UI: cada instância consulta `isOpen(seuId)` (`src/components/MaxModal.vue:L368-371`) e mantém seu backdrop/painel renderizado (`L10-11`). O índice define sua camada (`L374-388`).
4. Rastreamento reverso: dois painéis renderizados ← dois valores `is_show` verdadeiros ← duas consultas `isOpen` verdadeiras ← dois IDs preservados por `push`. Apenas `isTop('b')` é verdadeiro; isso controla a interação da camada superior, não a existência de `a`.
5. **API/Rotas ⇄ Controller/Service ⇄ DB: não se aplica.** Este fluxo é exclusivamente local, entre componente Vue e store Pinia; os métodos citados não fazem requisições, nem persistem dados.

**Reprodução executada sem criar ou editar código:**

```bash
node --experimental-strip-types --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { createPinia, setActivePinia } from 'pinia';
import { useModalStore } from './src/stores/useModal.Store.ts';

setActivePinia(createPinia());
const store = useModalStore();
store.show('a');
store.show('b');
assert.deepEqual(store.stack, ['a', 'b']);
assert.equal(store.isOpen('a'), true);
assert.equal(store.isOpen('b'), true);
assert.equal(store.isTop('a'), false);
assert.equal(store.isTop('b'), true);
assert.equal(store.show_id, 'b');
console.log(JSON.stringify({ stack: store.stack, aAberto: store.isOpen('a'), bAberto: store.isOpen('b'), topo: store.top, show_id: store.show_id }));
store.hide('b');
assert.deepEqual(store.stack, ['a']);
assert.equal(store.isOpen('a'), true);
assert.equal(store.isTop('a'), true);
store.hide();
assert.deepEqual(store.stack, []);
NODE
```

O processo concluiu com código de saída zero. A reprodução observou `stack: ["a", "b"]`, ambos abertos e `top/show_id: "b"`; depois de `hide('b')`, observou `stack: ["a"]` e topo `"a"`. A renderização simultânea foi comprovada por leitura do componente e das asserções existentes; a suíte Vitest não foi executada nesta etapa de planejamento.

**Agravantes:** um integrador pode implementar fechamento desnecessário do modal anterior, interpretar `show_id` como único modal aberto ou substituir indevidamente a pilha por um estado escalar. Também pode confundir “aberto/renderizado” com “interativo/acessível”: os inferiores continuam abertos, mas ficam inertes e ocultos da árvore de acessibilidade enquanto outro ocupa o topo.

### Arquivos afetados

Arquivos a alterar na futura implementação:

1. `COMPONENTS.md` — somente a seção `### MaxModal`, atualmente em `L1513-1537`: retirar a exclusividade incorreta e documentar o contrato de pilha com um exemplo curto.
2. `tests/components/MaxModalDocumentation.test.ts` — novo teste de contrato documental, usando leitura de `COMPONENTS.md` e sem montar componentes.
3. `tests/stores/useModalStore.test.ts` — acrescentar um cenário focado na sequência pública `show('a')`, `show('b')`, `hide('b')` e `hide()`, que acompanha o exemplo documental; preservar todos os testes existentes.

Arquivo produzido nesta etapa: `docs/issues/101/plan.md`.

Arquivos de referência e validação, **sem alteração prevista**: `src/components/MaxModal.vue`, `src/stores/useModal.Store.ts`, `src/stores/index.ts`, `tests/components/MaxModal.test.ts`, `vitest.config.ts` e `package.json`. Não alterar implementação, estilos, dependências, lockfile ou configuração de testes para corrigir uma divergência exclusivamente documental.

### Execuções propostas

1. Trabalhar na worktree dedicada autorizada, preservando alterações preexistentes. Reconfirmar a frase e as APIs citadas caso a base tenha mudado desde este diagnóstico.
2. Substituir a frase de `COMPONENTS.md:L1516` por uma descrição inequívoca, por exemplo: “Usa `useModalStore` para controle global por pilha de IDs, permitindo múltiplos modais abertos simultaneamente. Apenas o modal no topo permanece interativo; os inferiores continuam renderizados, com `inert` e `aria-hidden`.”
3. Acrescentar uma explicação curta na própria seção MaxModal:
   - Instâncias usam IDs distintos; `id` pode ser informado e, quando omitido, é gerado automaticamente (`src/components/MaxModal.vue:L63-64` e `L362-364`).
   - `isOpen(id)` significa pertencer à pilha; `isTop(id)` significa ocupar o topo. `top` e o alias retrocompatível `show_id` indicam o último ID, não a totalidade dos abertos.
   - Abrir `b` não fecha `a`. Fechar `b` preserva `a`, que volta ao topo. Escape/backdrop atuam somente no topo, conforme suas opções de fechamento; não prometer que toda operação programática só pode fechar o topo.
   - Diferenciar explicitamente `store.hide(id)` de `store.hide()`. Não confundir o método global com o `hide()` exposto por cada componente, que solicita o fechamento apenas da própria instância (`src/components/MaxModal.vue:L594-596`).
4. Acrescentar um exemplo mínimo usando `useModalStore` importada de `@maxvue/max-components-ui/stores`, com a store obtida em contexto com Pinia ativa. Explicar que existem duas instâncias com `id="a"` e `id="b"`; mostrar as quatro operações `show('a')`, `show('b')`, `hide('b')` e `hide()`, com os estados esperados. Não inventar APIs ou importar caminhos internos no exemplo público. Se houver exemplo Vue, manter tags de abertura em uma linha e a estrutura canônica de SFC.
5. Escrever o teste documental em `tests/components/MaxModalDocumentation.test.ts`, conforme o padrão de leitura com `readFileSync`/`resolve` já usado em `tests/components/MaxModal.test.ts:L4-5` e `L537-543`. Isolar o trecho entre `### MaxModal` e `### MaxPopover`; validar conteúdo apenas nesse trecho, para evitar falso positivo em outras seções ou neste plano.
6. Acrescentar o teste do encadeamento público à suíte da store. Usar a instância real e o `beforeEach` com Pinia já existente; não simular `show`, `push`, `hide` ou `isOpen`.
7. Concluir todo o bloco documental e seus testes antes da validação. Não aproveitar a edição para revisar a tabela inteira de props, outras inconsistências de documentação ou o comportamento de foco/fechamento: esses temas exigem diagnóstico e escopo próprios.
8. Executar a validação em lote abaixo, revisar o diff e corrigir apenas falhas causadas pelo bloco. Não realizar commit, push, release ou merge sem autorização explícita.

### Testes de regressão e validação em lote

**Novo contrato documental:** o teste deve falhar se a seção MaxModal não existir, contiver a alegação “apenas um modal por vez”, omitir o controle por pilha/múltiplos modais abertos ou omitir a distinção do topo e das camadas inferiores (`inert`/`aria-hidden`). Verificar também a presença do exemplo com os dois IDs e das duas formas de `hide`. Preferir expressões regulares com tolerância a espaços e formatação; não congelar o parágrafo inteiro nem usar snapshot do documento completo.

**Novo cenário da store:** após `show('a')` e `show('b')`, exigir `stack === ['a', 'b']`, `isOpen('a') === true`, `isOpen('b') === true`, `isTop('a') === false`, `isTop('b') === true` e `top/show_id === 'b'`. Após `hide('b')`, exigir `['a']`, com `a` aberto e no topo; após `hide()`, exigir pilha vazia e `top/show_id === null`.

**Contratos existentes a preservar:** executar os testes completos da store e do MaxModal, especialmente `tests/stores/useModalStore.test.ts:L48-109` e `tests/components/MaxModal.test.ts:L835-998`. Eles verificam empilhamento, compatibilidade de `show_id`, controle por `visible`, dois painéis renderizados, Escape somente no topo, camadas e atributos acessíveis. Não enfraquecer ou remover asserções existentes.

**Lote de execução, após concluir todas as edições e testes previstos:**

```bash
npx --no-install vitest run tests/stores/useModalStore.test.ts tests/components/MaxModal.test.ts tests/components/MaxModalDocumentation.test.ts
npm run type-check:test
npx --no-install eslint tests/stores/useModalStore.test.ts tests/components/MaxModalDocumentation.test.ts
git diff --check
```

Corrigir falhas em lote e reexecutar as verificações afetadas somente depois de concluir o conjunto de correções. Uma falha de ambiente ou de baseline não deve ser tratada como sucesso nem motivar alterações alheias ao escopo. Não repetir gates agregados e suas etapas sobre a mesma revisão. O `npm run verify` completo fica reservado ao fluxo de pré-release/integridade quando exigido; este reparo documental não requer mudança de build nem validação visual nova, pois não altera runtime, CSS ou tokens.

### Banco de dados

Nenhuma. Sem migration, alteração de schema, persistência, backend ou integração de API.

### Riscos de quebra e Não-Regressão

| Risco | Proteção necessária |
| --- | --- |
| “Corrigir” o runtime para satisfazer a frase antiga e eliminar modais aninhados. | Não editar componente/store; preservar os testes de dois modais abertos e revisar os caminhos do diff. |
| Interpretar vários abertos como vários painéis simultaneamente interativos/acessíveis. | Documentar topo versus inferiores; preservar asserções de `aria-modal`, `aria-hidden`, `inert`, Escape e camadas. |
| Induzir `hide()` global quando se pretendia fechar só `b`. | Exemplo com `hide('b')`, distinção explícita do `hide()` sem argumentos e teste da promoção de `a`. |
| Confundir `show_id` com único ID aberto, quebrando consumidores legados. | Descrever o alias como topo; preservar setter e métodos atuais, sem mudança de assinatura ou semântica. |
| Teste documental excessivamente frágil ou satisfeito por texto fora da seção. | Extrair somente MaxModal; usar verificações semânticas pontuais e tolerantes a formatação, sem snapshot integral. |
| Exemplo público inconsistente com os exports reais ou IDs das instâncias. | Conferir `src/stores/index.ts` e `package.json` antes de editar; utilizar a entrada pública `./stores` e IDs distintos. |

Nenhuma quebra de contrato público é pretendida. Não há novas dependências, remoção de classes legadas, reintrodução de PrimeVue ou mudança de acessibilidade. Eventuais bugs de runtime descobertos durante a validação devem ser registrados separadamente, não incorporados silenciosamente a esta correção.

### Validação

**Prova conclusiva da futura correção:** o comando Vitest do lote deve encerrar com código zero, incluindo o novo teste que rejeita a frase incorreta e exige a explicação da pilha na seção MaxModal, o cenário público `show/show/hide` e os contratos existentes de renderização simultânea. O teste documental deve falhar contra o conteúdo anterior de `COMPONENTS.md`; confirmar essa sensibilidade sem modificar a implementação de runtime nem descartar trabalho de terceiros, por exemplo verificando a versão anterior em memória com o mesmo predicado do teste.

Critérios de aceite adicionais:

- A seção afirma explicitamente que múltiplos modais podem permanecer abertos e diferencia o modal no topo.
- O exemplo preserva `a` ao abrir/fechar `b`, distingue fechamento individual de limpeza global e explica `show_id`.
- Tipos de testes, ESLint dos testes alterados e `git diff --check` aprovados.
- O diff da implementação se limita aos três arquivos previstos; o plano é o único arquivo preenchido nesta etapa.
- Não considerar a implementação concluída apenas porque a reprodução da store passou: ela confirma o comportamento existente, enquanto o novo teste documental comprova a correção do defeito relatado.

**Estado desta etapa:** diagnóstico estático e reprodução direta da store concluídos; documentação pública, testes novos e validações de implementação ainda não executados. Não há alegação de suíte completa aprovada.

### Skills Aplicáveis

- `technical-documentation-best-practices` — redação técnica em pt-BR, escopo preciso e exemplos fiéis às APIs públicas; consultada neste planejamento.
- `vitest-skill` — implementar o teste documental e o cenário público na suíte Vitest existente, sem adicionar ferramentas.
- `vue-vitest-testing-best-practices` — preservar o isolamento da Pinia e os contratos de componentes Vue durante a validação de regressão, adaptando os caminhos à estrutura real `tests/` deste pacote.
- `vue-typescript-best-practices` — manter tipagem estrita e evitar `any` desnecessário nos novos testes/exemplos.
- `code-review` — revisão final de escopo, compatibilidade, clareza documental e suficiência das evidências antes de qualquer integração autorizada.

Não é necessário acionar orquestração multiagente, revisão de design ou integração Laravel/API para este reparo documental localizado.
