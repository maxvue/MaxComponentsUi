# Plano de execução — Issue #89

## Descrição e Causa Raiz

### Veracidade e escopo

O defeito existe no código atual e requer correção. Esta entrega é exclusivamente de planejamento; nenhum código-fonte, teste, dependência ou configuração foi alterado. O arquivo de plano encontrado na worktree pré-alocada estava vazio.

`clearAuthOtpCache('')`, sem telefone, seleciona todas as chaves **não vazias** do localStorage da mesma origem. Isso pode apagar rascunhos, preferências e tokens armazenados pela aplicação consumidora, independentemente de pertencerem ao OTP. Uma chave cujo nome seja a string vazia não é selecionada, por causa da condição `key &&`; portanto, “todo o localStorage” descreve o impacto prático, mas tem essa exceção técnica. Não há evidência de incidente em produção ou perda de dados no servidor.

### Causa Raiz Comprovada

- `src/helpers/clearAuthOtpCache.ts:L8-11`: o parâmetro padrão só substitui argumento omitido ou `undefined`; uma string vazia explícita é aceita sem validação. Antes de selecionar qualquer chave, o helper já remove `${cacheKeyPrefix}session`, que vira a chave genérica `session` com prefixo vazio.
- `src/helpers/clearAuthOtpCache.ts:L12-21`: telefone ausente ou vazio conduz ao ramo de varredura. Em `L19`, `key.startsWith('')` é verdadeiro para qualquer chave não vazia; `L21` remove todas as chaves coletadas. O `try/catch` não impede esse efeito: os argumentos são válidos e nenhuma exceção precisa ocorrer.
- Com telefone informado, a varredura não ocorre, mas o prefixo vazio ainda permite remover `session` e a chave numérica genérica do telefone (`L11-14`). A barreira deve anteceder **toda** remoção, não apenas o `startsWith`.
- `src/index.ts:L34-38` e `package.json:L8-12`: o helper é exportado pela entrada pública da biblioteca. O problema não depende de acesso a método interno de componente.
- `tests/components/MaxAuthCard.test.ts:L539-553`: a cobertura existente verifica somente o prefixo válido `max_auth_otp_`, sem sentinelas externas; não detecta o argumento vazio nem a perda de chaves alheias.

### Fluxo causal e rastreamento reverso

1. **Origem dos dados persistidos:** `src/components/MaxAuthCard.vue:L298-317` aceita `cacheKeyPrefix` como string, com padrão `max_auth_otp_`. `L424-437` grava sessão e cooldown em `${prefixo}session` e `${prefixo}${telefoneSemFormatação}`. `L440-448` lê essas mesmas chaves para restaurar a sessão.
2. **Entrada da limpeza pela UI:** `src/components/MaxAuthCard.vue:L551-557` passa diretamente `props.cacheKeyPrefix` e `phone.value` ao helper. O callback é entregue ao consumidor pelo evento OTP `submit` em `L559-568`, pelo submit de senha em `L626-636`, e pelos métodos públicos `clearCache`/`resetSession` em `L677-681`. No modo senha, o telefone pode continuar vazio, expondo o ramo de varredura caso o prefixo seja configurado como vazio.
3. **Entrada pública independente:** consumidor → export de `src/index.ts:L37` → `clearAuthOtpCache('', undefined)` → remoção de `session` → seleção universal de chaves não vazias → `localStorage.removeItem`.
4. **Rastreamento reverso do dano:** chave alheia removida ← lista em `L16-21` ← comparação com prefixo vazio em `L19` ← argumento público ou prop repassada sem validação. A persistência afetada é o armazenamento local da origem, não uma base de dados da biblioteca.
5. **Store ⇄ API/Rotas ⇄ Controller/Service ⇄ DB:** essas camadas não participam da limpeza. O caminho observado é UI/consumidor ⇄ helper ⇄ localStorage. O componente emite eventos para integração externa; nenhuma rota, controller ou banco consumidor pode ser inferido deste repositório.

### Evidência dinâmica e limitação desta análise

Foi tentada uma reprodução descartável em memória com Happy DOM, lendo o helper original e sem alterar arquivos. O comando foi **bloqueado antes da execução** pelo CC Safety Net: `Access to a sensitive path is not allowed`, regra `secret.ext-pattern.key`, segmento `localStorage.key`. Não houve nova tentativa nem contorno do bloqueio. Portanto, a confirmação desta etapa é estática, baseada nas linhas exatas e na semântica de `startsWith('')`; não se alega reprodução em runtime ou teste aprovado. A reprodução automatizada abaixo fica prevista para a implementação em ambiente autorizado.

## Arquivos afetados

