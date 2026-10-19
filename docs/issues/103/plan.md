# Plano de execução — Issue #103

## Descrição e Causa Raiz

**Veracidade: confirmada na revisão atual.** A pendência é de documentação de API pública, não uma falha demonstrada no algoritmo de validação. `isValidScheduleRule` está exportada pelo pacote, mas não tem JSDoc nem referência nominal em Markdown. O objetivo é tornar explícito o contrato existente, sem modificar assinatura, condições, coerções ou resultados.

### Causa Raiz Comprovada

- `src/helpers/scheduleRules.ts:L28-38`: a declaração `export function isValidScheduleRule(rule: any): boolean` começa em L32, imediatamente após outro helper, sem cabeçalho JSDoc. Propósito, parâmetro, retorno e critérios não estão documentados.
- `src/helpers/scheduleRules.ts:L32-69`: o contrato está exclusivamente no corpo: verificação comum de objeto/horário, quatro ramos discriminados e rejeição final de tipo desconhecido. Os limites semanais inteiros de 1 a 52 estão em L45-50; os demais campos obrigatórios estão em L36-38, L42-44 e L57-66.
- `src/index.ts:L248-255`: reexporta nominalmente o helper na entrada pública. `package.json:L8-12` encaminha a importação raiz e os tipos para `dist`; logo não se trata apenas de implementação privada.
- `src/types/specializedInputs.ts:L127-140`: define `ScheduleWeekday` e a união `ScheduleRule`, mas os tipos não explicam validação de datas, limites de inteiros nem todos os critérios de execução. A assinatura do helper retorna `boolean`, não um predicado TypeScript.
- `docs/INPUTS-DOMAIN.md:L194-200`: documenta o editor e menciona 52 semanas, quinta ocorrência e rascunhos, mas não identifica o helper nem apresenta seu contrato. A busca `rg -n -g '*.md' 'isValidScheduleRule' .`, antes da criação deste plano, não encontrou ocorrências. Referências históricas às regras/editor não eliminam a lacuna da API pública.
- `tests/helpers/scheduleRules.test.ts:L48-133`: há testes funcionais dos quatro tipos, mas sem verificação da documentação e com cobertura parcial de opcionais e entradas inválidas. `tests/index.test.ts:L157-160` já verifica a existência da exportação.

**Fluxo causal:** helper disponibilizado publicamente → regras de aceitação restritas ao código e parcialmente aos testes → consumidor precisa reconstruir campos, formatos e limites → risco de montar regras rejeitadas ou pressupor garantias que a função não oferece.

**Rastreamento reverso dos dados:** eventos `update:modelValue`/`change` em `src/components/MaxInputScheduleRules.vue:L176-183` ← filtro por `isValidScheduleRule` em L177 ← `draftRules`, inicializado/sincronizado a partir de `props.modelValue` em L132-143 e editado pelos controles em L192-255. Paralelamente, a validação alimenta `hasInvalidRules`/`effectiveError` em L155-165 e a mensagem da UI em L64-65. O helper também pode ser consumido diretamente pela entrada `src/index.ts:L248-255`.

**Store ⇄ API/Rotas ⇄ Controller/Service ⇄ DB:** não se aplica ao fluxo inspecionado. Esta biblioteca valida objetos localmente; os trechos acima não consultam store, rede ou persistência. Não presumir contrato do backend consumidor nem investigar/alterar outro repositório para corrigir esta lacuna documental.

### Contrato que a documentação deverá refletir

