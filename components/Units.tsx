
import React, { useState, useEffect } from 'react';
// Fix: Use storage service instead of non-existent APARTMENTS export
import { storage } from '../data';
import { Apartment } from '../types';
import { useNavigate } from 'react-router-dom';

const Units: React.FC = () => {
  const navigate = useNavigate();
  // Fix: Manage apartments in state fetched from storage
  const [apartments, setApartments] = useState<Apartment[]>([]);

  useEffect(() => {
    // Fix: Load current units from storage
    setApartments(storage.getApartments());
  }, []);

  return (
    <div className="pb-24 pt-safe">
      <header className="px-5 py-4 bg-surface-light dark:bg-surface-dark border-b dark:border-gray-800">
        <h1 className="text-xl font-bold">Unidades</h1>
        <p className="text-xs text-gray-500">Gestão de apartamentos e moradores</p>
      </header>

      <div className="p-4 grid grid-cols-2 gap-4">
        {apartments.map(ap => (
          <div 
            key={ap.id}
            onClick={() => navigate(`/residents/${ap.id}`)}
            className="bg-white dark:bg-surface-dark p-4 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col items-center text-center cursor-pointer active:scale-95 transition-all"
          >
            <div className="size-16 rounded-full overflow-hidden mb-3 border-4 border-gray-50 dark:border-gray-800 shadow-inner">
              <img src={ap.avatarUrl || `https://ui-avatars.com/api/?name=${ap.number}&background=random`} alt="" className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-sm">Apto {ap.number}</h3>
            {/* Note: Apartment type is not in the schema, using residentRole as fallback if applicable or removing it */}
            <p className="text-[10px] text-gray-400 mb-3">{ap.block} • {ap.residentRole}</p>
            <div className="w-full h-8 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-[10px] font-bold text-gray-500 truncate px-2">{ap.residentName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Units;
