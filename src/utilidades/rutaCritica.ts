import type {
  MetricasTareaCPM,
  ResultadoRutaCritica,
  TareaProyecto,
} from '../tipos/proyecto';

/**
 * Redondea un número a precisión de centésimas para evitar errores de punto flotante.
 */
function redondearPrecision(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Calcula la Ruta Crítica (CPM), holguras, conflictos de dependencia y métricas globales
 * en función de las posiciones reales en el cronograma y el grafo de predecesoras.
 */
export function calcularRutaCritica(tareas: TareaProyecto[]): ResultadoRutaCritica {
  if (tareas.length === 0) {
    return {
      duracionTotalSemanas: 12,
      idsTareasCriticas: [],
      metricasPorTarea: {},
      totalHitos: 0,
      hitosCompletados: 0,
      progresoGlobalPonderado: 0,
    };
  }

  const mapaTareas = new Map<string, TareaProyecto>();
  const mapaSucesoras = new Map<string, string[]>();

  for (const tarea of tareas) {
    mapaTareas.set(tarea.id, tarea);
    mapaSucesoras.set(tarea.id, []);
  }

  for (const tarea of tareas) {
    for (const idPredecesora of tarea.predecesoras) {
      if (mapaTareas.has(idPredecesora)) {
        const lista = mapaSucesoras.get(idPredecesora) ?? [];
        lista.push(tarea.id);
        mapaSucesoras.set(idPredecesora, lista);
      }
    }
  }

  // Ordenamiento topológico (Kahn) con respaldo ante posibles ciclos
  const gradoEntrada = new Map<string, number>();
  for (const tarea of tareas) {
    const predecesorasValidas = tarea.predecesoras.filter((id) => mapaTareas.has(id));
    gradoEntrada.set(tarea.id, predecesorasValidas.length);
  }

  const cola: string[] = [];
  for (const [id, grado] of gradoEntrada.entries()) {
    if (grado === 0) {
      cola.push(id);
    }
  }

  const ordenTopologico: string[] = [];
  while (cola.length > 0) {
    const idActual = cola.shift()!;
    ordenTopologico.push(idActual);
    const sucesoras = mapaSucesoras.get(idActual) ?? [];
    for (const idSucesora of sucesoras) {
      const nuevoGrado = (gradoEntrada.get(idSucesora) ?? 1) - 1;
      gradoEntrada.set(idSucesora, nuevoGrado);
      if (nuevoGrado === 0) {
        cola.push(idSucesora);
      }
    }
  }

  // Si alguna tarea quedó fuera por referencia circular, la agregamos al final
  for (const tarea of tareas) {
    if (!ordenTopologico.includes(tarea.id)) {
      ordenTopologico.push(tarea.id);
    }
  }

  // Paso hacia adelante (Forward Pass): Inicio Temprano (ES) y Fin Temprano (EF)
  const inicioTempranoMapa = new Map<string, number>();
  const finTempranoMapa = new Map<string, number>();
  const conflictoMapa = new Map<string, boolean>();

  for (const idTarea of ordenTopologico) {
    const tarea = mapaTareas.get(idTarea)!;
    const inicioProgramado = redondearPrecision(Math.max(0, tarea.semanaInicio - 1));
    const duracion = redondearPrecision(Math.max(0.5, tarea.duracionSemanas));

    let maxFinPredecesorasTemprano = 0;
    let maxFinPredecesorasReal = 0;

    for (const idPred of tarea.predecesoras) {
      const pred = mapaTareas.get(idPred);
      if (pred) {
        const finTempranoPred = finTempranoMapa.get(idPred) ?? 0;
        const finRealPred = redondearPrecision(
          Math.max(0, pred.semanaInicio - 1) + Math.max(0.5, pred.duracionSemanas)
        );
        if (finTempranoPred > maxFinPredecesorasTemprano) {
          maxFinPredecesorasTemprano = finTempranoPred;
        }
        if (finRealPred > maxFinPredecesorasReal) {
          maxFinPredecesorasReal = finRealPred;
        }
      }
    }

    const tieneConflicto =
      tarea.predecesoras.length > 0 && inicioProgramado < maxFinPredecesorasReal - 0.01;
    conflictoMapa.set(idTarea, tieneConflicto);

    const es = redondearPrecision(Math.max(inicioProgramado, maxFinPredecesorasTemprano));
    const ef = redondearPrecision(es + duracion);

    inicioTempranoMapa.set(idTarea, es);
    finTempranoMapa.set(idTarea, ef);
  }

  // Duración total del proyecto
  let duracionMaxima = 0;
  for (const tarea of tareas) {
    const finReal = redondearPrecision(
      Math.max(0, tarea.semanaInicio - 1) + Math.max(0.5, tarea.duracionSemanas)
    );
    const finTemprano = finTempranoMapa.get(tarea.id) ?? 0;
    duracionMaxima = Math.max(duracionMaxima, finReal, finTemprano);
  }
  const duracionTotalSemanas = redondearPrecision(Math.max(0.5, duracionMaxima));

  // Paso hacia atrás (Backward Pass): Fin Tardío (LF) e Inicio Tardío (LS)
  const inicioTardioMapa = new Map<string, number>();
  const finTardioMapa = new Map<string, number>();

  for (let i = ordenTopologico.length - 1; i >= 0; i--) {
    const idTarea = ordenTopologico[i];
    const tarea = mapaTareas.get(idTarea)!;
    const duracion = redondearPrecision(Math.max(0.5, tarea.duracionSemanas));
    const sucesoras = mapaSucesoras.get(idTarea) ?? [];

    let lf = duracionTotalSemanas;
    if (sucesoras.length > 0) {
      let minInicioTardioSucesoras = Number.POSITIVE_INFINITY;
      for (const idSuc of sucesoras) {
        const lsSucesora = inicioTardioMapa.get(idSuc);
        if (lsSucesora !== undefined && lsSucesora < minInicioTardioSucesoras) {
          minInicioTardioSucesoras = lsSucesora;
        }
      }
      if (Number.isFinite(minInicioTardioSucesoras)) {
        lf = redondearPrecision(minInicioTardioSucesoras);
      }
    }

    const ls = redondearPrecision(lf - duracion);
    finTardioMapa.set(idTarea, lf);
    inicioTardioMapa.set(idTarea, ls);
  }

  // Construcción de métricas por tarea e identificación de Ruta Crítica
  const metricasPorTarea: Record<string, MetricasTareaCPM> = {};
  const idsTareasCriticas: string[] = [];

  let sumaDuracionPonderada = 0;
  let sumaAvancePonderado = 0;
  let totalHitos = 0;
  let hitosCompletados = 0;

  for (const tarea of tareas) {
    const es = inicioTempranoMapa.get(tarea.id) ?? 0;
    const ef = finTempranoMapa.get(tarea.id) ?? 0;
    const ls = inicioTardioMapa.get(tarea.id) ?? 0;
    const lf = finTardioMapa.get(tarea.id) ?? 0;
    const holgura = redondearPrecision(Math.max(0, lf - ef));
    const esCritica = holgura <= 0.01;

    if (esCritica) {
      idsTareasCriticas.push(tarea.id);
    }

    metricasPorTarea[tarea.id] = {
      idTarea: tarea.id,
      inicioTemprano: es,
      finTemprano: ef,
      inicioTardio: ls,
      finTardio: lf,
      holgura,
      esCritica,
      tieneConflictoDependencia: conflictoMapa.get(tarea.id) ?? false,
    };

    const peso = Math.max(0.5, tarea.duracionSemanas);
    sumaDuracionPonderada += peso;
    sumaAvancePonderado += peso * tarea.porcentajeAvance;

    if (tarea.esHito) {
      totalHitos += 1;
      if (tarea.porcentajeAvance >= 100) {
        hitosCompletados += 1;
      }
    }
  }

  const progresoGlobalPonderado =
    sumaDuracionPonderada > 0
      ? Math.round(sumaAvancePonderado / sumaDuracionPonderada)
      : 0;

  return {
    duracionTotalSemanas,
    idsTareasCriticas,
    metricasPorTarea,
    totalHitos,
    hitosCompletados,
    progresoGlobalPonderado,
  };
}

/**
 * Verifica si agregar una dependencia crearía un ciclo en el grafo del proyecto.
 */
export function creaCicloDependencia(
  tareas: TareaProyecto[],
  idTareaOrigen: string,
  idNuevaPredecesora: string
): boolean {
  if (idTareaOrigen === idNuevaPredecesora) return true;

  const mapaPredecesoras = new Map<string, string[]>();
  for (const t of tareas) {
    mapaPredecesoras.set(t.id, [...t.predecesoras]);
  }

  const visitados = new Set<string>();
  const pila = [idNuevaPredecesora];

  while (pila.length > 0) {
    const actual = pila.pop()!;
    if (actual === idTareaOrigen) return true;
    if (!visitados.has(actual)) {
      visitados.add(actual);
      const preds = mapaPredecesoras.get(actual) ?? [];
      for (const p of preds) {
        pila.push(p);
      }
    }
  }

  return false;
}
