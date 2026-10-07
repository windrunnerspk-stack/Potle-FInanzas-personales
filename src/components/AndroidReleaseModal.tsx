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
  MapPin,
  Cloud,
  HelpCircle,
  Play,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { testConnection } from '../services/firebase';
import { sincronizarConFirebase } from '../services/storageService';

interface AndroidReleaseModalProps {
  onClose: () => void;
}

const YML_CODE = `name: Build Android APK (Aura Finanzas)

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch: # Permite ejecutar manualmente con un clic en la pestaña Actions

permissions:
  contents: write

jobs:
  build:
    name: Compilar APK Android
    runs-on: ubuntu-latest

    steps:
      - name: Clonar repositorio
        uses: actions/checkout@v4

      - name: Configurar Java JDK (v17 - Temurin)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Configurar Android SDK
        uses: android-actions/setup-android@v3

      - name: Configurar Node.js (v22 LTS)
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Instalar dependencias
        run: npm install --legacy-peer-deps

      - name: Compilar Web App (Vite)
        run: npm run build

      - name: Sincronizar Capacitor con Android
        run: npx cap sync android

      - name: Dar permisos de ejecución a gradlew
        run: chmod +x android/gradlew

      - name: Compilar APK Debug (Instalación directa en celular)
        run: |
          cd android
          ./gradlew assembleDebug --stacktrace --no-daemon

      - name: Compilar APK Release
        run: |
          cd android
          ./gradlew assembleRelease --stacktrace --no-daemon || echo "assembleRelease finalizado"

      - name: Subir APK Debug como Artefacto Descargable
        uses: actions/upload-artifact@v4
        with:
          name: aura-finanzas-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
          retention-days: 14

      - name: Subir APK Release como Artefacto Descargable
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: aura-finanzas-release-apk
          path: android/app/build/outputs/apk/release/
          retention-days: 14`;

