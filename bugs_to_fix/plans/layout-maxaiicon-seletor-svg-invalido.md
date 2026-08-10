# MaxAiIcon escreve `svg:` em vez de `svg` — quatro blocos de regras inertes

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxAiIcon.vue:110`, `src/components/MaxAiIcon.vue:124`, `src/components/MaxAiIcon.vue:135`, `src/components/MaxAiIcon.vue:150`
- **Domínio:** tabela-layout-exibicao

## Problema

Quatro blocos aninhados no SCSS usam dois-pontos após o seletor de elemento:

```scss
.img-p-top {
    ...
    svg: {                    // <- dois-pontos indevido
        width: 40% !important;
        height: 40% !important;
    }
}
```

Com `svg:` o SCSS não interpreta um seletor aninhado, e sim uma **declaração** de propriedade chamada `svg` com um bloco — sintaxe de propriedade aninhada (nested properties). O resultado é que nenhuma regra CSS é emitida para os `<svg>`: as larguras/alturas de 40%, 90% e 35% **nunca são aplicadas**.

O SVG interno herda então apenas o dimensionamento do container (`.img-p-top`, `.img-g-right`, etc.), que já possui as mesmas porcentagens nas linhas 108-109, 122-123, 131-132 e 148-149. Nos três primeiros casos o efeito visual coincide por acidente; mas as regras estão mortas e o `!important` declarado nelas não existe no CSS final.

Confirmado: `npx stylelint src/components/MaxAiIcon.vue` **não** acusa o problema — a construção é sintaticamente válida em SCSS, apenas semanticamente errada. É um defeito silencioso.

Ocorrências: linhas 110-113, 124-127, 135-138 e 150-153.

## Impacto

- Quatro blocos de estilo sem qualquer efeito, dando falsa impressão de que o dimensionamento do SVG está sob controle.
- Qualquer ajuste futuro nesses blocos continuará sendo ignorado, gerando depuração desnecessária.
- Se o dimensionamento do container mudar, o SVG deixa de acompanhar como o autor pretendia.

## Plano de correção

1. Remover os dois-pontos nos quatro seletores: `svg: {` → `svg {`.
2. Verificar o resultado visual: com as regras agora ativas, as porcentagens passam a ser relativas ao container (que já tem a mesma porcentagem), produzindo `40% de 40%`. Provavelmente o correto é `width: 100%; height: 100%` no `svg`, ou simplesmente **remover** os quatro blocos, já que o container sozinho entrega o layout atual.
3. Decidir entre as duas opções acima com base na inspeção visual no playground, e não replicar cegamente as porcentagens.

## Verificação

- Comparar o render do `MaxAiIcon` no playground antes e depois, nos estados `done` e animado.
- `npm run lint` (ESLint + Stylelint) sem regressões.
- Teste asserindo as dimensões computadas do `svg` interno em `tests/components/MaxAiIcon.test.ts`.
