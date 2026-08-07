# AGENTE EXECUTOR — TRILHA "IN USE" (componentes usados nos projetos)

> **Como usar:** abra uma sessão nova do Claude Code na raiz do repositório e diga:
> *"Leia `prime_vue_migration/execute_in_use.md` e execute."*

Você é o **agente executor** da trilha **in_use** da migração que remove a dependência
do PrimeVue da biblioteca `@maxvue/max-components-ui`.

Esta trilha cobre os componentes que **são efetivamente usados** nos projetos dentro de
`~/GitHub`. Como qualquer regressão aqui quebra aplicação em produção, o modo de execução
é **um item por vez, com PARADA para teste manual do usuário entre os itens**.

Fonte de verdade do progresso: [`status_in_use.yaml`](status_in_use.yaml).

**Esta é a 2ª de três trilhas:**

```
1. execute_primitive.md   (primitivas base — roda primeiro, sozinha)
        |
        +--> 2. execute_in_use.md   <-- VOCÊ ESTÁ AQUI
        +--> 3. execute_no_use.md   (lote contínuo, sem pausas)
                 As duas podem rodar EM PARALELO, cada uma no seu worktree.
```

> **A outra trilha paralela:** os componentes sem consumidor conhecido são migrados em
> lote por [`execute_no_use.md`](execute_no_use.md) /
> [`status_no_use.yaml`](status_no_use.yaml). Aquela trilha pode **transferir** um item
> para cá se descobrir que ele afinal é usado (ver §7 de lá). Um item que chega por
> transferência entra nesta fila obedecendo o `id`.

### ⚠️ Pré-requisito: a trilha `primitive` precisa estar concluída e integrada

As primitivas base (ids 1–5) **não estão mais nesta fila** — foram para
[`status_primitive.yaml`](status_primitive.yaml). Vários itens daqui têm
`depende_de: [1]`, `[2]` etc., e esses ids se referem aos itens **daquela** trilha.

Confirme antes do primeiro item:

```bash
grep -E "^  (- id|    execucao|    verificacao):" status_primitive.yaml
```

Se as primitivas não estiverem `Concluído`/`Concluído` e integradas na branch base,
**pare e informe o usuário** — não as implemente aqui.

---

## 0. Setup obrigatório (uma única vez, no início da sessão)

Conforme o [`CLAUDE.md`](../CLAUDE.md), **nenhuma alteração de código pode ocorrer no
working tree principal**. Antes de qualquer edição:

```bash
git worktree add ../MaxComponentsUi-wt-primevue-in-use -b primevue-in-use
cd ../MaxComponentsUi-wt-primevue-in-use
npm install
npm run test   # baseline: anote quantos testes passam ANTES de começar
```

Todo o trabalho acontece **dentro do worktree**. O `status_in_use.yaml` que você atualiza
é o do worktree (versionado junto com o código, então o progresso fica no commit).

**Registre o baseline** em `meta.baseline_testes` — se um teste já falhava antes de você
começar, ele não é culpa sua e não bloqueia a migração.

> Se a trilha `no_use` for rodar em paralelo, ela usa um worktree **próprio e separado**.
> Duas trilhas nunca compartilham worktree.

---

## 1. O loop principal

Repita até não sobrar item pendente:

```
1. Leia prime_vue_migration/status_in_use.yaml
2. Selecione o PRÓXIMO item (regra na seção 2)
3. Se não houver item pendente -> vá para a seção 8 (Encerramento)
4. PROCURE solução já existente no projeto (seção 4.2)  <-- fazer SEMPRE
5. Execute o item conforme a máquina de estados (seção 3)
6. Verifique com subagente (seção 5)
7. PARE e peça o teste manual do usuário (seção 6)  <-- exclusivo desta trilha
8. Faça commit (seção 7)
9. Volte ao passo 1
```

**Nunca** processe dois itens em paralelo. **Nunca** reordene a fila. **Nunca** pule um
item porque parece difícil — se estiver travado, marque-o como bloqueado (§5) e siga.

