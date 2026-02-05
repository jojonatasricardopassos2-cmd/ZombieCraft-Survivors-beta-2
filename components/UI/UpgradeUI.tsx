
import React, { useState, useEffect } from 'react';
import { ItemStack } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { ItemIcon } from './Inventory';

interface UpgradeUIProps {
  onClose: () => void;
  playerInv: (ItemStack | null)[];
  onPlayerSlotClick: (index: number) => void;
  selectedSlot: number;
  lang: 'EN' | 'PT';
  onUpgrade: (item1: ItemStack, item2: ItemStack) => ItemStack | null;
  onReturnItem: (item: ItemStack) => void; // Callback to return items
}

export const UpgradeUI: React.FC<UpgradeUIProps> = ({ 
    onClose, playerInv, onPlayerSlotClick, selectedSlot, lang, onUpgrade, onReturnItem
}) => {
  const [slot1, setSlot1] = useState<ItemStack | null>(null);
  const [slot2, setSlot2] = useState<ItemStack | null>(null);
  const [output, setOutput] = useState<ItemStack | null>(null);
  const t = TRANSLATIONS[lang];

  // Return items if UI is closed
  useEffect(() => {
      return () => {
          if (slot1) onReturnItem(slot1);
          if (slot2) onReturnItem(slot2);
          // if (output) onReturnItem(output); // Optional: Do we give output if closed? Probably not if not clicked.
      }
  }, []); 

  const handleClose = () => {
      if (slot1) { onReturnItem(slot1); setSlot1(null); }
      if (slot2) { onReturnItem(slot2); setSlot2(null); }
      onClose();
  };

  const handlePlayerClick = (index: number) => {
      const item = playerInv[index];
      if (!item) return;

      if (!slot1) {
          setSlot1({ ...item, count: 1 });
          onPlayerSlotClick(index); // Consume 1 from inv
      } else if (!slot2) {
          setSlot2({ ...item, count: 1 });
          onPlayerSlotClick(index); // Consume 1 from inv
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border-4 border-slate-600 rounded-lg p-6 w-96 shadow-2xl flex flex-col gap-4 text-white font-mono select-none relative">
        <button onClick={handleClose} className="absolute top-2 right-2 text-red-400 font-bold hover:text-red-300">X</button>
        <h2 className="text-xl font-bold text-center border-b border-slate-600 pb-2">{t.UPGRADE_BENCH}</h2>
        
        <div className="text-xs text-gray-400 text-center">{t.LOYALTY_DESC}</div>

        <div className="flex items-center justify-center gap-4 bg-slate-900 p-4 rounded-lg">
            <div className={`w-12 h-12 border-2 ${slot1 ? 'border-white' : 'border-gray-600'} flex items-center justify-center cursor-pointer`} onClick={() => { if(slot1) { onReturnItem(slot1); setSlot1(null); } }}>
                <ItemIcon item={slot1} />
            </div>
            <span className="text-2xl">+</span>
            <div className={`w-12 h-12 border-2 ${slot2 ? 'border-white' : 'border-gray-600'} flex items-center justify-center cursor-pointer`} onClick={() => { if(slot2) { onReturnItem(slot2); setSlot2(null); } }}>
                <ItemIcon item={slot2} />
            </div>
            <span className="text-2xl">=</span>
            <div 
                className={`w-12 h-12 border-2 ${output ? 'border-green-400 cursor-pointer' : 'border-gray-600'} flex items-center justify-center`}
                onClick={() => {
                    if (output) {
                        onReturnItem(output);
                        setOutput(null);
                    }
                }}
            >
                <ItemIcon item={output} />
            </div>
        </div>

        <button 
            className={`p-2 rounded font-bold ${slot1 && slot2 && !output ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 text-gray-500'}`}
            onClick={() => {
                if (slot1 && slot2) {
                    const res = onUpgrade(slot1, slot2);
                    if (res) {
                        setOutput(res);
                        setSlot1(null);
                        setSlot2(null);
                    }
                }
            }}
            disabled={!slot1 || !slot2 || !!output}
        >
            {t.UPGRADE}
        </button>
        
        {output && (
            <div className="text-center text-green-400 text-sm">Upgrade Complete! Click item to collect.</div>
        )}

        {/* Player Inventory for Selection */}
        <div className="mt-2">
            <div className="text-xs text-gray-400 mb-1">{t.INVENTORY}</div>
            <div className="grid grid-cols-9 gap-1 max-h-32 overflow-y-auto">
                {playerInv.map((item, i) => (
                    <div 
                        key={i} 
                        className={`w-8 h-8 bg-gray-900 border ${selectedSlot === i ? 'border-yellow-500' : 'border-gray-700'} cursor-pointer hover:border-white`}
                        onClick={() => handlePlayerClick(i)}
                    >
                         <ItemIcon item={item} />
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
