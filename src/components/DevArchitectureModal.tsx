import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Database,
  FolderTree,
  FileCode2,
  Copy,
  Check,
  X,
  Layers,
  Sparkles,
  Terminal,
  Cpu
} from 'lucide-react';
import { SQLITE_SCHEMA_SQL, EXPO_FOLDER_STRUCTURE_DOC } from '../db/sqliteSchema';
import { EXPO_DATABASE_CODE } from '../db/databaseExpoExample';
import { EXPO_EXPENSE_SERVICE_CODE } from '../services/expenseServiceExpoExample';
import { useTheme } from '../context/ThemeContext';

interface DevArchitectureModalProps {
  onClose: () => void;
}

export const DevArchitectureModal: React.FC<DevArchitectureModalProps> = ({ onClose }) => {
  const { isDark } = useTheme();
  const [tab, setTab] = useState<'sql' | 'tree' | 'db_file' | 'service_file'>('sql');
  const [copiado, setCopiado] = useState(false);

  const obtenerContenidoActual = () => {
    switch (tab) {
      case 'sql':
        return SQLITE_SCHEMA_SQL.trim();
      case 'tree':
        return EXPO_FOLDER_STRUCTURE_DOC.trim();
      case 'db_file':
        return EXPO_DATABASE_CODE.trim();
      case 'service_file':
        return EXPO_EXPENSE_SERVICE_CODE.trim();
    }
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(obtenerContenidoActual());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-3xl rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isDark ? 'border-neutral-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Centro de Arquitectura & Código Nativo Expo
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                TypeScript • Expo SQLite (SDK 51/52) • Background Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
              isDark
                ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                : 'bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`flex items-center gap-1.5 overflow-x-auto py-2.5 border-b no-scrollbar text-xs ${
            isDark ? 'border-neutral-800/80' : 'border-slate-200'
          }`}
        >
          <button
            onClick={() => setTab('sql')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              tab === 'sql'
                ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                : isDark
                ? 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Database size={13} />
            <span>1. Esquema SQLite (schema.sql)</span>
          </button>

          <button
            onClick={() => setTab('tree')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              tab === 'tree'
                ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                : isDark
                ? 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <FolderTree size={13} />
            <span>2. Estructura Modular Expo</span>
          </button>

          <button
            onClick={() => setTab('db_file')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              tab === 'db_file'
                ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                : isDark
                ? 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <FileCode2 size={13} />
            <span>3. src/db/database.ts</span>
          </button>

          <button
            onClick={() => setTab('service_file')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              tab === 'service_file'
                ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                : isDark
                ? 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Terminal size={13} />
            <span>3b. src/services/expenseService.ts</span>
          </button>
        </div>

        {/* Toolbar & Copy Button */}
        <div
          className={`flex items-center justify-between py-2 px-1 text-xs ${
            isDark ? 'text-neutral-400' : 'text-slate-500'
          }`}
        >
          <span className="font-mono text-[11px]">
            {tab === 'sql' && 'PostgreSQL / SQLite 3 DDL con Índices Compuestos & Triggers'}
            {tab === 'tree' && 'Estructura modular compatible con Expo Router v3'}
            {tab === 'db_file' && 'Conexión singleton expo-sqlite y modo WAL'}
            {tab === 'service_file' && 'Validación estricta, UUID v4 y cola transaccional'}
          </span>
          <button
            onClick={handleCopiar}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
              isDark
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            {copiado ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copiado ? '¡Copiado!' : 'Copiar Código'}</span>
          </button>
        </div>

        {/* Code Viewer Container */}
        <div className="flex-1 overflow-y-auto rounded-2xl bg-neutral-950 border border-neutral-800 p-4 font-mono text-xs text-neutral-300 leading-relaxed shadow-inner">
          <pre className="whitespace-pre overflow-x-auto text-[11px] sm:text-xs text-emerald-300/90 selection:bg-emerald-500/30 selection:text-white">
            {obtenerContenidoActual()}
          </pre>
        </div>
      </motion.div>
    </div>
  );
};
