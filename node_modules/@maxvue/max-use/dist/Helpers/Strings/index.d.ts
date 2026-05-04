import { Random, ulid, intervalRandom } from './random';
import { truncate, slugify, stripHtml, initials, readingTime } from './manipulations';
import { onlyLetters, onlyNumbers, onlySymbols, onlyLettersAndNumbers, removeSpaces } from './filters';
import { snakeCase, kebabCase, camelCase, capitalize } from './cases';
export * from './random';
export * from './masks';
export * from './filters';
export * from './cases';
export * from './converters';
export * from './manipulations';
export { stripHtml as noHtml };
export declare const Str: {
    Random: typeof Random;
    code: typeof Random;
    ulid: typeof ulid;
    intervalRandom: typeof intervalRandom;
    interval: typeof intervalRandom;
    truncate: typeof truncate;
    slugify: typeof slugify;
    capitalize: typeof capitalize;
    noHtml: typeof stripHtml;
    initials: typeof initials;
    readingTime: typeof readingTime;
};
export declare const StrFilter: {
    onlyLetters: typeof onlyLetters;
    onlyNumbers: typeof onlyNumbers;
    onlyLettersAndNumbers: typeof onlyLettersAndNumbers;
    onlySymbols: typeof onlySymbols;
    removeSpaces: typeof removeSpaces;
};
export declare const StrCase: {
    snakeCase: typeof snakeCase;
    kebabCase: typeof kebabCase;
    camelCase: typeof camelCase;
    capitalize: typeof capitalize;
};
//# sourceMappingURL=index.d.ts.map