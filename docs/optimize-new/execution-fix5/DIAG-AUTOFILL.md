# Diagnóstico de runtime para R04 — Autofill CDP

## Escopo

Diagnóstico somente de runtimes e capacidade DevTools; nenhum código de
produção, teste Vitest, build ou matriz foi alterado. As sondas usaram perfis
temporários em `/tmp` e servidores HTTP efêmeros fora do repositório.

## Resultado

**Há um runtime local capaz de executar autofill real via CDP.** O bloqueio
não é geral ao ambiente: ele é específico ao Chromium 153 que o Playwright
seleciona por padrão neste worktree (`chromium-1243`,
`HeadlessChrome/153.0.8010.12`).

O binário recomendado para a revalidação é:

```text
/home/johnattas/.cache/selenium/chrome/linux64/151.0.7922.76/chrome
```

Ele iniciou em `--headless=new` e respondeu como
`Chrome/151.0.7922.76` / `HeadlessChrome/151.0.0.0`. O fluxo abaixo foi
executado contra uma página HTTP local contendo campos reais
`autocomplete="given-name"` e `autocomplete="email"`:

1. `Autofill.enable` → `{}`;
2. `Autofill.setAddresses` → `{}`;
3. `Autofill.trigger({ fieldId, address })` → `{}`;
4. evento CDP recebido: `Autofill.addressFormFilled`;
5. leitura posterior do DOM → `{"first":"Ada","email":"ada@example.test"}`.

Portanto o preenchimento foi realizado pelo subsistema Autofill do Chrome,
não por `locator.fill`, `userEvent`, atribuição de `.value` ou um evento
`input` sintético.

## Evidência de versões e capacidade

O comando abaixo foi usado para cada binário, sempre com porta e
`--user-data-dir` temporários:

```bash
"$BROWSER" --headless=new --no-sandbox --disable-gpu \
  --remote-debugging-port="$PORT" --user-data-dir="$PROFILE" about:blank
```

Em seguida, uma sessão WebSocket em `/json/list` chamou
`Browser.getVersion`, `Schema.getDomains` e `Autofill.enable`.

| Runtime | Produto | `Autofill.enable` |
| --- | --- | --- |
| Playwright `chromium-1243` | `Chrome/153.0.8010.12` | erro: `'Autofill.enable' wasn't found` |
| Chrome do sistema | `Chrome/153.0.8010.36` | erro: `'Autofill.enable' wasn't found` |
| Puppeteer Chrome 131 | `Chrome/131.0.6778.204` | sucesso |
| Puppeteer Chrome 143 | `Chrome/143.0.7499.169` | sucesso |
| Puppeteer Chrome 146 | `Chrome/146.0.7680.153` | sucesso |
| Puppeteer Chrome 147 | `Chrome/147.0.7727.57` | sucesso |
| Puppeteer Chrome 148 | `Chrome/148.0.7778.97` | sucesso |
| Puppeteer Chrome 149 | `Chrome/149.0.7827.22` | sucesso |
| Puppeteer Chrome 150 | `Chrome/150.0.7871.24` | sucesso |
| Selenium Chrome 151 | `Chrome/151.0.7922.76` | sucesso e `trigger` real comprovado |

`Schema.getDomains` não listou `Autofill` nem nos Chromes que o aceitaram;
logo essa lista não deve ser usada como critério negativo. A chamada de
capacidade é `Autofill.enable`, e a prova funcional é
`Autofill.trigger` mais o evento e os valores resultantes.

As declarações do Playwright 1.63.0 já incluem `Autofill.enable`,
`Autofill.setAddresses`, `Autofill.trigger` e
`Autofill.addressFormFilled` em
`node_modules/playwright-core/types/protocol.d.ts` (linhas 1349–1513 e
23337–23340); não é necessário atualizar a dependência para falar CDP.

## Roteiro para a implementação/revalidação de R04

O teste de integração existente pode lançar explicitamente o binário capaz:

```ts
browser = await chromium.launch({
    headless: true,
    executablePath: '/home/johnattas/.cache/selenium/chrome/linux64/151.0.7922.76/chrome'
});
```

Para uma página HTTP servida pelo Vite já existente no teste:

1. monte a fixture de formulário real e aguarde o input;
2. abra `page.context().newCDPSession(page)`;
3. use `DOM.getDocument`, `DOM.querySelector` e `DOM.describeNode` para
   obter o `backendNodeId` do campo âncora;
4. obtenha o `frameId` via `Page.getFrameTree`;
5. chame `Autofill.enable`;
6. chame `Autofill.trigger` com `fieldId`, `frameId` e `address` **na própria
   chamada**; `setAddresses` isoladamente não torna `address` opcional para
   `trigger` neste runtime;
7. espere `Autofill.addressFormFilled` e verifique os valores/form submit sem
   chamar `focus()`, `fill()`, atribuir `.value` ou despachar `input`.

Exemplo mínimo do comando funcional observado:

```ts
await session.send('Autofill.trigger', {
    fieldId: backendNodeId,
    frameId,
    address: {
        fields: [
            { name: 'NAME_FIRST', value: 'Ada' },
            { name: 'EMAIL_ADDRESS', value: 'ada@example.test' }
        ]
    }
});
```

O teste deve preservar a matriz de 25 famílias já existente e acrescentar a
prova CDP real aos campos textuais/compatíveis com perfil. Controles compostos
que declaram `autocomplete="off"` não devem ser artificialmente tratados como
campos de perfil; seus contratos nativos de owner, `FormData`, `required` e
`disabled` continuam cobertos pela matriz atual.

## Limites e cuidado de reprodutibilidade

O binário Selenium 151 é um artefato local de cache, não uma dependência
fixada no `package-lock`. Antes de promover R04/GATE5-INPUTS-FORMS como aceito,
a alteração deve tornar a escolha do executável explícita e falhar com mensagem
clara quando ele não existir, ou provisionar uma versão equivalente de forma
reprodutível no projeto/CI. Não se deve reclassificar a sonda atual do Chrome
153 como autofill: ela só comprova a ausência do domínio naquele runtime.
