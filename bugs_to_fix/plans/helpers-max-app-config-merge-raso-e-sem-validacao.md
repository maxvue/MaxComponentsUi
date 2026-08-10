# `configureMaxApp()` sobrescreve toda a configuração a cada chamada e não valida entrada

- **Categoria:** falha
- **Severidade:** baixa
- **Arquivo(s):** `src/helpers/maxAppConfig.ts:33-35`, `:40-42`
- **Domínio:** helpers-composables

## Problema

```ts
// src/helpers/maxAppConfig.ts:33-35
export function configureMaxApp(options: MaxAppConfig = {}): void {
    config = { ...DEFAULT_CONFIG, ...options };
}
```

Cada chamada **descarta** a configuração anterior e reconstrói a partir dos defaults. Duas chamadas parciais não se acumulam:

```ts
configureMaxApp({ routeUser: 'me' });
configureMaxApp({ routeLogin: 'auth.login' }); // routeUser volta a 'user.data'
```

O JSDoc (linhas 26-28) diz que a função *"deve ser chamada no boot da aplicação"*, o que sugere chamada única — mas nada impede nem avisa sobre a segunda chamada, e o nome `configure` não deixa óbvio que é substituição total, não merge incremental. Em uma app com múltiplos módulos de boot (padrão comum em plugins Vue), o segundo `configureMaxApp` apaga o primeiro silenciosamente.

Dois pontos menores no mesmo arquivo:

1. **`getMaxAppConfig()` devolve o objeto mutável por referência** (linha 41: `return config;`). Um consumidor pode fazer `getMaxAppConfig().routeUser = 'x'` e alterar a configuração global sem passar pelo `configureMaxApp`, contornando o único ponto de entrada previsto.
2. **Nenhuma validação de chaves.** `configureMaxApp({ routeUsr: 'me' })` (typo) é aceito silenciosamente — o excesso de propriedade só é barrado pelo TypeScript quando o objeto é literal inline; passar uma variável tipada como `Record<string,string>` ou vinda de JSON passa direto.

O teste existente (`tests/helpers/maxAppConfig.test.ts`, 64 linhas) cobre defaults, override e reset, mas — pela leitura do arquivo — não cobre a não-acumulação entre duas chamadas nem a mutabilidade do retorno.

## Impacto

Configuração de rotas silenciosamente revertida em apps com boot modular, produzindo chamadas a rotas inexistentes (`user.data` em vez da rota real) e erros 404 difíceis de correlacionar com a causa.

## Plano de correção

1. Decidir a semântica e torná-la explícita: ou (a) manter substituição total e renomear/documentar como tal no JSDoc, ou (b) mudar para merge incremental (`config = { ...config, ...options }`), preservando `resetMaxAppConfig()` como a forma de voltar aos defaults.
2. Fazer `getMaxAppConfig()` devolver uma cópia rasa (`return { ...config }`) ou um `Readonly<MaxAppConfig>`.
3. Avaliar `console.warn` em desenvolvimento quando `configureMaxApp` receber chaves fora de `MaxAppConfig`.

## Verificação

- Testes a criar/ajustar: `tests/helpers/maxAppConfig.test.ts` — adicionar: duas chamadas parciais consecutivas (assertando a semântica escolhida no passo 1); mutação do objeto devolvido por `getMaxAppConfig()` não afeta a leitura seguinte.
- Comandos: `npx vitest run tests/helpers/maxAppConfig.test.ts`, `npm run type-check`, `npm run lint`
