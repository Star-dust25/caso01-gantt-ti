import clsx, { type ClassValue } from 'clsx';

/**
 * Combina clases de Bulma v1 y clases personalizadas de manera limpia y tipada.
 */
export function combinarClases(...valores: ClassValue[]): string {
  return clsx(valores);
}
