import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { DynamicAttribute } from "@/services/dynamicAttributes";

interface DynamicFiltersProps {
  attributes: DynamicAttribute[];
  filters: Record<string, string[]>;
  openSections: Record<string, boolean>;
  onToggleSection: (slug: string) => void;
  onToggleFilter: (slug: string, value: string) => void;
}

export const DynamicFilters: React.FC<DynamicFiltersProps> = ({ attributes, filters, openSections, onToggleSection, onToggleFilter }) => {
  return (
    <>
      {attributes.map((attribute, index) => (
        <React.Fragment key={attribute.slug}>
          <Collapsible open={openSections[attribute.slug] || false} onOpenChange={() => onToggleSection(attribute.slug)}>
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-primary transition-colors">
              <h3 className="text-sm font-medium">{attribute.display_name}</h3>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections[attribute.slug] ? "" : "-rotate-90"}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              {/* Renderizado especial para tallas (botones) */}
              {attribute.slug === "frame_size" ? (
                <div className="grid grid-cols-3 gap-2">
                  {attribute.values.map((value) => (
                    <Button
                      key={value.value}
                      variant={filters[attribute.slug]?.includes(value.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => onToggleFilter(attribute.slug, value.value)}
                      className="h-8 text-xs"
                    >
                      {value.display_name}
                      {value.count !== undefined && value.count > 0 && <span className="ml-1 text-[10px] opacity-70">({value.count})</span>}
                    </Button>
                  ))}
                </div>
              ) : (
                /* Renderizado con checkboxes para otros atributos */
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {attribute.values.map((value) => (
                    <div key={value.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${attribute.slug}-${value.value}`}
                        checked={filters[attribute.slug]?.includes(value.value) || false}
                        onCheckedChange={() => onToggleFilter(attribute.slug, value.value)}
                      />
                      <Label
                        htmlFor={`${attribute.slug}-${value.value}`}
                        className="text-sm cursor-pointer flex items-center justify-between w-full"
                      >
                        <span className="flex items-center gap-2">
                          {/* Mostrar círculo de color si tiene color_hex */}
                          {value.color_hex && (
                            <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: value.color_hex }} />
                          )}
                          {value.display_name}
                        </span>
                        {value.count !== undefined && value.count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {value.count}
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
          {index < attributes.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </>
  );
};
