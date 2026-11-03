# Especificação técnica — ajuste de fonte pelo menu do avatar

## 1. Contexto & Objetivo

- Data: 03/11/2026.
- Projeto: `@maxvue/max-components-ui`, versão declarada `1.1.36`.
- Worktree e branch obrigatórias: `wt-6db1bb7c`.
- Raiz exclusiva: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-6db1bb7c`.
- Revisão investigada: `0579d033105409d6cf279ee6d974cac1358857d9`; estado Git inicialmente limpo.
- Plano detalhado: `docs/plans/wt-6db1bb7c/plan.md`.

O usuário relata que mudar o tamanho da fonte no menu aberto pelo avatar superior direito, identificado por `max-user-menu-*`, não produz efeito. O objetivo é fazer o ajuste mudar imediatamente a tipografia global participante da preferência, mantendo estado e persistência existentes.

**Fato:** o código atual já chama o helper que escreve no elemento `html`. Existe cobertura visual do componente isolado, mas não do clique atravessando o shell autenticado completo. **Limite:** não houve reprodução em navegador nem execução de testes nesta sessão; a causa do relato permanece não comprovada. A aplicação consumidora, sua URL e a revisão efetivamente servida não foram identificadas. O nome MaxCode das regras operacionais não comprova que seja a aplicação afetada.

Esta sessão autoriza somente investigação em leitura e estes dois documentos. Implementação, execução de comandos de validação, geração de artefatos e aceite com alteração de preferência dependem de autorização futura. Não criar outra worktree, trocar branch, commitar, integrar, publicar ou remover a worktree.

## 2. Escopo

### Incluído

1. Localizar o ponto causal entre interação, normalização, estado reativo, aplicação ao DOM, CSS e persistência.
2. Aplicar a correção mínima demonstrada **na biblioteca**, preservando suas APIs.
3. Ampliar os testes existentes para clique de usuário no shell real, efeito tipográfico computado, estabilidade após atualização reativa, persistência local e compatibilidade desktop/mobile.
4. Diferenciar validação local de aceite na aplicação que apresenta o sintoma.

### Fora de escopo

- Redesign do menu; alteração de passo, limites ou valor padrão; nova política de precedência de configurações.
- Conversão geral de tamanhos em pixels para `rem`, zoom/escala universal, alteração de editores de código, iframes ou documentos externos.
- Nova store, endpoint, formato de dados, migração, fluxo HTTP paralelo, mudança de dependências ou de versão do pacote.
- Edição da raiz principal, de outros repositórios/worktrees, de links compartilhados ou de serviços externos.
- Reaplicar correções históricas já presentes ou corrigir falhas gerais sem relação causal e autorização.

## 3. Arquitetura & Mudanças Técnicas

### Fluxo existente confirmado

```text
MaxApp.fontSize / useUserStore.data.settings.fontSize
    → MaxPageLayout
        → MaxTopMenu                         [desktop]
        → MaxPageMobileLayout → MaxTopMenu   [mobile]
            → MaxUserSection → menu max-user-menu-*

Clique no ajuste
    → MaxUserSection.updateFontSize
        → useHtmlFontSize.setFontSize → applyHtmlFontSize
            → html.style.fontSize + --max-font-size-base
            → localStorage.max_font_size + ref compartilhada
        → changeFontSize(number)
            → MaxTopMenu → layout(s) → MaxApp.handleChangeFontSize
                → aplicação ao DOM + user.data.settings.fontSize
                → user.save() disponível via MaxPinia
                → evento público changeFontSize
