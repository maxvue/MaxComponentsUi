# Independência do PrimeVue — Camada de Infraestrutura

**Data:** 2026-08-13
**Escopo:** camada de infraestrutura do pacote `@maxvue/max-components-ui`
**Fora de escopo:** a migração dos 30 componentes restantes (já planejada em
[`migration_plans/`](../../../migration_plans/)) e as lacunas da fila de migração

---

## 1. Problema

O esforço de independência do PrimeVue rastreia 36 componentes em
[`status-primevue.migration.yaml`](../../../status-primevue.migration.yaml), dos quais 6 estão
`done`. Mesmo que os 36 fiquem prontos, **o pacote continua dependendo do PrimeVue**: existe uma
camada de infraestrutura que nenhum dos 34 planos por componente endereça.

Essa camada tem cinco pontos de acoplamento:

| Ponto | Arquivo | Natureza |
|-------|---------|----------|
| `app.use(PrimeVue, …)` | [`src/index.ts:188`](../../../src/index.ts) | runtime: config, locale, ripple, tema |
| `MaxStyle = definePreset(Aura, …)` | [`src/styles/style.ts:4`](../../../src/styles/style.ts) | tema: herda do Aura |
| Entry point público `./prime` | [`src/prime/index.ts`](../../../src/prime/index.ts) | 82 re-exports auto-importados |
| `ButtonProps` | [`src/types/index.ts:1`](../../../src/types/index.ts) | tipo |
| `PrimeVueResolver` | [`src/helpers/MaxComponentsUiResolver.ts:3`](../../../src/helpers/MaxComponentsUiResolver.ts) | build/auto-import |

### 1.1 O acoplamento real: tokens gerados em runtime

O `MaxStyle` declara apenas **5 rampas semânticas de cor** (primary, success, info, warning,
danger). Todo o restante — tokens de componente e regras CSS `.p-*` — é herdado do Aura e injetado
em runtime pelo serviço de tema do PrimeVue.

Os componentes consomem **25 tokens `--max-*`** que **nenhum arquivo do repositório define**:

```
--max-button-{contrast,danger,help,info,primary,secondary,success,warn}-border-color
--max-floatlabel-{active-font-weight,on-active-background,on-border-radius}
--max-form-field-disabled-background
--max-inputtext-{border-color,disabled-background,focus-border-color}
--max-primary-{100,200,400,500,600}
--max-surface-400
--max-{orange-500,red-600}
--max-credit-card-{max-width,ratio}   ← estes dois são próprios do projeto
```

Remover o PrimeVue sem substituir esse gerador apaga silenciosamente 23 dos 25.

> **Não confundir com `src/themes/*.scss`.** Esses arquivos definem 2075 variáveis próprias do
> projeto (`--background-300`, `--blue-600`, …), são independentes do PrimeVue e sobrevivem intactos.

### 1.2 Superfície de classes

Há **94 classes `p-*` distintas** nos templates de `src/components/`. Parte já é estilizada por SCSS
do próprio projeto — [`InputBase.vue`](../../../src/components/InputBase.vue) define regras para
`.p-inputtext`, `.p-select-label` e `.p-floatlabel` — mas os valores que essas regras consomem são
os tokens da seção 1.1.

Os componentes já migrados **preservaram deliberadamente** as classes `.p-*`. O registro de progresso
do `MaxInputSwitch` documenta a consequência: foi preciso `!important` em todas as regras
`.p-toggleswitch*` porque o CSS runtime do PrimeVue disputa os mesmos seletores e pode ser injetado
depois. Esse `!important` é dívida de coexistência, não decisão de design.

---

## 2. Restrições

Definidas pelo autor do projeto durante o brainstorming:

1. **O tema-alvo não pode herdar do Aura nem usar `@primeuix/themes`.**
2. **O resultado visual deve ser equivalente ao do Aura hoje.**
3. **Parâmetros, classes e modificadores do Aura não devem permanecer no código** — o que inclui as
   classes `.p-*` e os nomes de token no formato PrimeVue.
4. **`./prime` será removido numa major, com aviso prévio de depreciação.**
5. **A troca de nomenclatura acontece num sweep único ao final**, não componente a componente.

A restrição 3 combinada com a 5 define a estratégia: o código conviverá com nomes do PrimeVue
enquanto o PrimeVue existir, e todos serão trocados de uma vez quando ele sair.

