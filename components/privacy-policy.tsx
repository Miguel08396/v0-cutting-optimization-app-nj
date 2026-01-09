"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export function PrivacyPolicy({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Política de Privacidad y Protección de Datos</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-bold text-base mb-2">1. Información General</h3>
              <p className="text-muted-foreground">
                Centro de Corte Mosquera se compromete a proteger la privacidad y seguridad de los datos personales de
                sus usuarios. Este sistema ha sido desarrollado por Miguel Angel Pardo y cumple con las normativas de
                protección de datos aplicables.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">2. Datos Recopilados</h3>
              <p className="text-muted-foreground mb-2">El sistema recopila y almacena la siguiente información:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Datos de usuario: nombre, correo electrónico, rol</li>
                <li>Datos de operación: notas de pedido, tiempos de corte, registros de producción</li>
                <li>Datos de sesión: cookies de autenticación y preferencias</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">3. Uso de la Información</h3>
              <p className="text-muted-foreground">
                Los datos recopilados se utilizan exclusivamente para la gestión operativa del centro de corte, análisis
                de rendimiento y mejora de procesos. No se comparte información con terceros sin consentimiento
                explícito.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">4. Almacenamiento y Seguridad</h3>
              <p className="text-muted-foreground">
                Los datos se almacenan de forma segura en el navegador del usuario (LocalStorage) y se protegen mediante
                autenticación. Se recomienda no acceder al sistema desde dispositivos compartidos o públicos.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">5. Derechos del Usuario</h3>
              <p className="text-muted-foreground mb-2">Los usuarios tienen derecho a:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Acceder a sus datos personales</li>
                <li>Solicitar corrección de datos inexactos</li>
                <li>Solicitar eliminación de sus datos</li>
                <li>Revocar consentimientos otorgados</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">6. Cookies</h3>
              <p className="text-muted-foreground">
                El sistema utiliza cookies de sesión esenciales para el funcionamiento de la autenticación. No se
                utilizan cookies de terceros ni cookies publicitarias.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">7. Contacto</h3>
              <p className="text-muted-foreground">
                Para consultas sobre privacidad y protección de datos, contactar al administrador del sistema.
              </p>
            </section>

            <section className="border-t border-border pt-4 mt-4">
              <p className="text-xs text-muted-foreground">
                Última actualización:{" "}
                {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Sistema desarrollado por Miguel Angel Pardo &copy; {new Date().getFullYear()}
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
