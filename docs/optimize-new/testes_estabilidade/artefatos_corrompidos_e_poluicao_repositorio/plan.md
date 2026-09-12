# Plano de implementação — remover artefato hostil e validar nomes

## Objetivo e escopo

Remover o arquivo rastreado `src/components/base/-l` e impedir novos basenames iniciados por hífen ou caracteres de controle. Não alterar componentes nem reescrever histórico Git.

## Fora de escopo

Não reescrever o histórico Git, alterar componentes ou tratar lockfiles/dependências; este plano limita-se ao artefato `-l` e à prevenção de nomes hostis.

## Arquivos

- Remover `src/components/base/-l` usando caminho explícito e terminador `--`.
- Criar `scripts/check-tracked-filenames.mjs`.
- Alterar `package.json` e o workflow/gate de qualidade para executar a verificação.
- Criar `tests/architecture/tracked-filenames.test.ts` se a política arquitetural também for coberta no Vitest.

## Dependências e ordem

1. Testar o validador contra nomes seguros/hostis.
2. Remover o artefato.
3. Integrar o script ao gate imutável, coordenando com o achado de gates fragmentados.

## Passos

1. Enumerar arquivos com `git ls-files -z` e processar NUL, sem parsing por linhas.
2. Rejeitar qualquer segmento de caminho iniciado por `-` e nomes com controles ASCII; reportar o caminho escapado.
3. Permitir exceções somente em lista explícita vazia por padrão.
4. Remover `src/components/base/-l` com comando seguro e confirmar que não é referenciado.
5. Adicionar `check:filenames` ao `verify`/CI.

## Migração e testes

Sem impacto de runtime ou API. Testes unitários usam lista sintética com `-l`, newline e nomes válidos; integração executa o script sobre o índice Git real. A11y/benchmark não se aplicam.

## Aceite

- `git ls-files -z` não retorna segmento iniciado por hífen/controle.
- O validador falha para fixtures hostis e passa no repositório.
- Build e testes permanecem inalterados.

## Riscos e rollback

A regra pode bloquear nomes legítimos; exigir exceção revisada, não afrouxar parsing. A remoção é recuperável pelo Git antes do commit; rollback restaura somente o arquivo e retira o gate.

## Validação final

Executar `npm run check:filenames`, suíte, build, `git diff --check` e revisar que apenas o artefato/gate/teste foram afetados.
