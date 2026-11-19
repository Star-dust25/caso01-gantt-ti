// ============================================================================
// TIPOS E INTERFACES DE DOMINIO DEL PROYECTO TI (CASO 01 - DIAGRAMA DE GANTT)
// ============================================================================

export type FaseProyecto =
  | 'Inicio y Planificación'
  | 'Análisis y Diseño'
  | 'Desarrollo e Integración'
  | 'Pruebas y Calidad (QA)'
  | 'Despliegue y Cierre';

export type RolResponsable =
  | 'PM'
  | 'Arquitecto Cloud'
  | 'Diseñador UX/UI'
  | 'Dev Backend'
  | 'Dev Frontend'
  | 'QA'
  | 'DevOps';

export type TemaVisual = 'oscuro' | 'claro';

export type IdentificadorIndicador =
  | 'duracion-total'
  | 'progreso-global'
  | 'tareas-activas'
  | 'ruta-critica';

export interface TareaProyecto {
  id: string;
  codigo: string;
  nombre: string;
  fase: FaseProyecto;
  responsable: RolResponsable;
  /** Semana de inicio (1 a N, soporta precisión de media semana como 1.5) */
  semanaInicio: number;
  /** Duración en semanas (mínimo 0.5 semanas) */
  duracionSemanas: number;
  /** Porcentaje de avance de 0 a 100 */
  porcentajeAvance: number;
  entregablePrincipal: string;
  /** Lista de IDs de tareas predecesoras */
  predecesoras: string[];
  esHito: boolean;
  notas: string;
}

export interface MetricasTareaCPM {
  idTarea: string;
  inicioTemprano: number;
  finTemprano: number;
  inicioTardio: number;
  finTardio: number;
  holgura: number;
  esCritica: boolean;
  tieneConflictoDependencia: boolean;
}

export interface ResultadoRutaCritica {
  duracionTotalSemanas: number;
  idsTareasCriticas: string[];
  metricasPorTarea: Record<string, MetricasTareaCPM>;
  totalHitos: number;
  hitosCompletados: number;
  progresoGlobalPonderado: number;
}

export interface FiltrosProyecto {
  busqueda: string;
  fase: FaseProyecto | 'Todas';
  responsable: RolResponsable | 'Todos';
  soloRutaCritica: boolean;
  soloHitos: boolean;
}
