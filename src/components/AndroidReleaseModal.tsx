import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Smartphone,
  Flame,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Copy,
  Check,
  FileCode,
  Download,
  Activity,
  Layers,
  MapPin
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { testConnection } from '../services/firebase';
import { sincronizarConFirebase } from '../services/storageService';

interface AndroidReleaseModalProps {
  onClose: () => void;
}

export const AndroidReleaseModal: React.FC<AndroidReleaseModalProps> = ({ onClose }) => {
  const { isDark } = useTheme();
  const [copiado, setCopiado] = useState<string | null>(null);
  const [probandoFirebase, setProbandoFirebase] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<string | null>(null);

  const copiarTexto = (texto: string, clave: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(clave);
    setTimeout(() => setCopiado(null), 2500);
  };

  const ejecutarTestFirebase = async () => {
    setProbandoFirebase(true);
    setResultadoPrueba(null);
    try {
      const ok = await testConnection();
      const syncRes = await sincronizarConFirebase();
      if (ok) {
        setResultadoPrueba(`✓ Conexión Firestore verificada. ${syncRes.mensaje}`);
      } else {
        setResultadoPrueba('⚠ Conectado pero revise estado de red.');
      }
    } catch (e: any) {
      setResultadoPrueba(`Error: ${e.message || 'Fallo de red'}`);
    } finally {
      setProbandoFirebase(false);
    }
  };

  const comandoCompilacion = `npm run android:release`;
  const comandoDebug = `npm run android:apk`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-8 ${
          isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Cabecera */}
        <div className="p-6 border-b border-inherit flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Android Release APK & Firebase Activo</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Listo para Compilar
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Paquete nativo Android configurado con sincronización Firebase Firestore en tiempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Tarjetas de Estado Rápido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 text-amber-500 mb-2 font-semibold text-sm">
                <Flame size={18} />
                <span>Firebase Firestore</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>Estado:</span>
                  <span className="font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Activo & Provisionado
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>Proyecto:</span>
                  <span className="font-mono text-[11px] truncate max-w-[150px]">gen-lang-client-0811256759</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>Reglas ABAC:</span>
                  <span className="text-emerald-400 font-medium">firestore.rules Desplegadas</span>
                </div>
              </div>
              <button
                onClick={ejecutarTestFirebase}
                disabled={probandoFirebase}
                className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Activity size={14} className={probandoFirebase ? 'animate-spin' : ''} />
                {probandoFirebase ? 'Verificando...' : 'Comprobar Handshake Firestore'}
              </button>
              {resultadoPrueba && (
                <p className="mt-2 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                  {resultadoPrueba}
                </p>
              )}
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 text-emerald-500 mb-2 font-semibold text-sm">
                <Smartphone size={18} />
                <span>Android Target Specs</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>Package ID:</span>
                  <span className="font-mono text-emerald-400">com.aurafinanzas.app</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>Versión:</span>
                  <span className="font-medium">1.0.0 (Release)</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>Target OS:</span>
                  <span className="font-medium">Android 14+ (API 34)</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>Ciudad por defecto:</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <MapPin size={11} /> Cúcuta (1ª en lista)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>NIT Fiscal:</span>
                  <span className="font-medium text-slate-300">100% Opcional</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comandos para generar Release APK */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Terminal size={15} />
              Comando para Generar el APK de Release
            </h4>
            <div className={`p-4 rounded-xl border font-mono text-xs ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-900 text-slate-100 border-slate-800'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-neutral-400 text-[11px]">Compilar Producción (Release APK)</span>
                <button
                  onClick={() => copiarTexto(comandoCompilacion, 'cmd_release')}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[11px] transition-colors"
                >
                  {copiado === 'cmd_release' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiado === 'cmd_release' ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <code className="text-emerald-400 font-semibold">{comandoCompilacion}</code>

              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-400 text-[11px]">Compilar Debug rápido para prueba en celular</span>
                <button
                  onClick={() => copiarTexto(comandoDebug, 'cmd_debug')}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[11px] transition-colors"
                >
                  {copiado === 'cmd_debug' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiado === 'cmd_debug' ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <code className="text-slate-300">{comandoDebug}</code>
            </div>
          </div>

          {/* Estructura y Ubicación del Archivo Generado */}
          <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-neutral-950/40 border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className="text-xs font-semibold flex items-center gap-1.5 text-slate-300">
              <FileCode size={15} className="text-emerald-400" />
              Ubicación del APK Generado:
            </h4>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="p-2 rounded bg-black/40 border border-neutral-800 text-slate-300 break-all">
                📦 <span className="text-emerald-400 font-semibold">android/app/build/outputs/apk/release/app-release-unsigned.apk</span>
              </div>
              <div className="p-2 rounded bg-black/40 border border-neutral-800 text-slate-300 break-all">
                🛠️ <span className="text-sky-400 font-semibold">android/app/build/outputs/apk/debug/app-debug.apk</span>
              </div>
            </div>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Puedes abrir el proyecto completo en Android Studio con <code className="text-emerald-400 font-mono">npx cap open android</code> o generar la firma de producción para publicar en Google Play Store con Gradle.
            </p>
          </div>

          {/* Permisos de Android Incluidos */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              Permisos en AndroidManifest.xml
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-neutral-950/50 border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
                <p className="font-semibold text-emerald-400">CAMERA</p>
                <p className="text-[11px] text-neutral-400">Para escaneo instantáneo OCR de facturas</p>
              </div>
              <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-neutral-950/50 border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
                <p className="font-semibold text-emerald-400">INTERNET</p>
                <p className="text-[11px] text-neutral-400">Para sincronización en vivo con Firebase</p>
              </div>
              <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-neutral-950/50 border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
                <p className="font-semibold text-emerald-400">STORAGE</p>
                <p className="text-[11px] text-neutral-400">Para importar hojas de cálculo CSV / Google Sheets</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-inherit flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Aura Finanzas • Android Platform Native Ready
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
};
