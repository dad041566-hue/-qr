import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Users, UserPlus, Phone, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function WaitingKiosk() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'intro' | 'phone' | 'party' | 'complete'>('intro');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);

  const handleKeypad = (num: string) => {
    if (phoneNumber.length < 13) {
      const newNum = phoneNumber + num;
      // Auto hyphen formatting for 010
      if (newNum.length === 3 && newNum === '010') {
        setPhoneNumber(newNum + '-');
      } else if (newNum.length === 8 && newNum.startsWith('010-')) {
        setPhoneNumber(newNum + '-');
      } else {
        setPhoneNumber(newNum);
      }
    }
  };

  const handleBackspace = () => {
    if (phoneNumber.endsWith('-')) {
      setPhoneNumber(phoneNumber.slice(0, -2));
    } else {
      setPhoneNumber(phoneNumber.slice(0, -1));
    }
  };

  const handleRegister = () => {
    setStep('complete');
    toast.success('웨이팅이 성공적으로 등록되었습니다.');
    setTimeout(() => {
      setStep('intro');
      setPhoneNumber('');
      setAdults(2);
      setKids(0);
    }, 5000);
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-900 flex items-center justify-center font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2000')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-zinc-900/40" />

      {/* Exit Button for Preview purpose */}
      <button onClick={() => navigate('/')} className="absolute top-6 left-6 z-50 text-white/50 hover:text-white flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
        <ChevronLeft className="w-5 h-5" /> 메인으로 돌아가기
      </button>

      <div className="w-full max-w-lg z-10 p-6">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center">
              <div className="bg-white/10 backdrop-blur-xl p-10 md:p-14 rounded-[3rem] border border-white/20 shadow-2xl">
                <div className="w-24 h-24 bg-orange-500 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-lg shadow-orange-500/30">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">TableFlow</h1>
                <p className="text-xl text-zinc-300 mb-12 font-medium">현재 대기 <span className="text-orange-400 font-bold">12팀</span> 있습니다.</p>
                <button 
                  onClick={() => setStep('phone')}
                  className="w-full bg-orange-500 text-white text-2xl font-black py-6 rounded-[2rem] hover:bg-orange-400 transition-colors shadow-xl shadow-orange-500/20"
                >
                  웨이팅 등록하기
                </button>
              </div>
            </motion.div>
          )}

          {step === 'phone' && (
            <motion.div key="phone" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full">
              <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setStep('intro')} className="p-3 bg-zinc-100 rounded-2xl hover:bg-zinc-200"><ChevronLeft className="w-6 h-6" /></button>
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900">연락처를 입력해주세요</h2>
                    <p className="text-zinc-500 text-sm mt-1 font-medium">입장 차례가 되면 카카오톡으로 알려드립니다.</p>
                  </div>
                </div>

                <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-200 mb-8">
                  <p className="text-center text-4xl font-black tracking-widest text-zinc-900 h-10 flex items-center justify-center">
                    {phoneNumber || <span className="text-zinc-300">010-0000-0000</span>}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button key={num} onClick={() => handleKeypad(num.toString())} className="bg-zinc-100 py-5 rounded-[1.5rem] text-3xl font-bold text-zinc-800 hover:bg-zinc-200 active:scale-95 transition-all">
                      {num}
                    </button>
                  ))}
                  <button onClick={() => setPhoneNumber('')} className="bg-zinc-100 py-5 rounded-[1.5rem] text-lg font-bold text-zinc-500 hover:bg-zinc-200 active:scale-95 transition-all">전체삭제</button>
                  <button onClick={() => handleKeypad('0')} className="bg-zinc-100 py-5 rounded-[1.5rem] text-3xl font-bold text-zinc-800 hover:bg-zinc-200 active:scale-95 transition-all">0</button>
                  <button onClick={handleBackspace} className="bg-zinc-100 py-5 rounded-[1.5rem] text-lg font-bold text-zinc-500 hover:bg-zinc-200 active:scale-95 transition-all flex items-center justify-center">
                    지우기
                  </button>
                </div>

                <button 
                  disabled={phoneNumber.length !== 13}
                  onClick={() => setStep('party')}
                  className={`w-full py-6 rounded-[2rem] text-xl font-black transition-all ${phoneNumber.length === 13 ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl' : 'bg-zinc-200 text-zinc-400'}`}
                >
                  다음으로
                </button>
              </div>
            </motion.div>
          )}

          {step === 'party' && (
            <motion.div key="party" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full">
              <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl">
                <div className="flex items-center gap-4 mb-10">
                  <button onClick={() => setStep('phone')} className="p-3 bg-zinc-100 rounded-2xl hover:bg-zinc-200"><ChevronLeft className="w-6 h-6" /></button>
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900">방문 인원을 선택해주세요</h2>
                  </div>
                </div>

                <div className="space-y-6 mb-10">
                  <div className="bg-zinc-50 p-6 rounded-[2rem] flex items-center justify-between border border-zinc-200">
                    <span className="text-xl font-bold text-zinc-900">성인</span>
                    <div className="flex items-center gap-6">
                      <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-2xl font-black border border-zinc-200">-</button>
                      <span className="text-3xl font-black w-8 text-center text-orange-600">{adults}</span>
                      <button onClick={() => setAdults(adults + 1)} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-2xl font-black border border-zinc-200">+</button>
                    </div>
                  </div>

                  <div className="bg-zinc-50 p-6 rounded-[2rem] flex items-center justify-between border border-zinc-200">
                    <span className="text-xl font-bold text-zinc-900">유아 <span className="text-sm text-zinc-500 font-medium ml-2">미취학 아동</span></span>
                    <div className="flex items-center gap-6">
                      <button onClick={() => setKids(Math.max(0, kids - 1))} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-2xl font-black border border-zinc-200">-</button>
                      <span className="text-3xl font-black w-8 text-center text-orange-600">{kids}</span>
                      <button onClick={() => setKids(kids + 1)} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-2xl font-black border border-zinc-200">+</button>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-[2rem] p-6 mb-8 border border-orange-100 flex items-center gap-4">
                  <Phone className="w-6 h-6 text-orange-500" />
                  <span className="text-lg font-bold text-orange-900 tracking-wider">{phoneNumber}</span>
                </div>

                <button 
                  onClick={handleRegister}
                  className="w-full bg-zinc-900 text-white py-6 rounded-[2rem] text-xl font-black hover:bg-zinc-800 transition-all shadow-xl"
                >
                  총 {adults + kids}명 대기 등록하기
                </button>
              </div>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="bg-white p-12 rounded-[3rem] shadow-2xl">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-black text-zinc-900 mb-2">등록이 완료되었습니다!</h2>
                <p className="text-lg text-zinc-500 font-medium mb-8">카카오톡 알림톡을 확인해주세요.</p>
                
                <div className="bg-zinc-50 rounded-[2rem] p-8 border border-zinc-200">
                  <p className="text-zinc-500 font-bold mb-2">대기 번호</p>
                  <p className="text-6xl font-black text-orange-500 mb-4">67</p>
                  <p className="text-lg font-bold text-zinc-800">내 앞 대기: 12팀</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}