import { MaybeRefOrGetter } from 'vue';
type RefString = MaybeRefOrGetter<string | number | null | undefined>;
/**
 * Encurta uma string até um limite de caracteres, adicionando reticências (...) ao final se necessário.
 *
 * @param value A string a ser encurtada.
 * @param limit O limite máximo de caracteres.
 * @param suffix O sufixo a ser adicionado (padrão: '...').
 */
export declare function truncate(value: RefString, limit?: number, suffix?: string): string;
/**
 * Converte uma string para um formato amigável para URLs (slug).
 * Remove acentos, caracteres especiais e substitui espaços por hífens.
 *
 * @param value A string a ser convertida.
 */
export declare function slugify(value: RefString): string;
/**
 * Remove todas as tags HTML de uma string, mantendo apenas o texto puro.
 * Útil para exibir prévias de conteúdos vindos de editores de texto (Rich Text) em notificações ou listas simplificadas.
 *
 * @param value A string contendo HTML.
 */
export declare function stripHtml(value: RefString): string;
/**
 * Extrai as iniciais de um nome completo (ex: "João Victor Silva" ➔ "JS").
 * Perfeito para gerar placeholders de avatares quando o usuário não tem uma foto de perfil.
 *
 * @param value O nome completo.
 * @param limit O número máximo de iniciais (padrão: 2).
 */
export declare function initials(value: RefString, limit?: number): string;
/**
 * Calcula o tempo estimado de leitura de um texto.
 * Ótimo para blogs ou áreas de documentação, dando ao usuário uma ideia de quanto tempo ele levará para ler um conteúdo.
 *
 * @param value O texto a ser analisado (pode conter HTML).
 * @param wordsPerMinute A média de palavras lidas por minuto (padrão: 200).
 */
export declare function readingTime(value: RefString, wordsPerMinute?: number): string;
export {};
//# sourceMappingURL=manipulations.d.ts.map