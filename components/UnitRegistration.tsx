
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Apartment } from '../types';

interface AdditionalResident {
  name: string;
  birthDate: string;
  cpf: string;
}

const UnitRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Unit Data
  const [number, setNumber] = useState('');
  const [block, setBlock] = useState('');

  // Resident Data
  const [residentName, setResidentName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [residentType, setResidentType] = useState('Proprietário');
  const [garageSpot, setGarageSpot] = useState('');

  // Owner Data (if tenant)
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');

  // Financial Responsible
  const [isFinancialResponsible, setIsFinancialResponsible] = useState(true);
  const [financialResponsibleName, setFinancialResponsibleName] = useState('');
  const [financialResponsibleCpf, setFinancialResponsibleCpf] = useState('');

  // Additional Residents
  const [additionalResidents, setAdditionalResidents] = useState<AdditionalResident[]>([]);

  useEffect(() => {
    if (isEdit) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [id, isEdit]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const supabaseKey = (supabase as any).supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaXhvd29mc3NiaW11ZGJyZWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzcyNjksImV4cCI6MjA4NDM1MzI2OX0.28TcTxfnLUFr-CJ-4C7sTVSyrd_jDVkaf46qEIl4Sbo';
      const headers = { 'Authorization': `Bearer ${supabaseKey}`, 'apikey': supabaseKey };
      
      // 1. Fetch Apartment Data
      const aptRes = await fetch(`https://blixowofssbimudbrejm.supabase.co/rest/v1/apartments?id=eq.${id}&select=*`, { headers });
      const aptList = await aptRes.json();
      const apt = aptList[0];

      if (apt) {
        setNumber(apt.number);
        setBlock(apt.block);
        setResidentName(apt.resident_name || '');
        setResidentType(apt.resident_role || 'Proprietário');

        // 2. Fetch Latest Approved Registration
        const regRes = await fetch(`https://blixowofssbimudbrejm.supabase.co/rest/v1/resident_registrations?apartment_id=eq.${id}&status=eq.APROVADO&order=created_at.desc&limit=1&select=*`, { headers });
        const regList = await regRes.json();
        const reg = regList[0];

        if (reg) {
          setResidentName(reg.full_name);
          setCpf(reg.cpf ? formatCPF(reg.cpf) : '');
          setBirthDate(reg.birth_date || '');
          setPhone(reg.phone ? formatPhone(reg.phone) : '');
          setResidentType(reg.resident_type);
          setGarageSpot(reg.garage_spot || '');
          setIsFinancialResponsible(reg.is_financial_responsible);
          setFinancialResponsibleName(reg.financial_responsible_name || '');
          setFinancialResponsibleCpf(reg.financial_responsible_cpf ? formatCPF(reg.financial_responsible_cpf) : '');
          setOwnerName(reg.owner_name || '');
          setOwnerPhone(reg.owner_phone ? formatPhone(reg.owner_phone) : '');
          setAdditionalResidents(reg.additional_residents || []);
        }
      }
    } catch (e) {
      console.error("UnitRegistration: Erro ao carregar dados", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Helpers
  const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 11);
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    return v.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };

  const addResident = () => {
    setAdditionalResidents([...additionalResidents, { name: '', birthDate: '', cpf: '' }]);
  };

  const removeResident = (index: number) => {
    setAdditionalResidents(additionalResidents.filter((_, i) => i !== index));
  };

  const updateResident = (index: number, field: keyof AdditionalResident, value: string) => {
    const updated = [...additionalResidents];
    if (field === 'cpf') value = formatCPF(value);
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalResidents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    const supabaseKey = (supabase as any).supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaXhvd29mc3NiaW11ZGJyZWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzcyNjksImV4cCI6MjA4NDM1MzI2OX0.28TcTxfnLUFr-CJ-4C7sTVSyrd_jDVkaf46qEIl4Sbo';
    const headers = { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'apikey': supabaseKey };

    try {
      // 1. Update/Insert Apartment
      const aptPayload = { number, block, resident_name: residentName, resident_role: residentType };
      let aptId = id;

      if (isEdit) {
        await fetch(`https://blixowofssbimudbrejm.supabase.co/rest/v1/apartments?id=eq.${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(aptPayload)
        });
      } else {
        const res = await fetch(`https://blixowofssbimudbrejm.supabase.co/rest/v1/apartments`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(aptPayload)
        });
        const savedApt = await res.json();
        aptId = savedApt[0].id;
      }

      // 2. Manage Approved Registration
      const regPayload = {
        apartment_id: aptId,
        full_name: residentName,
        cpf: cpf.replace(/\D/g, ''),
        birth_date: birthDate,
        phone: phone.replace(/\D/g, ''),
        resident_type: residentType,
        garage_spot: garageSpot,
        is_financial_responsible: isFinancialResponsible,
        financial_responsible_name: isFinancialResponsible ? null : financialResponsibleName,
        financial_responsible_cpf: isFinancialResponsible ? null : financialResponsibleCpf.replace(/\D/g, ''),
        owner_name: residentType === 'Inquilino' ? ownerName : null,
        owner_phone: residentType === 'Inquilino' ? ownerPhone.replace(/\D/g, '') : null,
        additional_residents: additionalResidents,
        status: 'APROVADO'
      };

      const existingRegRes = await fetch(`https://blixowofssbimudbrejm.supabase.co/rest/v1/resident_registrations?apartment_id=eq.${aptId}&status=eq.APROVADO&select=id`, { headers });
      const existingRegList = await existingRegRes.json();
      const existingReg = existingRegList[0];

      if (existingReg) {
        await fetch(`https://blixowofssbimudbrejm.supabase.co/rest/v1/resident_registrations?id=eq.${existingReg.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(regPayload)
        });
      } else {
        await fetch(`https://blixowofssbimudbrejm.supabase.co/rest/v1/resident_registrations`, {
          method: 'POST',
          headers,
          body: JSON.stringify(regPayload)
        });
      }

      alert('Dados atualizados com sucesso!');
      navigate(-1);
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-slate-50 dark:bg-background-dark">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark pb-40 pt-safe">
      <header className="px-4 py-4 flex items-center bg-white dark:bg-surface-dark border-b dark:border-gray-800 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-500">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center font-bold text-slate-800 dark:text-white mr-8 uppercase tracking-widest text-sm">
          {isEdit ? 'Editar Unidade' : 'Novo Cadastro'}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-10">
        {/* Unit Data */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2">
            <span className="material-symbols-outlined fill-1">domain</span>
            <h2 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Informações da Unidade</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Número</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Ex: 101"
                className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold text-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bloco</label>
              <input
                type="text"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                placeholder="Ex: A"
                className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold text-lg"
              />
            </div>
          </div>
        </section>

        {/* Resident Data */}
        <section className="space-y-5">
          <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2">
            <span className="material-symbols-outlined fill-1">person</span>
            <h2 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Dados do Morador</h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
            <input
              type="text"
              value={residentName}
              onChange={(e) => setResidentName(e.target.value)}
              className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                maxLength={14}
                className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nascimento</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                maxLength={15}
                className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vaga</label>
              <input
                type="text"
                value={garageSpot}
                onChange={(e) => setGarageSpot(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vínculo com o Imóvel</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResidentType('Proprietário')}
                className={`h-14 rounded-2xl font-bold transition-all border-2 flex items-center justify-center gap-2 ${residentType === 'Proprietário'
                  ? 'bg-primary/5 border-primary text-primary shadow-sm shadow-primary/10'
                  : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-gray-800 text-slate-400'
                  }`}
              >
                <span className="material-symbols-outlined">key</span>
                Proprietário
              </button>
              <button
                type="button"
                onClick={() => setResidentType('Inquilino')}
                className={`h-14 rounded-2xl font-bold transition-all border-2 flex items-center justify-center gap-2 ${residentType === 'Inquilino'
                  ? 'bg-primary/5 border-primary text-primary shadow-sm shadow-primary/10'
                  : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-gray-800 text-slate-400'
                  }`}
              >
                <span className="material-symbols-outlined">description</span>
                Inquilino
              </button>
            </div>
          </div>

          {/* Owner Data if Tenant */}
          {residentType === 'Inquilino' && (
            <div className="p-5 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/20 space-y-4 animate-in slide-in-from-top-2">
              <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Informações do Proprietário</h4>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Proprietário</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone do Proprietário</label>
                <input
                  type="text"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(formatPhone(e.target.value))}
                  maxLength={15}
                  className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold"
                />
              </div>
            </div>
          )}
        </section>

        {/* Financial Responsible */}
        <section className="space-y-5">
          <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2">
            <span className="material-symbols-outlined fill-1">payments</span>
            <h2 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Responsável Financeiro</h2>
          </div>

          <div onClick={() => setIsFinancialResponsible(!isFinancialResponsible)} className="flex items-center gap-3 cursor-pointer p-2">
            <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${isFinancialResponsible ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}>
              {isFinancialResponsible && <span className="material-symbols-outlined text-sm font-bold">check</span>}
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-widest">Sou responsável pelo boleto</span>
          </div>

          {!isFinancialResponsible && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Responsável</label>
                <input
                  type="text"
                  value={financialResponsibleName}
                  onChange={(e) => setFinancialResponsibleName(e.target.value)}
                  className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CPF do Responsável</label>
                <input
                  type="text"
                  value={financialResponsibleCpf}
                  onChange={(e) => setFinancialResponsibleCpf(formatCPF(e.target.value))}
                  maxLength={14}
                  className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold"
                />
              </div>
            </div>
          )}
        </section>

        {/* Additional Residents */}
        <section className="space-y-5">
          <div className="flex items-center justify-between text-primary border-b border-primary/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined fill-1">group</span>
              <h2 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Moradores Adicionais</h2>
            </div>
            <button type="button" onClick={addResident} className="text-[10px] font-black bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-primary hover:text-white transition-colors">
              + Adicionar
            </button>
          </div>

          <div className="space-y-4">
            {additionalResidents.map((res, idx) => (
              <div key={idx} className="p-4 rounded-3xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-gray-800 space-y-3 relative">
                <button
                  type="button"
                  onClick={() => removeResident(idx)}
                  className="absolute top-2 right-2 size-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                  <input
                    type="text"
                    value={res.name}
                    onChange={(e) => updateResident(idx, 'name', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nascimento</label>
                    <input
                      type="date"
                      value={res.birthDate}
                      onChange={(e) => updateResident(idx, 'birthDate', e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                    <input
                      type="text"
                      value={res.cpf}
                      onChange={(e) => updateResident(idx, 'cpf', e.target.value)}
                      maxLength={14}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            {additionalResidents.length === 0 && (
              <div className="text-center py-4 text-slate-400 text-xs font-medium">Nenhum morador adicional</div>
            )}
          </div>
        </section>

        {isEdit && (
          <div className="pt-4">
            <button
              type="button"
              onClick={async () => {
                if (confirm('Tem certeza que deseja remover esta unidade permanentemente?')) {
                  try {
                    const supabaseKey = (supabase as any).supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaXhvd29mc3NiaW11ZGJyZWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzcyNjksImV4cCI6MjA4NDM1MzI2OX0.28TcTxfnLUFr-CJ-4C7sTVSyrd_jDVkaf46qEIl4Sbo';
                    const res = await fetch(`https://blixowofssbimudbrejm.supabase.co/rest/v1/apartments?id=eq.${id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${supabaseKey}`, 'apikey': supabaseKey }
                    });

                    if (res.ok) navigate('/units');
                    else alert('Erro ao remover a unidade.');
                  } catch (e) {
                    alert('Erro de conexão ao remover.');
                  }
                }
              }}
              className="w-full py-3 text-red-500 font-bold text-xs uppercase tracking-[3px] opacity-60 hover:opacity-100 transition-opacity"
            >
              Remover Unidade
            </button>
          </div>
        )}
      </form>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pb-12 bg-white/90 dark:bg-background-dark/90 backdrop-blur-xl border-t dark:border-gray-800 max-w-md mx-auto z-30">
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full h-16 bg-primary text-white rounded-[24px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-primary/40 active:scale-[0.96] transition-all disabled:opacity-70"
        >
          {isSaving ? (
            <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              {isEdit ? 'Salvar Tudo' : 'Concluir Cadastro'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UnitRegistration;
