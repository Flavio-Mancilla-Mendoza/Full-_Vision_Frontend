import React from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRow } from "./UserRow";
import type { UserProfile } from "@/types";

interface UserTableProps {
  users: UserProfile[];
  onEdit: (user: UserProfile) => void;
  onDelete: (id: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>ID</TableHead>
        <TableHead>Nombre</TableHead>
        <TableHead>Teléfono</TableHead>
        <TableHead>Rol</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead>Registrado</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {users.map((user) => (
        <UserRow key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </TableBody>
  </Table>
);
