import React from 'react';
import { motion } from 'framer-motion';
import {
  GripVertical,
  ZoomIn,
  ZoomOut,
  Flame,
  Undo2,
  Redo2,
  RotateCcw,
  Sun,
  Moon,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';
import { usarAlmacenGantt } from '../estado/usarAlmacenGantt';
import { combinarClases } from '../utilidades/clases';

interface PropiedadesBarraHerramientasFlotante {
  referenciaRestriccionPantalla: React.RefObject<HTMLDivElement | null>;
  alRestablecerLayoutPaneles: () => void;
}

export const BarraHerramientasFlotante: React.FC<
  PropiedadesBarraHerramientasFlotante
> = ({ referenciaRestriccionPantalla, alRestablecerLayoutPaneles }) => {
  const anchoColumnaSemana = usarAlmacenGantt((e) => e.anchoColumnaSemana);
  const cambiarZoomSemana = usarAlmacenGantt((e) => e.cambiarZoomSemana);
  const resaltarRutaCritica = usarAlmacenGantt((e) => e.resaltarRutaCritica);
  const alternarResaltadoRutaCritica = usarAlmacenGantt(
    (e) => e.alternarResaltadoRutaCritica
  );
  const historialPasado = usarAlmacenGantt((e) => e.historialPasado);
  const historialFuturo = usarAlmacenGantt((e) => e.historialFuturo);
  const deshacer = usarAlmacenGantt((e) => e.deshacer);
  const rehacer = usarAlmacenGantt((e) => e.rehacer);
  const tema = usarAlmacenGantt((e) => e.tema);
  const alternarTema = usarAlmacenGantt((e) => e.alternarTema);
  const restablecerTodoElCaso = usarAlmacenGantt((e) => e.restablecerTodoElCaso);

  const porcentajeZoom = Math.round((anchoColumnaSemana / 96) * 100);

  return (
    <motion.nav
      className="dock-herramientas-flotante"
      aria-label="Barra de herramientas flotante arrastrable"
      drag
      dragConstraints={referenciaRestriccionPantalla}
      dragMomentum={false}
      dragElastic={0.08}
      initial={{ x: '-50%', y: 20, opacity: 0 }}
      animate={{ x: '-50%', y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className="zona-agarre-dock"
        title="Arrastra este dock libremente por cualquier parte de la pantalla"
      >
        <GripVertical size={14} />
        <span>Dock</span>
      </div>

      {/* Controles de Zoom del Cronograma */}
      <button
        type="button"
        className="boton-dock es-icono-solo"
        title="Alejar cronograma"
        disabled={anchoColumnaSemana <= 56}
        onClick={() => cambiarZoomSemana(anchoColumnaSemana - 12)}
      >
        <ZoomOut size={15} />
      </button>

      <span
        className="indicador-zoom-dock"
        title="Nivel de zoom horizontal (clic para 100%)"
        style={{ cursor: 'pointer' }}
        onClick={() => cambiarZoomSemana(96)}
      >
        {porcentajeZoom}%
      </span>

      <button
        type="button"
        className="boton-dock es-icono-solo"
        title="Acercar cronograma"
        disabled={anchoColumnaSemana >= 160}
        onClick={() => cambiarZoomSemana(anchoColumnaSemana + 12)}
      >
        <ZoomIn size={15} />
      </button>

      <div className="divisor-dock" />

      {/* Resaltar Ruta Crítica */}
      <button
        type="button"
        className={combinarClases(
          'boton-dock',
          resaltarRutaCritica && 'es-activo'
        )}
        title="Activar o desactivar resaltado de Ruta Crítica (#CAC426)"
        onClick={() => {
          alternarResaltadoRutaCritica();
          toast(
            !resaltarRutaCritica
              ? 'Ruta Crítica activada'
              : 'Ruta Crítica oculta'
          );
        }}
      >
        <Flame size={14} />
        <span>CPM</span>
      </button>

      <div className="divisor-dock" />

      {/* Deshacer / Rehacer */}
      <button
        type="button"
        className="boton-dock es-icono-solo"
        title="Deshacer último cambio (Ctrl+Z)"
        disabled={historialPasado.length === 0}
        onClick={() => {
          if (deshacer()) {
            toast('Cambio deshecho');
          }
        }}
      >
        <Undo2 size={15} />
      </button>

      <button
        type="button"
        className="boton-dock es-icono-solo"
        title="Rehacer cambio (Ctrl+Y)"
        disabled={historialFuturo.length === 0}
        onClick={() => {
          if (rehacer()) {
            toast('Cambio rehecho');
          }
        }}
      >
        <Redo2 size={15} />
      </button>

      <div className="divisor-dock" />

      {/* Restablecer Layout y Caso 01 */}
      <button
        type="button"
        className="boton-dock"
        title="Restablecer cronograma, KPIs y paneles al estado original del Caso 01"
        onClick={() => {
          restablecerTodoElCaso();
          alRestablecerLayoutPaneles();
          toast.success(
            'Caso 01 restablecido a su planificación base de 12 semanas'
          );
        }}
      >
        <RotateCcw size={14} />
        <span>Restablecer</span>
      </button>

      {/* Cambiar Tema Oscuro / Claro */}
      <button
        type="button"
        className="boton-dock es-icono-solo"
        title={`Cambiar a modo ${tema === 'oscuro' ? 'claro' : 'oscuro'}`}
        onClick={() => {
          alternarTema();
          toast(
            `Tema cambiado a modo ${tema === 'oscuro' ? 'claro' : 'oscuro'}`
          );
        }}
      >
        {tema === 'oscuro' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Imprimir / Exportar PDF */}
      <button
        type="button"
        className="boton-dock es-icono-solo"
        title="Imprimir o exportar Diagrama de Gantt a PDF"
        onClick={() => window.print()}
      >
        <Printer size={15} />
      </button>
    </motion.nav>
  );
};
