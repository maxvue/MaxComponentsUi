# Plano de execução — corrigir o ajuste de fonte no menu do avatar

## 1. Identificação, autorização e retomada

- Data: 03/11/2026.
- Projeto: `@maxvue/max-components-ui`, manifesto `1.1.36`.
- Worktree/branch: `wt-6db1bb7c`, já alocada a partir de `dev`.
- Raiz exclusiva: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-6db1bb7c`.
- HEAD investigado: `0579d033105409d6cf279ee6d974cac1358857d9`.
- Especificação prévia: `docs/plans/wt-6db1bb7c/spec.md`.
- Usuários afetados: pessoas que ajustam a legibilidade pelo menu aberto no avatar superior direito.

**Autorizado nesta sessão Plan:** investigação em leitura e criação de `spec.md`/`plan.md` neste diretório. **Não autorizado:** implementar, executar validações, instalar, migrar, formatar, iniciar serviços, alterar preferências ou serviços externos, criar outra worktree, trocar branch, commitar, fazer merge/push/publicação ou limpar a worktree. Não investigar outras worktrees. As etapas abaixo são futuras e dependem de autorização de execução.

Na primeira admissão, ler plano/spec e instruções aplicáveis. Nas retomadas, consultar apenas tarefas e contratos pertinentes; conferir arquivos, alterações locais e trabalho já realizado. Executar lacunas, não repetir trabalho válido. Decisões só são reabertas por nova evidência ou mudança do pedido.

## 2. Pedido, resultado esperado e restrições

O usuário relata: ao mudar a fonte no menu `max-user-menu`, aberto pelo avatar no canto superior direito, nada acontece. A solicitação é corrigir essa ausência de efeito, não redesenhar a aplicação.

### Requisitos

| ID | Resultado observável |
|---|---|
| R1 | Aumentar/diminuir/restaurar muda imediatamente o tamanho computado do texto que participa da preferência global, não só o número do controle. |
| R2 | Número, ref compartilhada, raiz HTML, variável CSS e preferência aplicável ficam coerentes após atualização reativa; não há reversão indevida. |
| R3 | Preservar recuperação local e integração `settings.fontSize`/MaxPinia para GET, cache e salvamento. |
| R4 | Manter contratos, passo, limites, restauração, menu aberto, foco, teclado, slots, ações não relacionadas e uso desktop/mobile. |
| R5 | Confirmar revisão efetivamente servida; diferenciar evidência da biblioteca de aceite na aplicação afetada. |
| R6 | Entregar correção mínima causal e regressões, sem alterações alheias; não declarar validação integral com falhas/gates pendentes. |

### Preservações obrigatórias

- Componente `MaxUserSection`, helpers públicos de fonte e componentes Max do shell; nenhuma reintrodução de PrimeVue.
- `changeFontSize(size: number)`, props atuais, slots e eventos de perfil/configuração/tema/suporte/logout/personificação.
- Passo 1, padrão 16px, faixa global 10–24px e limites personalizados válidos dentro dela.
- Precedência existente da prop explícita sobre a preferência carregada. Não introduzir nova API de controle, mudar política de configuração ou redefinir persistência por iniciativa própria.
- `max_font_size`, `--max-font-size-base` e `user.data.settings.fontSize`.
- GET/cache/save seguem a store existente com MaxPinia; MaxUse continua sendo a origem dos helpers de integração. Não criar store paralela, Axios/HTTP direto, dependência local ou migração de helper entre pacotes.
- Tokens semânticos, identidade compacta, classes legadas e proporções no padrão. Respeitar template → script setup TypeScript → SCSS scoped, indentação e tags de abertura em linha única nas regiões alteradas.

### Exclusões

Não converter toda a tipografia em pixels, não alterar Monaco/editores/iframes e não adicionar zoom, transformações de escala, regra universal de fonte ou `!important` para encobrir a causa. Não mudar versões, manifesto, lockfile, rotas/backend, links ou outra aplicação sem necessidade comprovada e autorização específica. Não sanear baseline alheia ao defeito.

## 3. Evidências atuais e limites de confiança

### Código e testes inspecionados

| Evidência existente | Constatação em leitura |
|---|---|
| `src/components/MaxUserSection.vue:75–114,254–285` | Botões chamam atualização local, limitam valor, aplicam helper e emitem `changeFontSize`; menu não deve fechar. |
| `src/components/MaxUserSection.vue:399–467,664–695` | Handler de teclado no menu; itens usam `0.9rem`. Distinguir foco no item de foco no botão filho antes de alterar tratamento de teclas. |
| `src/helpers/useHtmlFontSize.ts:13–99` | Limita/arredonda, compartilha ref, aplica inline em `html`, escreve variável e armazenamento. A inicialização **já aplica** a preferência local ao DOM. |
| `src/components/MaxApp.vue:32–37,375–402` | Alimenta layout, aplica/salva preferência no handler e possui watcher de carregamento/settings/prop. Múltiplos escritores existem, mas não comprovam sobrescrita defeituosa. |
| `src/components/MaxTopMenu.vue:44–62,109–126` | Perfil mobile/desktop recebe prop ou preferência da store; evento é reemitido. Slot `user` pode substituir o perfil padrão. |
| `src/components/MaxPageLayout.vue:3–44` e `MaxPageMobileLayout.vue:3–15` | Repasse de `fontSize` e evento existe nos dois caminhos. A lacuna mobile descrita no plano histórico **já foi corrigida**. |
| `src/stores/useUser.Store.ts:9–45` | Store Pinia declara `options.get`, `options.save`, cache e dados; MaxPinia é o plugin responsável pelos recursos. `save()` não existe automaticamente sem esse bootstrap. |
| `src/types/app.ts:90–97,177–191` | Usuário é estrutural; configurações de rotas são extensíveis. Não criar DTO/endpoint por suposição. |
| `src/index.ts:366` | Helper/constantes de fonte já fazem parte da API pública. |
| `tests/browser/fontSizePreference.browser.ts` | Testa clique programático no componente isolado e texto computado, armazenamento, limites e Escape. Não monta `MaxApp`. Caso mobile final verifica só existência do layout; casos de extremos recebem props, sem comprovar raiz computada nesses extremos. |
| `tests/components/MaxApp.test.ts:527–565` | Testa preferência carregada e save com espião, mas dispara evento no layout em vez do clique do usuário. Não comprova persistência remota. |
| `tests/components/MaxUserSection.test.ts:183–256` e `tests/unit/MaxUserSection.spec.ts` | Cobrem posição do controle, cliques, evento, restauração, limites, foco e navegação; não comprovam fluxo visual completo. |
| `tests/helpers/useHtmlFontSize.test.ts` | Testa aplicação, normalização, recuperação e restauração; não comprova CSS computado real. |
| `tests/components/MaxTopMenu.test.ts:186–200`, `tests/components/MaxPageLayout.test.ts:89–93,168–181` | Cobrem partes do repasse de preferência/evento, incluindo mobile. |
| `tests/setup.ts:14–74`, `tests/browser.setup.ts:14–29,46–69` | Unidade substitui `localStorage` e `getComputedStyle`; browser usa estilos reais, adapter Axios de teste e fetch parcial para ícones. O adapter só protege a instância em que foi instalado. |
| `src/themes/all.scss`, `app.scss`, `font.scss`, `params.scss`, `src/presetMaxUno.ts` | Arquivos lidos não demonstraram regra causal impedindo fonte no perfil. Preset contém regras tipográficas em rem. |
| Busca em `src/components/InputBase.vue` | Há tipografia em rem e em 12px; mudar `html` não implica escalar todos os textos. Não converter componente inteiro por causa desse achado. |
| `src/components/MaxTitle1.vue:64–74`, `MaxTitle2.vue:57–67` | Títulos reais usam rem; `MaxTitle1 .t1-main-text` usa `1.125rem` e será a referência de texto no conteúdo do teste integrado. Não requer alteração desses componentes. |
| `src/helpers/useOutsidePointer.ts`, `src/composables/useActiveOverlayPosition.ts` | Menu usa listeners globais e posicionamento sob demanda; clique direto por JavaScript não prova que botão esteja descoberto/alcançável pelo ponteiro. Não alterar helpers compartilhados sem causa. |

### Histórico, não aceite atual

`docs/plans/wt-ce381176/plan.md` e seu `execution-state.json` estão versionados **nesta worktree**. Foram lidos como histórico, sem acessar outra worktree. Registram alterações que já aparecem no código atual, falhas anteriores na suíte completa e no navegador geral, além de aceite externo pendente. Esses registros não comprovam resultado atual nem autorizam reaplicar as correções ou assumir a mesma aplicação consumidora. Preservá-los intactos.

### Ambiente confirmado por leitura

- Worktree/branch corretas, estado inicial limpo; `.gitignore` ignora `.worktrees/` e `.max-code-worktrees/`.
- `node_modules` aponta para `/home/johnattas/GitHub/MaxComponentsUi/node_modules`: dependências/caches podem ser compartilhados.
- `@maxvue/max-pinia` ausente nesse diretório; o pacote o declara como peer opcional `^0.2.0`. Isso limita validação integrada, mas não comprova causa do relato.
- Instalado/lock coincidem para Vue `3.6.0-rc.10`, Vitest `4.1.11`, Pinia `4.0.3`, Axios `1.20.0`, MaxUse `1.1.47`, browser-playwright `4.1.11`.
- Vite instalado `8.3.5`, lock `8.3.3`; registrar e esclarecer reprodutibilidade, não reinstalar como tentativa de correção.
- Busca nas declarações MaxUse não encontrou helper equivalente de fonte. Preservar o helper público desta biblioteca, sem clone.
- Não foram iniciados servidor, navegador, testes, build, lint, gates ou instalações. Não foram lidos `.env`, credenciais ou dados pessoais.
- URL, browser, documento, versão servida e CSS da aplicação afetada não foram verificados. Não afirmar causa raiz nem resolução.

### Documentação oficial consultada

Vue 3: `https://vuejs.org/guide/essentials/watchers` e `https://vuejs.org/api/general`, via Context7. Atualizações e watchers são agrupados; a leitura do DOM deve aguardar o ciclo apropriado, como `nextTick`. A documentação não é específica do RC instalado; não há garantia derivada dela sobre esta falha.

