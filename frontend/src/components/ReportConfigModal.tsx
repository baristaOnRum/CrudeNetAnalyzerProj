/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './common/Modal';

export type ReportMode = 'FAILURES' | 'FULL' | 'CUSTOM';

export interface ReportSectionsConfig {
  networkScore: boolean;
  latencyDistribution: boolean;
  jitterAverage: boolean;
  downloadRate: boolean;
  sustainedDownloadRate: boolean;
  packetRate: boolean;
  errorRate: boolean;
  paretoErrorDistribution: boolean;
  protocolDistribution: boolean;
  topSourceIps: boolean;
  topDestIps: boolean;
}

export interface ReportConfig {
  mode: ReportMode;
  visibleSections: ReportSectionsConfig;
}

interface ReportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: ReportConfig) => void;
  sessionStats?: any;
}

const SECTION_LABELS: Record<keyof ReportSectionsConfig, { label: string; icon: string }> = {
  networkScore: { label: 'Puntuación de Red (QoS)', icon: 'speed' },
  latencyDistribution: { label: 'Distribución de Latencia (Caja y Mechas)', icon: 'query_stats' },
  jitterAverage: { label: 'Jitter Promedio', icon: 'graphic_eq' },
  downloadRate: { label: 'Tasa de Descarga (Pico / Rendimiento Máximo)', icon: 'download_for_offline' },
  sustainedDownloadRate: { label: 'Tasa de Descarga Sostenida (Promedio Continuo)', icon: 'archive' },
  packetRate: { label: 'Tasa de Paquetes (pkt/s)', icon: 'analytics' },
  errorRate: { label: 'Tasa de Errores de Red (%)', icon: 'warning' },
  paretoErrorDistribution: { label: 'Distribución de Errores de Red (Diagrama de Pareto)', icon: 'bar_chart' },
  protocolDistribution: { label: 'Distribución de Protocolos (Gráfica de Pastel)', icon: 'pie_chart' },
  topSourceIps: { label: 'Top 5 IPs Origen (Emisores)', icon: 'call_made' },
  topDestIps: { label: 'Top 5 IPs Destino (Receptores)', icon: 'call_received' }
};

export const ReportConfigModal: React.FC<ReportConfigModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sessionStats
}) => {
  const [mode, setMode] = useState<ReportMode>('FULL');
  const [sections, setSections] = useState<ReportSectionsConfig>({
    networkScore: true,
    latencyDistribution: true,
    jitterAverage: true,
    downloadRate: true,
    sustainedDownloadRate: true,
    packetRate: true,
    errorRate: true,
    paretoErrorDistribution: true,
    protocolDistribution: true,
    topSourceIps: true,
    topDestIps: true
  });

  // Calculate deficient sections for FAILURES mode
  const getFailuresSections = (): ReportSectionsConfig => {
    if (!sessionStats) {
      return {
        networkScore: true,
        latencyDistribution: true,
        jitterAverage: true,
        downloadRate: false,
        sustainedDownloadRate: true,
        packetRate: false,
        errorRate: true,
        paretoErrorDistribution: true,
        protocolDistribution: false,
        topSourceIps: false,
        topDestIps: false
      };
    }

    const isLatencyDeficient = (sessionStats.latencyP90 !== undefined && sessionStats.latencyP90 > 150) || 
                               (sessionStats.latencyMax !== undefined && sessionStats.latencyMax > 300);
    
    const isJitterDeficient = (sessionStats.averageJitter !== undefined && sessionStats.averageJitter > 30) ||
                              (sessionStats.jitter90thPercentile !== undefined && sessionStats.jitter90thPercentile > 50);
    
    const isErrorRateDeficient = (sessionStats.errorRate !== undefined && sessionStats.errorRate >= 3.0);
    const isSustainedRateDeficient = (sessionStats.sustainedDownloadRate !== undefined && sessionStats.sustainedDownloadRate < 100 * 1024);
    
    const isParetoDeficient = isErrorRateDeficient;
    const isScoreDeficient = (sessionStats.networkScore !== undefined && sessionStats.networkScore < 85);

    return {
      networkScore: isScoreDeficient,
      latencyDistribution: isLatencyDeficient,
      jitterAverage: isJitterDeficient,
      downloadRate: false,
      sustainedDownloadRate: isSustainedRateDeficient,
      packetRate: false,
      errorRate: isErrorRateDeficient,
      paretoErrorDistribution: isParetoDeficient,
      protocolDistribution: false,
      topSourceIps: false,
      topDestIps: false
    };
  };

  useEffect(() => {
    if (mode === 'FULL') {
      setSections({
        networkScore: true,
        latencyDistribution: true,
        jitterAverage: true,
        downloadRate: true,
        sustainedDownloadRate: true,
        packetRate: true,
        errorRate: true,
        paretoErrorDistribution: true,
        protocolDistribution: true,
        topSourceIps: true,
        topDestIps: true
      });
    } else if (mode === 'FAILURES') {
      setSections(getFailuresSections());
    }
  }, [mode, sessionStats]);

  const handleToggleSection = (key: keyof ReportSectionsConfig) => {
    if (mode !== 'CUSTOM') setMode('CUSTOM');
    setSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAll = (val: boolean) => {
    setMode('CUSTOM');
    setSections({
      networkScore: val,
      latencyDistribution: val,
      jitterAverage: val,
      downloadRate: val,
      packetRate: val,
      errorRate: val,
      paretoErrorDistribution: val,
      protocolDistribution: val,
      topSourceIps: val,
      topDestIps: val
    });
  };

  const handleConfirm = () => {
    onConfirm({
      mode,
      visibleSections: sections
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Carácter y Configuración del Reporte" maxWidth="max-w-2xl">
      <div className="space-y-6 font-sans">
        <div>
          <p className="text-xs text-slate-500 mb-3 font-medium">
            Seleccione la modalidad con la que desea generar y visualizar las estadísticas del reporte:
          </p>

          {/* Mode Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMode('FAILURES')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                mode === 'FAILURES'
                  ? 'border-red-500 bg-red-50/70 shadow-sm ring-2 ring-red-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-red-600 text-xl">report_problem</span>
                <span className="text-xs font-bold text-slate-800 uppercase">De Fallas</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Muestra únicamente métricas y variables deficientes o con degradación significativa.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('FULL')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                mode === 'FULL'
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-blue-600 text-xl">fact_check</span>
                <span className="text-xs font-bold text-slate-800 uppercase">Completo</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Incluye la totalidad de las 10 secciones estadísticas, tablas y gráficos de la sesión.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('CUSTOM')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                mode === 'CUSTOM'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-indigo-600 text-xl">tune</span>
                <span className="text-xs font-bold text-slate-800 uppercase">Personalizado</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Le permite marcar o desmarcar opcionalmente cada elemento de visualización.
              </p>
            </button>
          </div>
        </div>

        {/* Modular Sections Selection List */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Módulos del Reporte ({Object.values(sections).filter(Boolean).length} / 10 activos)
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Marcar Todos
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Desmarcar Todos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {(Object.keys(SECTION_LABELS) as (keyof ReportSectionsConfig)[]).map((key) => {
              const item = SECTION_LABELS[key];
              const isChecked = sections[key];
              return (
                <label
                  key={key}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                    isChecked
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-white border-slate-100 text-slate-400 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleSection(key)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="material-symbols-outlined text-[18px] text-slate-500">{item.icon}</span>
                  <span className="text-xs font-medium truncate">{item.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Ver Reporte Configurado
          </button>
        </div>
      </div>
    </Modal>
  );
};
