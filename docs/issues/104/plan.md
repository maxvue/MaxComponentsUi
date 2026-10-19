# Plano de execução — Issue #104

## Descrição e Causa Raiz

**Veracidade: bug confirmado por inspeção estática da revisão atual.** A prop `dateFormat` existe, mas não participa da exibição, da máscara nem da interpretação da digitação. Não foi executada reprodução em navegador nesta etapa; as evidências abaixo estabelecem diretamente o caminho que ignora a configuração. Apenas este plano é alterado nesta etapa.

### Causa Raiz Comprovada

- `COMPONENTS.md:L474-491` promete um formato configurável, com padrão `dd/mm/yy` e sintaxe PrimeVue; também descreve indevidamente o componente como baseado em PrimeVue.
- `src/components/MaxInputDatePicker.vue:L271-295` declara `dateFormat?: string`, sem valor padrão explícito e sem consumo no componente. Não há uma implementação pré-existente de formatação configurável nesse arquivo.
- `src/components/MaxInputDatePicker.vue:L12-29` conecta o input a `displayValue`, `maskValue` e aos handlers, mas fixa o placeholder em `dd/mm/aaaa` quando não há override.
- `src/components/MaxInputDatePicker.vue:L187-192` fixa a máscara em `##/##/####`.
- `src/components/MaxInputDatePicker.vue:L429-461` interpreta o valor externo e escreve a exibição em dia/mês/ano, nas linhas 447–451, sem consultar a prop.
- `src/components/MaxInputDatePicker.vue:L463-479` repete essa formatação no caminho inverso, nas linhas 471–475. A serialização do modelo, separada, usa `YYYY-MM-DD HH:mm:ss` nas linhas 477–478.
- `src/components/MaxInputDatePicker.vue:L725-758` pressupõe oito dígitos em ordem dia, mês e ano nas linhas 736–740. Trocar somente o formatador deixaria a edição incompatível com o texto exibido.
- `src/components/InputBase.vue:L338-359` fornece atributos de identificação, acessibilidade e estado ao controle; não interpreta nem formata datas. O repasse de `props` ao wrapper não implementa `dateFormat` indiretamente.

**Fluxo causal e rastreamento reverso:** consumidor entrega `modelValue` e `dateFormat` → watcher de `modelValue` → `parseDateValue` (`MaxInputDatePicker.vue:L339-402`) → `internalDate` → formatação fixa → `displayValue` → input com máscara fixa. No sentido contrário: digitação → `onInput` com posições fixas → `internalDate`; calendário (`L633-636`) ou Hoje (`L596-604`) também atualizam `internalDate` → watcher → texto fixo e emissão do modelo canônico. A configuração não é lida em nenhuma transformação. Não há Store, API/Rotas, Controller/Service ou DB nesse fluxo local da biblioteca; essas camadas pertencem eventualmente ao consumidor e não são necessárias à correção.

**Cenário determinístico derivado do código:** montar com `modelValue="2024-06-15"` e `dateFormat="yy-mm-dd"`. O contrato desejado exige `2024-06-15`, mas o watcher escreve `15/06/2024`; a máscara e o placeholder continuam brasileiros. Atualizar apenas `dateFormat` também não reexecuta um watcher dependente exclusivamente de `modelValue`. `tests/components/MaxInputDatePicker.test.ts:L136-155` cobre o comportamento brasileiro, mas não exercita formatos alternativos; os dois arquivos específicos de testes lidos não contêm cobertura de `dateFormat`.

**Agravantes:** divergência silenciosa entre API e documentação; possível inversão de dia/mês na futura edição se apenas o display for corrigido; confusão entre tokens PrimeVue e tokens do serializador; risco de modificar o valor persistido ao tratar uma opção exclusivamente visual.

## Arquivos afetados

Na execução futura:

