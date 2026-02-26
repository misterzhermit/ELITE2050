import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, ChevronRight, Zap, Globe, Cpu, Mail, AlertCircle } from 'lucide-react';
import { TeamLogo } from './TeamLogo';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Verificar se o Supabase está configurado corretamente
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
      setError('CONFIGURAÇÃO AUSENTE: O arquivo .env não foi configurado com as credenciais do Supabase. Renomeie o arquivo .env.example para .env e preencha as chaves do seu projeto Supabase.');
      setIsLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      onLogin();
    } catch (err: any) {
      console.error('Login error:', err);

      // Detectar erro de conexão (DNS/Network)
      if (err.message?.includes('Failed to fetch') || err.name === 'TypeError' || err.message?.includes('network')) {
        setError('ERRO DE CONEXÃO: Não foi possível alcançar o servidor. Verifique sua internet ou as configurações do banco de dados.');
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('ACESSO NEGADO: Credenciais inválidas. Certifique-se de que o e-mail e senha estão corretos.');
      } else {
        setError(err.message || 'Erro ao processar solicitação');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-blue-500/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-[450px] relative z-10"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.4)] border border-white/20 mb-6"
          >
            <TeamLogo primaryColor="#fff" secondaryColor="#ccc" patternId="none" symbolId="Shield" size={40} className="drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          </motion.div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic flex flex-col items-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-cyan-400">Elite</span>
            <span className="text-2xl mt-[-8px] tracking-[0.3em] text-cyan-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">2050</span>
          </h1>
          <div className="mt-4 flex gap-4">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
              <Globe size={10} className="text-cyan-400" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Global Network</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
              <Cpu size={10} className="text-fuchsia-400" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Quantum Engine</span>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
          {/* Internal Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/5 blur-[80px] group-hover:bg-cyan-500/10 transition-all duration-700" />

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                    <p className="text-[10px] text-red-200/80 leading-relaxed font-black uppercase tracking-wider">
                      {error}
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                  Manager Identity
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-cyan-400 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all font-mono"
                    placeholder="email@elite2050.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Access Protocol</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-fuchsia-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-500/50 focus:bg-white/[0.05] transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group/btn overflow-hidden relative"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="uppercase tracking-[0.2em] text-sm">
                      Inicializar Sistema
                    </span>
                    <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
                {/* Button Shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              </button>
            </form>
          </motion.div>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4 relative z-10">
            <div className="flex gap-6">
              <button className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-cyan-400 transition-colors">Recuperar ID</button>
              <div className="w-[1px] h-3 bg-white/10" />
              <button className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-cyan-400 transition-colors">Suporte</button>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={10} className="text-amber-500 animate-pulse" />
              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Version 2.0.50-stable</span>
            </div>
          </div>
        </div>

        {/* Legal/System Text */}
        <p className="mt-8 text-center text-[8px] text-slate-600 font-bold uppercase tracking-[0.3em] leading-relaxed">
          Propriedade da Federação de Futebol de Elite. <br />
          Acesso não autorizado será rastreado pelo protocolo Quantum-Guard.
        </p>
      </motion.div>

    </div>
  );
};
