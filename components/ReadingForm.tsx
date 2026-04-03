
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Apartment } from '../types';

const ReadingForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  // Use passed date or default to current date
  const referenceDate = dateParam ? new Date(dateParam) : new Date();

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [allApartments, setAllApartments] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // States for Water
  const [waterValue, setWaterValue] = useState('');
  const [waterSaved, setWaterSaved] = useState(false);
  const [prevWater, setPrevWater] = useState(0);
  const [waterId, setWaterId] = useState<string | null>(null);

  // States for Gas
  const [gasValue, setGasValue] = useState('');
  const [gasSaved, setGasSaved] = useState(false);
  const [prevGas, setPrevGas] = useState(0);
  const [gasId, setGasId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      // Reset states immediately when ID changes
      setApartment(null);
      setWaterValue('');
      setWaterSaved(false);
      setPrevWater(0);
      setWaterId(null);
      setGasValue('');
      setGasSaved(false);
      setPrevGas(0);
      setGasId(null);

      const fetchData = async () => {
        // Fetch Apartment Data
        const { data: aptData } = await supabase
          .from('apartments')
          .select('*')
          .eq('id', id)
          .single();

        if (aptData) {
          setApartment({
            ...aptData,
            residentName: aptData.resident_name,
            residentRole: aptData.resident_role,
            avatarUrl: aptData.avatar_url
          });
        }

        // Fetch ALL apartments for navigation
        const { data: allApts } = await supabase.from('apartments').select('id, number, block, resident_name').order('number');
        if (allApts) {
          // Reuse sorting logic from ApartmentList to ensure consistency
          const sortedApts = allApts.sort((a, b) => {
            const numA = parseInt(a.number);
            const numB = parseInt(b.number);
            const isNumericA = !isNaN(numA);
            const isNumericB = !isNaN(numB);

            if (!isNumericA && isNumericB) return -1;
            if (isNumericA && !isNumericB) return 1;
            if (!isNumericA && !isNumericB) return a.number.localeCompare(b.number);
            if (a.block !== b.block) return a.block.localeCompare(b.block);
            return numA - numB;
          });

          setAllApartments(sortedApts);
          const idx = sortedApts.findIndex(a => a.id === id);
          setCurrentIndex(idx);
        }

        // Fetch current month readings (drafts/saved)
        // Use the reference date to determine the month
        const startOfMonth = new Date(referenceDate);
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // End of month is useful if we want to limit duplicates strictly to that month context, 
        // but existing logic uses gte startOfMonth which implies "that month or later". 
        // For historical data, we should probably check within the specific month. 
        // But to keep consistency with "latest reading for that month", let's start with startOfMonth.
        // Actually, better: filter strict month range if date is provided.
        // For now, let's keep the logic consistent: get readings for the specific month.

        // However, if we are in "Feb", we want readings for "Feb".
        // The original logic was gte startOfMonth (reading current month). 
        // If we go back to Jan, we want readings for Jan.

        const nextMonth = new Date(startOfMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const { data: reads } = await supabase
          .from('readings')
          .select('*')
          .eq('apartment_id', id)
          .gte('date', startOfMonth.toISOString())
          .lt('date', nextMonth.toISOString());

        if (reads) {
          const water = reads.find(r => r.type === 'water');
          if (water) {
            if (water.current_value) {
              setWaterValue(String(water.current_value));
              setWaterSaved(true);
            }
            setWaterId(water.id);
          }

          const gas = reads.find(r => r.type === 'gas');
          if (gas) {
            if (gas.current_value) {
              setGasValue(String(gas.current_value));
              setGasSaved(true);
            }
            setGasId(gas.id);
          }
        }

        // Fetch previous reading for validation
        const { data: prevReads } = await supabase
          .from('readings')
          .select('*')
          .eq('apartment_id', id)
          .lt('date', startOfMonth.toISOString())
          .order('date', { ascending: false });

        if (prevReads) {
          const prevWaterRead = prevReads.find(r => r.type === 'water');
          if (prevWaterRead) setPrevWater(Number(prevWaterRead.current_value || 0));
          const prevGasRead = prevReads.find(r => r.type === 'gas');
          if (prevGasRead) setPrevGas(Number(prevGasRead.current_value || 0));
        }
      };
      fetchData();
    }
  }, [id]);

  if (!apartment) return <div className="p-10 text-center text-slate-500 font-bold">Unidade não encontrada.</div>;

  const handleSaveWater = async () => {
    if (id && waterValue !== '') {
      const currentVal = parseFloat(waterValue);
      if (currentVal < prevWater) {
        if (!confirm(`Atenção: A leitura atual (${waterValue}) é menor que a anterior (${prevWater}). Deseja salvar mesmo assim?`)) {
          return;
        }
      }

      const payload = {
        apartment_id: id,
        type: 'water',
        previous_value: prevWater,
        current_value: currentVal,
        date: referenceDate.toISOString(),
        status: 'LIDO'
      };

      let error;
      if (waterId) {
        const { error: err } = await supabase.from('readings').update(payload).eq('id', waterId);
        error = err;
      } else {
        const { data, error: err } = await supabase.from('readings').insert([payload]).select().single();
        if (data) setWaterId(data.id);
        error = err;
      }

      if (error) alert('Erro ao salvar: ' + error.message);
      else setWaterSaved(true);
    }
  };

  const handleDeleteWater = async () => {
    if (waterId && confirm('Tem certeza que deseja excluir a leitura de ÁGUA atual?')) {
      const { error } = await supabase.from('readings').delete().eq('id', waterId);
      if (error) {
        alert('Erro ao excluir: ' + error.message);
      } else {
        setWaterValue('');
        setWaterId(null);
        setWaterSaved(false);
      }
    }
  };

  const handleSaveGas = async () => {
    if (id && gasValue !== '') {
      const currentVal = parseFloat(gasValue);
      if (currentVal < prevGas) {
        if (!confirm(`Atenção: A leitura atual (${gasValue}) é menor que a anterior (${prevGas}). Deseja salvar mesmo assim?`)) {
          return;
        }
      }

      const payload = {
        apartment_id: id,
        type: 'gas',
        previous_value: prevGas,
        current_value: currentVal,
        date: referenceDate.toISOString(),
        status: 'LIDO'
      };

      let error;
      if (gasId) {
        const { error: err } = await supabase.from('readings').update(payload).eq('id', gasId);
        error = err;
      } else {
        const { data, error: err } = await supabase.from('readings').insert([payload]).select().single();
        if (data) setGasId(data.id);
        error = err;
      }

      if (error) alert('Erro ao salvar: ' + error.message);
      else setGasSaved(true);
    }
  };

  const handleDeleteGas = async () => {
    if (gasId && confirm('Tem certeza que deseja excluir a leitura de GÁS atual?')) {
      const { error } = await supabase.from('readings').delete().eq('id', gasId);
      if (error) {
        alert('Erro ao excluir: ' + error.message);
      } else {
        setGasValue('');
        setGasId(null);
        setGasSaved(false);
      }
    }
  };

  return (
    <div className="pb-32 pt-safe flex-1 flex flex-col bg-slate-50 dark:bg-background-dark transition-colors duration-200">
      <header className="sticky top-0 z-30 flex items-center bg-white dark:bg-surface-dark p-4 border-b dark:border-gray-800 shadow-sm">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 text-primary transition-colors">
          <span className="material-symbols-outlined font-bold">arrow_back_ios</span>
        </button>
        <div className="flex-1 text-center min-w-0 px-2">
          {/* Quick Navigation Header */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  const prevId = allApartments[currentIndex - 1].id;
                  navigate(`/readings/${prevId}?date=${referenceDate.toISOString()}`, { replace: true });
                }
              }}
              disabled={currentIndex <= 0}
              className="size-8 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-primary disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
            </button>

            <div className="relative max-w-[200px]">
              <select
                value={id}
                onChange={(e) => {
                  navigate(`/readings/${e.target.value}?date=${referenceDate.toISOString()}`, { replace: true });
                }}
                className="appearance-none bg-transparent font-black text-primary uppercase tracking-tighter text-lg italic text-center w-full focus:outline-none cursor-pointer truncate pr-4"
              >
                {allApartments.map(apt => (
                  <option key={apt.id} value={apt.id}>
                    Apto {apt.number} {apt.block ? `- Bl ${apt.block}` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-primary">
                <span className="material-symbols-outlined text-[10px]">expand_more</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (currentIndex < allApartments.length - 1) {
                  const nextId = allApartments[currentIndex + 1].id;
                  navigate(`/readings/${nextId}?date=${referenceDate.toISOString()}`, { replace: true });
                }
              }}
              disabled={currentIndex === -1 || currentIndex >= allApartments.length - 1}
              className="size-8 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-primary disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </button>
          </div>

          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[2px] truncate">{apartment.residentName}</p>

          <div className="mt-2 bg-slate-100 dark:bg-gray-800 rounded-lg px-3 py-1 inline-block">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">
              Referência: {referenceDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
          </div>
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
              {waterId && (
                <button
                  onClick={handleDeleteWater}
                  className="size-8 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors ml-auto mr-2"
                  title="Excluir leitura"
                >
                  <span className="material-symbols-outlined text-sm font-bold">delete</span>
                </button>
              )}
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leitura Atual (m³)</label>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Leitura Anterior</span>
                  <span className="text-xs font-black text-primary italic">{prevWater.toFixed(2)} m³</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Leitura Atual</label>
                  <input
                    type="number"
                    step="0.01"
                    value={waterValue}
                    onChange={(e) => {
                      setWaterValue(e.target.value);
                      if (waterSaved) setWaterSaved(false);
                    }}
                    placeholder="0.00"
                    className="w-full h-20 bg-slate-50 dark:bg-gray-800 border-none rounded-[24px] text-3xl font-black px-4 focus:ring-4 focus:ring-primary/5 dark:text-white disabled:opacity-50 placeholder:text-slate-200 transition-all text-center"
                  />
                </div>
                <div className="w-1/3 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Consumo</label>
                  <div className="w-full h-20 bg-blue-50 dark:bg-blue-900/10 rounded-[24px] flex items-center justify-center border-2 border-blue-100 dark:border-blue-900/20">
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                      {waterValue ? (parseFloat(waterValue) - prevWater).toFixed(2) : '--'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveWater}
                disabled={waterValue === '' || (waterSaved && !waterValue)}
                className={`w-full h-16 rounded-[24px] font-black uppercase tracking-[3px] text-xs shadow-xl transition-all flex items-center justify-center gap-3 ${waterSaved ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-primary/20 text-primary border border-primary/10'
                  } disabled:opacity-30 active:scale-95`}
              >
                <span className="material-symbols-outlined">{waterSaved ? 'task_alt' : 'save_as'}</span>
                {waterSaved ? 'Salvo com Sucesso' : 'Salvar Água'}
              </button>


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
              {gasId && (
                <button
                  onClick={handleDeleteGas}
                  className="size-8 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors ml-auto mr-2"
                  title="Excluir leitura"
                >
                  <span className="material-symbols-outlined text-sm font-bold">delete</span>
                </button>
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

              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Leitura Atual</label>
                  <input
                    type="number"
                    step="0.001"
                    value={gasValue}
                    onChange={(e) => {
                      setGasValue(e.target.value);
                      if (gasSaved) setGasSaved(false);
                    }}
                    placeholder="0.000"
                    className="w-full h-20 bg-slate-50 dark:bg-gray-800 border-none rounded-[24px] text-3xl font-black px-4 focus:ring-4 focus:ring-orange-500/5 dark:text-white disabled:opacity-50 placeholder:text-slate-200 transition-all text-center"
                  />
                </div>
                <div className="w-1/3 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Consumo</label>
                  <div className="w-full h-20 bg-orange-50 dark:bg-orange-900/10 rounded-[24px] flex items-center justify-center border-2 border-orange-100 dark:border-orange-900/20">
                    <span className="text-xl font-black text-orange-600 dark:text-orange-400">
                      {gasValue ? (parseFloat(gasValue) - prevGas).toFixed(3) : '--'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveGas}
                disabled={gasValue === '' || (gasSaved && !gasValue)}
                className={`w-full h-16 rounded-[24px] font-black uppercase tracking-[3px] text-xs shadow-xl transition-all flex items-center justify-center gap-3 ${gasSaved ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-orange-600/20 text-orange-600 border border-orange-600/10'
                  } disabled:opacity-30 active:scale-95`}
              >
                <span className="material-symbols-outlined">{gasSaved ? 'task_alt' : 'save_as'}</span>
                {gasSaved ? 'Salvo com Sucesso' : 'Salvar Gás'}
              </button>


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
