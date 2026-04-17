import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Check } from 'lucide-react';
import { apiClient } from '../../services/api';
import { Gasto, CategoriaGasto, TipoGasto, CATEGORIA_GASTO_LABELS, CategoriaCustomInfo } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../store/auth';

interface Props {
  gasto?: Gasto | null;
  usuarios: { id: string; nombre: string; avatarColor: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

const CUSTOM_PREFIX = 'CUSTOM:';
const NUEVA_CATEGORIA = '__NUEVA__';

const EMOJIS = ['🏷️','🛒','🏠','🚗','🎬','💊','👗','🍽️','📱','📦','✈️','🎓','💼','🎮','🐾','🌿','🍕','☕','🐶','💈'];
const COLORES = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#f97316','#06b6d4','#84cc16'];

export function GastoForm({ gasto, usuarios, onSuccess, onCancel }: Props) {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [categoriasCustom, setCategoriasCustom] = useState<CategoriaCustomInfo[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Estado del mini-formulario inline para nueva categoría
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);
  const [nuevaCat, setNuevaCat] = useState({ nombre: '', emoji: '🏷️', color: '#6366f1' });
  const [creandoCat, setCreandoCat] = useState(false);

  const valorSelectInicial = () => {
    if (gasto?.categoria === 'PERSONALIZADA' && gasto.categoriaCustomId) {
      return `${CUSTOM_PREFIX}${gasto.categoriaCustomId}`;
    }
    return gasto?.categoria || 'OTROS';
  };

  const [selectCategoria, setSelectCategoria] = useState<string>(valorSelectInicial());
  const [form, setForm] = useState({
    importe: gasto ? String(gasto.importe) : '',
    descripcion: gasto?.descripcion || '',
    tipo: gasto?.tipo || 'INDIVIDUAL' as TipoGasto,
    fecha: gasto ? gasto.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
    usuarioId: gasto?.usuarioId || usuario?.id || '',
  });

  const cargarCategorias = async () => {
    try {
      const data = await apiClient.get<CategoriaCustomInfo[]>('/usuarios/categorias');
      setCategoriasCustom(data);
    } catch {}
  };

  useEffect(() => { cargarCategorias(); }, []);

  const handleSelectCategoria = (value: string) => {
    if (value === NUEVA_CATEGORIA) {
      setMostrarNuevaCategoria(true);
      // No cambiamos selectCategoria aún — esperamos a que creen la categoría
    } else {
      setSelectCategoria(value);
      setMostrarNuevaCategoria(false);
    }
  };

  const handleCrearCategoria = async () => {
    if (!nuevaCat.nombre.trim()) return;
    setCreandoCat(true);
    try {
      const creada = await apiClient.post<CategoriaCustomInfo>('/usuarios/categorias', {
        nombre: nuevaCat.nombre.trim(),
        emoji: nuevaCat.emoji,
        color: nuevaCat.color,
        tipo: 'GASTO',
      });
      // Recargar lista y seleccionar la nueva automáticamente
      await cargarCategorias();
      setSelectCategoria(`${CUSTOM_PREFIX}${creada.id}`);
      setMostrarNuevaCategoria(false);
      setNuevaCat({ nombre: '', emoji: '🏷️', color: '#6366f1' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la categoría');
    } finally {
      setCreandoCat(false);
    }
  };

  const buildPayload = () => {
    if (selectCategoria.startsWith(CUSTOM_PREFIX)) {
      const id = selectCategoria.slice(CUSTOM_PREFIX.length);
      return { ...form, categoria: 'PERSONALIZADA' as CategoriaGasto, categoriaCustomId: id };
    }
    return { ...form, categoria: selectCategoria as CategoriaGasto, categoriaCustomId: undefined };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = buildPayload();
      if (!gasto) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => { if (v !== undefined) fd.append(k, String(v)); });
        if (ticketFile) fd.append('ticket', ticketFile);
        await apiClient.upload('/gastos', fd);
      } else {
        await apiClient.put(`/gastos/${gasto.id}`, { ...payload, importe: Number(payload.importe) });
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  // Categoría custom actualmente seleccionada (para el preview)
  const customSeleccionada = selectCategoria.startsWith(CUSTOM_PREFIX)
    ? categoriasCustom.find(c => c.id === selectCategoria.slice(CUSTOM_PREFIX.length))
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Importe (€)</label>
          <input type="number" name="importe" value={form.importe}
            onChange={e => setForm(f => ({ ...f, importe: e.target.value }))}
            className="input-field" placeholder="0.00" step="0.01" min="0.01" required />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
          <input type="text" name="descripcion" value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            className="input-field" placeholder="Ej: Mercadona compra semanal" required />
        </div>

        {/* Categoría */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría</label>

          <select
            value={mostrarNuevaCategoria ? NUEVA_CATEGORIA : selectCategoria}
            onChange={e => handleSelectCategoria(e.target.value)}
            className="input-field"
          >
            <optgroup label="Categorías predefinidas">
              {Object.entries(CATEGORIA_GASTO_LABELS)
                .filter(([k]) => k !== 'PERSONALIZADA')
                .map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
            </optgroup>

            {categoriasCustom.length > 0 && (
              <optgroup label="Mis categorías">
                {categoriasCustom.map(c => (
                  <option key={c.id} value={`${CUSTOM_PREFIX}${c.id}`}>
                    {c.emoji} {c.nombre}
                  </option>
                ))}
              </optgroup>
            )}

            <optgroup label="">
              <option value={NUEVA_CATEGORIA}>＋ Crear nueva categoría...</option>
            </optgroup>
          </select>

          {/* Preview de categoría custom seleccionada */}
          {customSeleccionada && !mostrarNuevaCategoria && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: `${customSeleccionada.color}20`, color: customSeleccionada.color }}
              >
                {customSeleccionada.emoji} {customSeleccionada.nombre}
              </span>
            </div>
          )}

          {/* Mini-formulario inline para nueva categoría */}
          {mostrarNuevaCategoria && (
            <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-fade-in">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nueva categoría</p>

              {/* Nombre */}
              <input
                type="text"
                value={nuevaCat.nombre}
                onChange={e => setNuevaCat(n => ({ ...n, nombre: e.target.value }))}
                placeholder="Nombre de la categoría"
                className="input-field text-sm py-2"
                autoFocus
              />

              {/* Preview */}
              {nuevaCat.nombre && (
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: `${nuevaCat.color}20`, color: nuevaCat.color }}
                  >
                    {nuevaCat.emoji} {nuevaCat.nombre}
                  </span>
                </div>
              )}

              {/* Emojis */}
              <div>
                <p className="text-xs text-slate-400 mb-1.5">Emoji</p>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => setNuevaCat(n => ({ ...n, emoji: e }))}
                      className={`text-lg p-1 rounded-lg transition-all ${nuevaCat.emoji === e ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'hover:bg-slate-200'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colores */}
              <div>
                <p className="text-xs text-slate-400 mb-1.5">Color</p>
                <div className="flex gap-2">
                  {COLORES.map(c => (
                    <button key={c} type="button" onClick={() => setNuevaCat(n => ({ ...n, color: c }))}
                      className={`w-7 h-7 rounded-full transition-all ${nuevaCat.color === c ? 'ring-2 ring-offset-1 ring-slate-500 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setMostrarNuevaCategoria(false); setNuevaCat({ nombre: '', emoji: '🏷️', color: '#6366f1' }); }}
                  className="btn-secondary flex-1 text-sm py-2">
                  Cancelar
                </button>
                <button type="button" onClick={handleCrearCategoria}
                  disabled={!nuevaCat.nombre.trim() || creandoCat}
                  className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1.5">
                  {creandoCat ? <LoadingSpinner size="sm" /> : <><Check className="w-3.5 h-3.5" /> Crear y usar</>}
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
          <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoGasto }))}
            className="input-field">
            <option value="INDIVIDUAL">👤 Individual</option>
            <option value="COMUN">👥 Común</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha</label>
          <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
            className="input-field" required />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Usuario</label>
          <select value={form.usuarioId} onChange={e => setForm(f => ({ ...f, usuarioId: e.target.value }))}
            className="input-field">
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ticket */}
      {!gasto && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Ticket (opcional)</label>
          <input type="file" ref={fileRef} accept="image/*" className="hidden"
            onChange={e => setTicketFile(e.target.files?.[0] || null)} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all duration-200 flex items-center justify-center gap-2 text-sm">
            <Camera className="w-4 h-4" />
            {ticketFile ? ticketFile.name : 'Subir foto del ticket'}
          </button>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2"
          disabled={loading || mostrarNuevaCategoria}>
          {loading ? <LoadingSpinner size="sm" /> : (gasto ? 'Guardar cambios' : 'Añadir gasto')}
        </button>
      </div>
    </form>
  );
}