**Nunca** siga para o próximo item sem o aval do usuário no item atual. Esta é a
diferença essencial entre esta trilha e a `no_use`.

---

## 2. Seleção do próximo item

Percorra a lista `itens` **na ordem em que aparecem no arquivo** e pegue o **primeiro** que:

- tenha `execucao`, `verificacao` **ou** `teste_usuario` diferente de
  `Concluído`/`Aprovado`; **e**
- tenha **todos** os ids listados em `depende_de` com `execucao: Concluído`,
  `verificacao: Concluído` **e** `teste_usuario: Aprovado`.

Se um item estiver pendente mas com dependências não satisfeitas, **pule-o** e continue
procurando — ele será pego numa iteração futura. (Isso não é reordenar: a ordem da fila é
preservada, apenas respeitando o grafo de dependências.)

> **A ordem do arquivo não é estritamente crescente por `id`, e isso é proposital:** o id
> 37 (`install-plugin`) aparece **depois** do 38, porque depende dele. Siga a ordem do
> arquivo, não o número.

### Itens que migram juntos (conjuntos indivisíveis)

Alguns itens **devem** ser executados na mesma passada, porque se referenciam mutuamente
e deixá-los em estados diferentes quebra o build:

| Conjunto | ids |
|---|---|
| Cartão de crédito | 13, 14, 15 |
| Coordenadas | 11, 12 |
| Tabela | 33, 34 |

Ao pegar o primeiro id de um conjunto, execute **todos** os ids do conjunto antes de
verificar, faça **um único** teste manual para o conjunto, e marque todos juntos.

### Ordem de risco (informativa)

Os itens de maior alcance — e portanto de teste manual mais rigoroso — são:
`MaxButton` (215 arquivos), `MaxInputText` (136), `MaxInputSelect` (68) e toda a
Fase 5 (impacto global). O `vTooltip` (83 arquivos com `v-tooltip`) está na trilha
`primitive`.

### Decisão já tomada sobre o `ConfirmDialog` (id 36)

**O `ConfirmDialog` NÃO será reimplementado.** Já existe alternativa funcional e
PrimeVue-free no projeto: `MaxIconConfirm.vue`, apoiado em `src/stores/useConfirm.Store.ts`.
Não gaste esforço criando um substituto.

> ⚠️ **Mas a troca não é só na lib.** O consumidor
> `AgenteDeBolso/resources/Vue/Pages/ReportsPage.vue` importa **duas** coisas do PrimeVue:
> o `ConfirmDialog` (linha 148, via o barrel `/prime`) **e** o composable
> `useConfirm` de `primevue/useconfirm` (linha ~151). O `MaxIconConfirm` usa o
> `useConfirmStore` próprio da lib, com API diferente — então a substituição exige
> ajustar a **página consumidora**, não apenas remover o re-export.
> O mesmo padrão aparece em `CategoriesPage.vue` e `BudgetPage.vue` do AgenteDeBolso.
>
> Esse ajuste é **no repositório do AgenteDeBolso, fora do escopo desta migração**:
> reporte ao usuário no encerramento; não edite outro repositório por conta própria.

---

## 3. Máquina de estados por item

### 3.1 `execucao: Realizando`
A sessão anterior morreu no meio. **Não recomece do zero.**
1. Rode `git status` e `git diff` para ver o que já foi alterado.
2. Leia o campo `notas` do item — a sessão anterior deve ter deixado o ponto de parada.
3. Continue a partir daí, seguindo o processo da seção 4.

### 3.2 `execucao: Aguardando`
1. Mude `execucao` para `Realizando` e **salve o status_in_use.yaml imediatamente**
   (antes de tocar em qualquer código — assim, se a sessão cair, o estado é honesto).
2. Execute o processo da seção 4.

### 3.3 `execucao: Concluído` → olhe `verificacao`

- **`verificacao: Realizando`** → a verificação anterior foi interrompida.
  **Reinicie a verificação do zero** (dispare um subagente novo, §5).
- **`verificacao: Aguardando`** → mude para `Realizando`, salve, e dispare a
  verificação (§5).
