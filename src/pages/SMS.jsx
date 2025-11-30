import { useState, useEffect } from 'react'
import { smsAPI, membersAPI } from '../services/api'
import { Send, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

const SMS = () => {
  const [members, setMembers] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ member_ids: [], message: '', sendToAll: false })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [membersRes, historyRes] = await Promise.all([
        membersAPI.getAll({ status: 'active' }).catch(() => ({ success: false, data: [] })),
        smsAPI.getHistory().catch(() => ({ success: false, data: [] }))
      ])
      
      let membersList = []
      if (membersRes.success && membersRes.data?.members) {
        membersList = membersRes.data.members
      } else if (Array.isArray(membersRes.data)) {
        membersList = membersRes.data
      }
      
      let historyList = []
      if (historyRes.success && historyRes.data?.history) {
        historyList = historyRes.data.history
      } else if (Array.isArray(historyRes.data)) {
        historyList = historyRes.data
      }
      
      setMembers(membersList)
      setHistory(historyList)
    } catch (error) {
      setMembers([])
      setHistory([])
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!formData.message.trim()) {
      toast.error('Please enter a message')
      return
    }
    try {
      setLoading(true)
      if (formData.sendToAll) {
        await smsAPI.sendBulk({ message: formData.message })
      } else {
        if (formData.member_ids.length === 0) {
          toast.error('Select at least one member')
          return
        }
        await smsAPI.send({ member_ids: formData.member_ids, message: formData.message })
      }
      toast.success('SMS sent successfully')
      setFormData({ member_ids: [], message: '', sendToAll: false })
      fetchData()
    } catch (error) {
      toast.error('Failed to send SMS')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SMS</h1>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Send SMS</h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={formData.sendToAll} onChange={(e) => setFormData({ ...formData, sendToAll: e.target.checked, member_ids: [] })} />
              <span className="text-sm font-medium">Send to All Active Members</span>
            </label>
          </div>
          
          {!formData.sendToAll && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Members</label>
              <select multiple value={formData.member_ids} onChange={(e) => setFormData({ ...formData, member_ids: Array.from(e.target.selectedOptions, option => option.value) })} className="w-full px-3 py-2 border rounded-lg" size="5">
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name || m.name} - {m.phone}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows="4" placeholder="Type your message..." required />
            <p className="text-xs text-gray-500 mt-1">{formData.message.length} characters</p>
          </div>
          
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
            <Send className="w-5 h-5" />
            {loading ? 'Sending...' : 'Send SMS'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">SMS History</h2>
        {history.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No SMS history</p>
        ) : (
          <div className="space-y-3">
            {history.map((sms) => (
              <div key={sms.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="text-sm text-gray-900">{sms.message}</p>
                <p className="text-xs text-gray-500 mt-1">Sent to: {sms.recipient_count || 1} member(s) | {sms.sent_at}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SMS
