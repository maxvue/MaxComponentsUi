# Documentação de desenvolvimento contém referências desatualizadas

## Localização e evidência

- `README.md:245–249,269`: estrutura e links ainda apresentam reexportações e tema ligados ao PrimeVue. As diretrizes canônicas `AGENTS.md`, seção 3, declaram independência concluída e proíbem reintrodução dessa dependência.
- `CONTRIBUTING.md:101`: recomenda evitar estilos scoped em componentes relacionados ao PrimeVue; diverge da diretriz canônica de componentes com SCSS scoped e independência da biblioteca.
- `CONTRIBUTING.md:127–131`: descreve o primeiro passo do release como somente build. O script efetivo `package.json:576` começa por `npm run verify`, com esteira de validação mais ampla antes do versionamento/publicação.

## Impacto

Contribuidores podem seguir práticas antigas, interpretar incorretamente a arquitetura ou subestimar os gates e efeitos do release. Estas divergências documentais não demonstram que existam imports atuais de PrimeVue no código; não foi realizada auditoria dessa hipótese.

## Encaminhamento

Revisar essas seções em tarefa documental separada, tomando o código e as diretrizes canônicas como referência. Não reintroduzir PrimeVue nem alterar o release para coincidir com textos antigos. Nenhuma correção desses achados foi implementada nesta sessão.