- **`verificacao: Concluído`** → olhe `teste_usuario`:
  - **`Aguardando`** → vá para a §6 (pare e peça o teste).
  - **`Reprovado`** → o usuário achou problema. Volte `execucao` para `Realizando`,
    registre o relato dele em `notas` e corrija.
  - **`Aprovado`** → o item está pronto. Commit e próximo item.

---

## 4. Processo de execução de um item

### 4.1 Ler o plano
Abra o arquivo indicado em `plano`. Ele contém a API do PrimeVue a ser replicada, a API
atual do componente e o passo a passo. **O plano é um guia, não uma camisa de força** —
se a realidade do código divergir, siga o código e anote a divergência em `notas`.

### 4.2 🔎 Procure primeiro uma solução que já existe (obrigatório em todo item)

**Antes de escrever qualquer linha de código**, verifique se o repositório já tem uma
solução **concisa, independente do PrimeVue e funcional** que cumpre o mesmo objetivo.
Reaproveitar o que já existe é sempre preferível a criar mais uma implementação.

A biblioteca já tem várias peças PrimeVue-free que servem de base ou de referência:

| Já existe (PrimeVue-free) | Serve para |
|---|---|
| `src/components/InputBase.vue` | wrapper de todo input — label, ícones, estados |
| `src/components/MaxInputSwitch.vue` | toggle/switch completo — base do Checkbox e do Toggle |
| `src/components/MaxPopover.vue` | overlay posicionado — base possível do PopoverMenu |
| `src/components/MaxTableFields.vue` | campos de tabela — referência para o MaxTable |
| `src/components/MaxInputFileUploadBig.vue`, `...Button.vue`, `MaxInputFileProject.vue` | drag & drop — referência do MaxInputFileUpload |
| `src/components/MaxIconConfirm.vue` + `src/stores/useConfirm.Store.ts` | confirmação — **substitui o `ConfirmDialog`** |
| `src/components/base/*` (trilha primitive) | primitivas já migradas — **use-as, não recrie** |

Como procurar:

```bash
# a peça que você vai criar já existe com outro nome?
grep -rln "<conceito>" src/components/ src/composables/ src/directives/

# quais componentes JÁ estão limpos de PrimeVue (candidatos a referência)?
grep -rLn "primevue\|@primeuix" src/components/*.vue

# a lógica já existe em composable no pacote irmão?
ls ../MaxUse/src 2>/dev/null
```

Decida assim:

- **Existe algo pronto que resolve** → **reutilize**. Importe/estenda em vez de duplicar.
  Registre em `notas` o que reutilizou e por quê.
- **Existe algo parecido, mas não idêntico** → use como **referência de padrão** (markup,
  SCSS, acessibilidade), não copie e cole às cegas. Registre a decisão em `notas`.
- **Não existe nada** → implemente do zero, seguindo o plano.

Essa checagem é obrigatória e deve aparecer no seu raciocínio **antes** da implementação.

### 4.3 Conferir os consumidores reais (exclusivo desta trilha)

Antes de escrever código, **olhe como o componente é realmente usado**. O campo `uso` do
item diz em quais projetos e quantos arquivos. Abra alguns:

```bash
# troque <Aliases> pela lista de aliases do componente (ver src/components-manifest.json)
grep -rInE '<(Alias1|Alias2)[ />]' ~/GitHub/{AgenteDeBolso,engeapp,MaxAdmin,mbo,MinhaBibliaOnline,SocialMedia}/resources
```

O que você procura:
- **props realmente passadas** — inclusive as não documentadas no plano;
- **slots realmente usados**;
- **aliases realmente usados** — vários componentes só são consumidos pelo nome sem o
  prefixo `Max` (ex.: `MaxPhoneField` sempre aparece como `<InputPhone>`,
  `MaxInputToggle` como `<InputToggle>`, `MaxPdfView` como `<PdfView>`).
  Se o alias parar de funcionar, o projeto quebra mesmo com o componente correto.

Esse levantamento é o que você vai usar para escrever o roteiro de teste manual da §6.

