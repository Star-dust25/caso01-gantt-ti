import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { usarAlmacenGantt } from '../estado/usarAlmacenGantt';
import type { MetricasTareaCPM, TareaProyecto } from '../tipos/proyecto';
import { combinarClases } from '../utilidades/clases';

interface PropiedadesTablaTareas {
  tareas: TareaProyecto[];
  metricasPorTarea: Record<string, MetricasTareaCPM>;
  referenciaScrollTabla: React.RefObject<HTMLDivElement | null>;
  alDesplazarVerticalmente: (evento: React.UIEvent<HTMLDivElement>) => void;
}

interface PropiedadesFilaTareaOrdenable {
  tarea: TareaProyecto;
  metricas?: MetricasTareaCPM;
  seleccionada: boolean;
  enHover: boolean;
  resaltarCritica: boolean;
  alSeleccionar: (id: string) => void;
  alHover: (id: string | null) => void;
}

const FilaTareaOrdenable: React.FC<PropiedadesFilaTareaOrdenable> = ({
  tarea,
  metricas,
  seleccionada,
  enHover,
  resaltarCritica,
  alSeleccionar,
  alHover,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarea.id });

  const estiloFila: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const esCriticaActiva = Boolean(resaltarCritica && metricas?.esCritica);

  return (
    <div
      ref={setNodeRef}
      style={estiloFila}
      className={combinarClases(
        'fila-tabla-tarea',
        seleccionada && 'es-seleccionada',
        enHover && 'es-hover',
        esCriticaActiva && 'es-critica-resaltada',
        isDragging && 'esta-arrastrando-fila'
      )}
      onClick={() => alSeleccionar(tarea.id)}
      onMouseEnter={() => alHover(tarea.id)}
      onMouseLeave={() => alHover(null)}
    >
      <div>
        <button
          type="button"
          className="boton-agarre-fila"
          title="Arrastrar verticalmente para reordenar prioridad"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
      </div>

      <div className="codigo-tarea-celda" title={`ID: ${tarea.id}`}>
        {tarea.codigo}
      </div>

      <div className="celda-nombre-tarea">
        <div className="linea-titulo-tarea">
          {tarea.esHito && (
            <span
              className="diamante-hito-inline"
              title="Hito clave de control"
            />
          )}
          <span className="texto-nombre-tarea" title={tarea.nombre}>
            {tarea.nombre}
          </span>
          {metricas?.tieneConflictoDependencia && (
            <span
              title="Inicia antes de que finalice una tarea predecesora"
              style={{ color: 'var(--color-acento)', display: 'inline-flex' }}
            >
              <AlertTriangle size={12} />
            </span>
          )}
        </div>
        <span className="subtexto-fase-tarea">{tarea.fase}</span>
      </div>

      <div>
        <span className="tag etiqueta-rol">{tarea.responsable}</span>
      </div>

      <div className="celda-numero-semana" title="Semana de inicio">
        S{tarea.semanaInicio}
      </div>

      <div className="celda-numero-semana" title="Duración en semanas">
        {tarea.duracionSemanas}s
      </div>

      <div className="celda-avance-tarea">
        <span
          style={{
            color:
              tarea.porcentajeAvance === 100
                ? 'var(--color-acento)'
                : 'var(--color-texto-principal)',
          }}
        >
          {tarea.porcentajeAvance}%
        </span>
      </div>
    </div>
  );
};

export const TablaTareas: React.FC<PropiedadesTablaTareas> = ({
  tareas,
  metricasPorTarea,
  referenciaScrollTabla,
  alDesplazarVerticalmente,
}) => {
  const idTareaSeleccionada = usarAlmacenGantt((e) => e.idTareaSeleccionada);
  const idTareaHover = usarAlmacenGantt((e) => e.idTareaHover);
  const resaltarRutaCritica = usarAlmacenGantt((e) => e.resaltarRutaCritica);
  const seleccionarTarea = usarAlmacenGantt((e) => e.seleccionarTarea);
  const establecerTareaHover = usarAlmacenGantt((e) => e.establecerTareaHover);
  const reordenarTareas = usarAlmacenGantt((e) => e.reordenarTareas);

  const sensores = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const manejarFinReordenamiento = (evento: DragEndEvent) => {
    const { active, over } = evento;
    if (over && active.id !== over.id) {
      reordenarTareas(String(active.id), String(over.id));
      toast.success('Orden de prioridad de tareas actualizado');
    }
  };

  return (
    <div className="contenedor-tabla-tareas">
      <div
        ref={referenciaScrollTabla}
        className="cuerpo-tabla-tareas"
        onScroll={alDesplazarVerticalmente}
      >
        <div className="interior-tabla-tareas">
          <div className="encabezado-tabla-tareas">
            <div title="Reordenar" />
            <div>Cód.</div>
            <div>Actividad / Fase</div>
            <div>Responsable</div>
            <div style={{ textAlign: 'center' }}>Inicio</div>
            <div style={{ textAlign: 'center' }}>Dur.</div>
            <div style={{ textAlign: 'right' }}>Avance</div>
          </div>

          <DndContext
            sensors={sensores}
            collisionDetection={closestCenter}
            onDragEnd={manejarFinReordenamiento}
          >
            <SortableContext
              items={tareas.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tareas.map((tarea) => (
                <FilaTareaOrdenable
                  key={tarea.id}
                  tarea={tarea}
                  metricas={metricasPorTarea[tarea.id]}
                  seleccionada={idTareaSeleccionada === tarea.id}
                  enHover={idTareaHover === tarea.id}
                  resaltarCritica={resaltarRutaCritica}
                  alSeleccionar={(id) =>
                    seleccionarTarea(idTareaSeleccionada === id ? null : id)
                  }
                  alHover={establecerTareaHover}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};
