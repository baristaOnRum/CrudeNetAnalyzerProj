import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface DatabaseSettingsProps {
    isAdmin?: boolean;
    isLoginContext?: boolean;
    onConfigChange?: () => void;
}

export const DatabaseSettings: React.FC<DatabaseSettingsProps> = ({ isAdmin = false, isLoginContext = false, onConfigChange }) => {
    const [dbConfig, setDbConfig] = useState({
        dbType: 'postgresql',
        host: 'localhost',
        port: 5432,
        databaseName: 'netanalyzer',
        username: 'postgres',
        password: ''
    });

    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        // Fetch current config if we can
        fetch('/api/configurations/database')
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("No config fetched");
            })
            .then(data => {
                setDbConfig(data);
                setInitialLoad(false);
            })
            .catch(() => {
                // Ignore, might be offline or no initial DB
                setInitialLoad(false);
            });
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDbConfig(prev => ({
            ...prev,
            [name]: name === 'port' ? parseInt(value) || 0 : value
        }));
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        try {
            const res = await fetch('/api/configurations/database/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbConfig)
            });
            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Conexión Exitosa!',
                    text: 'Las credenciales provistas conectan correctamente con la base de datos.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                Swal.fire('Error', 'Fallo en la prueba de conexión con los parámetros provistos.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de red al intentar probar la conexión.', 'error');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSaveConnection = async () => {
        if (!isLoginContext && !isAdmin) {
            Swal.fire('Acceso Denegado', 'No tienes permisos para modificar la configuración.', 'error');
            return;
        }

        const confirmationText = isLoginContext
            ? "¿Estás seguro de que deseas aplicar esta nueva configuración de Base de Datos?"
            : "¡ADVERTENCIA TERMINANTE! Cambiar la base de datos durante una sesión activa forzará el cierre de tu sesión inmediatamente. ¿Estás absolutamente seguro de continuar?";

        const result = await Swal.fire({
            title: '¿Confirmar Cambio de Base de Datos?',
            text: confirmationText,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, aplicar cambios',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setIsSaving(true);
            try {
                const res = await fetch('/api/configurations/database', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dbConfig)
                });
                if (res.ok) {
                    await Swal.fire('Guardado', 'La configuración ha sido aplicada exitosamente.', 'success');
                    if (!isLoginContext) {
                        // Logout logic if we are inside the active session
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.reload();
                    } else {
                        if (onConfigChange) onConfigChange();
                    }
                } else {
                    Swal.fire('Error', 'Hubo un problema al aplicar la configuración.', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Error de red al guardar la configuración.', 'error');
            } finally {
                setIsSaving(false);
            }
        }
    };

    if (initialLoad) {
        return <div className="text-center py-4 text-slate-500">Cargando configuración...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Configuración de Base de Datos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Motor de Base de Datos</label>
                    <select
                        name="dbType"
                        value={dbConfig.dbType}
                        onChange={handleInputChange}
                        disabled={!isAdmin && !isLoginContext}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                        <option value="postgresql">PostgreSQL</option>
                        <option value="sqlite">SQLite (Embebido local)</option>
                    </select>
                </div>

                {dbConfig.dbType !== 'sqlite' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Host</label>
                            <input
                                type="text"
                                name="host"
                                value={dbConfig.host}
                                onChange={handleInputChange}
                                disabled={!isAdmin && !isLoginContext}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Puerto</label>
                            <input
                                type="number"
                                name="port"
                                value={dbConfig.port}
                                onChange={handleInputChange}
                                disabled={!isAdmin && !isLoginContext}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Base de Datos</label>
                            <input
                                type="text"
                                name="databaseName"
                                value={dbConfig.databaseName}
                                onChange={handleInputChange}
                                disabled={!isAdmin && !isLoginContext}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
                            <input
                                type="text"
                                name="username"
                                value={dbConfig.username}
                                onChange={handleInputChange}
                                disabled={!isAdmin && !isLoginContext}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                            <input
                                type="password"
                                name="password"
                                value={dbConfig.password}
                                onChange={handleInputChange}
                                disabled={!isAdmin && !isLoginContext}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </>
                )}
            </div>

            {(isAdmin || isLoginContext) && (
                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 pt-5">
                    <button
                        onClick={handleTestConnection}
                        disabled={isTesting || isSaving}
                        className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                    >
                        {isTesting ? 'Probando...' : 'Probar Conexión'}
                    </button>
                    <button
                        onClick={handleSaveConnection}
                        disabled={isSaving || isTesting}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : 'Aplicar y Guardar'}
                    </button>
                </div>
            )}
        </div>
    );
};