### 4.4 Implementar o componente

Regras inegociáveis (do briefing original):

1. **A API pública do componente deve permanecer idêntica.** Props, eventos, slots e
   `v-model` que apps consumidoras já usam não podem mudar de nome, tipo ou semântica.

2. **Só as PROPS precisam ser iguais às do PrimeVue.** A equivalência com o PrimeVue se
   limita à **superfície de props** — os nomes, tipos e defaults das props que o
   componente hoje repassa via `v-bind="props"` / `v-bind="attrs"` devem continuar
   funcionando.

   **Não** há obrigação de reproduzir o resto do PrimeVue: nem a estrutura interna de
   markup, nem os nomes de classe, nem a organização de slots internos, nem os detalhes
   de implementação. Faça o markup mais simples e limpo que entregue o mesmo
   comportamento.

3. **Em caso de conflito entre a API do PrimeVue e a do componente existente, o
   componente existente PREVALECE.** Sempre.

4. 🚫 **Não use classes `.p-*`.** As classes do PrimeVue (`.p-button`, `.p-select`,
   `.p-checkbox-box`, `.p-inputtext`, …) **não devem nem precisam ser emitidas** pela
   nova implementação. Use nomes de classe próprios, semânticos e no padrão da casa
   (ex.: `max-input-main-div`, `max-select-option`).

   Ao migrar, **remova** também as regras `.p-*` dos blocos `<style>` deste repositório,
   substituindo-as pelos seletores novos — não deixe CSS órfão apontando para classes que
   ninguém mais emite. Os componentes desta trilha com mais regras `.p-*` hoje são
   `MaxTagSelect`, `MaxPhoneField`, `MaxTableColumn` e `MaxInputCheckbox`.

   > ⚠️ **Risco conhecido, que você deve reportar (não silenciar):** algumas apps
   > consumidoras estilizam essas classes por fora. Referências `.p-*` no CSS/SCSS/Vue
   > de cada projeto: `MinhaBibliaOnline` **254** (tem uma pasta inteira
   > `resources/Theme/PrimeVue/` — `Inputs.scss`, `Tooltip.scss`, `Skeletron.scss`),
   > `engeapp` **167**, `AgenteDeBolso` **63**, `SocialMedia` **2**.
   > Quando um seletor `.p-*` deixar de ser emitido, o CSS correspondente nessas apps
   > **para de aplicar** — a tela continua funcionando, mas muda de aparência.
   >
   > Isso é **esperado e aceito** nesta migração (decisão do usuário). Sua obrigação é
   > preencher o campo `classes_p_removidas` do item e **listar** essas classes no
   > relatório da §6, para que o ajuste de CSS nas apps seja feito depois com a lista em
   > mãos.

4b. 🔒 **`InputBase.vue` é intocável e obrigatório.**
   `src/components/InputBase.vue` **já é PrimeVue-free** e **não deve ser alterado por
   nenhum item desta migração**. Ele continua sendo o elemento **mais externo** de todo
   componente de input, exatamente como funciona hoje:

   ```vue
   <InputBase v-bind="props" ...>      <!-- permanece igual -->
       <!-- só o que está AQUI DENTRO muda: a primitiva PrimeVue vira implementação própria -->
   </InputBase>
   ```

   Isso vale para **todos** os inputs, sem exceção: texto, cartão de crédito, número,
   checkbox, toggle, select, autocomplete, datepicker, colorpicker, iconpicker,
   fileupload, coordenadas, CEP, CPF/CNPJ, telefone.

   O `InputBase` é quem fornece label, ícones esquerda/direita, os estados visuais
   (`done`, `error`, `caution`, `required`, `noStatus`), o modo `inLine` e a linha de
   mensagem. **Remover ou substituir esse wrapper quebra o layout e a validação visual de
   toda a biblioteca** — e é uma regressão silenciosa: o campo continua funcionando, só
   perde label, ícones e feedback.

   Se `git diff src/components/InputBase.vue` retornar qualquer coisa ao final de um
   item, isso é **reprovação automática** na verificação.
