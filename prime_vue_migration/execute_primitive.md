# AGENTE EXECUTOR — TRILHA "PRIMITIVE" (primitivas base)

> **Como usar:** abra uma sessão nova do Claude Code na raiz do repositório e diga:
> *"Leia `prime_vue_migration/execute_primitive.md` e execute."*

Você é o **agente executor** da trilha **primitive** — a **primeira** das três trilhas da
migração que remove a dependência do PrimeVue da biblioteca `@maxvue/max-components-ui`.

Esta trilha existe para resolver um acoplamento entre as outras duas: as primitivas base
(`MaxBaseInput`, `MaxBaseOverlay`, `MaxBaseSpinner`, `MaxBaseVirtualScroller`, `vTooltip`)
são dependência tanto de componentes usados quanto de não usados. Enquanto elas viviam
dentro da trilha `in_use`, a trilha `no_use` não podia começar sem esperar por ela.

**Com esta trilha isolada, as três ficam ordenadas assim:**

```
1. execute_primitive.md   <-- VOCÊ ESTÁ AQUI (roda primeiro, sozinha)
        |
        +--> 2. execute_in_use.md   (item a item, com teste manual)
        +--> 3. execute_no_use.md   (lote contínuo, sem pausas)
                 As duas podem rodar EM PARALELO depois desta.
```

Fonte de verdade do progresso: [`status_primitive.yaml`](status_primitive.yaml).

**Modo de execução:** 🛑 **um item por vez, PARANDO para o teste manual do usuário depois
de cada um.** Estas são as peças mais críticas da migração — um defeito aqui se propaga
para toda a biblioteca, nas duas trilhas seguintes.

> **Regra número um desta trilha:** você migra **um** item, verifica, **para**, e espera o
> usuário aprovar. Só então pega o próximo. São 5 itens = 5 paradas.
> **Nunca** migre dois itens antes de uma aprovação, mesmo que o segundo pareça trivial ou
> que o primeiro tenha passado em todos os portões automáticos.

---

## 0. Setup obrigatório (uma única vez, no início da sessão)

Conforme o [`CLAUDE.md`](../CLAUDE.md), **nenhuma alteração de código pode ocorrer no
working tree principal**. Antes de qualquer edição:

```bash
git worktree add ../MaxComponentsUi-wt-primevue-primitive -b primevue-primitive
cd ../MaxComponentsUi-wt-primevue-primitive
npm install
npm run test   # baseline: anote quantos testes passam ANTES de começar
```

Registre o baseline em `meta.baseline_testes`. Um teste que já falhava antes não é culpa
sua e não bloqueia a migração.

> **Importante para as trilhas seguintes:** ao terminar, esta branch precisa ser
> integrada (merge) antes que `in_use` e `no_use` comecem — senão as duas vão recriar as
> primitivas por conta própria e gerar conflito garantido. Ver §8.

---

## 1. O loop principal

```
1. Leia prime_vue_migration/status_primitive.yaml
2. Selecione o PRÓXIMO item (ordem do arquivo, respeitando depende_de)
3. Se não houver item pendente -> vá para a seção 8 (Encerramento)
4. VERIFIQUE se já existe solução pronta no projeto (seção 2)  <-- fazer SEMPRE
5. Execute o item (seção 4)
6. Verifique com subagente (seção 5)
7. PARE e peça o teste manual do usuário (seção 6)
8. Commit (seção 7)
9. Volte ao passo 1
```

**Nunca** processe dois itens em paralelo. **Nunca** reordene a fila.

🛑 **Nunca siga para o próximo item sem o aval explícito do usuário no item atual.** O
passo 7 não é opcional e não pode ser adiado para "o fim da trilha": aprovar os 5 itens de
uma vez no final derrota o propósito da parada, que é isolar qual primitiva introduziu um
defeito antes que ele se espalhe.

Se o usuário não respondeu ainda, você **não tem** o que fazer: não comece o próximo item,
não faça trabalho adiantado. Apenas espere.

---