---

## 3. Abordagem: duas fases

`app.use(PrimeVue)` só pode sair depois que os 30 componentes restantes saírem. Mas os 30 precisam
de um alvo de estilização estável **desde já**. Daí a divisão:

- **Fase 1 — não-quebrante, roda em paralelo à fila de migração.** Estabelece o contrato de tokens
  próprio e corta as dependências que não exigem que a fila termine.
- **Fase 2 — gatilhada pelos 30 componentes `done`.** Remove o PrimeVue e executa o sweep de
  nomenclatura.

Durante a Fase 1, tokens próprios e tokens gerados pelo PrimeVue **coexistem com valores idênticos**.
É isso que torna a Fase 1 verificável: se os valores baterem, nada muda visualmente.

---

## 4. Fase 1 — Contrato (não-quebrante)

### 4.1 `src/themes/tokens.scss` (novo)

Declara literalmente os 23 tokens `--max-*` hoje gerados em runtime, com os valores resolvidos do
Aura, em dois blocos:

- `:root` — valores do color scheme light
- `.dark` — valores do color scheme dark, reproduzindo o `darkModeSelector: '.dark'` configurado hoje
  em [`src/index.ts:196`](../../../src/index.ts)

Os valores são obtidos resolvendo a cadeia de referência do Aura, que tem 2–3 saltos. Exemplo:

```
inputtext.borderColor → "{form.field.border.color}" → base.colorScheme.{light,dark}.formField.borderColor → "{surface.300}" → rampa semântica
```

Os `--max-primary-*` saem diretamente das rampas já declaradas no `MaxStyle`. Os dois tokens
`--max-credit-card-*` já são próprios e não entram neste arquivo.

O arquivo entra no barril [`src/themes/all.scss`](../../../src/themes/all.scss), que usa `@use`:
`@use './tokens.scss' as tokens;`.

**Os nomes dos tokens permanecem no formato PrimeVue nesta fase.** Renomeá-los agora obrigaria a
editar os mesmos arquivos duas vezes, já que o sweep da Fase 2 passa exatamente por eles. A
renomeação acontece na Fase 2 (§5.1), atendendo à restrição 3 num único momento de risco.

### 4.2 `src/styles/style.ts`

Deixa de importar `Aura` e `definePreset` de `@primeuix/themes`. Passa a exportar `MaxStyle` como
objeto próprio, contendo as mesmas 5 rampas semânticas que já declara hoje — elas são literais no
arquivo, nada se perde.

`app.use(PrimeVue)` permanece intacto nesta fase e continua recebendo esse preset, para que os
componentes **ainda não migrados** sigam sendo estilizados.

### 4.3 `src/types/index.ts`

`ButtonProps` deixa de estender o tipo de `primevue/button` e passa a ser interface própria,
declarando apenas o que o `MaxButton` expõe: `severity`, `size`, `outlined`, `loading`, `icon`.
É mudança de tipo, sem efeito em runtime.

### 4.4 Aviso de depreciação em `./prime`

[`src/prime/index.ts`](../../../src/prime/index.ts) passa a emitir aviso em desenvolvimento
(`import.meta.env.DEV`) informando que o entry será removido na próxima major, e o README registra o
alvo de remoção.

Isso importa porque o resolver **auto-importa** desses 82 nomes
([`MaxComponentsUiResolver.ts:41`](../../../src/helpers/MaxComponentsUiResolver.ts)): uma app
consumidora escreve `<Dialog>` no template sem nenhum import, e o unplugin resolve. Sem aviso prévio,
a remoção se manifesta como componente sumindo do template, sem erro de import.

### 4.5 Locale

Nenhuma ação. Os 17 campos de `src/locales/pt-br.ts` hoje alimentam apenas componentes PrimeVue;
após a Fase 2 o objeto sobrevive, consumido apenas pelo `MaxInputDatePicker`.

### 4.6 Critério de aceite da Fase 1

- `npm run type-check`, `npm run lint`, `npm run build` limpos
- `npm run test` verde na baseline atual (1357 testes)
- **Zero mudança visual**, verificada por revisão manual do playground antes/depois

---

## 5. Fase 2 — Remoção

**Gatilho:** os 30 componentes restantes com status `done` no
[`status-primevue.migration.yaml`](../../../status-primevue.migration.yaml).