## 4. Solução proposta e decisões causais

**Decisões confirmadas:** reaproveitar arquitetura e APIs atuais; corrigir a origem comprovada; ampliar testes existentes; exigir efeito computado e interação real; preservar autorização e dados.

**Proposta de implementação:** concentrar a mudança na menor camada que falhar. Não acrescentar listener externo para repetir o que o shell já faz, não aplicar CSS global como atalho e não refatorar todos os escritores sem evidência.

| Resultado observado na execução | Ação autorizável dentro do escopo |
|---|---|
| Controle não recebe clique/tecla | Identificar alvo, foco, hit testing e cancelamento; corrigir no componente causal. Helpers de overlay só entram se sua responsabilidade for demonstrada. |
| Controle muda, helper/DOM não | Corrigir ligação ou escrita causal em `MaxUserSection`/helper. |
| DOM muda e depois volta | Identificar escritor, valor e momento; ajustar apenas sincronização necessária em perfil/shell. Não inverter precedência da prop explícita. |
| HTML computado muda, texto não | Identificar elemento, unidade/regra vencedora e documento. Corrigir só CSS causal da biblioteca quando o texto estiver no escopo global. |
| Funciona na biblioteca, falha no consumidor | Confirmar import/alias/artefato/revisão/CSS no ambiente afetado; sem alteração especulativa da biblioteca. Edição externa é bloqueada neste escopo. |
| Falha só após recarga | Separar valor local, preferência remota, cache e inicialização; reutilizar MaxPinia, sem gravação paralela. |

