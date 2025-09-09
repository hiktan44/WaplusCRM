'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { INSTITUTIONS, DATE_RANGES, DEPARTMENTS } from '@/lib/constants';
import { Institution, SearchParams, DateRange } from '@/types';
import Button from '@/components/ui/Button';

interface SearchInterfaceProps {
  onSearch: (params: SearchParams) => void;
  loading?: boolean;
}

export default function SearchInterface({ onSearch, loading }: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [selectedInstitutions, setSelectedInstitutions] = useState<Institution[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });

  const handleInstitutionToggle = (institutionId: Institution) => {
    setSelectedInstitutions(prev => {
      if (prev.includes(institutionId)) {
        return prev.filter(id => id !== institutionId);
      } else {
        return [...prev, institutionId];
      }
    });
  };

  const handleSelectAllInstitutions = () => {
    if (selectedInstitutions.length === INSTITUTIONS.length) {
      setSelectedInstitutions([]);
    } else {
      setSelectedInstitutions(INSTITUTIONS.map(inst => inst.id));
    }
  };

  const handleSearch = () => {
    if (!query.trim()) {
      return;
    }

    let dateRange: DateRange | undefined;
    if (selectedDateRange) {
      const range = DATE_RANGES.find(dr => dr.label === selectedDateRange);
      if (range) {
        dateRange = { start: range.start, end: range.end };
      }
    } else if (customDateRange.start && customDateRange.end) {
      dateRange = {
        start: new Date(customDateRange.start),
        end: new Date(customDateRange.end)
      };
    }

    const searchParams: SearchParams = {
      query: query.trim(),
      institutions: selectedInstitutions.length > 0 ? selectedInstitutions : INSTITUTIONS.map(inst => inst.id),
      dateRange,
      department: selectedDepartment || undefined,
      page: 1,
      limit: 20
    };

    onSearch(searchParams);
  };

  const handleQuickSearch = (institutionId: Institution) => {
    if (!query.trim()) return;
    
    const searchParams: SearchParams = {
      query: query.trim(),
      institutions: [institutionId],
      page: 1,
      limit: 20
    };

    onSearch(searchParams);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Main Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label htmlFor="main-search" className="sr-only">Arama</label>
          <input
            id="main-search"
            type="text"
            placeholder="Arama terimi girin (örn: 'iş sözleşmesi', 'tazminat', 'kira')"
            className="input-field text-lg py-3 px-4"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSearch} 
            loading={loading}
            size="lg"
            className="px-8"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Ara
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Gelişmiş
          </Button>
        </div>
      </div>

      {/* Quick Institution Search */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        {INSTITUTIONS.slice(0, 6).map((institution) => (
          <Button
            key={institution.id}
            variant="outline"
            size="sm"
            onClick={() => handleQuickSearch(institution.id)}
            className="flex items-center justify-center p-3 h-auto"
            disabled={!query.trim() || loading}
            aria-label={`${institution.name} içinde hızlı arama yap`}
          >
            <div className="text-center">
              <div className="text-lg mb-1">{institution.icon}</div>
              <div className="text-xs font-medium">{institution.name}</div>
            </div>
          </Button>
        ))}
      </div>

      {/* Advanced Search Options */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 pt-6"
          >
            {/* Institution Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Kurumlar</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSelectAllInstitutions}
                >
                  {selectedInstitutions.length === INSTITUTIONS.length ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {INSTITUTIONS.map((institution) => (
                  <label
                    key={institution.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                      checked={selectedInstitutions.includes(institution.id)}
                      onChange={() => handleInstitutionToggle(institution.id)}
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{institution.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{institution.name}</div>
                        <div className="text-xs text-gray-500">{institution.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range and Department Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Date Range */}
              <div>
                <label htmlFor="date-range-select" className="block text-sm font-medium text-gray-900 mb-2">
                  Tarih Aralığı
                </label>
                <select
                  id="date-range-select"
                  className="input-field"
                  value={selectedDateRange}
                  onChange={(e) => {
                    setSelectedDateRange(e.target.value);
                    if (e.target.value) {
                      setCustomDateRange({ start: '', end: '' });
                    }
                  }}
                >
                  <option value="">Tüm Tarihler</option>
                  {DATE_RANGES.map((range) => (
                    <option key={range.label} value={range.label}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Date Range */}
              <div>
                <label htmlFor="custom-date-start" className="block text-sm font-medium text-gray-900 mb-2">
                  Özel Tarih Aralığı
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="custom-date-start"
                    type="date"
                    className="input-field text-sm"
                    value={customDateRange.start}
                    onChange={(e) => {
                      setCustomDateRange(prev => ({ ...prev, start: e.target.value }));
                      if (e.target.value) setSelectedDateRange('');
                    }}
                    aria-label="Başlangıç tarihi"
                  />
                  <input
                    id="custom-date-end"
                    type="date"
                    className="input-field text-sm"
                    value={customDateRange.end}
                    onChange={(e) => {
                      setCustomDateRange(prev => ({ ...prev, end: e.target.value }));
                      if (e.target.value) setSelectedDateRange('');
                    }}
                    aria-label="Bitiş tarihi"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department-select" className="block text-sm font-medium text-gray-900 mb-2">
                  Daire/Kurul
                </label>
                <select
                  id="department-select"
                  className="input-field"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="">Tüm Daireler</option>
                  {selectedInstitutions.length === 1 && DEPARTMENTS[selectedInstitutions[0]] && 
                    DEPARTMENTS[selectedInstitutions[0]]?.map((dept: string) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>

            {/* Search Button for Advanced */}
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleSearch} 
                loading={loading}
                size="lg"
                className="px-8"
              >
                Gelişmiş Arama Yap
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 