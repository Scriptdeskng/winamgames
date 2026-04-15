import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

interface GameTimerProps {
  startTime: number;
  running: boolean;
}

export function GameTimer({ startTime, running }: GameTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startTime, running]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="flex items-center gap-1.5">
      <Timer className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium tabular-nums text-foreground">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}
