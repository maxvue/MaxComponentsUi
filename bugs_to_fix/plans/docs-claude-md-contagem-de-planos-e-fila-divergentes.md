# `CLAUDE.md` diz "34 planos", existem 35; a fila tem 36 itens e 2 sem plano

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `CLAUDE.md:21`, `migration_executor.md:113-150`, `status-primevue.migration.yaml`, `migration_plans/`
- **Domínio:** docs-qualidade-testes

## Problema

Os três artefatos de controle da migração (Sistema A) apresentam **quatro números
diferentes** para o que deveria ser o mesmo conjunto.

| Fonte | Afirmação | Valor real |
|---|---|---|
| `CLAUDE.md:21` | *"Um plano de migração autossuficiente por componente [...] **34 no total**"* | `ls migration_plans \| wc -l` → **35** |
| `migration_executor.md:113-150` | fila numerada | **36** linhas (1 a 36) |
| `status-primevue.migration.yaml` | `grep -c "^  - name:"` | **36** itens |

O YAML e a fila **estão em sincronia** entre si: a comparação dos nomes
(`comm` entre os dois conjuntos) retorna vazio nas duas direções — nenhum item existe em
um e falta no outro. Isso é bom e deve ser preservado. O problema está no `CLAUDE.md` e
na cobertura dos planos.

### Detalhamento

**1. `CLAUDE.md:21` desatualizado.** Diz 34, existem 35 arquivos em `migration_plans/`.
A afirmação *"Um plano [...] por componente"* também é falsa: a fila tem 36 componentes
para 35 planos.

**2. Dois itens da fila não têm plano.** As linhas 149-150 do `migration_executor.md`
registram isso de forma honesta:

```
| 35 | MaxButtonConfirm | baixa | *(plano ainda não escrito — dependência transitiva)* | MaxButton, v-tooltip | waiting |
| 36 | MaxIconConfirm   | baixa | *(plano ainda não escrito — dependência transitiva)* | v-tooltip | waiting |
```

Confirmado: `migration_plans/MaxButtonConfirm.md` e `migration_plans/MaxIconConfirm.md`
não existem. A anotação é transparente, mas cria uma armadilha no protocolo: o passo 5 do
`migration_executor.md:46` manda *"Abra `migration_plans/[NomeComponente].md` e execute-o
integralmente"*. Um agente que chegar ao item 35 seguindo o protocolo vai tentar abrir um
arquivo inexistente. Não há instrução de fallback para esse caso.

**3. Discrepância de 35 planos para 34 componentes com plano.** Como 36 itens menos 2 sem
plano dá 34 componentes cobertos, mas há 35 arquivos em `migration_plans/`, existe **um
plano a mais** do que componentes na fila que o referenciam. Vale identificar qual é —
pode ser um plano órfão de um componente removido da fila, ou um arquivo auxiliar. Não
foi possível determinar sem inspeção item a item.

**4. Dependência não modelada.** Os itens 35 e 36 dependem de `v-tooltip`, que **não é um
item da fila** — é uma diretiva (`src/directives/tooltip.ts`). A coluna "Depende de"
referencia algo que o próprio processo não rastreia, então a checagem de pré-requisitos
do passo 3 (`migration_executor.md:40-42`, *"Todos os componentes listados como
dependência devem estar `done`"*) é impossível de executar para esses dois itens.

Observação: a migração do `v-tooltip` **existe**, mas no outro sistema de controle
(`prime_vue_migration/status.yaml`, item 5), cujo git log mostra
`f61277c1 refactor(vTooltip): diretiva v-tooltip sem PrimeVue`. Isso reforça o problema
registrado em `bugs_to_fix/plans/docs-dois-sistemas-de-migracao-concorrentes.md`.

## Impacto

- **Protocolo trava nos dois últimos itens.** Um agente executor seguindo o
  `migration_executor.md` literalmente falha ao chegar no item 35, sem instrução de como
  proceder.
- **Pré-requisito não verificável.** A dependência `v-tooltip` não pode ser conferida
  dentro do Sistema A, quebrando o passo 3 do protocolo.
- **`CLAUDE.md` desatualizado corrói a confiança nas instruções.** É o arquivo que todo
  agente lê primeiro; um número errado nele sugere que o resto também pode estar defasado.
- **Plano órfão não identificado** consome atenção de quem tentar auditar a cobertura.

## Plano de correção

1. **Corrigir `CLAUDE.md:21`** para o número real de planos e ajustar a redação, que hoje
   promete cobertura 1-para-1 inexistente. Sugestão: *"Um plano de migração autossuficiente
   por componente em `migration_plans/[NomeComponente].md`. Dois itens da fila
   (`MaxButtonConfirm`, `MaxIconConfirm`) são dependências transitivas e não têm plano
   próprio — ver a fila do `migration_executor.md`."* Preferir descrever a regra a fixar
   um número que volta a envelhecer.
2. **Identificar o plano órfão:** cruzar os 35 arquivos de `migration_plans/` com os 36
   nomes da fila e localizar o arquivo que nenhum item referencia. Decidir se ele deve
   entrar na fila ou ser arquivado.
3. **Resolver os itens 35 e 36.** Duas opções:
   - *(a)* escrever os dois planos, ainda que curtos — bastando descrever a revalidação
     pós-`MaxButton`/`v-tooltip`, que é o que `status-primevue.migration.yaml:242-258`
     já detalha em prosa;
   - *(b)* adicionar ao protocolo do `migration_executor.md` (passo 5) uma instrução
     explícita de fallback para itens marcados *"plano ainda não escrito"*, dizendo o que
     fazer (ex.: usar a `description_migration` do YAML como plano).
   A opção (a) é preferível por manter o protocolo uniforme.
4. **Modelar o `v-tooltip` explicitamente.** Adicioná-lo como item da fila do Sistema A
   (com seu próprio status), ou — se a migração já foi feita no outro sistema —
   registrar seu estado real e marcar a dependência como satisfeita, com referência ao
   commit `f61277c1`. Sem isso, os itens 35 e 36 ficam permanentemente bloqueados por uma
   dependência não rastreável.
5. **Adicionar checagem automatizada de consistência** entre os três artefatos (contagem
   e nomes de `status-primevue.migration.yaml`, da fila do `migration_executor.md` e dos
   arquivos de `migration_plans/`). O YAML e a fila já estão sincronizados; um script
   barato preserva esse estado.

## Verificação

- `ls migration_plans/*.md | wc -l` bate com o número (ou a regra) declarada no `CLAUDE.md`.
- Todo item da fila do `migration_executor.md` aponta para um arquivo de plano que existe:
  ```bash
  grep -oE 'migration_plans/[A-Za-z]+\.md' migration_executor.md | sort -u \
    | while read p; do [ -f "$p" ] || echo "AUSENTE: $p"; done
  ```
  não retorna nada.
- Nenhum arquivo em `migration_plans/` deixa de ser referenciado pela fila.
- Os nomes em `status-primevue.migration.yaml` e na fila continuam idênticos (`comm`
  vazio nas duas direções) — estado atual, a ser preservado.
- Toda dependência citada na coluna "Depende de" corresponde a um item rastreável da fila.
