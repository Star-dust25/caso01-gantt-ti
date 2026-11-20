import React, { useState, useRef } from 'react';
import { usarAlmacenGantt } from '../estado/usarAlmacenGantt';
import type { MetricasTareaCPM, TareaProyecto } from '../tipos/proyecto';
import { combinarClases } from '../utilidades/clases';

interface PropiedadesBarraTarea {
  tarea: TareaProyecto;
  metricas?: MetricasTareaCPM;
  anchoColumnaSemana: number;
  esCriticaResaltada: boolean;
  esSeleccionada: boolean;
}

type ModoManipulacion = 'mover' | 'estirar-izquierda' | 'estirar-derecha' | null;

/**
 * Redondea al incremento magnético de media semana (0.5 semanas).
 */
function ajustarMediaSemana(valor: number): number {
  return Math.round(valor * 2) / 2;
}

export const BarraTarea: React.FC<PropiedadesBarraTarea> = ({
  tarea,
  metricas,
  anchoColumnaSemana,
  esCriticaResaltada,
  esSeleccionada,
}) => {
  const actualizarTarea = usarAlmacenGantt((e) => e.actualizarTarea);
  const registrarInstantaneaHistorial = usarAlmacenGantt(
    (e) => e.registrarInstantaneaHistorial
  );
  const seleccionarTarea = usarAlmacenGantt((e) => e.seleccionarTarea);

  const [modoActivo, setModoActivo] = useState<ModoManipulacion>(null);
  const huboMovimientoRef = useRef<boolean>(false);

  const desplazamientoIzquierdoPx = (tarea.semanaInicio - 1) * anchoColumnaSemana;
  const anchoBarraPx = Math.max(0.5, tarea.duracionSemanas) * anchoColumnaSemana;

  const iniciarManipulacion = (
    evento: React.PointerEvent<HTMLDivElement>,
    modo: Exclude<ModoManipulacion, null>
  ) => {
    evento.stopPropagation();
    evento.preventDefault();

    const xInicial = evento.clientX;
    const inicioOriginal = tarea.semanaInicio;
    const duracionOriginal = tarea.duracionSemanas;
    let instantaneaGuardada = false;
    huboMovimientoRef.current = false;

    setModoActivo(modo);

    const manejarMovimientoPuntero = (evMov: PointerEvent) => {
      const deltaPx = evMov.clientX - xInicial;
      if (Math.abs(deltaPx) > 3) {
        huboMovimientoRef.current = true;
      }

      const deltaSemanas = ajustarMediaSemana(deltaPx / anchoColumnaSemana);
      if (deltaSemanas === 0 && !instantaneaGuardada) return;

      if (!instantaneaGuardada) {
        registrarInstantaneaHistorial();
        instantaneaGuardada = true;
      }

      if (modo === 'mover') {
        const nuevoInicio = Math.max(1, ajustarMediaSemana(inicioOriginal + deltaSemanas));
        if (nuevoInicio !== tarea.semanaInicio) {
          actualizarTarea(tarea.id, { semanaInicio: nuevoInicio }, false);
        }
      } else if (modo === 'estirar-derecha') {
        const nuevaDuracion = Math.max(
          0.5,
          ajustarMediaSemana(duracionOriginal + deltaSemanas)
        );
        if (nuevaDuracion !== tarea.duracionSemanas) {
          actualizarTarea(tarea.id, { duracionSemanas: nuevaDuracion }, false);
        }
      } else if (modo === 'estirar-izquierda') {
        const finOriginal = inicioOriginal + duracionOriginal;
        const maximoInicioPermitido = finOriginal - 0.5;
        const nuevoInicio = Math.min(
          maximoInicioPermitido,
          Math.max(1, ajustarMediaSemana(inicioOriginal + deltaSemanas))
        );
        const nuevaDuracion = Math.max(0.5, ajustarMediaSemana(finOriginal - nuevoInicio));
        actualizarTarea(
          tarea.id,
          {
            semanaInicio: nuevoInicio,
            duracionSemanas: nuevaDuracion,
          },
          false
        );
      }
    };

    const manejarFinPuntero = () => {
      setModoActivo(null);
      window.removeEventListener('pointermove', manejarMovimientoPuntero);
      window.removeEventListener('pointerup', manejarFinPuntero);
      window.removeEventListener('pointercancel', manejarFinPuntero);
    };

    window.addEventListener('pointermove', manejarMovimientoPuntero);
    window.addEventListener('pointerup', manejarFinPuntero);
    window.addEventListener('pointercancel', manejarFinPuntero);
  };

  const manejarClicBarra = (evento: React.MouseEvent) => {
    evento.stopPropagation();
    if (!huboMovimientoRef.current) {
      seleccionarTarea(tarea.id);
    }
  };

  const semanaFinVisual = ajustarMediaSemana(
    tarea.semanaInicio + tarea.duracionSemanas - 0.5
  );

  const globoTooltip = (
    <div className="globo-informacion-barra">
      <div className="titulo-globo">
        [{tarea.codigo}] {tarea.nombre}
      </div>
      <div className="meta-globo">
        Sem {tarea.semanaInicio} → Sem {semanaFinVisual} ({tarea.duracionSemanas} sem) ·{' '}
        {tarea.porcentajeAvance}% ·{' '}
        {metricas?.esCritica ? 'Ruta Crítica' : `Holgura: ${metricas?.holgura ?? 0}s`}
      </div>
    </div>
  );

  // Renderizado especializado para Hitos Clave (forma de diamante #CAC426)
  if (tarea.esHito) {
    return (
      <div
        className={combinarClases(
          'nodo-hito-gantt',
          modoActivo !== null && 'esta-manipulando'
        )}
        style={{
          left: `${desplazamientoIzquierdoPx + 6}px`,
        }}
        onPointerDown={(e) => iniciarManipulacion(e, 'mover')}
        onClick={manejarClicBarra}
      >
        {globoTooltip}
        <div
          className="rombo-hito"
          style={{
            boxShadow: esSeleccionada
              ? '0 0 0 3px var(--color-acento-medio)'
              : undefined,
          }}
        />
        <span className="etiqueta-hito-lateral">
          {tarea.codigo} · {tarea.nombre}
        </span>
      </div>
    );
  }

  // Renderizado de Barra de Tarea interactiva con tiradores izquierdo y derecho
  return (
    <div
      className={combinarClases(
        'barra-tarea-gantt',
        esCriticaResaltada && 'es-barra-critica',
        esSeleccionada && 'es-barra-seleccionada',
        modoActivo !== null && 'esta-manipulando'
      )}
      style={{
        left: `${desplazamientoIzquierdoPx}px`,
        width: `${Math.max(28, anchoBarraPx)}px`,
      }}
      onPointerDown={(e) => iniciarManipulacion(e, 'mover')}
      onClick={manejarClicBarra}
    >
      {globoTooltip}

      {/* Tirador izquierdo para cambiar inicio y duración */}
      <div
        className="tirador-redimension tirador-izquierdo"
        title="Arrastrar borde izquierdo para ajustar inicio y duración"
        onPointerDown={(e) => iniciarManipulacion(e, 'estirar-izquierda')}
      />

      {/* Relleno de porcentaje de avance */}
      <div className="contenedor-recorte-barra">
        <div
          className="relleno-avance-barra"
          style={{ width: `${tarea.porcentajeAvance}%` }}
        />
      </div>

      {/* Etiqueta interna de la barra */}
      <div className="contenido-barra-tarea">
        <span className="etiqueta-interna-barra">
          {tarea.codigo} {tarea.nombre}
        </span>
        {anchoBarraPx >= 76 && (
          <span className="porcentaje-interno-barra">{tarea.porcentajeAvance}%</span>
        )}
      </div>

      {/* Tirador derecho para estirar o acortar duración */}
      <div
        className="tirador-redimension tirador-derecho"
        title="Arrastrar borde derecho para estirar o acortar duración"
        onPointerDown={(e) => iniciarManipulacion(e, 'estirar-derecha')}
      />
    </div>
  );
};