## 2. 🔎 Procure primeiro uma solução que já existe (obrigatório em todo item)

**Antes de escrever qualquer linha de código**, verifique se o repositório já tem uma
solução **concisa, independente do PrimeVue e funcional** que cumpre o mesmo objetivo.
Reaproveitar o que já existe é sempre preferível a criar mais uma implementação.

A biblioteca já tem várias peças PrimeVue-free que servem de base ou de referência:

| Já existe (PrimeVue-free) | Serve para |
|---|---|
| `src/components/InputBase.vue` | wrapper de todo input — label, ícones, estados |
| `src/components/MaxInputSwitch.vue` | toggle/switch completo, sem PrimeVue |
| `src/components/MaxPopover.vue` | overlay posicionado — base possível do `MaxBaseOverlay` |
| `src/components/MaxTableFields.vue` | campos de tabela |
| `src/components/MaxInputFileUploadBig.vue`, `...Button.vue`, `MaxInputFileProject.vue` | drag & drop de arquivo |
| `src/components/MaxIconConfirm.vue` + `src/stores/useConfirm.Store.ts` | confirmação (substitui o `ConfirmDialog`) |
| `@tanstack/vue-virtual` (já em `dependencies`) | virtualização — base do `MaxBaseVirtualScroller` |

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

---

## 3. Máquina de estados por item

### 3.1 `execucao: Realizando`
A sessão anterior morreu no meio. **Não recomece do zero.** Rode `git status` / `git diff`,
leia `notas` e continue de onde parou.

### 3.2 `execucao: Aguardando`
1. Mude `execucao` para `Realizando` e **salve o status_primitive.yaml imediatamente**
   (antes de tocar em código — assim, se a sessão cair, o estado é honesto).
2. Execute o processo da §4.

### 3.3 `execucao: Concluído` → olhe `verificacao`
- **`Realizando`** → verificação interrompida: reinicie do zero com um subagente novo.
- **`Aguardando`** → mude para `Realizando`, salve e dispare a verificação (§5).
- **`Concluído`** → olhe `teste_usuario`:
  - **`Aguardando`** → vá para a §6 (pare e peça o teste).
  - **`Reprovado`** → volte `execucao` para `Realizando`, registre o relato em `notas` e
    corrija.
  - **`Aprovado`** → item pronto. Commit e próximo.

---

## 4. Processo de execução de um item

### 4.1 Ler o plano
Abra o arquivo indicado em `plano`. **O plano é um guia, não uma camisa de força** — se a
realidade do código divergir, siga o código e anote a divergência em `notas`.

### 4.2 Implementar

Regras inegociáveis:

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
   ninguém mais emite.

   > ⚠️ **Risco conhecido, que você deve reportar (não silenciar):** algumas apps
   > consumidoras estilizam essas classes por fora. O caso mais forte é o
   > `MinhaBibliaOnline`, que tem uma pasta inteira `resources/Theme/PrimeVue/`
   > (`Inputs.scss`, `Tooltip.scss`, `Skeletron.scss`, …) mirando `.p-checkbox-box`,
   > `.p-tooltip`, `.p-button`. O `engeapp` e o `AgenteDeBolso` também têm regras `.p-*`
   > espalhadas. Quando um seletor `.p-*` deixar de ser emitido, o CSS correspondente
   > nessas apps **para de aplicar** — a tela continua funcionando, mas muda de
   > aparência.
   >
   > Isso é **esperado e aceito** nesta migração (decisão do usuário). Sua obrigação é
   > **listar**, em `notas` e no relatório do item (§6), quais classes `.p-*` deixaram de
   > existir, para que o ajuste de CSS nas apps seja feito depois com a lista em mãos.

5. 🔒 **`InputBase.vue` é intocável.** `src/components/InputBase.vue` **já é PrimeVue-free**
   e **não deve ser alterado por nenhum item desta migração**. Ele continua sendo o
   elemento **mais externo** de todo componente de input. `git diff` com qualquer saída
   nesse arquivo ⇒ **reprovação automática**.

