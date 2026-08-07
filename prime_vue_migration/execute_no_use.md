# AGENTE EXECUTOR — TRILHA "NO USE" (componentes sem consumidor conhecido)

> **Como usar:** abra uma sessão nova do Claude Code na raiz do repositório e diga:
> *"Leia `prime_vue_migration/execute_no_use.md` e execute."*

Você é o **agente executor** da trilha **no_use** da migração que remove a dependência do
PrimeVue da biblioteca `@maxvue/max-components-ui`.

Esta trilha cobre os componentes que **não são usados** por nenhum projeto dentro de
`~/GitHub`. Como não há consumidor para quebrar, o modo de execução é **lote contínuo:
todos os itens de uma tacada, sem pausas**. Você só para no final, quando todos estiverem
finalizados.

Fonte de verdade do progresso: [`status_no_use.yaml`](status_no_use.yaml).

**Esta é a 3ª de três trilhas:**

```
1. execute_primitive.md   (primitivas base — roda primeiro, sozinha)
        |
        +--> 2. execute_in_use.md   (item a item, com teste manual)
        +--> 3. execute_no_use.md   <-- VOCÊ ESTÁ AQUI
                 As duas podem rodar EM PARALELO, cada uma no seu worktree.
```

> **A outra trilha paralela:** os componentes usados nos projetos são migrados um a um,
> com teste manual entre itens, por [`execute_in_use.md`](execute_in_use.md) /
> [`status_in_use.yaml`](status_in_use.yaml).

---

## 0. Setup obrigatório (uma única vez, no início da sessão)

Conforme o [`CLAUDE.md`](../CLAUDE.md), **nenhuma alteração de código pode ocorrer no
working tree principal**. Antes de qualquer edição:

```bash
git worktree add ../MaxComponentsUi-wt-primevue-no-use -b primevue-no-use
cd ../MaxComponentsUi-wt-primevue-no-use
npm install
npm run test   # baseline: anote quantos testes passam ANTES de começar
```

Registre o baseline em `meta.baseline_testes`. Um teste que já falhava antes não é culpa
sua e não bloqueia a migração.

### ⚠️ Pré-requisito: a trilha `primitive` precisa estar concluída e integrada

Os itens desta trilha dependem das **primitivas base**, que vivem na trilha
[`primitive`](execute_primitive.md) (ids 1, 2 e 4 de
[`status_primitive.yaml`](status_primitive.yaml)) — **não** na trilha `in_use`.

**Não comece esta trilha antes** de `MaxBaseInput`, `MaxBaseOverlay` e
`MaxBaseVirtualScroller` estarem `execucao: Concluído` / `verificacao: Concluído` lá,
**e a branch `primevue-primitive` já integrada** na base.

Verifique explicitamente antes do primeiro item:

```bash
grep -E "^  (- id|    componente|    execucao|    verificacao):" \
  ../MaxComponentsUi/prime_vue_migration/status_primitive.yaml
```

Se as primitivas ainda não estiverem prontas, **pare e informe o usuário** — não tente
implementá-las aqui. Duplicar primitiva em duas trilhas gera conflito de merge garantido.

> Depois que a trilha `primitive` estiver integrada, esta trilha e a `in_use` podem rodar
> **em paralelo**, cada uma no seu worktree. Nunca compartilhe worktree entre trilhas.

---

## 1. O loop principal (sem pausas)

```
1. Leia prime_vue_migration/status_no_use.yaml
2. Selecione o PRÓXIMO item (ordem crescente de id, respeitando depende_de)
3. Se não houver item pendente -> vá para a seção 8 (Encerramento)
4. RE-VERIFIQUE o não-uso (seção 2)  <-- exclusivo desta trilha
   4A. Se estiver em uso -> TRANSFIRA para a trilha in_use (seção 7) e volte ao passo 1
   4B. Se não estiver em uso -> siga
5. PROCURE solução já existente no projeto (seção 4.2)  <-- fazer SEMPRE
6. Execute o item (seção 4)
7. Verifique com subagente (seção 5)
8. Commit (seção 6)
9. Volte ao passo 1  — SEM parar para perguntar nada ao usuário
```