A ordem abaixo é obrigatória; cada passo depende do anterior.

### 5.1 Sweep de nomenclatura

Troca as 94 classes `.p-*` e os 23 tokens `--max-*` por nomenclatura própria (`.max-*`). Só pode
ocorrer aqui, quando nenhum CSS do PrimeVue disputa os mesmos seletores.

Os `!important` defensivos das regras `.p-toggleswitch*` do `MaxInputSwitch` são removidos neste
passo — existem apenas por causa da coexistência (§1.2).

Este é o passo que satisfaz a restrição 3.

### 5.2 `install()` enxuto

Em [`src/index.ts`](../../../src/index.ts):

- remover `app.use(PrimeVue, …)` e o import de `primevue/config`
- remover a opção `ripple` — **não é usada em lugar nenhum de `src/`**, não há uma única diretiva
  `v-ripple`; é apenas repassada ao PrimeVue
- manter `app.directive('tooltip', Tooltip)` — [`src/directives/tooltip.ts`](../../../src/directives/tooltip.ts)
  já é implementação própria

### 5.3 Remoção de `./prime`

- apagar [`src/prime/index.ts`](../../../src/prime/index.ts)
- remover a chave `"./prime"` de `exports` e a entrada correspondente do build multi-entrada
- remover `PrimeVueResolver` de [`MaxComponentsUiResolver.ts`](../../../src/helpers/MaxComponentsUiResolver.ts)
- ajustar [`src/scripts/generateResolver.ts`](../../../src/scripts/generateResolver.ts), que hoje
  referencia esse entry
- regenerar o manifesto do resolver

### 5.4 Dependências

No `package.json`:

- remover `@primevue/auto-import-resolver` (linha 55), `@primeuix/themes` (linha 80) e `primevue`
  (linha 99) de `dependencies`
- remover `@primeuix/themes` e `primevue` de `peerDependencies`
- remover `"primevue"` da lista `keywords`

### 5.5 Critério de aceite da Fase 2

- `grep -rn primevue src/` retorna vazio
- `npm run type-check`, `npm run lint`, `npm run test`, `npm run build` limpos
- revisão manual do playground

---

## 6. Impacto de versionamento

A Fase 2 é uma **major**. Duas quebras públicas:

1. **`./prime` deixa de existir.** Apps que usam `Dialog`, `Card`, `Tree` e outros dos 82 nomes
   precisam passar a instalar e importar o PrimeVue por conta própria, ou substituir os componentes.
2. **O sweep de classes** quebra qualquer app consumidora que mire seletores `.p-*` no CSS próprio.

A Fase 1 é inteiramente compatível e pode sair em versões minor.

---

## 7. Riscos

| Risco | Mitigação |
|-------|-----------|
| **Não há teste de regressão visual no repositório.** O sweep da §5.1 é a mudança de maior risco visual do projeto e a suíte atual não a captura — os testes cobrem comportamento, não estilo. | Risco aceito por decisão do autor. Mitigação: revisão manual do playground ao fim de cada fase. |
| Erro na resolução dos valores de token do Aura (§4.1) produz divergência visual silenciosa. | O critério de zero mudança visual da Fase 1 existe justamente para expor isso enquanto os dois sistemas coexistem e podem ser comparados. |
| Dark mode passa a ser mantido à mão, sem geração automática. | Os dois blocos da §4.1 são escritos juntos e verificados na mesma revisão. |
| Consumidores não percebem a depreciação de `./prime`. | Aviso em dev desde a Fase 1 (§4.4), mais nota no README. |

---

## 8. Trabalho relacionado, fora deste escopo

Levantado durante o brainstorming e registrado para tratamento separado:

- **`MaxTopToolbar` importa `primevue/menubar`** ([linha 34](../../../src/components/MaxTopToolbar.vue))
  e **não consta na fila de migração** nem no YAML de status. É um item faltante da fila.
- **Os itens #35 e #36** (`MaxButtonConfirm`, `MaxIconConfirm`) estão bloqueados no YAML por
  dependerem de "um substituto para `v-tooltip`". Essa premissa está desatualizada:
  [`src/directives/tooltip.ts`](../../../src/directives/tooltip.ts) já é implementação própria,
  registrada em [`src/index.ts:202`](../../../src/index.ts). Ambos provavelmente podem ser fechados
  por revalidação; o #35 depende apenas do `MaxButton`.
