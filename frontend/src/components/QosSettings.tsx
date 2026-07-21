import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface QosSettingsProps {
    isAdmin?: boolean;
}

export const QosSettings: React.FC<QosSettingsProps> = ({ isAdmin = false }) => {
    const [criticalLatency, setCriticalLatency] = useState('150');
    const [criticalJitter, setCriticalJitter] = useState('30');
    const [isSaving, setIsSaving] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const resLatency = await fetch('/api/configurations/CRITICAL_LATENCY_MS');
                if (resLatency.ok) {
                    const data = await resLatency.json();
                    setCriticalLatency(data.valorSeleccionado || '150');
                }
                const resJitter = await fetch('/api/configurations/CRITICAL_JITTER_MS');
                if (resJitter.ok) {
                    const data = await resJitter.json();
                    setCriticalJitter(data.valorSeleccionado || '30');
                }
            } catch (e) {
                console.error("No se pudo cargar la configuración QoS", e);
            } finally {
                setInitialLoad(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (!isAdmin) {
            Swal.fire('Acceso Denegado', 'No tienes permisos para modificar la configuración de red.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            await fetch('/api/configurations/CRITICAL_LATENCY_MS', {
                method: 'PUT',
                headers: { 'Content-Type': 'text/plain' },
                body: criticalLatency.toString()
            });
            await fetch('/api/configurations/CRITICAL_JITTER_MS', {
                method: 'PUT',
                headers: { 'Content-Type': 'text/plain' },
                body: criticalJitter.toString()
            });
            
            Swal.fire({
                icon: 'success',
                title: '¡Guardado!',
                text: 'Los umbrales de Calidad de Red (QoS) han sido actualizados exitosamente.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire('Error', 'Hubo un problema al aplicar la configuración.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (initialLoad) return <div className="text-center py-4 text-slate-500">Cargando Umbrales...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 mt-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">speed</span>
                Umbrales de Calidad de Red (QoS)
            </h3>
            
            <p className="text-sm text-slate-600 mb-6">
                Estos valores determinan la penalización en la Puntuación de Red (Network Score). Una latencia o un jitter por encima de estos umbrales se considerará crítico para el tiempo real.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Latencia Crítica (P99) - ms</label>
                    <input
                        type="number"
                        value={criticalLatency}
                        onChange={(e) => setCriticalLatency(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">Sugerido: 100 - 150 ms para VoIP.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Jitter Crítico (Promedio) - ms</label>
                    <input
                        type="number"
                        value={criticalJitter}
                        onChange={(e) => setCriticalJitter(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">Sugerido: 20 - 30 ms para VoIP.</p>
                </div>
            </div>

            {isAdmin && (
                <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : 'Aplicar Cambios'}
                    </button>
                </div>
            )}
        </div>
    );
};
