import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Registration {
    id: string;
    apartment_id: string;
    full_name: string;
    cpf: string;
    birth_date: string;
    phone: string;
    resident_type: string;
    garage_spot: string;
    is_financial_responsible: boolean;
    financial_responsible_name: string;
    additional_residents: any[];
    status: string;
    created_at: string;
    apartments: {
        number: string;
        block: string;
    };
}

const RegistrationManager: React.FC = () => {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReg, setSelectedReg] = useState<Registration | null>(null);

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('resident_registrations')
            .select('*, apartments(number, block)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching registrations:', error);
        } else {
            setRegistrations(data || []);
        }
        setIsLoading(false);
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        const { error } = await supabase
            .from('resident_registrations')
            .update({ status })
            .eq('id', id);

        if (!error) {
            fetchRegistrations();
            setSelectedReg(null);
        }
    };

    const handleApplyToUnit = async (reg: Registration) => {
        // Update the core apartments table with the primary resident name
        const { error } = await supabase
            .from('apartments')
            .update({
                resident_name: reg.full_name,
                resident_role: reg.resident_type
            })
            .eq('id', reg.apartment_id);

        if (!error) {
            handleUpdateStatus(reg.id, 'APROVADO');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark">
            {/* Header */}
            <div className="p-6 bg-white dark:bg-surface-dark border-b dark:border-gray-800 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Solicitações</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {registrations.filter(r => r.status === 'PENDENTE').length} Pendentes para revisão
                    </p>
                </div>
                <button
                    onClick={() => window.open('/cadastro', '_blank')}
                    className="size-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-gray-800 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                    title="Abrir Formulário de Cadastro"
                >
                    <span className="material-symbols-outlined">link</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : registrations.length === 0 ? (
                    <div className="text-center p-12">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inbox</span>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhuma solicitação encontrada</p>
                    </div>
                ) : (
                    registrations.map((reg) => (
                        <div
                            key={reg.id}
                            onClick={() => setSelectedReg(reg)}
                            className="bg-white dark:bg-surface-dark p-5 rounded-3xl border border-slate-100 dark:border-gray-800 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="bg-primary/5 text-primary text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter">
                                    Apto {reg.apartments.number} - Bloco {reg.apartments.block}
                                </div>
                                <div className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${reg.status === 'PENDENTE' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                                    }`}>
                                    {reg.status}
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">{reg.full_name}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="material-symbols-outlined text-slate-300 text-sm">phone_iphone</span>
                                <span className="text-[10px] font-bold text-slate-400">{reg.phone}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal / Sidebar for details */}
            {selectedReg && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm transition-all animate-in fade-in">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b dark:border-gray-800 flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-primary uppercase tracking-widest">Unidade {selectedReg.apartments.number}</div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">
                                    {selectedReg.full_name}
                                </h2>
                            </div>
                            <button onClick={() => setSelectedReg(null)} className="size-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CPF</label>
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedReg.cpf || 'Não informado'}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nascimento</label>
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        {selectedReg.birth_date ? new Date(selectedReg.birth_date).toLocaleDateString('pt-BR') : '-'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedReg.resident_type}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vaga</label>
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedReg.garage_spot}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsável Financeiro</label>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-gray-800">
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {selectedReg.is_financial_responsible ? 'O próprio morador' : selectedReg.financial_responsible_name}
                                    </div>
                                </div>
                            </div>

                            {selectedReg.additional_residents.length > 0 && (
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Outros Moradores ({selectedReg.additional_residents.length})</label>
                                    <div className="space-y-3">
                                        {selectedReg.additional_residents.map((res: any, i: number) => (
                                            <div key={i} className="p-4 rounded-2xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-surface-dark shadow-sm">
                                                <div className="text-sm font-bold text-slate-800 dark:text-white">{res.name}</div>
                                                <div className="flex gap-4 mt-1">
                                                    <span className="text-[10px] text-slate-400 font-medium">CPF: {res.cpf || '-'}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">DN: {res.birthDate ? new Date(res.birthDate).toLocaleDateString('pt-BR') : '-'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t dark:border-gray-800 flex gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                            <button
                                onClick={() => handleUpdateStatus(selectedReg.id, 'REJEITADO')}
                                className="flex-1 h-14 rounded-2xl border border-slate-200 dark:border-gray-700 text-[10px] font-black text-slate-400 uppercase tracking-widest active:scale-95 transition-all"
                            >
                                Rejeitar
                            </button>
                            <button
                                onClick={() => handleApplyToUnit(selectedReg)}
                                className="flex-[2] h-14 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                Aprovar e Atualizar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrationManager;