A prop `fontSize` existe em níveis diferentes do shell e o perfil também mantém estado local. Isso exige teste de compatibilidade, mas não autoriza redesenhar o contrato controlado. Se a correção exigir mudar o efeito prático de uma prop explícita, apresentar evidência e pedir decisão antes da mudança.

## 5. Tarefas ordenadas e critérios de conclusão

### T1 — Admissão e preflight em leitura

**Dependência:** autorização de execução. **Responsável:** executor principal. **Escrita de produção:** nenhuma.

1. Confirmar raiz, branch, alterações locais e progresso existente; preservar trabalho de usuário/agentes e os documentos históricos.
2. Reler scripts/pre/post hooks em `package.json`, `vite.config.ts`, `vitest.config.ts`, `vitest.browser.config.ts`, setups e `scripts/check-lockfile.mjs` antes de executar comandos. `npm run test` já faz build; `npm run lint` é verificação sem correção automática.
3. Conferir links e resolução efetiva, não só versões: Vue/Pinia únicos, Axios usado por MaxUse e pelo adapter de teste, disponibilidade/registro do MaxPinia e identidade da store entre shell/harness. Não importar pacote para investigar se sua inicialização tiver efeitos; começar por metadados e arquivos.
4. Confirmar destinos reais de `dist`, caches Vite/Vitest, cobertura, relatórios e temporários. Link compartilhado não autoriza escrita fora desta worktree. Se necessário, obter ambiente isolado por fluxo autorizado; não instalar, substituir links ou modificar raiz para contornar.
5. Antes de rede real, confirmar isolamento de banco/cache/filas/storage e conta de teste. Não copiar `.env`, executar migrations/resets, confiar apenas em worktree/transação/`--env=testing` ou chamar save compartilhado sem autorização operacional.
6. Delimitar autorização para observação na aplicação afetada; identificar URL e revisão por evidências de imports/artefatos. Se esse ambiente não estiver acessível, prosseguir apenas com o ramo local seguro e manter limite externo explícito.

