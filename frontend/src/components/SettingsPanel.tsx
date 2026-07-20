/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Modal } from './common/Modal';

interface SettingsPanelProps {
  currentUserRole?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ currentUserRole = '' }) => {
  const isAdmin = currentUserRole.toUpperCase().includes('ADMINISTRADOR');
  const [dbType, setDbType] = useState<'postgresql' | 'sqlite' | 'h2'>('postgresql');
  const [dbHost, setDbHost] = useState('127.0.0.1');
  const [dbPort, setDbPort] = useState('5432');
  const [dbName, setDbName] = useState('netanalyzer_db');
  const [dbUser, setDbUser] = useState('postgres');
  const [dbPass, setDbPass] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchDbConfig = async () => {
    try {
      const res = await fetch('/api/configurations/database');
      if (res.ok) {
        const data = await res.json();
        if (data.dbType) setDbType(data.dbType);
        if (data.host) setDbHost(data.host);
        if (data.port) setDbPort(data.port);
        if (data.name) setDbName(data.name);
        if (data.username) setDbUser(data.username);
        if (data.password) setDbPass(data.password);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDbConfig();
  }, []);

  const handleEngineChange = (type: 'postgresql' | 'sqlite' | 'h2') => {
    setDbType(type);
    if (type === 'postgresql') setDbPort('5432');
    else if (type === 'h2') setDbPort('8082');
    else setDbPort('N/A');
  };

  const computeDriver = () => {
    switch (dbType) {
      case 'postgresql': return 'org.postgresql.Driver';
      case 'h2': return 'org.h2.Driver';
      default: return 'org.sqlite.JDBC';
    }
  };

  const computeDialect = () => {
    switch (dbType) {
      case 'postgresql': return 'org.hibernate.dialect.PostgreSQLDialect';
      case 'h2': return 'org.hibernate.dialect.H2Dialect';
      default: return 'org.hibernate.community.dialect.SQLiteDialect';
    }
  };

  const computeJdbcUrl = () => {
    if (dbType === 'postgresql') return `jdbc:postgresql://${dbHost}:${dbPort}/${dbName}`;
    if (dbType === 'h2') return `jdbc:h2:mem:${dbName}`;
    return `jdbc:sqlite:${dbName}.db`;
  };

  const handleSaveConfig = async () => {
    try {
      const payload = {
        dbType,
        host: dbHost,
        port: dbPort,
        name: dbName,
        user: dbUser,
        username: dbUser,
        password: dbPass,
        url: computeJdbcUrl()
      };

      const res = await fetch('/api/configurations/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        Swal.fire({
          title: 'Configuración Guardada',
          text: `La conexión a la base de datos (${dbType.toUpperCase()}) y parámetros Hibernate han sido actualizados.`,
          icon: 'success',
          confirmButtonColor: '#4F46E5'
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al guardar la configuración en el servidor.',
          icon: 'error',
          confirmButtonColor: '#4F46E5'
        });
      }
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: 'Error de Red',
        text: 'No se pudo conectar con el servidor.',
        icon: 'error',
        confirmButtonColor: '#4F46E5'
      });
    }
  };

  return (
    <div className="space-y-6 font-sans select-none max-w-4xl mx-auto mt-4">
      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-[#191c1e] flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">database</span>
            Configuración de Base de Datos y Persistencia (Hibernate)
          </h3>
          <button
            type="button"
            onClick={() => setShowDetailModal(true)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-primary border border-primary/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">pageview</span>
            Ver Detalle Técnico Modal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-500 uppercase block">
              Motor de Base de Datos Seleccionable
            </label>
            <select
              value={dbType}
              onChange={(e) => handleEngineChange(e.target.value as any)}
              disabled={!isAdmin}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-sans disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="postgresql">PostgreSQL (Hibernate PostgreSQLDialect)</option>
              <option value="sqlite">SQLite (Hibernate SQLiteDialect)</option>
              <option value="h2">H2 In-Memory (Hibernate H2Dialect)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
              Host / IP del Servidor
            </label>
            <input
              type="text"
              value={dbHost}
              onChange={(e) => setDbHost(e.target.value)}
              disabled={dbType === 'sqlite' || !isAdmin}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
              Puerto de Conexión
            </label>
            <input
              type="text"
              value={dbPort}
              onChange={(e) => setDbPort(e.target.value)}
              disabled={dbType === 'sqlite' || !isAdmin}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
              Nombre de la Base de Datos / Esquema
            </label>
            <input
              type="text"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              disabled={!isAdmin}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
              Usuario Autenticado
            </label>
            <input
              type="text"
              value={dbUser}
              onChange={(e) => setDbUser(e.target.value)}
              disabled={!isAdmin}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
              Contraseña de Acceso
            </label>
            <input
              type="password"
              value={dbPass}
              onChange={(e) => setDbPass(e.target.value)}
              disabled={!isAdmin}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
          {isAdmin ? (
            <button
              type="button"
              onClick={handleSaveConfig}
              className="py-2.5 px-6 bg-primary hover:bg-opacity-90 text-white font-sans text-xs font-bold tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[17px]">save</span>
              GUARDAR CONFIGURACIÓN
            </button>
          ) : (
            <div className="text-xs text-slate-500 italic">Solo los administradores pueden modificar la configuración de red.</div>
          )}
        </div>
      </div>

      {/* Standard Modal for DB Parameters and Details */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Parámetros de Base de Datos y Dialecto Hibernate"
        subtitle="Visualización detallada de la cadena JDBC y controladores ORM"
        icon="database"
        badge={{ text: dbType.toUpperCase(), variant: dbType === 'postgresql' ? 'purple' : 'blue' }}
        fields={[
          { label: 'Motor Seleccionado', value: dbType.toUpperCase() },
          { label: 'Host / IP', value: dbHost },
          { label: 'Puerto', value: dbPort },
          { label: 'Nombre Base de Datos', value: dbName },
          { label: 'Cadena JDBC Calculada', value: computeJdbcUrl(), fullWidth: true, isCode: true },
          { label: 'Driver Class (JPA)', value: computeDriver(), fullWidth: true, isCode: true },
          { label: 'Dialecto Hibernate', value: computeDialect(), fullWidth: true, isCode: true }
        ]}
        actions={isAdmin ? [
          {
            label: 'Guardar esta Configuración',
            icon: 'save',
            onClick: () => {
              setShowDetailModal(false);
              handleSaveConfig();
            }
          }
        ] : undefined}
      />
    </div>
  );
};