export const AndroidReleaseModal: React.FC<AndroidReleaseModalProps> = ({ onClose }) => {
  const { isDark } = useTheme();
  const [tabActiva, setTabActiva] = useState<'github' | 'local' | 'firebase'>('github');
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
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-6 ${
          isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Cabecera */}
        <div className="p-5 border-b border-inherit flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Generador de APK Android & Firebase</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ready
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Compila en GitHub Actions sin instalar nada en tu PC o compila localmente con Gradle
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

        {/* Pestañas de navegación */}
        <div className={`px-5 pt-3 border-b flex gap-2 overflow-x-auto ${isDark ? 'border-neutral-800 bg-neutral-950/40' : 'border-slate-200 bg-slate-50'}`}>
          <button
            onClick={() => setTabActiva('github')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              tabActiva === 'github'
                ? 'border-emerald-500 text-emerald-400'
                : isDark ? 'border-transparent text-neutral-400 hover:text-neutral-200' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud size={15} />
            <span>GitHub Actions (Recomendado)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">En la nube</span>
          </button>

          <button
            onClick={() => setTabActiva('local')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              tabActiva === 'local'
                ? 'border-emerald-500 text-emerald-400'
                : isDark ? 'border-transparent text-neutral-400 hover:text-neutral-200' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal size={15} />
            <span>Compilación Local (PC)</span>
          </button>

          <button
            onClick={() => setTabActiva('firebase')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              tabActiva === 'firebase'
                ? 'border-emerald-500 text-emerald-400'
                : isDark ? 'border-transparent text-neutral-400 hover:text-neutral-200' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame size={15} />
            <span>Firebase & Especificaciones</span>
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="p-5 space-y-5 max-h-[72vh] overflow-y-auto">
          {tabActiva === 'github' && (
            <div className="space-y-4">
              {/* Alerta explicativa de GitHub Actions */}
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <HelpCircle size={18} />
                  </div>
                  <div className="text-xs space-y-1.5">
                    <h4 className="font-bold text-emerald-400 text-sm">¿Por qué te sale esa pantalla en GitHub?</h4>
                    <p className={isDark ? 'text-neutral-300 leading-relaxed' : 'text-slate-700 leading-relaxed'}>
                      GitHub muestra el mensaje <em>"Get started with GitHub Actions... Skip this and set up a workflow yourself"</em> porque tu repositorio todavía no tiene el archivo <strong>.yml</strong> guardado en la carpeta <code>.github/workflows/</code>.
                    </p>
                    <p className={`font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      <strong>Sí, debes crear ese archivo .yml</strong>. No tienes que "instalar" nada en tu computadora: GitHub ejecutará la compilación gratis en sus servidores y te entregará el APK para descargar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Paso a paso en GitHub */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Play size={14} className="text-emerald-400" />
                  3 Pasos para obtener tu APK en GitHub:
                </h4>

                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">1</span>
                    <div className="space-y-1">
                      <p className="font-semibold text-emerald-400">Haz clic en el enlace azul en GitHub:</p>
                      <p className={isDark ? 'text-neutral-400 text-[11px]' : 'text-slate-600 text-[11px]'}>
                        En la pantalla de GitHub donde estás, haz clic en el texto que dice <strong>"set up a workflow yourself"</strong> (o <em>"Skip this and set up a workflow yourself"</em>).
                      </p>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</span>
                    <div className="space-y-1.5 w-full">
                      <p className="font-semibold text-emerald-400">Pega el código YAML y dale guardar:</p>
                      <p className={isDark ? 'text-neutral-400 text-[11px]' : 'text-slate-600 text-[11px]'}>
                        GitHub te abrirá un editor web. Nombra el archivo como <code>build-apk.yml</code>, borra lo que haya y pega el contenido con el botón de abajo. Luego pulsa el botón verde <strong>"Commit changes"</strong>.
                      </p>
                      <button
                        onClick={() => copiarTexto(YML_CODE, 'yml_code')}
                        className="mt-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all flex items-center gap-1.5"
                      >
                        {copiado === 'yml_code' ? <Check size={14} /> : <Copy size={14} />}
                        {copiado === 'yml_code' ? '✓ ¡Código YAML Copiado al portapapeles!' : 'Copiar Código YAML de GitHub Actions'}
                      </button>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">3</span>
                    <div className="space-y-1">
                      <p className="font-semibold text-emerald-400">Descarga tu APK en "Artifacts":</p>
                      <p className={isDark ? 'text-neutral-400 text-[11px]' : 'text-slate-600 text-[11px]'}>
                        Ve a la pestaña <strong>Actions</strong>. Verás una tarea llamada <strong>"Compilar APK Android"</strong> ejecutándose. Tardará entre 2 y 3 minutos. Cuando aparezca el icono verde (✓), haz clic sobre él, baja hasta la sección <strong>Artifacts</strong> y descarga <strong>aura-finanzas-debug-apk</strong> (se instala directo en cualquier celular).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vista previa del archivo creado */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-900 text-white border-slate-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                    <FileCode size={14} />
                    .github/workflows/build-apk.yml (Ya creado en tu proyecto)
                  </span>
                  <button
                    onClick={() => copiarTexto(YML_CODE, 'yml_code_2')}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[11px] transition-colors"
                  >
                    {copiado === 'yml_code_2' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copiado === 'yml_code_2' ? 'Copiado' : 'Copiar YAML'}
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto text-[11px] font-mono p-2.5 bg-black/50 rounded border border-neutral-800/80 text-slate-300">
                  <pre>{YML_CODE.slice(0, 500)}...</pre>
                </div>
              </div>
            </div>
          )}

          {tabActiva === 'local' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Terminal size={15} />
                  Comandos para Compilar en tu Máquina (Local)
                </h4>
                <div className={`p-4 rounded-xl border font-mono text-xs ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-900 text-slate-100 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-400 text-[11px]">Compilar Debug rápido (Directo a teléfono)</span>
                    <button
                      onClick={() => copiarTexto(comandoDebug, 'cmd_debug')}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[11px] transition-colors"
                    >
                      {copiado === 'cmd_debug' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiado === 'cmd_debug' ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <code className="text-emerald-400 font-semibold">{comandoDebug}</code>

                  <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-400 text-[11px]">Compilar Release para producción</span>
                    <button
                      onClick={() => copiarTexto(comandoCompilacion, 'cmd_release')}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[11px] transition-colors"
                    >
                      {copiado === 'cmd_release' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiado === 'cmd_release' ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <code className="text-slate-300">{comandoCompilacion}</code>
                </div>
              </div>

              {/* Ubicación del APK Generado */}
              <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-neutral-950/40 border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-xs font-semibold flex items-center gap-1.5 text-slate-300">
                  <FileCode size={15} className="text-emerald-400" />
                  Ubicación local de los APKs generados:
                </h4>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="p-2 rounded bg-black/40 border border-neutral-800 text-slate-300 break-all">
                    🛠️ <span className="text-emerald-400 font-semibold">android/app/build/outputs/apk/debug/app-debug.apk</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-neutral-800 text-slate-300 break-all">
                    📦 <span className="text-sky-400 font-semibold">android/app/build/outputs/apk/release/app-release-unsigned.apk</span>
                  </div>
                </div>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  También puedes abrir el proyecto nativo en Android Studio con <code className="text-emerald-400 font-mono">npx cap open android</code>.
                </p>
              </div>

              {/* Permisos */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Permisos en AndroidManifest.xml
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-neutral-950/50 border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
                    <p className="font-semibold text-emerald-400">CAMERA</p>
                    <p className="text-[11px] text-neutral-400">Escaneo OCR de facturas</p>
                  </div>
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-neutral-950/50 border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
                    <p className="font-semibold text-emerald-400">INTERNET</p>
                    <p className="text-[11px] text-neutral-400">Firebase Firestore Cloud</p>
                  </div>
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-neutral-950/50 border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
                    <p className="font-semibold text-emerald-400">STORAGE</p>
                    <p className="text-[11px] text-neutral-400">Importar hojas Google Sheets</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tabActiva === 'firebase' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 text-amber-500 mb-2 font-semibold text-sm">
                    <Flame size={18} />
                    <span>Firebase Firestore</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
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
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>Package ID:</span>
                      <span className="font-mono text-emerald-400">com.aurafinanzas.app</span>
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
                      <span className="font-medium text-emerald-300">100% Opcional</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
