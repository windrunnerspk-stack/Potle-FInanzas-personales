import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crown,
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Receipt,
  Building2,
  DollarSign,
  Sparkles,
  ArrowRight,
  Calculator,
  UserCheck,
  Database,
  ExternalLink,
  Percent,
  Check
} from 'lucide-react';
import { Gasto, UsuarioConfig } from '../types/finance';
import {
  formatearMoneda,
  ADMIN_EMAIL,
  esUsuarioAdmin,
  guardarConfiguracion,
  descargarBackupJSON,
  restaurarBackupCompletoJSON
} from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

interface PremiumProModalProps {
  config: UsuarioConfig;
  gastos: Gasto[];
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: (config: UsuarioConfig) => void;
}

export const PremiumProModal: React.FC<PremiumProModalProps> = ({
  config,
  gastos,
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const { isDark } = useTheme();
  const [tab, setTab] = useState<'auditoria' | 'libroFiscal' | 'respaldo'>('auditoria');
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [mostrarLoginAdmin, setMostrarLoginAdmin] = useState(false);
  const [errorAdmin, setErrorAdmin] = useState('');
  const [exitoAdmin, setExitoAdmin] = useState(false);
  const [simulandoPago, setSimulandoPago] = useState(false);
  const [pagoMensaje, setPagoMensaje] = useState<string | null>(null);

  if (!isOpen) return null;

  const esAdmin = esUsuarioAdmin(config.email);

  // Cálculos Tributarios Pro DIAN
  const calculosDian = (() => {
    let saludTotal = 0;
    let educacionTotal = 0;
    let viviendaTotal = 0;
    let ivaDescontableTotal = 0;
    let efectivoTotal = 0;
    let pagosBancarizadosTotal = 0;
    let alertasBancarizacion = 0;
    let comprasConFacturaTotal = 0;

    gastos.forEach((g) => {
      // Deducción Salud (Medicina prepagada, consultas, fármacos)
      if (g.categoria === 'Salud') {
        saludTotal += g.total;
      }
      // Deducción Educación
      if (g.categoria === 'Educación') {
        educacionTotal += g.total;
      }
      // Deducción Vivienda
      if (g.categoria === 'Vivienda') {
        viviendaTotal += g.total;
      }

      // IVA estimado (19% sobre compras en categorías gravadas con NIT especificado)
      if (g.nit && ['Mercado', 'Gasolina', 'Restaurantes', 'Tecnología', 'Ropa', 'Vehículo'].includes(g.categoria)) {
        // Asumiendo tarifa estándar 19%
        const base = g.total / 1.19;
        const iva = g.total - base;
        ivaDescontableTotal += iva;
      }

      // Bancarización Art. 771-5 E.T. (pagos en efectivo > $1.000.000 COP)
      if (g.metodo_pago === 'Efectivo') {
        efectivoTotal += g.total;
        if (g.total >= 1000000) {
          alertasBancarizacion++;
        }
      } else {
        pagosBancarizadosTotal += g.total;
      }

      // Deducción especial 1% por compras electrónicas (Ley 2277 de 2022)
      if (g.nit && g.metodo_pago !== 'Efectivo') {
        comprasConFacturaTotal += g.total;
      }
    });

    const deduccionEspecialUnoPorCiento = comprasConFacturaTotal * 0.01;
    const totalDeduccionesRenta = saludTotal + educacionTotal + (viviendaTotal * 0.3) + deduccionEspecialUnoPorCiento;
    // Estimación beneficio fiscal (tarifa media marginal 28%)
    const ahorroEstimadoImpuestos = totalDeduccionesRenta * 0.28;

    return {
      saludTotal,
      educacionTotal,
      viviendaTotal,
      ivaDescontableTotal,
      efectivoTotal,
      pagosBancarizadosTotal,
      alertasBancarizacion,
      comprasConFacturaTotal,
      deduccionEspecialUnoPorCiento,
      totalDeduccionesRenta,
      ahorroEstimadoImpuestos,
    };
  })();

  const handleValidarAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAdmin('');
    const emailLimpio = adminEmailInput.trim().toLowerCase();
    if (emailLimpio === ADMIN_EMAIL.toLowerCase()) {
      const nuevaConf = guardarConfiguracion({ email: ADMIN_EMAIL });
      onConfigUpdated(nuevaConf);
      setExitoAdmin(true);
      setTimeout(() => setExitoAdmin(false), 3000);
    } else {
      setErrorAdmin('El correo ingresado no tiene privilegios de Administrador Maestro.');
    }
  };

  const handleDescargarLibroFiscal = () => {
    const encabezados = [
      'Fecha',
      'Hora',
      'Establecimiento',
      'NIT / Documento',
      'Ciudad',
      'Categoría DIAN',
      'Medio de Pago',
      'Base Gravable (COP)',
      'IVA Descontable 19% (COP)',
      'Total Pagado (COP)',
      'Deducible Renta',
      'Soporte Electrónico'
    ];

    const filas = gastos.map((g) => {
      const esDeducible = ['Salud', 'Educación', 'Vivienda'].includes(g.categoria) ? 'SÍ (100%)' : 'PARCIAL (Art. 107 E.T.)';
      const tieneIva = Boolean(g.nit);
      const base = tieneIva ? Math.round(g.total / 1.19) : g.total;
      const iva = tieneIva ? g.total - base : 0;

      return [
        `"${g.fecha}"`,
        `"${g.hora}"`,
        `"${(g.establecimiento || '').replace(/"/g, '""')}"`,
        `"${g.nit || '222222222222'}"`,
        `"${g.ciudad || 'Colombia'}"`,
        `"${g.categoria}"`,
        `"${g.metodo_pago}"`,
        base,
        iva,
        g.total,
        `"${esDeducible}"`,
        `"${g.nit ? 'Factura Electrónica Validada' : 'Documento Equivalente'}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [encabezados.join(';'), ...filas].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AuraPro_LibroFiscal_DIAN_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className={`w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border ${
          isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Cabecera Pro */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl ${
            isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white/95 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm shadow-amber-500/20">
              <Crown size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Aura Finanzas PRO
                </h3>
                {esAdmin ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-mono shadow-xs">
                    ADMIN MASTER
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                    PRO LOCKED
                  </span>
                )}
              </div>
              <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Módulo de Auditoría Fiscal DIAN & Conciliación Contable
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isDark
                ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                : 'bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
          {esAdmin ? (
            /* ==========================================
               VISTA 1: ADMIN DESBLOQUEADO (latouchettdiego@gmail.com)
               ========================================== */
            <div className="space-y-4">
              {/* Tarjeta de Reconocimiento Admin */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-500/10 via-neutral-900 to-emerald-500/10 border-amber-500/30'
                    : 'bg-gradient-to-r from-amber-50 via-white to-emerald-50 border-amber-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={24} className="text-amber-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                      Administrador Verificado • Acceso Total Activo
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                      {ADMIN_EMAIL}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                  Ilimitado
                </span>
              </div>

              {/* Selector de Pestañas Pro */}
              <div
                className={`p-1 rounded-2xl border flex items-center gap-1 ${
                  isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <button
                  onClick={() => setTab('auditoria')}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    tab === 'auditoria'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-xs'
                      : isDark
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Auditor DIAN
                </button>
                <button
                  onClick={() => setTab('libroFiscal')}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    tab === 'libroFiscal'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-xs'
                      : isDark
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Libro Fiscal
                </button>
                <button
                  onClick={() => setTab('respaldo')}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    tab === 'respaldo'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-xs'
                      : isDark
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Respaldo JSON
                </button>
              </div>

              {/* Tab 1: Auditoría Fiscal DIAN */}
              {tab === 'auditoria' && (
                <div className="space-y-3.5">
                  {/* Tarjeta de Beneficio Fiscal */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-neutral-950/70 border-neutral-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-neutral-400' : 'text-slate-500'
                      }`}
                    >
                      Ahorro Proyectado en Impuesto de Renta
                    </span>
                    <div className="text-2xl font-black font-mono text-emerald-500 mt-1">
                      {formatearMoneda(calculosDian.ahorroEstimadoImpuestos)}
                    </div>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      Estimado según deducciones registradas en Salud, Educación, Vivienda y compras con factura electrónica.
                    </p>
                  </div>

                  {/* Desglose de Deducciones */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div
                      className={`p-3 rounded-xl border ${
                        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-teal-500 block uppercase">Salud & Medicina</span>
                      <span className="font-mono font-extrabold text-sm block mt-0.5">
                        {formatearMoneda(calculosDian.saludTotal)}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                        Art. 387 E.T. Deducible
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-sky-500 block uppercase">Educación</span>
                      <span className="font-mono font-extrabold text-sm block mt-0.5">
                        {formatearMoneda(calculosDian.educacionTotal)}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                        Matrículas y cuotas
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-amber-500 block uppercase">IVA Descontable</span>
                      <span className="font-mono font-extrabold text-sm block mt-0.5">
                        {formatearMoneda(calculosDian.ivaDescontableTotal)}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                        Recuperable fiscalmente
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-indigo-500 block uppercase">1% Ley 2277</span>
                      <span className="font-mono font-extrabold text-sm block mt-0.5">
                        {formatearMoneda(calculosDian.deduccionEspecialUnoPorCiento)}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                        Bancarizadas con NIT
                      </span>
                    </div>
                  </div>

                  {/* Alerta de Bancarización */}
                  <div
                    className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                      calculosDian.alertasBancarizacion > 0
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {calculosDian.alertasBancarizacion > 0 ? (
                      <AlertTriangle size={18} className="shrink-0 text-amber-500 mt-0.5" />
                    ) : (
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">
                        {calculosDian.alertasBancarizacion > 0
                          ? `Atención: ${calculosDian.alertasBancarizacion} pagos en efectivo superan $1.000.000 COP.`
                          : 'Control de Bancarización DIAN en orden (Art. 771-5 E.T.).'}
                      </p>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        {calculosDian.alertasBancarizacion > 0
                          ? 'La DIAN limita la deducibilidad de pagos en efectivo altos. Se recomienda usar tarjeta o transferencia.'
                          : 'Tus pagos están adecuadamente bancarizados para máxima aceptación fiscal.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Libro Fiscal DIAN */}
              {tab === 'libroFiscal' && (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                      <FileSpreadsheet size={16} />
                      <span>Libro Fiscal Oficial de Operaciones Diarias</span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                      Estructura conforme al Artículo 616-1 del Estatuto Tributario colombiano para comerciantes y no declarantes.
                      Incluye NIT del emisor, base gravable, IVA segregado y medios de pago.
                    </p>
                  </div>

                  <button
                    onClick={handleDescargarLibroFiscal}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
                  >
                    <Download size={16} className="stroke-[2.5]" />
                    <span>Descargar Libro Fiscal en CSV / Excel DIAN</span>
                  </button>
                </div>
              )}

              {/* Tab 3: Respaldo y Restauración Master */}
              {tab === 'respaldo' && (
                <div className="space-y-3.5 text-xs">
                  <div
                    className={`p-4 rounded-2xl border space-y-2 ${
                      isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-amber-500">
                      <Database size={16} />
                      <span>Garantía de Cero Pérdida de Datos en Actualizaciones</span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                      Descarga una copia completa en formato JSON con todas tus facturas, categorías y configuraciones.
                      Puedes restaurarla en cualquier momento o al instalar una versión nueva de la app en otro teléfono.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={descargarBackupJSON}
                      className="flex-1 py-3 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-neutral-700"
                    >
                      <Download size={15} />
                      <span>Descargar Copia JSON</span>
                    </button>

                    <label className="flex-1 py-3 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-500/30 text-center">
                      <Database size={15} />
                      <span>Restaurar Copia JSON</span>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const content = evt.target?.result as string;
                              if (content) {
                                const res = restaurarBackupCompletoJSON(content);
                                if (res.exito) {
                                  alert(`¡Respaldo restaurado con éxito! Se cargaron ${res.gastosRestaurados} comprobantes.`);
                                  window.location.reload();
                                } else {
                                  alert(`Error al restaurar: ${res.error}`);
                                }
                              }
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ==========================================
               VISTA 2: BLOQUEADA PARA USUARIOS REGULARES (PAYWALL PRO)
               ========================================== */
            <div className="space-y-4">
              {/* Bloque de Candado y Exclusividad */}
              <div
                className={`p-5 rounded-3xl border text-center space-y-3 ${
                  isDark
                    ? 'bg-gradient-to-b from-amber-500/10 via-neutral-950 to-neutral-950 border-amber-500/30'
                    : 'bg-gradient-to-b from-amber-50 via-white to-slate-50 border-amber-300'
                }`}
              >
                <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Lock size={26} className="stroke-[2.5]" />
                </div>

                <div>
                  <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Aura PRO • Muy pronto
                  </h4>
                  <p className={`text-xs mt-1 max-w-xs mx-auto ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    Estamos preparando herramientas avanzadas de auditoría fiscal DIAN, libro diario y copias automáticas en la nube. ¡Estará disponible muy pronto!
                  </p>
                </div>

                <div
                  className={`p-3 rounded-2xl border text-left text-xs space-y-2 ${
                    isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold text-[11px]">
                    <CheckCircle2 size={14} />
                    <span>Auditoría de deducción en Declaración de Renta</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold text-[11px]">
                    <CheckCircle2 size={14} />
                    <span>Generador automático de Libro Fiscal Oficial DIAN</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold text-[11px]">
                    <CheckCircle2 size={14} />
                    <span>Alertas de Bancarización y topes en efectivo (Art. 771-5)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold text-[11px]">
                    <CheckCircle2 size={14} />
                    <span>Copia de seguridad en la nube multi-dispositivo</span>
                  </div>
                </div>

                {/* Mensaje Muy Pronto */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPagoMensaje('¡Gracias por tu interés! Esta suite estará disponible muy pronto.');
                      setTimeout(() => setPagoMensaje(null), 3000);
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-neutral-800 text-neutral-300 font-extrabold text-xs flex items-center justify-center gap-2 border border-neutral-700 shadow-sm active:scale-98 transition-all cursor-pointer"
                  >
                    <Sparkles size={16} className="text-amber-500" />
                    <span>Disponible Muy Pronto</span>
                  </button>
                  {pagoMensaje && (
                    <p className="text-[11px] text-amber-500 font-medium mt-2">{pagoMensaje}</p>
                  )}
                </div>
              </div>

              {/* Enlace discreto para acceso de gestión (sin revelar identidad de administración al resto de usuarios) */}
              {mostrarLoginAdmin ? (
                <div
                  className={`p-4 rounded-2xl border space-y-2.5 ${
                    isDark ? 'bg-neutral-950/70 border-neutral-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck size={16} className="text-amber-500" />
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Acceso de Gestión
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMostrarLoginAdmin(false)}
                      className="text-[10px] text-neutral-400 hover:text-neutral-200 cursor-pointer"
                    >
                      Ocultar
                    </button>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    Ingresa tu correo autorizado para habilitar el acceso:
                  </p>

                  <form onSubmit={handleValidarAdmin} className="flex gap-2">
                    <input
                      type="email"
                      value={adminEmailInput}
                      onChange={(e) => setAdminEmailInput(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-amber-500 ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-colors shrink-0 cursor-pointer shadow-xs"
                    >
                      Acceder
                    </button>
                  </form>

                  {errorAdmin && <p className="text-rose-500 text-[11px] font-medium">{errorAdmin}</p>}
                  {exitoAdmin && (
                    <p className="text-emerald-500 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> ¡Acceso verificado con éxito!
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setMostrarLoginAdmin(true)}
                    className="text-[10px] text-neutral-500 hover:text-neutral-400 transition-colors cursor-pointer"
                  >
                    Acceso de gestión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
