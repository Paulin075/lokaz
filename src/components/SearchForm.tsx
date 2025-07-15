
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Filter, MapPin, Home, Clock } from 'lucide-react'
import { useProperties } from '@/hooks/useProperties'

interface SearchFilters {
  ville: string
  quartier: string
  type_location: string
  prix_min: string
  prix_max: string
  nb_chambres: string
  garage: boolean
  chap_chap: boolean
  superficie_min: string
}

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void
  loading?: boolean
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, loading = false }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    ville: '',
    quartier: '',
    type_location: '',
    prix_min: '',
    prix_max: '',
    nb_chambres: '',
    garage: false,
    chap_chap: false,
    superficie_min: ''
  })

  const { fetchVillesDistinctes } = useProperties();
  const [villes, setVilles] = useState<string[]>([]);

  React.useEffect(() => {
    fetchVillesDistinctes().then(setVilles);
  }, [fetchVillesDistinctes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(filters)
  }

  const resetFilters = () => {
    setFilters({
      ville: '',
      quartier: '',
      type_location: '',
      prix_min: '',
      prix_max: '',
      nb_chambres: '',
      garage: false,
      chap_chap: false,
      superficie_min: ''
    })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-lokaz-orange to-lokaz-orange-light text-white">
        <CardTitle className="flex items-center gap-2 font-baloo text-xl">
          <Search className="h-6 w-6" />
          Recherche Avancée
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Localisation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ville" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ville
              </Label>
              <Select
                value={filters.ville}
                onValueChange={(value) => setFilters(prev => ({ ...prev, ville: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une ville" />
                </SelectTrigger>
                <SelectContent>
                  {villes.map((ville) => (
                    <SelectItem key={ville} value={ville}>
                      {ville}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quartier">Quartier</Label>
              <Input
                id="quartier"
                placeholder="Ex: Bè, Nyékonakpoè..."
                value={filters.quartier}
                onChange={(e) => setFilters(prev => ({ ...prev, quartier: e.target.value }))}
              />
            </div>
          </div>

          {/* Type de location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Type de location
            </Label>
            <Select
              value={filters.type_location}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type_location: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mois">Au mois</SelectItem>
                <SelectItem value="jour">À la journée</SelectItem>
                <SelectItem value="heure">À l'heure (Chap-Chap)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prix_min">Prix minimum (FCFA)</Label>
              <Input
                id="prix_min"
                type="number"
                placeholder="0"
                value={filters.prix_min}
                onChange={(e) => setFilters(prev => ({ ...prev, prix_min: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prix_max">Prix maximum (FCFA)</Label>
              <Input
                id="prix_max"
                type="number"
                placeholder="500000"
                value={filters.prix_max}
                onChange={(e) => setFilters(prev => ({ ...prev, prix_max: e.target.value }))}
              />
            </div>
          </div>

          {/* Caractéristiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Nombre de chambres
              </Label>
              <Select
                value={filters.nb_chambres}
                onValueChange={(value) => setFilters(prev => ({ ...prev, nb_chambres: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Indifférent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 chambre</SelectItem>
                  <SelectItem value="2">2 chambres</SelectItem>
                  <SelectItem value="3">3 chambres</SelectItem>
                  <SelectItem value="4">4+ chambres</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="superficie_min">Superficie min. (m²)</Label>
              <Input
                id="superficie_min"
                type="number"
                placeholder="0"
                value={filters.superficie_min}
                onChange={(e) => setFilters(prev => ({ ...prev, superficie_min: e.target.value }))}
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Options</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="garage"
                  checked={filters.garage}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, garage: !!checked }))}
                />
                <Label htmlFor="garage" className="text-sm">Garage</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="chap_chap"
                  checked={filters.chap_chap}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, chap_chap: !!checked }))}
                />
                <Label htmlFor="chap_chap" className="text-sm">Chap-Chap disponible</Label>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-lokaz-orange hover:bg-lokaz-orange-light text-white font-medium"
              disabled={loading}
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Recherche...' : 'Rechercher'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              className="border-lokaz-orange text-lokaz-orange hover:bg-lokaz-orange hover:text-white"
            >
              <Filter className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default SearchForm
