'use client'

import { Home, CheckSquare, FolderOpen, Settings } from 'lucide-react'

interface BottomNavigationProps {
  activeTab: 'activity' | 'todos' | 'collections' | 'settings'
  onTabChange: (tab: 'activity' | 'todos' | 'collections' | 'settings') => void
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'collections' as const, icon: FolderOpen, label: 'Collections', position: 'top-left' },
    { id: 'todos' as const, icon: CheckSquare, label: 'To-do\'s', position: 'top-right' },
    { id: 'activity' as const, icon: Home, label: 'Home', position: 'bottom-left' },
    { id: 'settings' as const, icon: Settings, label: 'Work', position: 'bottom-right' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border">
      <div className="grid grid-cols-2 gap-1 p-4 max-w-sm mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg transition-all
                ${isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}