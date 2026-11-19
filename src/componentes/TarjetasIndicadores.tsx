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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CalendarClock,
  TrendingUp,
  CheckCircle2,
  Flame,
  GripHorizontal,
} from 'lucide-react';
import { usarAlmacenGantt } from '../estado/usarAlmacenGantt';
import type {
  IdentificadorIndicador,
  ResultadoRutaCritica,
  TareaProyecto,
} from '../tipos/proyecto';
import { combinarClases } from '../utilidades/clases';

interface PropiedadesTarjetasIndicadores {
  resultadoCPM: ResultadoRutaCritica;
  tareas: TareaProyecto[];
}

interface DatosTarjetaIndividual {
  id: IdentificadorIndicador;
  titulo: string;
  valorPrincipal: string;
  detalleSecundario: string;
  icono: React.ReactNode;
  destacada?: boolean;
  porcentajeBarra?: number;
}

interface PropiedadesTarjetaOrdenable {
  datos: DatosTarjetaIndividual;
}

const TarjetaIndicadorOrdenable: React.FC<PropiedadesTarjetaOrdenable> = ({
  datos,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: datos.id });

  const estiloTransformacion: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={estiloTransformacion}
      className={combinarClases(
        'box tarjeta-kpi',
        isDragging && 'esta-arrastrando',
        datos.destacada && 'es-destacada'
      )}
      {...attributes}
      {...listeners}
      title="Arrastra esta tarjeta para reordenar los indicadores KPI"
    >
      <div className="encabezado-kpi">
        <span className="etiqueta-kpi">
          {datos.icono}
          <span>{datos.titulo}</span>
        </span>
        <span className="icono-agarre-kpi">
          <GripHorizontal size={15} />
        </span>
      </div>

      <div className="cuerpo-kpi">
        <span className="valor-principal-kpi">{datos.valorPrincipal}</span>
        <span className="detalle-kpi">{datos.detalleSecundario}</span>
      </div>

      {datos.porcentajeBarra !== undefined && (
        <div className="barra-progreso-mini">
          <div
            className="relleno-progreso-mini"
            style={{ width: `${Math.min(100, Math.max(0, datos.porcentajeBarra))}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const TarjetasIndicadores: React.FC<PropiedadesTarjetasIndicadores> = ({
  resultadoCPM,
  tareas,
}) => {
  const ordenIndicadores = usarAlmacenGantt((e) => e.ordenIndicadores);
  const reordenarIndicadores = usarAlmacenGantt((e) => e.reordenarIndicadores);

  const sensores = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tareasCompletadas = tareas.filter((t) => t.porcentajeAvance >= 100).length;
  const tareasEnCurso = tareas.filter(
    (t) => t.porcentajeAvance > 0 && t.porcentajeAvance < 100
  ).length;

  const diferenciaBase = resultadoCPM.duracionTotalSemanas - 12;
  const textoComparacionBase =
    Math.abs(diferenciaBase) < 0.01
      ? 'En línea base (12 sem)'
      : diferenciaBase > 0
        ? `+${diferenciaBase} sem sobre línea base`
        : `${diferenciaBase} sem bajo línea base`;

  const diccionarioTarjetas: Record<IdentificadorIndicador, DatosTarjetaIndividual> = {
    'duracion-total': {
      id: 'duracion-total',
      titulo: 'Duración Total',
      valorPrincipal: `${resultadoCPM.duracionTotalSemanas} semanas`,
      detalleSecundario: textoComparacionBase,
      icono: <CalendarClock size={14} />,
      porcentajeBarra: Math.min(100, (12 / resultadoCPM.duracionTotalSemanas) * 100),
    },
    'progreso-global': {
      id: 'progreso-global',
      titulo: 'Progreso Global',
      valorPrincipal: `${resultadoCPM.progresoGlobalPonderado}%`,
      detalleSecundario: `${tareasCompletadas}/${tareas.length} finalizadas`,
      icono: <TrendingUp size={14} />,
      porcentajeBarra: resultadoCPM.progresoGlobalPonderado,
    },
    'tareas-activas': {
      id: 'tareas-activas',
      titulo: 'Tareas y Ejecución',
      valorPrincipal: `${tareas.length} tareas`,
      detalleSecundario: `${tareasEnCurso} en curso · 5 fases TI`,
      icono: <CheckCircle2 size={14} />,
      porcentajeBarra:
        tareas.length > 0 ? Math.round((tareasCompletadas / tareas.length) * 100) : 0,
    },
    'ruta-critica': {
      id: 'ruta-critica',
      titulo: 'Hitos y Ruta Crítica',
      valorPrincipal: `${resultadoCPM.idsTareasCriticas.length} críticas`,
      detalleSecundario: `${resultadoCPM.hitosCompletados}/${resultadoCPM.totalHitos} hitos completados`,
      icono: <Flame size={14} />,
      destacada: true,
      porcentajeBarra:
        resultadoCPM.totalHitos > 0
          ? Math.round((resultadoCPM.hitosCompletados / resultadoCPM.totalHitos) * 100)
          : 0,
    },
  };

  const manejarFinArrastre = (evento: DragEndEvent) => {
    const { active, over } = evento;
    if (over && active.id !== over.id) {
      reordenarIndicadores(
        active.id as IdentificadorIndicador,
        over.id as IdentificadorIndicador
      );
    }
  };

  return (
    <section className="seccion-indicadores">
      <DndContext
        sensors={sensores}
        collisionDetection={closestCenter}
        onDragEnd={manejarFinArrastre}
      >
        <SortableContext
          items={ordenIndicadores}
          strategy={rectSortingStrategy}
        >
          <div className="grilla-tarjetas-kpi">
            {ordenIndicadores.map((idIndicador) => (
              <TarjetaIndicadorOrdenable
                key={idIndicador}
                datos={diccionarioTarjetas[idIndicador]}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
};
