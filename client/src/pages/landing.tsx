import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Users, 
  Shield, 
  BarChart3, 
  Zap, 
  Check,
  Star,
  Smartphone,
  Globe,
  TrendingUp,
  WalletIcon,
  CreditCard,
  PieChart,
  Menu,
  X
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f] relative overflow-hidden">
      {/* Background geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#FFD700]/10 rounded-full blur-xl"></div>
        <div className="absolute top-60 right-20 w-24 h-24 bg-[#FFD700]/20 rotate-45 rounded-lg blur-lg"></div>
        <div className="absolute bottom-40 left-1/4 w-16 h-16 bg-[#FFD700]/15 rounded-full blur-lg"></div>
        <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-gradient-to-r from-[#FFD700]/10 to-transparent rotate-12 blur-sm"></div>
        
        {/* Diagonal lines */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FFD700]/5 to-transparent transform rotate-45 translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#FFD700]/5 to-transparent transform -rotate-45 -translate-x-48 translate-y-48"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-gray-800/50 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] p-2.5 rounded-xl shadow-lg shadow-[#FFD700]/20">
                <Zap className="h-6 w-6 text-black" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Lume</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-[#FFD700] transition-all duration-300 font-medium">
                Recursos
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-[#FFD700] transition-all duration-300 font-medium">
                Planos
              </a>
              <a href="#about" className="text-gray-300 hover:text-[#FFD700] transition-all duration-300 font-medium">
                Sobre
              </a>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:from-[#e6c200] hover:to-[#e6930a] font-semibold px-6 py-2 shadow-lg shadow-[#FFD700]/20 transition-all duration-300">
                  Acesse sua conta
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </nav>
            
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-800">
              <nav className="flex flex-col gap-4 pt-4">
                <a href="#features" className="text-gray-300 hover:text-[#FFD700] transition-colors">
                  Recursos
                </a>
                <a href="#pricing" className="text-gray-300 hover:text-[#FFD700] transition-colors">
                  Planos
                </a>
                <a href="#about" className="text-gray-300 hover:text-[#FFD700] transition-colors">
                  Sobre
                </a>
                <Link href="/auth">
                  <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold w-full">
                    Acesse sua conta
                  </Button>
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-6" role="banner" aria-labelledby="hero-heading">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Content */}
            <div className="text-left space-y-8">
              <Badge variant="outline" className="border-[#FFD700]/30 text-[#FFD700] px-4 py-2 bg-[#FFD700]/5">
                Gestão Financeira para Famílias
              </Badge>
              
              <div className="space-y-6">
                <h1 id="hero-heading" className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight tracking-tight">
                  O futuro das
                  <span className="block text-transparent bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text">
                    finanças
                  </span>
                  <span className="block">familiares</span>
                </h1>
                
                <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                  Transforme a forma como sua família gerencia dinheiro. 
                  Lume oferece controle total, transparência e organização para 
                  o orçamento familiar.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <Button size="lg" className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:from-[#e6c200] hover:to-[#e6930a] font-semibold px-8 py-4 text-lg shadow-xl shadow-[#FFD700]/20 transition-all duration-300">
                    Começar Gratuitamente
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-800/50 px-8 py-4 text-lg backdrop-blur-sm">
                  Ver Demo
                </Button>
              </div>

              {/* App Store Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="border-gray-600 text-white hover:bg-gray-800/50 backdrop-blur-sm h-14 px-6 flex items-center gap-3"
                  onClick={() => {/* Link da App Store quando disponível */}}
                >
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">Baixar na</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="border-gray-600 text-white hover:bg-gray-800/50 backdrop-blur-sm h-14 px-6 flex items-center gap-3"
                  onClick={() => {/* Link do Google Play quando disponível */}}
                >
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">Disponível no</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </Button>
              </div>
              
              {/* Stats */}
              <div className="flex gap-8 pt-8">
                <div>
                  <div className="text-3xl font-bold text-[#FFD700]">500+</div>
                  <div className="text-sm text-gray-400">Usuários ativos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#FFD700]">98%</div>
                  <div className="text-sm text-gray-400">Satisfação</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#FFD700]">24/7</div>
                  <div className="text-sm text-gray-400">Suporte</div>
                </div>
              </div>
            </div>
            
            {/* Right side - Visual */}
            <div className="relative lg:ml-8">
              {/* Main device mockup */}
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-3xl p-8 shadow-2xl shadow-black/50 border border-gray-800">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] p-2 rounded-lg">
                          <WalletIcon className="h-5 w-5 text-black" />
                        </div>
                        <span className="text-white font-semibold">Centro Família</span>
                      </div>
                      <div className="text-[#FFD700] font-bold">R$ 12.450,00</div>
                    </div>
                    
                    {/* Chart area */}
                    <div className="bg-[#0f0f0f] rounded-xl p-4 h-32 flex items-end justify-between">
                      <div className="w-4 bg-gradient-to-t from-[#FFD700] to-[#FFD700]/50 rounded-t" style={{height: '60%'}}></div>
                      <div className="w-4 bg-gradient-to-t from-[#4ade80] to-[#4ade80]/50 rounded-t" style={{height: '80%'}}></div>
                      <div className="w-4 bg-gradient-to-t from-[#f87171] to-[#f87171]/50 rounded-t" style={{height: '40%'}}></div>
                      <div className="w-4 bg-gradient-to-t from-[#FFD700] to-[#FFD700]/50 rounded-t" style={{height: '90%'}}></div>
                      <div className="w-4 bg-gradient-to-t from-[#4ade80] to-[#4ade80]/50 rounded-t" style={{height: '70%'}}></div>
                      <div className="w-4 bg-gradient-to-t from-[#f87171] to-[#f87171]/50 rounded-t" style={{height: '50%'}}></div>
                    </div>
                    
                    {/* Cards */}
                    <div className="space-y-3">
                      <div className="bg-[#0f0f0f] rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-600 p-1.5 rounded">
                            <CreditCard className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-white text-sm">Carteira Principal</span>
                        </div>
                        <span className="text-[#4ade80] text-sm font-semibold">R$ 8.200,00</span>
                      </div>
                      
                      <div className="bg-[#0f0f0f] rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-600 p-1.5 rounded">
                            <PieChart className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-white text-sm">Investimentos</span>
                        </div>
                        <span className="text-[#4ade80] text-sm font-semibold">R$ 4.250,00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-2xl p-4 shadow-xl shadow-[#FFD700]/20 z-20">
                <TrendingUp className="h-6 w-6 text-black" />
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-br from-[#4ade80] to-[#22c55e] rounded-2xl p-4 shadow-xl shadow-green-500/20 z-20">
                <Shield className="h-6 w-6 text-white" />
              </div>
              
              <div className="absolute top-1/2 -left-8 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-2xl p-4 shadow-xl shadow-purple-500/20 z-20">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-[#111111]" aria-labelledby="features-heading">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 id="features-heading" className="text-4xl md:text-5xl font-bold text-white mb-6">
              Recursos Poderosos
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Tudo que sua família precisa para organizar e controlar o orçamento doméstico
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-[#1a1a1a] border-gray-800 hover:border-[#FFD700]/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5 flex items-center justify-center mb-4 group-hover:bg-[#FFD700]/10 transition-all duration-300">
                  <WalletIcon className="h-6 w-6 text-[#FFD700]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Carteiras Familiares</h3>
                <p className="text-gray-400">
                  Separe o dinheiro por objetivos: casa, educação, lazer e emergências
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-gray-800 hover:border-[#FFD700]/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5 flex items-center justify-center mb-4 group-hover:bg-[#FFD700]/10 transition-all duration-300">
                  <CreditCard className="h-6 w-6 text-[#FFD700]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Controle de Cartões</h3>
                <p className="text-gray-400">
                  Acompanhe faturas e limites dos cartões da família em um só lugar
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-gray-800 hover:border-[#FFD700]/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5 flex items-center justify-center mb-4 group-hover:bg-[#FFD700]/10 transition-all duration-300">
                  <PieChart className="h-6 w-6 text-[#FFD700]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Relatórios Familiares</h3>
                <p className="text-gray-400">
                  Veja onde a família está gastando e planeje melhor o orçamento
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-gray-800 hover:border-[#FFD700]/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5 flex items-center justify-center mb-4 group-hover:bg-[#FFD700]/10 transition-all duration-300">
                  <Users className="h-6 w-6 text-[#FFD700]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Gestão Familiar</h3>
                <p className="text-gray-400">
                  Organize as finanças da família com acesso controlado para cada membro
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-gray-800 hover:border-[#FFD700]/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5 flex items-center justify-center mb-4 group-hover:bg-[#FFD700]/10 transition-all duration-300">
                  <TrendingUp className="h-6 w-6 text-[#FFD700]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Parcelamentos</h3>
                <p className="text-gray-400">
                  Gerencie e acompanhe pagamentos parcelados automaticamente
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-gray-800 hover:border-[#FFD700]/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5 flex items-center justify-center mb-4 group-hover:bg-[#FFD700]/10 transition-all duration-300">
                  <Smartphone className="h-6 w-6 text-[#FFD700]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Interface Moderna</h3>
                <p className="text-gray-400">
                  Design responsivo e intuitivo para uso em qualquer dispositivo
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4" aria-labelledby="pricing-heading">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 id="pricing-heading" className="text-4xl md:text-5xl font-bold text-white mb-6">
              Planos Simples
            </h2>
            <p className="text-xl text-gray-300">
              Escolha o plano perfeito para suas necessidades
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Gratuito</h3>
                  <div className="text-4xl font-bold text-white mb-4">
                    R$ 0<span className="text-lg text-gray-400">/mês</span>
                  </div>
                  <p className="text-gray-400">Perfeito para começar</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Até 2 centros de custo</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">5 carteiras por centro</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Relatórios básicos</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Suporte por email</span>
                  </li>
                </ul>

                <Link href="/auth" className="block">
                  <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-800">
                    Começar Gratuitamente
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-[#FFD700]/10 to-[#1a1a1a] border-[#FFD700] relative">
              <div className="absolute top-4 right-4">
                <Badge className="bg-[#FFD700] text-black">Recomendado</Badge>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-white mb-4">
                    R$ 29<span className="text-lg text-gray-400">/mês</span>
                  </div>
                  <p className="text-gray-400">Para equipes e famílias</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Centros de custo ilimitados</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Carteiras ilimitadas</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Relatórios avançados</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Suporte prioritário</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Backup automático</span>
                  </li>
                </ul>

                <Button className="w-full bg-[#FFD700] text-black hover:bg-[#e6c200] font-semibold">
                  Começar Período Gratuito
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Guide Section */}
      <section className="py-20 px-4 bg-[#0a0a0a]">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - App mockup */}
            <div className="relative">
              <div className="relative z-10 max-w-sm mx-auto">
                {/* Phone mockup */}
                <div className="bg-[#1a1a1a] rounded-[3rem] p-2 shadow-2xl shadow-black/50 border border-gray-800">
                  <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-[2.5rem] p-6 h-[600px] overflow-hidden">
                    {/* Status bar */}
                    <div className="flex justify-between items-center mb-6 text-white text-sm">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* App header */}
                    <div className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-2xl p-4 mb-6">
                      <div className="flex items-center justify-between text-black">
                        <div>
                          <h3 className="font-bold text-lg">Família Silva</h3>
                          <p className="text-sm opacity-80">Centro de Custo</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-80">Saldo Total</p>
                          <p className="font-bold text-xl">R$ 5.420,00</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick actions */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-[#2a2a2a] rounded-xl p-3 border border-gray-700">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mb-2">
                          <WalletIcon className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-white text-sm font-medium">Nova Receita</p>
                        <p className="text-gray-400 text-xs">R$ 3.200,00</p>
                      </div>
                      <div className="bg-[#2a2a2a] rounded-xl p-3 border border-gray-700">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mb-2">
                          <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-white text-sm font-medium">Gastos do Mês</p>
                        <p className="text-gray-400 text-xs">R$ 1.870,00</p>
                      </div>
                    </div>
                    
                    {/* Recent transactions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">S</span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">Supermercado</p>
                            <p className="text-gray-400 text-xs">Hoje • 14:30</p>
                          </div>
                        </div>
                        <p className="text-red-400 font-medium">-R$ 285,00</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">P</span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">Pagamento PIX</p>
                            <p className="text-gray-400 text-xs">Ontem • 09:15</p>
                          </div>
                        </div>
                        <p className="text-green-400 font-medium">+R$ 1.500,00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/20 to-transparent rounded-full blur-3xl"></div>
            </div>
            
            {/* Right side - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="border-[#FFD700]/30 text-[#FFD700] px-4 py-2 bg-[#FFD700]/5">
                  Organize suas finanças
                </Badge>
                <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                  O guia para o seu
                  <span className="block text-transparent bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text">
                    sucesso financeiro
                  </span>
                </h2>
              </div>
              
              {/* Steps */}
              <div className="grid gap-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-xl flex items-center justify-center">
                      <span className="text-black font-bold text-lg">01</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Suas contas e cartões num só lugar</h3>
                    <p className="text-gray-400">
                      Comece cadastrando suas contas e cartões para ter uma visão mais clara das suas finanças.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-xl flex items-center justify-center">
                      <span className="text-black font-bold text-lg">02</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Cadastre todos os seus gastos</h3>
                    <p className="text-gray-400">
                      Garanta uma previsibilidade financeira poderosa cadastrando suas despesas em tempo real, de onde você estiver.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-xl flex items-center justify-center">
                      <span className="text-black font-bold text-lg">03</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Saiba o destino de cada centavo</h3>
                    <p className="text-gray-400">
                      Mantenha tudo sob controle informando sua renda e gastos extras para ter um ponto de partida.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-xl flex items-center justify-center">
                      <span className="text-black font-bold text-lg">04</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Transformando em hábito</h3>
                    <p className="text-gray-400">
                      Lance os gastos do dia a dia, acompanhe os relatórios sempre que possível e assuma o controle do seu dinheiro.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-[#111111]">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Por que escolher o Lume?
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Desenvolvido pensando na colaboração e simplicidade, o Lume oferece 
            todas as ferramentas necessárias para uma gestão financeira eficiente 
            e transparente entre equipes, famílias e grupos.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-[#FFD700] p-4 rounded-full w-fit mx-auto mb-4">
                <Globe className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Acesso Anywhere</h3>
              <p className="text-gray-400">
                Acesse suas finanças de qualquer lugar, a qualquer momento
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[#FFD700] p-4 rounded-full w-fit mx-auto mb-4">
                <Shield className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">100% Seguro</h3>
              <p className="text-gray-400">
                Seus dados protegidos com a mais alta tecnologia de segurança
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[#FFD700] p-4 rounded-full w-fit mx-auto mb-4">
                <Star className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Suporte Premium</h3>
              <p className="text-gray-400">
                Equipe dedicada para ajudar você a alcançar seus objetivos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para transformar suas finanças?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Junte-se a milhares de usuários que já escolheram o Lume para 
            gerenciar suas finanças de forma inteligente e colaborativa.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-[#FFD700] text-black hover:bg-[#e6c200] font-semibold px-8 py-3 text-lg">
                Criar Conta Gratuitamente
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#0a0a0a] py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#FFD700] p-2 rounded-lg">
                  <Zap className="h-5 w-5 text-black" />
                </div>
                <span className="text-xl font-bold text-white">Lume</span>
              </div>
              <p className="text-gray-400">
                A plataforma definitiva para gestão financeira colaborativa.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Planos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Segurança</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Carreiras</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Lume. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}