5. Siga as convenções do [`CLAUDE.md`](../CLAUDE.md): `<script setup lang="ts">`,
   indentação de 4 espaços, aspas simples, ponto e vírgula, ordem
   Template → Script → Style.
6. **Acessibilidade não é opcional.** O PrimeVue entrega `role`, `aria-*`, navegação por
   teclado e foco gerenciado de graça. Sua reimplementação deve entregar o mesmo — cada
   plano lista os requisitos ARIA específicos.

### 4.5 Escrever/atualizar o teste

- O teste vive em `tests/components/<Componente>.test.ts`.
- Se **já existir**, ele é o seu contrato de regressão: ele deve continuar passando **sem
  que você o enfraqueça**. Ajustar um seletor de `.p-inputtext` para o novo markup é
  legítimo; deletar uma asserção porque ela falhou **não é**.
- Se **não existir**, crie do zero.

Todo teste deve cobrir, no mínimo:
- renderização com props padrão;
- `v-model` nos dois sentidos (prop → view e view → `update:modelValue`);
- cada evento emitido;
- cada slot nomeado;
- estados do `InputBase` (`done`, `error`, `caution`, `required`, `disabled`) — e, para
  itens de input, que `<InputBase>` **continua sendo o wrapper mais externo**:
  ```ts
  expect(wrapper.findComponent(InputBase).exists()).toBe(true);
  expect(wrapper.element.classList).toContain('max-input-main-div');  // raiz do InputBase
  ```
- interação por teclado e atributos ARIA (para overlays, inputs e botões);
- ausência total de PrimeVue: `expect(wrapper.html()).not.toContain('p-component')`
  quando aplicável.

### 4.6 Auditar o próprio teste (anti-teste-frouxo)

Antes de declarar pronto, faça o **teste da mutação**: quebre o componente de propósito
(inverta uma condição, remova um `emit`, troque um `??` por `||`) e rode o teste. **Se o
teste continuar verde, ele é inútil** — reforce-o. Desfaça a mutação depois. Anote em
`notas` quais mutações você testou.

### 4.7 Portões de qualidade (todos obrigatórios)

```bash
npx vitest run tests/components/<Componente>.test.ts   # teste do item
npm run type-check                                     # vue-tsc
npm run lint                                           # eslint + stylelint
npm run test                                           # suíte COMPLETA (sem regressão)
```

E o portão específico da migração — o arquivo migrado não pode mais citar PrimeVue:

```bash
grep -n "primevue\|@primeuix\|@primevue" src/components/<Componente>.vue   # deve retornar VAZIO
```

E o portão anti-`.p-*` — nem no template, nem no `<style>`:

```bash
grep -n "\.p-[a-z-]\|'p-\|\"p-" src/components/<Componente>.vue   # deve retornar VAZIO
```

Antes de zerar esse grep, **anote as classes que você removeu** no campo
`classes_p_removidas` do item — é essa lista que o usuário vai usar depois para ajustar o
CSS das apps consumidoras.

E o portão do `InputBase` (para **todo item de input**):

```bash
git diff --stat src/components/InputBase.vue     # deve retornar VAZIO (arquivo intocado)
grep -n "InputBase" src/components/<Componente>.vue   # o wrapper deve continuar lá
```

**Só marque `execucao: Concluído` quando os cinco comandos acima passarem.** Cole a saída
real no seu raciocínio antes de afirmar que passou — nunca declare sucesso sem ter rodado
o comando.

### 4.8 Manutenções colaterais

- Se você **criou** um `.vue` novo em `src/components/`:
  ```bash
  npx tsx src/scripts/generateResolver.ts
  ```
- Se você criou uma **primitiva base** (`src/components/base/`), ela é interna:
  **não** a exporte em `src/index.ts` nem no manifesto do resolver.
- Se o componente era exportado com aliases em `src/index.ts`, confirme que **todos** os
  aliases continuam apontando corretamente. Nesta trilha isso é crítico: vários
  componentes só são consumidos pelo alias.

---

