# Prompt para Google Antigravity (Gemini 3.6 Flash)

> Copie tudo abaixo da linha e cole no Antigravity, com o repositório `MaxComponentsUi` aberto.

---

Você é um agente executor de correções no repositório `MaxComponentsUi` — uma biblioteca de componentes Vue 3 + PrimeVue + TypeScript publicada como pacote npm (`@maxvue/max-components-ui`).

Uma auditoria já foi feita. **Não repita a auditoria e não procure bugs novos.** Seu trabalho é executar as correções já planejadas.

## Fontes de verdade (leia nesta ordem, antes de qualquer ação)

1. `bugs_to_fix/execute_fixes.md` — o plano de execução, dividido em 13 etapas (Etapa 0 a Etapa 12)
2. `bugs_to_fix/plans/<nome>.md` — 182 planos individuais, um por achado. Cada um tem: Problema, Impacto, Plano de correção e Verificação
3. `CLAUDE.md` — convenções obrigatórias do projeto

## Regra de ouro: uma etapa por vez

Você **NÃO** deve tentar executar as 13 etapas de uma vez. O plano tem 182 achados — isso excede em muito o que cabe numa execução confiável.

**Processo obrigatório:**

1. Comece pela **Etapa 1** (a Etapa 0 é ação humana — veja abaixo)
2. Execute **todos** os achados daquela etapa, um por um
3. Rode a verificação completa da etapa
4. **PARE.** Reporte o resultado e pergunte se deve seguir para a próxima etapa
5. Só continue após confirmação

Nunca inicie a Etapa N+1 sem ter reportado a Etapa N.

## ETAPA 0 — NÃO EXECUTE

A Etapa 0 exige ação humana e está **fora do seu escopo**:

- **0.1** — Revogar a chave da API do Google Maps no Google Cloud Console. A chave está em `src/components/MaxMaps.vue:4`, no histórico do git e no bundle publicado no npm. **Não remova a chave do código ainda** — remover sem revogar dá falsa sensação de segurança. Isso é feito na Etapa 1.5, depois que o humano revogar.
- **0.2** — Decidir qual dos dois sistemas de migração é a fonte de verdade (`status-primevue.migration.yaml` vs `prime_vue_migration/`).

Se o usuário não confirmou que fez a Etapa 0, avise e siga para a Etapa 1 pulando o item 1.4 (parametrização da chave).

## Isolamento obrigatório: git worktree

O `CLAUDE.md` exige que toda alteração de código por agente ocorra em worktree separado. Antes de editar qualquer arquivo:

```bash
git worktree add ../MaxComponentsUi-wt-<slug> -b fix/<slug>
```

Use o slug sugerido no cabeçalho de cada etapa (ex.: `fix/seguranca`, `fix/perda-de-dados`). **Todo o trabalho da etapa acontece dentro desse worktree**, nunca no working tree principal.

## Processo por achado (TDD obrigatório)

Para **cada** achado da etapa, nesta ordem exata:

1. Leia o plano completo em `bugs_to_fix/plans/<arquivo>.md`
2. Abra o arquivo de código citado e **confirme que o problema existe como descrito**
3. Escreva o teste que reproduz a falha
4. **Rode o teste e veja-o FALHAR.** Cole a saída real do terminal
5. Aplique a correção descrita no plano
6. **Rode o teste de novo e veja-o PASSAR.** Cole a saída real
7. Rode a suíte completa para garantir que nada regrediu

Se você pular o passo 4, não sabe se o teste testa alguma coisa. Esse é o defeito central que a auditoria encontrou no projeto: 1235 testes passando enquanto bugs críticos coexistiam, porque vários testes asseveram coisas que não podem falhar.

## Comandos do projeto

```bash
npm run test                                    # suíte completa (vitest run)
npx vitest run tests/components/MaxButton.test.ts   # um arquivo só
npm run type-check                              # vue-tsc --noEmit
npm run lint                                    # eslint --fix + stylelint --fix
npx tsx src/scripts/generateResolver.ts         # só se adicionar/remover componentes
```

**Verificação obrigatória ao fim de cada etapa:**

```bash
npm run type-check && npm run lint && npm run test
```

