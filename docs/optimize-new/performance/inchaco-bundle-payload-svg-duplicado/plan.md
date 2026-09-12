# Plano de implementação — SVGs do cartão fora do entry eager

## Objetivo e resultado esperado

Remover SVGs duplicados e impedir que fundos e bandeiras de `MaxCreditCard` sejam incorporados ao `index.es.js`. Os assets devem ser carregados sob demanda, com aliases apontando para um único arquivo canônico, preservando aparência, detecção de bandeira e API pública.

## Escopo e fora de escopo

### Escopo

- Deduplicar os três pares byte a byte idênticos.
- Otimizar os SVGs, priorizando `card-jcb.svg`, com regressão visual.
- Criar loaders dinâmicos explícitos para fundos e bandeiras.
- Evitar resposta assíncrona obsoleta ao trocar rapidamente `cardType`.
- Automatizar orçamento bruto, gzip e Brotli do bundle e chunks.

### Fora de escopo

- Alterar regras de detecção/formatação de cartão, props ou layout.
- Buscar logos em serviço remoto ou aceitar SVG fornecido pelo consumidor.
- Prometer ganho percentual antes da medição pós-SVGO.
- Mudar o modelo de exportação geral dos demais componentes.

## Arquivos a alterar, criar ou remover

- `src/components/MaxCreditCard.vue`: substituir imports `?raw` eager por estado e loaders assíncronos.
- `src/helpers/creditCardAssets.ts` (novo): mapa canônico de loaders, aliases e cache de promises/data URIs.
- `src/assets/credit-card/*.svg`: otimizar os 11 arquivos canônicos.
- Remover `card-american-express.svg`, `card-diners-club.svg` e `card-hiper.svg`; seus nomes continuam aceitos como aliases.
- `svgo.config.mjs` (novo): configuração reproduzível que preserve `viewBox`, IDs/referências e elementos necessários.
- `package.json` e `package-lock.json`: incluir SVGO como ferramenta de desenvolvimento e scripts de otimização/orçamento, após o reparo do lockfile.
- `tests/components/MaxCreditCard.test.ts`: adaptar expectativas ao carregamento assíncrono e cobrir cache/corridas/aliases.
- `tests/helpers/creditCardAssets.test.ts` (novo): testar resolução canônica e carregamento único.
- `scripts/check-credit-card-bundle.mjs` (novo): medir entry/chunks em bytes brutos, gzip e Brotli.
- `tests/visual/MaxCreditCard.visual.spec.ts` e baselines (novos): regressão visual de frente, verso e bandeiras, reutilizando a infraestrutura visual consolidada do projeto.

## Dependências e ordem

1. Concluir o achado do lockfile antes de adicionar ferramenta ou regenerar dependências.
2. Gerar baseline de hashes, screenshots e tamanhos atuais.
3. Deduplicar aliases sem mudar carregamento; validar testes.
4. Executar SVGO com configuração conservadora e aprovar regressão visual.
5. Introduzir loaders dinâmicos e proteção contra corrida.
6. Adicionar orçamento de bundle e validar um consumidor empacotado.

## Passos detalhados

1. Registrar, para cada SVG, hash, bytes, `viewBox`, dimensões e screenshot nas mesmas dimensões do componente.
2. Escolher `card-amex.svg`, `card-diners.svg` e `card-hipercard.svg` como arquivos canônicos; fazer `american-express`, `diners-club` e `hiper` resolverem para os mesmos loaders.
3. Remover somente as três cópias depois que o teste provar igualdade de resultado para cada alias.
4. Configurar SVGO em modo conservador, bloqueando remoções que quebrem IDs, `url(#...)`, gradientes, máscaras, `viewBox` ou proporção. Otimizar todos os canônicos e revisar especialmente JCB por imagem, não apenas por XML.
5. Em `creditCardAssets.ts`, declarar imports dinâmicos literais `import('…svg?raw')`; não usar caminho interpolado. Manter cache por asset canônico para que montagens e alternâncias repetidas não recarreguem nem reconvertam o SVG.
6. Carregar fundos quando uma instância de `MaxCreditCard` for montada e carregar somente a bandeira ativa. Assim, importar o entry sem montar o componente não solicita qualquer SVG, e selecionar Visa não solicita JCB.
7. No componente, observar `card_type`, limpar a imagem quando não houver bandeira e usar um token/contador da solicitação para impedir que um carregamento antigo sobrescreva o tipo mais recente.
8. Preservar `svgToDataUri` como conversão de assets locais confiáveis e os atributos `href`/`xlink:href`. Falha de chunk deve resultar em ausência da imagem, sem rejeição não tratada.
9. Configurar Rollup/Vite para emitir chunks dos imports dinâmicos sem embuti-los novamente no entry. Validar o artefato real, não somente o grafo fonte.
10. Fazer o script de orçamento localizar o entry e chunks por manifesto/conteúdo, computar bruto/gzip/Brotli e comparar com limites registrados após a otimização, com pequena margem explícita.

