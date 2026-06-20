/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Operator } from '../types';

interface UserManagerProps {
  searchQuery: string;
  currentUserRole: string;
}

export const UserManager: React.FC<UserManagerProps> = ({ searchQuery, currentUserRole }) => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'ANALYST' | 'VIEWER'>('ANALYST');
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      const mapped: Operator[] = data.map((u: any) => ({
        id: u.id,
        avatarInitials: u.nombre.substring(0, 2).toUpperCase(),
        name: u.nombre,
        email: u.nombre + '@pendiente.com', // mock email
        role: u.rol,
        status: 'Active', // Mocked as the backend AppUser doesn't have status yet
        lastLogin: 'N/A'
      }));
      setOperators(mapped);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddOperatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPassword) {
      alert('Por favor complete los campos Nombre y Contraseña.');
      return;
    }

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newName, passHasheada: newPassword, rol: newRole })
      });
      setShowAddModal(false);
      setNewName('');
      setNewPassword('');
      setNewRole('ANALYST');
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = (email: string) => {
    // Note: status is not supported in the current AppUser entity backend
    alert('Función no soportada por el backend en esta versión.');
  };

  const handleDeleteOperator = async (id: number, name: string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar al operador "${name}" del acceso al sistema?`)) {
      try {
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        fetchUsers();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredOperators = operators.filter((op) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return op.name.toLowerCase().includes(q) || op.email.toLowerCase().includes(q) || op.role.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="fixed top-0 right-0 left-64 z-50 bg-[#ffb703]/10 border-b border-[#ffb703]/20 px-6 py-2 flex items-center justify-center gap-2 backdrop-blur-md select-none">
        <span className="material-symbols-outlined text-[#ffb703] text-[18px]">lock</span>
        <span className="font-mono text-[10px] font-bold text-[#271900] tracking-wider uppercase">
          ACCESO RESTRINGIDO: SE REQUIEREN PERMISOS DE NIVEL 4
        </span>
      </div>

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

        {currentUserRole.includes('ADMIN') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-opacity-95 text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide flex items-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg transition-all cursor-pointer group"
          >
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform text-sm font-bold">add</span>
            Agregar Nuevo Usuario
          </button>
        )}
      </div>

      <div className="bg-white border border-[#cbd5e1] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-[#f8f9ff] flex justify-between items-center select-none">
          <h2 className="font-sans font-bold text-[#191c1e] text-base">Directorio de Operadores</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eff4ff]/60 border-b border-[#cbd5e1] select-none text-[10px] font-mono tracking-wider font-bold text-slate-500 uppercase">
                <th className="px-6 py-3.5 pl-6">Nombre del Operador</th>
                <th className="px-6 py-3.5">Rol</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-sm font-semibold text-[#191c1e] bg-white">
              {filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                    No se encontraron operadores
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op: any) => (
                  <tr key={op.id} className="hover:bg-[#f0f4fa]/40 transition-colors group">
                    <td className="px-6 py-4 font-sans pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-container text-primary flex items-center justify-center font-bold text-[11px] border border-primary/10 select-none">
                          {op.avatarInitials}
                        </div>
                        <div>
                          <div className="font-sans font-bold text-slate-900 leading-tight">
                            {op.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-extrabold tracking-wider bg-slate-100 text-slate-600 border border-slate-200`}>
                        {op.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-medium text-secondary font-bold">Activo</span>
                    </td>
                    <td className="px-6 py-4 text-right pr-6 select-none">
                      <div className="flex items-center justify-end gap-2 text-slate-400">
                        <button 
                          onClick={() => handleDeleteOperator(op.id, op.name)}
                          className="p-1 hover:text-red-500 rounded hover:bg-slate-50 duration-100 transition-colors cursor-pointer"
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
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl p-6 w-full max-w-md animate-[bounceIn_0.2s_ease-out]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 select-none">
              <h2 className="text-base font-bold text-slate-900 leading-none flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-md font-extrabold">person_add</span>
                Agregar Nuevo Operador
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-red-500 cursor-pointer p-0.5 rounded">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddOperatorSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
                  Nombre Completo del Operador
                </label>
                <input 
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
                  Contraseña de acceso
                </label>
                <input 
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none font-sans"
                />
              </div>

              <div className="space-y-1 select-none">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
                  Rol de Acceso de Seguridad
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none font-sans"
                >
                  <option value="ADMIN">ADMINISTRADOR (Nivel 4 Raíz)</option>
                  <option value="ANALYST">ANALISTA (Nivel 3 Escritura)</option>
                  <option value="VIEWER">OBSERVADOR (Nivel 1 Lectura)</option>
                </select>
              </div>

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
