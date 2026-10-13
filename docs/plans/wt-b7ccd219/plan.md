# Plano de execução — atualizar documentação de s1, s2 e variantes

## 1. Identificação e autorização

- Data: 2026-10-13.
- Projeto: MaxComponentsUi, com documentação consumidora no MaxCode.
- Worktree e branch: `wt-b7ccd219`.
- Raiz confirmada por `git rev-parse --show-toplevel`: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-b7ccd219`.
- Especificação: [spec.md](spec.md). Elaborada antes deste plano por envolver dois destinos e etapas dependentes.
- Estado inicial: `git status --short` sem alterações antes da escrita dos documentos desta sessão.

Esta sessão é exclusivamente Plan: não executar este roteiro agora. Os únicos arquivos escritos são plano, especificação e notificações nos caminhos autorizados. Em Execute, obter autorização para os documentos de produto. Não criar outra worktree nesta sessão, trocar branch, alterar a raiz, commitar, integrar ou publicar. A escolha **ambas** confirma os dois destinos documentais, mas não autoriza escrita externa nem mudança do preset.

## 2. Requisitos e preservação

**R1:** explicar `s1`, `s2` e variantes com a regra informada: `flex: 1 1 0%`, mínimo `n × 20px`, máximo padrão `n × 24px`, máximo `100%` com `full/max` e máximo `m × 20px` com sufixo numérico.

**R2:** documentar aliases com/sem hífen, exemplos completos e diferença em relação à antiga porcentagem.

**R3:** atualizar guia da biblioteca e seção identificada da documentação MaxCode, sem fingir que alterações desta branch chegam ao outro repositório.

**R4:** preservar código, testes, layouts, exportações, outras famílias UnoCSS, estrutura e assuntos não relacionados da documentação.

**R5:** declarar disponibilidade verificável e validar a documentação com evidências da revisão correta.

Usuários afetados: desenvolvedores do frontend, não usuários finais. Não há implementação de frontend; MaxComponentsUi é a fonte do preset. MaxPinia e MaxUse não precisam de novas integrações para documentação estática. Não adicionar stores/helpers ou dependências para cumprir exigências que não se aplicam ao escopo.

## 3. Evidências inspecionadas

| Local existente | Evidência | Consequência |
|---|---|---|
| `src/presetMaxUno.ts:81–83` desta worktree | Regex sem sufixo e `calc(n% - 8px)` | Código local ainda antigo; não alterá-lo neste pedido |
| `/home/johnattas/GitHub/MaxComponentsUi/src/presetMaxUno.ts:83–95` | Regra coincide com a fornecida | Confirma contrato novo na raiz, somente lida |
| `docs/THEME.md:109–141` | Seção Rules/Utilitários; `s50` usa porcentagem | Destino principal da atualização local |
| `README.md:125,167–175,256` | Export `./preset` e links para THEME | Manter navegação existente; não criar guia duplicado |
| `package.json:17–20` | Export público do preset | Não alterar imports públicos |
| `tests/preset/presetMaxUno.test.ts:157–160` | Teste da captura percentual | Evidência da revisão antiga, não objetivo de edição |
| `tests/preset/presetMaxUno.generate.test.ts` | Harness real UnoCSS/PostCSS | Recurso futuro se houver tarefa de código separada, não prova desta nova regra |
| `/home/johnattas/GitHub/MaxCode/uno.config.ts:1–5,17–20` | Consumo de MaxComponentsUi, Wind3 e Attributify | Contexto real do documento consumidor |
| MaxCode: `docs/new-max-code/etapa-08-frontend-shell-maxapp-vuerouter/specs/spec-frontend-shell-maxapp-vuerouter.md:387–401` | Seção 4.1 cita `s-100`/`s-50` sem fórmula | Destino confirmado para explicação contextual |

A pesquisa direcionada não encontrou explicação de `s1/s2` nas instruções principais ou diretórios de instruções consultados do MaxCode. Isso não comprova ausência global. Não investigar worktrees de outras sessões. Não foi verificado bundle servido, versão npm publicada ou resolução efetiva no consumidor. A grafia real do arquivo da biblioteca é `src/presetMaxUno.ts`, não `PresetMaxUno.ts`.

## 4. Solução e decisões

### Confirmadas

- Fonte do comportamento desejado: regra exata fornecida pelo usuário, também encontrada na raiz da biblioteca.
- Dois destinos: biblioteca e MaxCode, conforme resposta à pergunta de escopo.
- Sem implementação da regra; nenhuma conversão automática de layouts antigos.
- Referência principal no `docs/THEME.md` já vinculado pelo README.

### Propostas documentais executáveis

1. Substituir a linha antiga de `s50` por uma referência à subseção dedicada, sem alterar as linhas de outros utilitários.
2. Adicionar `#### Dimensionamento flexível: s1, s2 e variantes` no bloco Rules. Explicar a sintaxe, fórmulas e tabela da spec. Usar classe estática como forma canônica do exemplo.
3. Mostrar um contêiner explicitamente flex com filhos que usam `s10-full` e `s10-20`; identificar o CSS do pai como contexto separado, não efeito de `s`. Tags de abertura em linha única. Não empilhar classes em componentes internos nem inventar props `s1`.
4. Explicar que `s-50` agora representa mínimo `1000px` e máximo `1200px`, não 50%; valores antigos precisam de revisão de layout em outra tarefa, nunca substituição silenciosa.
5. Documentar casos extremos descritos na spec: zero, máximo abaixo do mínimo, sintaxes não aceitas e necessidade de espaço/pai apropriados. A regra não define `flex-wrap` nem elimina overflow por mínimos maiores que o contêiner.
6. No MaxCode, expandir o item da seção 4.1 em uma explicação curta com tabela/exemplos essenciais e referência explícita ao caminho e repositório do guia da biblioteca. Não usar `../../` atravessando repositórios nem inventar URL pública.
7. Por ser uma especificação histórica, inserir nota claramente datada sobre o contrato atual e não reescrever decisões de implementação alheias. Revisar os exemplos `s-100/s-50` relacionados: retirar ambiguidade documental, sem alterar código da aplicação ou mudar sua intenção de layout.

