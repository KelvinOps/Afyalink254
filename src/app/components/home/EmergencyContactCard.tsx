// app/components/home/EmergencyContactCard.tsx
'use client'

import { LucideIcon } from 'lucide-react'

interface EmergencyContactCardProps {
  icon: LucideIcon
  name: string
  number: string
  description: string
}

export default function EmergencyContactCard({
  icon: Icon,
  name,
  number,
  description
}: EmergencyContactCardProps) {
  return (
    <div className="text-center p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300">
      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <div className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 text-transparent bg-clip-text">
        {number}
      </div>
      <p className="text-blue-100">{description}</p>
    </div>
  )
}