import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCreditCardSchema, type CreditCard, type InsertCreditCard } from "@shared/schema";
import { z } from "zod";

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditCard?: CreditCard | null;
}

const formSchema = insertCreditCardSchema.extend({
  limit: z.string().min(1, "Limite é obrigatório"),
  closingDay: z.string().min(1, "Dia de fechamento é obrigatório"),
  dueDay: z.string().min(1, "Dia de vencimento é obrigatório"),
});

type FormData = z.infer<typeof formSchema>;

export function CreditCardModal({ isOpen, onClose, creditCard }: CreditCardModalProps) {
  const { couple } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coupleId: couple?.id || 0,
      name: "",
      limit: "",
      closingDay: "",
      dueDay: "",
    },
  });

  useEffect(() => {
    if (creditCard) {
      form.reset({
        coupleId: creditCard.coupleId,
        name: creditCard.name,
        limit: creditCard.limit,
        closingDay: creditCard.closingDay.toString(),
        dueDay: creditCard.dueDay.toString(),
      });
    } else {
      form.reset({
        coupleId: couple?.id || 0,
        name: "",
        limit: "",
        closingDay: "",
        dueDay: "",
      });
    }
  }, [creditCard, couple?.id, form]);

  const createCreditCard = useMutation({
    mutationFn: async (data: InsertCreditCard) => {
      const response = await fetch("/api/credit-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credit-cards', couple?.id] });
      toast({
        title: "Sucesso",
        description: "Cartão de crédito criado com sucesso!",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar cartão de crédito",
        variant: "destructive",
      });
    },
  });

  const updateCreditCard = useMutation({
    mutationFn: async (data: Partial<CreditCard>) => {
      const response = await fetch(`/api/credit-cards/${creditCard?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credit-cards', couple?.id] });
      toast({
        title: "Sucesso",
        description: "Cartão de crédito atualizado com sucesso!",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar cartão de crédito",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (creditCard) {
      updateCreditCard.mutate({
        ...data,
        limit: data.limit,
        closingDay: parseInt(data.closingDay),
        dueDay: parseInt(data.dueDay),
      });
    } else {
      createCreditCard.mutate(data);
    }
  };

  const generateDayOptions = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(
        <SelectItem key={i} value={i.toString()}>
          {i}
        </SelectItem>
      );
    }
    return days;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {creditCard ? "Editar Cartão de Crédito" : "Novo Cartão de Crédito"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Cartão</Label>
            <Input
              id="name"
              placeholder="Ex: Nubank, Itaú..."
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="limit">Limite Total (R$)</Label>
            <Input
              id="limit"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register("limit")}
            />
            {form.formState.errors.limit && (
              <p className="text-sm text-red-500">{form.formState.errors.limit.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="closingDay">Dia Fechamento</Label>
              <Select
                value={form.watch("closingDay")}
                onValueChange={(value) => form.setValue("closingDay", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent>
                  {generateDayOptions()}
                </SelectContent>
              </Select>
              {form.formState.errors.closingDay && (
                <p className="text-sm text-red-500">{form.formState.errors.closingDay.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dueDay">Dia Vencimento</Label>
              <Select
                value={form.watch("dueDay")}
                onValueChange={(value) => form.setValue("dueDay", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent>
                  {generateDayOptions()}
                </SelectContent>
              </Select>
              {form.formState.errors.dueDay && (
                <p className="text-sm text-red-500">{form.formState.errors.dueDay.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createCreditCard.isPending || updateCreditCard.isPending}
            >
              {createCreditCard.isPending || updateCreditCard.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}