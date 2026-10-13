# Especificação técnica — MaxButton com altura compacta (`slim`)

- Data: 13/10/2026.
- Projeto: `@maxvue/max-components-ui`, manifesto em `1.1.2`.
- Worktree e branch: `wt-65b8ee1d`.
- Raiz obrigatória: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-65b8ee1d`.
- Revisão investigada: `61a0417935b3b780ebbcd6176f14158c6fd61f67`, inicialmente sem alterações locais.
- Estado: proposta para revisão; nenhuma implementação ou validação executável realizada.

## 1. Contexto & Objetivo

O pedido é verificar se `MaxButton` aceita `slim`; se não aceitar, criar a prop para deixar o botão mais fino na altura; se já aceitar, documentar corretamente.

**Resultado confirmado por leitura:** `slim` não existe em `MaxButtonsType`, no cálculo de classes ou no SCSS de `MaxButton`. O componente declara props por `defineProps<MaxButtonsType>()`. Passar um atributo desconhecido não equivale a uma prop com efeito visual implementado.

Hoje `size="small"`/`"sm"` modifica espaçamento vertical, horizontal e fonte. Portanto, não atende ao pedido de uma opção dedicada à altura. O atributo `slim` de `InputBase` pertence a outro componente e não fornece esse comportamento ao botão.

Entregar uma opção pública, booleana e desativada por padrão para reduzir apenas o espaçamento vertical dos botões com texto, com documentação e provas de comportamento no navegador. Beneficiários: consumidores da biblioteca e usuários de interfaces operacionais compactas.

## 2. Escopo

### Incluído

1. Acrescentar `slim?: boolean` à interface pública `MaxButtonsType`, com comentário em pt-BR.
2. Declarar padrão `false`, associar `slim=true` à classe `max-button-slim` e implementar a redução vertical no SCSS scoped de `MaxButton`.
3. Cobrir prop, reatividade, composição com tamanhos/variantes e regressões pertinentes.
4. Documentar a nova prop na seção `MaxButton` de `COMPONENTS.md` e adicionar demonstrações ao cenário existente `buttons-main`.
5. Atualizar, na mesma seção documental tocada, a descrição de botão nativo e a condição correta de renderização com slot. Não reescrever o catálogo inteiro.

### Fora de escopo

- Alterar a aparência padrão, fonte, ícones, largura, cores, bordas, foco ou contratos de eventos/navegação/ações.
- Redesenhar `MaxIconButton`, alterar sua área de toque ou oferecer uma nova prop funcional em outros componentes.
- Modificar a API de `MaxButtonConfirm`, `InputBase`, stores ou helpers.
- Corrigir divergências históricas de documentação não necessárias a esta entrega.
- Instalar dependências, mudar versões/lockfiles, gerar resolver ou publicar o pacote.
- Criar outra worktree, trocar de branch, fazer commit, merge ou push.

## 3. Arquitetura & Mudanças Técnicas

### Evidências e arquivos

| Arquivo existente | Evidência / mudança futura |
|---|---|
| `src/types/index.ts:66–145` | Interface compartilhada `MaxButtonsType`, sem `slim`; adicionar prop diretamente nela, não na base ignorada pelo compilador Vue. |
| `src/components/MaxButton.vue:1–109` | Botão nativo com `label` ou slot padrão; fallback para `MaxIconButton`; props tipadas, classes computadas, eventos e `goToRoute`. Acrescentar padrão e classe, sem mudar os fluxos. |
| `src/components/MaxButton.vue:119,299–315` | Padding padrão `0.5rem 1rem`, pequeno `0.35rem 0.75rem`, grande `0.65rem 1.25rem`; link definido antes dos tamanhos. Acrescentar regra compacta após regras de tamanho. |
| `src/components/MaxIconButton.vue:63,79–82,168–217` | Também consome o tipo compartilhado, mas usa dimensão quadrada e padding zero; preservar comportamento, sem edição prevista. |
| `src/index.ts:22,303` e `package.json:80–83` | Exportações de componente, tipo e subpath já existem; não exigem mudança. |
| `tests/components/MaxButton.test.ts` | Testes atuais de rótulo, slot, fluxo de clique, tipos HTML e resolução de ícones. Expandir testes sem remover asserções. |
| `COMPONENTS.md:69–94` | Referência pública existente; não lista `slim` e usa descrição antiga. Atualização pontual. |
| `playground/src/scenarios/buttons-main.vue` | Cenário real já usa componentes públicos Max; ampliar o bloco de `MaxButton`. |
| `tests/browser/FocusVisibleInventory.browser.ts` | Referência de montagem real, temas e foco por teclado; manter intacto. |
| `tests/browser/MaxButtonSlim.browser.ts` | **Novo arquivo proposto** para comprovar geometria e estilos computados. |

### Contrato proposto

| Aspecto | Decisão proposta |
|---|---|
| Prop | `slim?: boolean`; padrão `false`. |
| Ativação | `<MaxButton label="Salvar" slim />` ou `:slim="true"`. Para desativar, usar `:slim="false"`, não a string `slim="false"`. |
| Classe | `max-button-slim` somente quando ativa e renderizando o botão textual. |
| Estilo | `.max-button.max-button-slim:not(.max-button-link)` define apenas `padding-block: 0.25rem`, após os seletores pequeno/grande. Sem `!important`, altura fixa, alteração de fonte ou corte de conteúdo. |
| Tamanhos | Compor com `small`/`sm` e `large`/`lg`; manter fonte e padding horizontal determinados por `size`. Valores numéricos legados continuam dimensionando ícones como hoje. |
| Variantes | Sólido, `outlined`, `text` e `dashed` recebem redução vertical. `link` preserva integralmente seu estilo atual, inclusive combinações com `size`; não acrescentar padding a links. |
| Slot | Funciona também quando o texto vem somente do slot padrão. |
| Sem texto | Na ausência de `label` e slot padrão, continua o fallback atual para `MaxIconButton`; `slim` não modifica sua geometria. O tipo compartilhado reconhecerá a prop, mas isso não cria implementação visual no botão de ícone. |
| Altura final | Depende de conteúdo, fonte, ícone e CSS consumidor; não prometer 20px, 22px ou outra altura fixa. Altura externa forçada pode impedir redução medida. |

Justificativa do valor: `0.25rem` é metade do padding vertical padrão e inferior ao padding vertical de ambas as variantes de tamanho. É uma proposta de baixo impacto baseada na escala existente, não um token de altura já definido pelo projeto.

```text
slim (booleano) → props do MaxButton → classe max-button-slim
   ├─ label/slot + variante diferente de link → padding vertical reduzido
   ├─ label/slot + link → geometria atual preservada
   └─ sem label/slot → MaxIconButton atual, sem redução adicional
