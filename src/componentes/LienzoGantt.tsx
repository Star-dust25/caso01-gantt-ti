import React from 'react';
import { usarAlmacenGantt } from '../estado/usarAlmacenGantt';
import type { MetricasTareaCPM, TareaProyecto } from '../tipos/proyecto';
import { combinarClases } from '../utilidades/clases';
import { BarraTarea } from './BarraTarea';
import { ConectoresDependencia } from './ConectoresDependencia';

interface PropiedadesLienzoGantt {
  tareas: TareaProyecto[];
  metricasPorTarea: Record<string, MetricasTareaCPM>;
  duracionTotalSemanas: number;
  referenciaScrollGantt: React.RefObject<HTMLDivElement | null>;
  alDesplazarVerticalmente: (evento: React.UIEvent<HTMLDivElement>) => void;
}

const ALTURA_FILA_PX = 46;

export const LienzoGantt: React.FC<PropiedadesLienzoGantt> = ({
  tareas,
  metricasPorTarea,
  duracionTotalSemanas,
  referenciaScrollGantt,
  alDesplazarVerticalmente,
}) => {
  const anchoColumnaSemana = usarAlmacenGantt((e) => e.anchoColumnaSemana);
  const resaltarRutaCritica = usarAlmacenGantt((e) => e.resaltarRutaCritica);
  const idTareaSeleccionada = usarAlmacenGantt((e) => e.idTareaSeleccionada);
  const idTareaHover = usarAlmacenGantt((e) => e.idTareaHover);
  const seleccionarTarea = usarAlmacenGantt((e) => e.seleccionarTarea);
  const establecerTareaHover = usarAlmacenGantt((e) => e.establecerTareaHover);

  // Aseguramos mostrar al menos las 12 semanas base + margen dinámico si se arrastra más allá
  const totalColumnasSemanas = Math.max(
    12,
    Math.ceil(duracionTotalSemanas + 1)
  );
  const listaSemanas = Array.from(
    { length: totalColumnasSemanas },
    (_, indice) => indice + 1
  );

  const anchoTotalCronogramaPx = totalColumnasSemanas * anchoColumnaSemana;
  const alturaTotalCuerpoPx = tareas.length * ALTURA_FILA_PX;

  return (
    <div className="contenedor-lienzo-gantt">
      <div
        ref={referenciaScrollGantt}
        className="envoltorio-scroll-gantt"
        onScroll={alDesplazarVerticalmente}
      >
        <div
          className="interior-cronograma-gantt"
          style={{ width: `${anchoTotalCronogramaPx}px` }}
        >
          {/* Encabezado sticky del cronograma (56px exactos para alineación milimétrica) */}
          <div className="encabezado-cronograma-gantt">
            <div className="fila-fases-superiores">
              <span>
                CRONOGRAMA EJECUTIVO DE SEMANAS (LÍNEA BASE: 12 SEMANAS · AJUSTE
                MAGNÉTICO 0.5 SEM)
              </span>
              <span style={{ color: 'var(--color-acento)' }}>
                FIN PROYECTADO: SEMANA {duracionTotalSemanas}
              </span>
            </div>

            <div className="fila-columnas-semanas">
              {listaSemanas.map((numeroSemana) => (
                <div
                  key={numeroSemana}
                  className={combinarClases(
                    'columna-encabezado-semana',
                    numeroSemana === 12 && 'es-semana-limite'
                  )}
                  style={{
                    width: `${anchoColumnaSemana}px`,
                    minWidth: `${anchoColumnaSemana}px`,
                  }}
                >
                  <span className="etiqueta-semana-principal">
                    Sem {String(numeroSemana).padStart(2, '0')}
                  </span>
                  <span className="subdivision-media-semana">
                    {numeroSemana === 12 ? 'Meta Base' : 'S1 · S2'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cuerpo de filas y barras del Gantt */}
          <div
            className="cuerpo-filas-gantt"
            style={{ height: `${alturaTotalCuerpoPx}px` }}
          >
            {/* Malla vertical de fondo por semana */}
            <div className="malla-columnas-fondo">
              {listaSemanas.map((numeroSemana) => (
                <div
                  key={numeroSemana}
                  className={combinarClases(
                    'columna-malla-semana',
                    numeroSemana % 2 === 0 && 'es-columna-par'
                  )}
                  style={{
                    width: `${anchoColumnaSemana}px`,
                    minWidth: `${anchoColumnaSemana}px`,
                  }}
                />
              ))}
            </div>

            {/* Conectores curvos SVG de dependencias entre tareas */}
            <ConectoresDependencia
              tareasVisibles={tareas}
              metricasPorTarea={metricasPorTarea}
              anchoColumnaSemana={anchoColumnaSemana}
              alturaFila={ALTURA_FILA_PX}
              resaltarRutaCritica={resaltarRutaCritica}
              idTareaEnfocada={idTareaHover ?? idTareaSeleccionada}
            />

            {/* Filas sincronizadas 1 a 1 con la tabla izquierda */}
            {tareas.map((tarea) => {
              const metricas = metricasPorTarea[tarea.id];
              const esSeleccionada = idTareaSeleccionada === tarea.id;
              const esHover = idTareaHover === tarea.id;
              const esCriticaResaltada = Boolean(
                resaltarRutaCritica && metricas?.esCritica
              );

              return (
                <div
                  key={tarea.id}
                  className={combinarClases(
                    'fila-lienzo-tarea',
                    esSeleccionada && 'es-seleccionada',
                    esHover && 'es-hover'
                  )}
                  onMouseEnter={() => establecerTareaHover(tarea.id)}
                  onMouseLeave={() => establecerTareaHover(null)}
                  onClick={() =>
                    seleccionarTarea(esSeleccionada ? null : tarea.id)
                  }
                >
                  <BarraTarea
                    tarea={tarea}
                    metricas={metricas}
                    anchoColumnaSemana={anchoColumnaSemana}
                    esCriticaResaltada={esCriticaResaltada}
                    esSeleccionada={esSeleccionada}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
