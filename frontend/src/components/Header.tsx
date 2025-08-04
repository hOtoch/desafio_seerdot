import { Button } from "@/components/ui/button";
import { BarChart3, Upload } from "lucide-react";
import {Link} from "react-router-dom";


const Header = () => {
  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            seer.dash
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Recursos
          </a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            Como Funciona
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="analytics" size="sm" asChild>
            <Link to="/app">
              <Upload className="h-4 w-4" />
              Upload CSV
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;