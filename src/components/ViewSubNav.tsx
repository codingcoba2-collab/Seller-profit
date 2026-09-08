import React from 'react';
import { PlusCircle, BarChart3 } from 'lucide-react';

export type SubTabType = 'input' | 'output';

interface ViewSubNavProps {
  currentSubTab: SubTabType;
  onChangeSubTab: (tab: SubTabType) => void;
  inputTitle?: string;
  outputTitle?: string;
}

export const ViewSubNav: React.FC<ViewSubNavProps> = ({
  currentSubTab,
  onChangeSubTab,
  inputTitle = 'Formulir Input Data',
  outputTitle = 'Laporan & Riwayat',
}) => {
  return (
    <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#12141c] rounded-2xl border border-white/10 mb-5">
      <button
        type="button"
        id="btn-subnav-input"
        onClick={() => onChangeSubTab('input')}
        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer min-h-[40px] ${
          currentSubTab === 'input'
            ? 'bg-[#25F4EE] text-zinc-950 font-black shadow-sm'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <PlusCircle className={`w-3.5 h-3.5 shrink-0 ${currentSubTab === 'input' ? 'text-zinc-950' : 'text-zinc-400'}`} />
        <span className="truncate">{inputTitle}</span>
      </button>

      <button
        type="button"
        id="btn-subnav-output"
        onClick={() => onChangeSubTab('output')}
        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer min-h-[40px] ${
          currentSubTab === 'output'
            ? 'bg-[#FE2C55] text-white font-black shadow-sm'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <BarChart3 className={`w-3.5 h-3.5 shrink-0 ${currentSubTab === 'output' ? 'text-white' : 'text-zinc-400'}`} />
        <span className="truncate">{outputTitle}</span>
      </button>
    </div>
  );
};
