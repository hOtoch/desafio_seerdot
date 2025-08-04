import { useState } from "react";
import { Upload as UploadIcon, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
const API_URL = import.meta.env.VITE_API_URL!;

const Upload = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setMetrics, setIsDataLoaded } = useData();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "text/csv") {
      setUploadedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const processData = async () => {
      if (!uploadedFile) return;
      setIsProcessing(true);
      setMetrics(null);
    
      const form = new FormData();
      form.append("file", uploadedFile);
    
      try {
        const res = await fetch(`${API_URL}/api/upload-sales/`, {
          method: "POST",
          body: form,
        });
    
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Falha no upload");
        }
    
        const metrics = await res.json(); 
        console.log(metrics)
    
        setMetrics(metrics.metrics);         // mantém a lógica existente
        setIsDataLoaded(true);
    
        toast({
                  title: "Upload concluído",
                  description: "Dados processados com sucesso.",
                });
    
        navigate("/app/dashboard");
    
      } catch (err: any) {
        toast({
          title: "Erro",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };


  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Carregar Dados CSV</h1>
        <p className="text-muted-foreground">
          Carregue seu arquivo CSV de dados de vendas para começar com análises e visualizações.
        </p>
      </div>

      <Card className="border-2 border-dashed border-analytics-primary/20 hover:border-analytics-primary/40 transition-colors">
        <CardContent className="p-12">
          <div
            className={`text-center transition-all duration-200 ${
              isDragOver ? "scale-105" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploadedFile ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-analytics-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-analytics-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Arquivo Carregado com Sucesso!</h3>
                  <p className="text-muted-foreground mb-4">
                    <FileText className="w-4 h-4 inline mr-2" />
                    {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                  </p>
                  <Button 
                    variant="analytics" 
                    size="lg" 
                    onClick={processData}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Enviando..." : "Enviar & Processar"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-analytics-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <UploadIcon className="w-10 h-10 text-analytics-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-2">
                    Arraste e solte seu arquivo CSV aqui
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    ou clique no botão abaixo para navegar pelos seus arquivos
                  </p>
                </div>
                
                <div className="space-y-4">
                  <label htmlFor="file-upload">
                    <Button variant="analytics" size="lg" className="cursor-pointer" asChild>
                      <span>Escolher Arquivo CSV</span>
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  
                  <p className="text-sm text-muted-foreground">
                    Formato suportado: apenas arquivos CSV
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!uploadedFile && (
        <div className="mt-8 p-6 bg-analytics-primary/5 rounded-lg border border-analytics-primary/10">
          <h4 className="font-semibold text-foreground mb-2">Formato CSV Esperado:</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Seu CSV deve conter dados de vendas com as seguintes colunas:
          </p>
          <div className="text-sm font-mono text-analytics-primary bg-background p-3 rounded border">
            Date, Product, Category, Quantity, Unit_Price, Total_Amount, Customer_ID, Region
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;