**Não peça aprovação entre itens.** O usuário pediu explicitamente uma execução em lote:
você só volta a falar com ele no encerramento (§8) — ou se for bloqueado de verdade
(pré-requisito ausente, decisão de produto pendente, 3 reprovações num item).

---

## 2. 🔍 Re-verificação de não-uso (obrigatória, antes de cada item)

O `status_no_use.yaml` foi montado a partir de um censo de **2026-08-07**. Os projetos
mudam. **Antes de migrar qualquer item, confirme que ele continua sem uso.**

### 2.1 Levante todos os aliases do componente

Este passo não é opcional — é onde a verificação ingênua erra. **A maioria dos projetos
não usa o prefixo `Max`.** Buscar só pelo nome do arquivo produz falso "não usado".

```bash
python3 - <<'PY'
import json, pathlib
COMP = 'MaxInputIconPicker'   # <-- troque pelo componente do item
m = json.loads(pathlib.Path('src/components-manifest.json').read_text())
print(sorted(a for a, c in m['aliases'].items() if c == COMP))
PY
```

Some a isso os re-exports de `src/index.ts` (ex.: `InputPhone` → `MaxPhoneField`):

```bash
grep -n "components/<Componente>.vue" src/index.ts
```

### 2.2 Busque USO REAL, não menção

Conte apenas **tag de abertura**, **tag de fechamento** ou **import ES**. Uma palavra
solta não conta: no censo original, `MaxInputIconPicker` parecia usado em 2 arquivos, mas
as ocorrências eram a classe CSS `icon-picker-drawer` — não o componente.

```bash
# ALT = aliases separados por | (ex.: 'MaxInputIconPicker|InputIconPicker|IconPicker|icon-picker')
ALT='<cole os aliases aqui>'
grep -rInE "<($ALT)[[:space:]/>]|</($ALT)>|^[[:space:]]*import[^;]*($ALT)" \
  ~/GitHub/{AgenteDeBolso,engeapp,MaxAdmin,mbo,MinhaBibliaOnline,SocialMedia}/resources
```

Regras do escopo:
- analise **apenas** os 6 projetos acima, em `resources/`;
- **ignore** diretórios de worktree (`*-wt-*`) e `node_modules` — são cópias, não
  consumidores independentes;
- `MaxComponentsUi/` (a própria biblioteca) e seu `playground/` **não contam** como
  consumidor externo.

### 2.3 Decida

- **Achou uso real (tag ou import)** → **caso A**: vá para a §7 (transferir). Não migre
  aqui.
- **Não achou nada** → **caso B**: prossiga para a §4 e migre normalmente.

Registre o comando e o resultado em `evidencia_nao_uso` do item, **mesmo quando confirmar
o não-uso**. É essa evidência que justifica ter migrado sem validação humana.

---

## 3. Máquina de estados por item

### 3.1 `execucao: Realizando`
A sessão anterior morreu no meio. **Não recomece do zero.** Rode `git status` / `git diff`,
leia `notas` e continue de onde parou.

### 3.2 `execucao: Aguardando`
1. Faça a re-verificação da §2.
2. Mude `execucao` para `Realizando` e **salve o status_no_use.yaml imediatamente**.
3. Execute o processo da §4.

### 3.3 `execucao: Concluído` → olhe `verificacao`
- **`Realizando`** → verificação interrompida: reinicie do zero com um subagente novo.
- **`Aguardando`** → mude para `Realizando`, salve e dispare a verificação (§5).
- **`Concluído`** → item pronto. Próximo.

### 3.4 `execucao: Transferido`
O item saiu desta trilha (§7). Pule-o.

---

## 4. Processo de execução de um item

### 4.1 Ler o plano
Abra o arquivo indicado em `plano`. **O plano é um guia, não uma camisa de força** — se a
realidade do código divergir, siga o código e anote a divergência em `notas`.

### 4.2 🔎 Procure primeiro uma solução que já existe (obrigatório em todo item)

**Antes de escrever qualquer linha de código**, verifique se o repositório já tem uma
solução **concisa, independente do PrimeVue e funcional** que cumpre o mesmo objetivo.
Reaproveitar o que já existe é sempre preferível a criar mais uma implementação.

