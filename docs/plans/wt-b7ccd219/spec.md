# Especificação técnica — documentação da família s do preset Max

## 1. Contexto & Objetivo

- Data: 2026-10-13. Projeto: `@maxvue/max-components-ui`; consumidor: MaxCode.
- Worktree autorizada: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-b7ccd219`, branch `wt-b7ccd219`.
- Pedido: explicar o funcionamento atual de `s1`, `s2` e variantes conforme a regra fornecida pelo usuário. Decisão posterior confirmada: atualizar tanto a referência da biblioteca quanto a documentação do MaxCode.
- Público: desenvolvedores que dimensionam campos e blocos do frontend.
- Valor: deixar de interpretar o número como porcentagem e documentar limites de largura corretamente.

### Evidência e limite de disponibilidade

O contrato informado foi confirmado por leitura em `/home/johnattas/GitHub/MaxComponentsUi/src/presetMaxUno.ts:83–95`. Entretanto, **esta worktree** contém a regra anterior em `src/presetMaxUno.ts:81–83`: `flex: 1 0 calc(n% - 8px)`, sem os sufixos. `docs/THEME.md:139` e `tests/preset/presetMaxUno.test.ts:157–160` também refletem a semântica anterior. A raiz foi somente lida; não é destino autorizado de escrita. Não afirmar que a nova regra está presente nesta branch, em pacote publicado ou no bundle servido pelo MaxCode.

## 2. Escopo

### Incluído

1. Atualização futura de `docs/THEME.md`, seção de utilitários e subseção dedicada à família `s`.
2. Atualização futura, em sessão e worktree próprias autorizadas do MaxCode, de `docs/new-max-code/etapa-08-frontend-shell-maxapp-vuerouter/specs/spec-frontend-shell-maxapp-vuerouter.md`, seção 4.1 e exemplos de dimensionamento relacionados.
3. Fórmulas, aliases, tabela, exemplo estático e ressalvas de flexbox.
4. Verificação de consistência e handoff explícito entre repositórios.

### Fora de escopo

- Implementar, portar ou integrar a regra; alterar código, testes, configuração, componentes, stores ou helpers.
- Converter layouts existentes, atualizar dependências, corrigir documentação alheia ao dimensionamento `s` ou reescrever planos históricos indiscriminadamente.
- Publicar pacote, fazer commit/merge/push, trocar branch, criar worktree nesta sessão ou alterar o MaxCode fora de autorização posterior.
- Garantir a versão efetivamente consumida pelo MaxCode sem evidência de resolução e revisão.

## 3. Arquitetura & Mudanças Técnicas

Não há mudança de arquitetura executável. A fonte do contrato é a regra `/^s-?(\d+)(?:-(full|max|\d+))?$/` do preset.

### Contrato documental

- `n`: sequência de dígitos inteiros não negativos. Hífen entre `s` e `n` opcional.
- Todas as variantes retornam `flex: 1 1 0%`, `min-width: n × 20px` e `max-width` conforme o sufixo.
- Sem sufixo: `max-width: n × 24px`.
- Sufixo `full` ou `max`: `max-width: 100%`. São aliases; não impõem `width: 100%`.
- Sufixo numérico `m`: `max-width: m × 20px`, não `mpx` nem `m%`.
- Nenhuma dessas declarações inclui `!important`; a regra não define `display`, `width`, `gap` ou quebra de linha.
- O número não é porcentagem, quantidade de colunas nem peso de crescimento: todos os itens têm o mesmo fator de crescimento `1`, sujeitos a mínimos e máximos.

| Classe / alias | flex | min-width | max-width |
|---|---|---|---|
| `s1` / `s-1` | `1 1 0%` | `20px` | `24px` |
| `s2` / `s-2` | `1 1 0%` | `40px` | `48px` |
| `s10` | `1 1 0%` | `200px` | `240px` |
| `s10-full` / `s-10-full` | `1 1 0%` | `200px` | `100%` |
| `s10-max` | `1 1 0%` | `200px` | `100%` |
| `s10-20` / `s-10-20` | `1 1 0%` | `200px` | `400px` |
| `s50` / `s-50` | `1 1 0%` | `1000px` | `1200px` |

Casos extremos: `s0` produz ambos os limites em `0px`; `s0-full` mantém máximo `100%`; `s10-0` retorna mínimo `200px` e máximo `0px`. A regra não rejeita máximo menor que mínimo; no dimensionamento CSS o mínimo prevalece, não prometer que o máximo será respeitado nesse conflito. Decimais, números negativos e `Full`/`MAX` não casam essa regex. Para valores usuais, preferir `m >= n`. Não prometer precisão ilimitada para números gigantes convertidos por `Number`.

### Arquivos e fluxo

Existentes: `docs/THEME.md`, `README.md` (links já apontam para THEME; leitura, sem edição prevista), `src/presetMaxUno.ts`, os dois testes em `tests/preset/`, documentação do frontend e `uno.config.ts` do MaxCode.

Fluxo: contrato fornecido + código da raiz lido → referência completa da biblioteca → explicação contextual e referência no documento do MaxCode → revisão de consistência. Cada entrega mantém indicação da revisão que realmente contém a regra.

## 4. Plano de Execução Faseado

1. Revalidar por leitura branch, diferenças locais, regra e destinos. Resolver a diferença de revisão por integração externa autorizada, ou documentar explicitamente disponibilidade condicionada; não modificar código para desbloquear documentação.
2. Atualizar somente o assunto `s` no guia da biblioteca, incluindo a tabela e um exemplo de filhos com classes estáticas em um contêiner flex, sem confundir utilitários com props de componentes.
3. Revisar e registrar a entrega local. Preparar handoff com o conteúdo e referências necessárias à parte do MaxCode.
4. Em execução posterior autorizada no MaxCode, ler suas instruções, conferir revisão consumida e atualizar a seção 4.1. Preservar requisitos históricos de outros assuntos; exemplos antigos não devem ser reaproveitados como layout percentual atual.
5. Revisar ambos os documentos juntos e registrar o aceite ou a pendência externa sem conclusão total indevida.

## 5. Critérios de Aceite & Validação

- Fórmulas, aliases e exemplos correspondem exatamente à tabela e à regra fornecida.
- `s50` não permanece como utilitário percentual corrente no guia; diferenciação histórica pode permanecer explicitamente rotulada.
- Texto explica pai flex, limites, ausência de largura garantida para `full/max` e ausência de proporcionalidade pelo número.
- Somente documentação do escopo é alterada; código, testes e contratos das outras famílias permanecem intactos.
- MaxCode registra a regra no destino identificado e referencia o guia sem link relativo quebrado entre repositórios.
- A diferença de revisão é resolvida ou claramente registrada; atualização do MaxCode não é declarada concluída sem evidência daquele repositório.
- Verificações futuras: leitura do diff, cálculo da tabela, links e estrutura Markdown. `git diff --check` é apropriado à entrega documental. Não há script de validação Markdown identificado.
- `npm run verify`, `npm run build`, `npm run test` e `npm run lint` existem, mas não são necessários por padrão para uma mudança exclusivamente documental. Não executar gates para tentar provar um preset que não foi alterado. Se o escopo mudar para código, interromper e solicitar novo plano/autorização.
- Esta sessão realizou somente investigação e escrita dos documentos autorizados; nenhum teste ou build foi executado.
