import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
                    <div className="bg-red-950/30 border border-red-500/50 p-8 rounded-3xl max-w-lg shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col items-center">
                        <AlertTriangle size={64} className="text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                        <h1 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase italic">Ocorreu um erro fatal</h1>
                        <p className="text-red-200/80 mb-8 max-w-sm">
                            Pedimos desculpas, mas o módulo principal falhou. Nossa equipe de engenharia foi notificada (mentira).
                        </p>

                        <div className="bg-black/50 p-4 rounded-xl w-full mb-8 text-left overflow-x-auto border border-white/5">
                            <code className="text-red-400 text-xs font-mono whitespace-pre-wrap">
                                {this.state.error?.message || 'Erro desconhecido'}
                            </code>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                        >
                            <RefreshCcw size={18} />
                            Reiniciar Sistema
                        </button>
                    </div>
                </div>
            );
        }

        return (this as any).props.children;
    }
}
