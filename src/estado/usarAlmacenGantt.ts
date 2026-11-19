import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { TAREAS_INICIALES_PROYECTO } from '../datos/proyectoInicial';
import type {
  FiltrosProyecto,
  IdentificadorIndicador,
  TareaProyecto,
  TemaVisual,
} from '../tipos/proyecto';

const ORDEN_INDICADORES_INICIAL: IdentificadorIndicador[] = [
  'duracion-total',
  'progreso-global',
  'tareas-activas',
  'ruta-critica',
];

const FILTROS_INICIALES: FiltrosProyecto = {
  busqueda: '',
  fase: 'Todas',
  responsable: 'Todos',
  soloRutaCritica: false,
  soloHitos: false,
};

function clonarTareas(tareas: TareaProyecto[]): TareaProyecto[] {
  return tareas.map((t) => ({
    ...t,
    predecesoras: [...t.predecesoras],
  }));
}

interface EstadoAlmacenGantt {
  tareas: TareaProyecto[];
  historialPasado: TareaProyecto[][];
  historialFuturo: TareaProyecto[][];

  ordenIndicadores: IdentificadorIndicador[];
  filtros: FiltrosProyecto;

  idTareaSeleccionada: string | null;
  idTareaHover: string | null;

  resaltarRutaCritica: boolean;
  anchoColumnaSemana: number;
  tema: TemaVisual;
  modalNuevaTareaAbierto: boolean;
  panelTablaColapsado: boolean;
  contadorRestablecimientoLayout: number;

  // Acciones sobre tareas e historial
  seleccionarTarea: (id: string | null) => void;
  establecerTareaHover: (id: string | null) => void;
  actualizarTarea: (
    id: string,
    cambios: Partial<Omit<TareaProyecto, 'id'>>,
    guardarHistorial?: boolean
  ) => void;
  registrarInstantaneaHistorial: () => void;
  reordenarTareas: (idActivo: string, idSobre: string) => void;
  agregarNuevaTarea: (nuevaTarea: Omit<TareaProyecto, 'id'>) => TareaProyecto;
  eliminarTarea: (id: string) => void;
  deshacer: () => boolean;
  rehacer: () => boolean;

  // Acciones de UI, filtros y layout
  reordenarIndicadores: (
    idActivo: IdentificadorIndicador,
    idSobre: IdentificadorIndicador
  ) => void;
  actualizarFiltros: (cambios: Partial<FiltrosProyecto>) => void;
  limpiarFiltros: () => void;
  alternarResaltadoRutaCritica: () => void;
  cambiarZoomSemana: (nuevoAncho: number) => void;
  alternarTema: () => void;
  establecerModalNuevaTarea: (abierto: boolean) => void;
  establecerPanelTablaColapsado: (colapsado: boolean) => void;
  restablecerTodoElCaso: () => void;
}