| Escopo | Critérios comprovados |
|---|---|
| Comum | Entrada falsy ou não objeto retorna `false`; `type` deve corresponder a um dos quatro ramos. `time` é opcional: quando diferente de `undefined`, é passado a `isValidTimeString`. Para strings, aceita `HH:mm`, de `00:00` a `23:59`. |
| `specific_dates` | `dates` deve ser array não vazio; os elementos verificados precisam ser strings aceitas por `isValidDateString`. |
| `weekly` | `weekdays` deve ser array não vazio com valores de `VALID_WEEKDAYS`; `interval_weeks` deve ser número inteiro seguro de 1 a 52, inclusive. `anchor` é opcional; quando diferente de `undefined`, deve ser string de data válida. |
| `monthly_days` | `days` deve ser array não vazio com números inteiros seguros de 1 a 31, inclusive. |
| `monthly_nth_weekday` | `nth` deve ser um dos números `1`, `2`, `3`, `4`, `5`; `weekday` deve pertencer a `VALID_WEEKDAYS`. |
| Dias da semana | `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`, em minúsculas. |
| Datas | Formato exato `AAAA-MM-DD`, com conferência por `Date.UTC` e comparação de ano/mês/dia (`src/helpers/scheduleRules.ts:L13-25`); datas impossíveis são rejeitadas. Não prometer aceitação de todos os anos de quatro dígitos: `Date.UTC` remapeia anos de `0000` a `0099`, que o round-trip atual rejeita. |
| Retorno e limites | Retorna `true` para regra aceita e `false` para regra rejeitada nas entradas usuais descritas. Não normaliza, não deduplica, não remove campos extras, não calcula próximas execuções, não valida fuso horário e não garante que uma quinta ocorrência exista em determinado mês. |

**Limites importantes:** a assinatura atual usa `any`. A regex de horário faz coerção implícita e não há proteção geral contra objetos com getters/conversões que lançam exceções; portanto não descrever o helper como validador estrito de qualquer dado desconhecido, como type guard ou como função que nunca lança. Arrays usam `every`, sem verificação de densidade. Estes detalhes não autorizam endurecer o algoritmo nesta issue. O contexto normal de consumo são objetos simples compatíveis com `ScheduleRule` e seus rascunhos.

## Arquivos afetados

Na execução futura, modificar somente:

1. `src/helpers/scheduleRules.ts`: acrescentar exclusivamente JSDoc sobre `isValidScheduleRule`, sem alterar lógica ou assinatura.
2. `docs/INPUTS-DOMAIN.md`: acrescentar subseção do helper próxima ao contrato de `MaxInputScheduleRules`.
3. `tests/helpers/scheduleRules.test.ts`: complementar a matriz funcional do contrato documentado, preservando asserções existentes.
4. `tests/helpers/scheduleRules.documentation.test.ts` (novo): verificar presença/estrutura da documentação e os cenários executáveis do guia.

`src/index.ts`, `src/types/specializedInputs.ts`, `src/components/MaxInputScheduleRules.vue`, `tests/index.test.ts`, `tests/components/MaxInputScheduleRules.test.ts`, configurações, dependências e lockfile serão apenas referências/validações, sem alteração prevista. `dist/` é saída gerada e não deve ser editada manualmente.

**Esta etapa:** somente preenchimento de `docs/issues/103/plan.md` na worktree pré-alocada. O arquivo já existia vazio; nenhum código-fonte, teste ou documentação de produto foi alterado.

## Execuções propostas

