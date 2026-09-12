# `loadOptions` do select aceita requisições concorrentes e obsoletas

## Resumo

O select aguarda `loadOptions` antes de marcar o overlay como aberto e não bloqueia reentrada. Cliques/teclas repetidos podem iniciar várias cargas; uma resposta antiga pode sobrescrever a mais nova.

## Severidade e prioridade

- Severidade: média.
- Prioridade: P2.

## Evidências

- `src/components/MaxInputSelect.vue:486-495`: toda chamada inicia `loadOptions`, sem request ID, deduplicação ou cancelamento.
- `src/components/MaxInputSelect.vue:498-504`: `isOpen` só se torna `true` depois do `await`; durante a espera, novas chamadas percorrem novamente o ramo fechado.
- `tests/components/MaxInputSelect.test.ts:74-93,109-116` cobre uma promessa, não reentrada nem ordem inversa de resolução.

## Componentes afetados

`MaxInputSelect` com `loadOptions`, especialmente fontes remotas ou lentas.

## Causa-raiz

O booleano `loading` é apenas informativo e não participa da máquina de estados. A abertura e a versão da requisição não são coordenadas, portanto qualquer resolução tem permissão para publicar resultado.

## Impacto quantificado

`k` ativações antes da primeira resolução iniciam `k` chamadas concorrentes. O tráfego, parse e atualizações reativas podem crescer `k` vezes; a última resposta cronológica, não a última solicitação, vence.

## Reprodução e benchmark

Fornecer `loadOptions` controlado por duas promises; acionar `toggle` duas vezes; resolver a segunda antes da primeira; contar chamadas e observar qual coleção permanece. Medir requests e renders.

## Direção de solução

Formalizar estados `closed/loading/open`, bloquear ou deduplicar reentrada e aceitar somente a resposta da geração atual; oferecer `AbortSignal` quando possível.

## Critérios de aceite

- Ativações repetidas durante loading não criam trabalho duplicado.
- Resposta obsoleta nunca sobrescreve dados atuais.
- Fechar/unmount invalida resultado pendente.
- Testes cobrem reentrada, resolução inversa, rejeição e unmount.

## Contraevidências

- Fontes síncronas ou instantâneas reduzem a janela da corrida.
- Há estado visual `loading`; o defeito é ele não governar reentrada/publicação.
