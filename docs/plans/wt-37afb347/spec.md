# Servidor de ícones por aplicação via ICON_SERVER

- Data: 2026-10-28.
- Projeto: `@maxvue/max-components-ui`, versão observada `1.1.36`.
- Worktree e branch: `wt-37afb347`.
- Diretório autorizado: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-37afb347`.
- Situação: especificação para revisão; nenhuma implementação ou validação executada.

## 1. Contexto & Objetivo

Permitir que cada aplicação consumidora escolha seu servidor de ícones pela variável `ICON_SERVER` do próprio `.env`, sem recompilar a biblioteca para cada cliente. O usuário confirmou expressamente que a variável pertence a cada aplicação, não ao ambiente de publicação do pacote.

Hoje o `MaxIcon` não faz sempre uma requisição ao Engeapp: consulta `useIconStore`, reaproveita cache em memória/IndexedDB e permite rotas explícitas por `configureMaxApp`. Quando necessário, a busca padrão é `https://engeapp.com.br/api/icons`; ícones ausentes ou falhas podem acionar `https://api.iconify.design`, seguidos de sincronização por POST.

**Limite técnico confirmado:** não basta acrescentar `import.meta.env.ICON_SERVER` ao código da biblioteca. O Vite substitui essas expressões ao compilar bibliotecas, e variáveis sem o prefixo público não são expostas automaticamente. A solução proposta exige uma integração inicial no Vite e no boot de cada consumidor. Depois disso, alterar o `.env` e reconstruir/reiniciar o frontend do consumidor muda o destino, reutilizando o mesmo pacote.

## 2. Escopo

### Incluído

1. Acrescentar a opção pública proposta `iconServer?: string` a `MaxAppConfig`, recebida por `configureMaxApp`.
2. Resolver os padrões de `routeIcons` e `routeIconsSync` a partir dessa opção, mantendo as rotas explícitas com prioridade.
3. Documentar como disponibilizar exclusivamente `ICON_SERVER` no frontend consumidor e repassá-la no boot.
4. Cobrir resolução, compatibilidade, GET/POST, preservação no MaxApp e consumo do pacote compilado com testes.
5. Atualizar somente a documentação de ícones pertinente, incluindo a descrição atualmente desatualizada do cache em `docs/STORES.md`.

### Fora de escopo

- Implementação nesta sessão Plan, criação de `.env`, alterações em aplicações externas, instalações, publicação, commit, merge, push ou deploy.
- Plugin Vite novo, exposição geral de variáveis de ambiente, leitura de arquivos pelo navegador ou mudança do build da biblioteca para embutir o servidor de um cliente.
- Mudanças visuais, props novas em `MaxIcon`/`MaxApp`, substituição de componentes ou reintrodução do PrimeVue.
- Migração da store especializada de ícones para outro mecanismo de GET/cache, alteração de retries, batching, sanitização, IndexedDB ou chave do cache.
- Alterar o fallback Iconify, criar/adaptar backend, mudar CORS/autenticação ou garantir disponibilidade de um servidor ainda não informado.
- Troca de servidor durante requisições em andamento, isolamento de cache por servidor e isolamento de configuração por requisição SSR. Configurar no boot.

## 3. Arquitetura & Mudanças Técnicas

### Evidências determinantes

| Arquivo existente | Evidência |
|---|---|
| `src/components/MaxIcon.vue` | Usa `useIconStore`; observa o nome do ícone e renderiza o SVG do estado. |
| `src/stores/useIcon.Store.ts` | GET em lote, fallback SVG, POST de sincronização, cache e sanitização; rotas lidas de `getMaxAppConfig`. |
| `src/helpers/maxAppConfig.ts` | Defaults fixos para GET e POST; configuração acumulativa e reset. |
| `src/types/app.ts` e `src/types/app.d.ts` | Contrato `MaxAppConfig`; a declaração também é rastreada no Git. |
| `src/components/MaxApp.vue:199-208` | Reaplica parte da configuração no setup sem poder apagar o boot. |
| `src/index.ts:359-360` | Exporta as funções públicas de configuração existentes. |
| `vite.config.ts` e `package.json` | Pacote ESM pré-compilado, múltiplos entries e export de `MaxIcon`. |
| `tests/helpers/maxAppConfig.test.ts` e `tests/stores/useIcon.Store.test.ts` | Cobrem merge/reset, rotas explícitas, fallback, POST e concorrência. |

Nenhum `.env*` foi localizado na raiz da worktree ativa. Isso não informa quais variáveis existem nos consumidores. O lockfile registra Vite `8.3.3`; a documentação oficial acessível pelo Context7 foi a da linha 8, revisão `8.0.10`, não uma verificação exata da revisão `8.3.3`.

### Contrato proposto

