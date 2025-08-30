import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      setConnectionStatus('testing')
      
      // 簡単な接続テスト（テーブル一覧を取得）
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (error) {
        // テーブルが存在しない場合でも接続自体は成功している可能性がある
        if (error.code === '42P01') { // テーブルが存在しない
          setConnectionStatus('connected')
          setErrorMessage('テーブルが存在しませんが、接続は成功しています')
        } else {
          throw error
        }
      } else {
        setConnectionStatus('connected')
        setErrorMessage('')
      }
    } catch (error: any) {
      setConnectionStatus('error')
      setErrorMessage(error.message || '接続に失敗しました')
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '接続成功'
      case 'error':
        return '接続エラー'
      default:
        return '接続テスト中...'
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Supabase接続テスト</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
          }`} />
          <span className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>Project URL:</strong> https://caxyyctagcjvgqfdijxc.supabase.co</p>
          <p><strong>Status:</strong> {connectionStatus}</p>
        </div>

        <button
          onClick={testConnection}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          再接続テスト
        </button>
      </div>
    </div>
  )
}

export default SupabaseTest
