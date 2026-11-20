import React, { useState } from 'react';
import { Plus, Diamond } from 'lucide-react';
import { toast } from 'sonner';
import { FASES_PROYECTO, ROLES_PROYECTO } from '../datos/proyectoInicial';
import { usarAlmacenGantt } from '../estado/usarAlmacenGantt';
import type { FaseProyecto, RolResponsable } from '../tipos/proyecto';
import { combinarClases } from '../utilidades/clases';

export const ModalNuevaTarea: React.FC = () => {
  const modalAbierto = usarAlmacenGantt((e) => e.modalNuevaTareaAbierto);
  const establecerModal = usarAlmacenGantt((e) => e.establecerModalNuevaTarea);
  const tareas = usarAlmacenGantt((e) => e.tareas);
  const agregarNuevaTarea = usarAlmacenGantt((e) => e.agregarNuevaTarea);

  const [codigo, setCodigo] = useState('5.5');
  const [nombre, setNombre] = useState('');
  const [fase, setFase] = useState<FaseProyecto>('Desarrollo e Integración');
  const [responsable, setResponsable] = useState<RolResponsable>('Dev Backend');
  const [semanaInicio, setSemanaInicio] = useState<number>(6);
  const [duracionSemanas, setDuracionSemanas] = useState<number>(1.5);
  const [porcentajeAvance, setPorcentajeAvance] = useState<number>(0);
  const [entregablePrincipal, setEntregablePrincipal] = useState('');
  const [predecesoras, setPredecesoras] = useState<string[]>([]);
  const [esHito, setEsHito] = useState<boolean>(false);
  const [notas, setNotas] = useState('');

  if (!modalAbierto) return null;

  const alternarPredecesora = (idTarea: string) => {
    setPredecesoras((prev) =>
      prev.includes(idTarea)
        ? prev.filter((id) => id !== idTarea)
        : [...prev, idTarea]
    );
  };

  const manejarEnvioFormulario = (evento: React.FormEvent) => {
    evento.preventDefault();
    if (!nombre.trim()) {
      toast.error('Ingresa el nombre de la tarea o hito');
      return;
    }

    const creada = agregarNuevaTarea({
      codigo: codigo.trim() || `${tareas.length + 1}.0`,
      nombre: nombre.trim(),
      fase,
      responsable,
      semanaInicio,
      duracionSemanas: esHito ? 0.5 : duracionSemanas,
      porcentajeAvance,
      entregablePrincipal:
        entregablePrincipal.trim() || 'Entregable técnico validado',
      predecesoras,
      esHito,
      notas: notas.trim() || 'Actividad incorporada al cronograma del proyecto SaaS.',
    });

    toast.success(`Tarea [${creada.codigo}] "${creada.nombre}" añadida al Gantt`);
    setNombre('');
    setEntregablePrincipal('');
    setPredecesoras([]);
    setNotas('');
    establecerModal(false);
  };

  return (
    <div className="modal is-active modal-nueva-tarea">
      <div
        className="modal-background"
        onClick={() => establecerModal(false)}
      />
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">
            Añadir Nueva Actividad o Hito al Proyecto SaaS
          </p>
          <button
            type="button"
            className="delete"
            aria-label="Cerrar modal"
            onClick={() => establecerModal(false)}
          />
        </header>

        <form onSubmit={manejarEnvioFormulario}>
          <section className="modal-card-body">
            <div className="grilla-modal-encabezado">
              <div>
                <label className="etiqueta-campo-inspector">Código WBS</label>
                <input
                  type="text"
                  className="input is-small"
                  placeholder="Ej. 3.5"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
              </div>

              <div>
                <label className="etiqueta-campo-inspector">
                  Nombre de la Tarea / Hito *
                </label>
                <input
                  type="text"
                  className="input is-small"
                  placeholder="Ej. Integración de pasarela SSO SAML 2.0"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="contenedor-boton-hito-modal">
                <button
                  type="button"
                  className={combinarClases(
                    'button is-small boton-sutil',
                    esHito && 'es-activo'
                  )}
                  onClick={() => setEsHito(!esHito)}
                >
                  <span className="icon is-small">
                    <Diamond size={12} />
                  </span>
                  <span>{esHito ? 'Es Hito Clave' : 'Tarea Normal'}</span>
                </button>
              </div>
            </div>

            <div className="grilla-modal-dos">
              <div>
                <label className="etiqueta-campo-inspector">Fase del Proyecto</label>
                <div className="select is-small is-fullwidth">
                  <select
                    value={fase}
                    onChange={(e) => setFase(e.target.value as FaseProyecto)}
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
                <label className="etiqueta-campo-inspector">Rol Responsable TI</label>
                <div className="select is-small is-fullwidth">
                  <select
                    value={responsable}
                    onChange={(e) =>
                      setResponsable(e.target.value as RolResponsable)
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

            <div className="grilla-modal-tres">
              <div>
                <label className="etiqueta-campo-inspector">
                  Semana de Inicio
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  className="input is-small"
                  value={semanaInicio}
                  onChange={(e) => setSemanaInicio(Number(e.target.value) || 1)}
                />
              </div>

              <div>
                <label className="etiqueta-campo-inspector">
                  Duración (Semanas)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  disabled={esHito}
                  className="input is-small"
                  value={esHito ? 0.5 : duracionSemanas}
                  onChange={(e) =>
                    setDuracionSemanas(Number(e.target.value) || 0.5)
                  }
                />
              </div>

              <div className="campo-avance-modal">
                <label className="etiqueta-campo-inspector">
                  Avance Inicial ({porcentajeAvance}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="deslizador-avance"
                  style={{ marginTop: '0.45rem' }}
                  value={porcentajeAvance}
                  onChange={(e) => setPorcentajeAvance(Number(e.target.value))}
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label className="etiqueta-campo-inspector">
                Entregable Principal Verificable
              </label>
              <input
                type="text"
                className="input is-small"
                placeholder="Ej. Servicio desplegado con pruebas de integración aprobadas"
                value={entregablePrincipal}
                onChange={(e) => setEntregablePrincipal(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label className="etiqueta-campo-inspector">
                Predecesoras ({predecesoras.length} seleccionadas)
              </label>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.35rem',
                  maxHeight: '90px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  backgroundColor: 'var(--color-superficie-1)',
                  border: '1px solid var(--color-borde-sutil)',
                  borderRadius: '6px',
                }}
              >
                {tareas.map((t) => {
                  const seleccionada = predecesoras.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={combinarClases(
                        'button is-small boton-sutil',
                        seleccionada && 'es-activo'
                      )}
                      style={{ height: '24px', fontSize: '0.68rem' }}
                      onClick={() => alternarPredecesora(t.id)}
                    >
                      {t.codigo} · {t.nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="etiqueta-campo-inspector">
                Notas Técnicas / Criterios de Aceptación
              </label>
              <textarea
                rows={2}
                className="textarea is-small"
                placeholder="Observaciones adicionales sobre alcance o arquitectura..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>
          </section>

          <footer className="modal-card-foot">
            <button
              type="button"
              className="button is-small boton-sutil"
              onClick={() => establecerModal(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button is-small boton-primario-acento"
            >
              <span className="icon is-small">
                <Plus size={14} />
              </span>
              <span>Incorporar al Cronograma</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
