# 06 — XSS: SVGs remotos injetados com v-html sem sanitização e persistidos em localStorage

**Severidade:** Alta (segurança)
**Categoria:** Segurança
**Arquivos:** `src/components/MaxIcon.vue:4`, `src/components/MaxInputIconPicker.vue:66`, `src/stores/useIcon.Store.ts:38`

## Problema

SVGs vêm de `fetch('https://engeapp.com.br/api/icons?...')` e são injetados com `v-html` sem sanitização, além de **persistidos em `localStorage`** (chave `all_icons`). Um payload malicioso (API comprometida, MITM, ou outra página do mesmo origin gravando em `all_icons`) vira **XSS armazenado**, re-executado a cada load da aplicação.

O mesmo padrão `v-html` sem sanitizar aparece com dados fornecidos pelo consumidor em `MaxTagSelect`, `MaxInputSelect` (labels de opção), `MaxTitle1/2` e `MaxEmptyDiv` (menos grave — conteúdo do dev, mas ainda vetor se as opções vierem de dados de usuário).

## Correção sugerida

- Sanitizar com DOMPurify (perfil SVG) antes de renderizar **e** antes de cachear.
- Validar que a string começa com `<svg` e não contém `<script>`/handlers `on*`.
- Em `MaxInputSelect`/`MaxTagSelect`, preferir `v-text`/slot em vez de `v-html` para labels de opção.
