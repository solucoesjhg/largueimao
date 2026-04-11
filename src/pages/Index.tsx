import gauchoMascot from "@/assets/gaucho-mascot.png";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary px-6">
      <h1 className="mb-8 text-center font-display text-5xl font-bold tracking-wide text-primary-foreground">
        LARGUEI MÃO
      </h1>

      <img
        src={gauchoMascot}
        alt="Mascote gaúcho segurando chimarrão"
        width={512}
        height={768}
        className="w-56 max-w-xs drop-shadow-lg"
      />

      <p className="mt-8 text-lg font-medium text-primary-foreground/70">
        Desapegue sem complicação
      </p>
    </div>
  );
};

export default Index;
