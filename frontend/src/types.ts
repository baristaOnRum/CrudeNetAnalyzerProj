/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppView = 'uplink' | 'dashboard' | 'reports' | 'audits' | 'users' | 'settings' | 'packets';

export interface Packet {
  id: string;
  timestamp: string;
  sourceIp: string;
  destIp: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'HTTPS';
  length: number;
  flags?: string;
  status: 'allowed' | 'flagged' | 'blocked';
}

export interface NetworkSession {
  id: string;
  timestamp: string;
  sourceId: string;
  duration: string;
  status: 'Completed' | 'Archived' | 'Failed';
  totalPackets: string;
  peakThroughput: string;
  primaryProtocol: string;
  primaryProtocolPercent: number;
  anomaliesCount: number;
}

export interface Operator {
  avatarInitials: string;
  name: string;
  role: 'ADMINISTRADOR' | 'ANALISTA' | 'OBSERVADOR';
  status: 'Active' | 'Suspended';
  lastLogin: string;
}

export interface MetricSummary {
  tcpRate: number;      // in GB/s
  tcpChange: number;    // percent
  udpRate: number;      // in GB/s
  udpChange: number;    // percent
  icmpRate: number;     // in GB/s
  icmpChange: string;   // 'stable' etc.
  totalProcessedGb: {
    tcp: number;
    udp: number;
    icmp: number;
  };
}