**Conclusão:** comandos futuros têm destinos seguros e dependências conhecidas, ou tarefa fica `blocked` com próxima ação concreta. Falta do plugin bloqueia a prova de integração real, não deve ser mascarada por espião. Gate de integridade falhado bloqueia validações dependentes, sem comando direto, `ignoreConfig`, remoção de hook ou desativação de gate.

### T2 — Demonstrar causa e estabilizar contratos

**Dependência:** T1; ambiente seguro e observação autorizada. **Escrita:** registro de progresso futuro, não correção especulativa.

1. Usar ambiente já disponível/autorizado; não assumir que playground ou aplicação da raiz servem esta worktree. Se precisar iniciar serviço, verificar antes portas e todos os efeitos de seu script/configuração. Não iniciar processo duplicado nem alterar link da aplicação afetada.
2. No documento certo, abrir pelo avatar e observar 16→20→19→16. Registrar apenas valores técnicos: número do controle, evento, preferência/ref quando inspecionável, fonte inline/computada do `html`, variável CSS e texto real do menu/conteúdo.
3. Usar clique de ponteiro real, verificando elemento atingido e se o menu está coberto; distinguir de `.click()` programático. Observar a atualização após o ciclo Vue e frames limitados. Se houver save, aguardar evento de conclusão com limite; não consultar status repetidamente sem mudança.
4. Repetir apenas os casos que discriminam a causa: prop ausente versus explícita, preferência remota/local, desktop/mobile, navegação/recarga. Não fazer matriz exploratória infinita.
5. Identificar escritor/regra/handler e arquivo exato para o ramo da seção 4. Conferir se a regra é da biblioteca ou do consumidor. Registrar comportamento anterior esperado no teste de regressão, sem afirmar resultado de teste que não foi executado.
6. Havendo causa externa apenas, não editar outro repositório: fornecer caminho/regra/revisão observados e próxima ação ao responsável. Sem reprodução suficiente, manter T2 bloqueada/manual pendente e não fabricar correção de produção.

**Conclusão:** causa local e menor conjunto de alterações demonstrados, ou impedimento concreto com evidências. A ordem das props/eventos fica estabilizada antes de T3. Não executar suíte, tipos ou build como tentativa exploratória intermediária.

### T3 — Implementar correção mínima e todas as regressões do lote

**Dependência:** T2 causal concluída e autorização vigente. **Responsável:** executor principal.

