
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarIcon, Clock, CreditCard, Smartphone } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Chambre } from '@/lib/supabase'

interface ReservationModalProps {
  open: boolean
  onClose: () => void
  chambre: Chambre | null
  onConfirm: (reservationData: ReservationData) => void
}

interface ReservationData {
  chambreId: number
  dateDebut: Date
  dateFin: Date
  modeLocation: 'heure' | 'jour' | 'mois'
  methodePaiement: string
  numeroTelephone?: string
  totalAPayer: number
  nombreHeures?: number
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  open,
  onClose,
  chambre,
  onConfirm
}) => {
  const [dateDebut, setDateDebut] = useState<Date>()
  const [dateFin, setDateFin] = useState<Date>()
  const [modeLocation, setModeLocation] = useState<'heure' | 'jour' | 'mois'>('mois')
  const [nombreHeures, setNombreHeures] = useState<number>(1)
  const [methodePaiement, setMethodePaiement] = useState('tmoney')
  const [numeroTelephone, setNumeroTelephone] = useState('')
  const [loading, setLoading] = useState(false)

  const calculateTotal = () => {
    if (!chambre) return 0
    if (modeLocation === 'heure') {
      return (nombreHeures > 0 ? nombreHeures : 1) * (chambre.prix_heure || 0)
    }
    if (!dateDebut || !dateFin) return 0
    const diffTime = Math.abs(dateFin.getTime() - dateDebut.getTime())
    let diffValue = 0
    switch (modeLocation) {
      case 'jour':
        diffValue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffValue * (chambre.prix_jour || 0)
      case 'mois':
        diffValue = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
        return diffValue * chambre.prix
      default:
        return 0
    }
  }

  const handleConfirm = async () => {
    if (!chambre || !dateDebut || (modeLocation !== 'heure' && !dateFin)) return

    setLoading(true)
    try {
      const reservationData: ReservationData = {
        chambreId: chambre.id,
        dateDebut,
        dateFin: modeLocation === 'heure' ? dateDebut : dateFin!,
        modeLocation,
        methodePaiement,
        numeroTelephone: numeroTelephone || undefined,
        totalAPayer: calculateTotal(),
        ...(modeLocation === 'heure' ? { nombreHeures } : {})
      }
      
      await onConfirm(reservationData)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la réservation:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!chambre) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-md"
          aria-describedby="reservation-error-description"
        >
                  <DialogHeader>
          <DialogTitle>Erreur</DialogTitle>
        </DialogHeader>
        
        {/* Description pour l'accessibilité */}
        <div id="reservation-error-description" className="sr-only">
          Erreur : impossible d'afficher la réservation
        </div>
        
        <div className="text-center text-red-600 font-semibold py-8">
            Impossible d'afficher la réservation : la chambre sélectionnée est introuvable ou a été supprimée.
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white">Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="reservation-form-description"
      >
        <DialogHeader>
          <DialogTitle className="font-baloo text-xl text-lokaz-black">
            Réserver la Chambre {chambre.numero_chambre}
          </DialogTitle>
          <DialogDescription>
            Complétez les informations pour finaliser votre réservation
          </DialogDescription>
        </DialogHeader>
        
        {/* Description pour l'accessibilité */}
        <div id="reservation-form-description" className="sr-only">
          Formulaire de réservation pour la chambre {chambre.numero_chambre}
        </div>
        
        <div className="space-y-6">
          {/* Mode de location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Mode de location
            </Label>
            <Select value={modeLocation} onValueChange={(value: any) => setModeLocation(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chambre.prix_heure > 0 && (
                  <SelectItem value="heure">À l'heure ({chambre.prix_heure} FCFA/h)</SelectItem>
                )}
                {chambre.prix_jour > 0 && (
                  <SelectItem value="jour">À la journée ({chambre.prix_jour} FCFA/jour)</SelectItem>
                )}
                <SelectItem value="mois">Au mois ({chambre.prix} FCFA/mois)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Champ nombre d'heures si modeLocation === 'heure' */}
          {modeLocation === 'heure' && (
            <div className="space-y-2">
              <Label htmlFor="nombre-heures">Nombre d'heures</Label>
              <Input
                id="nombre-heures"
                type="number"
                min={1}
                value={nombreHeures}
                onChange={e => setNombreHeures(Math.max(1, Number(e.target.value)))}
                required
              />
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateDebut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateDebut ? format(dateDebut, "PPP", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateDebut}
                    onSelect={setDateDebut}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Met à minuit
                      return date < today;
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateFin && "text-muted-foreground"
                    )}
                    disabled={modeLocation === 'heure'}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFin ? format(dateFin, "PPP", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFin}
                    onSelect={setDateFin}
                    disabled={(date) => date < (dateDebut || new Date())}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Méthode de paiement */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Méthode de paiement
            </Label>
            <Select value={methodePaiement} onValueChange={setMethodePaiement}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tmoney">T-Money</SelectItem>
                <SelectItem value="flooz">Flooz</SelectItem>
                <SelectItem value="orange">Orange Money</SelectItem>
                <SelectItem value="carte">Carte bancaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Numéro de téléphone pour mobile money */}
          {['tmoney', 'flooz', 'orange'].includes(methodePaiement) && (
            <div className="space-y-2">
              <Label htmlFor="telephone" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Numéro de téléphone
              </Label>
              <Input
                id="telephone"
                placeholder="+228 XX XX XX XX"
                value={numeroTelephone}
                onChange={(e) => setNumeroTelephone(e.target.value)}
                required
              />
            </div>
          )}

          {/* Récapitulatif */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Récapitulatif de la réservation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Chambre:</span>
                  <span>{chambre.numero_chambre}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="capitalize">{modeLocation}</span>
                </div>
                {dateDebut && dateFin && (
                  <div className="flex justify-between">
                    <span>Période:</span>
                    <span>
                      {format(dateDebut, "dd/MM/yyyy", { locale: fr })} - 
                      {format(dateFin, "dd/MM/yyyy", { locale: fr })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Paiement:</span>
                  <span className="capitalize">{methodePaiement}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lokaz-orange">
                  <span>Total:</span>
                  <span>{calculateTotal().toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boutons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-lokaz-orange hover:bg-lokaz-orange-light text-white"
              disabled={loading || !dateDebut || (modeLocation !== 'heure' && !dateFin) || (methodePaiement !== 'carte' && !numeroTelephone)}
            >
              {loading ? 'Confirmation...' : `Confirmer (${calculateTotal().toLocaleString('fr-FR')} FCFA)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReservationModal
