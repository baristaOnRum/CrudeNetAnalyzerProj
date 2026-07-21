/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DatabaseSettings } from './DatabaseSettings';
import { QosSettings } from './QosSettings';

interface SettingsPanelProps {
  currentUserRole?: string;
  onConfigChange?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  currentUserRole = '',
  onConfigChange
}) => {
  const isAdmin = currentUserRole.toUpperCase().includes('ADMINISTRADOR');

  return (
    <div className="space-y-6 font-sans select-none max-w-4xl mx-auto mt-4">
      <DatabaseSettings isAdmin={isAdmin} isLoginContext={false} onConfigChange={onConfigChange} />
      <QosSettings isAdmin={isAdmin} />
    </div>
  );
};