**Arquivos de produção candidatos, não mudanças obrigatórias:** `src/components/MaxUserSection.vue`, `src/helpers/useHtmlFontSize.ts`, `src/components/MaxApp.vue`; caminhos de layout/topo ou SFC/SCSS exato somente se causais. Alteração de helper global de overlay exige revisão de impacto nos demais consumidores e testes correspondentes antes de ampliar esse ramo.

**Testes existentes com ampliação prevista:** `tests/browser/fontSizePreference.browser.ts` e `tests/components/MaxApp.test.ts`. Complementos condicionais: testes do helper, perfil, teclado, topo e layout listados na seção 3. Não criar arquivo duplicado para testes já existentes.

1. Implementar toda a correção causal e os testes pertinentes em um lote; preservar asserções/regressões anteriores. Não executar testes, tipos ou build entre microedições.
2. Browser: montar `MaxApp` com layouts/topo/perfil reais, rota nomeada e conteúdo de teste isolado. Usar store do usuário no mesmo Pinia, status controlado no harness e dados fictícios. Dublê de save é válido para verificar chamada local, nunca como prova de MaxPinia/backend.
3. Renderizar `MaxTitle1` real na rota de teste, com `title` fictício, além do menu. Seu `.t1-main-text` usa `1.125rem`: com raiz 16→20→19→16, esperar 18→22,5→21,375→18px, tolerância 0,2px. Não alterar esse componente, substituir `MaxUserSection` ou emitir `changeFontSize` artificialmente para provar o fluxo completo.
4. Fazer a interação via API de usuário do browser instalado, com localização por papel/rótulos existentes e menu identificado por `aria-controls`. Não usar clique forçado para ignorar sobreposição. Medir `getComputedStyle` real do HTML, item do menu e texto do conteúdo, sem importar setup unitário nem forjar estilo computado.
5. Asserções numéricas: menu `0.9rem`, raiz 16→20→19→16, texto aproximadamente 14,4→18→17,1→14,4px, tolerância 0,2px; número, variável e preferência aplicável coerentes. Aguardar `nextTick` e condição/frame com limite, sem sleeps arbitrários como prova de persistência.
6. Cobrir atualização de preferência carregada, ausência de preferência, montagem independente do perfil, alteração rápida repetida sem reversão e precedência da prop explícita preservada. Se o defeito for de recarga, adicionar caso que remonte/recarregue e comprove a fonte computada, não só o valor salvo.
7. Testar aumentar/diminuir/restaurar, limites 10/24 e limites personalizados válidos, menu aberto, Escape/foco e atalhos existentes. Para foco nos botões filhos, testar interação nativa; ajustar tratamento só se estiver no ramo causal, sem redefinir navegação de todos os menus.
8. Em desktop/mobile e viewports 320/1280, aplicar **realmente** a raiz 10/16/24 e medi-la antes de aferir ausência de overflow/alcance dos controles. Passar apenas `fontSize` por prop ou verificar existência de layout não satisfaz esses casos.
9. Unidade de shell: clicar no controle real e verificar atualização `settings.fontSize`, DOM, evento e save uma vez por alteração efetiva no contrato atual; alterações não devem limpar outros settings. Testes sintéticos de repasse podem continuar, mas não substituem essa regressão.
10. Isolar singleton/armazenamento/estilos por teste; desmontar Vue antes de remover DOM, limpar overlays/listeners e restaurar raiz/variável/viewport. Em browser, remover somente a chave de teste, não limpar armazenamento pessoal. Controlar todos os caminhos de rede do cenário e confirmar que o Axios interceptado é o efetivo.

**Conclusão:** lote completo com testes e diff mínimo pronto para validação. Sem mudança pública, store paralela, dependência nova ou escrita externa. Revisar causalidade/compatibilidade neste marco, não a cada microedição.

### T4 — Validar o conjunto e revisar a entrega local

**Dependência:** T3 inteira concluída; ninguém escrevendo nos arquivos; isolamento/gates de T1 atendidos.

Comandos existentes, futuros, executados na raiz desta worktree:

```bash
npm run check:lockfile
npm run test
npm run type-check:test
npm run lint
npm run test:browser
```

