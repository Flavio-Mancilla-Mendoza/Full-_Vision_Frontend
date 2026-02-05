// src/hooks/useAttributeTypes.ts - Hook para gestión de tipos de atributos
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  getAttributeTypes,
  createAttributeType,
  updateAttributeType,
  deleteAttributeType,
} from "@/services/productAttributes";
import type { AttributeType, AttributeTypeWithValues } from "@/types";

export function useAttributeTypes() {
  const [attributeTypes, setAttributeTypes] = useState<AttributeTypeWithValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadAttributeTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAttributeTypes();
      setAttributeTypes(data);
    } catch (err: unknown) {
      console.error("Error loading attribute types:", err);

      let errorMessage = "No se pudieron cargar los tipos de atributos";

      if (err instanceof Error) {
        if (err.message.includes('relation "attribute_types" does not exist')) {
          errorMessage = "Las tablas de atributos no existen. Ejecute la migración híbrida primero.";
        } else if (err.message.includes("row-level security policy")) {
          errorMessage = "Políticas de seguridad incorrectas. Ejecute el script de corrección.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAttributeTypes();
  }, [loadAttributeTypes]);

  const createType = async (typeData: Omit<AttributeType, "id" | "created_at">) => {
    try {
      await createAttributeType(typeData);
      await loadAttributeTypes();
      toast({
        title: "Éxito",
        description: "Tipo de atributo creado correctamente",
      });
    } catch (err) {
      console.error("Error creating attribute type:", err);
      toast({
        title: "Error",
        description: "No se pudo crear el tipo de atributo",
        variant: "destructive",
      });
    }
  };

  const updateType = async (id: string, updates: Partial<AttributeType>) => {
    try {
      await updateAttributeType(id, updates);
      await loadAttributeTypes();
      toast({
        title: "Éxito",
        description: "Tipo de atributo actualizado correctamente",
      });
    } catch (err) {
      console.error("Error updating attribute type:", err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el tipo de atributo",
        variant: "destructive",
      });
    }
  };

  const deleteType = async (id: string) => {
    try {
      await deleteAttributeType(id);
      await loadAttributeTypes();
      toast({
        title: "Éxito",
        description: "Tipo de atributo eliminado correctamente",
      });
    } catch (err) {
      console.error("Error deleting attribute type:", err);
      toast({
        title: "Error",
        description: "No se pudo eliminar el tipo de atributo",
        variant: "destructive",
      });
    }
  };

  return {
    attributeTypes,
    loading,
    error,
    createType,
    updateType,
    deleteType,
    reload: loadAttributeTypes,
  };
}
