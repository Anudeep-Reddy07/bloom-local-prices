import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import fruitPattern from "@/assets/fruit-pattern.png";

const Home = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background pattern */}
      <div 
        className="fixed inset-0 opacity-10 animate-float"
        style={{ 
          backgroundImage: `url(${fruitPattern})`,
          backgroundSize: "400px",
          backgroundRepeat: "repeat"
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-elevated p-8 md:p-12 max-w-2xl w-full text-center">
          <img 
            src={logo} 
            alt="Market Bloom Logo" 
            className="w-32 h-32 mx-auto mb-6 animate-float-delayed"
          />
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
            Market Bloom
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            This website shares information about fruit and flower prices and vendors in local markets. 
            <span className="font-semibold block mt-2">It does not sell any products.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-fresh hover:opacity-90 transition-opacity">
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-8">
            Discover local vendors • Compare prices • Support your community
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
