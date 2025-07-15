
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Smartphone, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface PaymentProps {
  amount: number
  reservationId: number
  onSuccess: () => void
  onCancel: () => void
}

const Payment: React.FC<PaymentProps> = ({ amount, reservationId, onSuccess, onCancel }) => {
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentData, setPaymentData] = useState({
    phoneNumber: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: ''
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const paymentMethods = [
    { id: 'tmoney', name: 'T-Money', icon: '📱', type: 'mobile' },
    { id: 'flooz', name: 'Flooz', icon: '💳', type: 'mobile' },
    { id: 'orange_money', name: 'Orange Money', icon: '🟠', type: 'mobile' },
    { id: 'card', name: 'Carte Bancaire', icon: '💳', type: 'card' }
  ]

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un moyen de paiement",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Simuler le traitement du paiement
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Enregistrer le paiement dans la base de données
      const { error: paymentError } = await supabase
        .from('paiements')
        .insert({
          id_facture: null, // Sera lié à une facture ultérieurement
          montant: amount,
          moyen_paiement: paymentMethod,
          date_paiement: new Date().toISOString()
        })

      if (paymentError) throw paymentError

      // Mettre à jour le statut de la réservation
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({ statut: 'confirmee' })
        .eq('id', reservationId)

      if (reservationError) throw reservationError

      toast({
        title: "Paiement réussi",
        description: `Votre paiement de ${amount.toLocaleString()} FCFA a été traité avec succès`,
      })

      onSuccess()
    } catch (error) {
      console.error('Erreur lors du paiement:', error)
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue lors du traitement du paiement",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedMethod = paymentMethods.find(m => m.id === paymentMethod)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-lokaz-orange" />
          Paiement
        </CardTitle>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Montant à payer :</span>
          <Badge className="bg-lokaz-orange text-white font-bold">
            {amount.toLocaleString()} FCFA
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection du moyen de paiement */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Choisissez votre moyen de paiement
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-3 border rounded-lg text-center transition-all ${
                  paymentMethod === method.id
                    ? 'border-lokaz-orange bg-lokaz-orange/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{method.icon}</div>
                <div className="text-sm font-medium">{method.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Formulaire de paiement */}
        {selectedMethod && (
          <div className="space-y-4">
            {selectedMethod.type === 'mobile' ? (
              <div>
                <Label htmlFor="phoneNumber">
                  Numéro {selectedMethod.name}
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="XX XX XX XX"
                  value={paymentData.phoneNumber}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    phoneNumber: e.target.value
                  })}
                />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="holderName">Nom du titulaire</Label>
                  <Input
                    id="holderName"
                    placeholder="Jean Dupont"
                    value={paymentData.holderName}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      holderName: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="cardNumber">Numéro de carte</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      cardNumber: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Date d'expiration</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={paymentData.expiryDate}
                      onChange={(e) => setPaymentData({
                        ...paymentData,
                        expiryDate: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData({
                        ...paymentData,
                        cvv: e.target.value
                      })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Informations de sécurité */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Paiement sécurisé</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Vos données sont protégées par un chiffrement SSL
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handlePayment}
            className="flex-1 bg-lokaz-orange hover:bg-lokaz-orange-light"
            disabled={loading || !paymentMethod}
          >
            {loading ? 'Traitement...' : `Payer ${amount.toLocaleString()} FCFA`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default Payment