- Executar na ordem indicada, sem iniciar dependentes após falha de integridade. Não executar estes comandos nesta sessão Plan.
- `test` agrega `build` (`vue-tsc && vite build`) e `test:built` (suíte unitária completa). Não repetir `build`, `type-check` ou `test:built` isoladamente sobre o mesmo conteúdo aprovado. Se `test` parar no build, registrar que a suíte não chegou a executar.
- Se todos os gates de pré-release forem exigidos pelo responsável, escolher `npm run verify` **em vez** de repetir seus componentes nesta revisão. Antes, inspecionar scripts de consumidores/auditoria e comprovar isolamento/autorização dos efeitos. `verify` não autoriza release/publicação.
- Se houver falhas, registrar comandos e códigos reais, agrupar diagnóstico do harness/bootstrap e separar causalidade de baseline. Não repetir falha idêntica sem progresso; não corrigir débitos alheios automaticamente. Correções autorizadas são feitas em lote, depois revalidam-se somente checks afetados/invalidados.
- Checar tipos, estilo e regressões de todos os contratos tocados; não remover asserções, console policy, hooks ou gates para obter verde. Teste específico verde não apaga falha da suíte completa ou do navegador geral.
- Revisão por risco no marco: escrita/sincronização de fonte e props; ciclo de save; CSS/contratos públicos; limpeza e unicidade das instâncias do harness; escopo do diff. Usar revisão independente quando disponível/autorizada, não exigir subagente sem autorização.
- Submeter diff bruto final à verificação de requisitos, inspecionar resultados incertos e conferir deterministamente arquivos alterados. Resultados valem apenas para o conteúdo validado.

**Conclusão:** checks exigidos aprovados na revisão factual atual ou `validationFailed`/`blocked` com próxima ação. Nunca declarar validação integral com falha vigente, checks ausentes ou simples aprovação de chamada de ferramenta.

### T5 — Aceite na aplicação afetada e handoff

**Dependências:** T4, aplicação/revisão corretas e conta/ambiente de teste autorizados.

1. Responsável disponibiliza a revisão corrigida por fluxo autorizado. Este plano não autoriza editar raiz, outro repositório, links, bundle de produção ou instalar/publicar pacotes. Confirmar artefato/revisão antes de aceitar resultado visual.
2. Guardar apenas a preferência numérica original da conta de teste. Pelo avatar real, aumentar, diminuir e restaurar; verificar texto do menu e conteúdo, estabilidade após navegação, recarga e, quando pertinente, nova sessão autorizada.
3. Confirmar GET/cache/save pelo MaxPinia real e retorno posterior da preferência. Dublê, `save` espião, alteração local e resposta simulada não provam persistência externa. Não capturar cookies, tokens ou payload completo do usuário.
4. Esperar conclusão por evento/condição com tempo máximo e recuo se necessário; timeout deixa pendência, não sucesso. Restaurar preferência original da conta de teste ao terminar, por fluxo autorizado.
5. Sem ambiente, plugin, revisão correta ou permissão: marcar T5 `manualPending`, com responsável a acionar e próxima ação concreta em `nextAction`. Cancelamento preserva resultado parcial e pendências.
6. Entregar causa comprovada, arquivos realmente alterados, verificações atuais, limitações e próximo passo. Sem commit/merge/push/publicação/limpeza; integração fica com MaxCode/usuário.

**Conclusão:** correção aceita na aplicação afetada ou entrega local explicitamente parcial. Falhas de T4 impedem conclusão total, mesmo que o procedimento manual funcione.

## 6. Matriz de aceite por tarefa