- `ICON_SERVER=https://icones.exemplo.com` resulta em `https://icones.exemplo.com/api/icons` para GET e POST, quando não existem overrides explícitos.
- Aceitar URL absoluta HTTP/HTTPS, espaços externos e barras finais; preservar eventual prefixo de caminho. Se já terminar em `/api/icons`, não acrescentar o sufixo novamente.
- Valor ausente, vazio ou inválido usa o padrão Engeapp. Rejeitar como inválidos protocolos diferentes, URL relativa, credenciais embutidas, query e fragmento. Não registrar o valor bruto em logs.
- Prioridade por destino: rota explícita não nula → endpoint derivado de `iconServer` válido → endpoint Engeapp. `undefined` remove o override daquela rota; o fallback é resolvido novamente. Não alterar o merge dos demais campos.
- `routeIconsSync` continua independente de `routeIcons`: informar somente uma rota GET explícita não muda silenciosamente o POST existente. Com `iconServer`, ambos os defaults são derivados dele; uma rota explícita só substitui seu próprio destino.
- `routeIconsFallback` mantém o contrato atual, inclusive o override explícito.
- Chamadas sucessivas de `configureMaxApp` preservam opções explícitas e o servidor do boot; `configureMaxApp()` é neutra. `resetMaxAppConfig()` limpa as opções acumuladas e restaura os defaults históricos.

### Implementação proposta

Manter separados os valores explicitamente configurados e o objeto efetivo devolvido por `getMaxAppConfig`. Recalcular apenas os defaults dos destinos de ícones ao aplicar opções; não usar um default já resolvido como se fosse override explícito. Concentrar normalização e resolução em `src/helpers/maxAppConfig.ts`, sem criar nova biblioteca de helpers.

Adicionar o campo e sua documentação em `src/types/app.ts`; tratar a declaração rastreada `src/types/app.d.ts` conforme o fluxo de declarações confirmado no preflight, sem editar mapas ou outros artefatos por aproximação. Os tipos distribuídos devem refletir o contrato. Não há mudança prevista em `MaxIcon.vue`, `MaxApp.vue`, na store, nos exports, nas dependências nem no Vite da biblioteca.

```text
.env do consumidor: ICON_SERVER
  → Vite do consumidor: loadEnv + define seletivo
  → boot do consumidor: configureMaxApp({ iconServer: import.meta.env.ICON_SERVER })
  → configuração efetiva: routeIcons / routeIconsSync
  → MaxIcon → useIconStore → cache ou GET → eventual Iconify → eventual POST
```

A integração documentada usará `loadEnv(mode, diretorioDoEnv, 'ICON_SERVER')`, selecionando somente `env.ICON_SERVER` e definindo somente `'import.meta.env.ICON_SERVER'` com `JSON.stringify`. Não usar `envPrefix: ''`, serialização de todo `env`, polyfill de `process.env` nem suposição de que o pacote lê o disco do consumidor. O diretório do `.env` deve ser o já adotado no consumidor, não um caminho inventado para ele.

Reutilizar MaxComponentsUi e a integração MaxPinia já adotada pelo consumidor; conservar os helpers MaxUse existentes. Não adicionar store ou chamada HTTP em componente para esta configuração. A store de ícones atual tem transporte/cache especializado em Pinia, sem `options.get` de MaxPinia; não converter esse fluxo como efeito colateral de trocar o servidor.

## 4. Plano de Execução Faseado

1. Revalidar worktree, alterações preexistentes, scripts, tipos, dependências efetivas e segurança do harness por leitura.
2. Implementar em lote o contrato `iconServer`, resolução dos defaults e documentação de API.
3. Implementar todos os testes de configuração, integração com ícones/MaxApp e pacote compilado.
4. Documentar a ligação `.env` → Vite → boot, exemplos, compatibilidade e limites operacionais.
5. Revisar contratos/segurança, executar o conjunto de gates planejado e corrigir falhas em lote.
6. Fazer aceite manual seguro em consumidor autorizado ou registrar `manualPending`; entregar sem operações Git/publicação.

Dependências e roteiro executável estão em `plan.md`, a ser elaborado após esta especificação.

## 5. Critérios de Aceite & Validação

- Sem variável, URLs e comportamento HTTP históricos permanecem iguais.
- Com um servidor válido, GET e POST usam o novo endpoint; não há envio ao Engeapp nesses dois destinos sem override explícito.
- Rotas explícitas, fallback, cache, sanitização, agrupamento, limites de tentativa e descarte da store permanecem funcionais.
- A configuração sobrevive ao setup do MaxApp; reset elimina opções anteriores.
- O mesmo pacote compilado aceita servidores diferentes passados no boot por consumidores distintos.
- A documentação não promete funcionamento só com `.env`, omite segredos e explica a integração inicial, reinício/rebuild e CORS.
- O cache existente não é automaticamente invalidado: comprovar a seleção de servidor com perfil de teste limpo ou ícone não cacheado, sem apagar dados compartilhados.

Comandos futuros confirmados no projeto: `npm run type-check`, `npm run type-check:test`, `npm run lint:check`, `npm test`. O último agrega build e suíte unitária/arquitetural; não duplicar o build. Para pré-release, `npm run verify` é obrigatório e substitui os gates parciais já contidos nele. Não executar `release`.

Aceite real do servidor externo depende de URL, ambiente autorizado, contrato GET/POST e CORS. Dublês e compilação não o comprovam. Não fazer POST de sincronização real sem autorização; pendência externa deve impedir relato de conclusão integral.

Fontes oficiais consultadas: [modo biblioteca](https://github.com/vitejs/vite/blob/v8.0.10/docs/guide/build.md), [variáveis e modos](https://github.com/vitejs/vite/blob/v8.0.10/docs/guide/env-and-mode.md) e [loadEnv/configuração](https://github.com/vitejs/vite/blob/v8.0.10/docs/config/index.md).
