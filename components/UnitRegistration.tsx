
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { storage } from '../data';
import { Apartment } from '../types';

const UnitRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<Apartment>>({
    number: '',
    block: '',
    residentName: '',
    residentRole: 'Proprietário'
  });

  useEffect(() => {
    if (isEdit) {
      const fetchApt = async () => {
        const { data } = await supabase
          .from('apartments')
          .select('*')
          .eq('id', id)
          .single();

        if (data) {
          setFormData({
            ...data,
            residentName: data.resident_name,
            residentRole: data.resident_role,
            avatarUrl: data.avatar_url
          });
        }
      };
      fetchApt();
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role: 'Proprietário' | 'Inquilino') => {
    setFormData(prev => ({ ...prev, residentRole: role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.number || !formData.block || !formData.residentName) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const payload = {
      number: formData.number!,
      block: formData.block!,
      resident_name: formData.residentName!,
      resident_role: formData.residentRole as 'Proprietário' | 'Inquilino',
      avatar_url: formData.avatarUrl || `https://picsum.photos/seed/${formData.number}/200`
    };

    if (isEdit) {
      const { error } = await supabase
        .from('apartments')
        .update(payload)
        .eq('id', id);
      if (error) alert('Erro ao atualizar: ' + error.message);
    } else {
      const { error } = await supabase
        .from('apartments')
        .insert([payload]);
      if (error) alert('Erro ao cadastrar: ' + error.message);
    }

    navigate('/units');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark pb-40 pt-safe">
      <header className="px-4 py-4 flex items-center bg-white dark:bg-surface-dark border-b dark:border-gray-800 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-500">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center font-bold text-slate-800 dark:text-white mr-8">
          {isEdit ? 'Editar Unidade' : 'Novo Cadastro'}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-10">
        {/* Unit Data */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined fill-1">domain</span>
            <h2 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Informações da Unidade</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Número</label>
              <input
                type="text"
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="Ex: 101"
                className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold text-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bloco</label>
              <input
                type="text"
                name="block"
                value={formData.block}
                onChange={handleChange}
                placeholder="Ex: A"
                className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold text-lg"
              />
            </div>
          </div>
        </section>

        {/* Resident Data */}
        <section className="space-y-5">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined fill-1">person</span>
            <h2 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Dados do Morador</h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
            <input
              type="text"
              name="residentName"
              value={formData.residentName}
              onChange={handleChange}
              placeholder="Nome do responsável"
              className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-white focus:ring-primary focus:border-primary transition-all font-bold"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vínculo com o Imóvel</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect('Proprietário')}
                className={`h-14 rounded-2xl font-bold transition-all border-2 flex items-center justify-center gap-2 ${formData.residentRole === 'Proprietário'
                    ? 'bg-primary/5 border-primary text-primary shadow-sm shadow-primary/10'
                    : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-gray-800 text-slate-400'
                  }`}
              >
                <span className="material-symbols-outlined">key</span>
                Proprietário
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('Inquilino')}
                className={`h-14 rounded-2xl font-bold transition-all border-2 flex items-center justify-center gap-2 ${formData.residentRole === 'Inquilino'
                    ? 'bg-primary/5 border-primary text-primary shadow-sm shadow-primary/10'
                    : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-gray-800 text-slate-400'
                  }`}
              >
                <span className="material-symbols-outlined">description</span>
                Inquilino
              </button>
            </div>
          </div>
        </section>

        {isEdit && (
          <div className="pt-4">
            <button
              type="button"
              onClick={async () => {
                if (confirm('Tem certeza que deseja remover esta unidade permanentemente?')) {
                  const { error } = await supabase
                    .from('apartments')
                    .delete()
                    .eq('id', id);

                  if (!error) navigate('/units');
                  else alert('Erro ao remover: ' + error.message);
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
          className="w-full h-16 bg-primary text-white rounded-[24px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-primary/40 active:scale-[0.96] transition-all"
        >
          <span className="material-symbols-outlined">check_circle</span>
          {isEdit ? 'Atualizar Dados' : 'Concluir Cadastro'}
        </button>
      </div>
    </div>
  );
};

export default UnitRegistration;
