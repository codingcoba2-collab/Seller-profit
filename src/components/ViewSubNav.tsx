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
    <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#161823] rounded-2xl border border-white/10 mb-6">
      <button
        type="button"
        id="btn-subnav-input"
        onClick={() => onChangeSubTab('input')}
        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-extrabold text-xs transition cursor-pointer ${
          currentSubTab === 'input'
            ? 'bg-[#25F4EE] text-black shadow-md shadow-[#25F4EE]/20'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <PlusCircle className={`w-4 h-4 ${currentSubTab === 'input' ? 'text-black' : 'text-zinc-400'}`} />
        <span>{inputTitle}</span>
      </button>

      <button
        type="button"
        id="btn-subnav-output"
        onClick={() => onChangeSubTab('output')}
        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-extrabold text-xs transition cursor-pointer ${
          currentSubTab === 'output'
            ? 'bg-[#FE2C55] text-white shadow-md shadow-[#FE2C55]/20'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <BarChart3 className={`w-4 h-4 ${currentSubTab === 'output' ? 'text-white' : 'text-zinc-400'}`} />
        <span>{outputTitle}</span>
      </button>
    </div>
  );
};
