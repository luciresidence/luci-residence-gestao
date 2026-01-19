
import React from 'react';

interface ImagePreviewProps {
  url: string;
  onClose: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ url, onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button className="absolute top-10 right-5 text-white bg-white/10 rounded-full p-2">
        <span className="material-symbols-outlined text-3xl">close</span>
      </button>
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <img src={url} alt="Visualização" className="w-full h-auto animate-in zoom-in-95 duration-200" />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white font-bold">Comprovante de Leitura</p>
          <p className="text-white/60 text-xs">Capturado em 15 de Outubro de 2023</p>
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
