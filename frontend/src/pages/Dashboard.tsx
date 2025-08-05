import { useState, useEffect } from "react";
import { DollarSign, ShoppingCart, Users, Target, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useData } from "@/context/DataContext";
import Chart from "react-apexcharts";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL!;

const toBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

const Dashboard = () => {
  const { metrics, setMetrics, uploadedFile, isDataLoaded, setIsDataLoaded } = useData(); 

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    if (activeFilter === 'custom' && dateRange?.from && dateRange?.to){
      applyFilter('custom', dateRange.from, dateRange.to);
    }
  }, [dateRange, activeFilter])


  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-muted-foreground">
        Faça o upload do CSV para ver o dashboard.
      </div>
    );
  }

  const applyFilter = async (period: string,startDate?: Date, endDate?: Date) => {
    if (!uploadedFile) {
      toast({
        title: "Aviso",
        description: "Nenhum arquivo CSV foi carregado para filtrar.",
        variant: "default",
      });
      return;
    }

    setIsDataLoaded(false);
    setMetrics(null);

    const form = new FormData();
    form.append("file", uploadedFile);

    // constroi a query para fazer a requisição ao backend

    let query = `?period=${period}`;
    if (period === 'custom' && startDate && endDate) {
      query = `?period=custom&start_date=${format(startDate, "yyyy-MM-dd")}&end_date=${format(endDate, "yyyy-MM-dd")}`;
    }
 
    try {
      const res = await fetch(`${API_URL}/api/upload-sales/${query}`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao aplicar o filtro.");
      }

      const data = await res.json();
      setMetrics(data.metrics); 

    } catch (error: any) {
      toast({
        title: "Erro ao Filtrar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDataLoaded(true); 
    }

  }

  const handleFilterClick = (period: string) => {
    setActiveFilter(period);
    if (period !== 'custom') {
      applyFilter(period);
    }
  };



  const cards = [
    {
      title: "Receita total",
      value: toBRL(metrics.total_revenue),
      icon: DollarSign,
    },
    {
      title: "Pedidos",
      value: metrics.orders.toLocaleString(),
      icon: ShoppingCart,
    },
    {
      title: "Clientes",
      value: metrics.customers.toLocaleString(),
      icon: Users,
    },
    {
      title: "Ticket médio",
      value: toBRL(metrics.avg_ticket),
      icon: Target,
    },
  ];

  /* ---------- gráficos ---------- */
  const catSeries = [
    {
      name: "Receita",
      data: Object.values(metrics.revenue_by_category),
    },
  ];
  const chartColors = ["#22c55e"]; // Tailwind emerald-500

  const catOptions = {
    chart: { type: "bar" as const },
    colors: chartColors,
    xaxis: { categories: Object.keys(metrics.revenue_by_category).sort() },
    yaxis: {
      labels: { formatter: (v: number) => toBRL(v) },
    },
    dataLabels: {
      enabled: true,
      formatter: (v: number) => toBRL(v),
      style: { fontSize: "7.5px" },
    },
    theme: { mode: "light" as const },
  };

  const monthSeries = [
    { name: "Receita", data: Object.values(metrics.revenue_by_month) },
  ];
  const monthOptions = {
    chart: { type: "line" as const },
    colors: chartColors,
    markers: {
      size: 4,
      strokeColors: chartColors[0],
      strokeWidth: 2,
    },
    xaxis: { categories: Object.keys(metrics.revenue_by_month) },
    yaxis: {
      min: 0,
      labels: { formatter: (v: number) => toBRL(v) },
    },
    theme: { mode: "light" as const },
  };

  const topSeries = [
    {
      name: "Receita",
      data: Object.values(metrics.top_products),
    },
  ];
  const topOptions = {
    chart: { type: "bar" as const },
    colors: chartColors,
    plotOptions: { bar: { horizontal: true } },
    xaxis: { categories: Object.keys(metrics.top_products) },
    yaxis: {
      labels: { formatter: (v: number) => toBRL(v) },
    },
    dataLabels: {
      enabled: true,
      formatter: (v: number) => toBRL(v),
      style: { fontSize: "9px" },
    },
    theme: { mode: "light" as const },
  };

  /* ---------- render ---------- */
  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Painel de Análises
        </h1>
        <p className="text-muted-foreground">
          Insights calculados pelo back-end a partir do CSV.
        </p>

      {/* Filtro de data */}
      <div className="flex items-center gap-2 mt-6">
            <Button variant={activeFilter === 'all' ? 'analytics' : 'outline'} onClick={() => handleFilterClick('all')}>Período Completo</Button>
            <Button variant={activeFilter === 'this_month' ? 'analytics' : 'outline'} onClick={() => handleFilterClick('this_month')}>Esse mês</Button>
            <Button variant={activeFilter === 'last_7_days' ? 'analytics' : 'outline'} onClick={() => handleFilterClick('last_7_days')}>Últimos 7 dias</Button>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={activeFilter === 'custom' ? 'analytics' : 'outline'}
                        className={cn("w-[300px] justify-start text-left font-normal")}
                        onClick={() => setActiveFilter('custom')}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, "LLL dd, y", { locale: ptBR })} -{" "}
                                    {format(dateRange.to, "LLL dd, y", { locale: ptBR })}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y", { locale: ptBR })
                            )
                        ) : (
                            <span>Customizado</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        locale={ptBR}
                    />
                </PopoverContent>
            </Popover>
        </div>

      </header>

      {/* Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <Card key={c.title} className="border-analytics-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.title}
              </CardTitle>
              <c.icon className="h-4 w-4 text-analytics-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Gráficos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita por categoria */}
        <Card className="border-analytics-primary/10">
          <CardHeader>
            <CardTitle className="text-foreground">
              Receita por categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <Chart options={catOptions} series={catSeries} type="bar" height="100%" />
          </CardContent>
        </Card>

        {/* Receita por mês */}
        <Card className="border-analytics-primary/10">
          <CardHeader>
            <CardTitle className="text-foreground">Receita por mês</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <Chart options={monthOptions} series={monthSeries} type="line" height="100%" />
          </CardContent>
        </Card>

        {/* Top produtos */}
        <Card className="border-analytics-primary/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Top 10 produtos</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <Chart options={topOptions} series={topSeries} type="bar" height="100%" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;
