# Limitação do retorno de cópia no helper reexportado

- Data: 16/10/2026. Worktree: `wt-84453aaf`.
- Natureza: risco de falso feedback de sucesso demonstrável por leitura; não reproduzido em navegador nesta sessão.

## Localização e evidência sanitizada

- `node_modules/@maxvue/max-use/package.json`: versão instalada `1.1.47`.
- `node_modules/@maxvue/max-use/dist/index.d.ts`: reexport de helpers VueUse.
- `node_modules/@vueuse/core/package.json`: versão efetiva `14.4.0`.
- `node_modules/@vueuse/core/dist/index.js:1703–1748`: `useClipboard.copy` captura rejeição da escrita e tenta cópia legada; a chamada legada não confere o retorno booleano de `execCommand`; depois define `copied=true`.
- `node_modules/@vueuse/core/dist/index.js:1767–1785`: `useClipboardItems.copy` aguarda escrita nativa e deixa a rejeição propagar, oferecendo alternativa existente.
- `MaxAiManager/resources/Vue/Sections/Dashboard/ModalReceivedRequestDetail.vue:296–310`, relativo a `/home/johnattas/GitHub/`: usa `useClipboard({ legacy: false })` e aguarda `copy` antes do feedback. O comportamento efetivo depende da versão incorporada pelo consumidor; ela não foi comprovada como idêntica ao node_modules desta biblioteca.

## Impacto

No módulo instalado observado, resolução da Promise de `useClipboard.copy` não garante escrita bem-sucedida nem ausência de fallback. Não é seguro basear um novo botão com garantia de erro/sucesso apenas em `await copy`/`copied` dessa função.

## Encaminhamento

Para o componente proposto, compor `useClipboardItems` pelo MaxUse, com verificações de contexto seguro, `clipboard.write`, `ClipboardItem` e suporte; não usar leitura do clipboard ou fallback legado. Testar sucesso/rejeição e fazer aceite nativo com texto sintético. Revalidar módulo efetivo antes da implementação.

Correção do helper/consumidores, se desejada, requer demanda própria. Nenhuma dependência ou arquivo desses projetos foi alterado. Este aviso não contém conteúdo copiado, tokens, URLs assinadas ou informações pessoais.
