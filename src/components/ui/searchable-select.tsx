'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'

export interface Option {
  value: string
  label: string
  // Optional extra data for custom rendering or selection logic
  description?: string 
}

interface SearchableSelectProps {
  options: Option[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  direction?: 'up' | 'down'
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  required = false,
  className = '',
  direction = 'down',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((opt) => opt.value === value)
  
  const filteredOptions = options.filter((opt) => 
    opt.label.toLowerCase().includes(search.toLowerCase()) || 
    opt.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hidden input for HTML required validation if needed */}
      {required && (
        <input 
          type="text" 
          required 
          value={value || ''} 
          onChange={() => {}} 
          className="opacity-0 absolute inset-0 w-full h-full pointer-events-none -z-10" 
        />
      )}

      {/* Select Trigger */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setSearch('')
        }}
        className="w-full flex items-center justify-between rounded-xl border border-brand-200 bg-white/50 px-4 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 shadow-sm transition-all text-left min-h-[42px]"
      >
        <span className={selectedOption ? 'text-brand-900' : 'text-brand-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-brand-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute z-50 w-full bg-white border border-brand-200 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[300px] ${direction === 'up' ? 'bottom-full mb-1' : 'mt-1'}`}>
          <div className="p-2 border-b border-brand-100 flex items-center gap-2 sticky top-0 bg-white">
            <Search className="h-4 w-4 text-brand-400 shrink-0" />
            <input
              type="text"
              autoFocus
              className="w-full bg-transparent border-none focus:ring-0 text-sm py-1 placeholder:text-brand-400 text-brand-900"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="overflow-y-auto p-1 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-brand-500">No results found.</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    value === opt.value
                      ? 'bg-brand-50 text-brand-900 font-medium'
                      : 'text-brand-700 hover:bg-brand-50 hover:text-brand-900'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    {opt.description && (
                      <span className="text-xs text-brand-500 mt-0.5 line-clamp-1">{opt.description}</span>
                    )}
                  </div>
                  {value === opt.value && <Check className="h-4 w-4 text-brand-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