1. `src/components/MaxInputDatePicker.vue`: integrar configuração reativa de exibição, máscara, placeholder e parsing da edição.
2. `src/helpers/datePickerFormat.ts` (novo, interno): resolver o formato efetivo e centralizar formatação, máscara e interpretação estrita do texto.
3. `tests/helpers/datePickerFormat.test.ts` (novo): contrato do helper, formatos aceitos e rejeição de entradas inválidas.
4. `tests/components/MaxInputDatePicker.test.ts`: regressões de montagem, atualização de props, entrada manual, seleção e emissão.
5. `tests/browser/datePickerFormat.browser.ts` (novo): interação real com o input e a diretiva Maska, sem mockar a máscara.
6. `COMPONENTS.md`: atualizar somente a seção do DatePicker, removendo promessas de dependência/props genéricas do PrimeVue e documentando o contrato efetivamente suportado.

`tests/unit/MaxInputDatePicker.spec.ts` será executado como não-regressão, sem alteração prevista. Não alterar exports, resolver, dependências, lockfile, stores ou componentes de intervalo/referência. O artefato desta etapa é exclusivamente `docs/issues/104/plan.md`.

## Execuções propostas

1. **Fixar um contrato numérico explícito antes de implementar.** Preservar `dateFormat?: string` e adotar `dd/mm/yy` como padrão efetivo. Nesta correção, aceitar uma ocorrência de cada token `dd` (dia com dois dígitos), `mm` (mês com dois dígitos) e `yy` (ano com quatro dígitos, semântica legada PrimeVue), em qualquer ordem, separados por `/`, `-` ou `.`, com o mesmo separador nas duas posições. Exemplos: `dd/mm/yy`, `mm/dd/yy`, `yy-mm-dd`, `dd.mm.yy`. A lista de possibilidades é essa gramática, não a sintaxe completa do PrimeVue nem tokens Day.js. Ausência, string vazia e formatos fora da gramática usam integralmente o padrão brasileiro, sem exceção ou warning. Essa limitação precisa aparecer expressamente na documentação: nomes de meses, anos de dois dígitos, tokens de largura variável, hora e literais livres ficam fora do escopo, em vez de prometer suporte inexistente.
2. **Criar um helper puro e interno.** Resolver uma descrição tipada dos três campos e seu separador; derivar dela máscara numérica, placeholder (`dd/mm/aaaa`, `mm/dd/aaaa`, `aaaa-mm-dd`, conforme a ordem), formatação local de `Date` e parsing estrito. Evitar substituições sucessivas de strings que confundam tokens. Validar dia/mês/ano com reconstrução local e comparação dos campos, preservando o intervalo atual de anos 1000–9999. Texto incompleto ou inválido retorna `null`, nunca passa por `new Date(texto)` ou interpretação regional ambígua. Não exportar pelo entry público.
3. **Integrar uma configuração reativa única.** Depois de inicializar `props`, resolver o formato efetivo em `computed` e reutilizá-lo na máscara, no placeholder e nas transformações. Preservar `props.placeholder ?? placeholderDerivado`, inclusive placeholder explicitamente vazio. Substituir somente os blocos de formatação fixa por uma mesma função. Garantir ordem de inicialização segura para watchers imediatos.
4. **Separar apresentação e transporte.** Preservar `parseDateValue` para `modelValue`, `minDate` e `maxDate`, inclusive entradas `Date`, timestamp e strings brasileiras/ISO já aceitas. Não reinterpretar essas strings segundo a ordem visual. A entrada manual usa exclusivamente o parser do formato efetivo; não aplicar `useDateFormat` diretamente aos tokens legados. Preservar a emissão `YYYY-MM-DD HH:mm:ss`, horário existente, calendário local e limpeza com `''`.
5. **Cobrir mudanças de prop sem efeitos no modelo.** Observar o formato efetivo e reformatar a data válida selecionada mesmo quando seu timestamp não mudou. Alterar apenas `dateFormat` não deve emitir atualização de modelo nem mudar dia, mês, ano ou hora. Se houver texto parcial/inválido na troca de formato, descartá-lo visualmente sem criar data ou emitir valor adicional; manter o estado vazio/inválido já existente. Não introduzir novos comportamentos gerais de validação ou foco.
6. **Tornar a edição coerente.** Substituir o fatiamento fixo em `onInput` pelo parser do formato ativo, mantendo rejeição de datas impossíveis e de valores fora de `minDate`/`maxDate`. Manter os caminhos `input` e `change` consistentes, sem emissões duplicadas ou ciclos de watchers/Maska. Seleção de dia e Hoje devem atualizar a exibição no formato ativo, inclusive ao selecionar novamente a mesma data depois de editar o campo. Limpar continua esvaziando texto e modelo.
7. **Alinhar documentação e comentários.** Documentar padrão, gramática numérica, exemplos, fallback e distinção exibição/modelo; atualizar o comentário de `dateFormat` em português. Remover a alegação de implementação em PrimeVue e de suporte automático a todas as suas props, sem reintroduzir qualquer dependência. Usar tags de abertura em uma linha no código/documentação tocados, sem reformatação ampla do componente.
8. **Concluir todo o bloco e seus testes antes dos gates.** Não implementar este plano durante a etapa de planejamento. Na execução autorizada, usar a worktree dedicada, preservar código alheio e não fazer commit, push, merge ou publicação sem solicitação explícita.