## Migração e compatibilidade

- `cardType`, detecção automática, aliases e markup final permanecem compatíveis.
- A bandeira passa a aparecer após uma operação assíncrona; manter o espaço reservado para evitar layout shift.
- O formato do SVG e da data URI não é contrato público; nomes de arquivos removidos não são exportados pelo pacote.
- Chunks dinâmicos devem permanecer em `dist` e ser incluídos pelo campo `files` atual.
- Assets são locais e controlados no build. Não aplicar sanitização de entrada remota, mas bloquear `script`, handlers `on*` e URLs externas na validação dos arquivos otimizados.

## Testes e benchmark

### Unitários e integração

- Confirmar que os três pares de aliases retornam exatamente a mesma URI e carregam um único módulo.
- Montar sem bandeira e afirmar que nenhum loader de logo é chamado.
- Selecionar Visa e afirmar que somente o loader canônico Visa é chamado; repetir e comprovar cache.
- Trocar JCB → Visa com promises resolvidas fora de ordem e afirmar que Visa permanece renderizada.
- Cobrir erro de chunk e desmontagem sem atualização tardia.
- Manter os testes de frente, verso, detecção, formatação e data URI existentes usando `flushPromises`.

### Visual e acessibilidade

- Comparar screenshots de frente/verso e das 11 bandeiras canônicas antes/depois, na mesma viewport e escala; exigir diferença de pixels dentro do limiar aprovado para antialiasing.
- Verificar JCB também em escala 1× e 2×.
- Não há novo controle interativo ou mudança semântica; executar a auditoria a11y existente e confirmar que o carregamento não introduz texto alternativo enganoso nem layout shift.

### Bundle e desempenho

- Construir a biblioteca e um consumidor mínimo que importe o entry principal.
- Medir `index.es.js`, chunks de cartão e total bruto/gzip/Brotli antes/depois.
- Inspecionar o manifesto: entry inicial não pode conter os SVGs; cenário Visa não inclui chunk JCB.
- Medir o carregamento/montagem do cartão com cache frio e quente, sem tornar tempo de parede um teste bloqueante.

## Critérios mensuráveis de aceite

- Existem 11, e não 14, arquivos de SVG de cartão; nenhum hash duplicado é publicado.
- `card-jcb.svg` fica menor que os 82.410 bytes de baseline e passa pela regressão visual.
- `index.es.js` contém zero payloads completos dos SVGs de cartão.
- Importar o pacote sem montar `MaxCreditCard` solicita zero chunks de cartão.
- Com Visa ativa, o consumidor solicita fundos e Visa, mas não JCB nem outras bandeiras.
- Cada asset canônico é carregado/converterido no máximo uma vez por sessão.
- Orçamentos bruto, gzip e Brotli ficam registrados e verificados automaticamente após `vite build`.
- Testes focados, type-check, suíte completa e build passam.

## Riscos e rollback

- **SVGO altera desenho ou referências internas:** reverter somente o asset afetado e restringir o plugin responsável.
- **Flicker no primeiro carregamento:** reservar dimensões e iniciar fundos no mount; não voltar a embutir todas as bandeiras.
- **Corrida troca a bandeira exibida:** token de solicitação e teste com resolução invertida.
- **Bundler inline os assets:** falhar o orçamento/manifesto e ajustar a estratégia de chunk antes da publicação.
- **Caminho de chunk quebra no pacote:** validar tarball instalado, não apenas `dist` local.

Rollback: restaurar temporariamente imports eager dos arquivos canônicos, mantendo a deduplicação aprovada; como não há estado persistido nem API nova, não existe migração reversa.

## Validação final

1. Conferir hashes e ausência dos três arquivos duplicados.
2. Aprovar screenshots, com atenção ao JCB e aos aliases.
3. Executar testes do helper/componente e cenários de corrida.
4. Rodar type-check, suíte completa e build.
5. Instalar o tarball em consumidor mínimo e inspecionar requisições/chunks.
6. Publicar no relatório os tamanhos bruto, gzip e Brotli antes/depois e os limites adotados.
