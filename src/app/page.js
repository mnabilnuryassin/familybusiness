'use client';
import { useState } from 'react';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ amount: '', desc: '', type: 'expense' });

  return (
    <main className="min-h-screen bg-[#2D3E40] text-[#FAF7F2] p-6 pb-32 max-w-md mx-auto relative overflow-hidden">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-10 mt-4">
        <div>
          <h1 className="text-xl font-black italic">Yasiin Family <span className="text-[#4FB0AC]">OS</span></h1>
          <p className="text-[9px] opacity-40 font-black uppercase tracking-[0.3em]">Business Lab</p>
        </div>
        <div className="w-12 h-12 bg-[#E5B299] rounded-2xl flex items-center justify-center text-[#2D3E40] font-black shadow-lg">Y</div>
      </header>

      {/* Balance Card */}
      <div className="bg-[#D9835D] p-8 rounded-[40px] shadow-2xl relative overflow-hidden mb-8 text-[#2D3E40]">
        <p className="text-[10px] font-black opacity-60 uppercase mb-1 tracking-widest text-[#2D3E40]">Total Balance</p>
        <h2 className="text-4xl font-black italic">Rp 113.617</h2>
        <div className="flex gap-8 mt-8 border-t border-black/10 pt-6">
          <div className="flex flex-col">
            <span className="text-[9px] font-black opacity-40 uppercase">Income</span>
            <span className="font-bold">1.5M</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black opacity-40 uppercase">Expense</span>
            <span className="font-bold">1.4M</span>
          </div>
        </div>
      </div>

      <h3 className="font-black italic mb-6">Recent Feed</h3>
      <div className="bg-white/5 p-5 rounded-[30px] flex justify-between items-center border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#97B299]/20 rounded-2xl flex items-center justify-center text-xl">🧪</div>
            <div>
              <p className="font-bold text-sm">Beli Bahan SLES</p>
              <p className="text-[9px] opacity-40 font-black uppercase">Formulation</p>
            </div>
          </div>
          <p className="font-black text-[#D9835D]">-50k</p>
      </div>

      {/* Floating Navbar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-20 bg-white/90 backdrop-blur-xl rounded-[35px] flex justify-around items-center px-4 shadow-2xl z-40">
        <button className="text-[#4FB0AC] font-black text-[10px] uppercase">Main</button>
        <div className="w-16"></div>
        <button className="text-gray-400 font-black text-[10px] uppercase">Logs</button>
      </nav>

      {/* Tombol + Terpisah biar gampang diklik */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-12 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#4FB0AC] rounded-full flex items-center justify-center shadow-xl shadow-[#4FB0AC]/40 border-[6px] border-[#2D3E40] text-white text-3xl z-[50] active:scale-90 transition-all"
      >
        +
      </button>

      {/* Modal Input */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-[#FAF7F2] w-full max-w-md rounded-t-[45px] p-8 pb-12 text-[#2D3E40] shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-8"></div>
            <h2 className="text-2xl font-black italic mb-6">New Transaction</h2>
            
            <div className="space-y-6">
              <div className="flex bg-gray-200 p-1.5 rounded-2xl">
                <button 
                  onClick={() => setFormData({...formData, type: 'expense'})}
                  className={`flex-1 p-3 rounded-xl font-black text-xs transition-all ${formData.type === 'expense' ? 'bg-[#D9835D] text-white' : 'opacity-40'}`}
                >EXPENSE</button>
                <button 
                  onClick={() => setFormData({...formData, type: 'income'})}
                  className={`flex-1 p-3 rounded-xl font-black text-xs transition-all ${formData.type === 'income' ? 'bg-[#97B299] text-white' : 'opacity-40'}`}
                >INCOME</button>
              </div>

              <input 
                type="number" placeholder="Nominal Rp" 
                className="w-full bg-gray-100 p-5 rounded-2xl font-black text-2xl outline-none"
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
              <input 
                type="text" placeholder="Deskripsi" 
                className="w-full bg-gray-100 p-5 rounded-2xl font-bold outline-none"
                onChange={(e) => setFormData({...formData, desc: e.target.value})}
              />
              <button 
                className="w-full bg-[#2D3E40] text-[#FAF7F2] p-5 rounded-3xl font-black text-lg"
                onClick={() => setShowModal(false)}
              >SAVE LOG 🚀</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}