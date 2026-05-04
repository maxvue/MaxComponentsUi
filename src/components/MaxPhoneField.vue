<template>
    <InputBase class="input-phone" v-bind="props" :value="temp_value" :done="done" :error="error" :caution="caution" :label="props.label ?? 'Telefone'" iconRight="ic:baseline-whatsapp">
        <div class="inputs-div">
            <Select v-model="country" :options="country_ddi_flags" filter :filterFields="['name', 'value']">
                <template #option="slotProps">
                    <slot name="option" :option="slotProps.option" :selected="slotProps.selected" :index="slotProps.index">
                        <div class="label_div">
                            <img :src="'https://flagcdn.com/w40/' + slotProps.option.sigla.toLowerCase() + '.png'" alt="flag" />
                            <div class="labelz">
                                <div v-html="slotProps.option.label" pt2></div>
                            </div>
                            <div class="subLabel" v-html="'( + ' + slotProps.option?.value + ' )'"></div>
                            <img v-if="slotProps.option['img']" :src="`/media/images/${slotProps.option['img']}`" alt="Image" class="img-label" />
                        </div>
                    </slot>
                </template>
                <template #value="value: any">
                    <div class="item-selected">
                        <div class="item-flag">
                            <img :src="'https://flagcdn.com/w40/' + value.value.sigla.toLowerCase() + '.png'" alt="bandeira" flex />
                        </div>
                        <div pl9 style="color: var(--max-inputtext-color);">+ {{ value.value.value }}</div>
                    </div>
                </template>
            </Select>
            <InputText type="text" slot-b v-model="phone" v-maska:unmaskedValue.unmasked="maskValue" flex autoClear="false" slotChar=" " :placeholder="parseInt(country.value) === 55 ? '(99) 9 9999 - 9999' : ''" p0 fluid/>
        </div>
    </InputBase>
</template>

