# Chave da API do Google Maps embutida no código-fonte do MaxMaps

- **Categoria:** segurança
- **Severidade:** crítica
- **Arquivo(s):** `src/components/MaxMaps.vue:4`
- **Domínio:** tabela-layout-exibicao

## Problema

A chave da API do Google Maps está literal no template, junto com um `mapId` específico de um projeto:

```vue
<GoogleMap api-key="AIzaSyCIrTVDHOyXkRnkxVOK8xSdcVyp1NkrZeY" ... mapId="ENGEAPP_MAP" ... >
```

Dois problemas somados:

1. **Vazamento de credencial.** A chave está versionada no git e é publicada no pacote npm `@maxvue/max-components-ui` — qualquer pessoa com acesso ao repositório ou ao pacote a obtém. Chaves do Google Maps JS API são inevitavelmente visíveis no cliente, mas isso exige que sejam **restritas por HTTP referrer** e rotacionáveis; uma chave fixa no código-fonte de uma biblioteca distribuída não é restringível por consumidor e não pode ser rotacionada sem um novo release.

2. **Acoplamento indevido.** Uma biblioteca de componentes genérica embute a credencial e o `mapId` de uma aplicação específica (`ENGEAPP_MAP`). Qualquer outro consumidor faturará no projeto Google Cloud errado, e o estilo de mapa será o do engeapp.

## Impacto

- Uso não autorizado da chave por terceiros, com custo faturado ao proprietário do projeto Google Cloud.
- Possível esgotamento de cota, derrubando o mapa em produção.
- Impossibilidade de rotacionar a credencial sem publicar nova versão da biblioteca.
- Componente inutilizável por outras aplicações sem fork.

## Plano de correção

1. Tornar a chave e o `mapId` configuráveis, com prop e fallback de configuração global:
   ```ts
   const props = withDefaults(defineProps<{
       modelValue: { latitude: number; longitude: number } | null;
       apiKey?: string;
       mapId?: string;
       mapTypeId?: string;
   }>(), { modelValue: null, mapId: undefined, mapTypeId: 'satellite' });
   ```
2. Aceitar também um valor central via `configureMaxApp` (mesmo mecanismo já usado em `src/helpers/maxAppConfig.ts` pelo `MaxApp`), para o app configurar uma vez.
3. Renderizar um estado de erro/aviso (a classe `.no-map` já existe no SCSS, linhas 92-123, e nunca é usada) quando nenhuma chave for fornecida, em vez de falhar silenciosamente.
4. **Revogar a chave exposta** no console do Google Cloud e emitir uma nova, restrita por referrer, configurada no engeapp e não na biblioteca.
5. Verificar o histórico do git: a chave permanece acessível em commits anteriores mesmo após a remoção — a revogação é obrigatória, não opcional.

## Verificação

- `grep -rn "AIza" src/` não deve retornar resultados.
- Teste montando `MaxMaps` sem `apiKey`, asserindo o estado de aviso e a ausência do `GoogleMap`.
- Teste passando `apiKey` e asserindo o repasse ao `GoogleMap`.
- `npx vitest run tests/components/MaxMaps.test.ts`.
- Confirmar no console do Google Cloud que a chave antiga foi revogada.