| Já existe (PrimeVue-free) | Serve para |
|---|---|
| `src/components/base/*` (trilha primitive) | primitivas já migradas — **use-as, não recrie** |
| `src/components/InputBase.vue` | wrapper de todo input — label, ícones, estados |
| `src/components/MaxInputSwitch.vue` | toggle/switch completo |
| `src/components/MaxPopover.vue` | overlay posicionado |
| `src/components/MaxIconConfirm.vue` + `src/stores/useConfirm.Store.ts` | confirmação (substitui o `ConfirmDialog`) |
| `@tanstack/vue-virtual` (já em `dependencies`) | virtualização |

```bash
# a peça que você vai criar já existe com outro nome?
grep -rln "<conceito>" src/components/ src/composables/ src/directives/

# quais componentes JÁ estão limpos de PrimeVue (candidatos a referência)?
grep -rLn "primevue\|@primeuix" src/components/*.vue
```

- **Existe algo pronto que resolve** → **reutilize**; registre em `notas` o quê e por quê.
- **Existe algo parecido** → use como **referência de padrão**, sem copiar às cegas.
- **Não existe nada** → implemente do zero, seguindo o plano.

Essa checagem é obrigatória e deve aparecer no seu raciocínio **antes** da implementação.

### 4.3 Implementar o componente

Regras inegociáveis (idênticas às da outra trilha — a ausência de consumidores **não**
autoriza afrouxar o contrato; o componente é público e pode ser adotado amanhã):

1. **A API pública do componente deve permanecer idêntica.** Props, eventos, slots e
   `v-model` não podem mudar de nome, tipo ou semântica.

2. **Só as PROPS precisam ser iguais às do PrimeVue.** A equivalência se limita à
   **superfície de props** — nomes, tipos e defaults das props hoje repassadas via
   `v-bind="props"` / `v-bind="attrs"` devem continuar funcionando.

   **Não** há obrigação de reproduzir o resto do PrimeVue: nem markup interno, nem nomes
   de classe, nem organização de slots internos. Faça o markup mais simples e limpo que
   entregue o mesmo comportamento.

3. **Em caso de conflito entre a API do PrimeVue e a do componente existente, o
   componente existente PREVALECE.**

4. 🚫 **Não use classes `.p-*`.** As classes do PrimeVue **não devem nem precisam ser
   emitidas** pela nova implementação. Use nomes próprios e semânticos, no padrão da casa.
   Remova também as regras `.p-*` órfãs dos blocos `<style>` deste repositório.

   Registre as classes removidas no campo `classes_p_removidas` do item. Como esta trilha
   não tem teste manual, essa lista é a única pista que sobra para o ajuste posterior de
   CSS — sem ela, a mudança de aparência aparece sem explicação.

4b. 🔒 **`InputBase.vue` é intocável e obrigatório.**
   `src/components/InputBase.vue` **já é PrimeVue-free** e **não deve ser alterado por
   nenhum item desta migração**. Ele continua sendo o elemento **mais externo** de todo
   componente de input:

   ```vue
   <InputBase v-bind="props" ...>      <!-- permanece igual -->
       <!-- só o que está AQUI DENTRO muda -->
   </InputBase>
   ```

   Ele fornece label, ícones esquerda/direita, os estados visuais (`done`, `error`,
   `caution`, `required`, `noStatus`), o modo `inLine` e a linha de mensagem. Remover esse
   wrapper é uma **regressão silenciosa**: o campo continua funcionando, só perde label,
   ícones e feedback.

   `git diff src/components/InputBase.vue` com qualquer saída ⇒ **reprovação automática**.
5. Siga as convenções do [`CLAUDE.md`](../CLAUDE.md): `<script setup lang="ts">`,
   indentação de 4 espaços, aspas simples, ponto e vírgula, ordem
   Template → Script → Style.
6. **Acessibilidade não é opcional** — `role`, `aria-*`, navegação por teclado e foco
   gerenciado. Cada plano lista os requisitos específicos.

### 4.4 Escrever/atualizar o teste

Sem consumidores e sem teste manual, **o teste automatizado é a ÚNICA rede de proteção
desta trilha**. Ele precisa ser mais rigoroso, não menos.