## 5. Verificação (subagente independente)

Quando `execucao: Concluído` e `verificacao` não estiver `Concluído`:

1. Marque `verificacao: Realizando` e salve o `status_in_use.yaml`.
2. Dispare **um subagente** com o **modelo `opus`** (via a ferramenta `Agent`,
   `subagent_type: "general-purpose"`, `model: "opus"`).
3. **Aguarde a conclusão.** Não avance enquanto a verificação não retornar.

### Prompt do subagente verificador

> Você é um **revisor adversarial** da migração que remove o PrimeVue da biblioteca
> `@maxvue/max-components-ui`. Seu trabalho é **encontrar problemas**, não aprovar.
> Você **não escreve código** — apenas lê, executa comandos e relata.
>
> **Item sob revisão:** `<componente>` em `<arquivo>`
> **Plano original:** `<caminho do plano>`
> **Teste:** `tests/components/<Componente>.test.ts`
> **Consumidores reais:** `<lista do campo `uso` do item>`
>
> Verifique, um a um:
> 1. **Zero PrimeVue:** `grep -n "primevue\|@primeuix" <arquivo>` retorna vazio?
> 2. **API preservada:** compare `git diff` da assinatura de props/emits/slots contra a
>    versão anterior. Alguma prop sumiu, mudou de tipo, de default ou de semântica?
>    Algum evento deixou de ser emitido? Algum slot ou slot-prop mudou de nome?
> 3. **Props do PrimeVue replicadas:** as props que o componente repassava ao componente
>    PrimeVue continuam funcionando na nova implementação?
>    **Atenção ao escopo:** a exigência de paridade com o PrimeVue vale **apenas para as
>    props**. Markup interno diferente, classes diferentes e estrutura diferente **não**
>    são problema — não reprove por isso.
> 4. **Sem classes `.p-*`:** `grep -n "\.p-[a-z-]\|'p-\|\"p-" <arquivo>` retorna vazio? A
>    nova implementação **não deve** emitir classes do PrimeVue, e o `<style>` não deve
>    ter regras `.p-*` órfãs. Se sobrou alguma ⇒ BLOQUEANTE.
>    Confirme também que o executor preencheu `classes_p_removidas` no item — a lista é o
>    insumo do ajuste de CSS das apps. Campo vazio quando houve remoção ⇒ MENOR.
> 4d. **Reuso investigado:** o executor registrou em `notas` que procurou solução já
>    existente no repositório antes de implementar? Existe em `src/components/` ou em
>    `src/components/base/` alguma peça PrimeVue-free que já resolvia isso e foi ignorada
>    (ex.: `MaxInputSwitch.vue` para toggle/checkbox, `MaxPopover.vue` para overlay,
>    `MaxIconConfirm.vue` para confirmação)? Duplicação evitável ⇒ MENOR (ou BLOQUEANTE
>    se for reimplementação integral de algo pronto).
> 4b. **`InputBase` (se o item for um input):** rode
>    `git diff --stat src/components/InputBase.vue` — deve estar **vazio** (o arquivo é
>    intocável). E confirme que `<InputBase>` continua sendo o elemento **mais externo**
>    do componente, com as mesmas props sendo repassadas. Perda do wrapper, das props
>    repassadas, ou qualquer alteração no `InputBase.vue` ⇒ **BLOQUEANTE**.
> 4c. **Aliases (exclusivo desta trilha):** o componente é consumido nos projetos por
>    aliases (ex.: `<InputPhone>`, `<InputToggle>`, `<PdfView>`). Confirme que todos os
>    aliases de `src/index.ts` e de `src/components-manifest.json` continuam resolvendo
>    para este componente. Um alias quebrado ⇒ **BLOQUEANTE**.
> 5. **Acessibilidade:** roles, `aria-*`, navegação por teclado (Tab/Setas/Enter/Esc) e
>    gestão de foco estão equivalentes ou melhores que os do PrimeVue?
> 6. **Qualidade do teste:** o teste é real ou é teatro? Aplique o teste da mutação —
>    quebre o componente de propósito e confirme que o teste **falha**. Se ele passar com
>    o componente quebrado, isso é **reprovação automática**.
> 7. **Testes enfraquecidos:** `git diff` do arquivo de teste. Alguma asserção foi
>    deletada, comentada, trocada por algo mais frouxo, ou marcada `.skip`?
> 8. **Portões:** rode `npm run type-check`, `npm run lint` e `npm run test`. Cole a
>    saída real.
>
> Responda **exatamente** neste formato:
>
> ```
> VEREDITO: APROVADO | REPROVADO
>
> EVIDÊNCIAS:
> - <comando executado> -> <resultado real>
>
> PROBLEMAS:
> - [BLOQUEANTE|MENOR] <descrição objetiva + arquivo:linha + como corrigir>
> ```
>
> Regras do veredito: **qualquer** problema BLOQUEANTE ⇒ REPROVADO. Um teste que sobrevive
> à mutação ⇒ REPROVADO. Um portão que falha ⇒ REPROVADO. Na dúvida, REPROVE — o custo de
> uma reprovação injusta é uma iteração; o de uma aprovação indevida é um bug em produção.

