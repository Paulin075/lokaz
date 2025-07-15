
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Droplets, Zap, Calculator, Calendar, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface MonthlyBillingModalProps {
  isOpen: boolean
  onClose: () => void
  reservationId: number
  prixEau: number
  prixElectricite: number
  prixLoyer: number
}

const MonthlyBillingModal: React.FC<MonthlyBillingModalProps> = ({
  isOpen,
  onClose,
  reservationId,
  prixEau,
  prixElectricite,
  prixLoyer
}) => {
  const [formData, setFormData] = useState({
    compteurEau: '',
    compteurElectricite: '',
    consommationEauPrecedente: '',
    consommationElectricitePrecedente: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const calculateTotal = () => {
    const eauActuel = parseFloat(formData.compteurEau) || 0
    const eauPrecedent = parseFloat(formData.consommationEauPrecedente) || 0
    const electriciteActuel = parseFloat(formData.compteurElectricite) || 0
    const electricitePrecedent = parseFloat(formData.consommationElectricitePrecedente) || 0

    const consommationEau = Math.max(0, eauActuel - eauPrecedent)
    const consommationElectricite = Math.max(0, electriciteActuel - electricitePrecedent)

    const montantEau = consommationEau * prixEau
    const montantElectricite = consommationElectricite * prixElectricite

    return {
      consommationEau,
      consommationElectricite,
      montantEau,
      montantElectricite,
      total: prixLoyer + montantEau + montantElectricite
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.compteurEau || !formData.compteurElectricite) {
      setError('Veuillez remplir tous les champs obligatoires')
      setLoading(false)
      return
    }

    try {
      const calculation = calculateTotal()

      // Enregistrer le relevé de compteur
      const { error: releveError } = await supabase
        .from('releve_compteur')
        .insert([
          {
            id_reservation: reservationId,
            date_releve: new Date().toISOString(),
            compteur_eau: parseFloat(formData.compteurEau),
            compteur_electricite: parseFloat(formData.compteurElectricite),
            saisi_par: 'locataire'
          }
        ])

      if (releveError) {
        setError('Erreur lors de l\'enregistrement du relevé')
        return
      }

      // Créer la facture
      const { error: factureError } = await supabase
        .from('factures')
        .insert([
          {
            id_reservation: reservationId,
            date_facture: new Date().toISOString(),
            montant_loyer: prixLoyer,
            consommation_eau: calculation.consommationEau,
            consommation_electricite: calculation.consommationElectricite,
            montant_eau: calculation.montantEau,
            montant_electricite: calculation.montantElectricite,
            total_a_payer: calculation.total,
            statut_paiement: 'impayé'
          }
        ])

      if (factureError) {
        setError('Erreur lors de la création de la facture')
        return
      }

      onClose()
    } catch (err: any) {
      setError(`Erreur: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const calculation = calculateTotal()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-lokaz-orange" />
              Facturation Mensuelle
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Calendar className="h-4 w-4" />
            <span>Relevé pour le mois de {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Compteur d'eau */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  Compteur d'Eau
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="compteurEau">Relevé actuel (m³) *</Label>
                  <Input
                    id="compteurEau"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 150.5"
                    value={formData.compteurEau}
                    onChange={(e) => handleInputChange('compteurEau', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="consommationEauPrecedente">Relevé précédent (m³)</Label>
                  <Input
                    id="consommationEauPrecedente"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 145.2"
                    value={formData.consommationEauPrecedente}
                    onChange={(e) => handleInputChange('consommationEauPrecedente', e.target.value)}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Prix: {prixEau} FCFA/m³
                </div>
              </CardContent>
            </Card>

            {/* Compteur d'électricité */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Compteur d'Électricité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="compteurElectricite">Relevé actuel (kWh) *</Label>
                  <Input
                    id="compteurElectricite"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 320.8"
                    value={formData.compteurElectricite}
                    onChange={(e) => handleInputChange('compteurElectricite', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="consommationElectricitePrecedente">Relevé précédent (kWh)</Label>
                  <Input
                    id="consommationElectricitePrecedente"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 298.5"
                    value={formData.consommationElectricitePrecedente}
                    onChange={(e) => handleInputChange('consommationElectricitePrecedente', e.target.value)}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Prix: {prixElectricite} FCFA/kWh
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calcul du total */}
          <Card className="bg-lokaz-orange/5">
            <CardHeader>
              <CardTitle className="text-lg">Récapitulatif de la facture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Loyer mensuel:</span>
                <span className="font-medium">{prixLoyer.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span>Eau ({calculation.consommationEau.toFixed(1)} m³):</span>
                <span className="font-medium">{calculation.montantEau.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span>Électricité ({calculation.consommationElectricite.toFixed(1)} kWh):</span>
                <span className="font-medium">{calculation.montantElectricite.toLocaleString()} FCFA</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-lg font-bold text-lokaz-orange">
                <span>Total à payer:</span>
                <span>{calculation.total.toLocaleString()} FCFA</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-lokaz-orange hover:bg-lokaz-orange-light"
            >
              {loading ? 'Génération...' : 'Générer la facture'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default MonthlyBillingModal