### Disponibilidade e bloqueios

Antes de publicar o texto como contrato corrente da revisão local, conferir se a regra nova passou a existir nela por integração conduzida pelo MaxCode/usuário. Se não, a documentação deve conter nota explícita: contrato novo confirmado na raiz em 2026-10-13; esta revisão local ainda contém a regra percentual. Essa nota não equivale a migrar o código nem certificar pacote publicado. Caso o responsável exija guia sem ressalva e código sincronizado, bloquear entrega até integração externa autorizada.

Alternativas descartadas: portar regra nesta tarefa, mexer nos testes para ocultar diferença, criar outra fonte independente de fórmulas, migrar todos os usos de `s50`, adicionar dependências e alterar diretamente o MaxCode a partir desta worktree.

## 5. Etapas e dependências

### T1 — Preflight por leitura e confirmação da revisão

1. Ler plano/spec na primeira admissão, instruções locais, estado Git e trabalho já realizado.
2. Revalidar os arquivos listados, regra efetiva e diferenças locais. Se houver edições alheias, preservar e adaptar o lote.
3. Confirmar destinos e disponibilidade. Não instalar, alterar symlinks, copiar `.env` ou executar scripts de ambiente.
4. Se qualquer validação automatizada passar a ser necessária, inspecionar scripts/prehooks e destinos de dependências/cache antes; integridade falhada bloqueia validação dependente, sem bypass.

Conclusão: evidência da revisão registrada e decisão de nota/integração explícita. Nenhuma dependência de banco, fila, cache de aplicação, storage, Axios ou Pinia nesta alteração documental.

### T2 — Atualização documental na biblioteca

Dependência: T1. Escrita prevista somente em `docs/THEME.md` durante Execute autorizado.

Implementar todo o texto, tabela, exemplos e ressalvas antes de validar o lote. Usar resultados da spec; revisar cálculos contra a regra, não contra memória. Não modificar README, código ou testes sem nova evidência e autorização. Corrigir falhas documentais em conjunto.

Conclusão: R1/R2/R4 atendidos na referência local; disponibilidade registrada. Revisão independente neste marco é recomendada, sem exigir agentes nem aprovação a cada frase.

### T3 — Handoff e atualização no MaxCode

Dependência: T2. **Etapa externa bloqueada nesta worktree.**

1. Entregar referência ao plano/spec, trecho documental e revisão local ao responsável pelo MaxCode.
2. Solicitar execução autorizada em worktree apropriada daquele repositório; não criar, escolher ou modificar essa worktree a partir desta sessão.
3. Executor do MaxCode lê suas instruções e confirma o documento-alvo e a regra da biblioteca efetivamente resolvida por sua configuração. `uno.config.ts` prova import, não versão servida.
4. Atualizar o arquivo identificado na seção 3 e revisar exemplos relacionados ao assunto. Se o consumidor usar regra antiga, registrar isso e não afirmar disponibilidade atual no frontend.
5. Registrar evidência externa e pendências. Sem autorização/acesso, estado `blocked` ou `manualPending`, próxima ação: responsável disponibilizar execução documental e revisão verificável no MaxCode.

Conclusão: documento consumidor atualizado e revisão comprovada, ou pendência explícita. Não encerrar o objetivo dos dois destinos com apenas T2.

### T4 — Revisão conjunta e entrega

Dependências: T2 e evidências de T3.