### Tratamento do veredito

- **APROVADO** → `verificacao: Concluído`. Vá para a §6 (teste do usuário).
- **REPROVADO** → incremente `tentativas`, volte `execucao` para `Realizando`, registre os
  problemas em `notas`, **corrija** e refaça o ciclo (execução → verificação com um
  subagente **novo**).
- **`tentativas` chegou a 3** → **pare de tentar**. Marque `notas` com
  `BLOQUEADO: <motivo + resumo das 3 tentativas>`, deixe `execucao: Realizando`, e
  **siga para o próximo item**. Ao final da sessão, reporte todos os bloqueados ao
  usuário (§8). Não fique preso num item.

---

## 6. 🛑 PARADA PARA TESTE DO USUÁRIO (o coração desta trilha)

Quando `verificacao: Concluído`, **PARE**. Não migre o próximo item.

1. Marque `teste_usuario: Aguardando` e salve o `status_in_use.yaml`.
2. Deixe o playground pronto para o usuário:
   ```bash
   npm run dev:playground
   ```
3. **Apresente ao usuário** um relatório curto e um **roteiro de teste concreto**,
   construído a partir do levantamento da §4.2:

   ```
   ITEM <id> — <Componente>  ✅ pronto para seu teste

   O QUE MUDOU
   - <primitiva PrimeVue> substituída por implementação própria
   - Reuso: <o que foi reaproveitado do projeto, ou "nada aplicável">
   - API pública: inalterada (props/eventos/slots/v-model)
   - Aliases ativos: <lista> (é assim que os projetos consomem)

   PORTÕES (saída real)
   - vitest <Componente>: <N> passando
   - type-check / lint / suíte completa: <resultado>
   - grep primevue: vazio | grep .p-*: vazio
   - subagente verificador: APROVADO

   COMO TESTAR (roteiro)
   1. <ação concreta no playground>
   2. <ação concreta — teclado: Tab/Setas/Enter/Esc>
   3. <estados do InputBase: done, error, caution, required, disabled>
   4. <onde olhar no projeto real: arquivo:linha dos consumidores>

   ONDE ISSO É USADO DE VERDADE
   - <projeto>: <N> arquivos (ex.: engeapp/resources/.../Arquivo.vue:12)

   ⚠️ CSS DAS APPS QUE PODE PRECISAR DE AJUSTE DEPOIS
   - <classe .p-* removida> era estilizada em <projeto>/<arquivo>
     (ex.: .p-checkbox-box -> MinhaBibliaOnline/resources/Theme/PrimeVue/Inputs.scss)

   Posso seguir para o próximo item? (aprovar / reprovar + o que quebrou)
   ```

4. **Aguarde a resposta do usuário.** Não prossiga por conta própria.
   - **Aprovou** → `teste_usuario: Aprovado`. Commit (§7). Próximo item.
   - **Reprovou** → `teste_usuario: Reprovado`, registre o relato em `notas`, volte
     `execucao: Realizando` e corrija. O ciclo recomeça (execução → verificação → teste).

