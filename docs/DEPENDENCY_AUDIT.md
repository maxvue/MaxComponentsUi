# Auditoria de Dependências e Tratamento de Vulnerabilidades

Este documento registra a análise de segurança, decisões sobre advisories e procedimentos de atualização das dependências do `@maxvue/max-components-ui`.

## Procedimento Canônico de Auditoria

A verificação de segurança das dependências de runtime distribuídas no pacote final deve ser executada com:

```bash
npm audit --omit=dev
```

Dependências de desenvolvimento (`devDependencies`), ferramentas de compilação e plugins do Vite não são enviadas no pacote `@maxvue/max-components-ui` distribuído no npm.

## Estado Atual dos Advisories de Produção

Com a remoção das dependências redundantes (`quill`, `oxc-parser`, `@tiptap/pm`, subpacotes `@vue/*`) e a reclassificação de `@maxvue/max-pinia` para peer dependency opcional, as dependências de produção diretas foram saneadas.

## Diretrizes de Resolução

1. **Nunca executar `npm audit fix --force`**: Comandos automáticos com `--force` atualizam versões major de forma indiscriminada, podendo causar quebras silenciosas em APIs públicas e contratos de tipos.
2. **Avaliação de Risco e Alcance**: Ao identificar um advisory nas dependências de produção:
   - Determinar se o caminho vulnerável é atingível pelo código da biblioteca.
   - Atualizar a dependência pontualmente dentro da faixa semver compatível.
   - Validar a suíte completa de testes (`npm run test`), type-checking (`npm run type-check`) e build (`npm run build`).
3. **Dependências Irmãs Locais**:
   - `@maxvue/max-use` permanece como referência local compatível durante o ciclo de desenvolvimento integrado, apontando para versão local 2.0.0.
   - `@maxvue/max-pinia` é consumido como peer dependency opcional pela aplicação final e não mais empacotado como dependência interna.