Conferir fórmulas, links, exemplos, ausência de percentuais tratados como comportamento novo, escopo do diff e nota de disponibilidade. Executar `git diff --check` no repositório em que houve edição, com código de saída observado; revisar também arquivos novos que não apareçam no diff padrão. Não rodar tipos/build/suíte para documentação pura. Se necessário por mudança de escopo autorizada, definir gates em novo plano e executar uma vez após o lote completo, corrigindo falhas agrupadas.

Registrar resultado e entregar sem commit/merge/push. Integração e limpeza ficam com o MaxCode/usuário.

## 6. Matriz de aceite

| Tarefa / requisito | Evidência exigida | Testes/verificação pertinentes | Revisão pelo risco | Manual |
|---|---|---|---|---|
| T1 / R5 | Regra lida e revisão local identificada | Comparação textual por leitura | Não confundir raiz, worktree e pacote | Responsável confirma disponibilidade se exigir publicação sem ressalva |
| T2 / R1 | Fórmulas e tabela no THEME | Calcular `s1`, `s2`, `s10`, `s10-full`, `s10-max`, `s10-20`, `s50` | Conferir multiplicadores 20/24 e flex fixo | Ler texto como desenvolvedor consumidor |
| T2 / R2 | Aliases e advertências | Conferir regex, zero, conflito de limites e nomes inválidos | Não prometer preenchimento total ou proporção | Exemplo compreensível sem depender de Attributify |
| T2/T4 / R4 | Diff restrito ao assunto | `git diff --check`; leitura do diff | Nenhuma alteração de runtime ou contratos alheios | Conferir hierarquia e links Markdown |
| T3 / R3/R5 | Diff e caminho do documento MaxCode, revisão consumida | Comparação das duas explicações | Não atravessar limite de escrita e não validar outro bundle | Aceite documental externo; pendente se não houver acesso/autorização |

Nenhum teste, tipo ou build foi executado nesta sessão Plan. Não há necessidade de teste de navegador para confirmar aritmética documental; comprovação de layout em aplicação real seria outra tarefa. Não declarar verificações futuras aprovadas.

## 7. Riscos e notificações

- **Alto impacto semântico se confundido com migração:** mesmos nomes agora geram larguras muito diferentes. Apenas documentar; não converter layouts.
- **Divergência de revisão:** a raiz possui regra nova e esta branch não; ver notificação `../../notifications/wt-b7ccd219/notifications/preset-s-divergencia-revisao.md`.
- **Limite entre repositórios:** MaxCode não é destino permitido desta sessão. Seu aceite depende de ação externa explícita.
- **Documentação alheia desatualizada:** referências ao PrimeVue foram encontradas, mas não devem ser corrigidas neste lote; ver notificação específica.
- **Recuperação:** eventual reversão deve atingir somente trechos escritos pelo executor, preservando trabalho alheio; sem comandos destrutivos automáticos. Não há migração, deploy ou dados a recuperar.

## 8. Registro e retomada em Execute

Somente durante Execute autorizado, registrar marcos e handoff em `docs/plans/wt-b7ccd219/execution-state.json`; **não criar esse arquivo em Plan**. Usar `version: 2`, SHA256 real de `plan.md`, tarefas/estados/arquivos e `verification: { revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`. Revisões são hashes reais de conteúdo factual, nunca rótulos. Definir e registrar quais conteúdos formam cada revisão.

Registrar apenas comandos realmente executados e todas as falhas. `passed` exige `exitCode: 0`; `failed` exige inteiro não zero; `pending` não aceita `exitCode`. Não inferir sucesso de eventos da ferramenta. Checks vazios, ausência de resultado vigente ou falha vigente impedem validação integral; schema version 1 não a comprova automaticamente. Registro autodeclarado não prova execução nativa nem detecta verificações omitidas. Registrar também revisões manuais e pendência externa sem substituí-las por comando inventado.

Nas retomadas, consultar trechos pertinentes, trabalho existente e checks da mesma revisão. Executar lacunas; reaproveitar verificações sem mudança relevante. Falha repetida sem progresso exige diagnóstico, não repetição. Não reabrir contrato ou escolha dos dois destinos sem evidência nova. Não é necessário delegar; se houver execução futura por pessoas/sessões distintas, manter arquivos de escrita separados e T3 dependente de T2.

## 9. Revisão final do plano

- Pedido coberto: documentação da regra fornecida nos dois destinos escolhidos.
- Contrato preservado sem implementar ou reinterpretar a regra.
- Fonte real e divergência local explicitadas; pacote servido não presumido.
- Fórmulas e casos extremos vinculados a critérios observáveis.
- Destinos existentes distinguidos dos documentos novos desta sessão.
- Parte externa condicionada à autorização; nenhum gate de runtime desnecessário.
- Nenhuma alteração fora dos caminhos autorizados em Plan; sem commit, integração ou publicação.
