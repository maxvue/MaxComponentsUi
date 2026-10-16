# Lacuna — validações dedicadas no MaxUse instalado

- Data: 2026-10-16. Pacote efetivo na biblioteca: `@maxvue/max-use` 1.1.47, distribuído via npm.
- Localização: `node_modules/@maxvue/max-use/dist/Helpers/Validations/index.d.ts`, `dist/Helpers/Strings/*.d.ts`, `dist/Helpers/Dates/*.d.ts` e `dist/index.d.ts`, lidos sem alterações.
- Evidência: exports de e-mail (`isEmail` e aliases), `slugify` e `kebabCase` existem. Não foi encontrado helper dedicado a URL HTTP(S) com política configurável, horário HH:mm com faixa/step ou validação estrita do slug kebab-case nas declarações examinadas. A ausência está limitada à versão e aos exports inspecionados, não a versões futuras do projeto irmão.
- Impacto: não assumir APIs de validação inexistentes, não importar função privada nem copiar helper de outro app para uma nova biblioteca utilitária local.
- Encaminhamento no plano: reaproveitar `isEmail`/`slugify`; usar `URL` nativa e regras pequenas de domínio dos componentes para faixa/step/slug, com testes e sem nova dependência. Isso não autoriza escrever no MaxUse. Caso surja necessidade real de helper compartilhado, planejar extensão/publicação do MaxUse em escopo separado.
- Nenhuma falha do MaxPinia foi demonstrada por essa ausência; os dez inputs locais não fazem GET, cache ou salvamento.
