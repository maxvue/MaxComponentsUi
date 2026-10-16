# Achado — mensagem de comparação pode revelar senha esperada

- Data: 2026-10-16. Natureza: risco condicional de segurança no componente genérico existente; não é prova de incidente em produção.
- Localização: `src/components/MaxInputText.vue:86–100`, especialmente construção de `invalidMessage`; `src/helpers/useInputValidation.ts:135–142` resolve a mensagem de erro.
- Evidência sanitizada: a mensagem padrão concatena o valor recebido em `targetValue` após o rótulo de valor esperado. O componente aceita `type="password"` e documenta `targetValue` como comparação. Se um consumidor usar essa combinação sem mensagem própria, uma divergência pode colocar o valor esperado na mensagem visível/acessível. Nenhuma credencial real foi examinada ou reproduzida.
- Impacto: o campo pode estar visualmente mascarado, mas seu alvo de comparação pode ser exposto pelo feedback de validação. A comparação do helper é exata; este achado trata da mensagem, não afirma quebra da igualdade no comportamento efetivo.
- Limitação: não foi demonstrado consumidor em produção passando essa combinação; o risco decorre do contrato público e da construção da mensagem por leitura.
- Encaminhamento: corrigir o comportamento legado em tarefa própria, com teste de regressão e análise de compatibilidade. O novo `MaxInputPassword` proposto deve compor `InputBase` diretamente, comparar de forma exata e usar mensagem fixa sem valor sensível. Não usar logging, snapshot ou cache com credenciais reais.
- Estado: notificado, não corrigido nesta sessão Plan. Nenhum segredo está incluído neste arquivo.
