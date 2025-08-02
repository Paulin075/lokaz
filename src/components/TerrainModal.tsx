import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface TerrainModalProps {
  isOpen: boolean;
  onClose: () => void;
  terrain?: any;
}

const TerrainModal: React.FC<TerrainModalProps> = ({ isOpen, onClose, terrain }) => {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    adresse: '',
    quartier: '',
    ville: '',
    superficie_m2: '',
    prix: '',
    type_terrain: 'residentiel',
    photos: []
  });

  useEffect(() => {
    if (terrain) {
      setFormData({
        titre: terrain.titre || '',
        description: terrain.description || '',
        adresse: terrain.adresse || '',
        quartier: terrain.quartier || '',
        ville: terrain.ville || '',
        superficie_m2: terrain.superficie_m2 ? terrain.superficie_m2.toString() : '',
        prix: terrain.prix ? terrain.prix.toString() : '',
        type_terrain: terrain.type_terrain || 'residentiel',
        photos: terrain.photos ? JSON.parse(terrain.photos) : []
      });
      setPhotos(terrain.photos ? JSON.parse(terrain.photos) : []);
    } else {
      setFormData({
        titre: '',
        description: '',
        adresse: '',
        quartier: '',
        ville: '',
        superficie_m2: '',
        prix: '',
        type_terrain: 'residentiel',
        photos: []
      });
      setPhotos([]);
    }
  }, [terrain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setLoading(true);

    try {
      let photoUrls: string[] = [...photos];
      
      // Upload des photos avec gestion d'erreur améliorée
      if (photoFiles.length > 0) {
        for (const file of photoFiles) {
          try {
            // Vérifier la taille du fichier (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
              toast({ 
                title: 'Erreur', 
                description: `Le fichier ${file.name} est trop volumineux (max 5MB)`, 
                variant: 'destructive' 
              });
              setLoading(false);
              return;
            }

            const fileName = `terrain-${Date.now()}-${file.name}`;
            
            // Upload avec timeout plus long
            const { data, error } = await supabase.storage
              .from('proprietes-images')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });
              
            if (error) {
              console.error('Erreur upload:', error);
              throw new Error(`Erreur upload: ${error.message}`);
            }
            
            const { data: urlData } = supabase.storage
              .from('proprietes-images')
              .getPublicUrl(data.path);
              
            photoUrls.push(urlData.publicUrl);
          } catch (uploadError) {
            console.error('Erreur upload fichier:', uploadError);
            toast({ 
              title: 'Erreur upload', 
              description: `Impossible d'uploader ${file.name}: ${uploadError.message}`, 
              variant: 'destructive' 
            });
            setLoading(false);
            return;
          }
        }
        photoUrls = photoUrls.slice(0, 5);
      }

      const terrainData = {
        id_proprietaire: userData.id,
        id_proprietaire_uuid: userData.uuid,
        titre: formData.titre,
        description: formData.description,
        adresse: formData.adresse,
        quartier: formData.quartier,
        ville: formData.ville,
        superficie_m2: parseFloat(formData.superficie_m2) || 0,
        prix: parseFloat(formData.prix) || 0,
        type_terrain: formData.type_terrain,
        photos: JSON.stringify(photoUrls)
      };

      console.log('Données terrain à envoyer:', terrainData);

      if (terrain) {
        // Mise à jour
        const { error } = await supabase
          .from('terrains')
          .update(terrainData)
          .eq('id', terrain.id);
        if (error) {
          console.error('Erreur mise à jour:', error);
          throw error;
        }
        toast({ title: 'Succès', description: 'Terrain mis à jour avec succès' });
      } else {
        // Création
        const { error } = await supabase
          .from('terrains')
          .insert([terrainData]);
        if (error) {
          console.error('Erreur création:', error);
          throw error;
        }
        toast({ title: 'Succès', description: 'Terrain ajouté avec succès' });
      }

      onClose();
    } catch (error) {
      console.error('Erreur complète:', error);
      toast({ 
        title: 'Erreur', 
        description: `Une erreur est survenue: ${error.message}`, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="terrain-modal-description">
        <DialogHeader>
          <DialogTitle>
            {terrain ? 'Modifier le terrain' : 'Ajouter un nouveau terrain'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Description pour l'accessibilité */}
        <div id="terrain-modal-description" className="sr-only">
          Formulaire pour {terrain ? 'modifier' : 'ajouter'} un terrain à vendre
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre du terrain *</Label>
              <Input
                id="titre"
                value={formData.titre}
                onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type_terrain">Type de terrain *</Label>
              <Select value={formData.type_terrain} onValueChange={(value) => setFormData(prev => ({ ...prev, type_terrain: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residentiel">Résidentiel</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="agricole">Agricole</SelectItem>
                  <SelectItem value="industriel">Industriel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ville">Ville *</Label>
              <Input
                id="ville"
                value={formData.ville}
                onChange={(e) => setFormData(prev => ({ ...prev, ville: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quartier">Quartier *</Label>
              <Input
                id="quartier"
                value={formData.quartier}
                onChange={(e) => setFormData(prev => ({ ...prev, quartier: e.target.value }))}
                placeholder="Ex: Tokoin, Bé, Agoè, etc."
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse complète *</Label>
            <Input
              id="adresse"
              value={formData.adresse}
              onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
              required
              placeholder="Collez ici le lien Google Maps de l'adresse pour un accès facile"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="superficie_m2">Superficie (m²) *</Label>
              <Input
                id="superficie_m2"
                type="number"
                min="0"
                value={formData.superficie_m2}
                onChange={(e) => setFormData(prev => ({ ...prev, superficie_m2: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prix">Prix (FCFA) *</Label>
              <Input
                id="prix"
                type="number"
                min="0"
                value={formData.prix}
                onChange={(e) => setFormData(prev => ({ ...prev, prix: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Décrivez le terrain, ses avantages, accès, etc."
            />
          </div>

          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {photos.map((url, idx) => (
                <img key={idx} src={url} alt={`Photo ${idx + 1}`} className="w-20 h-20 object-cover rounded border" />
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>Photos (2 à 5)</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={e => {
                if (!e.target.files) return;
                const files = Array.from(e.target.files);
                if (files.length + photos.length > 5) {
                  toast({ title: 'Erreur', description: 'Maximum 5 photos au total', variant: 'destructive' });
                  return;
                }
                setPhotoFiles(files);
              }}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-lokaz-orange hover:bg-lokaz-orange/90 text-white">
              {loading ? 'Enregistrement...' : (terrain ? 'Mettre à jour' : 'Ajouter')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TerrainModal; 