1. Trabalhar na worktree dedicada, preservando branch e alterações alheias. Reconfirmar os trechos acima caso a revisão tenha mudado antes da implementação.
2. Complementar os testes funcionais com casos parametrizados da matriz abaixo, sem substituir testes existentes nem criar novas exigências de negócio.
3. Criar o teste documental dedicado usando leitura dos arquivos e a API do TypeScript já disponível no projeto. Localizar a declaração exportada e seu JSDoc por AST, não por número de linha; exigir descrição de propósito, `@param rule`, `@returns` e `@example` não vazios. Verificar que a subseção Markdown nomeia o helper, informa a importação pública e apresenta os quatro tipos e campos. Evitar snapshots de parágrafos ou pontuação exata.
4. Inserir JSDoc em pt-BR imediatamente acima da função. Descrever validação de uma única regra, parâmetro/retorno, formatos, campos por tipo, limites inclusivos e opcionais. Usar `@remarks` para limites de responsabilidade e link relativo para a subseção Markdown, e `@example` com chamada válida e chamada inválida. Não adicionar uma promessa `@throws`/“não lança” sem respaldo no código.
5. Ampliar `docs/INPUTS-DOMAIN.md` com título próprio para `isValidScheduleRule`, assinatura real, importação de `@maxvue/max-components-ui`, tabela de critérios, sete dias válidos, exemplos dos quatro ramos e de rejeição, e limitações descritas acima. Diferenciar ausência/`undefined` de campos opcionais de valores vazios ou `null`; não confundir `time` opcional no validador com o horário padrão de `createDefaultScheduleRule`.
6. Acrescentar ao guia um bloco JSON identificado de cenários, com `rule` e `expected`, cobrindo os quatro tipos e uma rejeição semanal; o teste documental deve extrair somente esse bloco, aplicar `JSON.parse`, conferir sua estrutura e passar cada `rule` ao helper real. Reutilizar esses mesmos valores nos exemplos TypeScript do guia/JSDoc e revisar sua equivalência, sem construir interpretador de TypeScript ou usar `eval`. O import público deve ser verificado documentalmente; o teste de exportação existente comprova sua disponibilidade.
7. Encerrar todo o bloco de documentação e testes antes de iniciar os comandos de testes, tipos ou build. Validar em lote; diagnosticar falhas, corrigir o conjunto e repetir somente os gates afetados por mudanças relevantes.
8. Revisar o diff: alterações no arquivo de produção devem ser exclusivamente comentários. Confirmar que não houve mudança de assinatura, exportação, formatos, defaults, mensagens da UI ou coerções. Não publicar, commitar, integrar nem limpar a worktree pendente sem autorização.

## Testes de regressão e validação em lote

### Matriz funcional a complementar

- **Entrada/tipo:** `null`, `undefined`, valores primitivos, objeto vazio e tipo desconhecido retornam `false`.
- **Horário:** ausência e `undefined` aceitos em regra válida; `00:00`/`23:59` aceitos; string vazia, `9:30`, `24:00`, `12:60` e `null` rejeitados. Cobrir horário inválido nos quatro ramos, pois a checagem é comum.
- **Datas específicas:** array vazio/ausente, elemento não string, formato incorreto e data impossível rejeitados; data bissexta válida aceita. Preservar os testes atuais dos helpers de data/horário e caracterizar a limitação dos anos abaixo de 100 sem alterar sua regra.
- **Semanal:** limites 1/52 aceitos; 0/53, fração, string numérica, `NaN`, infinito e ausência de intervalo rejeitados. Dias vazios/desconhecidos ou fora da grafia canônica rejeitados. `anchor` ausente/`undefined` aceito; data válida aceita; `null`, número, vazio e data impossível rejeitados.
- **Dias do mês:** 1/31 aceitos; array vazio/ausente, 0/32, fração e string numérica rejeitados.
- **Enésimo dia:** 1/5 aceitos com dia canônico; 0/6, fração, string numérica e dia inválido rejeitados. Quinta ocorrência não pode ser reinterpretada como última ocorrência.
- **Não transformação:** objetos simples congelados continuam validáveis; a entrada não é modificada, campos extras e repetições ordinárias não são limpos nem rejeitados pelo helper.
- **Documentação:** o teste novo deve falhar se o JSDoc for removido, se faltarem as tags exigidas ou a referência Markdown, ou se algum cenário JSON produzir resultado diferente do declarado. Exigir os quatro tipos, ao menos uma rejeição e retorno booleano esperado; não permitir sucesso com lista de cenários vazia. A equivalência dos exemplos TypeScript com esses cenários também deve ser revisada, sem alegar que o teste executa código TypeScript extraído.
- **Integração existente:** executar a suíte do componente para preservar rascunhos e emissão, e a suíte do índice para preservar exportação pública, sem ampliar a implementação da UI.

