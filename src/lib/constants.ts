import { InstitutionInfo } from '@/types';

export const INSTITUTIONS: InstitutionInfo[] = [
  {
    id: 'yargitay',
    name: 'Yargıtay',
    description: 'Türkiye Cumhuriyeti Yargıtay kararları ve emsal niteliğindeki kararlar',
    color: 'bg-red-500',
    icon: '⚖️',
    apiEndpoint: 'https://karararama.yargitay.gov.tr'
  },
  {
    id: 'danistay',
    name: 'Danıştay',
    description: 'Türkiye Cumhuriyeti Danıştay kararları ve idari yargı kararları',
    color: 'bg-blue-500',
    icon: '🏛️',
    apiEndpoint: 'https://karararama.danistay.gov.tr'
  },
  {
    id: 'emsal',
    name: 'Emsal (UYAP)',
    description: 'UYAP Emsal Karar Sistemi - Mahkeme kararları ve emsal kararlar',
    color: 'bg-green-500',
    icon: '📋',
    apiEndpoint: 'https://emsal.uyap.gov.tr'
  },
  {
    id: 'bedesten',
    name: 'Bedesten',
    description: 'Adalet Bakanlığı Bedesten Sistemi - Alternatif çözüm yolları',
    color: 'bg-purple-500',
    icon: '🏪',
    apiEndpoint: 'https://bedesten.adalet.gov.tr'
  },
  {
    id: 'uyusmazlik',
    name: 'Uyuşmazlık Mahkemesi',
    description: 'Uyuşmazlık Mahkemesi kararları ve yetki uyuşmazlığı çözümleri',
    color: 'bg-orange-500',
    icon: '⚡',
    apiEndpoint: 'https://kararlar.uyusmazlik.gov.tr'
  },
  {
    id: 'anayasa',
    name: 'Anayasa Mahkemesi',
    description: 'Anayasa Mahkemesi norm denetimi ve bireysel başvuru kararları',
    color: 'bg-indigo-500',
    icon: '📜',
    apiEndpoint: 'https://normkararlarbilgibankasi.anayasa.gov.tr'
  },
  {
    id: 'kik',
    name: 'Kamu İhale Kurumu',
    description: 'Kamu İhale Kurumu kararları ve ihale uyuşmazlık çözümleri',
    color: 'bg-teal-500',
    icon: '🏢',
    apiEndpoint: 'https://ekap.kik.gov.tr'
  },
  {
    id: 'rekabet',
    name: 'Rekabet Kurumu',
    description: 'Rekabet Kurumu kararları ve rekabet hukuku uygulamaları',
    color: 'bg-pink-500',
    icon: '📊',
    apiEndpoint: 'https://www.rekabet.gov.tr'
  },
  {
    id: 'sayistay',
    name: 'Sayıştay',
    description: 'Sayıştay denetim raporları ve mali denetim kararları',
    color: 'bg-cyan-500',
    icon: '💰',
    apiEndpoint: 'https://www.sayistay.gov.tr'
  },
  {
    id: 'kvkk',
    name: 'KVKK',
    description: 'Kişisel Verileri Koruma Kurumu kararları ve veri koruma rehberleri',
    color: 'bg-amber-500',
    icon: '🔒',
    apiEndpoint: 'https://www.kvkk.gov.tr'
  },
  {
    id: 'bddk',
    name: 'BDDK',
    description: 'Bankacılık Düzenleme ve Denetleme Kurumu mevzuat ve kararları',
    color: 'bg-emerald-500',
    icon: '🏦',
    apiEndpoint: 'https://www.bddk.org.tr'
  }
];

export const DATE_RANGES = [
  {
    label: 'Son 1 Ay',
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  },
  {
    label: 'Son 3 Ay',
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    end: new Date()
  },
  {
    label: 'Son 6 Ay',
    start: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    end: new Date()
  },
  {
    label: 'Son 1 Yıl',
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    end: new Date()
  },
  {
    label: 'Son 2 Yıl',
    start: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
    end: new Date()
  }
];

export const DEPARTMENTS = {
  yargitay: [
    'Hukuk Genel Kurulu',
    'Ceza Genel Kurulu', 
    '1. Hukuk Dairesi',
    '2. Hukuk Dairesi',
    '3. Hukuk Dairesi',
    '4. Hukuk Dairesi',
    '1. Ceza Dairesi',
    '2. Ceza Dairesi',
    '3. Ceza Dairesi'
  ],
  danistay: [
    'İdari Dava Daireleri Kurulu',
    'Vergi Dava Daireleri Kurulu',
    '1. Daire',
    '2. Daire',
    '3. Daire',
    '4. Daire',
    '5. Daire'
  ],
  emsal: [
    'Asliye Hukuk',
    'Asliye Ceza',
    'Ticaret Mahkemesi',
    'İş Mahkemesi',
    'Aile Mahkemesi'
  ]
};

export const LLM_PROVIDERS = [
  { id: 'openai', name: 'ChatGPT', color: 'bg-green-500' },
  { id: 'anthropic', name: 'Claude', color: 'bg-orange-500' },
  { id: 'google', name: 'Gemini', color: 'bg-blue-500' }
] as const;