| Arquivo | Alteração planejada |
| --- | --- |
| `src/helpers/clearAuthOtpCache.ts` | Adicionar barreira para prefixo vazio/em branco antes de qualquer acesso ao storage e documentar o contrato seguro no JSDoc. |
| `tests/helpers/clearAuthOtpCache.test.ts` | Criar suíte isolada para limite destrutivo, prefixos válidos e compatibilidade. |
| `tests/components/MaxAuthCard.test.ts` | Ampliar integração dos callbacks/métodos de limpeza com sentinelas e prefixo vazio, preservando os testes existentes. |
| `docs/issues/89/plan.md` | Registrar este planejamento; único arquivo preenchido nesta etapa. |

`src/components/MaxAuthCard.vue`, `src/index.ts`, manifests, lockfile e configurações de testes são referências de análise, sem alteração prevista. A correção deve ser centralizada no helper público, sem duplicar regras nos chamadores.

## Execuções propostas

1. Trabalhar exclusivamente na worktree pré-alocada, preservando alterações existentes. Não trocar branch, criar worktree adicional, commitar, publicar ou integrar sem solicitação específica. `.gitignore:L68-69` já inclui as pastas de worktrees.
2. Escrever os testes de regressão e de compatibilidade descritos abaixo, usando import direto do helper, storage descartável e limpeza de mocks/estado entre casos. Nenhum teste deve acessar armazenamento de navegador pessoal.
3. Adicionar uma guarda de retorno antecipado para `cacheKeyPrefix.trim().length === 0`, antes da verificação/acesso ao localStorage e antes de `removeItem`. A política é **não fazer nada** para `''` ou prefixo composto somente por espaços/tabulações/quebras de linha, com ou sem telefone. Não lançar erro, não executar fallback para o namespace padrão e não limpar chaves genéricas.
4. Usar `trim()` somente na condição de validade. Não reatribuir nem normalizar prefixos não vazios: um namespace customizado com espaços nas extremidades deve continuar correspondendo literalmente às chaves já persistidas.
5. Manter assinatura, retorno `void`, parâmetro padrão `max_auth_otp_`, sanitização do telefone, remoção da sessão compartilhada para prefixos válidos, remoção seletiva por telefone e coleta de chaves antes da remoção em lote. Omitir o prefixo ou passar `undefined` deve continuar limpando o namespace padrão.
6. Atualizar o JSDoc do helper para explicitar a ausência de efeitos em prefixos vazios/em branco e a abrangência por namespace quando o telefone não for informado. Não incluir alterações de interface, dependências ou regras de autenticação.
7. Não ampliar esta correção para reestruturar todas as leituras/gravações de cache no componente, tratar getter de storage bloqueado para prefixos válidos, validar tipos fora da assinatura TypeScript ou recuperar dados já apagados. Se surgirem evidências relacionadas, registrar separadamente antes de ampliar o escopo.
8. Concluir o bloco inteiro de produção e testes antes da primeira rodada de testes/tipos/build. Validar o conjunto, diagnosticar falhas, corrigir em lote e revalidar somente os gates afetados pelas correções.

## Testes de regressão e validação em lote

### Suíte isolada do helper

- Semear `rascunho`, `token`, `preferencias`, `session`, uma chave numérica genérica (`62999999999`), chaves OTP padrão e customizadas, além da chave de nome vazio. Fotografar todos os pares chave/valor e a quantidade de entradas.
- Parametrizar prefixos `''`, `'   '` e `'\t\n'`, combinados com telefone omitido, `''` e `'(62) 99999-9999'`. Após a chamada, exigir snapshot idêntico e nenhuma chamada a `removeItem`, `clear` ou `setItem`. Instalar spies depois da preparação dos dados.
- Verificar que argumento omitido e `undefined` continuam usando `max_auth_otp_`: sem telefone, remover somente esse namespace; preservar todas as sentinelas externas e o namespace customizado.
- Para prefixo válido e telefone formatado, remover apenas sessão e telefone sanitizado do namespace; preservar outro telefone, namespace concorrente e todas as sentinelas.
- Para prefixo customizado válido, sem telefone ou com `''`, remover todo e somente o namespace literal. Usar várias chaves para detectar saltos de enumeração durante remoção.
- Cobrir prefixo válido com espaços nas extremidades, mantendo correspondência literal; prefixos apenas semelhantes não podem ser removidos.
- Preservar o comportamento atual para telefone não vazio sem dígitos: com prefixo válido, remover sessão, mas não executar varredura nem apagar outros telefones.
- Verificar retorno `undefined`, idempotência, ausência de `window` e tolerância a falha de `removeItem` dentro do tratamento já existente. Para prefixo inválido, verificar que nem o getter de `window.localStorage` é acessado. Restaurar globals, spies e descritores ao finalizar cada caso.

### Integração com MaxAuthCard