> Se o usuário disser explicitamente algo como *"pode seguir sem me perguntar a cada
> item"*, respeite: passe a operar em modo contínuo e registre isso em
> `meta.modo_execucao`. Fora essa autorização explícita, a parada é obrigatória.

---

## 7. Commits

Um commit por item aprovado pelo usuário (ou por conjunto indivisível):

```bash
git add -A
git commit -m "refactor(<componente>): remove dependência do PrimeVue

- Substitui <primitivas> por implementação própria
- API pública e aliases preservados; testes: <N> passando
- Verificado por subagente opus: APROVADO
- Teste manual do usuário: APROVADO"
```

Commite **também** o `status_in_use.yaml` a cada mudança de estado, mesmo intermediária —
é isso que torna o processo retomável se a sessão cair.

### Recebendo um item transferido da trilha `no_use`

Se `execute_no_use.md` transferiu um item para cá (§7 daquele arquivo), ele chega com
`execucao: Aguardando` e uma nota explicando onde o uso foi encontrado. Trate-o como
qualquer outro item desta fila, respeitando o `id`.

---

## 8. Encerramento

Quando nenhum item pendente restar, rode a **auditoria final**:

```bash
# 1. Nenhuma referência a PrimeVue em src/ (o critério de saída)
#    Cobre as 3 origens: primevue, @primeuix/themes e @primevue/auto-import-resolver
grep -rn "primevue\|@primeuix\|@primevue" src/ --include='*.vue' --include='*.ts'

# 1b. Nenhuma das 3 deps no package.json
grep -n "primevue\|@primeuix" package.json

# 2. Suíte completa
npm run test

# 3. Tipos e lint
npm run type-check && npm run lint

# 4. Build real
npm run build

# 5. Playground sobe sem erro
npm run dev:playground
```

> **Atenção:** o critério de saída global (`grep` vazio em `src/`) só é atingível quando
> **as duas trilhas** estiverem concluídas. Se a trilha `no_use` ainda não terminou, o
> grep vai acusar `src/components/MaxInputIconPicker.vue` — isso é esperado, não é falha
> desta trilha. O item 37 (`install-plugin`), que desinstala as deps do `package.json`,
> **só deve ser executado quando as duas trilhas estiverem 100% concluídas**.

Depois, reporte ao usuário:
- itens concluídos / total;
- **itens BLOQUEADOS e por quê** (seja explícito — não esconda);
- itens recebidos por transferência da trilha `no_use`;
- **a lista consolidada de classes `.p-*` removidas** (união dos campos
  `classes_p_removidas`), com os arquivos das apps consumidoras que as estilizavam — é o
  insumo do ajuste de CSS posterior;
- o que foi reaproveitado do projeto em vez de reimplementado;
- resultado de cada comando da auditoria;
- o estado do id 36 (`src/prime/index.ts`) — ver a nota abaixo;
- o comando de merge sugerido — **mas não faça merge sem autorização explícita:**
  ```bash
  cd ../MaxComponentsUi && git merge primevue-in-use
  ```

---

## Princípios que valem mais que qualquer passo acima

1. **Evidência antes de afirmação.** Nunca diga "passou" sem ter colado a saída do
   comando. Se você não rodou, você não sabe.
2. **Teste que não falha quando o código quebra não é teste.**
3. **A API pública é sagrada** — e nesta trilha isso inclui os **aliases**. Esta
   biblioteca é consumida por outras apps; uma mudança silenciosa de contrato quebra
   código que você não enxerga daqui.
4. **Salve o estado antes de agir, não depois.** O `status_in_use.yaml` existe para
   sobreviver à morte da sessão.
5. **Relate fracasso honestamente.** Um item bloqueado e reportado vale mais que um item
   marcado `Concluído` na base da esperança.
6. **A parada para teste não é burocracia.** Estes componentes estão em produção em 6
   projetos; o usuário é a última barreira antes de uma regressão real.
