# IMP5-R12 — E07-04 e E07-05

## Escopo e reprodução

- `MaxInputFileProject` combinava `HTMLInputElement.click()` com `useFileDialog.open()` no mesmo gesto, permitindo dois seletores nativos.
- `MaxMaps` descartava latitude ou longitude `0`, embora `0` seja uma coordenada válida no equador ou no meridiano de Greenwich; a alternativa acessível desaparecia junto.

## Correção

- Removido o segundo caminho `useFileDialog`; o componente usa exclusivamente o input nativo. O clique no botão interno cancela o default do `label` antes de chamar o input uma vez; clique direto no `label` continua usando sua associação nativa.
- `MaxMaps` passou a distinguir `modelValue: null` de coordenadas numéricas iguais a zero. A região e controles acessíveis sempre permanecem disponíveis, e o mapa é renderizado para qualquer par finito, inclusive `0,0`.

## Testes executados

```text
npx vitest run tests/components/MaxInputFileProject.test.ts tests/components/MaxMaps.test.ts tests/components/rev_r12_adversarial.test.ts tests/components/rev_r12_adversarial_maps.test.ts
Test Files  4 passed (4)
Tests       46 passed (46)

npx eslint src/components/MaxInputFileProject.vue src/components/MaxMaps.vue tests/components/MaxInputFileProject.test.ts tests/components/MaxMaps.test.ts tests/components/rev_r12_adversarial_maps.test.ts
saída: sucesso (0 erros)

npx vue-tsc --noEmit
saída: sucesso (0 erros)
```

## Arquivos sob ownership

`src/components/MaxInputFileProject.vue`, `src/components/MaxMaps.vue`, os testes focais correspondentes e esta evidência. Não foi criado commit, conforme orientação do coordenador.