- O teste vive em `tests/components/<Componente>.test.ts`.
- Se já existir, ele é seu contrato de regressão: deve continuar passando **sem ser
  enfraquecido**. Ajustar um seletor `.p-inputtext` para o novo markup é legítimo; deletar
  uma asserção porque falhou **não é**.
- Se não existir, crie do zero.

Cobertura mínima:
- renderização com props padrão;
- `v-model` nos dois sentidos;
- cada evento emitido;
- cada slot nomeado;
- estados do `InputBase` (`done`, `error`, `caution`, `required`, `disabled`) — e, para
  inputs, que `<InputBase>` continua sendo o wrapper mais externo:
  ```ts
  expect(wrapper.findComponent(InputBase).exists()).toBe(true);
  expect(wrapper.element.classList).toContain('max-input-main-div');
  ```
- interação por teclado e atributos ARIA;
- ausência de PrimeVue: `expect(wrapper.html()).not.toContain('p-component')`.

### 4.5 Auditar o próprio teste (anti-teste-frouxo)

Faça o **teste da mutação**: quebre o componente de propósito (inverta uma condição,
remova um `emit`, troque `??` por `||`) e rode o teste. **Se continuar verde, o teste é
inútil** — reforce-o. Desfaça a mutação. Anote em `notas` quais mutações você testou.

### 4.6 Portões de qualidade (todos obrigatórios)

```bash
npx vitest run tests/components/<Componente>.test.ts
npm run type-check
npm run lint
npm run test
grep -n "primevue\|@primeuix\|@primevue" src/components/<Componente>.vue   # deve ser VAZIO
grep -n "\.p-[a-z-]\|'p-\|\"p-" src/components/<Componente>.vue            # deve ser VAZIO
```

Antes de zerar o grep de `.p-*`, **anote as classes removidas** em
`classes_p_removidas` — sem teste manual nesta trilha, essa lista é o único registro que
sobra para o ajuste de CSS das apps.

E, para item de input:

```bash
git diff --stat src/components/InputBase.vue          # VAZIO
grep -n "InputBase" src/components/<Componente>.vue   # wrapper presente
```

**Só marque `execucao: Concluído` com os cinco comandos passando.** Cole a saída real no
raciocínio — nunca declare sucesso sem ter rodado.

### 4.7 Manutenções colaterais

- Criou um `.vue` novo em `src/components/`: `npx tsx src/scripts/generateResolver.ts`
- Criou primitiva base (`src/components/base/`): é interna — **não** exporte em
  `src/index.ts` nem no manifesto.
- Confirme que os aliases em `src/index.ts` continuam apontando corretamente.

---

## 5. Verificação (subagente independente)

Mesmo sem pausa para o usuário, **a verificação por subagente continua obrigatória em
todo item**. Ela é o que substitui o teste manual nesta trilha.

1. Marque `verificacao: Realizando` e salve o `status_no_use.yaml`.
2. Dispare **um subagente** com o **modelo `opus`** (ferramenta `Agent`,
   `subagent_type: "general-purpose"`, `model: "opus"`).
3. **Aguarde a conclusão** antes de seguir para o próximo item.

### Prompt do subagente verificador

