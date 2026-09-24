import { svgToDataUri } from '../helpers/svgToDataUri';

import acSvg from '../assets/flags-br/ac.svg?raw';
import alSvg from '../assets/flags-br/al.svg?raw';
import amSvg from '../assets/flags-br/am.svg?raw';
import apSvg from '../assets/flags-br/ap.svg?raw';
import baSvg from '../assets/flags-br/ba.svg?raw';
import brSvg from '../assets/flags-br/br.svg?raw';
import ceSvg from '../assets/flags-br/ce.svg?raw';
import dfSvg from '../assets/flags-br/df.svg?raw';
import esSvg from '../assets/flags-br/es.svg?raw';
import goSvg from '../assets/flags-br/go.svg?raw';
import maSvg from '../assets/flags-br/ma.svg?raw';
import mgSvg from '../assets/flags-br/mg.svg?raw';
import msSvg from '../assets/flags-br/ms.svg?raw';
import mtSvg from '../assets/flags-br/mt.svg?raw';
import paSvg from '../assets/flags-br/pa.svg?raw';
import pbSvg from '../assets/flags-br/pb.svg?raw';
import peSvg from '../assets/flags-br/pe.svg?raw';
import piSvg from '../assets/flags-br/pi.svg?raw';
import prSvg from '../assets/flags-br/pr.svg?raw';
import rjSvg from '../assets/flags-br/rj.svg?raw';
import rnSvg from '../assets/flags-br/rn.svg?raw';
import roSvg from '../assets/flags-br/ro.svg?raw';
import rrSvg from '../assets/flags-br/rr.svg?raw';
import rsSvg from '../assets/flags-br/rs.svg?raw';
import scSvg from '../assets/flags-br/sc.svg?raw';
import seSvg from '../assets/flags-br/se.svg?raw';
import spSvg from '../assets/flags-br/sp.svg?raw';
import toSvg from '../assets/flags-br/to.svg?raw';

export interface BrazilState {
    uf: string;
    name: string;
    min: string;
    region: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul' | 'Nacional';
    flag: string;
    rawSvg: string;
}

export const BRAZIL_NATIONAL_STATE: BrazilState = {
    uf: 'BR',
    name: 'Brasil',
    min: 'Brasil',
    region: 'Nacional',
    flag: svgToDataUri(brSvg),
    rawSvg: brSvg
};

