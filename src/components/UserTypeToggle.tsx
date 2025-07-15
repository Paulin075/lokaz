
import React from 'react'
import { Home, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UserTypeToggleProps {
  selectedType: 'proprietaire' | 'locataire'
  onTypeChange: (type: 'proprietaire' | 'locataire') => void
  className?: string
}

const UserTypeToggle: React.FC<UserTypeToggleProps> = ({
  selectedType,
  onTypeChange,
  className
}) => {
  const types = [
    {
      value: 'proprietaire' as const,
      label: 'Propriétaire',
      icon: Home,
      color: 'text-lokaz-orange'
    },
    {
      value: 'locataire' as const,
      label: 'Locataire',
      icon: User,
      color: 'text-blue-600'
    }
  ]

  return (
    <div className={cn("flex bg-gray-100 rounded-lg p-1", className)}>
      {types.map((type) => {
        const Icon = type.icon
        return (
          <Button
            key={type.value}
            type="button" // Empêche le bouton de soumettre le formulaire
            variant="ghost"
            size="sm"
            onClick={() => onTypeChange(type.value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-10 rounded-md transition-all duration-200",
              selectedType === type.value
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Icon className={cn("h-4 w-4", selectedType === type.value && type.color)} />
            <span className="font-medium">{type.label}</span>
          </Button>
        )
      })}
    </div>
  )
}

export default UserTypeToggle
