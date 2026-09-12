# MaxInputIconPicker trava fila acima de 200 e aceita resposta obsoleta

## Resumo
O scheduler processa só o primeiro lote de 200 SVGs e sua tentativa de reagendamento retorna antes de criar timer. Em paralelo, buscas de catálogo não têm identidade/cancelamento e uma resposta antiga pode sobrescrever a consulta nova.

## Severidade e prioridade
**Alta / P1.** Catálogos grandes ficam incompletos e resultados de busca podem regredir visualmente.

## Evidências
- `MaxInputIconPicker.vue:217-245`: após `splice(0, 200)`, linha 243 chama `enqueueSvgFetch([])`; a linha 219 retorna porque `pending.length===0`, deixando o restante parado.
- `:283-299`: `fetchCuratedIcons` não verifica `res.ok`, request id ou AbortController.
- `:301-313,321-330`: abertura e busca debounced podem sobrepor requests.
- `:337-343`: unmount cancela timer/fila, não fetch em andamento.
- Testes existentes exercitam cleanup com dois nomes, não 201 nem ordem invertida.

## Afetados
`MaxInputIconPicker`, endpoint de lista/SVG e catálogos com mais de 200 ícones pendentes.

## Causa-raiz
Fila usa a função de entrada (que exige novos nomes) para drenar backlog e requisições de catálogo não têm token de geração.

## Impacto
SVGs depois do índice 200 ficam vazios até evento externo reativar a fila. Busca lenta antiga substitui lista nova e pode desligar loading enquanto request atual segue aberta.

## Reprodução
Enfileirar 201 nomes com fake timers: só um POST ocorre. Criar Promises diferidas para `q=ab` e `q=abc`, resolver `abc` antes de `ab`: resultado termina em `ab`.

## Direção de correção
Separar `scheduleDrain()` de `enqueue`, drenar até fila vazia com limites; usar AbortController/request id, validar status HTTP e ignorar finalizações obsoletas.

## Critérios de aceite
- 201 nomes geram dois lotes sem estímulo adicional.
- Resposta antiga nunca altera lista/loading atuais.
- Unmount aborta requests.
- Erros HTTP não são tratados como JSON válido.

## Contraevidências consideradas
Preload inicial normalmente solicita menos de 200 e SVGs recebidos são sanitizados; isso reduz frequência/XSS, não corrige scheduler ou ordenação.