```

### Ecossistema e compatibilidade

- Usar os componentes Max existentes no playground e testes; não introduzir PrimeVue.
- Não há novos GETs, persistência ou autosave; não criar store artificial. Preservar a arquitetura de stores existente e usar MaxPinia caso surja necessidade real de estado persistido, o que exigiria revisão de escopo. O peer MaxPinia é opcional; sua ausência no diretório instalado inspecionado não é, por si, um defeito.
- `goToRoute` já vem de `@maxvue/max-use`; preservar esse helper. Pacote instalado inspecionado: `1.1.47`. Não há novo helper necessário.
- Manifesto e lockfile apontam Vue `3.6.0-rc.10`; documentação oficial consultada cobre a API Vue 3 de props booleanas e `withDefaults`, sem garantia específica da versão RC. Confirmar compilação na execução.
- Nenhuma nova chamada externa, contrato HTTP, esquema de banco ou migração.

## 4. Plano de Execução Faseado

1. **Admissão por leitura:** conferir worktree, alterações locais, scripts/prehooks, resolução efetiva das dependências e isolamento do harness. Se houver integridade falhada, bloquear os passos dependentes, sem contornar os gates.
2. **Contrato e implementação:** acrescentar prop/tipagem/default/classe/SCSS; preservar eventos, fallback e dimensões não verticais. Adequar as tags de abertura do componente tocado à regra de linha única.
3. **Testes do bloco:** expandir testes unitários e criar teste de navegador real; concluir todos os arquivos do escopo antes de iniciar a rodada de validação.
4. **Documentação e demonstração:** atualizar apenas seção pertinente de `COMPONENTS.md` e bloco de `MaxButton` no playground. Mostrar padrão e compacto lado a lado, inclusive com ícone e tamanhos.
5. **Validação agrupada e revisão:** executar gates descritos no plano, diagnosticar falhas por lote e revalidar apenas resultados invalidados ou falhados. Registrar pendência manual se navegador/playground não puder ser validado.
6. **Handoff:** resumir evidências, falhas e pendências; preservar a worktree. Integração/publicação só com pedido explícito posterior.

## 5. Critérios de Aceite & Validação

1. Prop booleana pública aceita omissão, `true`, `false`, presença no template e alteração reativa; não vaza como atributo HTML no botão.
2. Sem `slim` ou com `false`, classes e geometria mantêm o comportamento atual.
3. Em pares de botões idênticos, livres de dimensões externas forçadas e de esticamento pelo contêiner, `slim=true` reduz a altura para tamanhos padrão/pequeno/grande, preservando fonte, padding horizontal, largura intrínseca e dimensão do ícone.
4. `link` e fallback somente ícone não mudam de geometria; o texto via slot aceita compactação.
5. Carregamento/desabilitado, tipo HTML, clique, rota e ação mantêm os contratos atuais. Foco por teclado permanece visível, sem recorte de texto/ícone em temas claro/escuro e zoom de 200%.
6. Documentação informa padrão, sintaxe, diferença em relação a `size`, limite de altura e exceções de link/fallback. Playground permite comparar visualmente.
7. Gates futuros: `npm run check:lockfile`, `npm run test`, `npm run type-check:test`, `npm run lint`, `npm run build` (já inclui tipos do fonte), `npm run test:browser` e `npm run check:playground:bundle` (já inclui build do playground); executar somente após autorização de Execute e preflight pertinente. Não repetir `type-check` ou build do playground separadamente na mesma revisão aprovada. Procedimento manual via `npm run dev:playground` quando ambiente isolado permitir.
8. Para eventual release, o projeto exige `npm run verify`; não executar publicação nem repetir gates equivalentes aprovados da mesma revisão sem justificativa.

**Limitações atuais:** leitura não comprova sucesso de testes, compilação, resolução única de todas as dependências, disponibilidade do Chromium ou aparência real. Não houve execução de preflight, testes, build ou servidor nesta sessão. O detalhamento operacional e a matriz de aceite estão em `plan.md`.
