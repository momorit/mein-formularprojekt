import React from 'react'

interface FormFieldProps {
  field: {
    id: string
    label: string
    type: string
    required: boolean
    placeholder?: string
    options?: string[]
  }
  value: string
  onChange: (value: string) => void
}

export const FormField: React.FC<FormFieldProps> = ({ field, value, onChange }) => {
  if (!field || typeof field !== 'object') {
    return null // Verhindert React Error #31
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const commonProps = {
    id: field.id,
    name: field.id,
    required: field.required,
    value: value || '',
    onChange: handleChange,
    className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  }

  switch (field.type) {
    case 'select':
      return (
        <div className="mb-4">
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select {...commonProps}>
            <option value="">{field.placeholder || 'Bitte wählen'}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )

    case 'textarea':
      return (
        <div className="mb-4">
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea 
            {...commonProps}
            rows={3}
            placeholder={field.placeholder}
          />
        </div>
      )

    case 'number':
      return (
        <div className="mb-4">
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input 
            {...commonProps}
            type="number"
            placeholder={field.placeholder}
          />
        </div>
      )

    default:
      return (
        <div className="mb-4">
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input 
            {...commonProps}
            type={field.type}
            placeholder={field.placeholder}
          />
        </div>
      )
  }
}