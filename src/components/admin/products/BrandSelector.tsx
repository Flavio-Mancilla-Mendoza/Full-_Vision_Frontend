import React, { useEffect, useState, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getAllBrands, createBrand, checkBrandExists, type Brand } from "@/services/brands";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  value?: string | undefined;
  onChange: (value?: string) => void;
}

export const BrandSelector: React.FC<Props> = ({ value, onChange }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const fetched = await getAllBrands();
      setBrands(fetched);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudieron cargar las marcas", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!newBrandName.trim()) {
      toast({ title: "Error", description: "El nombre de la marca no puede estar vacío", variant: "destructive" });
      return;
    }
    try {
      const exists = await checkBrandExists(newBrandName);
      if (exists) {
        toast({ title: "Marca existente", description: "Ya existe una marca con ese nombre", variant: "destructive" });
        return;
      }
      const created = await createBrand({ name: newBrandName });
      setBrands((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(created.id);
      setNewBrandName("");
      setIsCreating(false);
      toast({ title: "✅ Marca creada", description: `La marca "${created.name}" se creó exitosamente` });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo crear la marca", variant: "destructive" });
    }
  };

  return (
    <div>
      {!isCreating ? (
        <div className="flex gap-2">
          <Select value={value} onValueChange={(v) => onChange(v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecciona una marca" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            placeholder="Nombre de la nueva marca"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
          />
          <Button type="button" variant="default" onClick={handleCreate}>
            Crear
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsCreating(false);
              setNewBrandName("");
            }}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
};

export default BrandSelector;