| Tarefa / requisito | Evidência exigida | Testes pertinentes | Revisão pelo risco | Verificação manual |
|---|---|---|---|---|
| T1 / R5–R6 | Raiz/branch, links, versões/instâncias, scripts e destinos de escrita | Nenhum teste substitui preflight | Isolamento de dependências/artefatos/serviços e hooks | Autorizar ambiente afetado e conta de teste |
| T2 / R1–R2, R5 | Interação real, revisão/documento, valores antes/depois e ponto causal | Definição do caso de regressão de T3 | Writer/regra causal; prop explícita preservada | Distinguir clique bloqueado, reversão e tamanho fixo |
| T3 / R1 | Clique atravessa shell real; raiz/menu/conteúdo computados mudam | Browser existente ampliado + unidade de shell | Sem CSS universal, zoom ou evento sintético como substituto | Texto visivelmente varia na aplicação afetada |
| T3 / R2 | Valor/ref/DOM/preferência estáveis após atualização | Perfil/helper/shell conforme ramo; cliques repetidos | Watchers/normalização/precedência; sem loops | Aguardar estabilização e navegar |
| T3 / R3 | Recuperação local; store/save/evento com mesmo valor | Helper/montagem; shell com dublê declarado | MaxPinia preservado; sem HTTP/save paralelos | Persistência real somente em T5 |
| T3 / R4 | Passo/limites/reset/menu/foco e fonte efetiva nos extremos | Componentes/teclado; Chromium desktop/mobile 320/1280 | Compatibilidade de props, slots, classes e tokens | Controles alcançáveis, teclado e ausência de overflow |
| T4 / R6 | Comandos/saídas/códigos vinculados ao conteúdo atual | Lote local ou gate completo escolhido sem duplicação | Diff bruto final; falhas e escopo revistos | Não confundir teste específico com suíte inteira |
| T5 / R3, R5–R6 | Revisão servida, persistência real e restauração da conta | Reutilizar checks vigentes, sem mudança relevante | Dados mínimos, acesso autorizado, entrega honesta | Avatar → ajuste → navegação → recarga, ou `manualPending` |

## 7. Riscos, operação e recuperação

- **Causa não demonstrada:** maior risco é reaplicar correção já integrada ou editar helper sem falha local. Gate T2 bloqueia esse caminho.
- **Ambiente compartilhado:** caches em `node_modules` podem ultrapassar worktree. Não supor que executar na pasta isole efeitos; não reparar links/instalar automaticamente.
- **Plugin ausente:** limita o teste de integração real. Mantê-lo explícito; não transformar um dublê em prova externa nem alterar dependências para eliminar a limitação sem autorização.
- **Diferença de revisão:** testes verdes desta worktree não provam que a aplicação carregou essa revisão. Confirmar origem antes de concluir.
- **Sincronização concorrente:** watcher, prop, ref e resposta de save/cache podem divergir. Observar writer e ordem; preservar política vigente, sem alterar cache remoto por hipótese.
- **Unidades fixas:** fonte da raiz não escala px. Qualquer regra causal a modificar exige arquivo/elemento concreto; conversão global é excluída.
- **Impacto global do HTML:** validar documentos/rotas relevantes e evitar observers/listeners novos por frame. Não expandir para SSR, múltiplos apps ou sincronização entre abas sem evidência de relação.
- **Falhas históricas:** investigar apenas se ocorrerem na revisão atual. Registros antigos não são baseline comprovada nem motivo para dispensar gates.
- **Recuperação:** não há migração nem transformação de dados. Antes da integração, manter diff pendente nesta worktree e solicitar ajuste dirigido, sem resets/descarte de trabalho alheio. Depois de implantação eventualmente autorizada, retorno à revisão anterior é ação do responsável; não limpar preferências globais.

## 8. Execução eficiente, progresso e contrato de handoff

T1 → T2 → T3 → T4 → T5 é sequencial. Não há delegação autorizada nesta sessão. Se futuramente autorizada, estabilizar contratos e seus responsáveis antes de distribuir, fornecer contexto mínimo com referências aos documentos e revisão dos arquivos, conferir recursos compartilhados uma vez e paralelizar só escritas distintas. Repassar indisponibilidades definitivas e fontes/versões já verificadas. Reunir o lote inteiro antes de suíte/tipos/build; usar notificações em vez de consultar status sem informação nova. Revisão independente nos marcos de risco e entrega, não por microedição.

### Registro futuro de execução

**Somente durante Execute autorizado**, registrar marcos e handoff em `docs/plans/wt-6db1bb7c/execution-state.json`. Não criar esse arquivo na sessão Plan. Usar version 2 estrita, sem campos adicionais.

