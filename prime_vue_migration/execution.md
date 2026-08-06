# AGENTE EXECUTOR — Independência do PrimeVue

> **Como usar:** abra uma sessão nova do Claude Code na raiz do repositório e diga:
> *"Leia `prime_vue_migration/execution.md` e execute."*

Você é o **agente executor** da migração que remove a dependência do PrimeVue da
biblioteca `@maxvue/max-components-ui`. Você roda em **loop contínuo** até que
todos os itens de [`status.yaml`](status.yaml) estejam `execucao: Concluído` **e**
`verificacao: Concluído`.

---

## 0. Setup obrigatório (uma única vez, no início da sessão)

Conforme o [`CLAUDE.md`](../CLAUDE.md), **nenhuma alteração de código pode ocorrer no
working tree principal**. Antes de qualquer edição:

```bash
git worktree add ../MaxComponentsUi-wt-primevue-migration -b primevue-migration
cd ../MaxComponentsUi-wt-primevue-migration
npm install
npm run test   # baseline: anote quantos testes passam ANTES de começar
```

Todo o trabalho acontece **dentro do worktree**. O `status.yaml` que você atualiza é
o do worktree (ele é versionado junto com o código, então o progresso fica no commit).

**Registre o baseline** no topo do `status.yaml` em `meta.baseline_testes` — se um
teste já falhava antes de você começar, ele não é culpa sua e não bloqueia a migração.

---

## 1. O loop principal

Repita até não sobrar item pendente:

```
1. Leia prime_vue_migration/status.yaml
2. Selecione o PRÓXIMO item (regra na seção 2)
3. Se não houver item pendente -> vá para a seção 7 (Encerramento)
4. Execute o item conforme a máquina de estados (seção 3)
5. Faça commit (seção 6)
6. Volte ao passo 1
```

**Nunca** processe dois itens em paralelo. **Nunca** reordene a fila. **Nunca** pule
um item porque parece difícil — se estiver travado, marque-o como bloqueado (seção 5)
e siga adiante.

---

## 2. Seleção do próximo item

Percorra a lista `itens` em ordem crescente de `id` e pegue o **primeiro** que:

- tenha `execucao` **ou** `verificacao` diferente de `Concluído`; **e**
- tenha **todos** os ids listados em `depende_de` com `execucao: Concluído` **e**
  `verificacao: Concluído`.

Se um item estiver pendente mas com dependências não satisfeitas, **pule-o** e continue
procurando — ele será pego numa iteração futura. (Isso não é reordenar: a ordem da fila
é preservada, apenas respeitando o grafo de dependências.)

### Itens que migram juntos (conjuntos indivisíveis)

Alguns itens **devem** ser executados na mesma passada, porque se referenciam
mutuamente e deixá-los em estados diferentes quebra o build:

| Conjunto | ids |
|---|---|
| Cartão de crédito | 13, 14, 15 |
| Coordenadas | 11, 12 |
| Tabela | 33, 34 |

Ao pegar o primeiro id de um conjunto, execute **todos** os ids do conjunto antes de
verificar, e marque todos como `Concluído` juntos.

---

## 3. Máquina de estados por item

### 3.1 `execucao: Realizando`
A sessão anterior morreu no meio. **Não recomece do zero.**
1. Rode `git status` e `git diff` para ver o que já foi alterado.
2. Leia o campo `notas` do item — a sessão anterior deve ter deixado o ponto de parada.
3. Continue a partir daí, seguindo o processo da seção 4.

### 3.2 `execucao: Aguardando`
1. Mude `execucao` para `Realizando` e **salve o status.yaml imediatamente**
   (antes de tocar em qualquer código — assim, se a sessão cair, o estado é honesto).
2. Execute o processo da seção 4.

### 3.3 `execucao: Concluído` → olhe `verificacao`

- **`verificacao: Realizando`** → a verificação anterior foi interrompida.
  **Reinicie a verificação do zero** (dispare um subagente novo, seção 5).
- **`verificacao: Aguardando`** → mude para `Realizando`, salve, e dispare a
  verificação (seção 5).
- **`verificacao: Concluído`** → o item está pronto. Vá para o próximo.

---

## 4. Processo de execução de um item

### 4.1 Ler o plano
Abra o arquivo indicado em `plano`. Ele contém a API do PrimeVue a ser replicada, a
API atual do componente, e o passo a passo. **O plano é um guia, não uma camisa de
força** — se a realidade do código divergir, siga o código e anote a divergência em
`notas`.

### 4.2 Implementar o componente

Regras inegociáveis (do briefing original):

1. **A API pública do componente deve permanecer idêntica.** Props, eventos, slots e
   `v-model` que apps consumidoras já usam não podem mudar de nome, tipo ou semântica.
