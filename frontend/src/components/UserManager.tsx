/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Operator } from '../types';

// Initial pre-populated operators matching layout screenshots
const INITIAL_OPERATORS: Operator[] = [
  {
    avatarInitials: 'JD',
    name: 'Julian Draxler',
    email: 'j.draxler@pendiente.com',
    role: 'ADMIN',
    status: 'Active',
    lastLogin: '2023-10-24 14:22:01'
  },
  {
    avatarInitials: 'SC',
    name: 'Sarah Connor',
    email: 's.connor@pendiente.com',
    role: 'ANALYST',
    status: 'Active',
    lastLogin: '2023-10-24 11:05:45'
  },
  {
    avatarInitials: 'MK',
    name: 'Marcus Knight',
    email: 'm.knight@pendiente.com',
    role: 'VIEWER',
    status: 'Suspended',
    lastLogin: '2023-09-12 09:12:33'
  },
  {
    avatarInitials: 'EL',
    name: 'Elena Loomis',
    email: 'e.loomis@pendiente.com',
    role: 'ANALYST',
    status: 'Active',
    lastLogin: '2023-10-23 22:50:11'
  }
];

interface UserManagerProps {
  searchQuery: string;
}

export const UserManager: React.FC<UserManagerProps> = ({ searchQuery }) => {
  const [operators, setOperators] = useState<Operator[]>(INITIAL_OPERATORS);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for creating a new operator
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'ANALYST' | 'VIEWER'>('ANALYST');
  const [newStatus, setNewStatus] = useState<'Active' | 'Suspended'>('Active');

  // Handle adding user
  const handleAddOperatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      alert('Por favor complete los campos de Nombre y Correo.');
      return;
    }

    // Capture initials
    const initials = newName
      .trim()
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const newOp: Operator = {
      avatarInitials: initials || 'OP',
      name: newName,
      email: newEmail,
      role: newRole,
      status: newStatus,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setOperators((prev) => [...prev, newOp]);
    setShowAddModal(false);

    // Reset fields
    setNewName('');
    setNewEmail('');
    setNewRole('ANALYST');
    setNewStatus('Active');
  };

  // Toggle user suspension state
  const handleToggleStatus = (email: string) => {
    setOperators((prev) =>
      prev.map((op) => {
        if (op.email === email) {
          const toggledStatus = op.status === 'Active' ? 'Suspended' : 'Active';
          return { ...op, status: toggledStatus };
        }
        return op;
      })
    );
  };

  // Delete user from directory list
  const handleDeleteOperator = (email: string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar al operador "${email}" del acceso al sistema?`)) {
      setOperators((prev) => prev.filter((op) => op.email !== email));
    }
  };

  // Filter operator records list based on top header query bounds
  const filteredOperators = operators.filter((op) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return op.name.toLowerCase().includes(q) || op.email.toLowerCase().includes(q) || op.role.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Warning Permission required banner */}
      <div className="fixed top-0 right-0 left-64 z-50 bg-[#ffb703]/10 border-b border-[#ffb703]/20 px-6 py-2 flex items-center justify-center gap-2 backdrop-blur-md select-none">
        <span className="material-symbols-outlined text-[#ffb703] text-[18px]">lock</span>
        <span className="font-mono text-[10px] font-bold text-[#271900] tracking-wider uppercase">
          ACCESO RESTRINGIDO: SE REQUIEREN PERMISOS DE NIVEL 4
        </span>
      </div>

      {/* Title block row space-y wrapper */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-6 select-none">
        <div>
          <h1 className="text-3.5xl font-bold tracking-tight text-slate-950 font-sans leading-none flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3.5xl">security</span>
            Gestionar Usuarios
          </h1>
          <p className="text-sm text-[#42474e] mt-1">
            Control de acceso de usuarios en todo el sistema y perfiles de gestión de autorización.
          </p>
        </div>

        {/* Add User trigger button widget */}
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-opacity-95 text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide flex items-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg transition-all cursor-pointer group"
        >
          <span className="material-symbols-outlined group-hover:rotate-90 transition-transform text-sm font-bold">add</span>
          Agregar Nuevo Usuario
        </button>
      </div>

      {/* Main Table Operator Directory card wrapper container */}
      <div className="bg-white border border-[#cbd5e1] rounded-2xl overflow-hidden shadow-sm">
        
        {/* Card Header title info */}
        <div className="px-6 py-4 border-b border-slate-100 bg-[#f8f9ff] flex justify-between items-center select-none">
          <h2 className="font-sans font-bold text-[#191c1e] text-base">
            Directorio de Operadores
          </h2>
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer" title="Filtros de configuración">
              <span className="material-symbols-outlined text-[19px]">filter_list</span>
            </button>
            <button className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer" title="Más opciones de configuración">
              <span className="material-symbols-outlined text-[19px]">more_vert</span>
            </button>
          </div>
        </div>

        {/* Directory Tables list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eff4ff]/60 border-b border-[#cbd5e1] select-none text-[10px] font-mono tracking-wider font-bold text-slate-500 uppercase">
                <th className="px-6 py-3.5 pl-6">Nombre del Operador</th>
                <th className="px-6 py-3.5">Rol</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5">Último Acceso</th>
                <th className="px-6 py-3.5 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-sm font-semibold text-[#191c1e] bg-white">
              {filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                    No se encontraron operadores para el filtro de búsqueda "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op) => (
                  <tr key={op.email} className="hover:bg-[#f0f4fa]/40 transition-colors group">
                    <td className="px-6 py-4 font-sans pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-container text-primary flex items-center justify-center font-bold text-[11px] border border-primary/10 select-none">
                          {op.avatarInitials}
                        </div>
                        <div>
                          <div className="font-sans font-bold text-slate-900 leading-tight">
                            {op.name}
                          </div>
                          <div className="text-[11px] font-mono font-medium text-slate-400 mt-0.5">
                            {op.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-extrabold tracking-wider ${
                        op.role === 'ADMIN' 
                          ? 'bg-[#e5eeff] text-[#0077b6] border border-primary/20' 
                          : op.role === 'ANALYST'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {op.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(op.email)}
                        className="flex items-center gap-2 select-none text-left cursor-pointer hover:bg-slate-50 px-2 py-0.5 rounded-md transition-colors"
                        title="Haga clic para alternar el estado de suspensión"
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          op.status === 'Active' 
                            ? 'bg-[#00b4d8] glow-pulse' 
                            : 'bg-red-500'
                        }`} />
                        <span className={`text-[12px] font-medium ${op.status === 'Active' ? 'text-secondary font-bold' : 'text-red-500'}`}>
                          {op.status === 'Active' ? 'Activo' : 'Suspendido'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-[#42474e]">
                      {op.lastLogin}
                    </td>
                    <td className="px-6 py-4 text-right pr-6 select-none">
                      <div className="flex items-center justify-end gap-2 text-slate-400">
                        <button 
                          onClick={() => handleToggleStatus(op.email)}
                          className="p-1 hover:text-primary rounded hover:bg-slate-50 duration-100 transition-colors cursor-pointer"
                          title="Alternar estado de suspensión"
                        >
                          <span className="material-symbols-outlined text-[17px]">no_accounts</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteOperator(op.email)}
                          className="p-1 hover:text-red-500 rounded hover:bg-slate-50 duration-100 transition-colors cursor-pointer"
                          title="Eliminar perfil de operador"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete_forever</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer representation details */}
        <div className="px-6 py-4 bg-[#eff4ff]/35 text-xs text-slate-400 border-t border-[#cbd5e1] font-sans flex justify-between items-center select-none">
          <span>Mostrando 1-{filteredOperators.length} de {operators.length} operadores</span>
          <div className="flex gap-2 font-semibold">
            <button className="px-3.5 py-1.5 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 transition-colors cursor-not-allowed text-slate-300" disabled>
              Anterior
            </button>
            <button className="px-3.5 py-1.5 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 transition-colors cursor-not-allowed text-slate-300" disabled>
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* System info policy logs text bottom footer section */}
      <footer className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 py-4 border-t border-slate-200 select-none">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="material-symbols-outlined text-[16px]">verified_user</span>
          Todas las acciones en esta página se registran bajo la Política de Auditoría Global #112.
        </div>
        <div className="font-mono text-[11px] text-primary/60">
          Sincronización del Sistema: 100% | ID: 0xF22A | Latencia: 12ms
        </div>
      </footer>

      {/* Add Operator Dynamic Modal Overlay layer */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl p-6 w-full max-w-md animate-[bounceIn_0.2s_ease-out]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 select-none">
              <h2 className="text-base font-bold text-slate-900 leading-none flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-md font-extrabold">person_add</span>
                Agregar Nuevo Operador
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-red-500 cursor-pointer p-0.5 rounded"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddOperatorSubmit} className="space-y-4">
              {/* Operator Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
                  Nombre Completo del Operador
                </label>
                <input 
                  type="text"
                  placeholder="ej. Julian Draxler"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
                  Correo Electrónico de Identificación
                </label>
                <input 
                  type="email"
                  placeholder="ej. j.draxler@pendiente.com"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans"
                />
              </div>

              {/* Role Select */}
              <div className="space-y-1 select-none">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
                  Rol de Acceso de Seguridad
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans"
                >
                  <option value="ADMIN">ADMINISTRADOR (Nivel 4 Raíz)</option>
                  <option value="ANALYST">ANALISTA (Nivel 3 Escritura)</option>
                  <option value="VIEWER">OBSERVADOR (Nivel 1 Lectura)</option>
                </select>
              </div>

              {/* Status selectors */}
              <div className="space-y-1 select-none">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
                  Estado Inicial
                </label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-800 font-bold cursor-pointer">
                     <input 
                      type="radio"
                      name="status_radio"
                      checked={newStatus === 'Active'}
                      onChange={() => setNewStatus('Active')}
                      className="text-[#00b4d8] focus:ring-[#00b4d8]"
                    />
                    Conexión Activa
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-800 font-bold cursor-pointer">
                    <input 
                      type="radio"
                      name="status_radio"
                      checked={newStatus === 'Suspended'}
                      onChange={() => setNewStatus('Suspended')}
                      className="text-red-500 focus:ring-red-500"
                    />
                    Acceso Suspendido
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 select-none">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-opacity-95 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
                >
                  Enviar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
