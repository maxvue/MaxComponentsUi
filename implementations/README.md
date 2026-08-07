# Auditoria do Projeto — Achados

Auditoria profunda realizada em **2026-08-07** sobre o branch `dev` da
`@maxvue/max-components-ui`, cobrindo código-fonte (`src/`), suíte de testes
(`tests/`), configuração de build e as alterações não commitadas no working tree.

## Situação geral

| Verificação | No levantamento | Após as correções (2026-08-07) |
|---|---|---|
| Type-check | ✅ Passa | ✅ Passa |
| Testes | ❌ 43 falhas / 8 arquivos | ⚠️ **25 falhas / 1 arquivo** (`MaxTabs.test.ts`) |
| Lint | ❌ 4 erros, 5 warnings | ⚠️ **0 erros, 3 warnings** (todos em Tabs) |

Todos os achados **fora do escopo de Tabs** foram corrigidos. As 25 falhas e os 3
warnings restantes pertencem exclusivamente à família Tabs (achados 01–04 e 07),
deixados intactos para tratamento posterior.

A causa dominante é a **reescrita não commitada da família Tabs** (`MaxTabs`,
`MaxTabItem`, `MaxTabPanel`), que substituiu a implementação acessível baseada em
contexto por uma implementação baseada em `teleport` + `setTimeout`, sem remover
os componentes irmãos que dependiam do contexto antigo. Isso deixou a biblioteca
num estado internamente inconsistente que **quebra em runtime** para consumidores.

## Índice de achados

Ordenados por severidade.

### 🔴 Pendente — família Tabs (a tratar em seguida)

| # | Documento | Resumo |
|---|---|---|
| 01 | [01-tabs-contexto-quebrado.md](01-tabs-contexto-quebrado.md) | `MaxTabList`/`MaxTabPanels`/`MaxTabPanel` lançam exceção fatal dentro do novo `MaxTabs` |
| 02 | [02-maxtabpanel-props-orfas.md](02-maxtabpanel-props-orfas.md) | `MaxTabPanel` mantém lógica `lazy`/`is_active` totalmente morta; renderiza todos os painéis simultaneamente |
| 03 | [03-maxtabitem-race-condition.md](03-maxtabitem-race-condition.md) | Identidade dos tabs via `setTimeout` + contador global: race condition, IDs instáveis e prop `value` ignorada |
| 04 | [04-maxtabs-cache-colisao.md](04-maxtabs-cache-colisao.md) | Cache de tab ativo colide entre instâncias e persiste índice inválido |
| 07 | [07-maxtabs-perda-acessibilidade.md](07-maxtabs-perda-acessibilidade.md) | Regressão completa de acessibilidade WAI-ARIA na nova implementação de Tabs |

### ✅ Corrigido em 2026-08-07

Documentos removidos após a aplicação — as mudanças estão no código e no
histórico do git. Registro do que foi feito:

| # | Achado | Correção aplicada |
|---|---|---|
| 05 | `MaxInputSwitch`: clique no rótulo direito aplicava `falseValue` | `changeValue` (guarda por *truthiness*, que quebrava com valores falsy) substituída por `setValue`/`toggleValue`; passou a respeitar `disabled`. Testes cobrem `trueValue: 0` |
| 06 | Logs de depuração no bundle publicado | `console.trace` removido do `useIconStore` — disparava com stack trace completo a cada carga de ícones. Os `console.log` de Tabs seguem pendentes |
| 08 | Inventário das 43 falhas de teste | 18 falhas fora de Tabs eliminadas (Grupos B, C e D) |
| 09 | Mock do TipTap sem o export nomeado `Table` | Mock passou a expor `Table` e `default` |
| 10 | `MaxInputMarkdown` não usava `InputBase` | Envolvido em `<InputBase v-bind="inputBaseProps" in-line>`; `label`/`required`/`error`/`message` deixaram de ser props inertes |
| 11 | 4 erros + 5 warnings de lint | 0 erros; `Ref` removido de `MaxTagsList`; restam 3 warnings, todos em Tabs |
| 12 | Classe `caution` duplicada no `InputBase` | Duplicata removida. **Bug extra encontrado e corrigido:** `displayMessage` retornava `false`, e o Vue interpolava o literal `"false"` visível sob todo campo sem mensagem |
| 13 | Artefatos temporários na raiz | 7 arquivos removidos; `coverage/` adicionado ao `.gitignore` |

Correção de teste que merece nota: o mock do `MaxCreditCard` lia
`getAttribute('font-size')`, mas o componente declara o tamanho via `style`
inline — o mock caía sempre no fallback de 16px, então **nada transbordava e o
teste era inofensivo**. Corrigida a leitura, os testes passaram a exercitar de
fato a lógica de clamp.

### 📋 Sugestão de melhoria (sem ação imediata)

| # | Documento | Resumo |
|---|---|---|
| 14 | [14-tipagem-any-difusa.md](14-tipagem-any-difusa.md) | 125 ocorrências de `: any` enfraquecem a API pública tipada |

## Próximo passo

Resta **decidir o destino da reescrita de Tabs** (achados 01–04 e 07) — o único
bloqueio remanescente. Ou completa-se a nova arquitetura (removendo
`MaxTabList`/`MaxTabPanels`/`MaxTabPanel`/`MaxTab` e o `tabsContext`, com
reimplementação do suporte ARIA), ou reverte-se para a implementação com
contexto:

```bash
git checkout -- src/components/MaxTabs.vue src/components/MaxTabItem.vue src/components/MaxTabPanel.vue
```

Enquanto isso não for resolvido, o estado atual de Tabs **não deve ser
commitado** — os cinco componentes seguem exportados na API pública e quebram em
runtime para qualquer consumidor.

Note que a suíte agora tem uma única fonte de falhas (`MaxTabs.test.ts`), o que
restaura sua função de rede de segurança: qualquer nova regressão fora de Tabs
volta a ser imediatamente visível.
