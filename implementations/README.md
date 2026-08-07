# Auditoria do projeto — 2026-08-07

40 arquivos de achados gerados por auditoria profunda (5 frentes paralelas: inputs, layout/stores, infraestrutura/build, testes, consistência da migração PrimeVue). Plano de execução em [`../execute_fixes.md`](../execute_fixes.md).

## Índice por severidade

### Críticos (01–05)
| # | Achado |
|---|--------|
| 01 | `migration_plans/` deletado silenciosamente no último commit |
| 02 | MaxTabs: contexto nunca provido — 25 testes falhando |
| 03 | MaxApp.vue: template referencia componentes inexistentes |
| 04 | useApp/useLogin stores órfãs que não compilam |
| 05 | Export `./stores` aponta para arquivo que o build não gera |

### Altos (06–17)
| # | Achado |
|---|--------|
| 06 | XSS: v-html de SVGs remotos sem sanitização + localStorage |
| 07 | useIconStore: JSON.parse sem try/catch quebra todos os ícones |
| 08 | useIconStore: mutação em computed + retries que nunca resetam |
| 09 | MaxTable: coluna de botões duplicada por slot |
| 10 | MaxInputCpfCnpj: v-model congela ao apagar |
| 11 | Lat: máscara rejeita latitudes válidas e trava negativo |
| 12 | Lat/Lng: erro em campo vazio, done invertido, tipos divergentes |
| 13 | Export `./resolver`: types path inexistente |
| 14 | Resolver oferece componentes não exportados |
| 15 | presetMaxUno: regex `color-*` com espaço nunca casa |
| 16 | Resolver retorna imports de /prime inexistentes |
| 17 | Migração: MaxUserSection/Confirms fora do rastreio |

### Médios (18–33)
Bugs de regra de negócio (18 bandeiras de cartão, 21 validadores CPF), reatividade (19), máscaras (20), caution inerte (22), a11y do InputBase (23), MaxModal expose (24), leaks de observers (25), confirm store (26), aliases vs Prime (27), deps (28), release script (29), preset px (30), testes (31–33).

### Baixos / melhorias (34–40)
ESLint (34), popover store/posição (35), menores agrupados (36, 38), convenção InputBase (37), props duplicadas (39), composables estruturais (40).
