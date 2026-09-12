# Playground mascara a identidade canônica e não permite validar tema escuro

## Resumo

A vitrine principal substitui a tipografia, paleta, raios, sombras e densidade da biblioteca por uma composição roxa genérica. Ela não oferece matriz clara/escura e usa estilos inline em demonstrações. Assim, não serve para detectar regressões da identidade definida no GEMINI.

## Severidade e prioridade

- Severidade: média
- Prioridade: P2

## Evidências

- `playground/src/App.vue:547-555`: fonte de sistema e gradiente `#667eea/#764ba2` substituem Quicksand e o teal Max.
- `playground/src/App.vue:579-590`: cards brancos com raio 12 px, sombra ampla e divisores roxos criam outra linguagem visual.
- `playground/src/App.vue:46`, `323-379`: exemplos contêm cores, dimensões e sombras inline próprias.
- Não há cenário/controle `.dark` no playground, embora a biblioteca tenha tokens de tema escuro.
- O próprio GEMINI registra que o playground cobre só uma fração dos componentes e não é referência canônica.

## Componentes e consumidores afetados

Processo de revisão dos 113 componentes, desenvolvimento manual, triagem de regressões de tema e documentação visual para consumidores.

## Causa-raiz

O playground cresceu como página ad hoc de testes manuais, não como catálogo do design system. Seus estilos de shell não derivam dos tokens distribuídos e os casos foram adicionados sem matriz sistemática de estados.

## Impacto visual e funcional

Revisores podem aprovar inconsistências porque o shell altera percepção de cor, tipografia e elevação. Falhas de dark mode, responsividade, foco e densidade ficam sem percurso reproduzível central.

## Reprodução e verificação

Executar `npm run dev:playground`, comparar fonte/paleta computadas com `src/themes/font.scss` e `src/themes/tokens.scss`, e procurar um fluxo que alterne o catálogo inteiro para `.dark`.

## Direção recomendada

Transformar a vitrine em matriz de identidade: shell tokenizado, alternância claro/escuro, viewport estreito/largo e estados neutro/hover/focus/disabled/loading/error por família. Manter áreas experimentais claramente separadas da referência canônica.

## Critérios de aceite

- Shell usa tokens e tipografia distribuídos pela biblioteca.
- Todos os componentes possuem ao menos um cenário representativo, com famílias críticas cobrindo estados e temas.
- Há alternância de tema e viewport sem editar código.
- Exemplos não introduzem cores de marca concorrentes sem rotulá-las como dados de usuário.

## Contraevidências consideradas

- Playground não precisa ser documentação pública nem teste automatizado; ainda assim, é hoje a única vitrine integrada e sua divergência reduz a capacidade de auditoria manual.
- A cor `#6366f1` passada ao color picker é dado demonstrativo válido; o problema é o shell inteiro assumir essa paleta.