## Testes de regressão e validação em lote

- **Helper parametrizado:** todas as seis ordens de `dd`, `mm`, `yy` e os três separadores; máscara e placeholder correspondentes; ida e volta com uma data não ambígua e uma ambígua (`04/05/2024`); ano bissexto válido e inválido, dia zero, mês 13, 31 de fevereiro, ano fora do intervalo, entrada parcial e caracteres excedentes. Formatos inválidos, repetidos, incompletos, vazios e tokens Day.js devem selecionar o fallback brasileiro de forma consistente.
- **Componente:** manter testes existentes sem enfraquecer asserções; verificar padrão omitido e explícito; montar com `Date` e string ISO sob `yy-mm-dd`, `mm/dd/yy` e `dd.mm.yy`; atualizar modelo externo; trocar somente o formato preservando data/hora e sem novas emissões; placeholder derivado e override; fallback; troca com campo vazio ou parcial; edição manual e evento `change`; selecionar um dia, selecionar novamente a data atual, Hoje e Limpar no formato ativo. Para interações que alteram a data, exigir payload canônico exato, não apenas uma regex parcial.
- **Não-regressão:** entradas legadas brasileiras/ISO e horários permanecem aceitos independentemente do formato; `minDate`/`maxDate` inclusivos continuam bloqueando digitação e seleção fora do intervalo; obrigatoriedade ao blur, estado disabled, navegação por teclado, Escape, atributos ARIA e fechamento do overlay permanecem funcionais. Preservar testes de ausência de PrimeVue.
- **Navegador real:** em `datePickerFormat.browser.ts`, montar com Pinia e limpar/desmontar fixtures; usar eventos reais de digitação/colagem e seleção, verificando valor final do input e payload. Exercitar `yy-mm-dd`, `mm/dd/yy`, retorno ao padrão e limpeza, para detectar interferência da máscara e reatividade que testes de helpers não revelam.
- **Fluxo de lote:** implementar todo o conjunto e os testes; executar os gates uma vez; diagnosticar falhas e corrigi-las em lote; revalidar somente após concluir as correções. Não executar testes/tipos/build a cada microedição e não corrigir falhas de baseline sem estabelecer causalidade e autorização. Não há testes, tipos ou build executados nesta etapa documental.

## Banco de dados

Nenhuma. Não existem persistência, migration ou alteração de schema envolvidos; o contrato de saída permanece inalterado.

## Riscos de quebra e Não-Regressão

