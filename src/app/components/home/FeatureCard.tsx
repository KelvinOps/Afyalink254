// app/components/home/FeatureCard.tsx
'use client'

import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '../ui/card'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  color: string
  bgColor: string
  gradientFrom: string
  gradientTo: string
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  bgColor,
  gradientFrom,
  gradientTo
}: FeatureCardProps) {
  return (
    <Card className="border border-gray-200 shadow-lg hover:shadow-xl group hover:scale-[1.02] transition-all duration-300">
      <CardContent className="p-6 text-center">
        <div className={`w-16 h-16 rounded-2xl ${bgColor} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <h3 className={`text-xl font-bold ${color} mb-3`}>
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}