import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripHorizontal,
  Trash2,
  Diamond,
  Flame,
  Link2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { FASES_PROYECTO, ROLES_PROYECTO } from '../datos/proyectoInicial';
import { usarAlmacenGantt } from '../estado/usarAlmacenGantt';
import type {
  FaseProyecto,
  MetricasTareaCPM,
  RolResponsable,
} from '../tipos/proyecto';
import { combinarClases } from '../utilidades/clases';
import { creaCicloDependencia } from '../utilidades/rutaCritica';

interface PropiedadesPanelInspectorFlotante {
  metricasPorTarea: Record<string, MetricasTareaCPM>;
  referenciaRestriccionPantalla: React.RefObject<HTMLDivElement | null>;
}

export const PanelInspectorFlotante: React.FC<
  PropiedadesPanelInspectorFlotante
> = ({ metricasPorTarea, referenciaRestriccionPantalla }) => {
  const tareas = usarAlmacenGantt((e) => e.tareas);
  const idTareaSeleccionada = usarAlmacenGantt((e) => e.idTareaSeleccionada);
  const seleccionarTarea = usarAlmacenGantt((e) => e.seleccionarTarea);
  const actualizarTarea = usarAlmacenGantt((e) => e.actualizarTarea);
  const eliminarTarea = usarAlmacenGantt((e) => e.eliminarTarea);

  const tareaActiva = tareas.find((t) => t.id === idTareaSeleccionada) ?? null;
  const metricas = tareaActiva ? metricasPorTarea[tareaActiva.id] : undefined;

  const alternarPredecesora = (idPredecesora: string) => {
    if (!tareaActiva) return;
    const yaExiste = tareaActiva.predecesoras.includes(idPredecesora);

    if (yaExiste) {
      actualizarTarea(tareaActiva.id, {
        predecesoras: tareaActiva.predecesoras.filter((id) => id !== idPredecesora),
      });
      toast('Dependencia eliminada');
      return;
    }

    if (creaCicloDependencia(tareas, tareaActiva.id, idPredecesora)) {
      toast.error(
        'No se puede añadir esta dependencia porque generaría una referencia circular.'
      );
      return;
    }

    actualizarTarea(tareaActiva.id, {
      predecesoras: [...tareaActiva.predecesoras, idPredecesora],
    });
    toast.success('Dependencia agregada y Ruta Crítica recalculada');
  };

  return (
    <AnimatePresence>
      {tareaActiva && (
        <motion.aside
          key="inspector-flotante"
          className="panel-inspector-flotante"
          drag
          dragConstraints={referenciaRestriccionPantalla}
          dragMomentum={false}
          dragElastic={0.05}
          initial={{ opacity: 0, x: 30, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 30, scale: 0.96 }}
          transition={{ duration: 0.18 }}
        >
          {/* Barra superior de arrastre */}
          <div
            className="encabezado-inspector-arrastrable"
            title="Arrastra este encabezado para mover el inspector libremente por la pantalla"
          >
            <div className="titulo-encabezado-inspector">
              <GripHorizontal size={15} style={{ color: 'var(--color-acento)' }} />
              <span>
                Inspector · [{tareaActiva.codigo}] {tareaActiva.id}
              </span>
              {metricas?.esCritica && (
                <span className="tag etiqueta-critica">
                  <Flame size={10} style={{ marginRight: '3px' }} />
                  Crítica
                </span>
              )}
            </div>

            <button
              type="button"
              className="delete is-small"
              aria-label="Cerrar inspector"
              onClick={() => seleccionarTarea(null)}
            />
          </div>

          {/* Cuerpo editable en vivo */}
          <div
            className="cuerpo-inspector"
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            {/* Resumen de métricas CPM */}
            {metricas && (
              <div className="resumen-metricas-tarea">
                <div className="dato-mini-inspector">
                  <span className="etiqueta-mini">Fin Temprano</span>
                  <span className="valor-mini">Sem {metricas.finTemprano}</span>
                </div>
                <div className="dato-mini-inspector">
                  <span className="etiqueta-mini">Fin Tardío</span>
                  <span className="valor-mini">Sem {metricas.finTardio}</span>
                </div>
                <div className="dato-mini-inspector">
                  <span className="etiqueta-mini">Holgura CPM</span>
                  <span
                    className="valor-mini"
                    style={{
                      color: metricas.esCritica
                        ? 'var(--color-acento)'
                        : 'var(--color-texto-principal)',
                    }}
                  >
                    {metricas.holgura} sem
                  </span>
                </div>
              </div>
            )}

            {/* Título de la actividad */}
            <div className="field mb-0">
              <label className="etiqueta-campo-inspector">
                <span>Nombre de la tarea</span>
                <button
                  type="button"
                  className={combinarClases(
                    'button is-small boton-sutil',
                    tareaActiva.esHito && 'es-activo'
                  )}
                  style={{ height: '22px', padding: '0 0.45rem', fontSize: '0.65rem' }}
                  onClick={() =>
                    actualizarTarea(tareaActiva.id, {
                      esHito: !tareaActiva.esHito,
                      duracionSemanas: !tareaActiva.esHito
                        ? 0.5
                        : Math.max(1, tareaActiva.duracionSemanas),
                    })
                  }
                >
                  <Diamond size={10} style={{ marginRight: '4px' }} />
                  <span>{tareaActiva.esHito ? 'Hito Clave' : 'Marcar Hito'}</span>
                </button>
              </label>
              <div className="control">
                <input
                  type="text"
                  className="input is-small"
                  value={tareaActiva.nombre}
                  onChange={(e) =>
                    actualizarTarea(tareaActiva.id, { nombre: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Fase y Responsable */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="etiqueta-campo-inspector">Fase TI</label>
                <div className="select is-small is-fullwidth">
                  <select
                    value={tareaActiva.fase}
                    onChange={(e) =>
                      actualizarTarea(tareaActiva.id, {
                        fase: e.target.value as FaseProyecto,
                      })
                    }
                  >
                    {FASES_PROYECTO.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="etiqueta-campo-inspector">Responsable</label>
                <div className="select is-small is-fullwidth">
                  <select
                    value={tareaActiva.responsable}
                    onChange={(e) =>
                      actualizarTarea(tareaActiva.id, {
                        responsable: e.target.value as RolResponsable,
                      })
                    }
                  >
                    {ROLES_PROYECTO.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Semana de inicio y Duración */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="etiqueta-campo-inspector">
                  <span>Inicio (Sem)</span>
                </label>
                <div className="field has-addons mb-0">
                  <p className="control">
                    <button
                      type="button"
                      className="button is-small boton-sutil"
                      onClick={() =>
                        actualizarTarea(tareaActiva.id, {
                          semanaInicio: Math.max(1, tareaActiva.semanaInicio - 0.5),
                        })
                      }
                    >
                      -0.5
                    </button>
                  </p>
                  <p className="control is-expanded">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      className="input is-small has-text-centered"
                      value={tareaActiva.semanaInicio}
                      onChange={(e) =>
                        actualizarTarea(tareaActiva.id, {
                          semanaInicio: Number(e.target.value) || 1,
                        })
                      }
                    />
                  </p>
                  <p className="control">
                    <button
                      type="button"
                      className="button is-small boton-sutil"
                      onClick={() =>
                        actualizarTarea(tareaActiva.id, {
                          semanaInicio: tareaActiva.semanaInicio + 0.5,
                        })
                      }
                    >
                      +0.5
                    </button>
                  </p>
                </div>
              </div>

              <div>
                <label className="etiqueta-campo-inspector">
                  <span>Duración (Sem)</span>
                </label>
                <div className="field has-addons mb-0">
                  <p className="control">
                    <button
                      type="button"
                      className="button is-small boton-sutil"
                      onClick={() =>
                        actualizarTarea(tareaActiva.id, {
                          duracionSemanas: Math.max(
                            0.5,
                            tareaActiva.duracionSemanas - 0.5
                          ),
                        })
                      }
                    >
                      -0.5
                    </button>
                  </p>
                  <p className="control is-expanded">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      className="input is-small has-text-centered"
                      value={tareaActiva.duracionSemanas}
                      onChange={(e) =>
                        actualizarTarea(tareaActiva.id, {
                          duracionSemanas: Number(e.target.value) || 0.5,
                        })
                      }
                    />
                  </p>
                  <p className="control">
                    <button
                      type="button"
                      className="button is-small boton-sutil"
                      onClick={() =>
                        actualizarTarea(tareaActiva.id, {
                          duracionSemanas: tareaActiva.duracionSemanas + 0.5,
                        })
                      }
                    >
                      +0.5
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Porcentaje de avance con Slider */}
            <div>
              <label className="etiqueta-campo-inspector">
                <span>Porcentaje de Avance</span>
                <strong style={{ color: 'var(--color-acento)' }}>
                  {tareaActiva.porcentajeAvance}%
                </strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                className="deslizador-avance"
                value={tareaActiva.porcentajeAvance}
                onChange={(e) =>
                  actualizarTarea(tareaActiva.id, {
                    porcentajeAvance: Number(e.target.value),
                  })
                }
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '0.35rem',
                  marginTop: '0.25rem',
                }}
              >
                {[0, 25, 50, 75, 100].map((valor) => (
                  <button
                    key={valor}
                    type="button"
                    className={combinarClases(
                      'button is-small boton-sutil',
                      tareaActiva.porcentajeAvance === valor && 'es-activo'
                    )}
                    style={{ flex: 1, height: '24px', padding: 0, fontSize: '0.67rem' }}
                    onClick={() =>
                      actualizarTarea(tareaActiva.id, { porcentajeAvance: valor })
                    }
                  >
                    {valor}%
                  </button>
                ))}
              </div>
            </div>

            {/* Entregable principal */}
            <div>
              <label className="etiqueta-campo-inspector">Entregable Principal</label>
              <input
                type="text"
                className="input is-small"
                value={tareaActiva.entregablePrincipal}
                onChange={(e) =>
                  actualizarTarea(tareaActiva.id, {
                    entregablePrincipal: e.target.value,
                  })
                }
              />
            </div>

            {/* Predecesoras interactivas */}
            <div>
              <label className="etiqueta-campo-inspector">
                <span>
                  <Link2 size={11} style={{ marginRight: '4px' }} />
                  Tareas Predecesoras ({tareaActiva.predecesoras.length})
                </span>
              </label>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.3rem',
                  maxHeight: '84px',
                  overflowY: 'auto',
                  padding: '0.4rem',
                  backgroundColor: 'var(--color-superficie-1)',
                  border: '1px solid var(--color-borde-sutil)',
                  borderRadius: '6px',
                }}
              >
                {tareas
                  .filter((t) => t.id !== tareaActiva.id)
                  .map((candidata) => {
                    const activa = tareaActiva.predecesoras.includes(candidata.id);
                    return (
                      <button
                        key={candidata.id}
                        type="button"
                        className={combinarClases(
                          'button is-small boton-sutil',
                          activa && 'es-activo'
                        )}
                        style={{
                          height: '22px',
                          padding: '0 0.45rem',
                          fontSize: '0.66rem',
                        }}
                        title={candidata.nombre}
                        onClick={() => alternarPredecesora(candidata.id)}
                      >
                        {candidata.codigo} ({candidata.id})
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Notas técnicas */}
            <div>
              <label className="etiqueta-campo-inspector">Notas Técnicas / Riesgos</label>
              <textarea
                rows={2}
                className="textarea is-small"
                value={tareaActiva.notas}
                onChange={(e) =>
                  actualizarTarea(tareaActiva.id, { notas: e.target.value })
                }
              />
            </div>
          </div>

          {/* Pie del inspector */}
          <div
            className="pie-inspector"
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="button is-small boton-sutil"
              onClick={() => {
                eliminarTarea(tareaActiva.id);
                toast.success(`Tarea ${tareaActiva.codigo} eliminada del proyecto`);
              }}
            >
              <span className="icon is-small">
                <Trash2 size={13} />
              </span>
              <span>Eliminar</span>
            </button>

            <button
              type="button"
              className="button is-small boton-primario-acento"
              onClick={() => {
                seleccionarTarea(null);
                toast.success('Cambios aplicados en tiempo real');
              }}
            >
              <span className="icon is-small">
                <CheckCircle2 size={13} />
              </span>
              <span>Listo</span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
