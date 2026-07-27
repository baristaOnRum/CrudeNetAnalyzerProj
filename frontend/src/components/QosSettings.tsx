import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface QosSettingsProps {
    isAdmin?: boolean;
}

export const QosSettings: React.FC<QosSettingsProps> = ({ isAdmin = false }) => {
    const [criticalLatency, setCriticalLatency] = useState('150');
    const [criticalJitter, setCriticalJitter] = useState('30');
    const [criticalErrorRate, setCriticalErrorRate] = useState('5');
    const [minSustainedRateKbps, setMinSustainedRateKbps] = useState('100');
    const [minPeakRateKbps, setMinPeakRateKbps] = useState('500');
    
    // Umbrales de puntuación de red (límite inferior para cada categoría)
    const [scoreExcellent, setScoreExcellent] = useState('90');
    const [scoreGood, setScoreGood] = useState('70');
    const [scoreRegular, setScoreRegular] = useState('50');
    const [scoreDeficient, setScoreDeficient] = useState('30');
    const [defaultPingTarget, setDefaultPingTarget] = useState('google.com');
    const [defaultTraceTarget, setDefaultTraceTarget] = useState('8.8.8.8');
    const [defaultAutoDnsResolve, setDefaultAutoDnsResolve] = useState('true');

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
                setCriticalErrorRate(await getParam('CRITICAL_ERROR_RATE', '5'));
                setMinSustainedRateKbps(await getParam('MIN_SUSTAINED_DOWNLOAD_RATE_KBPS', '100'));
                setMinPeakRateKbps(await getParam('MIN_PEAK_DOWNLOAD_RATE_KBPS', '500'));
                
                setScoreExcellent(await getParam('SCORE_EXCELLENT', '90'));
                setScoreGood(await getParam('SCORE_GOOD', '70'));
                setScoreRegular(await getParam('SCORE_REGULAR', '50'));
                setScoreDeficient(await getParam('SCORE_DEFICIENT', '30'));
                setDefaultPingTarget(await getParam('DEFAULT_PING_TARGET', 'google.com'));
                setDefaultTraceTarget(await getParam('DEFAULT_TRACEROUTE_TARGET', '8.8.8.8'));
                setDefaultAutoDnsResolve(await getParam('DEFAULT_AUTO_DNS_RESOLVE', 'true'));
                
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
                const response = await fetch(`/api/configurations/${key}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'text/plain' },
                    body: val
                });
                if (!response.ok) throw new Error("API error");
            };

            await updateParam('CRITICAL_LATENCY_MS', criticalLatency);
            await updateParam('CRITICAL_JITTER_MS', criticalJitter);
            await updateParam('CRITICAL_ERROR_RATE', criticalErrorRate);
            await updateParam('MIN_SUSTAINED_DOWNLOAD_RATE_KBPS', minSustainedRateKbps);
            await updateParam('MIN_PEAK_DOWNLOAD_RATE_KBPS', minPeakRateKbps);
            await updateParam('SCORE_EXCELLENT', scoreExcellent);
            await updateParam('SCORE_GOOD', scoreGood);
            await updateParam('SCORE_REGULAR', scoreRegular);
            await updateParam('SCORE_DEFICIENT', scoreDeficient);
            await updateParam('DEFAULT_PING_TARGET', defaultPingTarget);
            await updateParam('DEFAULT_TRACEROUTE_TARGET', defaultTraceTarget);
            await updateParam('DEFAULT_AUTO_DNS_RESOLVE', defaultAutoDnsResolve);

            Swal.fire('Configuración Guardada', 'Los parámetros de diagnóstico y QoS se han actualizado exitosamente.', 'success');
        } catch (e) {
            Swal.fire('Error', 'No se pudieron guardar las configuraciones de red.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (initialLoad) {
        return (
            <div className="flex justify-center items-center h-64 text-slate-500">
                Cargando configuraciones de red...
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Configuración de Parámetros QoS y Diagnósticos</h2>
            
            <div className="mb-6 bg-indigo-50/60 border border-indigo-200/60 rounded-xl p-4 text-xs text-slate-600">
                <details className="cursor-pointer">
                    <summary className="font-bold text-indigo-700 hover:text-indigo-900 transition-colors flex items-center gap-1.5 list-none cursor-pointer select-none">
                        <span className="material-symbols-outlined text-sm">info</span>
                        ¿Cómo se calcula el Puntaje de Calidad de Servicio (QoS)?
                        <span className="material-symbols-outlined text-base ml-auto transition-transform duration-200 details-chevron">expand_more</span>
                    </summary>
                    <div className="mt-3 space-y-3">
                        <p className="leading-relaxed text-slate-600">
                            El puntaje QoS es una métrica compuesta <strong>(0–100 puntos)</strong> calculada a partir de cinco indicadores clave.
                            Cada indicador <strong>comienza en su puntuación máxima</strong> y <strong>decrece paulatinamente</strong> a medida que el valor medido
                            supera el umbral óptimo configurado, hasta aportar cero puntos al alcanzar el doble del umbral.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="bg-white/70 rounded-lg p-2.5 border border-indigo-100">
                                <p className="font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-indigo-500 text-[14px]">timer</span>
                                    Latencia P90 <span className="text-indigo-600 font-normal ml-1">(30 pts)</span>
                                </p>
                                <p className="text-slate-500 leading-snug">Latencia en el percentil 90. Aporta 30 pts cuando está por debajo del umbral; decae linealmente a 0 pts al duplicarlo.</p>
                            </div>
                            <div className="bg-white/70 rounded-lg p-2.5 border border-indigo-100">
                                <p className="font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-indigo-500 text-[14px]">timeline</span>
                                    Jitter <span className="text-indigo-600 font-normal ml-1">(20 pts)</span>
                                </p>
                                <p className="text-slate-500 leading-snug">Variación en la entrega de paquetes. Aporta 20 pts en condiciones óptimas; se degrada gradualmente al superar el umbral configurado.</p>
                            </div>
                            <div className="bg-white/70 rounded-lg p-2.5 border border-indigo-100">
                                <p className="font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-indigo-500 text-[14px]">warning</span>
                                    Tasa de Errores <span className="text-indigo-600 font-normal ml-1">(20 pts)</span>
                                </p>
                                <p className="text-slate-500 leading-snug">Porcentaje de paquetes con errores o pérdidas. Aporta 20 pts por debajo del umbral; decrece paulatinamente hasta cero al excederlo.</p>
                            </div>
                            <div className="bg-white/70 rounded-lg p-2.5 border border-indigo-100">
                                <p className="font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-indigo-500 text-[14px]">download</span>
                                    Descarga Sostenida <span className="text-indigo-600 font-normal ml-1">(15 pts)</span>
                                </p>
                                <p className="text-slate-500 leading-snug">Tasa promedio mantenida durante la sesión. Aporta 15 pts si alcanza el mínimo; decrece proporcionalmente si cae por debajo.</p>
                            </div>
                            <div className="bg-white/70 rounded-lg p-2.5 border border-indigo-100 sm:col-span-2">
                                <p className="font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-indigo-500 text-[14px]">speed</span>
                                    Descarga Pico <span className="text-indigo-600 font-normal ml-1">(15 pts)</span>
                                </p>
                                <p className="text-slate-500 leading-snug">Tasa máxima registrada en la sesión. Aporta 15 pts si supera el mínimo configurado; decrece gradualmente a 0 pts si cae por debajo.</p>
                            </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2.5 border border-indigo-100">
                            <p className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-indigo-500 text-[14px]">military_tech</span>
                                Clasificación del Puntaje Final
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[11px]">check_circle</span> Excelente ≥ umbral configurado
                                </span>
                                <span className="bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[11px]">thumb_up</span> Bueno ≥ umbral configurado
                                </span>
                                <span className="bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[11px]">remove_circle</span> Regular ≥ umbral configurado
                                </span>
                                <span className="bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[11px]">arrow_downward</span> Deficiente ≥ umbral configurado
                                </span>
                                <span className="bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[11px]">cancel</span> Crítico — por debajo de todos
                                </span>
                            </div>
                        </div>
                    </div>
                </details>
            </div>

            <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-indigo-600">construction</span>
                Destinos y Opciones Globales por Defecto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col justify-between h-full bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                    <div>
                        <label className="min-h-[2.5rem] flex items-end pb-1.5 text-sm font-semibold text-slate-700 leading-tight">
                            Host por Defecto para Ping
                        </label>
                        <input
                            type="text"
                            value={defaultPingTarget}
                            onChange={(e) => setDefaultPingTarget(e.target.value)}
                            disabled={!isAdmin}
                            placeholder="Ej. google.com o 8.8.8.8"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-snug">Objetivo inicial para pruebas de latencia ICMP.</p>
                </div>

                <div className="flex flex-col justify-between h-full bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                    <div>
                        <label className="min-h-[2.5rem] flex items-end pb-1.5 text-sm font-semibold text-slate-700 leading-tight">
                            Host por Defecto para Traza (Traceroute)
                        </label>
                        <input
                            type="text"
                            value={defaultTraceTarget}
                            onChange={(e) => setDefaultTraceTarget(e.target.value)}
                            disabled={!isAdmin}
                            placeholder="Ej. 8.8.8.8 o google.com"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-snug">Objetivo inicial para rastreo de saltos de red.</p>
                </div>

                <div className="flex flex-col justify-between h-full bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                    <div>
                        <label className="min-h-[2.5rem] flex items-end pb-1.5 text-sm font-semibold text-slate-700 leading-tight">
                            Resolución DNS Automática Global
                        </label>
                        <select
                            value={defaultAutoDnsResolve}
                            onChange={(e) => setDefaultAutoDnsResolve(e.target.value)}
                            disabled={!isAdmin}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm cursor-pointer"
                        >
                            <option value="true">Habilitado (Resolver Dominios)</option>
                            <option value="false">Deshabilitado (Solo Direcciones IP)</option>
                        </select>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-snug">Preferencia por defecto para dominios o IPs en las tablas.</p>
                </div>
            </div>

            <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-indigo-600">speed</span>
                Umbrales Críticos para Calidad de Servicio (QoS)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col justify-between h-full bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                    <label className="min-h-[2.5rem] flex items-end pb-1.5 text-sm font-semibold text-slate-700 leading-tight">
                        Latencia Crítica (P90 - ms)
                    </label>
                    <input
                        type="number"
                        value={criticalLatency}
                        onChange={(e) => setCriticalLatency(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                    />
                </div>

                <div className="flex flex-col justify-between h-full bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                    <label className="min-h-[2.5rem] flex items-end pb-1.5 text-sm font-semibold text-slate-700 leading-tight">
                        Jitter Crítico (ms)
                    </label>
                    <input
                        type="number"
                        value={criticalJitter}
                        onChange={(e) => setCriticalJitter(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                    />
                </div>

                <div className="flex flex-col justify-between h-full bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                    <label className="min-h-[2.5rem] flex items-end pb-1.5 text-sm font-semibold text-slate-700 leading-tight">
                        Tasa Crítica Errores (%)
                    </label>
                    <input
                        type="number"
                        value={criticalErrorRate}
                        onChange={(e) => setCriticalErrorRate(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                    />
                </div>

                <div className="flex flex-col justify-between h-full bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                    <label className="min-h-[2.5rem] flex items-end pb-1.5 text-sm font-semibold text-slate-700 leading-tight">
                        Descarga Sostenida Mín. (KB/s)
                    </label>
                    <input
                        type="number"
                        value={minSustainedRateKbps}
                        onChange={(e) => setMinSustainedRateKbps(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                    />
                </div>

                <div className="flex flex-col justify-between h-full bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                    <label className="min-h-[2.5rem] flex items-end pb-1.5 text-sm font-semibold text-slate-700 leading-tight">
                        Descarga Pico Mín. (KB/s)
                    </label>
                    <input
                        type="number"
                        value={minPeakRateKbps}
                        onChange={(e) => setMinPeakRateKbps(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                    />
                </div>
            </div>

            <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-indigo-600">military_tech</span>
                Umbrales de Puntuación (Límites Inferiores)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col justify-between h-full bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                    <label className="min-h-[2rem] flex items-end pb-1.5 text-xs font-bold text-slate-600 uppercase">
                        Excelente (≥)
                    </label>
                    <input type="number" value={scoreExcellent} onChange={(e) => setScoreExcellent(e.target.value)} disabled={!isAdmin} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" />
                </div>
                <div className="flex flex-col justify-between h-full bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                    <label className="min-h-[2rem] flex items-end pb-1.5 text-xs font-bold text-slate-600 uppercase">
                        Bueno (≥)
                    </label>
                    <input type="number" value={scoreGood} onChange={(e) => setScoreGood(e.target.value)} disabled={!isAdmin} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" />
                </div>
                <div className="flex flex-col justify-between h-full bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                    <label className="min-h-[2rem] flex items-end pb-1.5 text-xs font-bold text-slate-600 uppercase">
                        Regular (≥)
                    </label>
                    <input type="number" value={scoreRegular} onChange={(e) => setScoreRegular(e.target.value)} disabled={!isAdmin} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" />
                </div>
                <div className="flex flex-col justify-between h-full bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                    <label className="min-h-[2rem] flex items-end pb-1.5 text-xs font-bold text-slate-600 uppercase">
                        Deficiente (≥)
                    </label>
                    <input type="number" value={scoreDeficient} onChange={(e) => setScoreDeficient(e.target.value)} disabled={!isAdmin} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" />
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
