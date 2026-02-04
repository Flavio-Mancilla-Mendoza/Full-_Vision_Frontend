import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { ConfirmContext, ConfirmFn } from "@/context/confirmContext";

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const resolveRef = useRef<(val: boolean) => void>(() => {});

  const confirm: ConfirmFn = (msg: string) => {
    setMessage(msg);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const handleClose = (value: boolean) => {
    setOpen(false);
    // give a tick to allow dialog to animate
    setTimeout(() => resolveRef.current(value), 0);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar acción</DialogTitle>
          </DialogHeader>
          <div className="py-4">{message}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleClose(true)} className="ml-2">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
};
