import { Card, CardContent } from '@/app/components/ui/card'
import { cn } from '@/app/lib/utils'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        {icon && (
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            {icon}
          </div>
        )}
        
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        
        {action && (
          <div className="flex flex-col sm:flex-row gap-2">
            {action}
          </div>
        )}
      </CardContent>
    </Card>
  )
}