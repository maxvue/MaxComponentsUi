# 20 — MaxInputPhoneMail: tokens de máscara inválidos e emissão inconsistente

**Severidade:** Média
**Categoria:** Bug / Divergência de API
**Arquivos:** `src/components/MaxInputPhoneMail.vue:91-94, 118`

## Problemas

1. A máscara fixa `'+55 (##) #### - ####$'` contém `$` que não é token declarado — Maska o trata como caractere literal, podendo inserir um `$` no fim do telefone fixo.
2. O token `'@': /[a-zA-Z0-9@(.+_-]/` tem classe de caracteres suspeita (`(` sem par, `.` literal dentro de classe) e o token `%` inclui `\s`, permitindo espaços em e-mail.
3. O componente emite o **valor mascarado** (`'+55 (11) 9...'`), enquanto CPF/CEP emitem só números — API inconsistente. Existe `unmaskedValue` no `v-maska`, mas não é usado no emit.

## Correção sugerida

Remover o `$`, revisar as classes de caracteres e emitir o valor não mascarado por consistência com os demais inputs.
