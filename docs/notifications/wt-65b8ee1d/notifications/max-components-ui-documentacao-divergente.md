# MaxComponentsUi — divergências documentais fora do escopo

- Data: 13/10/2026.
- Worktree: `wt-65b8ee1d`.
- Natureza: divergências confirmadas por leitura; nenhuma correção realizada.

## 1. Configuração do plugin descrita como integração PrimeVue

**Localização:** `README.md:89–112,162–167`; `src/index.ts:284–294`.

**Evidência:** README descreve customização do PrimeVue e preset baseado em Aura. O install atual registra a diretiva tooltip e disponibiliza as opções via provide; não inicializa PrimeVue nesse fluxo.

**Impacto:** consumidores podem esperar que opções históricas configurem infraestrutura que o install atual não executa. Há risco de instruções de integração obsoletas.

**Próxima ação:** em tarefa própria, confrontar guia de configuração e exportações atuais, corrigindo somente afirmações comprovadas. Não reintroduzir dependência PrimeVue para fazer o código corresponder ao texto antigo.

## 2. Referência de tipo do botão não corresponde à interface pública

**Localização:** `docs/TYPES.md:36–56`; `src/types/index.ts:60–145`; `src/index.ts:303`.

**Evidência:** a seção documenta `ButtonProps extends BaseComponentProps`, tamanho limitado a small/large e lista de severidades sem whatsapp. O fonte exporta `MaxButtonsType extends MaxButtonBaseProps`, `size` aceita string/number/null e `ButtonSeverity` inclui whatsapp.

**Impacto:** orientação de tipagem incompleta/divergente para consumidores; dificulta distinguir API real de exemplo resumido.

**Próxima ação:** revisar a seção em tarefa documental própria; esta entrega usará a interface real e documentará slim em COMPONENTS.md, sem reescrever a referência inteira.

## 3. Altura slim de InputBase divergente no catálogo

**Localização:** `COMPONENTS.md:60–63`; `src/components/InputBase.vue:841–864`.

**Evidência:** catálogo descreve atributo slim como 22px. O seletor existente estabelece grid, altura e min-height de 20px; elementos descendentes relevantes também recebem 20px.

**Impacto:** consumidores podem dimensionar layouts com medida incorreta. Não confundir essa opção de InputBase com a nova prop proposta para MaxButton.

**Próxima ação:** validar intenção e altura renderizada em tarefa específica, depois alinhar documentação; não alterar InputBase nem sua geometria no trabalho atual.