> Você é um **revisor adversarial** da migração que remove o PrimeVue da biblioteca
> `@maxvue/max-components-ui`. Seu trabalho é **encontrar problemas**, não aprovar. Você
> **não escreve código** — apenas lê, executa comandos e relata.
>
> **Item sob revisão:** `<componente>` em `<arquivo>`
> **Plano original:** `<caminho do plano>`
> **Teste:** `tests/components/<Componente>.test.ts`
> **Contexto:** este componente não tem consumidores conhecidos e **não passará por teste
> manual**. O teste automatizado é a única rede de proteção — seja mais exigente com ele.
>
> Verifique, um a um:
> 1. **Zero PrimeVue:** `grep -n "primevue\|@primeuix" <arquivo>` retorna vazio?
> 2. **API preservada:** compare `git diff` da assinatura de props/emits/slots contra a
>    versão anterior. Alguma prop sumiu, mudou de tipo, de default ou de semântica? Algum
>    evento deixou de ser emitido? Algum slot ou slot-prop mudou de nome?
> 3. **Props do PrimeVue replicadas:** as props que o componente repassava ao componente
>    PrimeVue continuam funcionando?
>    **Atenção ao escopo:** a paridade com o PrimeVue vale **apenas para as props**.
>    Markup interno, classes e estrutura diferentes **não** são problema — não reprove
>    por isso.
> 4. **Sem classes `.p-*`:** `grep -n "\.p-[a-z-]\|'p-\|\"p-" <arquivo>` retorna vazio? A
>    nova implementação **não deve** emitir classes do PrimeVue, e o `<style>` não deve
>    ter regras `.p-*` órfãs. Se sobrou alguma ⇒ BLOQUEANTE. Confirme também que
>    `classes_p_removidas` foi preenchido quando houve remoção ⇒ MENOR se vazio.
> 4d. **Reuso investigado:** o executor registrou em `notas` que procurou solução já
>    existente antes de implementar? Existe em `src/components/` ou `src/components/base/`
>    peça PrimeVue-free que já resolvia isso e foi ignorada? Duplicação evitável ⇒ MENOR
>    (ou BLOQUEANTE se for reimplementação integral de algo pronto).
> 4b. **`InputBase` (se for input):** `git diff --stat src/components/InputBase.vue` deve
>    estar **vazio**, e `<InputBase>` deve continuar sendo o elemento **mais externo**,
>    com as mesmas props repassadas. Qualquer desvio ⇒ **BLOQUEANTE**.
> 4c. **Não-uso confirmado:** o executor registrou `evidencia_nao_uso` com comando e
>    resultado? Refaça a busca você mesmo, com **todos os aliases** do
>    `src/components-manifest.json`, contando apenas tag ou import. Se você encontrar uso
>    real em algum projeto, isso é **BLOQUEANTE**: o item deveria ter sido transferido
>    para a trilha `in_use`, não migrado aqui.
> 5. **Acessibilidade:** roles, `aria-*`, navegação por teclado (Tab/Setas/Enter/Esc) e
>    gestão de foco equivalentes ou melhores que os do PrimeVue?
> 6. **Qualidade do teste:** o teste é real ou é teatro? Aplique o teste da mutação —
>    quebre o componente e confirme que o teste **falha**. Se passar com o componente
>    quebrado ⇒ **reprovação automática**.
> 7. **Testes enfraquecidos:** `git diff` do arquivo de teste. Alguma asserção deletada,
>    comentada, afrouxada ou marcada `.skip`?
> 8. **Portões:** rode `npm run type-check`, `npm run lint` e `npm run test`. Cole a saída
>    real.
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
> Regras do veredito: **qualquer** BLOQUEANTE ⇒ REPROVADO. Teste que sobrevive à mutação
> ⇒ REPROVADO. Portão que falha ⇒ REPROVADO. Na dúvida, REPROVE.

### Tratamento do veredito

- **APROVADO** → `verificacao: Concluído`. Commit. **Próximo item imediatamente**, sem
  perguntar nada ao usuário.
- **REPROVADO** → incremente `tentativas`, volte `execucao` para `Realizando`, registre os
  problemas em `notas`, corrija e refaça o ciclo com um subagente **novo**.
- **`tentativas` chegou a 3** → **pare de tentar esse item**. Marque `notas` com
  `BLOQUEADO: <motivo + resumo das 3 tentativas>`, deixe `execucao: Realizando` e **siga
  para o próximo**. Reporte no encerramento (§8). Não fique preso.

---

## 6. Commits

Um commit por item aprovado:

```bash
git add -A
git commit -m "refactor(<componente>): remove dependência do PrimeVue

- Substitui <primitivas> por implementação própria
- Sem consumidores conhecidos (re-verificado em <data>)
- API pública preservada; testes: <N> passando
- Verificado por subagente opus: APROVADO"
```

Commite **também** o `status_no_use.yaml` a cada mudança de estado — é isso que torna o
processo retomável se a sessão cair.

---

## 7. Caso A — transferir um item para a trilha `in_use`

Quando a re-verificação (§2) encontrar **uso real** de um item listado aqui:

1. **Não migre o item nesta trilha.**
2. Em `status_no_use.yaml`, marque:
   ```yaml
   execucao: Transferido
   verificacao: Transferido
   notas: >-
     TRANSFERIDO para status_in_use.yaml em <data>.
     Uso encontrado: <projeto>/<caminho>:<linha> via alias <Alias>.
     Comando: <o grep exato que você rodou>
   ```
