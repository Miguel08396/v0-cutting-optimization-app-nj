"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Square, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function RegistroCorteView() {
  const [isRunning, setIsRunning] = useState(false)
  const [tiempo, setTiempo] = useState(0)
  const [formData, setFormData] = useState({
    cortador: "",
    maquina: "striebig",
    cantidadPiezas: "",
    dimensionPlaca: "244x215",
    observaciones: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setTiempo((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStart = () => {
    setIsRunning(true)
  }

  const handleStop = () => {
    setIsRunning(false)
  }

  const handleSave = () => {
    if (!formData.cortador || !formData.cantidadPiezas) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    // Aquí guardarías los datos
    toast({
      title: "Corte registrado",
      description: `Trabajo guardado exitosamente - Tiempo: ${formatTime(tiempo)}`,
    })

    // Reset
    setTiempo(0)
    setIsRunning(false)
    setFormData({
      cortador: "",
      maquina: "striebig",
      cantidadPiezas: "",
      dimensionPlaca: "244x215",
      observaciones: "",
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Cronómetro */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Cronómetro de Corte</CardTitle>
          <CardDescription className="text-muted-foreground">Control de tiempo del trabajo actual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="text-6xl font-mono font-bold text-primary">{formatTime(tiempo)}</div>
          </div>

          <div className="flex gap-4 justify-center">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                size="lg"
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Play className="h-5 w-5" />
                Iniciar
              </Button>
            ) : (
              <Button onClick={handleStop} size="lg" variant="destructive" className="gap-2">
                <Square className="h-5 w-5" />
                Detener
              </Button>
            )}
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tiempo estimado:</span>
              <span className="font-semibold text-foreground">2:30 min</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estado:</span>
              <span className={`font-semibold ${isRunning ? "text-accent" : "text-muted-foreground"}`}>
                {isRunning ? "En progreso" : "Detenido"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario de registro */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Datos del Corte</CardTitle>
          <CardDescription className="text-muted-foreground">Información del trabajo realizado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cortador" className="text-card-foreground">
              Cortador *
            </Label>
            <Input
              id="cortador"
              placeholder="Nombre del operador"
              value={formData.cortador}
              onChange={(e) => setFormData({ ...formData, cortador: e.target.value })}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maquina" className="text-card-foreground">
              Máquina
            </Label>
            <Select value={formData.maquina} onValueChange={(value) => setFormData({ ...formData, maquina: value })}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="striebig">Sierra Striebig</SelectItem>
                <SelectItem value="fravol">Enchapadora Fravol</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="piezas" className="text-card-foreground">
              Cantidad de Piezas *
            </Label>
            <Input
              id="piezas"
              type="number"
              placeholder="Número de piezas cortadas"
              value={formData.cantidadPiezas}
              onChange={(e) => setFormData({ ...formData, cantidadPiezas: e.target.value })}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dimension" className="text-card-foreground">
              Dimensión Placa
            </Label>
            <Select
              value={formData.dimensionPlaca}
              onValueChange={(value) => setFormData({ ...formData, dimensionPlaca: value })}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="244x215">244 x 215 cm</SelectItem>
                <SelectItem value="244x122">244 x 122 cm</SelectItem>
                <SelectItem value="183x122">183 x 122 cm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones" className="text-card-foreground">
              Observaciones
            </Label>
            <Input
              id="observaciones"
              placeholder="Notas adicionales"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="bg-background border-border text-foreground"
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isRunning}
          >
            <Save className="h-4 w-4" />
            Guardar Trabajo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