6. Siga as convenções do [`CLAUDE.md`](../CLAUDE.md): `<script setup lang="ts">`,
   indentação de 4 espaços, aspas simples, ponto e vírgula, ordem
   Template → Script → Style.

7. **Acessibilidade não é opcional.** O PrimeVue entrega `role`, `aria-*`, navegação por
   teclado e foco gerenciado de graça. Sua reimplementação deve entregar o mesmo — cada
   plano lista os requisitos ARIA específicos.

8. **Primitiva é interna.** O que você criar em `src/components/base/` **não** deve ser
   exportado em `src/index.ts` nem entrar no manifesto do resolver.

### 4.3 Escrever/atualizar o teste

As primitivas não têm consumidor direto: o teste automatizado é a principal rede de
proteção delas.

- O teste vive em `tests/components/<Componente>.test.ts` (ou `tests/directives/`).
- Se já existir, é seu contrato de regressão: deve continuar passando **sem ser
  enfraquecido**. Ajustar um seletor `.p-inputtext` para o novo markup é legítimo; deletar
  uma asserção porque falhou **não é**.
- Se não existir, crie do zero.

Cobertura mínima:
- renderização com props padrão;
- `v-model` nos dois sentidos (prop → view e view → `update:modelValue`);
- cada evento emitido;
- cada slot nomeado;
- interação por teclado e atributos ARIA (essencial em overlay e tooltip);
- ausência de PrimeVue: `expect(wrapper.html()).not.toContain('p-component')`.

### 4.4 Auditar o próprio teste (anti-teste-frouxo)

Faça o **teste da mutação**: quebre o componente de propósito (inverta uma condição,
remova um `emit`, troque `??` por `||`) e rode o teste. **Se continuar verde, o teste é
inútil** — reforce-o. Desfaça a mutação. Anote em `notas` quais mutações testou.

### 4.5 Portões de qualidade (todos obrigatórios)

```bash
npx vitest run tests/components/<Componente>.test.ts
npm run type-check
npm run lint
npm run test
grep -n "primevue\|@primeuix\|@primevue" src/components/base/<Componente>.vue   # VAZIO
```

E o portão anti-`.p-*` desta migração:

```bash
grep -n "\.p-[a-z-]" src/components/base/<Componente>.vue   # deve ser VAZIO
```

**Só marque `execucao: Concluído` com todos os comandos acima passando.** Cole a saída
real no seu raciocínio — nunca declare sucesso sem ter rodado.

---

## 5. Verificação (subagente independente)

1. Marque `verificacao: Realizando` e salve o `status_primitive.yaml`.
2. Dispare **um subagente** com o **modelo `opus`** (ferramenta `Agent`,
   `subagent_type: "general-purpose"`, `model: "opus"`).
3. **Aguarde a conclusão** antes de seguir.

### Prompt do subagente verificador

