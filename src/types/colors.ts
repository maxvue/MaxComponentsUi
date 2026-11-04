export const COLOR_SCALE_LEVELS = [
    0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475,
    500, 525, 550, 575, 600, 625, 650, 675, 700, 725, 750, 775, 800, 825, 850, 875, 900
] as const;

export type ColorScaleLevel = (typeof COLOR_SCALE_LEVELS)[number];

export const PRIMARY_COLOR_NAMES = [
    'pink',
    'red',
    'orange',
    'yellow',
    'green',
    'emerald',
    'seagreen',
    'lime',
    'blue',
    'violet',
    'gray',
    'zinc',
    'white',
    'black',
    'background',
    'primary',
    'secondary',
    'warn',
    'danger',
    'success',
    'info',
    'error',
    'text',
    'border'
] as const;

export type PrimaryColorName = (typeof PRIMARY_COLOR_NAMES)[number];

export type SecondaryColorName =
    | `${PrimaryColorName}-b`
    | 'gray-light';

export type BaseColorName = PrimaryColorName | SecondaryColorName;

export type BaseColorPalette = Record<BaseColorName, string>;

export type PartialColorPalette = Partial<Record<BaseColorName, string>> & Record<string, string | undefined>;

export type ColorScales = Record<BaseColorName, Record<ColorScaleLevel, string>>;

export const DEFAULT_BASE_COLORS: BaseColorPalette = {
    // Cores primárias
    pink: '#ED58A2',
    red: '#E88188',
    orange: '#F9B182',
    yellow: '#FFE38B',
    green: '#96D796',
    emerald: '#25BF8C',
    seagreen: '#34B9B1',
    lime: '#8FD02B',
    blue: '#56C2D7',
    violet: '#AF64F7',
    gray: '#ABBBCD',
    zinc: '#7D7D86',
    white: '#EEEEEE',
    black: '#111111',
    background: '#ABBBCD',
    primary: '#B8BFCA',
    secondary: '#7D7D86',
    warn: '#F5A621',
    danger: '#FF766F',
    success: '#83E083',
    info: '#23ADEB',
    error: '#E88188',
    text: '#334155',
    border: '#CBD5E1',

    // Cores secundárias canônicas históricas
    'red-b': '#FF766F',
    'orange-b': '#FFAD48',
    'yellow-b': '#FDFD9F',
    'green-b': '#83E083',
    'blue-b': '#8FBCF5',
    'gray-light': '#D7E0E9',

    // Cores secundárias derivadas para as demais cores principais
    'pink-b': '#FC69B2',
    'emerald-b': '#18E3A0',
    'seagreen-b': '#2ED6CC',
    'lime-b': '#9EE62E',
    'violet-b': '#C07FFF',
    'gray-b': '#C0CEDD',
    'zinc-b': '#8A8A93',
    'white-b': '#FFFFFF',
    'black-b': '#131313',
    'background-b': '#C0CEDD',
    'primary-b': '#CDD3DC',
    'secondary-b': '#8A8A93',
    'warn-b': '#FFB333',
    'danger-b': '#FF766F',
    'success-b': '#83E083',
    'info-b': '#2ABDFF',
    'error-b': '#F5989E',
    'text-b': '#344761',
    'border-b': '#E5EBF2'
};

export interface ColorPaletteCacheEntry {
    version: string;
    signature: string;
    css: string;
}
