
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../data';
import { Apartment } from '../types';

const ReadingForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apartment, setApartment] = useState<Apartment | null>(null);

  // States for Water
  const [waterValue, setWaterValue] = useState('');
  const [waterSaved, setWaterSaved] = useState(false);
  const [prevWater, setPrevWater] = useState(0);

  // States for Gas
  const [gasValue, setGasValue] = useState('');
  const [gasSaved, setGasSaved] = useState(false);
  const [prevGas, setPrevGas] = useState(0);

  useEffect(() => {
    if (id) {
      const apts = storage.getApartments();
      const found = apts.find(ap => ap.id === id);
      setApartment(found || null);

      // Busca leituras salvas (rascunho da sessão atual)
      const savedWater = storage.getReading(id, 'water');
      if (savedWater) {
        setWaterValue(savedWater.value);
        setWaterSaved(true);
      }

      const savedGas = storage.getReading(id, 'gas');
      if (savedGas) {
        setGasValue(savedGas.value);
        setGasSaved(true);
      }

      // Busca leituras anteriores (histórico do banco)
      setPrevWater(storage.getPreviousReadingValue(id, 'water'));
      setPrevGas(storage.getPreviousReadingValue(id, 'gas'));
    }
  }, [id]);

  if (!apartment) return <div className="p-10 text-center text-slate-500 font-bold">Unidade não encontrada.</div>;

  const handleSaveWater = () => {
    if (id && waterValue) {
      if (parseFloat(waterValue) < prevWater) {
        if (!confirm(`Atenção: A leitura atual (${waterValue}) é menor que a anterior (${prevWater}). Deseja salvar mesmo assim?`)) {
          return;
        }
      }
      storage.saveReading(id, 'water', waterValue);
      setWaterSaved(true);
    }
  };

  const handleSaveGas = () => {
    if (id && gasValue) {
      if (parseFloat(gasValue) < prevGas) {
        if (!confirm(`Atenção: A leitura atual (${gasValue}) é menor que a anterior (${prevGas}). Deseja salvar mesmo assim?`)) {
          return;
        }
      }
      storage.saveReading(id, 'gas', gasValue);
      setGasSaved(true);
    }
  };

  return (
    <div className="pb-32 pt-safe min-h-screen bg-slate-50 dark:bg-background-dark transition-colors duration-200">
      <header className="sticky top-0 z-30 flex items-center bg-white dark:bg-surface-dark p-4 border-b dark:border-gray-800 shadow-sm">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 text-primary transition-colors">
          <span className="material-symbols-outlined font-bold">arrow_back_ios</span>
        </button>
        <div className="flex-1 text-center">
          <h1 className="font-black text-primary uppercase tracking-tighter text-lg italic">Apto {apartment.number}</h1>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[2px] -mt-1">Bloco {apartment.block} • {apartment.residentName}</p>
        </div>
        <div className="size-10"></div>
      </header>

      <main className="p-5 space-y-6">
        
        {/* WATER SECTION */}
        <section className={`transition-all duration-500 ${waterSaved ? 'opacity-80 scale-[0.98]' : ''}`}>
          <div className="bg-white dark:bg-surface-dark rounded-[40px] p-7 shadow-sm border border-white dark:border-gray-800 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined text-2xl fill-1">water_drop</span>
                </div>
                <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-base">Medição de Água</h2>
              </div>
              {waterSaved && (
                <div className="size-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                  <span className="material-symbols-outlined text-sm font-black">check</span>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-end px-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leitura Atual (m³)</label>
                 <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Leitura Anterior</span>
                    <span className="text-xs font-black text-primary italic">{prevWater.toFixed(3)} m³</span>
                 </div>
              </div>
              
              <input 
                type="number" 
                step="0.001"
                disabled={waterSaved}
                value={waterValue}
                onChange={(e) => setWaterValue(e.target.value)}
                placeholder="0.000"
                className="w-full h-20 bg-slate-50 dark:bg-gray-800 border-none rounded-[24px] text-3xl font-black px-6 focus:ring-4 focus:ring-primary/5 dark:text-white disabled:opacity-50 placeholder:text-slate-200 transition-all text-center"
              />

              <button 
                onClick={handleSaveWater}
                disabled={waterSaved || !waterValue}
                className={`w-full h-16 rounded-[24px] font-black uppercase tracking-[3px] text-xs shadow-xl transition-all flex items-center justify-center gap-3 ${
                  waterSaved ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-primary/20 text-primary border border-primary/10'
                } disabled:opacity-30 active:scale-95`}
              >
                <span className="material-symbols-outlined">{waterSaved ? 'task_alt' : 'save_as'}</span>
                {waterSaved ? 'Salvo com Sucesso' : 'Salvar Água'}
              </button>
              
              {waterSaved && (
                <button onClick={() => setWaterSaved(false)} className="w-full text-[9px] font-black text-slate-300 uppercase tracking-[2px] text-center hover:text-primary transition-colors">
                  Alterar Medição
                </button>
              )}
            </div>
          </div>
        </section>

        {/* GAS SECTION */}
        <section className={`transition-all duration-500 ${gasSaved ? 'opacity-80 scale-[0.98]' : ''}`}>
          <div className="bg-white dark:bg-surface-dark rounded-[40px] p-7 shadow-sm border border-white dark:border-gray-800 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                  <span className="material-symbols-outlined text-2xl fill-1">local_fire_department</span>
                </div>
                <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-base">Medição de Gás</h2>
              </div>
              {gasSaved && (
                <div className="size-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                  <span className="material-symbols-outlined text-sm font-black">check</span>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-end px-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leitura Atual (m³)</label>
                 <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Leitura Anterior</span>
                    <span className="text-xs font-black text-orange-600 italic">{prevGas.toFixed(3)} m³</span>
                 </div>
              </div>

              <input 
                type="number" 
                step="0.001"
                disabled={gasSaved}
                value={gasValue}
                onChange={(e) => setGasValue(e.target.value)}
                placeholder="0.000"
                className="w-full h-20 bg-slate-50 dark:bg-gray-800 border-none rounded-[24px] text-3xl font-black px-6 focus:ring-4 focus:ring-orange-500/5 dark:text-white disabled:opacity-50 placeholder:text-slate-200 transition-all text-center"
              />

              <button 
                onClick={handleSaveGas}
                disabled={gasSaved || !gasValue}
                className={`w-full h-16 rounded-[24px] font-black uppercase tracking-[3px] text-xs shadow-xl transition-all flex items-center justify-center gap-3 ${
                  gasSaved ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-orange-600/20 text-orange-600 border border-orange-600/10'
                } disabled:opacity-30 active:scale-95`}
              >
                <span className="material-symbols-outlined">{gasSaved ? 'task_alt' : 'save_as'}</span>
                {gasSaved ? 'Salvo com Sucesso' : 'Salvar Gás'}
              </button>

              {gasSaved && (
                <button onClick={() => setGasSaved(false)} className="w-full text-[9px] font-black text-slate-300 uppercase tracking-[2px] text-center hover:text-orange-600 transition-colors">
                  Alterar Medição
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Completion area */}
        <div className="text-center py-4">
           <button 
             onClick={() => navigate('/readings')}
             className="w-full h-16 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[4px] text-xs shadow-2xl active:scale-95 transition-all"
           >
             Voltar para Lista
           </button>
        </div>

      </main>

      <footer className="text-center p-8 opacity-30">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[5px]">Validação de Consumo • Luci Berkembrock</p>
      </footer>
    </div>
  );
};

export default ReadingForm;
