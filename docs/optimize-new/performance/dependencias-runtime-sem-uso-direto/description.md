# Manifesto de runtime contém candidatos não usados diretamente

## Validação da refutação

**Parcialmente confirmado.** A ausência de imports diretos é verificável, sobretudo para `quill` e a cópia raiz de `oxc-parser`, mas o lockfile corrompido impede medir uma instalação limpa e alguns candidatos têm justificativas transitivas ou de integração. Não há base para remover o conjunto inteiro em bloco.

## Severidade e prioridade

- Severidade: baixa.
- Prioridade: P3, depois da correção do lockfile.

## Evidências confirmadas

- `package.json` declara `quill`, `oxc-parser`, `@tiptap/pm`, seis pacotes internos `@vue/*` e `@maxvue/max-pinia` em `dependencies`.
- Busca em código e configuração não encontra imports desses nomes; `quill:folder-open` em `MaxInputFileUpload.vue` é namespace de ícone, não uso do pacote `quill`.
- `npm explain quill` mostra somente a declaração raiz. A instalação local ocupa aproximadamente 3,45 MB somando `quill`, `parchment` e `quill-delta`.
- `npm explain oxc-parser` mostra uma cópia raiz causada pela declaração do projeto e outra versão sob UnoCSS; a cópia raiz e seus binários ocupam aproximadamente 3,60 MB.
- `npm explain @tiptap/pm` mostra que ele já é exigido transitivamente por Tiptap; remover apenas a declaração direta pode não reduzir bytes.
- Os pacotes `@vue/*` também chegam transitivamente por `vue`/tooling, e `@maxvue/max-pinia` está documentado como integração do aplicativo consumidor, embora não seja importado pela biblioteca.
- `vite.config.ts:43-48` externaliza bare imports; esses candidatos não explicam o tamanho de `dist/index.es.js`.

## Causa-raiz provável

O manifesto mistura dependências usadas pelo runtime da biblioteca, ferramentas transitivas e integrações esperadas do host. Não existe validação automatizada ou documentação que diferencie essas categorias.

## Impacto demonstrado

A cópia raiz de `quill` é o candidato mais forte a custo evitável; `oxc-parser` também merece reclassificação. O impacto líquido no consumidor não foi isolado porque `npm ci` falha e várias dependências permanecem transitivas.

## Direção de solução

Após reparar o lockfile, testar cada candidato individualmente em um projeto consumidor empacotado. Remover `quill` se nenhum contrato oculto surgir; decidir se `oxc-parser` é ferramenta de desenvolvimento; classificar integrações do host como peer/optional peer quando apropriado; não remover transitivas de Tiptap/Vue sem validar tipos e build.

## Critérios de aceite

- Toda dependência de produção possui import ou necessidade contratual documentada.
- Instalação limpa antes/depois quantifica bytes, tempo e lockfile por candidato.
- Build, tarball, preset, resolver e consumo externo continuam funcionando.

## Contraevidências consideradas

- Ausência de import direto não prova que uma dependência possa ser removida.
- Dependências externalizadas não ampliam diretamente o bundle JS.
- `@tiptap/pm` e `@vue/*` já aparecem no grafo transitivo; `@maxvue/max-pinia` pode pertencer ao contrato de integração, não à implementação interna.
