
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { storage } from '../data';
import { Apartment } from '../types';

const LogoSmall = () => (
  <div className="flex items-center gap-2">
    <svg width="40" height="30" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="85" cy="70" rx="35" ry="50" fill="#a66384" fillOpacity="0.7" transform="rotate(-15 85 70)" />
      <ellipse cx="115" cy="70" rx="35" ry="50" fill="#802e53" fillOpacity="0.8" transform="rotate(15 115 70)" />
    </svg>
    <div className="flex flex-col">
      <h1 className="text-[10px] font-black text-primary uppercase tracking-tighter leading-none">Luci Berkembrock</h1>
      <p className="text-[6px] font-bold text-primary/60 uppercase tracking-[2px] mt-0.5">Residence</p>
    </div>
  </div>
);

const UnitList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [units, setUnits] = useState<Apartment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchUnits = async () => {
    setIsLoading(true);
    setError(null);
    console.log("UnitList: Iniciando busca de unidades...");
    
    try {
      // Tentativa 1: Buscar do Supabase. A chave anon-key do projeto é fixa.
      const supabaseKey = (supabase as any).role === 'anon' ? (supabase as any).supabaseKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaXhvd29mc3NiaW11ZGJyZWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzcyNjksImV4cCI6MjA4NDM1MzI2OX0.28TcTxfnLUFr-CJ-4C7sTVSyrd_jDVkaf46qEIl4Sbo';
      const url = `https://blixowofssbimudbrejm.supabase.co/rest/v1/apartments?select=*&apikey=${supabaseKey}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Servidor respondeu com status ${response.status}`);
      }

      const data = await response.json();
      console.log(`UnitList: ${data.length} unidades carregadas.`);
      
      const mappedUnits = data.map((apt: any) => ({
        ...apt,
        residentName: apt.resident_name || '',
        residentRole: apt.resident_role || 'Residente',
        avatarUrl: apt.avatar_url
      }));

      const sortedUnits = mappedUnits.sort((a: any, b: any) => {
        const numA = parseInt(a.number);
        const numB = parseInt(b.number);
        if (isNaN(numA) && !isNaN(numB)) return -1;
        if (!isNaN(numA) && isNaN(numB)) return 1;
        if (isNaN(numA) && isNaN(numB)) return (a.number || '').localeCompare(b.number || '');
        if (a.block !== b.block) return (a.block || '').localeCompare(b.block || '');
        return numA - numB;
      });

      setUnits(sortedUnits);
    } catch (err: any) {
      console.error("UnitList: Erro na conexão:", err);
      setError(`Erro de conexão (Fetch): ${err.message || 'Verifique sua internet ou firewall'}`);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const filtered = units.filter(ap => {
    const name = ap.residentName || '';
    const num = ap.number || '';
    return num.includes(searchTerm) || name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="pb-32 pt-safe flex-1 flex flex-col bg-slate-50 dark:bg-background-dark">
      <header className="px-5 py-6 bg-white dark:bg-surface-dark border-b dark:border-gray-800 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <LogoSmall />
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[2px]">Gestão de Unidades</p>
        </div>
      </header>

      <div className="p-5 space-y-6">
        {/* Search */}
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">search</span>
          <input
            type="text"
            placeholder="Apto ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white dark:bg-surface-dark border-none rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold"
          />
        </div>

        {/* Cadastro Unidade Button below search */}
        <button
          onClick={() => navigate('/units/new')}
          className="w-full h-16 bg-primary text-white rounded-[24px] font-black uppercase tracking-[3px] text-xs flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-2xl">add_circle</span>
          Cadastro Unidade
        </button>

        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidades Ativas ({filtered.length})</h3>
        </div>

        {/* List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-24 text-center">
              <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Carregando unidades...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center space-y-6 px-6">
              <div className="size-20 bg-rose-50 dark:bg-rose-900/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <span className="material-symbols-outlined text-4xl">cloud_off</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">Erro ao Sincronizar</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">{error}</p>
              </div>
              <button 
                onClick={() => {
                  setIsRetrying(true);
                  fetchUnits();
                }}
                disabled={isRetrying}
                className="w-full h-12 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isRetrying ? (
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">refresh</span>
                    Tentar Novamente
                  </>
                )}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <div className="size-20 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-slate-200 mb-4">
                <span className="material-symbols-outlined text-4xl">domain</span>
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                {searchTerm ? 'Nenhuma unidade encontrada' : 'Nenhuma unidade ativa'}
              </p>
            </div>
          ) : (
            filtered.map((ap) => (
              <div
                key={ap.id}
                onClick={() => navigate(`/residents/${ap.id}`)}
                className="bg-white dark:bg-surface-dark p-5 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-gray-800 active:scale-[0.98] transition-all relative group overflow-hidden"
              >
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-2xl bg-slate-50 dark:bg-gray-800 flex flex-col items-center justify-center border border-slate-100 dark:border-gray-700 shadow-inner flex-shrink-0">
                    <span className={`text-lg font-black leading-none tracking-tighter ${ap.block === 'B' ? 'text-[#166534]' : 'text-primary'}`}>{ap.number}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Bl {ap.block}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-800 dark:text-white truncate text-lg uppercase tracking-tighter leading-tight">
                      {ap.residentName || 'Unidade Vazia'}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${ap.residentRole === 'Proprietário'
                        ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                        }`}>
                        {ap.residentRole || 'Sem Vínculo'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-slate-300">contacts</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Informações OK</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/units/${ap.id}/edit`);
                      }}
                      className="size-10 rounded-xl bg-slate-50 dark:bg-gray-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center border border-slate-100 dark:border-gray-700"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-xl">verified</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UnitList;
