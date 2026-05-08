import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  CreditCard as Edit,
  Trash2,
  Package,
  AlertTriangle,
  Image,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Product } from "../types";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import { useSettings } from "../context/SettingsContext";
import MediaPicker from "../components/media/MediaPicker";

const categorieLabels: Record<string, string> = {
  fournitures_bureau: "Fournitures Bureau",
  materiel_informatique: "Matériel Info",
  mobilier: "Mobilier",
  autre: "Autre",
};

const emptyForm = {
  nom: "",
  categorie: "fournitures_bureau" as Product["categorie"],
  prix_unitaire: "",
  stock_actuel: "",
  stock_minimum: "5",
  unite: "unité",
  description: "",
  image_url: "",
};

export default function Fournitures() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("nom");
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setModalOpen(true);
  };
  const openEdit = (p: Product) => {
    setForm({
      nom: p.nom,
      categorie: p.categorie,
      prix_unitaire: String(p.prix_unitaire),
      stock_actuel: String(p.stock_actuel),
      stock_minimum: String(p.stock_minimum),
      unite: p.unite,
      description: p.description,
      image_url: p.image_url || "",
    });
    setEditingId(p.id);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim()) {
      setFormError("Le nom du produit est obligatoire.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        nom: form.nom,
        categorie: form.categorie,
        prix_unitaire: parseFloat(form.prix_unitaire) || 0,
        stock_actuel: parseInt(form.stock_actuel) || 0,
        stock_minimum: parseInt(form.stock_minimum) || 5,
        unite: form.unite,
        description: form.description,
        image_url: form.image_url || null,
        updated_at: new Date().toISOString(),
      };
      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
      setModalOpen(false);
      fetchProducts();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer ce produit.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  const filtered = products.filter((p) =>
    `${p.nom} ${p.categorie}`.toLowerCase().includes(search.toLowerCase()),
  );
  const lowStock = products.filter(
    (p) => p.stock_actuel <= p.stock_minimum,
  ).length;

  return (
    <div className="space-y-4">
      {lowStock > 0 && (
        <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-700">
          <AlertTriangle size={16} />
          <span className="text-sm">{lowStock} produit(s) en stock faible</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
          style={{
            backgroundColor: settings.primary_color,
            color: "var(--color-on-primary)",
          }}
        >
          <Plus size={16} /> Nouveau Produit
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: settings.primary_color }}
            ></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Package size={40} className="mb-2 opacity-30" />
            <p className="text-sm">Aucun produit</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full egs-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Produit
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                    Catégorie
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Prix Unitaire
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => {
                  const isLow = p.stock_actuel <= p.stock_minimum;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.nom}
                              className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                            />
                          ) : (
                            <div className="p-1.5 rounded-lg bg-gray-100 flex-shrink-0">
                              <Package size={14} className="text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-800">
                              {p.nom}
                            </div>
                            {p.description && (
                              <div className="text-xs text-gray-400 truncate max-w-[180px]">
                                {p.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge
                          label={categorieLabels[p.categorie]}
                          color="gray"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {p.prix_unitaire.toLocaleString("fr-FR")} FCFA/{p.unite}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-medium ${isLow ? "text-red-600" : "text-green-600"}`}
                        >
                          {p.stock_actuel} {p.unite}
                          {isLow && (
                            <span className="ml-1 text-xs text-orange-500">
                              (faible)
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setFormError(null);
          setModalOpen(false);
        }}
        title={editingId ? "Modifier le Produit" : "Nouveau Produit"}
      >
        <div className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Image du produit
            </label>
            <div className="flex items-center gap-3">
              {form.image_url ? (
                <div className="relative">
                  <img
                    src={form.image_url}
                    alt="Produit"
                    className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200"
                  />
                  <button
                    onClick={() => setForm({ ...form, image_url: "" })}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Image size={20} className="text-gray-300" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowImagePicker(true)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors"
              >
                {form.image_url ? "Changer l'image" : "Sélectionner une image"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nom du Produit *
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Catégorie
              </label>
              <select
                value={form.categorie}
                onChange={(e) =>
                  setForm({
                    ...form,
                    categorie: e.target.value as Product["categorie"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              >
                {Object.entries(categorieLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Unité
              </label>
              <input
                type="text"
                value={form.unite}
                onChange={(e) => setForm({ ...form, unite: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Prix Unitaire
              </label>
              <input
                type="number"
                value={form.prix_unitaire}
                onChange={(e) =>
                  setForm({ ...form, prix_unitaire: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Stock Actuel
              </label>
              <input
                type="number"
                value={form.stock_actuel}
                onChange={(e) =>
                  setForm({ ...form, stock_actuel: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Stock Minimum
              </label>
              <input
                type="number"
                value={form.stock_minimum}
                onChange={(e) =>
                  setForm({ ...form, stock_minimum: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setFormError(null);
                setModalOpen(false);
              }}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.nom.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{
                backgroundColor: settings.primary_color,
                color: "var(--color-on-primary)",
              }}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </Modal>

      {showImagePicker && (
        <MediaPicker
          onSelect={(file) => {
            setForm((prev) => ({ ...prev, image_url: file.url }));
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
          title="Sélectionner une image de produit"
        />
      )}
    </div>
  );
}
