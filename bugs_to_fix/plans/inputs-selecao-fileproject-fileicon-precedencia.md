# Precedência de operadores quebra `fileIcon` e pode lançar TypeError no MaxInputFileProject

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputFileProject.vue:83-88`
- **Domínio:** inputs-selecao-arquivo

## Problema

```ts
function fileIcon (file: DBFile): string {
    const file_names = [file?.file_name?.toLowerCase() ?? '', file?.name?.toLowerCase() ?? '', file?.label_file_name?.toLowerCase() ?? ''];

    for (const name of file_names) if (name && name.includes('cnh') || name.includes('identidade')|| name.includes('rg') || name.includes('carteira') ) return 'mdi:identification-card';
    return 'mdi:file';
}
```

O guard `name &&` foi escrito com a intenção de proteger todas as chamadas a `includes`, mas `&&` tem precedência maior que `||`. A expressão é avaliada como:

```
(name && name.includes('cnh')) || name.includes('identidade') || name.includes('rg') || name.includes('carteira')
```

Ou seja, o guard protege **apenas** a primeira checagem. As outras três rodam mesmo quando `name` é uma string vazia. Neste caso específico o array é montado com `?? ''`, então `name` nunca é `null`/`undefined` e não há crash imediato — mas o guard é enganoso e frágil: qualquer refatoração que permita `null` entrar no array (ex.: remover um `?? ''`, ou passar a montar `file_names` a partir de outro campo) transforma isso em `TypeError: Cannot read properties of null (reading 'includes')` em runtime, dentro de uma função chamada no template para cada arquivo da lista.

Há um segundo defeito de lógica no mesmo laço: `'rg'` é uma substring extremamente curta e casa com muitos nomes de arquivo legítimos (`programa.pdf`, `orgao.jpg`, `energia.png`, `cargo.pdf`), fazendo com que documentos comuns sejam classificados como documento de identidade.

## Impacto

Ícone errado exibido para arquivos comuns (falso positivo de `'rg'`), guard que não guarda nada, e uma armadilha de crash latente numa função chamada por item renderizado — um `TypeError` ali derruba a renderização de toda a lista de arquivos.

## Plano de correção

1. Parentizar corretamente e aplicar o guard a todas as checagens:
   ```ts
   const KEYWORDS = ['cnh', 'identidade', 'carteira'];
   for (const name of file_names) {
       if (!name) continue;
       if (KEYWORDS.some((k) => name.includes(k))) return 'mdi:identification-card';
   }
   ```
2. Tratar `'rg'` com uma checagem de palavra inteira em vez de substring — por exemplo `/\brg\b/.test(name)` — para eliminar os falsos positivos.
3. Manter o retorno padrão `'mdi:file'`.

## Verificação

- Novo teste em `tests/components/MaxInputFileProject.test.ts`: `fileIcon({ file_name: 'cnh_frente.jpg' })` retorna `'mdi:identification-card'`.
- Teste de falso positivo: `fileIcon({ file_name: 'programa.pdf' })` retorna `'mdi:file'` (hoje retorna o ícone de identidade por causa do `'rg'` em "programa").
- Teste de robustez: `fileIcon({})` (todos os campos ausentes) retorna `'mdi:file'` sem lançar.
- `npx vitest run tests/components/MaxInputFileProject.test.ts`.
