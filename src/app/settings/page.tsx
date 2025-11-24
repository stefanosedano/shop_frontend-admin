'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import AdminLayout from '../../components/AdminLayout'
import { useLanguage } from '../../context/LanguageContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

interface Setting {
  id: number
  key: string
  value: string
  category: string
  description: string
  is_encrypted: boolean
  created_at: string
  updated_at: string
}

interface TranslationStatus {
  running: boolean
  started_at: string | null
  current_item: string
  total_items: number
  completed_items: number
  current_type: string
  errors: number
  estimated_completion: number | null
  progress_percentage: number
  items_remaining: number
  estimated_time_remaining: number
}

export default function SettingsPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Setting[]>([])
  
  // Form data
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [openaiModel, setOpenaiModel] = useState('gpt-3.5-turbo')
  const [storeName, setStoreName] = useState('')
  const [storeEmail, setStoreEmail] = useState('')
  const [storePhone, setStorePhone] = useState('')
  
  // S3 settings
  const [s3Enabled, setS3Enabled] = useState(false)
  const [s3Endpoint, setS3Endpoint] = useState('')
  const [s3Bucket, setS3Bucket] = useState('')
  const [s3AccessKey, setS3AccessKey] = useState('')
  const [s3SecretKey, setS3SecretKey] = useState('')
  const [s3Region, setS3Region] = useState('us-east-1')
  const [s3PublicUrl, setS3PublicUrl] = useState('')

  // Translation status
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus | null>(null)
  const [translating, setTranslating] = useState(false)
  const [useAI, setUseAI] = useState(true)
  const [skipExisting, setSkipExisting] = useState(true)

  useEffect(() => {
    checkAuthAndLoadSettings()
    checkTranslationStatus() // Check status on page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Poll translation status if translation is running
    let interval: NodeJS.Timeout | null = null
    
    if (translating) {
      interval = setInterval(() => {
        checkTranslationStatus()
      }, 2000) // Poll every 2 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translating])

  const checkAuthAndLoadSettings = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await axios.get(`${API_URL}/admin/settings/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSettings(response.data)
      
      // Populate form with existing settings
      response.data.forEach((setting: Setting) => {
        switch (setting.key) {
          case 'openai_api_key':
            setOpenaiApiKey(setting.value || '')
            break
          case 'openai_model':
            setOpenaiModel(setting.value || 'gpt-3.5-turbo')
            break
          case 'store_name':
            setStoreName(setting.value || '')
            break
          case 'store_email':
            setStoreEmail(setting.value || '')
            break
          case 'store_phone':
            setStorePhone(setting.value || '')
            break
          case 's3_enabled':
            setS3Enabled(setting.value === 'true')
            break
          case 's3_endpoint':
            setS3Endpoint(setting.value || '')
            break
          case 's3_bucket':
            setS3Bucket(setting.value || '')
            break
          case 's3_access_key':
            setS3AccessKey(setting.value || '')
            break
          case 's3_secret_key':
            setS3SecretKey(setting.value || '')
            break
          case 's3_region':
            setS3Region(setting.value || 'us-east-1')
            break
          case 's3_public_url':
            setS3PublicUrl(setting.value || '')
            break
        }
      })
    } catch (error: any) {
      console.error('Error loading settings:', error)
      
      // Only redirect to login on authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('admin_token')
        router.push('/login')
      } else {
        // For other errors, just show empty settings (API might be down or endpoint issue)
        alert('Error loading settings. Some features may not work properly.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const token = localStorage.getItem('admin_token')
      const settingsToUpdate: Record<string, string> = {
        openai_api_key: openaiApiKey,
        openai_model: openaiModel,
        store_name: storeName,
        store_email: storeEmail,
        store_phone: storePhone,
        s3_enabled: s3Enabled.toString(),
        s3_endpoint: s3Endpoint,
        s3_bucket: s3Bucket,
        s3_access_key: s3AccessKey,
        s3_secret_key: s3SecretKey,
        s3_region: s3Region,
        s3_public_url: s3PublicUrl
      }

      await axios.post(
        `${API_URL}/admin/settings/bulk`,
        settingsToUpdate,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      alert('Settings saved successfully')
      await checkAuthAndLoadSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const checkTranslationStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) return // Don't check if not authenticated
      
      const response = await axios.get(
        `${API_URL}/admin/translations/translate/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      const status = response.data as TranslationStatus
      setTranslationStatus(status)
      
      // Start polling if translation is running
      if (status.running && !translating) {
        setTranslating(true)
      }
      
      // Stop polling if translation is complete
      if (!status.running && translating) {
        setTranslating(false)
      }
    } catch (error) {
      console.error('Error checking translation status:', error)
    }
  }

  const startTranslation = async (testMode = false) => {
    const itemLimit = testMode ? 5 : undefined
    const confirmMessage = testMode 
      ? 'Start test translation (5 items only)?'
      : `Translate ALL products and categories to all languages using ${useAI ? 'AI' : 'simple'} translation?\n\nThis may take several hours for large catalogs. Continue?`
    
    if (!confirm(confirmMessage)) return

    if (useAI && !openaiApiKey) {
      alert('Please configure OpenAI API key first')
      return
    }

    try {
      setTranslating(true)
      const token = localStorage.getItem('admin_token')
      
      await axios.post(
        `${API_URL}/admin/translations/translate/all${itemLimit ? `?limit=${itemLimit}` : ''}`,
        { use_ai: useAI, skip_existing: skipExisting },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      // Start polling status immediately
      checkTranslationStatus()
    } catch (error) {
      console.error('Error starting translation:', error)
      alert('Error starting translation')
      setTranslating(false)
    }
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-bg-interactive"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-ui-fg-base">{t.settings.title}</h1>
          <p className="text-ui-fg-muted mt-1 txt-compact-medium">
            {t.settings.subtitle}
          </p>
        </div>

        <div className="space-y-6">
          {/* OpenAI Configuration */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ui-fg-base mb-4">
              {t.settings.openaiConfig}
            </h2>
            <p className="text-sm text-ui-fg-muted mb-4">
              {t.settings.openaiConfigDesc}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ui-fg-base mb-2">
                  {t.settings.apiKey}
                </label>
                <input
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder={t.settings.apiKeyPlaceholder}
                  className="input-field w-full"
                />
                <p className="text-xs text-ui-fg-muted mt-1">
                  {t.settings.apiKeyDesc}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-fg-base mb-2">
                  {t.settings.gptModel}
                </label>
                <select
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  className="input-field w-full"
                >
                  {language === 'en' && (
                    <>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast & Economical)</option>
                      <option value="gpt-4">GPT-4 (Better Quality)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo (Faster GPT-4)</option>
                      <option value="gpt-4o">GPT-4o (Latest & Best)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Fast & Affordable)</option>
                    </>
                  )}
                  {language === 'es' && (
                    <>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rápido y Económico)</option>
                      <option value="gpt-4">GPT-4 (Mejor Calidad)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo (GPT-4 Más Rápido)</option>
                      <option value="gpt-4o">GPT-4o (Último y Mejor)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Rápido y Económico)</option>
                    </>
                  )}
                  {language === 'it' && (
                    <>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Veloce ed Economico)</option>
                      <option value="gpt-4">GPT-4 (Migliore Qualità)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo (GPT-4 Più Veloce)</option>
                      <option value="gpt-4o">GPT-4o (Ultimo e Migliore)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Veloce ed Economico)</option>
                    </>
                  )}
                  {language === 'fr' && (
                    <>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rapide et Économique)</option>
                      <option value="gpt-4">GPT-4 (Meilleure Qualité)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo (GPT-4 Plus Rapide)</option>
                      <option value="gpt-4o">GPT-4o (Dernier et Meilleur)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Rapide et Abordable)</option>
                    </>
                  )}
                  {language === 'de' && (
                    <>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Schnell und Wirtschaftlich)</option>
                      <option value="gpt-4">GPT-4 (Bessere Qualität)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo (Schnelleres GPT-4)</option>
                      <option value="gpt-4o">GPT-4o (Neuestes und Bestes)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Schnell und Erschwinglich)</option>
                    </>
                  )}
                </select>
                <p className="text-xs text-ui-fg-muted mt-1">
                  {t.settings.modelDesc}
                </p>
              </div>

              <div className="bg-ui-bg-subtle p-4 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-ui-fg-interactive mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-ui-fg-subtle">
                    <strong>{t.settings.modelComparison}</strong>
                    {language === 'en' && (
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• <strong>GPT-3.5 Turbo:</strong> Best for high-volume, quick translations (~$0.002/1K tokens)</li>
                        <li>• <strong>GPT-4o Mini:</strong> Good balance of quality and speed (~$0.15/1M input tokens)</li>
                        <li>• <strong>GPT-4o:</strong> Best quality for product descriptions (~$2.50/1M input tokens)</li>
                        <li>• <strong>GPT-4 Turbo:</strong> High-quality, good for detailed content (~$10/1M input tokens)</li>
                      </ul>
                    )}
                    {language === 'es' && (
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• <strong>GPT-3.5 Turbo:</strong> Mejor para traducciones rápidas de gran volumen (~$0.002/1K tokens)</li>
                        <li>• <strong>GPT-4o Mini:</strong> Buen equilibrio entre calidad y velocidad (~$0.15/1M tokens de entrada)</li>
                        <li>• <strong>GPT-4o:</strong> Mejor calidad para descripciones de productos (~$2.50/1M tokens de entrada)</li>
                        <li>• <strong>GPT-4 Turbo:</strong> Alta calidad, bueno para contenido detallado (~$10/1M tokens de entrada)</li>
                      </ul>
                    )}
                    {language === 'it' && (
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• <strong>GPT-3.5 Turbo:</strong> Migliore per traduzioni rapide ad alto volume (~$0.002/1K tokens)</li>
                        <li>• <strong>GPT-4o Mini:</strong> Buon equilibrio tra qualità e velocità (~$0.15/1M tokens di input)</li>
                        <li>• <strong>GPT-4o:</strong> Migliore qualità per descrizioni di prodotti (~$2.50/1M tokens di input)</li>
                        <li>• <strong>GPT-4 Turbo:</strong> Alta qualità, ottimo per contenuti dettagliati (~$10/1M tokens di input)</li>
                      </ul>
                    )}
                    {language === 'fr' && (
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• <strong>GPT-3.5 Turbo:</strong> Meilleur pour les traductions rapides en grand volume (~$0.002/1K tokens)</li>
                        <li>• <strong>GPT-4o Mini:</strong> Bon équilibre entre qualité et vitesse (~$0.15/1M tokens d'entrée)</li>
                        <li>• <strong>GPT-4o:</strong> Meilleure qualité pour les descriptions de produits (~$2.50/1M tokens d'entrée)</li>
                        <li>• <strong>GPT-4 Turbo:</strong> Haute qualité, bon pour le contenu détaillé (~$10/1M tokens d'entrée)</li>
                      </ul>
                    )}
                    {language === 'de' && (
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• <strong>GPT-3.5 Turbo:</strong> Am besten für schnelle Übersetzungen in großem Umfang (~$0.002/1K Tokens)</li>
                        <li>• <strong>GPT-4o Mini:</strong> Gutes Gleichgewicht zwischen Qualität und Geschwindigkeit (~$0.15/1M Eingabe-Tokens)</li>
                        <li>• <strong>GPT-4o:</strong> Beste Qualität für Produktbeschreibungen (~$2.50/1M Eingabe-Tokens)</li>
                        <li>• <strong>GPT-4 Turbo:</strong> Hohe Qualität, gut für detaillierte Inhalte (~$10/1M Eingabe-Tokens)</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* S3 / Cloud Storage Configuration */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ui-fg-base mb-4">
              {t.settings.cloudStorage}
            </h2>
            <p className="text-sm text-ui-fg-muted mb-4">
              {t.settings.cloudStorageDesc}
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="s3_enabled"
                  checked={s3Enabled}
                  onChange={(e) => setS3Enabled(e.target.checked)}
                  className="h-4 w-4 rounded border-ui-border-base text-ui-fg-interactive focus:ring-2 focus:ring-ui-border-interactive"
                />
                <label htmlFor="s3_enabled" className="ml-2 text-sm text-ui-fg-base font-medium">
                  {t.settings.enableS3}
                </label>
              </div>

              {s3Enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-ui-fg-base mb-2">
                      {t.settings.s3Endpoint}
                    </label>
                    <input
                      type="text"
                      value={s3Endpoint}
                      onChange={(e) => setS3Endpoint(e.target.value)}
                      placeholder={t.settings.s3EndpointPlaceholder}
                      className="input-field w-full"
                    />
                    <p className="text-xs text-ui-fg-muted mt-1">
                      {t.settings.s3EndpointDesc}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ui-fg-base mb-2">
                      {t.settings.bucketName}
                    </label>
                    <input
                      type="text"
                      value={s3Bucket}
                      onChange={(e) => setS3Bucket(e.target.value)}
                      placeholder={t.settings.bucketPlaceholder}
                      className="input-field w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ui-fg-base mb-2">
                        {t.settings.accessKeyId}
                      </label>
                      <input
                        type="text"
                        value={s3AccessKey}
                        onChange={(e) => setS3AccessKey(e.target.value)}
                        placeholder={t.settings.accessKeyPlaceholder}
                        className="input-field w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ui-fg-base mb-2">
                        {t.settings.secretAccessKey}
                      </label>
                      <input
                        type="password"
                        value={s3SecretKey}
                        onChange={(e) => setS3SecretKey(e.target.value)}
                        placeholder={t.settings.secretAccessKeyPlaceholder}
                        className="input-field w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ui-fg-base mb-2">
                      {t.settings.region}
                    </label>
                    <select
                      value={s3Region}
                      onChange={(e) => setS3Region(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="us-east-1">US East (N. Virginia)</option>
                      <option value="us-west-2">US West (Oregon)</option>
                      <option value="eu-west-1">EU (Ireland)</option>
                      <option value="eu-central-1">EU (Frankfurt)</option>
                      <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                      <option value="auto">{language === 'en' ? 'Auto (for Cloudflare R2)' : language === 'es' ? 'Auto (para Cloudflare R2)' : language === 'it' ? 'Auto (per Cloudflare R2)' : language === 'fr' ? 'Auto (pour Cloudflare R2)' : 'Auto (für Cloudflare R2)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ui-fg-base mb-2">
                      {t.settings.publicUrl}
                    </label>
                    <input
                      type="text"
                      value={s3PublicUrl}
                      onChange={(e) => setS3PublicUrl(e.target.value)}
                      placeholder={t.settings.publicUrlPlaceholder}
                      className="input-field w-full"
                    />
                    <p className="text-xs text-ui-fg-muted mt-1">
                      {t.settings.publicUrlDesc}
                    </p>
                  </div>

                  <div className="bg-ui-bg-subtle p-4 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-ui-fg-interactive mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-ui-fg-subtle">
                        <strong>{t.settings.providerQuickSetup}</strong>
                        {language === 'en' && (
                          <ul className="mt-2 space-y-1 text-xs">
                            <li>• <strong>AWS S3:</strong> Leave endpoint empty, set region, use IAM credentials</li>
                            <li>• <strong>Cloudflare R2:</strong> Endpoint from R2 dashboard, region = auto, use R2 API tokens</li>
                            <li>• <strong>DigitalOcean Spaces:</strong> Endpoint = https://[region].digitaloceanspaces.com</li>
                            <li>• <strong>MinIO:</strong> Your MinIO server URL as endpoint</li>
                          </ul>
                        )}
                        {language === 'es' && (
                          <ul className="mt-2 space-y-1 text-xs">
                            <li>• <strong>AWS S3:</strong> Dejar endpoint vacío, establecer región, usar credenciales IAM</li>
                            <li>• <strong>Cloudflare R2:</strong> Endpoint desde el panel R2, región = auto, usar tokens API R2</li>
                            <li>• <strong>DigitalOcean Spaces:</strong> Endpoint = https://[región].digitaloceanspaces.com</li>
                            <li>• <strong>MinIO:</strong> URL de tu servidor MinIO como endpoint</li>
                          </ul>
                        )}
                        {language === 'it' && (
                          <ul className="mt-2 space-y-1 text-xs">
                            <li>• <strong>AWS S3:</strong> Lascia endpoint vuoto, imposta regione, usa credenziali IAM</li>
                            <li>• <strong>Cloudflare R2:</strong> Endpoint dalla dashboard R2, regione = auto, usa token API R2</li>
                            <li>• <strong>DigitalOcean Spaces:</strong> Endpoint = https://[regione].digitaloceanspaces.com</li>
                            <li>• <strong>MinIO:</strong> URL del tuo server MinIO come endpoint</li>
                          </ul>
                        )}
                        {language === 'fr' && (
                          <ul className="mt-2 space-y-1 text-xs">
                            <li>• <strong>AWS S3:</strong> Laisser endpoint vide, définir région, utiliser identifiants IAM</li>
                            <li>• <strong>Cloudflare R2:</strong> Endpoint depuis tableau de bord R2, région = auto, utiliser jetons API R2</li>
                            <li>• <strong>DigitalOcean Spaces:</strong> Endpoint = https://[région].digitaloceanspaces.com</li>
                            <li>• <strong>MinIO:</strong> URL de votre serveur MinIO comme endpoint</li>
                          </ul>
                        )}
                        {language === 'de' && (
                          <ul className="mt-2 space-y-1 text-xs">
                            <li>• <strong>AWS S3:</strong> Endpoint leer lassen, Region festlegen, IAM-Anmeldedaten verwenden</li>
                            <li>• <strong>Cloudflare R2:</strong> Endpoint aus R2-Dashboard, Region = auto, R2-API-Tokens verwenden</li>
                            <li>• <strong>DigitalOcean Spaces:</strong> Endpoint = https://[Region].digitaloceanspaces.com</li>
                            <li>• <strong>MinIO:</strong> Ihre MinIO-Server-URL als Endpoint</li>
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Translations Management */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ui-fg-base mb-4">
              {t.settings.translations}
            </h2>
            <p className="text-sm text-ui-fg-muted mb-4">
              {t.settings.translationsDesc}
            </p>

            {/* Translation Options */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useAI"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  disabled={translating}
                  className="h-4 w-4 rounded border-ui-border-base text-ui-fg-interactive focus:ring-2 focus:ring-ui-border-interactive"
                />
                <label htmlFor="useAI" className="ml-2 text-sm text-ui-fg-base">
                  {t.settings.useAI}
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="skipExisting"
                  checked={skipExisting}
                  onChange={(e) => setSkipExisting(e.target.checked)}
                  disabled={translating}
                  className="h-4 w-4 rounded border-ui-border-base text-ui-fg-interactive focus:ring-2 focus:ring-ui-border-interactive"
                />
                <label htmlFor="skipExisting" className="ml-2 text-sm text-ui-fg-base">
                  {t.settings.skipExisting}
                </label>
              </div>
              
              {!useAI && (
                <div className="bg-ui-bg-subtle p-3 rounded-lg text-xs text-ui-fg-subtle">
                  {t.settings.useAIDesc}
                </div>
              )}
              
              {!skipExisting && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs text-yellow-800">
                  {t.settings.skipExistingDesc}
                </div>
              )}
            </div>

            {/* Translation Progress */}
            {translationStatus && translationStatus.running && (
              <div className="bg-ui-bg-subtle border border-ui-border-base rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ui-fg-interactive mr-2"></div>
                    <span className="text-sm font-medium text-ui-fg-base">{t.settings.translationProgress}</span>
                  </div>
                  <span className="text-sm font-medium text-ui-fg-interactive">
                    {translationStatus.progress_percentage.toFixed(1)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-ui-bg-component rounded-full h-2 mb-3">
                  <div 
                    className="bg-ui-fg-interactive h-2 rounded-full transition-all duration-300"
                    style={{ width: `${translationStatus.progress_percentage}%` }}
                  />
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs text-ui-fg-subtle">
                  <div className="flex justify-between">
                    <span>{t.settings.current}</span>
                    <span className="text-ui-fg-base font-medium truncate ml-2 max-w-xs">
                      {translationStatus.current_item}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.settings.progress}</span>
                    <span className="text-ui-fg-base">
                      {translationStatus.completed_items} / {translationStatus.total_items} items
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.settings.remaining}</span>
                    <span className="text-ui-fg-base">
                      {translationStatus.items_remaining} items (~{formatTime(translationStatus.estimated_time_remaining)})
                    </span>
                  </div>
                  {translationStatus.errors > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>{t.settings.errors}</span>
                      <span className="font-medium">{translationStatus.errors}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Completion Message */}
            {translationStatus && !translationStatus.running && translationStatus.total_items > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-green-900">{t.settings.translationComplete}</p>
                    <p className="text-green-700 mt-1">
                      {t.settings.translationCompleteDesc.replace('{0}', translationStatus.completed_items.toString())}
                      {translationStatus.errors > 0 && ` (${translationStatus.errors} errors)`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => startTranslation(true)}
                disabled={translating || saving}
                className="btn-secondary"
              >
                {t.settings.testTranslation}
              </button>
              <button
                onClick={() => startTranslation(false)}
                disabled={translating || saving}
                className="btn-primary"
              >
                {translating ? t.settings.translating : t.settings.translateAll}
              </button>
            </div>

            <div className="mt-4 bg-ui-bg-subtle p-4 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-ui-fg-interactive mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-ui-fg-subtle">
                  <strong>{t.settings.translationInfo}</strong>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>• <strong>{t.settings.testMode}</strong></li>
                    <li>• <strong>{t.settings.fullTranslation}</strong></li>
                    <li>• <strong>{t.settings.aiTranslation}</strong></li>
                    <li>• <strong>{t.settings.backgroundProcess}</strong></li>
                    <li>• <strong>{t.settings.realtimeProgress}</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Store Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ui-fg-base mb-4">
              {t.settings.storeDetails}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ui-fg-base mb-2">
                  {t.settings.storeName}
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="My Shop"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-fg-base mb-2">
                  {t.settings.storeEmail}
                </label>
                <input
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  placeholder="info@myshop.com"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-fg-base mb-2">
                  {t.settings.storePhone}
                </label>
                <input
                  type="tel"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? t.common.loading : t.settings.saveChanges}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