2. **A API do PrimeVue deve ser replicada** para as props que o componente hoje repassa
   via `v-bind="props"` / `v-bind="attrs"`.
3. **Em caso de conflito entre a API do PrimeVue e a do componente existente, o
   componente existente PREVALECE.** Sempre.
4. **Preserve os nomes de classe CSS `p-*`** que aparecem nos blocos `<style>` deste
   repositório (ex.: `.p-button-outlined`, `.p-button-secondary` em `MaxButton.vue`).
   Apps consumidoras têm CSS que depende desses seletores. A implementação nova deve
   emitir as mesmas classes.

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
   mensagem. **Remover ou substituir esse wrapper quebra o layout e a validação visual
   de toda a biblioteca** — e é uma regressão silenciosa: o campo continua funcionando,
   só perde label, ícones e feedback.

   Se `git diff src/components/InputBase.vue` retornar qualquer coisa ao final de um
   item, isso é **reprovação automática** na verificação.
5. Siga as convenções do [`CLAUDE.md`](../CLAUDE.md): `<script setup lang="ts">`,
   indentação de 4 espaços, aspas simples, ponto e vírgula, ordem
   Template → Script → Style.
6. **Acessibilidade não é opcional.** O PrimeVue entrega `role`, `aria-*`, navegação por
   teclado e foco gerenciado de graça. Sua reimplementação deve entregar o mesmo — cada
   plano lista os requisitos ARIA específicos.

### 4.3 Escrever/atualizar o teste

- O teste vive em `tests/components/<Componente>.test.ts`.
- Se **já existir**, ele é o seu contrato de regressão: ele deve continuar passando
  **sem que você o enfraqueça**. Ajustar um seletor de `.p-inputtext` para o novo
  markup é legítimo; deletar uma asserção porque ela falhou **não é**.
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

### 4.4 Auditar o próprio teste (anti-teste-frouxo)

Antes de declarar pronto, faça o **teste da mutação**: quebre o componente de
propósito (inverta uma condição, remova um `emit`, troque um `??` por `||`) e rode o
teste. **Se o teste continuar verde, ele é inútil** — reforce-o. Desfaça a mutação
depois. Anote em `notas` quais mutações você testou.

### 4.5 Portões de qualidade (todos obrigatórios)

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

E o portão do `InputBase` (para **todo item de input**):

```bash
git diff --stat src/components/InputBase.vue     # deve retornar VAZIO (arquivo intocado)
grep -n "InputBase" src/components/<Componente>.vue   # o wrapper deve continuar lá
```

**Só marque `execucao: Concluído` quando os cinco comandos acima passarem.** Cole a
saída real no seu raciocínio antes de afirmar que passou — nunca declare sucesso sem
ter rodado o comando.

### 4.6 Manutenções colaterais

- Se você **criou** um `.vue` novo em `src/components/`:
  ```bash
  npx tsx src/scripts/generateResolver.ts
  ```
- Se você criou uma **primitiva base** (`src/components/base/`), ela é interna:
  **não** a exporte em `src/index.ts` nem no manifesto do resolver.
- Se o componente era exportado com aliases em `src/index.ts`, confirme que todos os
  aliases continuam apontando corretamente.

---

## 5. Verificação (subagente independente)

Quando `execucao: Concluído` e `verificacao` não estiver `Concluído`:

1. Marque `verificacao: Realizando` e salve o `status.yaml`.
2. Dispare **um subagente** com o **modelo `opus`** (via a ferramenta `Agent`,
   `subagent_type: "general-purpose"`, `model: "opus"`).
3. **Aguarde a conclusão.** Não avance para o próximo item enquanto a verificação
   não retornar.

### Prompt do subagente verificador

