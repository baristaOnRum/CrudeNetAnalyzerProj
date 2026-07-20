/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';

export interface ModalField {
  label: string;
  value: React.ReactNode;
  isCode?: boolean;
  fullWidth?: boolean;
}

export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  badge?: {
    text: string;
    variant?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  };
  fields?: ModalField[];
  children?: React.ReactNode;
  actions?: ModalAction[];
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon = 'info',
  badge,
  fields,
  children,
  actions,
  maxWidth = 'lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }[maxWidth];

  const getBadgeStyle = (variant?: string) => {
    switch (variant) {
      case 'green': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'amber': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'purple': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'red': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getActionButtonStyle = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-sm';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm';
      case 'secondary':
        return 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300';
      default:
        return 'bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
      {/* Backdrop overlay listener */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className={`relative w-full ${maxWidthClass} bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-[bounceIn_0.2s_ease-out]`}>
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 leading-tight font-sans">{title}</h3>
                {badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-md border uppercase ${getBadgeStyle(badge.variant)}`}>
                    {badge.text}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-sans">{subtitle}</p>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans text-xs">
          {fields && fields.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field, idx) => (
                <div key={idx} className={field.fullWidth ? 'md:col-span-2' : ''}>
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 block mb-1">
                    {field.label}
                  </label>
                  {field.isCode ? (
                    <div className="bg-slate-900 text-indigo-200 font-mono text-[11px] p-3 rounded-xl border border-slate-800 break-all whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {field.value}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 text-slate-800 font-semibold px-3 py-2 rounded-xl text-xs">
                      {field.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {children}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 select-none">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Cerrar
          </button>
          {actions && actions.map((act, i) => (
            <button
              key={i}
              onClick={act.onClick}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${getActionButtonStyle(act.variant)}`}
            >
              {act.icon && <span className="material-symbols-outlined text-sm">{act.icon}</span>}
              {act.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
