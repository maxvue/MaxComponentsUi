# Plano de implementação — canonicalizar o modelo espelhado

## Objetivo e resultado

Eliminar o eco de `update:modelValue` quando `transform` muda a representação e o pai devolve o valor canônico, sem alterar os três consumidores atuais. Um round-trip equivalente deve emitir uma vez; mudança externa genuína deve atualizar o ref local.

## Escopo e fora de escopo

- Corrigir e documentar o contrato interno de `useMirroredModel`.
- Cobrir transformação, comparação, emissão imediata e sincronização externa.
- Revalidar `MaxInputCep`, `MaxInputCpfCnpj` e `MaxInputTextList`.
- Não exportar o helper publicamente nem refatorar outros modelos nesta entrega.
- Não mudar máscaras, payloads ou a semântica `immediateRaised` dos consumidores.

## Arquivos

- Alterar `src/helpers/useMirroredModel.ts`.
- Alterar `tests/helpers/useMirroredModel.test.ts`.
- Ajustar testes dos três consumidores somente se necessário para explicitar compatibilidade.

## Dependências e ordem

1. Fixar testes do eco e de mudanças externas.
2. Implementar rastreamento canônico no helper.
3. Revalidar os consumidores e documentação inline.

## Passos

1. Reproduzir com valor local `abc`, `transform` uppercase e round-trip externo `ABC`; exigir uma única emissão `ABC`.
2. Registrar o último valor canônico emitido e, no watcher externo, comparar a nova prop tanto com o local quanto com esse canônico usando `compare`.
3. Ao aceitar mudança externa genuína, atualizar o local sem marcá-la como eco; sua emissão subsequente só ocorre se a transformação produzir valor semanticamente novo.
4. Atualizar o canônico antes de emitir para evitar corrida síncrona com o pai.
5. Preservar `immediate`: emissão inicial ocorre somente quando configurada e inicializa corretamente o guard.
6. Documentar que `compare` compara representações canônicas e testar transformações idempotentes/não idempotentes; rejeitar ou documentar claramente transform não idempotente.
7. Reexecutar casos de CEP (comparador por dígitos), CPF/CNPJ (normalizado/imediato) e TextList (identidade).

## Migração e compatibilidade

Mudança interna e compatível: API e tipo permanecem. Consumidores que dependessem de emissão duplicada deixam de recebê-la. Não normalizar o ref local automaticamente, pois isso alteraria texto mascarado/cursor; usar o último valor canônico como guard.

## Testes

- Unitários: identidade, uppercase+round-trip, mudança externa real, sequência local, comparador customizado, `immediate` ligado/desligado e cleanup do scope.
- Integração: digitação e atualização externa nos três consumidores, contagem/payload de emits, máscara e cursor.
- A11y/benchmark: não aplicáveis diretamente; registrar que a correção reduz eventos sem mudança de DOM.

## Critérios de aceite

- Cenário uppercase emite exatamente uma vez.
- Prop equivalente ao último canônico não reemite.
- Prop diferente atualiza local e mantém no máximo uma emissão derivada.
- Testes atuais dos três consumidores passam sem casts ou mudanças de contrato.

## Riscos e rollback

Guard antigo pode suprimir mudança legítima se o canônico não for invalidado; cobrir sequências alternadas. Transform não idempotente pode não convergir; documentar restrição. Rollback é isolado ao helper e testes, restaurando implementação anterior se algum consumidor regredir.

## Validação final

Executar testes do helper e consumidores, `npm run type-check`, suíte completa, lint dos arquivos e `git diff --check`.
