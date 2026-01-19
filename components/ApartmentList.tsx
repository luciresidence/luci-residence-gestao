import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { storage, MOCK_READINGS } from '../data';
import { ReadingStatus } from '../types';
import { reportService } from '../services/reportService';

const ApartmentList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'parcial' | 'concluido'>('todos');
  const [savedReadings, setSavedReadings] = useState<any[]>([]);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState<'mensal' | 'individual'>('mensal');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [individualFilter, setIndividualFilter] = useState({
    aptId: '',
    startDate: '',
    endDate: ''
  });
  const navigate = useNavigate();
  const [apartments, setApartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: apts } = await supabase.from('apartments').select('*').order('number');
    const { data: reads } = await supabase.from('readings').select('*');
    if (apts) setApartments(apts);
    if (reads) setSavedReadings(reads);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAptStatus = (id: string) => {
    const hasWater = savedReadings.some(r => r.apartment_id === id && r.type === 'water');
    const hasGas = savedReadings.some(r => r.apartment_id === id && r.type === 'gas');
    const isFullyDone = hasWater && hasGas;
    const isPartial = (hasWater || hasGas) && !isFullyDone;
    const isPending = !hasWater && !hasGas;

    return { hasWater, hasGas, isFullyDone, isPartial, isPending };
  };

  const filteredApartments = apartments.filter(ap => {
    const matchesSearch = ap.number.includes(searchTerm) || ap.residentName.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getAptStatus(ap.id);

    if (filterStatus === 'pendente') return matchesSearch && status.isPending;
    if (filterStatus === 'parcial') return matchesSearch && status.isPartial;
    if (filterStatus === 'concluido') return matchesSearch && status.isFullyDone;
    return matchesSearch;
  });

  const handleDownloadReport = (type: string) => {
    setIsExporting(true);

    // Collect all data (mock + local)
    const allReadings = [...MOCK_READINGS];
    apartments.forEach(ap => {
      const water = storage.getReading(ap.id, 'water');
      const gas = storage.getReading(ap.id, 'gas');
      if (water) allReadings.push({ id: `temp_w_${ap.id}`, apartmentId: ap.id, type: 'water', previousValue: water.previousValue || 0, currentValue: parseFloat(water.value), date: water.displayDate, status: ReadingStatus.LIDO });
      if (gas) allReadings.push({ id: `temp_g_${ap.id}`, apartmentId: ap.id, type: 'gas', previousValue: gas.previousValue || 0, currentValue: parseFloat(gas.value), date: gas.displayDate, status: ReadingStatus.LIDO });
    });

    // Filter based on selected type/month
    let filteredReadings = allReadings;

    setTimeout(() => {
      try {
        if (type === 'Relatório Mensal PDF' || type === 'Planilha Excel' || type === 'Consumo Água' || type === 'Consumo Gás') {
          // Filter by selected month
          const currentYear = new Date().getFullYear();
          filteredReadings = allReadings.filter(r => {
            const d = new Date(r.date.split(' ')[0].split('/').reverse().join('-'));
            return d.getMonth() === selectedMonth && d.getFullYear() === currentYear;
          });

          if (filteredReadings.length === 0) {
            alert("Nenhum registro encontrado para o mês selecionado.");
            setIsExporting(false);
            return;
          }

          if (type === 'Relatório Mensal PDF') {
            reportService.generateMonthlyPDF(filteredReadings, apartments, "Relatório Geral");
          } else if (type === 'Planilha Excel') {
            reportService.generateMonthlyExcel(filteredReadings, apartments);
          } else if (type === 'Consumo Água') {
            const waterData = filteredReadings.filter(r => r.type === 'water');
            reportService.generateMonthlyPDF(waterData, apartments, "Relatório de Água");
          } else if (type === 'Consumo Gás') {
            const gasData = filteredReadings.filter(r => r.type === 'gas');
            reportService.generateMonthlyPDF(gasData, apartments, "Relatório de Gás");
          }
        } else if (type === 'Individual') {
          if (!individualFilter.aptId) {
            alert("Por favor, selecione uma unidade.");
            setIsExporting(false);
            return;
          }
          const apt = apartments.find(a => a.id === individualFilter.aptId);
          let readings = allReadings.filter(r => r.apartmentId === individualFilter.aptId);

          if (individualFilter.startDate && individualFilter.endDate) {
            const start = new Date(individualFilter.startDate).getTime();
            const end = new Date(individualFilter.endDate).getTime();
            readings = readings.filter(r => {
              const d = new Date(r.date.split(' ')[0].split('/').reverse().join('-')).getTime();
              return d >= start && d <= end;
            });
          }

          reportService.generateIndividualPDF(apt, readings, individualFilter.startDate, individualFilter.endDate);
        }
        setIsExporting(false);
      } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        alert("Erro ao gerar relatório. Verifique os dados.");
        setIsExporting(false);
      }
    }, 800);
  };

  const filterChips = [
    { id: 'todos', label: 'Todos', icon: 'list' },
    { id: 'pendente', label: 'Pendentes', icon: 'pending_actions' },
    { id: 'parcial', label: 'Parciais', icon: 'incomplete_circle' },
    { id: 'concluido', label: 'Concluídos', icon: 'task_alt' },
  ];

  return (
    <div className="scroll-container bg-slate-50 dark:bg-background-dark">
      <div className="pt-safe pb-32">
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md px-5 pb-4 pt-6 border-b dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tighter text-primary italic">MEDIÇÕES</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Leituras Luci Berkembrock</p>
            </div>
            <button
              onClick={() => setIsReportsOpen(true)}
              className="size-11 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 flex items-center justify-center active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined text-2xl">analytics</span>
            </button>
          </div>

          <div className="mt-5 relative">
            <input
              type="text"
              placeholder="Buscar apto ou morador..."
              className="w-full bg-slate-100 dark:bg-gray-800 border-none rounded-2xl h-11 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary shadow-inner font-semibold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-xl">search</span>
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
            {filterChips.map(chip => (
              <button
                key={chip.id}
                onClick={() => setFilterStatus(chip.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 ${filterStatus === chip.id
                  ? 'bg-primary border-primary text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 text-slate-500'
                  }`}
              >
                <span className="material-symbols-outlined text-sm font-bold">{chip.icon}</span>
                {chip.label}
              </button>
            ))}
          </div>
        </header>

        <div className="p-4 space-y-3">
          {filteredApartments.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <span className="material-symbols-outlined text-5xl text-slate-200">domain_disabled</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nenhuma unidade encontrada</p>
            </div>
          ) : (
            filteredApartments.map(ap => {
              const { hasWater, hasGas, isFullyDone } = getAptStatus(ap.id);
              return (
                <div
                  key={ap.id}
                  onClick={() => navigate(`/readings/${ap.id}`)}
                  className="flex items-center gap-3 bg-white dark:bg-surface-dark p-4 rounded-[2rem] border border-white dark:border-gray-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm relative overflow-hidden"
                >
                  <div className="size-12 rounded-xl bg-slate-50 dark:bg-gray-800 flex items-center justify-center relative border border-slate-100 dark:border-gray-700 flex-shrink-0">
                    <span className="font-bold text-primary text-xs tracking-tighter">{ap.number}</span>
                    {isFullyDone && (
                      <div className="absolute -top-1 -right-1 size-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-surface-dark shadow-sm">
                        <span className="material-symbols-outlined text-[8px] text-white font-bold">check</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tighter text-base">Apto {ap.number}</p>
                      <div className="flex gap-2">
                        <span className={`material-symbols-outlined text-[16px] ${hasWater ? 'text-blue-500 fill-1' : 'text-slate-100 dark:text-gray-800'}`}>water_drop</span>
                        <span className={`material-symbols-outlined text-[16px] ${hasGas ? 'text-orange-500 fill-1' : 'text-slate-100 dark:text-gray-800'}`}>local_fire_department</span>
                      </div>
                    </div>
                    <p className="text-[8px] text-slate-400 truncate font-semibold uppercase tracking-widest">{ap.residentName}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isReportsOpen && (
        <div className="fixed inset-0 z-[60] bg-primary/20 backdrop-blur-md flex items-end justify-center px-2 pb-2">
          <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-[3rem] p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border border-primary/10 mb-[env(safe-area-inset-bottom)]">
            <header className="flex justify-between items-center px-2">
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tighter text-primary italic leading-none">Relatórios</h3>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Selecione o formato</p>
              </div>
              <button
                onClick={() => setIsReportsOpen(false)}
                className="size-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="flex bg-slate-100 dark:bg-gray-800 p-1 rounded-2xl">
              <button
                onClick={() => setReportType('mensal')}
                className={`flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${reportType === 'mensal' ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-slate-400'}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setReportType('individual')}
                className={`flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${reportType === 'individual' ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-slate-400'}`}
              >
                Individual
              </button>
            </div>

            {reportType === 'mensal' ? (
              <div className="space-y-4">
                <div className="space-y-1.5 px-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Selecionar Mês</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full h-11 bg-slate-50 dark:bg-gray-800/50 rounded-xl px-4 border-none text-xs font-semibold text-slate-700 dark:text-white focus:ring-2 focus:ring-primary"
                  >
                    {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Relatório Mensal PDF', icon: 'picture_as_pdf' },
                    { label: 'Planilha Excel', icon: 'table_view' },
                    { label: 'Consumo Água', icon: 'water_drop' },
                    { label: 'Consumo Gás', icon: 'local_fire_department' }
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      disabled={isExporting}
                      onClick={() => handleDownloadReport(opt.label)}
                      className="w-full p-3.5 flex items-center gap-4 bg-slate-50 dark:bg-gray-800/50 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <div className="size-9 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                      </div>
                      <p className="font-bold text-[11px] text-slate-700 dark:text-slate-200 uppercase tracking-tight flex-1 text-left">{opt.label}</p>
                      {isExporting ? (
                        <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-300 text-base">download</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Unidade</label>
                  <select
                    value={individualFilter.aptId}
                    onChange={(e) => setIndividualFilter({ ...individualFilter, aptId: e.target.value })}
                    className="w-full h-12 bg-slate-50 dark:bg-gray-800/50 rounded-xl px-4 border-none text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione o apto...</option>
                    {apartments.map(ap => (
                      <option key={ap.id} value={ap.id}>Apto {ap.number} - {ap.residentName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Data Início</label>
                    <input
                      type="date"
                      value={individualFilter.startDate}
                      onChange={(e) => setIndividualFilter({ ...individualFilter, startDate: e.target.value })}
                      className="w-full h-12 bg-slate-50 dark:bg-gray-800/50 rounded-xl px-4 border-none text-xs font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Data Fim</label>
                    <input
                      type="date"
                      value={individualFilter.endDate}
                      onChange={(e) => setIndividualFilter({ ...individualFilter, endDate: e.target.value })}
                      className="w-full h-12 bg-slate-50 dark:bg-gray-800/50 rounded-xl px-4 border-none text-xs font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadReport('Individual')}
                  disabled={isExporting}
                  className="w-full h-16 bg-primary text-white rounded-[20px] font-black uppercase tracking-[3px] text-[11px] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 mt-2"
                >
                  {isExporting ? (
                    <div className="size-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined">picture_as_pdf</span>
                      Gerar Relatório Individual
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={() => setIsReportsOpen(false)}
              className="w-full h-14 bg-primary text-white rounded-[1.5rem] font-bold uppercase tracking-[3px] text-[10px] shadow-xl active:scale-95"
            >
              Concluído
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApartmentList;
