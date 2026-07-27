/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Operator } from '../types';
import { Modal } from './common/Modal';

interface UserManagerProps {
  currentUserRole: string;
}

export const UserManager: React.FC<UserManagerProps> = ({ currentUserRole }) => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Operator | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'ADMINISTRADOR' | 'ANALISTA' | 'OBSERVADOR'>('ANALISTA');
  const [newPassword, setNewPassword] = useState('');

  // Edit states
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'ADMINISTRADOR' | 'ANALISTA' | 'OBSERVADOR'>('ANALISTA');

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [fuzzySearch, setFuzzySearch] = useState('');

  const fetchUsers = async (page = 0, search = fuzzySearch) => {
    try {
      const res = await fetch(`/api/users/search?page=${page}&size=10`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: search })
      });
      if (res.ok) {
        const data = await res.json();
        const rawList = data.content ?? data;
        if (data.totalPages !== undefined) {
          setTotalPages(data.totalPages);
          setCurrentPage(data.number);
        }
        const mapped: Operator[] = rawList.map((u: any) => ({
          id: u.id,
          avatarInitials: u.nombre ? u.nombre.substring(0, 2).toUpperCase() : 'US',
          name: u.nombre,
          role: u.rol || 'ANALYST',
          status: 'Active',
          lastLogin: new Date().toLocaleDateString()
        }));
        setOperators(mapped);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleViewDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`);
      if (res.ok) {
        const u = await res.json();
        setSelectedUser({
          id: u.id,
          avatarInitials: u.nombre ? u.nombre.substring(0, 2).toUpperCase() : 'US',
          name: u.nombre,
          role: u.rol || 'ANALYST',
          status: 'Active',
          lastLogin: new Date().toLocaleDateString()
        });
      } else {
        const op = operators.find(o => (o as any).id === id);
        if (op) setSelectedUser(op);
      }
    } catch (e) {
      const op = operators.find(o => (o as any).id === id);
      if (op) setSelectedUser(op);
    }
  };

  const handleStartEdit = (op: Operator) => {
    setEditingUser(op);
    setEditName(op.name);
    setEditRole(op.role);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${(editingUser as any).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editName, rol: editRole })
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
        Swal.fire({ title: 'Usuario Actualizado', text: 'Los datos del operador han sido guardados.', icon: 'success', confirmButtonColor: '#4F46E5' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddOperatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPassword) {
      Swal.fire({ text: 'Por favor complete los campos Nombre y Contraseña.', icon: 'warning', confirmButtonColor: '#4F46E5' });
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
      setNewRole('ANALISTA');
      fetchUsers();
      Swal.fire({ title: 'Usuario Creado', text: 'Nuevo perfil registrado.', icon: 'success', confirmButtonColor: '#4F46E5' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOperator = async (id: number, name: string) => {
    Swal.fire({
      title: '¿Eliminar usuario?',
      text: `¿Está seguro de que desea eliminar al operador "${name}" del acceso al sistema?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
          if (res.ok) {
            Swal.fire({ title: 'Usuario Eliminado', text: `El operador "${name}" ha sido eliminado exitosamente.`, icon: 'success', confirmButtonColor: '#4F46E5' });
            fetchUsers(currentPage);
          } else {
            const errText = await res.text();
            Swal.fire({ title: 'No se pudo eliminar', text: errText || 'El usuario no pudo ser eliminado.', icon: 'error', confirmButtonColor: '#4F46E5' });
          }
        } catch (e) {
          console.error(e);
          Swal.fire({ title: 'Error de Red', text: 'No se pudo procesar la solicitud de eliminación.', icon: 'error', confirmButtonColor: '#4F46E5' });
        }
      }
    });
  };

  return (
    <div className="space-y-6 font-sans mt-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 select-none">
        <h3 className="font-bold text-lg text-slate-900">Gestión de Cuentas</h3>
        {currentUserRole.toUpperCase().includes('ADMINISTRADOR') && (
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
        <div className="px-6 py-4 border-b border-slate-100 bg-[#f8f9ff] flex flex-col md:flex-row justify-between items-center gap-4 select-none">
          <h2 className="font-sans font-bold text-[#191c1e] text-base">Listado de Usuarios</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={fuzzySearch}
                onChange={(e) => setFuzzySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers(0, fuzzySearch)}
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64"
                title="Búsqueda difusa por nombre o rol"
              />
            </div>
            <button 
              onClick={() => fetchUsers(0, fuzzySearch)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-bold transition-colors cursor-pointer"
            >
              Buscar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#eff4ff]/60 border-b border-[#cbd5e1] select-none text-[10px] font-mono tracking-wider font-bold text-slate-500 uppercase">
                <th className="px-6 py-3.5 pl-6 w-1/2">Nombre</th>
                <th className="px-6 py-3.5 w-1/4">Rol</th>
                <th className="px-6 py-3.5 text-right pr-6 w-1/4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-sm font-semibold text-[#191c1e] bg-white">
              {operators.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400 italic">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                operators.map((op: any) => (
                  <tr key={op.id} className="hover:bg-[#f0f4fa]/40 transition-colors group">
                    <td className="px-6 py-4 font-sans pl-6 max-w-0 overflow-hidden">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-primary-container text-primary flex items-center justify-center font-bold text-[11px] border border-primary/10 select-none shrink-0">
                          {op.avatarInitials}
                        </div>
                        <div className="truncate max-w-full" title={op.name}>
                          <div className="font-sans font-bold text-slate-900 leading-tight truncate">
                            {op.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 truncate max-w-0" title={op.role}>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-extrabold tracking-wider bg-slate-100 text-slate-600 border border-slate-200 inline-block truncate`}>
                        {op.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right pr-6 select-none space-x-1">
                      <button
                        onClick={() => handleViewDetails(op.id)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-primary border border-primary/20 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Ver Detalle
                      </button>
                      {currentUserRole.toUpperCase().includes('ADMINISTRADOR') && (
                        <>
                          <button
                            onClick={() => handleStartEdit(op)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteOperator(op.id, op.name)}
                            className="p-1 hover:text-red-500 rounded hover:bg-slate-50 duration-100 transition-colors cursor-pointer inline-flex items-center align-middle"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-[#f8f9ff] flex justify-between items-center select-none">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Página</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage + 1}
                onChange={(e) => {
                  let p = parseInt(e.target.value, 10);
                  if (isNaN(p)) return;
                  if (p < 1) p = 1;
                  if (p > totalPages) p = totalPages;
                  fetchUsers(p - 1);
                }}
                className="w-16 px-2 py-1 border border-slate-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs font-bold text-slate-500">
                de {totalPages}
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 0} 
                onClick={() => fetchUsers(currentPage - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Anterior
              </button>
              <button 
                disabled={currentPage >= totalPages - 1} 
                onClick={() => fetchUsers(currentPage + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`Perfil de Usuario: ${selectedUser.name}`}
          subtitle="Detalles del operador de seguridad y rol de acceso"
          icon="account_circle"
          badge={{ text: selectedUser.role, variant: 'purple' }}
          fields={[
            { label: 'Identificador Unico', value: `#${(selectedUser as any).id}` },
            { label: 'Nombre Completo', value: selectedUser.name },
            { label: 'Rol de Seguridad', value: selectedUser.role },
            { label: 'Estado de Cuenta', value: 'ACTIVO / ACCESO HABILITADO' }
          ]}
          actions={currentUserRole.toUpperCase().includes('ADMINISTRADOR') ? [
            {
              label: 'Editar Perfil',
              icon: 'edit',
              onClick: () => {
                const u = selectedUser;
                setSelectedUser(null);
                handleStartEdit(u);
              }
            }
          ] : undefined}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Editar Operador: ${editingUser.name}`}
          subtitle="Modificar atributos del usuario en base de datos"
          icon="edit"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                Nombre Completo del Operador
              </label>
              <input 
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                Rol de Acceso de Seguridad
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="ANALISTA">Analista</option>
                <option value="OBSERVADOR">Observador</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Agregar Nuevo Operador"
          subtitle="Registrar cuenta de acceso en el sistema"
          icon="person_add"
        >
          <form onSubmit={handleAddOperatorSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                Nombre Completo del Operador
              </label>
              <input 
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                Contraseña de acceso
              </label>
              <input 
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                Rol de Acceso de Seguridad
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="ANALISTA">Analista</option>
                <option value="OBSERVADOR">Observador</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 cursor-pointer"
              >
                Enviar Perfil
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

