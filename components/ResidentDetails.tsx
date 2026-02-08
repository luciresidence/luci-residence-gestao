
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { storage } from '../data';
import { Apartment } from '../types';

const ResidentDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apartment, setApartment] = useState<Apartment | null>(null);

  useEffect(() => {
    if (id) {
      const fetchApt = async () => {
        const { data } = await supabase
          .from('apartments')
          .select('*')
          .eq('id', id)
          .single();

        if (data) {
          setApartment({
            ...data,
            residentName: data.resident_name,
            residentRole: data.resident_role,
            avatarUrl: data.avatar_url
          });
        }
      };
      fetchApt();
    }
  }, [id]);

  if (!apartment) return null;

  return (
    <div className="pb-32 pt-safe min-h-screen bg-slate-50 dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-surface-dark px-4 py-4 flex items-center justify-between border-b dark:border-gray-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 text-primary">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="font-bold text-slate-800 dark:text-white">Detalhes da Unidade</h2>
        <button
          onClick={() => navigate(`/units/${id}/edit`)}
          className="text-primary font-bold px-2 py-1 text-sm uppercase tracking-widest"
        >
          Editar
        </button>
      </header>

      {/* Profile Header */}
      <div className="flex flex-col items-center pt-8 pb-8 bg-white dark:bg-surface-dark mb-4 border-b dark:border-gray-800">
        <div className="relative mb-4">
          <div className="size-24 rounded-full shadow-lg p-0.5 bg-gradient-to-tr from-primary to-blue-400">
            <img
              src={apartment.avatarUrl || `https://picsum.photos/seed/${apartment.id}/200`}
              className="size-full rounded-full object-cover border-2 border-white dark:border-gray-800"
              alt={apartment.residentName}
            />
          </div>
          <div className="absolute bottom-1 right-1 size-5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{apartment.residentName}</h1>
        <p className="text-sm text-slate-400 font-medium uppercase tracking-widest">Apt {apartment.number} - Bloco {apartment.block}</p>
        <div className="mt-4 px-4 py-1.5 bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
          {/* Use residentRole instead of non-existent property type */}
          {apartment.residentRole}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-8 grid grid-cols-3 gap-3">
        {[
          { label: 'Ligar', icon: 'call', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'WhatsApp', icon: 'chat', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Histórico', icon: 'history', color: 'text-slate-600', bg: 'bg-slate-100', path: '/history' }
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => action.path && navigate(action.path)}
            className="flex flex-col items-center gap-3 p-5 bg-white dark:bg-surface-dark rounded-[24px] shadow-sm active:scale-95 transition-all"
          >
            <div className={`size-12 rounded-2xl ${action.bg} dark:bg-gray-800 flex items-center justify-center ${action.color}`}>
              <span className="material-symbols-outlined text-2xl">{action.icon}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Info List */}
      <div className="px-4 space-y-4 mb-8">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">INFORMAÇÕES</h3>
        <div className="bg-white dark:bg-surface-dark rounded-[28px] shadow-sm border dark:border-gray-800 overflow-hidden divide-y dark:divide-gray-800">
          <div className="p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Completo</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{apartment.residentName}</p>
          </div>
          <div className="p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Localização</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">Apto. {apartment.number}, Bloco {apartment.block}</p>
          </div>
          <div className="p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</p>
            {/* Use residentRole instead of non-existent property type */}
            <p className="font-bold text-slate-800 dark:text-slate-200">{apartment.residentRole}</p>
          </div>
        </div>
      </div>

      {/* Fixed Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-12 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-t dark:border-gray-800 max-w-md mx-auto z-40">
        <button
          onClick={() => navigate(`/readings/${id}`)}
          className="w-full bg-primary text-white h-16 rounded-3xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-2xl">add_circle</span>
          Registrar Nova Leitura
        </button>
      </div>
    </div>
  );
};

export default ResidentDetails;
