import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Bell, Users, ArrowLeft, Clock } from "lucide-react";
import type { UserCostCenter, User } from "@shared/schema";

interface PendingMembership extends UserCostCenter {
  user: User;
}

export function Notifications() {
  const { costCenterId } = useParams<{ costCenterId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending memberships for this cost center
  const { data: pendingMemberships = [], isLoading } = useQuery({
    queryKey: ["/api/cost-centers", costCenterId, "pending-memberships"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/cost-centers/${costCenterId}/pending-memberships`);
      return response.json() as Promise<PendingMembership[]>;
    },
  });

  // Approve membership mutation
  const approveMutation = useMutation({
    mutationFn: async (membershipId: number) => {
      return apiRequest("PATCH", `/api/user-cost-centers/${membershipId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Solicitação aprovada",
        description: "O usuário agora tem acesso ao centro de custo",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cost-centers", costCenterId, "pending-memberships"] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aprovar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject membership mutation
  const rejectMutation = useMutation({
    mutationFn: async (membershipId: number) => {
      return apiRequest("DELETE", `/api/user-cost-centers/${membershipId}`);
    },
    onSuccess: () => {
      toast({
        title: "Solicitação rejeitada",
        description: "A solicitação de acesso foi rejeitada",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cost-centers", costCenterId, "pending-memberships"] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao rejeitar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (membershipId: number) => {
    approveMutation.mutate(membershipId);
  };

  const handleReject = (membershipId: number) => {
    rejectMutation.mutate(membershipId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-700 rounded w-1/4"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-[#FFD700]" />
            <div>
              <h1 className="text-3xl font-bold">Central de Notificações</h1>
              <p className="text-gray-400">Gerencie solicitações de acesso ao centro de custo</p>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <Card className="bg-[#1e1e1e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Solicitações Pendentes
              {pendingMemberships.length > 0 && (
                <Badge variant="secondary" className="bg-[#FFD700] text-black">
                  {pendingMemberships.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingMemberships.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">Nenhuma solicitação pendente</p>
                <p className="text-gray-500 text-sm">
                  As novas solicitações de acesso aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingMemberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg border border-gray-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">
                          {membership.user.name}
                        </h3>
                        <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                          Pendente
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">
                        Email: {membership.user.email}
                      </p>
                      <p className="text-gray-500 text-xs">
                        Função solicitada: Colaborador
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(membership.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(membership.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="bg-[#1e1e1e] border-gray-800 mt-6">
          <CardContent className="pt-6">
            <div className="text-center text-gray-400">
              <h3 className="font-semibold mb-2">Como funciona?</h3>
              <p className="text-sm">
                Quando usuários solicitam acesso ao seu centro de custo usando o código,
                as solicitações aparecem aqui para aprovação ou rejeição.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}