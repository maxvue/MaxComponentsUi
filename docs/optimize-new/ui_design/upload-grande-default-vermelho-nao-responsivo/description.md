# Estado padrão do upload grande mantém fundo vermelho de depuração e dimensão fixa

## Resumo

Os estados de progresso e erro do `MaxInputFileUploadBig` usam animações externas de 300×300 px com `background="red"`. Sem clamp responsivo, podem transbordar e introduzem uma superfície vermelha não semântica até durante upload normal.

## Severidade e prioridade

- Severidade: média
- Prioridade: P2

## Evidências

- `src/components/MaxInputFileUploadBig.vue:21-39`: Lotties remotos, 300 px inline, fundo vermelho e autoplay.
- `src/components/MaxInputFileUploadBig.vue:130-140` e `182-190`: raiz fluida e centralização sem limite da animação.
- Testes substituem `DotLottieVue` por stub e não exercitam fundo, rede ou overflow.

## Componentes e consumidores afetados

Default de progresso/erro de `MaxInputFileUploadBig`, sobretudo em cards e viewports abaixo de 300 px.

## Causa-raiz

Atributos de demonstração/depuração e assets externos foram promovidos ao default público sem tokens, responsividade ou política de movimento.

## Impacto visual e funcional

Bloco vermelho alheio à identidade, overflow e estado vazio se o host falhar; o loop ignora movimento reduzido.

## Reprodução e verificação

Renderizar `uploading=true` em 240 px; observar canvas 300 px/fundo vermelho. Bloquear `lottie.host` e ativar `prefers-reduced-motion`.

## Direção recomendada

Usar asset local ou ícone/spinner tokenizado, remover fundo de depuração, limitar por `max-inline-size: 100%` e respeitar redução de movimento.

## Critérios de aceite

- Sem fundo vermelho ou URL externa para feedback essencial.
- Sem overflow em 240 px.
- Loading/erro distinguíveis em claro/escuro e com movimento reduzido.

## Contraevidências consideradas

Slots permitem substituir os estados, mas o default público precisa funcionar sem customização.
