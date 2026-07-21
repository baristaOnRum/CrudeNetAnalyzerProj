import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface QosSettingsProps {
    isAdmin?: boolean;
}

export const QosSettings: React.FC<QosSettingsProps> = ({ isAdmin = false }) => {
    const [criticalLatency, setCriticalLatency] = useState('150');
    const [criticalJitter, setCriticalJitter] = useState('30');
    
    // Umbrales de puntuación de red (límite inferior para cada categoría)
    const [scoreExcellent, setScoreExcellent] = useState('90');
    const [scoreGood, setScoreGood] = useState('70');
    const [scoreRegular, setScoreRegular] = useState('50');
    const [scoreDeficient, setScoreDeficient] = useState('30');

    const [isSaving, setIsSaving] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const getParam = async (key: string, defaultVal: string) => {
                    const res = await fetch(`/api/configurations/${key}`);
                    if (res.ok) {
                        const data = await res.json();
                        return data.valorSeleccionado || defaultVal;
                    }
                    return defaultVal;
                };

                setCriticalLatency(await getParam('CRITICAL_LATENCY_MS', '150'));
                setCriticalJitter(await getParam('CRITICAL_JITTER_MS', '30'));
                
                setScoreExcellent(await getParam('SCORE_EXCELLENT', '90'));
                setScoreGood(await getParam('SCORE_GOOD', '70'));
                setScoreRegular(await getParam('SCORE_REGULAR', '50'));
                setScoreDeficient(await getParam('SCORE_DEFICIENT', '30'));
                
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
            const updateParam = async (key: string, val: string) => {
                await fetch(`/api/configurations/${key}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: val
                });
            };

            await updateParam('CRITICAL_LATENCY_MS', criticalLatency);
            await updateParam('CRITICAL_JITTER_MS', criticalJitter);
            await updateParam('SCORE_EXCELLENT', scoreExcellent);
            await updateParam('SCORE_GOOD', scoreGood);
            await updateParam('SCORE_REGULAR', scoreRegular);
            await updateParam('SCORE_DEFICIENT', scoreDeficient);

            Swal.fire('Configuración Guardada', 'Los parámetros QoS se han actualizado exitosamente.', 'success');
        } catch (e) {
            Swal.fire('Error', 'No se pudieron guardar las configuraciones QoS.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (initialLoad) {
        return (
            <div className="flex justify-center items-center h-64 text-slate-500">
                <span className="material-symbols-outlined animate-spin text-4xl mb-4 text-indigo-500">autorenew</span>
                <p>Cargando parámetros QoS...</p>
            </div>
        );
    }

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

            <h3 className="text-sm font-bold text-slate-800 mt-8 mb-4 border-b border-slate-200 pb-2">
                Umbrales de Puntuación (Límites Inferiores)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Excelente (≥)</label>
                    <input type="number" value={scoreExcellent} onChange={(e) => setScoreExcellent(e.target.value)} disabled={!isAdmin} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Bueno (≥)</label>
                    <input type="number" value={scoreGood} onChange={(e) => setScoreGood(e.target.value)} disabled={!isAdmin} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Regular (≥)</label>
                    <input type="number" value={scoreRegular} onChange={(e) => setScoreRegular(e.target.value)} disabled={!isAdmin} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Deficiente (≥)</label>
                    <input type="number" value={scoreDeficient} onChange={(e) => setScoreDeficient(e.target.value)} disabled={!isAdmin} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" />
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