| Risco | Proteção exigida |
|---|---|
| Confundir `yy` legado com ano de dois dígitos ou token Day.js | Testar explicitamente quatro dígitos e documentar a gramática; não repassar tokens crus ao serializador. |
| Consumidores hoje passam formatos ignorados | Preservar tipo da prop e fallback brasileiro para formatos não suportados; destacar que formatos numéricos válidos passam a produzir efeito. |
| Inverter dia/mês ou alterar conteúdo enviado ao backend | Separar parser visual do parser externo e testar datas ambíguas com payload exato. |
| Alterar horário ou dia por UTC | Formatar/interpretar campos locais, sem `toISOString`; testar data com horário e repetir o lote focal em fuso negativo. |
| Watchers/Maska apagam texto, duplicam emissão ou deixam display antigo | Testar mudança de formato, seleção da mesma data, digitação incremental, colagem e feedback de um consumidor com `v-model` real. |
| Refatoração do input quebra acessibilidade ou intervalo | Executar suites existentes e matriz de navegador de InputBase, preservando contratos ARIA e limites. |
| A documentação continuar prometendo PrimeVue completo | Revisar a seção completa e registrar explicitamente suporte numérico limitado e fallback. |

Não remover classes legadas, não modificar o shell de formulário, não alterar idioma do calendário e não ampliar para suporte a hora, localização completa ou novas props. Qualquer futura expansão dessa gramática exige escopo e testes próprios.

## Validação

Após a implementação completa, executar o lote focal:

```bash
npx vitest run tests/helpers/datePickerFormat.test.ts tests/components/MaxInputDatePicker.test.ts tests/unit/MaxInputDatePicker.spec.ts
npm run test:browser -- tests/browser/datePickerFormat.browser.ts tests/browser/inputBaseMatrix.browser.ts
npm run type-check
npm run type-check:test
npm run lint
npm run build
```

A prova central é uma regressão que monta o componente com `modelValue: '2024-06-15'` e `dateFormat: 'yy-mm-dd'` e exige `input.value === '2024-06-15'`; depois digita/seleciona outra data e exige simultaneamente exibição configurada e emissão exata `YYYY-MM-DD HH:mm:ss`. No código atual, a primeira asserção falharia pelo bloco fixo comprovado acima. Também exigir que trocar somente `dateFormat` não altere o modelo nem emita evento novo. Não considerar somente a existência da prop ou uma captura de tela como prova.

Reexecutar o comando focal com `TZ=America/Sao_Paulo` para verificar calendário local. Se o destino for integração/release, usar `npm run verify` como gate completo **em vez de repetir seus componentes isolados na mesma revisão**; ele inclui runtime/cobertura, navegador, benchmarks, consumidores, integridade e segurança. Não tratar o lote focal como substituto do gate de release. Registrar comandos, códigos de saída e limitações reais, sem declarar aprovação de verificações não executadas.

## Skills Aplicáveis

- `vue-debugging-best-practices`: rastrear props, refs, computed e watchers sem efeitos laterais indevidos.
- `vue-components` e `vue-typescript-best-practices`: implementação Composition API tipada e preservação do contrato do componente.
- `vue-dayjs-date-manipulation-best-practices`: manter separadas as convenções do serializador e os tokens visuais legados, sem converter o modelo para UTC.
- `vitest-skill` e `javascript-testing-patterns`: regressões parametrizadas, eventos, isolamento e asserções do modelo.
- `browser-automation`: interação real resiliente para validar Maska e sincronização no navegador.
- `vue-eslint-stylelint-quality-standards`: estilo obrigatório do projeto nos trechos alterados.
- `technical-documentation-best-practices`: documentação fiel ao contrato implementado.
- `code-review`: revisão final do diff, retrocompatibilidade e evidências antes de integração.

As skills acima estão disponíveis nesta sessão; aplicar as pertinentes durante a execução. Não pressupor skills de nomes meramente exemplificativos que não estejam disponíveis. Planejamento concluído sem mudança de código-fonte, sem commit e sem integração.