export const BRAZIL_STATES: BrazilState[] = [
    {
        uf: 'AC',
        name: 'Acre',
        min: 'Acre',
        region: 'Norte',
        flag: svgToDataUri(acSvg),
        rawSvg: acSvg
    },
    {
        uf: 'AL',
        name: 'Alagoas',
        min: 'Alagoas',
        region: 'Nordeste',
        flag: svgToDataUri(alSvg),
        rawSvg: alSvg
    },
    {
        uf: 'AP',
        name: 'Amapá',
        min: 'Amapá',
        region: 'Norte',
        flag: svgToDataUri(apSvg),
        rawSvg: apSvg
    },
    {
        uf: 'AM',
        name: 'Amazonas',
        min: 'Amazonas',
        region: 'Norte',
        flag: svgToDataUri(amSvg),
        rawSvg: amSvg
    },
    {
        uf: 'BA',
        name: 'Bahia',
        min: 'Bahia',
        region: 'Nordeste',
        flag: svgToDataUri(baSvg),
        rawSvg: baSvg
    },
    {
        uf: 'CE',
        name: 'Ceará',
        min: 'Ceará',
        region: 'Nordeste',
        flag: svgToDataUri(ceSvg),
        rawSvg: ceSvg
    },
    {
        uf: 'DF',
        name: 'Distrito Federal',
        min: 'Distrito Fed.',
        region: 'Centro-Oeste',
        flag: svgToDataUri(dfSvg),
        rawSvg: dfSvg
    },
    {
        uf: 'ES',
        name: 'Espírito Santo',
        min: 'Esp. Santo',
        region: 'Sudeste',
        flag: svgToDataUri(esSvg),
        rawSvg: esSvg
    },
    {
        uf: 'GO',
        name: 'Goiás',
        min: 'Goiás',
        region: 'Centro-Oeste',
        flag: svgToDataUri(goSvg),
        rawSvg: goSvg
    },
    {
        uf: 'MA',
        name: 'Maranhão',
        min: 'Maranhão',
        region: 'Nordeste',
        flag: svgToDataUri(maSvg),
        rawSvg: maSvg
    },
    {
        uf: 'MT',
        name: 'Mato Grosso',
        min: 'Mato Grosso',
        region: 'Centro-Oeste',
        flag: svgToDataUri(mtSvg),
        rawSvg: mtSvg
    },
    {
        uf: 'MS',
        name: 'Mato Grosso do Sul',
        min: 'M. G. do Sul',
        region: 'Centro-Oeste',
        flag: svgToDataUri(msSvg),
        rawSvg: msSvg
    },
    {
        uf: 'MG',
        name: 'Minas Gerais',
        min: 'Minas Gerais',
        region: 'Sudeste',
        flag: svgToDataUri(mgSvg),
        rawSvg: mgSvg
    },
    {
        uf: 'PA',
        name: 'Pará',
        min: 'Pará',
        region: 'Norte',
        flag: svgToDataUri(paSvg),
        rawSvg: paSvg
    },
    {
        uf: 'PB',
        name: 'Paraíba',
        min: 'Paraíba',
        region: 'Nordeste',
        flag: svgToDataUri(pbSvg),
        rawSvg: pbSvg
    },
    {
        uf: 'PR',
        name: 'Paraná',
        min: 'Paraná',
        region: 'Sul',
        flag: svgToDataUri(prSvg),
        rawSvg: prSvg
    },
    {
        uf: 'PE',
        name: 'Pernambuco',
        min: 'Pernambuco',
        region: 'Nordeste',
        flag: svgToDataUri(peSvg),
        rawSvg: peSvg
    },
    {
        uf: 'PI',
        name: 'Piauí',
        min: 'Piauí',
        region: 'Nordeste',
        flag: svgToDataUri(piSvg),
        rawSvg: piSvg
    },
    {
        uf: 'RJ',
        name: 'Rio de Janeiro',
        min: 'Rio de Janeiro',
        region: 'Sudeste',
        flag: svgToDataUri(rjSvg),
        rawSvg: rjSvg
    },
    {
        uf: 'RN',
        name: 'Rio Grande do Norte',
        min: 'R. G. do Norte',
        region: 'Nordeste',
        flag: svgToDataUri(rnSvg),
        rawSvg: rnSvg
    },
    {
        uf: 'RS',
        name: 'Rio Grande do Sul',
        min: 'R. G. do Sul',
        region: 'Sul',
        flag: svgToDataUri(rsSvg),
        rawSvg: rsSvg
    },
    {
        uf: 'RO',
        name: 'Rondônia',
        min: 'Rondônia',
        region: 'Norte',
        flag: svgToDataUri(roSvg),
        rawSvg: roSvg
    },
    {
        uf: 'RR',
        name: 'Roraima',
        min: 'Roraima',
        region: 'Norte',
        flag: svgToDataUri(rrSvg),
        rawSvg: rrSvg
    },
    {
        uf: 'SC',
        name: 'Santa Catarina',
        min: 'Santa Catarina',
        region: 'Sul',
        flag: svgToDataUri(scSvg),
        rawSvg: scSvg
    },
    {
        uf: 'SP',
        name: 'São Paulo',
        min: 'São Paulo',
        region: 'Sudeste',
        flag: svgToDataUri(spSvg),
        rawSvg: spSvg
    },
    {
        uf: 'SE',
        name: 'Sergipe',
        min: 'Sergipe',
        region: 'Nordeste',
        flag: svgToDataUri(seSvg),
        rawSvg: seSvg
    },
    {
        uf: 'TO',
        name: 'Tocantins',
        min: 'Tocantins',
        region: 'Norte',
        flag: svgToDataUri(toSvg),
        rawSvg: toSvg
    }
];
