import React from 'react';
import type { MetricasTareaCPM, TareaProyecto } from '../tipos/proyecto';
import { combinarClases } from '../utilidades/clases';

interface PropiedadesConectoresDependencia {
  tareasVisibles: TareaProyecto[];
  metricasPorTarea: Record<string, MetricasTareaCPM>;
  anchoColumnaSemana: number;
  alturaFila: number;
  resaltarRutaCritica: boolean;
  idTareaEnfocada: string | null;
}

export const ConectoresDependencia: React.FC<
  PropiedadesConectoresDependencia
> = ({
  tareasVisibles,
  metricasPorTarea,
  anchoColumnaSemana,
  alturaFila,
  resaltarRutaCritica,
  idTareaEnfocada,
}) => {
  const indicePorId = new Map<string, { tarea: TareaProyecto; indiceFila: number }>();
  tareasVisibles.forEach((tarea, indiceFila) => {
    indicePorId.set(tarea.id, { tarea, indiceFila });
  });

  const listaConectores: Array<{
    idUnico: string;
    rutaSvg: string;
    esCritico: boolean;
    esConflicto: boolean;
    estaAtenuado: boolean;
  }> = [];

  for (const [idSucesora, infoSucesora] of indicePorId.entries()) {
    const { tarea: tareaSucesora, indiceFila: filaDestino } = infoSucesora;
    const metricasSucesora = metricasPorTarea[idSucesora];

    for (const idPredecesora of tareaSucesora.predecesoras) {
      const infoPredecesora = indicePorId.get(idPredecesora);
      if (!infoPredecesora) continue;

      const { tarea: tareaPredecesora, indiceFila: filaOrigen } = infoPredecesora;
      const metricasPredecesora = metricasPorTarea[idPredecesora];

      // Coordenadas X e Y de salida (fin de la predecesora)
      const xOrigen = tareaPredecesora.esHito
        ? (tareaPredecesora.semanaInicio - 1) * anchoColumnaSemana + 28
        : (tareaPredecesora.semanaInicio - 1 + tareaPredecesora.duracionSemanas) *
          anchoColumnaSemana;
      const yOrigen = filaOrigen * alturaFila + alturaFila / 2;

      // Coordenadas X e Y de llegada (inicio de la sucesora)
      const xDestino = tareaSucesora.esHito
        ? (tareaSucesora.semanaInicio - 1) * anchoColumnaSemana + 6
        : (tareaSucesora.semanaInicio - 1) * anchoColumnaSemana;
      const yDestino = filaDestino * alturaFila + alturaFila / 2;

      // Curva Bezier cúbica suave (estilo Linear / Figma)
      const distanciaHorizontal = xDestino - xOrigen;
      const desplazamientoControl = Math.max(22, Math.abs(distanciaHorizontal) * 0.45);

      let rutaSvg: string;
      if (distanciaHorizontal >= 6) {
        rutaSvg = `M ${xOrigen} ${yOrigen} C ${xOrigen + desplazamientoControl} ${yOrigen}, ${
          xDestino - desplazamientoControl
        } ${yDestino}, ${xDestino} ${yDestino}`;
      } else {
        // Curva en S envolvente cuando la sucesora empieza igual o antes que el fin de la predecesora
        const puntoMedioY = (yOrigen + yDestino) / 2;
        const salidaX = xOrigen + 16;
        const entradaX = xDestino - 16;
        rutaSvg = `M ${xOrigen} ${yOrigen} L ${salidaX} ${yOrigen} C ${salidaX + 14} ${yOrigen}, ${
          salidaX + 14
        } ${puntoMedioY}, ${(salidaX + entradaX) / 2} ${puntoMedioY} C ${
          entradaX - 14
        } ${puntoMedioY}, ${entradaX - 14} ${yDestino}, ${entradaX} ${yDestino} L ${xDestino} ${yDestino}`;
      }

      const esCritico = Boolean(
        resaltarRutaCritica &&
          metricasPredecesora?.esCritica &&
          metricasSucesora?.esCritica
      );

      const finPredecesora =
        tareaPredecesora.semanaInicio - 1 + tareaPredecesora.duracionSemanas;
      const inicioSucesora = tareaSucesora.semanaInicio - 1;
      const esConflicto = inicioSucesora < finPredecesora - 0.01;

      const estaAtenuado = Boolean(
        idTareaEnfocada &&
          idTareaEnfocada !== idPredecesora &&
          idTareaEnfocada !== idSucesora
      );

      listaConectores.push({
        idUnico: `${idPredecesora}->${idSucesora}`,
        rutaSvg,
        esCritico,
        esConflicto,
        estaAtenuado,
      });
    }
  }

  return (
    <svg className="capa-conectores-svg" aria-hidden="true">
      <defs>
        <marker
          id="flecha-conector-normal"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--color-borde-fuerte)" />
        </marker>
        <marker
          id="flecha-conector-critico"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--color-acento)" />
        </marker>
      </defs>

      {listaConectores.map((conector) => (
        <path
          key={conector.idUnico}
          d={conector.rutaSvg}
          className={combinarClases(
            'trazo-conector-dependencia',
            conector.esCritico && 'es-conector-critico',
            conector.esConflicto && 'es-conector-conflicto',
            conector.estaAtenuado && 'es-conector-atenuado'
          )}
          markerEnd={
            conector.esCritico || conector.esConflicto
              ? 'url(#flecha-conector-critico)'
              : 'url(#flecha-conector-normal)'
          }
        />
      ))}
    </svg>
  );
};
