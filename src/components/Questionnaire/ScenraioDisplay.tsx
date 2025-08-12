// src/components/ScenarioDisplay.tsx - Verbessertes Szenario Display

import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText, Home } from 'lucide-react'

interface ScenarioDisplayProps {
  variant?: 'A' | 'B'
  showOnPages?: ('questionnaire' | 'form' | 'dialog' | 'comparison')[]
  currentPage?: string
  className?: string
}

const SCENARIO_TEXT = `
**Szenario: Gebäude-Energieberatung**

Sie sind Eigentümer eines Mehrfamilienhauses und möchten eine staatliche Förderung für eine energetische Sanierung beantragen. 

Dafür müssen Sie ein umfangreiches Formular ausfüllen, das detaillierte Informationen zu Ihrem Gebäude erfordert:

• **Gebäudedaten:** Baujahr, Wohnfläche, Anzahl Stockwerke
• **Energetische Details:** Heizungsart, Dämmung, Fenstertypen  
• **Technische Angaben:** U-Werte, Energieverbrauch, bauliche Besonderheiten
• **Rechtliche Informationen:** Eigentümerdaten, Nutzungsart

**Ihre Aufgabe:** Füllen Sie das Formular so vollständig und korrekt wie möglich aus. Bei Unsicherheiten können Sie jederzeit nachfragen.
`

export default function ScenarioDisplay({ 
  variant, 
  showOnPages = ['form', 'dialog', 'questionnaire'],
  currentPage = '',
  className = ''
}: ScenarioDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Prüfen ob Szenario auf dieser Seite angezeigt werden soll
  const shouldShow = showOnPages.some(page => 
    currentPage.includes(page) || 
    window.location.pathname.includes(page) ||
    window.location.pathname.includes('study')
  )

  if (!shouldShow && showOnPages.length > 0) {
    return null
  }

  const toggleExpansion = () => {
    if (isExpanded) {
      setIsExpanded(false)
      setIsCollapsed(true)
    } else {
      setIsExpanded(true)
      setIsCollapsed(false)
    }
  }

  const formatScenarioText = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        line = line.trim()
        if (!line) return null
        
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <h3 key={index} className="font-bold text-blue-900 mt-4 mb-2 first:mt-0">
              {line.replace(/\*\*/g, '')}
            </h3>
          )
        }
        
        if (line.startsWith('• ')) {
          return (
            <li key={index} className="text-gray-700 mb-1 ml-4">
              <strong className="text-gray-900">{line.substring(2).split(':')[0]}:</strong>
              {line.substring(2).split(':').slice(1).join(':')}
            </li>
          )
        }
        
        if (line.length > 10) {
          return (
            <p key={index} className="text-gray-700 mb-3">
              {line}
            </p>
          )
        }
        
        return null
      })
      .filter(Boolean)
  }

  return (
    <div className={`bg-blue-50 border-l-4 border-blue-400 ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={toggleExpansion}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-200 rounded-full">
            <FileText className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-blue-900">
              Aufgabe: Förderantrag ausfüllen
              {variant && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded-full">
                  Variante {variant}
                </span>
              )}
            </h2>
            {isCollapsed && (
              <p className="text-sm text-blue-700">
                Gebäude-Energieberatung • Staatliche Förderung
              </p>
            )}
          </div>
        </div>
        
        <button className="text-blue-600 hover:text-blue-800 transition-colors">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
            <div className="prose prose-sm max-w-none">
              {formatScenarioText(SCENARIO_TEXT)}
            </div>
            
            {/* Hilfreiche Hinweise */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Hilfreiche Gebäudedaten (Beispiel)
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <strong>Baujahr:</strong> 1985<br/>
                  <strong>Wohnfläche:</strong> 420 m²<br/>
                  <strong>Stockwerke:</strong> 3 + Dachgeschoss
                </div>
                <div>
                  <strong>Heizung:</strong> Gas-Brennwert<br/>
                  <strong>Dämmung:</strong> Teilweise vorhanden<br/>
                  <strong>Fenster:</strong> Doppelverglasung
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}