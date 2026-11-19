import React from 'react';
import {
  Plus,
  Search,
  Flame,
  Diamond,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Printer,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  FASES_PROYECTO,
  INFORMACION_CASO_01,
  ROLES_PROYECTO,
} from '../datos/proyectoInicial';
import { usarAlmacenGantt } from '../estado/usarAlmacenGantt';
import type { FaseProyecto, RolResponsable } from '../tipos/proyecto';
import { combinarClases } from '../utilidades/clases';

interface PropiedadesEncabezadoCaso {
  alAlternarPanelTabla: () => void;
  totalTareasVisibles: number;
  totalTareasProyecto: number;
}

export const EncabezadoCaso: React.FC<PropiedadesEncabezadoCaso> = ({
  alAlternarPanelTabla,
  totalTareasVisibles,
  totalTareasProyecto,
}) => {
  const filtros = usarAlmacenGantt((e) => e.filtros);
  const actualizarFiltros = usarAlmacenGantt((e) => e.actualizarFiltros);
  const limpiarFiltros = usarAlmacenGantt((e) => e.limpiarFiltros);
  const resaltarRutaCritica = usarAlmacenGantt((e) => e.resaltarRutaCritica);
  const alternarResaltadoRutaCritica = usarAlmacenGantt(
    (e) => e.alternarResaltadoRutaCritica
  );
  const tema = usarAlmacenGantt((e) => e.tema);
  const alternarTema = usarAlmacenGantt((e) => e.alternarTema);
  const establecerModalNuevaTarea = usarAlmacenGantt(
    (e) => e.establecerModalNuevaTarea
  );
  const panelTablaColapsado = usarAlmacenGantt((e) => e.panelTablaColapsado);

  const hayFiltrosActivos =
    filtros.busqueda.trim() !== '' ||
    filtros.fase !== 'Todas' ||
    filtros.responsable !== 'Todos' ||
    filtros.soloRutaCritica ||
    filtros.soloHitos;

  const manejarImpresion = () => {
    toast.info('Preparando vista horizontal para exportación a PDF...');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <header className="encabezado-caso">
      <div className="fila-superior-encabezado">
        <div className="bloque-titulo-caso">
          <div className="insignia-caso">
            <Layers size={12} />
            <span>{INFORMACION_CASO_01.codigoCaso} · DIAGRAMA DE GANTT</span>
          </div>
          <h1 className="titulo-principal-proyecto">
            {INFORMACION_CASO_01.tituloProyecto}
          </h1>
          <p className="subtitulo-proyecto">
            Planificación ejecutiva TI · 5 Fases · {totalTareasProyecto} Actividades ·
            Metodología {INFORMACION_CASO_01.metodologia}
          </p>
        </div>

        <div className="controles-encabezado ocultar-en-impresion">
          <button
            type="button"
            className="button boton-sutil"
            onClick={alAlternarPanelTabla}
            title={
              panelTablaColapsado
                ? 'Mostrar panel de tabla de tareas'
                : 'Colapsar panel de tabla de tareas'
            }
          >
            <span className="icon is-small">
              {panelTablaColapsado ? (
                <PanelLeftOpen size={15} />
              ) : (
                <PanelLeftClose size={15} />
              )}
            </span>
            <span>{panelTablaColapsado ? 'Mostrar Tabla' : 'Ocultar Tabla'}</span>
          </button>

          <button
            type="button"
            className={combinarClases(
              'button boton-sutil',
              resaltarRutaCritica && 'es-activo'
            )}
            onClick={() => {
              alternarResaltadoRutaCritica();
              toast(
                !resaltarRutaCritica
                  ? 'Ruta Crítica resaltada en el cronograma'
                  : 'Resaltado de Ruta Crítica desactivado'
              );
            }}
          >
            <span className="icon is-small">
              <Flame size={15} />
            </span>
            <span>Ruta Crítica</span>
          </button>

          <button
            type="button"
            className="button boton-sutil"
            onClick={() => {
              alternarTema();
              toast(
                `Tema cambiado a modo ${tema === 'oscuro' ? 'claro (#FFFEEC)' : 'oscuro (#222222)'}`
              );
            }}
            title="Alternar tema visual Oscuro / Claro"
          >
            <span className="icon is-small">
              {tema === 'oscuro' ? <Sun size={15} /> : <Moon size={15} />}
            </span>
            <span>{tema === 'oscuro' ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>

          <button
            type="button"
            className="button boton-sutil"
            onClick={manejarImpresion}
            title="Imprimir o exportar Diagrama de Gantt a PDF en formato horizontal"
          >
            <span className="icon is-small">
              <Printer size={15} />
            </span>
            <span>Exportar PDF</span>
          </button>

          <button
            type="button"
            className="button boton-primario-acento"
            onClick={() => establecerModalNuevaTarea(true)}
          >
            <span className="icon is-small">
              <Plus size={16} />
            </span>
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Barra de filtros interactivos y leyenda */}
      <div className="barra-filtros-proyecto ocultar-en-impresion">
        <div className="grupo-filtros-izquierda">
          <div className="control has-icons-left" style={{ minWidth: '220px' }}>
            <input
              type="text"
              className="input is-small"
              placeholder="Buscar tarea, código o entregable..."
              value={filtros.busqueda}
              onChange={(e) => actualizarFiltros({ busqueda: e.target.value })}
            />
            <span
              className="icon is-small is-left"
              style={{ color: 'var(--color-texto-atenuado)' }}
            >
              <Search size={13} />
            </span>
          </div>

          <div className="select is-small">
            <select
              aria-label="Filtrar por fase del proyecto"
              value={filtros.fase}
              onChange={(e) =>
                actualizarFiltros({
                  fase: e.target.value as FaseProyecto | 'Todas',
                })
              }
            >
              <option value="Todas">Todas las fases (5)</option>
              {FASES_PROYECTO.map((fase) => (
                <option key={fase} value={fase}>
                  {fase}
                </option>
              ))}
            </select>
          </div>

          <div className="select is-small">
            <select
              aria-label="Filtrar por rol responsable"
              value={filtros.responsable}
              onChange={(e) =>
                actualizarFiltros({
                  responsable: e.target.value as RolResponsable | 'Todos',
                })
              }
            >
              <option value="Todos">Todos los roles TI</option>
              {ROLES_PROYECTO.map((rol) => (
                <option key={rol} value={rol}>
                  {rol}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className={combinarClases(
              'button is-small boton-sutil',
              filtros.soloRutaCritica && 'es-activo'
            )}
            onClick={() =>
              actualizarFiltros({ soloRutaCritica: !filtros.soloRutaCritica })
            }
          >
            <span className="icon is-small">
              <Flame size={13} />
            </span>
            <span>Solo Críticas</span>
          </button>

          <button
            type="button"
            className={combinarClases(
              'button is-small boton-sutil',
              filtros.soloHitos && 'es-activo'
            )}
            onClick={() => actualizarFiltros({ soloHitos: !filtros.soloHitos })}
          >
            <span className="icon is-small">
              <Diamond size={12} />
            </span>
            <span>Solo Hitos</span>
          </button>

          {hayFiltrosActivos && (
            <button
              type="button"
              className="button is-small boton-sutil"
              onClick={() => {
                limpiarFiltros();
                toast('Filtros restablecidos');
              }}
            >
              <span className="icon is-small">
                <RotateCcw size={12} />
              </span>
              <span>
                Limpiar ({totalTareasVisibles}/{totalTareasProyecto})
              </span>
            </button>
          )}
        </div>

        <div className="grupo-leyenda-derecha">
          <span className="item-leyenda">
            <span className="muestra-leyenda es-critica" />
            <span>Ruta Crítica (Holgura 0)</span>
          </span>
          <span className="item-leyenda">
            <span className="muestra-leyenda es-normal" />
            <span>Tarea con Holgura</span>
          </span>
          <span className="item-leyenda">
            <span className="muestra-leyenda es-hito" />
            <span>Hito de Control</span>
          </span>
        </div>
      </div>
    </header>
  );
};
