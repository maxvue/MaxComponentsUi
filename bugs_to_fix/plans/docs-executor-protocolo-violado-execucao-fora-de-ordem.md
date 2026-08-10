# Protocolo do executor declara regra inviolável de ordem que o próprio registro mostra violada 3 vezes

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `migration_executor.md:75-76`, `migration_executor.md:163-167`, `migration_executor.md:115-126`
- **Domínio:** docs-qualidade-testes

## Problema

O `migration_executor.md:73-84` define uma seção **"Regras invioláveis"**, cujas duas
primeiras entradas (linhas 75-76) são:

> - **Uma etapa por invocação.** Nunca migrar dois componentes na mesma chamada.
> - **Nunca pular nem reordenar** etapas. Sempre o menor número `waiting`.

O passo 2 do protocolo (linhas 35-38) reforça:

> Encontre na [Fila de migração](#fila-de-migração) o item de **menor número** cujo status seja `waiting`.

O próprio "Registro de progresso" do mesmo arquivo (linhas 163-167) documenta que a regra
foi quebrada em **3 das 5** execuções registradas:

| Data | # | Componente | O que o registro diz |
|---|---|---|---|
| 2026-07-01 | 1 | InputBase | em ordem |
| 2026-07-02 | **12** | MaxInputSwitch | *"Executado **fora de ordem** (itens 2–11 ainda `waiting`), a pedido explícito do usuário"* |
| 2026-07-06 | **4** | MaxInputTextArea | *"Executado **fora de ordem**, a pedido explícito do usuário"* |
| 2026-08-07 | 2 | MaxInputText | em ordem |
| 2026-08-10 | 3 | MaxInputTextList | em ordem |

E o item 5 da fila (`MaxInputSearch`, linha 119) segue `waiting`, embora os itens 12 e 4
já estejam `done` — estado que o protocolo, como escrito, considera impossível.

### O problema real não é o desvio, é a contradição não resolvida

As execuções fora de ordem foram **justificadas, datadas e documentadas** — a prática de
registro é exemplar. O defeito é que o documento afirma como "inviolável" uma regra que
admite exceção por pedido do usuário, sem jamais descrever essa exceção.

Consequências concretas dessa contradição:

**1. O passo 2 trava o executor.** As linhas 36-37 dizem:

> - Se algum item anterior estiver `in_progress` ou `blocked`, **pare** e reporte — não avance.

Não há instrução para o caso real: itens anteriores `waiting` enquanto posteriores estão
`done`. Um agente literal encontra o item 5 (`MaxInputSearch`) como menor `waiting` e
prossegue — o que por acaso funciona —, mas nada no documento confirma que essa é a
leitura correta, nem o que fazer se o usuário pedir outro componente específico.

**2. A verificação de pré-requisitos fica sem cobertura.** O passo 3 (linhas 40-42) exige
que as dependências estejam `done`. Executar fora de ordem só é seguro se essa checagem
for feita — e nos dois casos registrados ela foi (ambos dependiam apenas de `InputBase`,
já `done`). Mas isso foi mérito do executor, não garantia do protocolo: não há passo que
diga "ao executar fora de ordem, valide X".

**3. Efeito colateral real já documentado.** A nota do item 12
(`migration_executor.md:164`) descreve um problema causado justamente pela ordem alterada:

> **Ajuste pós-visual:** `MaxInputToggle.vue` ainda importa o `ToggleSwitch` real do PrimeVue, cujo CSS runtime [...] usa as MESMAS classes `.p-toggleswitch*` sem `!important` [...] como esse CSS pode ser injetado depois do nosso, propriedades não sobrescritas "vazavam" para o switch novo e quebravam o layout visual

A solução adotada foi adicionar `!important` em todas as regras `.p-toggleswitch*` — um
débito técnico assumido *"enquanto ele ainda existir em outros componentes"*. É prova
concreta de que migrar fora de ordem tem custo, e de que o protocolo deveria alertar sobre
convivência de CSS entre componentes migrados e não migrados.

## Impacto

- **Regras "invioláveis" que são violadas rotineiramente perdem autoridade.** Um agente
  futuro que leia o registro pode concluir que as outras regras da mesma seção (não
  alterar API pública, manter o conjunto de tabela junto) também são negociáveis.
- **Comportamento indefinido no estado atual da fila:** o protocolo não cobre "buracos"
  (itens `waiting` antes de itens `done`), que é exatamente o estado presente.
- **Débito técnico de CSS invisível ao processo:** o problema do `.p-toggleswitch` com
  `!important` não está registrado em nenhum lugar que force sua remoção quando o
  `MaxInputToggle` (item 16) for migrado. Está só numa célula de tabela do registro.
- **Risco à regra do conjunto de tabela.** A linha 79-81 exige que
  `MaxTable`→`MaxTableColumn`→`MaxTableFields` (itens 31-33) sejam migrados em sequência
  imediata. Se a regra de ordem já é flexibilizada por pedido do usuário sem procedimento
  definido, essa restrição — que é de acoplamento técnico, não de conveniência — pode ser
  quebrada com consequências piores.

## Plano de correção

1. **Reescrever a regra das linhas 75-76** para refletir a prática real, distinguindo dois
   tipos de restrição:
   - *ordem por conveniência* (default: menor `waiting`), que **admite** desvio mediante
     pedido explícito do usuário;
   - *ordem por acoplamento técnico* (conjunto de tabela, `InputBase` antes dos inputs,
     `MaxInputSelect` antes dos dropdowns), que **não** admite desvio.
   Só a segunda deve permanecer sob o rótulo "inviolável".
2. **Adicionar um procedimento de execução fora de ordem**, exigindo antes de começar:
   (a) confirmar que todas as dependências da coluna "Depende de" estão `done`;
   (b) avaliar convivência de CSS/DOM com componentes ainda não migrados que compartilhem
   classes (a lição do `.p-toggleswitch`); (c) registrar a justificativa no log — o que
   já vem sendo feito corretamente.
3. **Cobrir o estado "com buracos" no passo 2:** explicitar que itens `done` posteriores
   não bloqueiam a fila, e que o alvo continua sendo o menor `waiting` cujas dependências
   estejam satisfeitas.
4. **Extrair o débito do `!important`** da célula do registro (linha 164) para um item
   rastreável — idealmente uma nota no plano do item 16 (`migration_plans/MaxInputToggle.md`),
   dizendo que ao migrar `MaxInputToggle` deve-se remover os `!important` de
   `MaxInputSwitch.vue`, já que a razão de existirem terá desaparecido.
5. **Adicionar ao passo 6 (verificação)** uma checagem de regressão visual/CSS quando o
   componente migrado compartilhar classes `.p-*` com componentes ainda não migrados —
   o modo de falha que já ocorreu uma vez e não foi previsto pelo protocolo.

## Verificação

- Nenhuma regra sob "Regras invioláveis" é contrariada por linhas do "Registro de
  progresso" do mesmo arquivo.
- O protocolo cobre explicitamente o estado atual da fila (itens 5-11 `waiting`, item 12
  `done`) e diz o que o executor deve fazer.
- `grep -n "!important" src/components/MaxInputSwitch.vue` está referenciado em
  `migration_plans/MaxInputToggle.md` como pendência a resolver no item 16.
- Uma execução de teste do protocolo (dry-run: ler os arquivos e decidir a próxima etapa
  sem executá-la) produz uma escolha inequívoca, sem ambiguidade sobre buracos na fila.
