# Faixas de Pinia divergentes entre biblioteca e consumidor

- Data: 19/10/2026.
- Locais: `package.json:975–980` desta biblioteca e `/home/johnattas/GitHub/engeapp/package.json:111`.
- Evidência: MaxComponentsUi declara peer `pinia: ^4.0.0`; Engeapp declara dependência `pinia: ^3.0.4`. As faixas declaradas não se sobrepõem. O Engeapp usa a biblioteca por referência local em seu `package.json:72`.
- Impacto potencial: instalação estrita e verificações da árvore de dependências podem rejeitar a combinação; isso pode constituir outro bloqueio independente após resolver a pendência de commit.
- Limite: não foram executadas instalações, `npm ls`, testes de consumidor ou build. Não se afirma qual versão está resolvida no consumidor nem que há falha de runtime. O erro relatado nesta tarefa foi a recusa de arquivos versionados modificados, não um erro de Pinia.
- Encaminhamento: investigar compatibilidade dos consumidores em tarefa própria, sem elevar versões, afrouxar peers ou usar `--legacy-peer-deps` como parte deste plano.