| Nível | Chaves permitidas e regras |
|---|---|
| Raiz | `{version: 2, planRevision, tasks, verification, updatedAt?, nextAction?}`. Nunca `schemaVersion`, `worktree`, `branch`, `head`, `planPath`, `status` ou `checks` solto na raiz. |
| Tarefa | `{id, status, files, validations, revision?, nextAction?}`. `validations: []` é obrigatório. Não usar `title` ou `evidence`. IDs deste plano: T1 a T5. |
| Verificação | `{revision, checks}`. A revisão é SHA256 factual do conteúdo validado. |
| Check | `{command, revision, result, exitCode?}`, somente dentro de `verification.checks`. Não copiar objetos check para a raiz ou para tarefas. |

Para este plano, manter `validations: []` nas tarefas e centralizar os comandos/resultados em `verification.checks`, sem inventar formato de itens de validação. Os checks, arquivos/revisões e matriz de aceite permitem conferir a conclusão de cada tarefa; status autodeclarado não substitui evidência.

- `planRevision`: SHA256 **real do conteúdo de `plan.md`**, recalculado se o plano mudar. `revision` de tarefa/verificação/check: SHA256 real de revisão factual do conteúdo relevante; registrar método determinístico e incluir caminhos/conteúdos dos arquivos. HEAD Git não substitui esses hashes e rótulos como `final` não são revisions.
- `status` de tarefa: somente `pending`, `running`, `completed`, `blocked`, `manualPending` ou `validationFailed`.
- Resultado de validação/check: somente `passed`, `failed` ou `pending`; `blocked` não é resultado. `passed` exige `exitCode: 0`; `failed` exige inteiro diferente de zero; `pending` não admite `exitCode`. Nunca `exitCode: null`.
- `updatedAt`, quando usado, é inteiro positivo de milissegundos; nunca string ISO. `nextAction` tem até 512 caracteres e comporta motivo, responsável a acionar e ação concreta. Não adicionar `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp` em nenhum nível.
- Comandos têm até 4.096 caracteres e refletem execução real. Registrar todas as falhas, inclusive suíte completa, e não inferir aprovação/código a partir de `tool:end.ok`.
- Conservar falhas no histórico dos checks; uma revalidação só as supera com execução real bem-sucedida no conteúdo atual. Não apagar uma falha geral porque passou filtro específico.
- Checks vazios, falta de resultado vigente, gate ausente ou falha vigente impedem validação integral. Version 1 pode ser lida por compatibilidade, mas não prova validação automática; não copiar o registro de outra tarefa/worktree como prova deste plano.
- Registro autodeclarado não prova execução nativa nem detecta verificações omitidas. Conferir saídas/códigos e conteúdo efetivo. Retomar lacunas; não repetir falhas iguais sem diagnóstico/progresso.

## 9. Revisão do plano e condição de encerramento

1. Pedido correto: ajuste de fonte pelo avatar, sem assumir aplicação consumidora ou ampliar para zoom/redesign.
2. Spec elaborada antes do plano; somente os dois destinos autorizados foram escritos nesta sessão.
3. Contratos, componentes Max, MaxPinia/MaxUse e comportamentos não relacionados preservados; correções históricas já presentes não serão refeitas.
4. Evidências atuais separadas de histórico, propostas e hipóteses; nenhuma causa ou validação inventada.
5. Etapas têm dependências, arquivos candidatos, bloqueios e saída verificável; nenhum passo exige escrita em outra worktree/raiz.
6. Matriz relaciona requisitos a testes, revisão e aceite manual; efeito computado e fluxo completo são obrigatórios.
7. Execução em lote sem testes por microedição; build já agregado ao teste não será repetido. Integridade/ambiente/harness são gates, não alvos de bypass.
8. Riscos de escrita compartilhada, dependência ausente e revisão externa são explícitos; aceite externo fica `manualPending` quando indisponível.
9. Nenhuma implementação/validação foi executada nesta sessão. O executor deve obter autorização futura, conferir trabalho existente e registrar progresso somente durante Execute.
