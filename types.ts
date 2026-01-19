
export enum ReadingStatus {
  LIDO = 'LIDO',
  PENDENTE = 'PENDENTE',
  ERRO = 'ERRO'
}

export interface Reading {
  id: string;
  apartmentId: string;
  type: 'water' | 'gas';
  previousValue: number;
  currentValue?: number;
  date: string;
  status: ReadingStatus;
  alertMessage?: string;
}

export interface Apartment {
  id: string;
  number: string;
  block: string;
  residentName: string;
  residentRole: 'Proprietário' | 'Inquilino';
  avatarUrl?: string;
}

export interface ConsumptionSummary {
  totalWater: number;
  waterChange: number;
  totalGas: number;
  gasChange: number;
  month: string;
}
