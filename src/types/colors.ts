export const COLOR_SCALE_LEVELS = [
    0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475,
    500, 525, 550, 575, 600, 625, 650, 675, 700, 725, 750, 775, 800, 825, 850, 875, 900
] as const;

export type ColorScaleLevel = (typeof COLOR_SCALE_LEVELS)[number];

export type BaseColorName =
    | 'pink'
    | 'red'
    | 'red-b'
    | 'orange'
    | 'orange-b'
    | 'yellow'
    | 'yellow-b'
    | 'green'
    | 'green-b'
    | 'emerald'
    | 'seagreen'
    | 'lime'
    | 'blue'
    | 'blue-b'
    | 'violet'
    | 'gray'
    | 'gray-light'
    | 'zinc'
    | 'white'
    | 'black'
    | 'background'
    | 'primary'
    | 'secondary'
    | 'warn'
    | 'danger'
    | 'success'
    | 'info'
    | 'error';

export type BaseColorPalette = Record<BaseColorName, string>;

export type PartialColorPalette = Partial<Record<BaseColorName, string>>;

export type ColorScales = Record<BaseColorName, Record<ColorScaleLevel, string>>;

export const DEFAULT_BASE_COLORS: BaseColorPalette = {
    pink: '#ED58A2',
    red: '#E88188',
    'red-b': '#FF766F',
    orange: '#F9B182',
    'orange-b': '#FFAD48',
    yellow: '#FFE38B',
    'yellow-b': '#FDFD9F',
    green: '#96D796',
    'green-b': '#83E083',
    emerald: '#25BF8C',
    seagreen: '#34B9B1',
    lime: '#8FD02B',
    blue: '#56C2D7',
    'blue-b': '#8FBCF5',
    violet: '#AF64F7',
    gray: '#ABBBCD',
    'gray-light': '#D7E0E9',
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
    error: '#E88188'
};

export interface ColorPaletteCacheEntry {
    version: string;
    signature: string;
    css: string;
}
