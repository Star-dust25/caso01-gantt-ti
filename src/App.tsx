import React, { useEffect, useMemo, useRef } from 'react';
import {
  Group,
  Panel,
  Separator,
  type PanelImperativeHandle,
} from 'react-resizable-panels';
import { Toaster, toast } from 'sonner';
import { BarraHerramientasFlotante } from './componentes/BarraHerramientasFlotante';
import { EncabezadoCaso } from './componentes/EncabezadoCaso';
import { LienzoGantt } from './componentes/LienzoGantt';
import { ModalNuevaTarea } from './componentes/ModalNuevaTarea';
import { PanelInspectorFlotante } from './componentes/PanelInspectorFlotante';
import { TablaTareas } from './componentes/TablaTareas';
import { TarjetasIndicadores } from './componentes/TarjetasIndicadores';
import { usarAlmacenGantt } from './estado/usarAlmacenGantt';
import { calcularRutaCritica } from './utilidades/rutaCritica';

export function App() {
  const tareas = usarAlmacenGantt((e) => e.tareas);
  const filtros = usarAlmacenGantt((e) => e.filtros);
  const tema = usarAlmacenGantt((e) => e.tema);
  const deshacer = usarAlmacenGantt((e) => e.deshacer);
  const rehacer = usarAlmacenGantt((e) => e.rehacer);
  const establecerPanelTablaColapsado = usarAlmacenGantt(
    (e) => e.establecerPanelTablaColapsado
  );

  const referenciaPantalla = useRef<HTMLDivElement | null>(null);
  const referenciaPanelTabla = useRef<PanelImperativeHandle | null>(null);
  const referenciaScrollTabla = useRef<HTMLDivElement | null>(null);
  const referenciaScrollGantt = useRef<HTMLDivElement | null>(null);
  const sincronizandoScrollRef = useRef<boolean>(false);

  // Sincronizar el atributo data-tema en el documento raíz
  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema);
  }, [tema]);

  // Atajos de teclado globales para Deshacer (Ctrl+Z) y Rehacer (Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const manejarTeclado = (evento: KeyboardEvent) => {
      const etiquetaActiva = document.activeElement?.tagName.toLowerCase();
      if (
        etiquetaActiva === 'input' ||
        etiquetaActiva === 'textarea' ||
        etiquetaActiva === 'select'
      ) {
        return;
      }

      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'z') {
        if (evento.shiftKey) {
          evento.preventDefault();
          if (rehacer()) toast('Cambio rehecho');
        } else {
          evento.preventDefault();
          if (deshacer()) toast('Cambio deshecho');
        }
      } else if (
        (evento.ctrlKey || evento.metaKey) &&
        evento.key.toLowerCase() === 'y'
      ) {
        evento.preventDefault();
        if (rehacer()) toast('Cambio rehecho');
      }
    };

    window.addEventListener('keydown', manejarTeclado);
    return () => window.removeEventListener('keydown', manejarTeclado);
  }, [deshacer, rehacer]);

  // Cálculo reactivo de Ruta Crítica (CPM) sobre el conjunto completo de tareas
  const resultadoCPM = useMemo(() => calcularRutaCritica(tareas), [tareas]);

  // Filtrado en tiempo real manteniendo sincronía exacta entre Tabla y Cronograma
  const tareasFiltradas = useMemo(() => {
    const termino = filtros.busqueda.trim().toLowerCase();
    return tareas.filter((tarea) => {
      if (filtros.fase !== 'Todas' && tarea.fase !== filtros.fase) {
        return false;
      }
      if (
        filtros.responsable !== 'Todos' &&
        tarea.responsable !== filtros.responsable
      ) {
        return false;
      }
      if (
        filtros.soloRutaCritica &&
        !resultadoCPM.metricasPorTarea[tarea.id]?.esCritica
      ) {
        return false;
      }
      if (filtros.soloHitos && !tarea.esHito) {
        return false;
      }
      if (termino !== '') {
        const coincide =
          tarea.nombre.toLowerCase().includes(termino) ||
          tarea.codigo.toLowerCase().includes(termino) ||
          tarea.id.toLowerCase().includes(termino) ||
          tarea.entregablePrincipal.toLowerCase().includes(termino) ||
          tarea.responsable.toLowerCase().includes(termino);
        if (!coincide) return false;
      }
      return true;
    });
  }, [tareas, filtros, resultadoCPM]);

  // Sincronización vertical milimétrica entre el scroll de la tabla y el lienzo Gantt
  const manejarScrollDesdeTabla = (evento: React.UIEvent<HTMLDivElement>) => {
    if (sincronizandoScrollRef.current) return;
    sincronizandoScrollRef.current = true;
    if (referenciaScrollGantt.current) {
      referenciaScrollGantt.current.scrollTop = evento.currentTarget.scrollTop;
    }
    requestAnimationFrame(() => {
      sincronizandoScrollRef.current = false;
    });
  };

  const manejarScrollDesdeGantt = (evento: React.UIEvent<HTMLDivElement>) => {
    if (sincronizandoScrollRef.current) return;
    sincronizandoScrollRef.current = true;
    if (referenciaScrollTabla.current) {
      referenciaScrollTabla.current.scrollTop = evento.currentTarget.scrollTop;
    }
    requestAnimationFrame(() => {
      sincronizandoScrollRef.current = false;
    });
  };

  const alternarColapsoPanelTabla = () => {
    const panel = referenciaPanelTabla.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
      establecerPanelTablaColapsado(false);
    } else {
      panel.collapse();
      establecerPanelTablaColapsado(true);
    }
  };

  const restablecerLayoutPaneles = () => {
    const panel = referenciaPanelTabla.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      }
      panel.resize('44%');
      establecerPanelTablaColapsado(false);
    }
  };

  return (
    <div ref={referenciaPantalla} className="aplicacion-gantt">
      {/* Encabezado Ejecutivo y Filtros */}
      <EncabezadoCaso
        alAlternarPanelTabla={alternarColapsoPanelTabla}
        totalTareasVisibles={tareasFiltradas.length}
        totalTareasProyecto={tareas.length}
      />

      {/* Tarjetas KPI Reordenables con @dnd-kit/sortable */}
      <TarjetasIndicadores resultadoCPM={resultadoCPM} tareas={tareas} />

      {/* Espacio de trabajo dividido y redimensionable (Tabla + Lienzo Gantt) */}
      <main className="area-trabajo-principal">
        <Group
          orientation="horizontal"
          className="grupo-paneles-redimensionables"
        >
          <Panel
            id="panel-tabla-tareas"
            panelRef={referenciaPanelTabla}
            defaultSize="44%"
            minSize="22%"
            maxSize="65%"
            collapsible
            collapsedSize="0%"
            onResize={(tamano) => {
              establecerPanelTablaColapsado(tamano.asPercentage < 2);
            }}
          >
            <TablaTareas
              tareas={tareasFiltradas}
              metricasPorTarea={resultadoCPM.metricasPorTarea}
              referenciaScrollTabla={referenciaScrollTabla}
              alDesplazarVerticalmente={manejarScrollDesdeTabla}
            />
          </Panel>

          <Separator
            className="separador-redimensionable ocultar-en-impresion"
            title="Arrastra para redimensionar Tabla y Cronograma (doble clic para restablecer)"
          >
            <div className="indicador-separador" />
          </Separator>

          <Panel id="panel-cronograma-gantt" defaultSize="56%" minSize="35%">
            <LienzoGantt
              tareas={tareasFiltradas}
              metricasPorTarea={resultadoCPM.metricasPorTarea}
              duracionTotalSemanas={resultadoCPM.duracionTotalSemanas}
              referenciaScrollGantt={referenciaScrollGantt}
              alDesplazarVerticalmente={manejarScrollDesdeGantt}
            />
          </Panel>
        </Group>
      </main>

      {/* Panel Inspector Flotante Arrastrable */}
      <PanelInspectorFlotante
        metricasPorTarea={resultadoCPM.metricasPorTarea}
        referenciaRestriccionPantalla={referenciaPantalla}
      />

      {/* Dock de Herramientas Flotante Arrastrable */}
      <BarraHerramientasFlotante
        referenciaRestriccionPantalla={referenciaPantalla}
        alRestablecerLayoutPaneles={restablecerLayoutPaneles}
      />

      {/* Modal Bulma para añadir nueva tarea o hito */}
      <ModalNuevaTarea />

      {/* Notificaciones elegantes estilizadas con la paleta oficial */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-superficie-2)',
            color: 'var(--color-texto-principal)',
            border: '1px solid var(--color-acento)',
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.78rem',
          },
        }}
      />
    </div>
  );
}

export default App;