3. Em `status_in_use.yaml`, **insira o item na posição correta** — o id original é
   preservado, e a posição é a que respeita as dependências (a fila de lá não é
   estritamente crescente: o id 37 vem depois do 38 de propósito). Use:
   ```yaml
   execucao: Aguardando
   verificacao: Aguardando
   teste_usuario: Aguardando
   tentativas: 0
   uso: '<N> arquivos — <projeto>:<N> ...'
   notas: 'TRANSFERIDO da trilha no_use em <data>: uso real encontrado em <arquivo:linha>.'
   ```
   Atualize também `meta.total_itens` nos **dois** arquivos.
4. Faça um commit dedicado só dessa transferência:
   ```bash
   git add -A
   git commit -m "chore(migration): transfere <Componente> para a trilha in_use

   - Uso real encontrado em <arquivo:linha> (alias <Alias>)
   - Item passa a exigir validação manual do usuário"
   ```
5. **Continue o loop** com o próximo item. A transferência não interrompe o lote — o item
   transferido será executado pelo `execute_in_use.md`, não por você.

> Se **todos** os itens acabarem transferidos, esta trilha termina sem migrar nada. Isso é
> um resultado legítimo: significa que a biblioteca é mais consumida do que o censo
> indicava. Reporte no encerramento.

---

## 8. Encerramento (a única parada desta trilha)

Quando nenhum item pendente restar, rode a **auditoria final**:

```bash
# 1. Referências a PrimeVue nos arquivos DESTA trilha
grep -rn "primevue\|@primeuix\|@primevue" src/components/<cada componente desta trilha>.vue

# 2. Suíte completa
npm run test

# 3. Tipos e lint
npm run type-check && npm run lint

# 4. Build real
npm run build

# 5. Playground sobe sem erro
npm run dev:playground
```

> **Atenção:** o critério de saída global (`grep -rn "primevue" src/` vazio) **não é
> atingível por esta trilha sozinha** — a maior parte dos componentes vive na trilha
> `in_use`. Não trate o grep global como falha aqui. O item 37 (`install-plugin`), que
> remove `app.use(PrimeVue)` e desinstala as deps do `package.json`, pertence à trilha
> `in_use` e **só roda quando as duas trilhas estiverem concluídas**.

Depois, reporte ao usuário de uma vez só:
- itens migrados / total;
- **itens TRANSFERIDOS para a trilha `in_use`** e a evidência de uso que motivou cada um;
- **itens BLOQUEADOS e por quê** (seja explícito — não esconda);
- **a lista consolidada de classes `.p-*` removidas** (união dos campos
  `classes_p_removidas`) — insumo do ajuste de CSS das apps consumidoras;
- o que foi reaproveitado do projeto em vez de reimplementado;
- resultado de cada comando da auditoria;
- o comando de merge sugerido — **mas não faça merge sem autorização explícita:**
  ```bash
  cd ../MaxComponentsUi && git merge primevue-no-use
  ```

---

## Princípios que valem mais que qualquer passo acima

1. **Evidência antes de afirmação.** Nunca diga "passou" sem ter colado a saída do
   comando. Se você não rodou, você não sabe.
2. **"Não usado" é uma afirmação que exige prova.** Ela é o que autoriza migrar sem
   validação humana — e ela erra fácil, porque os projetos consomem a biblioteca por
   aliases sem o prefixo `Max`. Sempre busque por todos os aliases, e sempre por tag ou
   import, nunca por palavra solta.
3. **Teste que não falha quando o código quebra não é teste** — e aqui ele é a única rede.
4. **A API pública é sagrada,** mesmo sem consumidor hoje. Mas paridade com o PrimeVue é
   só de **props** — markup e classes são seus; faça-os simples e sem `.p-*`.
5. **Reutilizar vence reimplementar.** Antes de criar, procure — o repositório já tem
   várias peças PrimeVue-free.
6. **Salve o estado antes de agir, não depois.** O `status_no_use.yaml` existe para
   sobreviver à morte da sessão.
7. **Lote não significa silêncio sobre problemas.** Não pausa entre itens, mas relata
   tudo — bloqueios e transferências — no encerramento.
