# Divergência documental — configuração PrimeVue no README

- Data: 2026-10-05.
- Worktree: wt-3eb968fe.
- Referência: HEAD `67a658dd35dc2af3dd92f0ebb060d43122f5faba`.
- Natureza: achado fora do escopo do buffer do MaxListBox; não corrigido.

## Localização e evidência

`README.md:89–112` afirma que install customiza PrimeVue e tema; `README.md:166` descreve MaxStyle como preset PrimeVue baseado no Aura. As diretrizes canônicas em AGENTS.md, seção 3, declaram independência concluída e proíbem reintrodução de dependências PrimeVue.

O install atual em `src/index.ts:291–294` registra a diretiva tooltip e disponibiliza as opções por provide. Esse trecho não inicializa nem customiza PrimeVue como descrito no README. Evidência obtida por leitura, sem execução.

## Impacto e próxima ação

Consumidores podem seguir orientação antiga e esperar configuração de terceiros que não é realizada por esse entry point. Em tarefa separada e autorizada, revisar README contra install, estilos e contratos atuais; preservar orientações válidas sobre uso independente de PrimeVue nas aplicações consumidoras. Não alterar dependências nem documentação geral durante a execução do plano MaxListBox.

Nenhum segredo, token ou dado pessoal foi reproduzido.