> Você é um **revisor adversarial** da migração que remove o PrimeVue da biblioteca
> `@maxvue/max-components-ui`. Seu trabalho é **encontrar problemas**, não aprovar. Você
> **não escreve código** — apenas lê, executa comandos e relata.
>
> **Item sob revisão:** `<componente>` em `<arquivo>`
> **Plano original:** `<caminho do plano>`
> **Teste:** `tests/components/<Componente>.test.ts`
> **Contexto:** esta é uma **primitiva base**. Todos os demais componentes da biblioteca
> vão depender dela — um defeito aqui se propaga para as duas trilhas seguintes.
>
> Verifique, um a um:
> 1. **Zero PrimeVue:** `grep -n "primevue\|@primeuix" <arquivo>` retorna vazio?
> 2. **Sem classes `.p-*`:** `grep -n "\.p-[a-z-]" <arquivo>` retorna vazio? A nova
>    implementação **não deve** emitir classes do PrimeVue. Se sobrou alguma ⇒ BLOQUEANTE.
> 3. **Reuso investigado:** o executor registrou em `notas` que procurou solução já
>    existente no repositório antes de implementar? Existe em `src/components/` alguma
>    peça PrimeVue-free que já resolvia isso e foi ignorada (ex.: `MaxPopover.vue` para
>    overlay, `MaxInputSwitch.vue` para toggle)? Duplicação evitável ⇒ MENOR (ou
>    BLOQUEANTE se for reimplementação integral de algo pronto).
> 4. **Props preservadas:** compare `git diff` da assinatura de props/emits/slots contra a
>    versão anterior. Alguma prop sumiu, mudou de tipo, de default ou de semântica? Algum
>    evento deixou de ser emitido? Algum slot ou slot-prop mudou de nome?
>    **Atenção ao escopo:** a exigência de paridade com o PrimeVue vale **apenas para as
>    props**. Markup interno diferente, classes diferentes e estrutura diferente **não**
>    são problema — não reprove por isso.
> 5. **`InputBase` intocado:** `git diff --stat src/components/InputBase.vue` deve estar
>    **vazio**. Qualquer alteração ⇒ **BLOQUEANTE**.
> 6. **Primitiva não vazou para a API pública:** ela **não** pode aparecer em
>    `src/index.ts` nem em `src/components-manifest.json`. Se apareceu ⇒ BLOQUEANTE.
> 7. **Acessibilidade:** roles, `aria-*`, navegação por teclado (Tab/Setas/Enter/Esc) e
>    gestão de foco equivalentes ou melhores que os do PrimeVue?
> 8. **Qualidade do teste:** o teste é real ou é teatro? Aplique o teste da mutação —
>    quebre o componente e confirme que o teste **falha**. Se passar com o componente
>    quebrado ⇒ **reprovação automática**.
> 9. **Testes enfraquecidos:** `git diff` do arquivo de teste. Alguma asserção deletada,
>    comentada, afrouxada ou marcada `.skip`?
> 10. **Portões:** rode `npm run type-check`, `npm run lint` e `npm run test`. Cole a
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
> Regras do veredito: **qualquer** BLOQUEANTE ⇒ REPROVADO. Teste que sobrevive à mutação
> ⇒ REPROVADO. Portão que falha ⇒ REPROVADO. Na dúvida, REPROVE — o custo de uma
> reprovação injusta é uma iteração; o de uma aprovação indevida é um bug propagado para
> toda a biblioteca.

### Tratamento do veredito

- **APROVADO** → `verificacao: Concluído`. Vá para a §6.
- **REPROVADO** → incremente `tentativas`, volte `execucao` para `Realizando`, registre os
  problemas em `notas`, corrija e refaça o ciclo com um subagente **novo**.
- **`tentativas` chegou a 3** → **pare esse item**. Marque `notas` com
  `BLOQUEADO: <motivo + resumo das 3 tentativas>`, deixe `execucao: Realizando` e
  **avise o usuário imediatamente** — diferente das outras trilhas, uma primitiva
  bloqueada **trava as duas trilhas seguintes**, então não faz sentido seguir em frente
  sem decisão dele.

---

## 6. 🛑 PARADA PARA TESTE DO USUÁRIO

Quando `verificacao: Concluído`, **PARE**.

1. Marque `teste_usuario: Aguardando` e salve o `status_primitive.yaml`.
2. Deixe o playground pronto: `npm run dev:playground`
3. Apresente ao usuário um relatório curto e um **roteiro de teste concreto**:

   ```
   ITEM <id> — <Componente>  ✅ pronto para seu teste

   O QUE MUDOU
   - <primitiva PrimeVue> substituída por implementação própria
   - Reuso: <o que foi reaproveitado do projeto, ou "nada aplicável">
   - Props: inalteradas
   - Classes .p-* removidas: <lista> (ver aviso abaixo)

   PORTÕES (saída real)
   - vitest <Componente>: <N> passando
   - type-check / lint / suíte completa: <resultado>
   - grep primevue: vazio | grep .p-*: vazio
   - subagente verificador: APROVADO

   COMO TESTAR (roteiro)
   1. <ação concreta no playground>
   2. <teclado: Tab/Setas/Enter/Esc>
   3. <estados visuais>

   ⚠️ CSS DAS APPS QUE PODE PRECISAR DE AJUSTE DEPOIS
   - <classe .p-* removida> era estilizada em <projeto>/<arquivo>

   Posso seguir para o próximo item? (aprovar / reprovar + o que quebrou)
   ```