### Lote de comandos após implementação completa

```bash
npx vitest run tests/helpers/scheduleRules.test.ts tests/helpers/scheduleRules.documentation.test.ts tests/components/MaxInputScheduleRules.test.ts tests/index.test.ts
npm run type-check:test
npx eslint src/helpers/scheduleRules.ts tests/helpers/scheduleRules.test.ts tests/helpers/scheduleRules.documentation.test.ts
npm run build
```

O build já executa a checagem de tipos de produção: não repetir `npm run type-check` sobre o mesmo conteúdo. Após o build, verificar automaticamente a preservação do JSDoc e da assinatura em `dist/helpers/scheduleRules.d.ts` usando a API do TypeScript, e a reexportação em `dist/index.d.ts`. Não requer browser/benchmark para uma correção exclusivamente documental; antes de uma eventual release, executar `npm run verify` conforme o gate canônico, sem tratar este lote focal como substituto de pré-release.

Nesta etapa de planejamento não executar testes/build nem gerar artefatos de distribuição. Não afirmar sucesso dos comandos futuros.

## Banco de dados

Nenhuma.

## Riscos de quebra e Não-Regressão

- **Documentar contrato idealizado em vez do atual:** o principal risco é prometer validação estrita de desconhecidos, sanitização, deduplicação, garantia de não lançar, type narrowing ou expansão de calendário inexistentes. Confrontar cada afirmação com `scheduleRules.ts` e a matriz funcional.
- **Mudança funcional disfarçada de documentação:** trocar `any` por `unknown`/`ScheduleRule`, inserir guardas ou exigir `time` pode afetar consumidores. Proibir essas mudanças neste escopo e revisar o diff de produção.
- **Divergência entre JSDoc, Markdown e pacote:** executar cenários JSON extraídos, revisar sua equivalência com exemplos TypeScript e conferir `.d.ts` gerado; manter a tabela detalhada no guia e referência a ela no JSDoc, sem copiar a implementação para testes.
- **Testes documentais frágeis ou inseguros:** usar AST para identificar JSDoc e um marcador explícito para o bloco JSON, não posições fixas, texto integral ou `eval`; limitar a extração aos cenários deste helper e falhar em estrutura inválida.
- **Regressão do editor/exportação:** executar testes existentes do componente e do índice. Nenhuma mudança esperada no `v-model`, nos eventos, nos rascunhos ou em paths de importação.
- **Falhas preexistentes:** registrar saída e estabelecer causalidade; não expandir para corrigir baseline, dependências ou outros helpers sem autorização.

## Validação

A correção só estará concluída quando, na mesma revisão:

1. O lote de comandos acima terminar com código zero.
2. O teste documental comprovar JSDoc completo, referência Markdown de produto e resultados reais dos cenários JSON do guia; a revisão deve confirmar sua equivalência com os exemplos TypeScript. A simples ocorrência do nome neste plano não satisfaz esse critério.
3. A matriz funcional e os testes existentes passarem, mantendo os resultados atuais.
4. A inspeção automatizada dos `.d.ts` confirmar documentação acessível aos consumidores e assinatura pública preservada como `isValidScheduleRule(rule: any): boolean`.
5. A revisão final do diff confirmar que somente comentários foram acrescentados ao helper, além das mudanças documentais e testes previstos.

## Skills Aplicáveis

- `technical-documentation-best-practices`: orientação principal para JSDoc, Markdown, exemplos executáveis e fidelidade à API pública.
- `vitest-skill`: testes parametrizados do contrato e regressão documental com o Vitest já configurado.
- `javascript-testing-patterns`: organização dos casos e fronteiras de validação, evitando asserções frágeis.
- `code-review`: revisão final da correspondência documentação/código e preservação de contratos antes de qualquer integração.

Não são necessárias skills de backend, banco, design visual ou depuração de reatividade: nenhuma dessas camadas é causa ou alvo da correção comprovada.