```

O watcher de `MaxApp` também aplica a prop explícita ou a preferência carregada. A existência de mais de um escritor exige observar a ordem real antes de mudar watchers. A reaplicação hoje existente não prova, por si, o defeito e não autoriza refatoração geral.

### Contratos preservados

| Contrato | Regra |
|---|---|
| Controle | Passo de 1px; padrão 16px; faixa global 10–24px; props `minFontSize` e `maxFontSize` continuam respeitadas dentro da faixa global. |
| API | Props atuais, `changeFontSize(size: number)`, eventos e slots do shell continuam compatíveis. Não introduzir `v-model`, `controlledFontSize` ou novo evento. |
| Preferência explícita | Preservar precedência atual da prop explícita sobre a preferência carregada. Não definir novo comportamento de rejeição de cliques sem evidência/decisão adicional. |
| Persistência | Manter `max_font_size`, `--max-font-size-base` e `settings.fontSize`. GET/cache/save seguem o contrato da store MaxPinia existente. |
| Componentes/helpers | Reutilizar MaxComponentsUi, MaxPinia e MaxUse. O helper público de fonte já pertence a esta biblioteca; preservá-lo, sem clone, migração para outro pacote ou HTTP avulso. |
| Interação | Menu permanece aberto nos ajustes; rótulos, foco, Escape, navegação e atalhos existentes não regridem. |
| Visual | Manter tokens, densidade, proporções em 16px e classes legadas; novos seletores locais usam `.max-*`. Sem PrimeVue, zoom ou `!important` tipográfico global. |

As declarações distribuídas do MaxUse `1.1.47` foram pesquisadas e não apresentaram helper equivalente de fonte. Não criar dependência local `file:`. `useUserStore` já declara as opções consumidas pelo MaxPinia; não substituir por gerenciamento ad hoc.

### Arquivos existentes e mudanças previstas

| Arquivo | Papel e condição de alteração |
|---|---|
| `src/components/MaxUserSection.vue` | Controle, estado local e interação; alterar somente se houver falha causal nesta camada. |
| `src/helpers/useHtmlFontSize.ts` | Normalização, ref compartilhada, DOM e armazenamento; alterar somente se a falha estiver no helper. |
| `src/components/MaxApp.vue` | Aplicação da preferência, watcher e salvamento; alterar somente se sobrescrita/integração for demonstrada. |
| `src/components/MaxTopMenu.vue`, `MaxPageLayout.vue`, `MaxPageMobileLayout.vue` | Repasse de props/eventos; preservar repasse mobile já corrigido. Alterar só com evidência. |
| SFC/SCSS causal da biblioteca | Somente se a regra vencedora explicar a ausência de efeito; identificar arquivo/seletor antes de editar. |
| `tests/browser/fontSizePreference.browser.ts` | **Alteração prevista:** ampliar o arquivo existente, não criar teste duplicado. |
| `tests/components/MaxApp.test.ts` | **Alteração prevista:** ligar clique do controle real a DOM/store/save/evento, sem somente emitir evento sintético. |
| `tests/components/MaxUserSection.test.ts`, `tests/unit/MaxUserSection.spec.ts`, `tests/helpers/useHtmlFontSize.test.ts` | Regressões conforme ramo causal, incluindo isolamento do singleton e teclado quando afetados. |
| `tests/components/MaxTopMenu.test.ts`, `tests/components/MaxPageLayout.test.ts` | Complementar apenas contratos atravessados pela correção. |

Não há novo arquivo de produção obrigatório nem novo contrato público. Ajustes globais de harness não são a solução padrão; investigar identidade das instâncias de Axios/Pinia antes de atribuir falha ao componente.

### Decisão causal obrigatória

| Observação em ambiente autorizado | Direção da correção |
|---|---|
| Clique não alcança handler ou controle está encoberto | Corrigir interação/obstrução comprovada, não simular clique por JavaScript como aceite. |
| Número muda, DOM não muda | Corrigir ligação/helper causal. |
| DOM muda e volta após atualização/salvamento | Identificar escritor e ordem; corrigir sincronização mínima, preservando precedências. |
| HTML computado muda, texto não | Identificar tamanho fixo, regra vencedora ou documento diferente; não concluir que o helper falhou. |
| Biblioteca funciona, consumidor não | Confirmar revisão/artefato/CSS/integração carregados; mudança externa requer autorização própria. |
| Apenas recarga perde preferência | Separar armazenamento local, GET/cache/save e inicialização; não acrescentar salvamento duplicado. |

Sem falha local reproduzível, não inventar correção de produção: manter diagnóstico/regressões úteis e pendência concreta do consumidor.

## 4. Plano de Execução Faseado

1. **T1 — Admissão e preflight em leitura:** conferir trabalho existente, scripts, hooks, links, resolução de dependências e isolamento de artefatos/serviços antes de executar qualquer comando dependente.
2. **T2 — Delimitação causal:** em ambiente futuro autorizado, observar clique real, valor/ref/eventos, raiz inline/computada, texto real e preferência após estabilização. Registrar o ramo, a revisão servida e os arquivos exatos.
3. **T3 — Lote de correção e regressões:** implementar a mudança causal e todos os testes pertinentes antes das validações; ampliar os testes já existentes. Revisar contratos antes de alterar seus consumidores.
4. **T4 — Validação agrupada:** executar integridade e o conjunto de build/testes/tipos/lint/navegador identificado no plano; corrigir falhas em lote e repetir somente verificações invalidadas. Revisar diff e impactos.
5. **T5 — Aceite e handoff:** comprovar o efeito na aplicação afetada com revisão correta e conta de teste, ou registrar `manualPending`. Não concluir resolução integral com falha ou gate pendente.

As etapas são sequenciais; não há delegação autorizada. Se autorizada depois, paralelizar somente escritas independentes, após estabilizar contratos e responsáveis.

## 5. Critérios de Aceite & Validação

- **R1 — Efeito real:** clique por interação de navegador altera a raiz computada e texto participante da tipografia; para `.main-item-menu-div` a `0.9rem`, 16→20px corresponde a aproximadamente 14,4→18px, tolerância 0,2px. No conteúdo do shell, usar `MaxTitle1` real: `.t1-main-text` usa `1.125rem` e deve mudar de 18 para 22,5px. Não medir apenas o número do controle.
- **R2 — Estabilidade:** valor, ref, DOM e preferência aplicável concordam após ciclos Vue e conclusão do salvamento autorizado; sem reversão indevida. Preservar prop explícita, ausência de preferência e componentes usados isoladamente.
- **R3 — Persistência:** armazenamento local é recuperado em nova montagem; no shell, store e `save` recebem o valor. Persistência remota após recarga exige MaxPinia real e ambiente isolado; dublês não a comprovam.
- **R4 — Compatibilidade:** aumentar, diminuir, restaurar, faixa 10–24, limites personalizados válidos, desktop/mobile, foco e menu aberto permanecem funcionais. Em 320px/1280px e fonte realmente aplicada em 10/16/24, controles seguem alcançáveis e a correção não cria overflow horizontal.
- **R5 — Evidência válida:** confirmar revisão do código servido e separar resultado local de aceite do consumidor. Sem confirmação externa, manter pendência explícita.
- **R6 — Qualidade e escopo:** diff mínimo, sem mudança pública ou dependências; verificações atuais sem falhas para concluir validação integral.

Os comandos futuros confirmados, sua ordem sem repetição de build e a matriz por tarefa estão no plano. Nenhum teste/build/lint foi executado nesta sessão.

### Limitações operacionais constatadas

`node_modules` é link para `/home/johnattas/GitHub/MaxComponentsUi/node_modules`, compartilhado. MaxPinia não está presente nesse diretório. Vue instalado/lock: `3.6.0-rc.10`; Vitest: `4.1.11`; MaxUse: `1.1.47`; Pinia: `4.0.3`; Axios: `1.20.0`. Vite instalado `8.3.5` difere do lock `8.3.3`. São leituras de metadados, não resultados de gates nem diagnóstico do bug. Escritas de cache/dependências fora da worktree devem ser bloqueadas até isolamento/autorização.

Documentação oficial Vue 3 consultada: `https://vuejs.org/guide/essentials/watchers` e `https://vuejs.org/api/general`. Watchers são agrupados e o DOM não é atualizado sincronicamente; usar `nextTick` e condições limitadas para verificar estabilização. A documentação consultada não é específica do RC instalado e não prova correção do relato.