4. **Aguarde a resposta.** Não prossiga por conta própria, não "adiante" o próximo item
   enquanto espera, não agrupe dois itens no mesmo pedido de aprovação.
   - **Aprovou** → `teste_usuario: Aprovado`. Commit (§7). Próximo item.
   - **Reprovou** → `teste_usuario: Reprovado`, registre o relato em `notas`, volte
     `execucao: Realizando` e corrija.

> 🔒 **A parada é inegociável nesta trilha.** Diferente das outras, aqui **não existe**
> modo contínuo: são apenas 5 itens, e cada um é dependência de toda a biblioteca nas
> duas trilhas seguintes. Um defeito aprovado às pressas aqui se replica em 32
> componentes e só aparece muito depois, longe da causa.
>
> Mesmo que pareça trivial ("é só um spinner SVG", "é uma troca de tag"), **pare e
> pergunte**. Se o usuário pedir para seguir sem perguntar, confirme que ele entende que
> isso vale para as primitivas — e só siga em frente se ele reafirmar.

---

## 7. Commits

```bash
git add -A
git commit -m "refactor(<componente>): primitiva base sem PrimeVue

- Substitui <primitiva> por implementação própria
- Props preservadas; classes .p-* removidas: <lista>
- Reuso: <o que foi reaproveitado>
- Verificado por subagente opus: APROVADO
- Teste manual do usuário: APROVADO"
```

Commite **também** o `status_primitive.yaml` a cada mudança de estado, mesmo intermediária.

---

## 8. Encerramento e liberação das trilhas seguintes

Quando nenhum item pendente restar:

```bash
npm run test
npm run type-check && npm run lint
npm run build
grep -rn "primevue\|@primeuix" src/components/base/ src/directives/   # deve ser VAZIO
grep -rn "\.p-[a-z-]" src/components/base/ src/directives/            # deve ser VAZIO
```

> **Atenção:** o critério de saída global (`grep -rn "primevue" src/` vazio) **não é
> atingível por esta trilha** — a maior parte dos componentes ainda não foi migrada. Não
> trate isso como falha aqui.

Depois, reporte ao usuário:
- itens concluídos / total;
- **itens BLOQUEADOS e por quê** (explicitamente — não esconda);
- **a lista consolidada de classes `.p-*` removidas**, com os arquivos das apps
  consumidoras que as estilizavam — é o insumo do ajuste de CSS posterior;
- o que foi reaproveitado do projeto em vez de reimplementado;
- resultado de cada comando da auditoria.

E então **libere explicitamente as próximas trilhas**, sugerindo o merge — **sem fazer
merge sem autorização:**

```bash
cd ../MaxComponentsUi && git merge primevue-primitive
```

> ⚠️ **`in_use` e `no_use` só podem começar depois desse merge.** Enquanto ele não
> acontecer, as duas trilhas não enxergam as primitivas e vão tentar recriá-las, gerando
> conflito. Depois do merge, elas podem rodar **em paralelo**, cada uma no seu worktree.

---

## Princípios que valem mais que qualquer passo acima

1. **Evidência antes de afirmação.** Nunca diga "passou" sem ter colado a saída do
   comando. Se você não rodou, você não sabe.
2. **Reutilizar vence reimplementar.** Antes de criar, procure — o repositório já tem
   várias peças PrimeVue-free.
3. **Paridade com o PrimeVue é só de props.** Markup e classes são seus; faça-os simples.
4. **Teste que não falha quando o código quebra não é teste** — e na primitiva ele é a
   principal rede.
5. **Salve o estado antes de agir, não depois.**
6. **Um defeito aqui não fica aqui.** Toda a biblioteca depende destas cinco peças.