- Ampliar os casos de `submitPayload.clearCache()` e método exposto existentes em `tests/components/MaxAuthCard.test.ts:L479-537` para comprovar preservação de sentinelas externas, remoção OTP legítima e reset do estado visual/cooldown.
- Cobrir namespace customizado válido, garantindo coerência entre chaves escritas pelo componente e removidas pelo helper.
- Montar modo senha com `cacheKeyPrefix: ''` e telefone vazio; chamar o callback do submit e os métodos públicos `clearCache`/`resetSession`. Confirmar que `session`, rascunho, token, preferências e dados OTP existentes permanecem intactos. Esse cenário alcança o caminho destrutivo sem depender de persistência OTP com configuração inválida.
- Desmontar wrappers e restaurar temporizadores/mocks para que a ampliação não introduza vazamento entre casos.

### Rodada planejada após implementar o bloco completo

```bash
npx vitest run tests/helpers/clearAuthOtpCache.test.ts tests/components/MaxAuthCard.test.ts
npm run type-check
npm run type-check:test
npm run lint:check
```

Esses comandos são propostos, não executados nesta etapa. Em caso de bloqueio de segurança, não contornar a proteção nem declarar o gate aprovado. Falhas preexistentes devem ser distinguidas de regressões sem alterar baseline fora do escopo. `npm run verify` fica reservado ao gate completo de pré-release, quando exigido; caso escolhido para a mesma revisão, não repetir isoladamente etapas que ele já agrega. Não há mudança visual que exija uma nova campanha de navegador/benchmark nesta correção localizada.

## Banco de dados

Nenhuma. A alteração é uma proteção na limpeza de localStorage; não há schema, migration, backfill ou rota a alterar.

## Riscos de quebra e Não-Regressão

- **Severidade do defeito: alta**, pela possibilidade de apagar dados locais alheios ao OTP através de API pública. Não equivale a prova de incidência em produção, perda de DB ou indisponibilidade global.
- **Mudança intencional de contrato:** chamadas explícitas com prefixo vazio/em branco deixam de remover dados. Consumidores que utilizavam isso como limpeza global precisarão de operação própria, expressa e fora deste helper. Não conservar esse comportamento destrutivo por retrocompatibilidade.
- **OTP remanescente com configuração inválida:** a guarda não apaga sequer chaves OTP quando o namespace é inválido. Isso é deliberado; evita adivinhar propriedade de dados. A implementação não pretende validar toda a prop de cache do componente.
- **Namespaces customizados:** aplicar `trim()` ao valor usado nas chaves ou substituir o prefixo vazio pelo padrão produziria comportamento diferente do escolhido. Testes literais e snapshots precisam impedir ambas as regressões.
- **Limpeza legítima:** não regredir limpeza padrão, por telefone, por namespace ou reset de UI/cooldown. As suítes isolada e de integração cobrem esses contratos.
- **Namespaces válidos amplos:** o helper continua removendo todas as chaves de um prefixo válido sem telefone, inclusive se o consumidor escolher um prefixo demasiadamente genérico. Não introduzir restrição arbitrária a prefixos customizados nesta correção.
- **SSR/storage restrito:** manter o retorno seguro sem `window` e tratamento já existente das operações. O acesso ao getter de storage para prefixos válidos está fora desta issue; não alegar correção geral desse cenário.
- **Dados já perdidos:** a guarda é preventiva, não recupera rascunhos, tokens ou preferências removidos anteriormente.

## Validação

O comando conclusivo de regressão será:

```bash
npx vitest run tests/helpers/clearAuthOtpCache.test.ts tests/components/MaxAuthCard.test.ts
```

Critério de sucesso: todas as entradas permanecem byte a byte idênticas para prefixos inválidos, nenhuma mutação de storage é chamada nesses casos, e prefixos válidos continuam removendo exclusivamente as chaves esperadas, com callbacks e reset visual preservados. O caso central precisa exigir `localStorage.getItem('rascunho') === 'conteúdo'` após `clearAuthOtpCache('')`; a implementação atual retorna `null` pela análise causal comprovada. A suíte deve detectar a retirada da guarda protetiva. Tipos e lint devem passar na rodada em lote; o planejamento por si só não demonstra uma implementação corrigida.

## Skills Aplicáveis

- `technical-documentation-best-practices`: documentação fiel ao código, referências verificáveis e contrato público explícito; aplicada neste planejamento.
- `vitest-skill` e `javascript-testing-patterns`: suíte parametrizada, isolamento de storage, spies e restauração de estado na implementação.
- `vue-vitest-testing-best-practices`: montagem e validação dos callbacks/métodos expostos de MaxAuthCard, observando a organização real em `tests/` deste pacote.
- `vue-typescript-best-practices`: preservação dos tipos e contratos públicos sem alterar props ou eventos.
- `code-review`: revisão final do diff e dos cenários de perda de dados antes de eventual integração autorizada.

Seguir a validação em lote mandatória do `AGENTS.md`; nenhuma dessas skills autoriza subagentes, mudanças de escopo, commits ou publicação por conta deste planejamento.
