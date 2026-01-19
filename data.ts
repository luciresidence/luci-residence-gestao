
import { Apartment, Reading, ReadingStatus } from './types';

const DEFAULT_APARTMENTS: Apartment[] = [
  { id: '1', number: '101', block: 'A', residentName: 'Roberto Silva', residentRole: 'Proprietário', avatarUrl: 'https://picsum.photos/seed/101/200' },
  { id: '2', number: '102', block: 'A', residentName: 'Ana Clara', residentRole: 'Inquilino', avatarUrl: 'https://picsum.photos/seed/102/200' },
  { id: '3', number: '103', block: 'A', residentName: 'Vago', residentRole: 'Proprietário' },
];

export const MOCK_READINGS: Reading[] = [
  { id: 'r1', apartmentId: '1', type: 'water', previousValue: 10, currentValue: 12.5, date: '05/09/2023 14:30', status: ReadingStatus.LIDO },
  { id: 'r2', apartmentId: '1', type: 'gas', previousValue: 3.0, currentValue: 4.25, date: '05/09/2023 14:35', status: ReadingStatus.LIDO },
  { id: 'r3', apartmentId: '2', type: 'water', previousValue: 21.5, currentValue: 23.7, date: '06/09/2023 09:15', status: ReadingStatus.LIDO },
  { id: 'r4', apartmentId: '2', type: 'gas', previousValue: 19.3, currentValue: 20.1, date: '06/09/2023 09:20', status: ReadingStatus.LIDO },
  { id: 'r5', apartmentId: '1', type: 'water', previousValue: 12.5, currentValue: 14.2, date: '02/10/2023 11:00', status: ReadingStatus.LIDO },
  { id: 'r6', apartmentId: '2', type: 'water', previousValue: 23.7, currentValue: 25.1, date: '02/10/2023 11:30', status: ReadingStatus.LIDO },
  { id: 'r7', apartmentId: '1', type: 'gas', previousValue: 4.25, currentValue: 5.1, date: '03/10/2023 16:20', status: ReadingStatus.LIDO },
  { id: 'r8', apartmentId: '2', type: 'gas', previousValue: 20.1, currentValue: 21.8, date: '03/10/2023 16:45', status: ReadingStatus.LIDO },
  { id: 'r9', apartmentId: '1', type: 'water', previousValue: 14.2, currentValue: 16.8, date: '18/01/2026 10:00', status: ReadingStatus.LIDO },
];

export const storage = {
  getApartments: (): Apartment[] => {
    const data = localStorage.getItem('condoflow_apartments');
    if (!data) {
      localStorage.setItem('condoflow_apartments', JSON.stringify(DEFAULT_APARTMENTS));
      return DEFAULT_APARTMENTS;
    }
    return JSON.parse(data);
  },
  saveApartment: (apartment: Apartment) => {
    const apts = storage.getApartments();
    const index = apts.findIndex(a => a.id === apartment.id);
    if (index >= 0) {
      apts[index] = apartment;
    } else {
      apts.push(apartment);
    }
    localStorage.setItem('condoflow_apartments', JSON.stringify(apts));
  },
  deleteApartment: (id: string) => {
    const apts = storage.getApartments().filter(a => a.id !== id);
    localStorage.setItem('condoflow_apartments', JSON.stringify(apts));
  },
  saveReading: (aptId: string, type: 'water' | 'gas', value: string) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const key = `reading_${aptId}_${type}`;
    const previousValue = storage.getPreviousReadingValue(aptId, type);

    localStorage.setItem(key, JSON.stringify({
      value,
      previousValue,
      timestamp: now.toISOString(),
      displayDate: formattedDate,
      saved: true
    }));
  },
  getReading: (aptId: string, type: 'water' | 'gas') => {
    const key = `reading_${aptId}_${type}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  getPreviousReadingValue: (aptId: string, type: 'water' | 'gas'): number => {
    // Busca no mock primeiro (simulando banco de dados histórico)
    const historical = MOCK_READINGS.filter(r => r.apartmentId === aptId && r.type === type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (historical.length > 0) {
      return historical[0].currentValue || historical[0].previousValue;
    }
    return 0;
  },
  getAllSavedReadings: () => {
    const readings: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('reading_')) {
        readings[key] = JSON.parse(localStorage.getItem(key) || '{}');
      }
    }
    return readings;
  },
  getUserProfile: () => {
    const data = localStorage.getItem('condoflow_user');
    if (!data) {
      const defaultUser = {
        name: 'Ricardo Mendes',
        role: 'Síndico',
        condo: 'Condominio Solar',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
      };
      localStorage.setItem('condoflow_user', JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(data);
  },
  saveUserProfile: (user: any) => {
    localStorage.setItem('condoflow_user', JSON.stringify(user));
  }
};