<script setup lang="ts">

    const props = withDefaults(
        defineProps<{
            modelValue: string;
            icon?: string | undefined;
            i?: string | undefined;
            disabled?: boolean | undefined;
            float?: boolean | undefined;
            msg?: string | undefined;
            message?: string | undefined;
            iconMessage?: string | undefined;
            label?: string | undefined;
            done?: boolean | undefined;
            error?: string | boolean | undefined;
            targetValue?: string;
            caution?: string | boolean | undefined;
            required?: boolean;
        }>(),
        { modelValue: '', done: undefined, required: false, caution: undefined }
    );

    const country_ddi_flags = shallowRef([
        { ddi: 93, name: 'Afeganistão', label: 'Afeganistão', sigla: 'AF', value: 93 },
        { ddi: 27, name: 'África do Sul', label: 'África do Sul', sigla: 'ZA', value: 27 },
        { ddi: 355, name: 'Albânia', label: 'Albânia', sigla: 'AL', value: 355 },
        { ddi: 49, name: 'Alemanha', label: 'Alemanha', sigla: 'DE', value: 49 },
        { ddi: 376, name: 'Andorra', label: 'Andorra', sigla: 'AD', value: 376 },
        { ddi: 244, name: 'Angola', label: 'Angola', sigla: 'AO', value: 244 },
        { ddi: 1, name: 'Anguilla', label: 'Anguilla', sigla: 'AI', value: 1 },
        { ddi: 1, name: 'Antígua e Barbuda', label: 'Antígua e Barbuda', sigla: 'AG', value: 1 },
        { ddi: 599, name: 'Antilhas Holandesas', label: 'Antilhas Holandesas', sigla: 'AN', value: 599 },
        { ddi: 966, name: 'Arábia Saudita', label: 'Arábia Saudita', sigla: 'SA', value: 966 },
        { ddi: 213, name: 'Argélia', label: 'Argélia', sigla: 'DZ', value: 213 },
        { ddi: 54, name: 'Argentina', label: 'Argentina', sigla: 'AR', value: 54 },
        { ddi: 374, name: 'Armêia', label: 'Armêia', sigla: 'AM', value: 374 },
        { ddi: 297, name: 'Aruba', label: 'Aruba', sigla: 'AW', value: 297 },
        { ddi: 247, name: 'Ascensão', sigla: 'AC', value: 247 },
        { ddi: 61, name: 'Austrália', label: 'Austrália', sigla: 'AU', value: 61 },
        { ddi: 43, name: 'Áustria', label: 'Áustria', sigla: 'AT', value: 43 },
        { ddi: 994, name: 'Azerbaijão', label: 'Azerbaijão', sigla: 'AZ', value: 994 },
        { ddi: 1, name: 'Bahamas', label: 'Bahamas', sigla: 'BS', value: 1 },
        { ddi: 880, name: 'Bangladesh', label: 'Bangladesh', sigla: 'BD', value: 880 },
        { ddi: 1, name: 'Barbados', label: 'Barbados', sigla: 'BB', value: 1 },
        { ddi: 973, name: 'Bahrein', label: 'Bahrein', sigla: 'BH', value: 973 },
        { ddi: 32, name: 'Bélgica', label: 'Bélgica', sigla: 'BE', value: 32 },
        { ddi: 501, name: 'Belize', label: 'Belize', sigla: 'BZ', value: 501 },
        { ddi: 229, name: 'Benim', label: 'Benim', sigla: 'BJ', value: 229 },
        { ddi: 1, name: 'Bermudas', label: 'Bermudas', sigla: 'BM', value: 1 },
        { ddi: 375, name: 'Bielorrússia', label: 'Bielorrússia', sigla: 'BY', value: 375 },
        { ddi: 591, name: 'Bolívia', label: 'Bolívia', sigla: 'BO', value: 591 },
        { ddi: 387, name: 'Bósnia e Herzegovina', label: 'Bósnia e Herzegovina', sigla: 'BA', value: 387 },
        { ddi: 267, name: 'Botswana', label: 'Botswana', sigla: 'BW', value: 267 },
        { ddi: 55, name: 'Brasil', label: 'Brasil', sigla: 'BR', value: 55 },
        { ddi: 673, name: 'Brunei', label: 'Brunei', sigla: 'BN', value: 673 },
        { ddi: 359, name: 'Bulgária', label: 'Bulgária', sigla: 'BG', value: 359 },
        { ddi: 226, name: 'Burkina Faso', label: 'Burkina Faso', sigla: 'BF', value: 226 },
        { ddi: 257, name: 'Burundi', label: 'Burundi', sigla: 'BI', value: 257 },
        { ddi: 975, name: 'Butão', label: 'Butão', sigla: 'BT', value: 975 },
        { ddi: 238, name: 'Cabo Verde', label: 'Cabo Verde', sigla: 'CV', value: 238 },
        { ddi: 237, name: 'Camarões', label: 'Camarões', sigla: 'CM', value: 237 },
        { ddi: 855, name: 'Camboja', label: 'Camboja', sigla: 'KH', value: 855 },
        { ddi: 1, name: 'Canadá', label: 'Canadá', sigla: 'CA', value: 1 },
        { ddi: 7, name: 'Cazaquistão', label: 'Cazaquistão', sigla: 'KZ', value: 7 },
        { ddi: 235, name: 'Chade', label: 'Chade', sigla: 'TD', value: 235 },
        { ddi: 56, name: 'Chile', label: 'Chile', sigla: 'CL', value: 56 },
        { ddi: 86, name: 'República Popular da China', label: 'República Popular da China', sigla: 'CN', value: 86 },
        { ddi: 357, name: 'Chipre', label: 'Chipre', sigla: 'CY', value: 357 },
        { ddi: 57, name: 'Colômbia', label: 'Colômbia', sigla: 'CO', value: 57 },
        { ddi: 269, name: 'Comores', label: 'Comores', sigla: 'KM', value: 269 },
        { ddi: 242, name: 'CongoBrazzaville', label: 'CongoBrazzaville', sigla: 'CG', value: 242 },
        { ddi: 243, name: 'CongoKinshasa', label: 'CongoKinshasa', sigla: 'CD', value: 243 },
        { ddi: 850, name: 'Coreia do Norte', label: 'Coreia do Norte', sigla: 'KP', value: 850 },
        { ddi: 82, name: 'Coreia do Sul', label: 'Coreia do Sul', sigla: 'KR', value: 82 },
        { ddi: 225, name: 'Costa do Marfim', label: 'Costa do Marfim', sigla: 'CI', value: 225 },
        { ddi: 506, name: 'Costa Rica', label: 'Costa Rica', sigla: 'CR', value: 506 },
        { ddi: 385, name: 'Croácia', label: 'Croácia', sigla: 'HR', value: 385 },
        { ddi: 53, name: 'Cuba', label: 'Cuba', sigla: 'CU', value: 53 },
        { ddi: 45, name: 'Dinamarca', label: 'Dinamarca', sigla: 'DK', value: 45 },
        { ddi: 253, name: 'Djibuti', label: 'Djibuti', sigla: 'DJ', value: 253 },
        { ddi: 1, name: 'Dominica', label: 'Dominica', sigla: 'DM', value: 1 },
        { ddi: 20, name: 'Egipto', label: 'Egipto', sigla: 'EG', value: 20 },
        { ddi: 503, name: 'El Salvador', label: 'El Salvador', sigla: 'SV', value: 503 },
        { ddi: 971, name: 'Emirados Árabes Unidos', label: 'Emirados Árabes Unidos', sigla: 'AE', value: 971 },
        { ddi: 593, name: 'Equador', label: 'Equador', sigla: 'EC', value: 593 },
        { ddi: 291, name: 'Eritreia', label: 'Eritreia', sigla: 'ER', value: 291 },
        { ddi: 421, name: 'Eslováquia', label: 'Eslováquia', sigla: 'SK', value: 421 },
        { ddi: 386, name: 'Eslovénia', label: 'Eslovénia', sigla: 'SI', value: 386 },
        { ddi: 34, name: 'Espanha', label: 'Espanha', sigla: 'ES', value: 34 },
        { ddi: 1, name: 'Estados Unidos', label: 'Estados Unidos', sigla: 'US', value: 1 },
        { ddi: 372, name: 'Estónia', label: 'Estónia', sigla: 'EE', value: 372 },
        { ddi: 251, name: 'Etiópia', label: 'Etiópia', sigla: 'ET', value: 251 },
        { ddi: 679, name: 'Fiji', label: 'Fiji', sigla: 'FJ', value: 679 },
        { ddi: 63, name: 'Filipinas', label: 'Filipinas', sigla: 'PH', value: 63 },
        { ddi: 358, name: 'Finlândia', label: 'Finlândia', sigla: 'FI', value: 358 },
        { ddi: 33, name: 'França', label: 'França', sigla: 'FR', value: 33 },
        { ddi: 241, name: 'Gabão', label: 'Gabão', sigla: 'GA', value: 241 },
        { ddi: 220, name: 'Gâmbia', label: 'Gâmbia', sigla: 'GM', value: 220 },
        { ddi: 233, name: 'Gana', label: 'Gana', sigla: 'GH', value: 233 },
        { ddi: 995, name: 'Geórgia', label: 'Geórgia', sigla: 'GE', value: 995 },
        { ddi: 350, name: 'Gibraltar', label: 'Gibraltar', sigla: 'GI', value: 350 },
        { ddi: 1, name: 'Granada', label: 'Granada', sigla: 'GD', value: 1 },
        { ddi: 30, name: 'Grécia', label: 'Grécia', sigla: 'GR', value: 30 },
        { ddi: 299, name: 'Groenlândia', label: 'Groenlândia', sigla: 'GL', value: 299 },
        { ddi: 590, name: 'Guadalupe', label: 'Guadalupe', sigla: 'GP', value: 590 },
        { ddi: 1, name: 'Guam', label: 'Guam', sigla: 'GU', value: 1 },
        { ddi: 502, name: 'Guatemala', label: 'Guatemala', sigla: 'GT', value: 502 },
        { ddi: 592, name: 'Guiana', label: 'Guiana', sigla: 'GY', value: 592 },
        { ddi: 594, name: 'Guiana Francesa', label: 'Guiana Francesa', sigla: 'GF', value: 594 },
        { ddi: 224, name: 'Guiné', label: 'Guiné', sigla: 'GN', value: 224 },
        { ddi: 245, name: 'GuinéBissau', label: 'GuinéBissau', sigla: 'GW', value: 245 },
        { ddi: 240, name: 'Guiné Equatorial', label: 'Guiné Equatorial', sigla: 'GQ', value: 240 },
        { ddi: 509, name: 'Haiti', label: 'Haiti', sigla: 'HT', value: 509 },
        { ddi: 504, name: 'Honduras', label: 'Honduras', sigla: 'HN', value: 504 },
        { ddi: 852, name: 'Hong Kong', label: 'Hong Kong', sigla: 'HK', value: 852 },
        { ddi: 36, name: 'Hungria', label: 'Hungria', sigla: 'HU', value: 36 },
        { ddi: 967, name: 'Lêmen', label: 'Lêmen', sigla: 'YE', value: 967 },
        { ddi: 1, name: 'Ilhas Cayman', label: 'Ilhas Cayman', sigla: 'KY', value: 1 },
        { ddi: 672, name: 'Ilha Christmas', label: 'Ilha Christmas', sigla: 'CX', value: 672 },
        { ddi: 672, name: 'Ilhas Cocos', label: 'Ilhas Cocos', sigla: 'CC', value: 672 },
        { ddi: 682, name: 'Ilhas Cook', label: 'Ilhas Cook', sigla: 'CK', value: 682 },
        { ddi: 298, name: 'Ilhas Féroe', label: 'Ilhas Féroe', sigla: 'FO', value: 298 },
        { ddi: 672, name: 'Ilha Heard e Ilhas McDonald', label: 'Ilha Heard e Ilhas McDonald', sigla: 'HM', value: 672 },
        { ddi: 960, name: 'Maldivas', label: 'Maldivas', sigla: 'MV', value: 960 },
        { ddi: 500, name: 'Ilhas Malvinas', label: 'Ilhas Malvinas', sigla: 'FK', value: 500 },
        { ddi: 1, name: 'Ilhas Marianas do Norte', label: 'Ilhas Marianas do Norte', sigla: 'MP', value: 1 },
        { ddi: 692, name: 'Ilhas Marshall', label: 'Ilhas Marshall', sigla: 'MH', value: 692 },
        { ddi: 672, name: 'Ilha Norfolk', label: 'Ilha Norfolk', sigla: 'NF', value: 672 },
        { ddi: 677, name: 'Ilhas Salomão', label: 'Ilhas Salomão', sigla: 'SB', value: 677 },
        { ddi: 1, name: 'Ilhas Virgens Americanas', label: 'Ilhas Virgens Americanas', sigla: 'VI', value: 1 },
        { ddi: 1, name: 'Ilhas Virgens Britânicas', label: 'Ilhas Virgens Britânicas', sigla: 'VG', value: 1 },
        { ddi: 91, name: 'Índia', label: 'Índia', sigla: 'IN', value: 91 },
        { ddi: 62, name: 'Indonésia', label: 'Indonésia', sigla: 'ID', value: 62 },
        { ddi: 98, name: 'Irã', label: 'Irã', sigla: 'IR', value: 98 },
        { ddi: 964, name: 'Iraque', label: 'Iraque', sigla: 'IQ', value: 964 },
        { ddi: 353, name: 'Irlanda', label: 'Irlanda', sigla: 'IE', value: 353 },
        { ddi: 354, name: 'Islândia', label: 'Islândia', sigla: 'IS', value: 354 },
        { ddi: 972, name: 'Israel', label: 'Israel', sigla: 'IL', value: 972 },
        { ddi: 39, name: 'Itália', label: 'Itália', sigla: 'IT', value: 39 },
        { ddi: 1, name: 'Jamaica', label: 'Jamaica', sigla: 'JM', value: 1 },
        { ddi: 81, name: 'Japão', label: 'Japão', sigla: 'JP', value: 81 },
        { ddi: 962, name: 'Jordânia', label: 'Jordânia', sigla: 'JO', value: 962 },
        { ddi: 686, name: 'Kiribati', label: 'Kiribati', sigla: 'KI', value: 686 },
        { ddi: 383, name: 'Kosovo', label: 'Kosovo', sigla: 'XK', value: 383 },
        { ddi: 965, name: 'Kuwait', label: 'Kuwait', sigla: 'KW', value: 965 },
        { ddi: 856, name: 'Laos', label: 'Laos', sigla: 'LA', value: 856 },
        { ddi: 266, name: 'Lesoto', label: 'Lesoto', sigla: 'LS', value: 266 },
        { ddi: 371, name: 'Letônia', label: 'Letônia', sigla: 'LV', value: 371 },
        { ddi: 961, name: 'Líbano', label: 'Líbano', sigla: 'LB', value: 961 },
        { ddi: 231, name: 'Libéria', label: 'Libéria', sigla: 'LR', value: 231 },
        { ddi: 218, name: 'Líbia', label: 'Líbia', sigla: 'LY', value: 218 },
        { ddi: 423, name: 'Liechtenstein', label: 'Liechtenstein', sigla: 'LI', value: 423 },
        { ddi: 370, name: 'Lituânia', label: 'Lituânia', sigla: 'LT', value: 370 },
        { ddi: 352, name: 'Luxemburgo', label: 'Luxemburgo', sigla: 'LU', value: 352 },
        { ddi: 853, name: 'Macau', label: 'Macau', sigla: 'MO', value: 853 },
        { ddi: 389, name: 'República da Macedônia', label: 'República da Macedônia', sigla: 'MK', value: 389 },
        { ddi: 261, name: 'Madagascar', label: 'Madagascar', sigla: 'MG', value: 261 },
        { ddi: 60, name: 'Malásia', label: 'Malásia', sigla: 'MY', value: 60 },
        { ddi: 265, name: 'Malawi', label: 'Malawi', sigla: 'MW', value: 265 },
        { ddi: 223, name: 'Mali', label: 'Mali', sigla: 'ML', value: 223 },
        { ddi: 356, name: 'Malta', label: 'Malta', sigla: 'MT', value: 356 },
        { ddi: 212, name: 'Marrocos', label: 'Marrocos', sigla: 'MA', value: 212 },
        { ddi: 596, name: 'Martinica', label: 'Martinica', sigla: 'MQ', value: 596 },
        { ddi: 230, name: 'Maurícia', label: 'Maurícia', sigla: 'MU', value: 230 },
        { ddi: 222, name: 'Mauritânia', label: 'Mauritânia', sigla: 'MR', value: 222 },
        { ddi: 269, name: 'Mayotte', label: 'Mayotte', sigla: 'YT', value: 269 },
        { ddi: 52, name: 'México', label: 'México', sigla: 'MX', value: 52 },
        { ddi: 691, name: 'Estados Federados da Micronésia', label: 'Estados Federados da Micronésia', sigla: 'FM', value: 691 },
        { ddi: 258, name: 'Moçambique', label: 'Moçambique', sigla: 'MZ', value: 258 },
        { ddi: 373, name: 'Moldávia', label: 'Moldávia', sigla: 'MD', value: 373 },
        { ddi: 377, name: 'Mônaco', label: 'Mônaco', sigla: 'MC', value: 377 },
        { ddi: 976, name: 'Mongólia', label: 'Mongólia', sigla: 'MN', value: 976 },
        { ddi: 382, name: 'Montenegro', label: 'Montenegro', sigla: 'ME', value: 382 },
        { ddi: 1, name: 'Montserrat', label: 'Montserrat', sigla: 'MS', value: 1 },
        { ddi: 95, name: 'Myanmar', label: 'Myanmar', sigla: 'MM', value: 95 },
        { ddi: 264, name: 'Namíbia', label: 'Namíbia', sigla: 'NA', value: 264 },
        { ddi: 674, name: 'Nauru', label: 'Nauru', sigla: 'NR', value: 674 },
        { ddi: 977, name: 'Nepal', label: 'Nepal', sigla: 'NP', value: 977 },
        { ddi: 505, name: 'Nicarágua', label: 'Nicarágua', sigla: 'NI', value: 505 },
        { ddi: 227, name: 'Níger', label: 'Níger', sigla: 'NE', value: 227 },
        { ddi: 234, name: 'Nigéria', label: 'Nigéria', sigla: 'NG', value: 234 },
        { ddi: 683, name: 'Niue', label: 'Niue', sigla: 'NU', value: 683 },
        { ddi: 47, name: 'Noruega', label: 'Noruega', sigla: 'NO', value: 47 },
        { ddi: 687, name: 'Nova Caledônia', label: 'Nova Caledônia', sigla: 'NC', value: 687 },
        { ddi: 64, name: 'Nova Zelândia', label: 'Nova Zelândia', sigla: 'NZ', value: 64 },
        { ddi: 968, name: 'Omã', label: 'Omã', sigla: 'OM', value: 968 },
        { ddi: 31, name: 'Países Baixos', label: 'Países Baixos', sigla: 'NL', value: 31 },
        { ddi: 680, name: 'Palau', label: 'Palau', sigla: 'PW', value: 680 },
        { ddi: 970, name: 'Palestina', label: 'Palestina', sigla: 'PS', value: 970 },
        { ddi: 507, name: 'Panamá', label: 'Panamá', sigla: 'PA', value: 507 },
        { ddi: 675, name: 'PapuaNova Guiné', label: 'PapuaNova Guiné', sigla: 'PG', value: 675 },
        { ddi: 92, name: 'Paquistão', label: 'Paquistão', sigla: 'PK', value: 92 },
        { ddi: 595, name: 'Paraguai', label: 'Paraguai', sigla: 'PY', value: 595 },
        { ddi: 51, name: 'Peru', label: 'Peru', sigla: 'PE', value: 51 },
        { ddi: 689, name: 'Polinésia Francesa', label: 'Polinésia Francesa', sigla: 'PF', value: 689 },
        { ddi: 48, name: 'Polônia', label: 'Polônia', sigla: 'PL', value: 48 },
        { ddi: 1, name: 'Porto Rico', label: 'Porto Rico', sigla: 'PR', value: 1 },
        { ddi: 351, name: 'Portugal', label: 'Portugal', sigla: 'PT', value: 351 },
        { ddi: 974, name: 'Qatar', label: 'Qatar', sigla: 'QA', value: 974 },
        { ddi: 254, name: 'Quêia', label: 'Quêia', sigla: 'KE', value: 254 },
        { ddi: 996, name: 'Quirguistão', label: 'Quirguistão', sigla: 'KG', value: 996 },
        { ddi: 44, name: 'Reino Unido', label: 'Reino Unido', sigla: 'GB', value: 44 },
        { ddi: 236, name: 'República CentroAfricana', label: 'República CentroAfricana', sigla: 'CF', value: 236 },
        { ddi: 1, name: 'República Dominicana', label: 'República Dominicana', sigla: 'DO', value: 1 },
        { ddi: 420, name: 'República Tcheca', label: 'República Tcheca', sigla: 'CZ', value: 420 },
        { ddi: 262, name: 'Reunião', label: 'Reunião', sigla: 'RE', value: 262 },
        { ddi: 40, name: 'Romêia', label: 'Romêia', sigla: 'RO', value: 40 },
        { ddi: 250, name: 'Ruanda', label: 'Ruanda', sigla: 'RW', value: 250 },
        { ddi: 7, name: 'Rússia', label: 'Rússia', sigla: 'RU', value: 7 },
        { ddi: 212, name: 'Saara Ocidental', label: 'Saara Ocidental', sigla: 'EH', value: 212 },
        { ddi: 685, name: 'Samoa', label: 'Samoa', sigla: 'WS', value: 685 },
        { ddi: 1, name: 'Samoa Americana', label: 'Samoa Americana', sigla: 'AS', value: 1 },
        { ddi: 290, name: 'Santa Helena território', label: 'Santa Helena território', sigla: 'SH', value: 290 },
        { ddi: 1, name: 'Santa Lúcia', label: 'Santa Lúcia', sigla: 'LC', value: 1 },
        { ddi: 1, name: 'São Cristóvão e Nevis', label: 'São Cristóvão e Nevis', sigla: 'KN', value: 1 },
        { ddi: 378, name: 'São Marinho', label: 'São Marinho', sigla: 'SM', value: 378 },
        { ddi: 508, name: 'SaintPierre e Miquelon', label: 'SaintPierre e Miquelon', sigla: 'PM', value: 508 },
        { ddi: 239, name: 'São Tomé e Príncipe', label: 'São Tomé e Príncipe', sigla: 'ST', value: 239 },
        { ddi: 1, name: 'São Vicente e Granadinas', label: 'São Vicente e Granadinas', sigla: 'VC', value: 1 },
        { ddi: 248, name: 'Seicheles', label: 'Seicheles', sigla: 'SC', value: 248 },
        { ddi: 221, name: 'Senegal', label: 'Senegal', sigla: 'SN', value: 221 },
        { ddi: 232, name: 'Serra Leoa', label: 'Serra Leoa', sigla: 'SL', value: 232 },
        { ddi: 381, name: 'Sérvia', label: 'Sérvia', sigla: 'RS', value: 381 },
        { ddi: 65, name: 'Singapura', label: 'Singapura', sigla: 'SG', value: 65 },
        { ddi: 963, name: 'Síria', label: 'Síria', sigla: 'SY', value: 963 },
        { ddi: 252, name: 'Somália', label: 'Somália', sigla: 'SO', value: 252 },
        { ddi: 94, name: 'Sri Lanka', label: 'Sri Lanka', sigla: 'LK', value: 94 },
        { ddi: 268, name: 'Suazilândia', label: 'Suazilândia', sigla: 'SZ', value: 268 },
        { ddi: 249, name: 'Sudão', label: 'Sudão', sigla: 'SD', value: 249 },
        { ddi: 211, name: 'Sudão do Sul', label: 'Sudão do Sul', sigla: 'SS', value: 211 },
        { ddi: 46, name: 'Suécia', label: 'Suécia', sigla: 'SE', value: 46 },
        { ddi: 41, name: 'Suíça', label: 'Suíça', sigla: 'CH', value: 41 },
        { ddi: 597, name: 'Suriname', label: 'Suriname', sigla: 'SR', value: 597 },
        { ddi: 992, name: 'Tadjiquistão', label: 'Tadjiquistão', sigla: 'TJ', value: 992 },
        { ddi: 66, name: 'Tailândia', label: 'Tailândia', sigla: 'TH', value: 66 },
        { ddi: 886, name: 'República da China', label: 'República da China', sigla: 'TW', value: 886 },
        { ddi: 255, name: 'Tanzânia', label: 'Tanzânia', sigla: 'TZ', value: 255 },
        { ddi: 246, name: 'Território Britânico do Oceano Índico', label: 'Território Britânico do Oceano Índico', sigla: 'IO', value: 246 },
        { ddi: 670, name: 'TimorLeste', label: 'TimorLeste', sigla: 'TL', value: 670 },
        { ddi: 228, name: 'Togo', label: 'Togo', sigla: 'TG', value: 228 },
        { ddi: 690, name: 'Tokelau', label: 'Tokelau', sigla: 'TK', value: 690 },
        { ddi: 676, name: 'Tonga', label: 'Tonga', sigla: 'TO', value: 676 },
        { ddi: 1, name: 'Trinidad e Tobago', label: 'Trinidad e Tobago', sigla: 'TT', value: 1 },
        { ddi: 216, name: 'Tunísia', label: 'Tunísia', sigla: 'TN', value: 216 },
        { ddi: 1, name: 'Turcas e Caicos', label: 'Turcas e Caicos', sigla: 'TC', value: 1 },
        { ddi: 993, name: 'Turquemenistão', label: 'Turquemenistão', sigla: 'TM', value: 993 },
        { ddi: 90, name: 'Turquia', label: 'Turquia', sigla: 'TR', value: 90 },
        { ddi: 688, name: 'Tuvalu', label: 'Tuvalu', sigla: 'TV', value: 688 },
        { ddi: 380, name: 'Ucrânia', label: 'Ucrânia', sigla: 'UA', value: 380 },
        { ddi: 256, name: 'Uganda', label: 'Uganda', sigla: 'UG', value: 256 },
        { ddi: 598, name: 'Uruguai', label: 'Uruguai', sigla: 'UY', value: 598 },
        { ddi: 998, name: 'Uzbequistão', label: 'Uzbequistão', sigla: 'UZ', value: 998 },
        { ddi: 678, name: 'Vanuatu', label: 'Vanuatu', sigla: 'VU', value: 678 },
        { ddi: 379, name: 'Vaticano', label: 'Vaticano', sigla: 'VA', value: 379 },
        { ddi: 58, name: 'Venezuela', label: 'Venezuela', sigla: 'VE', value: 58 },
        { ddi: 84, name: 'Vietnã', label: 'Vietnã', sigla: 'VN', value: 84 },
        { ddi: 681, name: 'Wallis e Futuna', label: 'Wallis e Futuna', sigla: 'WF', value: 681 },
        { ddi: 260, name: 'Zâmbia', label: 'Zâmbia', sigla: 'ZM', value: 260 },
        { ddi: 263, name: 'Zimbábue', label: 'Zimbábue', sigla: 'ZW', value: 263 }
    ]);

    const country: Ref = ref({ value: 55, sigla: 'br' });
    const phone: Ref = ref('');
    const noMask = refAutoReset(false, 50);
    const onFocus = ref(false);

    watch(phone, () => {
        const start_zero = phone.value.length > 0 && phone.value[0] === '0';
        if (start_zero) phone.value = phone.value.substring(1);
    });

    const { ctrl, v } = useMagicKeys();
    watch(() => [ctrl.value, v.value],() => noMask.value = ctrl.value && v.value && onFocus.value);

    const item_selected = computed(() => country_ddi_flags.value.find((item: any) => item.value === country.value.value) ?? null);

    watch( () => props.modelValue, () => {
        if (!props.modelValue?.length || props.modelValue?.length === 0) return phone.value = '';

        const model_value = props.modelValue.replace(/[^0-9]/g, '');
        country.value = { value: parseInt(model_value.substring(0, 1)) };

        if (item_selected.value) {
            country.value = item_selected.value;
            phone.value = model_value.substring(1);
            return;
        }

        if (props.modelValue?.length > 1) {
            country.value = { value: parseInt(model_value.substring(0, 2)) };
            if (item_selected.value) {
                country.value = item_selected.value;
                phone.value = model_value.substring(2);
                return;
            }
        }
        if (props.modelValue?.length > 2) {
            country.value = { value: parseInt(model_value.substring(0, 3)) };
            if (item_selected.value) {
                country.value = item_selected.value;
                phone.value = model_value.substring(3);
                return;
            }
        }
        country.value = { value: 55, sigla: 'br' };
    },{ immediate: true });

    const temp_value = computed(() => country.value.value + phone.value.replace(/[^0-9]/g, ''));
    const emit = defineEmits(['update:modelValue']);
    const only_numbers = computed(() => String(temp_value.value).replace(/[^0-9]/g, ''));

    watchDebounced(temp_value,() => {
        if (temp_value.value !== props.modelValue) emit('update:modelValue', temp_value.value);
    },{ debounce: 500 });

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[0-9]/ },
            $: { pattern: /[0-9]/, optional: true },
            '@': { pattern: /[a-zA-Z0-9@(.+_-]/ },
            '%': { pattern: /[a-zA-Z0-9@().+_-\s]/, optional: true, repeated: true }
        };

        if (noMask.value) return {
            tokens: tokens,
            mask: '$$$$$$$$$$$$$$$$$$$$$$$$$$$$$'
        };

        if (country.value.value !== 55) return {
            tokens: tokens,
            mask: '%'
        };


        return {
            tokens: tokens,
            mask: only_numbers.value.length > 4 && (only_numbers.value[4] === '9' || only_numbers.value[4] === '8' || only_numbers.value[4] === '7' || only_numbers.value[4] === '6') ? '(##) 9 #### - ####$$' : '(##) #### - ####$$'
        };
    });

