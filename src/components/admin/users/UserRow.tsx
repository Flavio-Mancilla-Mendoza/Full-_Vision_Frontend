import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import type { UserProfile } from "@/types";

export const UserRow: React.FC<{
  user: UserProfile;
  onEdit: (u: UserProfile) => void;
  onDelete: (id: string) => void;
}> = ({ user, onEdit, onDelete }) => {
  return (
    <TableRow>
      <TableCell className="font-medium">{user.id?.slice(0, 8)}...</TableCell>
      <TableCell>{user.full_name || "-"}</TableCell>
      <TableCell>{user.phone || "-"}</TableCell>
      <TableCell>
        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role === "admin" ? "Admin" : "Cliente"}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={user.is_active ? "default" : "destructive"}>{user.is_active ? "Activo" : "Inactivo"}</Badge>
      </TableCell>
      <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(user.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserRow;
