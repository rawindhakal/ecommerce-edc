'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_STORE_NAME, setBrandName } from '@/lib/store-config'

interface StoreConfigValue {
  storeName: string
}

const StoreConfigContext = createContext<StoreConfigValue>({ storeName: DEFAULT_STORE_NAME })

export function StoreConfigProvider({ children }: { children: ReactNode }) {
  const [storeName, setStoreName] = useState(DEFAULT_STORE_NAME)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'store_name')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          setStoreName(data.value)
          setBrandName(data.value)
        }
      })
  }, [])

  return (
    <StoreConfigContext.Provider value={{ storeName }}>
      {children}
    </StoreConfigContext.Provider>
  )
}

export function useStoreConfig() {
  return useContext(StoreConfigContext)
}