</script>

<style lang="scss">
.input-phone {
    .input-slot {
        grid-template-columns: 1fr;
    }

    .inputs-div {
        display: grid;
        grid-template-columns: auto 1fr;
        width: 100%;
        position: relative;
        grid-column: 1 !important;
        place-items: center;
        height: 36px !important;
        border: 1px solid red;
        border-radius: var(--max-inputtext-border-radius);
        border-color: var(--max-inputtext-focus-border-color);

        .p-select {
            height: 36px;
            background-color: transparent !important;
            border: none !important;
            width: 90px;

            .p-select-label {
                height: 36px;
                background-color: transparent !important;

                .item-selected {
                    display: grid;
                    grid-template-columns: 21px 1fr;
                    place-items: center;
                    height: 100%;
                    padding-left: 5px;

                    .item-flag {
                        width: 21px;
                        aspect-ratio: 3/2;
                        display: grid;
                        place-items: center;
                        border-radius: 5px;
                        overflow: hidden;
                        left: 0;
                        font-size: 1rem;

                        img {
                            width: 21px;
                            aspect-ratio: 3/2;
                        }
                    }
                }
            }
        }

        input {
            border: none !important;
            box-shadow: none !important;
            background-color: transparent !important;
        }
    }

    .p-inputicon {
        transform: translateY(-2px) !important;
    }

    [slot-a] {
        grid-column: 1 !important;
    }

    [slot-b] {
        grid-column: 2 !important;
    }

    .p-select-dropdown {
        display: none;
    }

    .p-select-label {
        padding: 0 !important;
        position: relative;
    }

    .p-inputtext {
        padding: 0 2px !important;
    }
}

.p-select-overlay {
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;

    .p-select-list-container {
    }
}
</style>