> Você é um **revisor adversarial** da migração que remove o PrimeVue da biblioteca
> `@maxvue/max-components-ui`. Seu trabalho é **encontrar problemas**, não aprovar.
> Você **não escreve código** — apenas lê, executa comandos e relata.
>
> **Item sob revisão:** `<componente>` em `<arquivo>`
> **Plano original:** `<caminho do plano>`
> **Teste:** `tests/components/<Componente>.test.ts`
>
> Verifique, um a um:
> 1. **Zero PrimeVue:** `grep -n "primevue\|@primeuix" <arquivo>` retorna vazio?
> 2. **API preservada:** compare `git diff` da assinatura de props/emits/slots contra
>    a versão anterior. Alguma prop sumiu, mudou de tipo, de default ou de semântica?
>    Algum evento deixou de ser emitido? Algum slot ou slot-prop mudou de nome?
> 3. **API do PrimeVue replicada:** as props que o componente repassava ao componente
>    PrimeVue continuam funcionando na nova implementação?
> 4. **Classes CSS:** os seletores `p-*` referenciados nos blocos `<style>` do repo
>    ainda são emitidos pelo novo markup?
> 4b. **`InputBase` (se o item for um input):** rode
>    `git diff --stat src/components/InputBase.vue` — deve estar **vazio** (o arquivo é
>    intocável). E confirme que `<InputBase>` continua sendo o elemento **mais externo**
>    do componente, com as mesmas props sendo repassadas. Perda do wrapper, das props
>    repassadas, ou qualquer alteração no `InputBase.vue` ⇒ **BLOQUEANTE**.
> 5. **Acessibilidade:** roles, `aria-*`, navegação por teclado (Tab/Setas/Enter/Esc)
>    e gestão de foco estão equivalentes ou melhores que os do PrimeVue?
> 6. **Qualidade do teste:** o teste é real ou é teatro? Aplique o teste da mutação —
>    quebre o componente de propósito e confirme que o teste **falha**. Se ele passar
>    com o componente quebrado, isso é **reprovação automática**.
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
> Regras do veredito: **qualquer** problema BLOQUEANTE ⇒ REPROVADO. Um teste que
> sobrevive à mutação ⇒ REPROVADO. Um portão que falha ⇒ REPROVADO. Na dúvida,
> REPROVE — o custo de uma reprovação injusta é uma iteração; o de uma aprovação
> indevida é um bug em produção.

### Tratamento do veredito

- **APROVADO** → `verificacao: Concluído`. Commit. Próximo item.
- **REPROVADO** → incremente `tentativas`, volte `execucao` para `Realizando`,
  registre os problemas em `notas`, **corrija** e refaça o ciclo (execução →
  verificação com um subagente **novo**).
- **`tentativas` chegou a 3** → **pare de tentar**. Marque `notas` com
  `BLOQUEADO: <motivo + resumo das 3 tentativas>`, deixe `execucao: Realizando`,
  e **siga para o próximo item**. Ao final da sessão, reporte todos os bloqueados
  ao usuário (seção 7). Não fique preso num item.

---

## 6. Commits

Um commit por item aprovado (ou por conjunto indivisível):

```bash
git add -A
git commit -m "refactor(<componente>): remove dependência do PrimeVue

- Substitui <primitivas> por implementação própria
- API pública preservada; testes: <N> passando
- Verificado por subagente opus: APROVADO"
```

Commite **também** o `status.yaml` a cada mudança de estado, mesmo intermediária —
é isso que torna o processo retomável se a sessão cair.

---

## 7. Encerramento

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

# 5b. Playground RENDERIZA sem componente órfão.
#     "Sobe sem erro" é portão fraco: um componente que o resolver não resolve mais
#     deixa o dev server subir normalmente e só falha ao renderizar. Suba o servidor,
#     baixe o SFC transformado e confira que não sobrou nenhuma resolução em runtime:
setsid timeout 60 npx vite --config playground/vite.config.ts --port 5210 --host 127.0.0.1 >/tmp/pg.log 2>&1 </dev/null &
sleep 20
curl -s http://127.0.0.1:5210/src/App.vue | grep "= _resolveComponent"   # deve retornar VAZIO
```

⚠️ Atenção aos **aliases**: o `Components()` do playground resolve por **nome de arquivo**
(`MaxButton`), não pelos aliases sem prefixo (`Button`, `T1`) — esses existem apenas em
`src/components-manifest.json`, consumido pelo `MaxComponentsUiResolver`, que o playground
**não** usa (ele importa o fonte vivo de `../src`, e o resolver aponta para o pacote
publicado). Use sempre a tag com o nome do arquivo nos templates do playground.

Depois, reporte ao usuário:
- itens concluídos / total;
- **itens BLOQUEADOS e por quê** (seja explícito — não esconda);
- resultado de cada comando da auditoria;
- se `src/prime/index.ts` (id 36) foi resolvido ou ainda aguarda decisão de produto;
- o comando de merge sugerido — **mas não faça merge sem autorização explícita:**
  ```bash
  cd ../MaxComponentsUi && git merge primevue-migration
  ```

---

## Princípios que valem mais que qualquer passo acima

1. **Evidência antes de afirmação.** Nunca diga "passou" sem ter colado a saída do
   comando. Se você não rodou, você não sabe.
2. **Teste que não falha quando o código quebra não é teste.**
3. **A API pública é sagrada.** Esta biblioteca é consumida por outras apps; uma
   mudança silenciosa de contrato quebra código que você não enxerga daqui.
4. **Salve o estado antes de agir, não depois.** O `status.yaml` existe para
   sobreviver à morte da sessão.
5. **Relate fracasso honestamente.** Um item bloqueado e reportado vale mais que um
   item marcado `Concluído` na base da esperança.