export const usarAlmacenGantt = create<EstadoAlmacenGantt>((set, get) => ({
  tareas: clonarTareas(TAREAS_INICIALES_PROYECTO),
  historialPasado: [],
  historialFuturo: [],

  ordenIndicadores: [...ORDEN_INDICADORES_INICIAL],
  filtros: { ...FILTROS_INICIALES },

  idTareaSeleccionada: null,
  idTareaHover: null,

  resaltarRutaCritica: true,
  anchoColumnaSemana: 96,
  tema: 'oscuro',
  modalNuevaTareaAbierto: false,
  panelTablaColapsado: false,
  contadorRestablecimientoLayout: 0,

  seleccionarTarea: (id) => set({ idTareaSeleccionada: id }),

  establecerTareaHover: (id) => set({ idTareaHover: id }),

  registrarInstantaneaHistorial: () => {
    const actual = clonarTareas(get().tareas);
    set((estado) => ({
      historialPasado: [...estado.historialPasado.slice(-29), actual],
      historialFuturo: [],
    }));
  },

  actualizarTarea: (id, cambios, guardarHistorial = true) => {
    const estadoActual = get();
    const copiaPasado = guardarHistorial
      ? [...estadoActual.historialPasado.slice(-29), clonarTareas(estadoActual.tareas)]
      : estadoActual.historialPasado;

    const tareasActualizadas = estadoActual.tareas.map((tarea) => {
      if (tarea.id !== id) return tarea;
      const semanaInicio =
        cambios.semanaInicio !== undefined
          ? Math.max(1, Math.round(cambios.semanaInicio * 2) / 2)
          : tarea.semanaInicio;
      const duracionSemanas =
        cambios.duracionSemanas !== undefined
          ? Math.max(0.5, Math.round(cambios.duracionSemanas * 2) / 2)
          : tarea.duracionSemanas;
      const porcentajeAvance =
        cambios.porcentajeAvance !== undefined
          ? Math.min(100, Math.max(0, Math.round(cambios.porcentajeAvance)))
          : tarea.porcentajeAvance;

      return {
        ...tarea,
        ...cambios,
        semanaInicio,
        duracionSemanas,
        porcentajeAvance,
      };
    });

    set({
      tareas: tareasActualizadas,
      historialPasado: copiaPasado,
      historialFuturo: guardarHistorial ? [] : estadoActual.historialFuturo,
    });
  },

  reordenarTareas: (idActivo, idSobre) => {
    if (idActivo === idSobre) return;
    const estadoActual = get();
    const indiceAntiguo = estadoActual.tareas.findIndex((t) => t.id === idActivo);
    const indiceNuevo = estadoActual.tareas.findIndex((t) => t.id === idSobre);
    if (indiceAntiguo === -1 || indiceNuevo === -1) return;

    const instantanea = clonarTareas(estadoActual.tareas);
    const nuevasTareas = arrayMove(estadoActual.tareas, indiceAntiguo, indiceNuevo);

    set({
      tareas: nuevasTareas,
      historialPasado: [...estadoActual.historialPasado.slice(-29), instantanea],
      historialFuturo: [],
    });
  },

  agregarNuevaTarea: (datosNuevaTarea) => {
    const estadoActual = get();
    const instantanea = clonarTareas(estadoActual.tareas);
    const numeroSecuencia = estadoActual.tareas.length + 1;
    const nuevoId = `T-${String(numeroSecuencia).padStart(2, '0')}`;

    const tareaCreada: TareaProyecto = {
      ...datosNuevaTarea,
      id: nuevoId,
      semanaInicio: Math.max(1, Math.round(datosNuevaTarea.semanaInicio * 2) / 2),
      duracionSemanas: Math.max(0.5, Math.round(datosNuevaTarea.duracionSemanas * 2) / 2),
      porcentajeAvance: Math.min(100, Math.max(0, Math.round(datosNuevaTarea.porcentajeAvance))),
    };

    set({
      tareas: [...estadoActual.tareas, tareaCreada],
      historialPasado: [...estadoActual.historialPasado.slice(-29), instantanea],
      historialFuturo: [],
      idTareaSeleccionada: nuevoId,
    });

    return tareaCreada;
  },

  eliminarTarea: (id) => {
    const estadoActual = get();
    const instantanea = clonarTareas(estadoActual.tareas);
    const tareasRestantes = estadoActual.tareas
      .filter((t) => t.id !== id)
      .map((t) => ({
        ...t,
        predecesoras: t.predecesoras.filter((p) => p !== id),
      }));

    set({
      tareas: tareasRestantes,
      historialPasado: [...estadoActual.historialPasado.slice(-29), instantanea],
      historialFuturo: [],
      idTareaSeleccionada:
        estadoActual.idTareaSeleccionada === id ? null : estadoActual.idTareaSeleccionada,
    });
  },

  deshacer: () => {
    const { historialPasado, tareas, historialFuturo } = get();
    if (historialPasado.length === 0) return false;

    const estadoPrevio = historialPasado[historialPasado.length - 1];
    const nuevoPasado = historialPasado.slice(0, -1);

    set({
      tareas: clonarTareas(estadoPrevio),
      historialPasado: nuevoPasado,
      historialFuturo: [clonarTareas(tareas), ...historialFuturo.slice(0, 29)],
    });
    return true;
  },

  rehacer: () => {
    const { historialFuturo, tareas, historialPasado } = get();
    if (historialFuturo.length === 0) return false;

    const estadoSiguiente = historialFuturo[0];
    const nuevoFuturo = historialFuturo.slice(1);

    set({
      tareas: clonarTareas(estadoSiguiente),
      historialPasado: [...historialPasado.slice(-29), clonarTareas(tareas)],
      historialFuturo: nuevoFuturo,
    });
    return true;
  },

  reordenarIndicadores: (idActivo, idSobre) => {
    if (idActivo === idSobre) return;
    set((estado) => {
      const idxAntiguo = estado.ordenIndicadores.indexOf(idActivo);
      const idxNuevo = estado.ordenIndicadores.indexOf(idSobre);
      if (idxAntiguo === -1 || idxNuevo === -1) return estado;
      return {
        ordenIndicadores: arrayMove(estado.ordenIndicadores, idxAntiguo, idxNuevo),
      };
    });
  },

  actualizarFiltros: (cambios) =>
    set((estado) => ({
      filtros: { ...estado.filtros, ...cambios },
    })),

  limpiarFiltros: () =>
    set({
      filtros: { ...FILTROS_INICIALES },
    }),

  alternarResaltadoRutaCritica: () =>
    set((estado) => ({
      resaltarRutaCritica: !estado.resaltarRutaCritica,
    })),

  cambiarZoomSemana: (nuevoAncho) =>
    set({
      anchoColumnaSemana: Math.min(160, Math.max(56, Math.round(nuevoAncho))),
    }),

  alternarTema: () => {
    const nuevoTema: TemaVisual = get().tema === 'oscuro' ? 'claro' : 'oscuro';
    document.documentElement.setAttribute('data-tema', nuevoTema);
    set({ tema: nuevoTema });
  },

  establecerModalNuevaTarea: (abierto) => set({ modalNuevaTareaAbierto: abierto }),

  establecerPanelTablaColapsado: (colapsado) => set({ panelTablaColapsado: colapsado }),

  restablecerTodoElCaso: () => {
    const estadoActual = get();
    const instantanea = clonarTareas(estadoActual.tareas);
    set({
      tareas: clonarTareas(TAREAS_INICIALES_PROYECTO),
      historialPasado: [...estadoActual.historialPasado.slice(-29), instantanea],
      historialFuturo: [],
      ordenIndicadores: [...ORDEN_INDICADORES_INICIAL],
      filtros: { ...FILTROS_INICIALES },
      idTareaSeleccionada: null,
      resaltarRutaCritica: true,
      anchoColumnaSemana: 96,
      panelTablaColapsado: false,
      contadorRestablecimientoLayout: estadoActual.contadorRestablecimientoLayout + 1,
    });
  },
}));
