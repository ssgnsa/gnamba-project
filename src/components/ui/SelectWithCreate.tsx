import { useState, useEffect, useCallback, ReactNode } from "react";
import { Plus } from "lucide-react";
import Modal from "./Modal";

interface Option {
  value: string;
  label: string;
}

interface SelectWithCreateProps<T extends Record<string, any> = any> {
  /** Current selected value */
  value: string;
  /** Called when value changes */
  onChange: (value: string) => void;
  /** Available options */
  options: Option[];
  /** Placeholder for empty state */
  placeholder?: string;
  /** Label for the select */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Input ID */
  id?: string;
  /** Custom className */
  className?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Title for the create modal */
  createModalTitle: string;
  /** Icon for the create button */
  createIcon?: ReactNode;
  /** Function to validate the create form */
  validateCreateForm: (formData: T) => Record<string, string> | null;
  /** Function to create the new entity */
  onCreate: (formData: T) => Promise<Option>;
  /** Fields configuration for the create modal */
  createFields: CreateFieldConfig<T>[];
  /** Optional: function to fetch additional data for the create form */
  fetchCreateData?: () => Promise<any>;
}

interface CreateFieldConfig<T> {
  key: keyof T;
  label: string;
  type: "text" | "email" | "tel" | "number" | "date" | "select" | "textarea";
  placeholder?: string;
  required?: boolean;
  options?: Option[];
  /** For select type: fetch options dynamically */
  fetchOptions?: () => Promise<Option[]>;
}

/**
 * A select component with a "Create New" option that opens a modal
 * allowing users to create new entities inline without leaving the form.
 */
export default function SelectWithCreate<T extends Record<string, any> = any>({
  value,
  onChange,
  options,
  placeholder = "Sélectionner...",
  label,
  error,
  id,
  className = "",
  required = false,
  disabled = false,
  createModalTitle,
  validateCreateForm,
  onCreate,
  createFields,
  fetchCreateData,
}: SelectWithCreateProps<T>) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<T>({} as T);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, Option[]>>({});
  const firstInputRef = { current: null as HTMLElement | null };

  const loadDynamicOptions = useCallback(async () => {
    if (!fetchCreateData) return;
    try {
      const data = await fetchCreateData();
      setDynamicOptions(data);
    } catch (err) {
      console.error("Failed to load dynamic options:", err);
    }
  }, [fetchCreateData]);

  // Load dynamic options when create modal opens
  useEffect(() => {
    if (isCreateModalOpen && fetchCreateData) {
      void loadDynamicOptions();
    }
  }, [isCreateModalOpen, fetchCreateData, loadDynamicOptions]);

  const handleCreateOpen = () => {
    setCreateForm({} as T);
    setCreateErrors({});
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateClose = () => {
    setIsCreateModalOpen(false);
    setCreateForm({} as T);
    setCreateErrors({});
    setCreateError(null);
  };

  const handleCreateSubmit = async () => {
    const errors = validateCreateForm(createForm);
    if (errors) {
      setCreateErrors(errors);
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const newOption = await onCreate(createForm);
      setCreateLoading(false);
      handleCreateClose();
      onChange(newOption.value);
    } catch (err: any) {
      setCreateLoading(false);
      setCreateError(err.message || "Erreur lors de la création");
    }
  };

  const handleInputChange = (key: keyof T, val: any) => {
    setCreateForm((prev) => ({ ...prev, [key]: val }));
    if (createErrors[key as string]) {
      setCreateErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-gray-600 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-blue-400 ${
            error
              ? "border-red-300 focus:ring-red-100"
              : "border-gray-200 focus:ring-blue-100"
          } ${disabled ? "bg-gray-50" : ""}`}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {!disabled && (
          <button
            type="button"
            onClick={handleCreateOpen}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label={`Créer un nouveau ${label?.toLowerCase() || "élément"}`}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCreateClose}
        title={createModalTitle}
        size="md"
      >
        <div className="space-y-4">
          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {createError}
            </div>
          )}
          {createFields.map((field) => (
            <div key={String(field.key)}>
              <label
                htmlFor={`create-${String(field.key)}`}
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === "select" ? (
                <select
                  id={`create-${String(field.key)}`}
                  value={createForm[field.key] || ""}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-blue-400 ${
                    createErrors[String(field.key)]
                      ? "border-red-300 focus:ring-red-100"
                      : "border-gray-200 focus:ring-blue-100"
                  }`}
                  aria-invalid={!!createErrors[String(field.key)]}
                  aria-describedby={
                    createErrors[String(field.key)]
                      ? `create-${String(field.key)}-error`
                      : undefined
                  }
                >
                  <option value="">{field.placeholder || "Sélectionner..."}</option>
                  {(field.options || dynamicOptions[String(field.key)] || []).map(
                    (opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ),
                  )}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  id={`create-${String(field.key)}`}
                  value={createForm[field.key] || ""}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  rows={3}
                  placeholder={field.placeholder}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-blue-400 resize-none ${
                    createErrors[String(field.key)]
                      ? "border-red-300 focus:ring-red-100"
                      : "border-gray-200 focus:ring-blue-100"
                  }`}
                  aria-invalid={!!createErrors[String(field.key)]}
                  aria-describedby={
                    createErrors[String(field.key)]
                      ? `create-${String(field.key)}-error`
                      : undefined
                  }
                />
              ) : (
                <input
                  ref={(el) => {
                    if (field.required && !firstInputRef.current && el) {
                      firstInputRef.current = el;
                    }
                  }}
                  id={`create-${String(field.key)}`}
                  type={field.type}
                  value={createForm[field.key] || ""}
                  onChange={(e) =>
                    handleInputChange(
                      field.key,
                      field.type === "number"
                        ? e.target.value
                        : e.target.value,
                    )
                  }
                  placeholder={field.placeholder}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-blue-400 ${
                    createErrors[String(field.key)]
                      ? "border-red-300 focus:ring-red-100"
                      : "border-gray-200 focus:ring-blue-100"
                  }`}
                  aria-invalid={!!createErrors[String(field.key)]}
                  aria-describedby={
                    createErrors[String(field.key)]
                      ? `create-${String(field.key)}-error`
                      : undefined
                  }
                  required={field.required}
                />
              )}
              {createErrors[String(field.key)] && (
                <p
                  id={`create-${String(field.key)}-error`}
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {createErrors[String(field.key)]}
                </p>
              )}
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreateClose}
              type="button"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateSubmit}
              disabled={createLoading}
              type="button"
              className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-on-primary)",
              }}
            >
              {createLoading ? "Création..." : "Créer"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}