// src/components/Questionnaire/DemographicsForm.tsx
import React from 'react'

interface DemographicsFormProps {
  formData: any
  onChange: (data: any) => void
}

export const DemographicsForm: React.FC<DemographicsFormProps> = ({
  formData,
  onChange
}) => {
  const handleChange = (key: string, value: any) => {
    onChange({
      ...formData,
      [key]: value
    })
  }

  const completedFields = Object.values(formData).filter(value => 
    value !== '' && value !== null && value !== undefined && value !== 0
  ).length
  const totalFields = 7
  const progress = (completedFields / totalFields) * 100

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-2">
          👤 Demografische Daten
        </h3>
        <p className="text-sm text-blue-700 mb-3">
          Diese Informationen helfen uns, die Ergebnisse besser zu verstehen. 
          Alle Daten werden anonym behandelt.
        </p>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-blue-600 mt-1">
          {completedFields} von {totalFields} Felder ausgefüllt
        </p>
      </div>

      {/* Age */}
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          1. Wie alt sind Sie? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['18-25', '26-35', '36-45', '46-55', '56-65', '66+'].map((ageRange) => (
            <label key={ageRange} className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="age"
                value={ageRange}
                checked={formData.age === ageRange}
                onChange={() => handleChange('age', ageRange)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                required
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-blue-700">
                {ageRange} Jahre
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Role */}
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          2. In welcher Rolle haben Sie mit Immobilienformularen zu tun? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {[
            'Eigenheimbesitzer/in', 
            'Vermieter/in', 
            'Immobilienverwalter/in',
            'Makler/in',
            'Mieter/in',
            'Andere'
          ].map((role) => (
            <label key={role} className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="role"
                value={role}
                checked={formData.role === role}
                onChange={() => handleChange('role', role)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                required
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-blue-700">
                {role}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          3. Wie viel Erfahrung haben Sie mit Immobilien-/Gebäudeformularen? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {[
            'Weniger als 1 Jahr', 
            '1-3 Jahre', 
            '3-10 Jahre',
            'Mehr als 10 Jahre',
            'Keine Erfahrung'
          ].map((exp) => (
            <label key={exp} className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="experience"
                value={exp}
                checked={formData.experience === exp}
                onChange={() => handleChange('experience', exp)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                required
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-blue-700">
                {exp}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tech Affinity */}
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-900 mb-4">
          4. Wie technikaffin sind Sie? <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
          <span>Gar nicht technikaffin</span>
          <span>Sehr technikaffin</span>
        </div>
        <div className="flex justify-center space-x-6">
          {[1, 2, 3, 4, 5].map((num) => (
            <label key={num} className="flex flex-col items-center cursor-pointer group">
              <input
                type="radio"
                name="techAffinity"
                value={num}
                checked={formData.techAffinity === num}
                onChange={() => handleChange('techAffinity', num)}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                required
              />
              <span className="text-sm mt-2 text-gray-600 group-hover:text-blue-600 font-medium">
                {num}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Form Frequency */}
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          5. Wie oft füllen Sie Online-Formulare (allgemein) aus? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {[
            'Täglich', 
            'Mehrmals pro Woche', 
            'Etwa einmal pro Woche',
            'Mehrmals pro Monat',
            'Etwa einmal pro Monat',
            'Seltener als einmal pro Monat'
          ].map((freq) => (
            <label key={freq} className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="formularFrequency"
                value={freq}
                checked={formData.formularFrequency === freq}
                onChange={() => handleChange('formularFrequency', freq)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                required
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-blue-700">
                {freq}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Device */}
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          6. Welches Gerät nutzen Sie hauptsächlich für diese Studie? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Desktop-PC', 'Laptop', 'Tablet', 'Smartphone'].map((device) => (
            <label key={device} className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="device"
                value={device}
                checked={formData.device === device}
                onChange={() => handleChange('device', device)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                required
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-blue-700">
                {device}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Browser - Auto-detected */}
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          7. Browser (automatisch erkannt)
        </label>
        <p className="text-sm text-gray-600">
          {getBrowserName()} - {formData.browser || 'Unbekannt'}
        </p>
        {!formData.browser && (
          <button
            type="button"
            onClick={() => handleChange('browser', getBrowserName())}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Browser erkennen
          </button>
        )}
      </div>
    </div>
  )
}

function getBrowserName(): string {
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Edg')) return 'Edge'
  return 'Unbekannt'
}