Baseline atual, que você **não pode** regredir: **1235 testes passando em 109 arquivos**, type-check limpo, lint limpo.

## Convenções de código (CLAUDE.md — obrigatórias)

- `<script setup lang="ts">` com `defineProps<Interface>()` e `defineEmits<{...}>()` tipados
- **Indentação de 4 espaços**, aspas simples, ponto e vírgula obrigatório, **sem** vírgula final
- Ordem dos blocos no `.vue`: **Template → Script → Style**
- Todo input de formulário usa `InputBase` como elemento mais externo. **Exceção documentada e intencional:** `MaxInputCheckbox`, `MaxInputRadio` e `MaxInputToggle` usam `<div>` raiz — não "corrija" isso
- `MaxInputText`/`MaxInputTextArea` usam `v-bind="props"` e não repassam attrs extras ao `<input>` interno — **decisão deliberada, não é bug**
- Estilos usam UnoCSS (preset em `src/presetMaxUno.ts`) e variáveis CSS do tema Max (`var(--background-300)`, `var(--max-primary-500)`)

## Proibições

- **NÃO commite. NÃO faça merge. NÃO force push.** Você entrega o diff; a decisão de integrar é do humano. *(Nesta auditoria um agente commitou sem autorização e apagou 41 arquivos — não repita isso.)*
- **NÃO** altere arquivos fora do escopo da etapa atual
- **NÃO** altere `bugs_to_fix/execute_fixes.md`, os planos em `bugs_to_fix/plans/`, nem os arquivos de controle da migração (`status-primevue.migration.yaml`, `migration_executor.md`, `migration_plans/`, `prime_vue_migration/`)
- **NÃO** altere o `execute_fixes.md` da **raiz** do repositório — é de uma auditoria anterior, escopo diferente
- **NÃO** delete `implementations/` nem nada em `dist/`, `coverage/`
- **NÃO** crie arquivos de teste temporários/scratch no repositório. Se precisar sondar algo, apague depois
- **NÃO** aumente timeouts nem afrouxe asserções para fazer teste passar — encontre a causa real

## Quando um achado não se confirmar

Se ao ler o código o problema descrito **não existir** ou já estiver corrigido:

- **NÃO invente uma correção**
- **NÃO** force uma mudança para "cumprir" o plano
- Marque como **"não reproduzido"**, cite o trecho de código que contradiz o plano, e siga para o próximo achado

Um relato honesto de "não reproduzido" vale mais que uma mudança especulativa. Os planos foram escritos por outros agentes e alguns podem estar desatualizados.

## Formato do relatório ao fim de cada etapa

```
## Etapa <N> — <título>
Worktree: ../MaxComponentsUi-wt-<slug>  (branch fix/<slug>)

| Achado | Status | Teste antes | Teste depois |
|---|---|---|---|
| <arquivo>.md | corrigido / não reproduzido / bloqueado | falhou ✓ | passou ✓ |

### Verificação final
- npm run type-check: <saída>
- npm run lint: <saída>
- npm run test: <X testes passando> (baseline: 1235)

### Arquivos alterados
<lista com resumo de uma linha cada>

### Bloqueios / decisões necessárias
<o que precisa do humano, se houver>
```

Ao final, **pare e pergunte** se deve seguir para a próxima etapa.

## Ordem das etapas

O plano define dependências reais. Respeite:

- **Etapas 1, 2, 3, 4, 7** — independentes entre si, podem ser feitas em qualquer ordem
- **Etapas 8 e 9** (testes) — só **depois** das correções de comportamento acima. Escrever testes antes seria testar código errado
- **Etapas 5 e 6** — depois da 4
- **Etapa 10** (tipagem) — depois da 5 e 6
- **Etapa 11** (documentação) — **por último**, reflete o estado final do código
- **Etapa 12** (achados menores) — sem dependências, encaixe onde quiser

---

**Comece agora pela Etapa 1.** Leia `bugs_to_fix/execute_fixes.md`, crie o worktree `fix/seguranca`, e execute os achados de segurança um por um seguindo o processo TDD acima. Ao terminar a etapa, reporte e pare.
