import { useState, useEffect } from 'react'
import { smsAPI, membersAPI } from '../services/api'
import { useOrg } from '../context/OrgContext'
import { Send, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

const SMS = () => {
  const { selectedOrg } = useOrg()
  const orgType = selectedOrg?.type || 'library'
  const isLibrary = orgType === 'library'

  const getMemberLabel = () => {
    return isLibrary || orgType === 'tution' ? 'Student' : 'Member'
  }

  const [members, setMembers] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ member_ids: [], message: '', sendToAll: false })

  useEffect(() => {
    if (selectedOrg?.id) {
      fetchData()
    }
  }, [selectedOrg])

  const fetchData = async () => {
    try {
      const [membersRes, historyRes] = await Promise.all([
        membersAPI.getAll({ status: 'active', org_id: selectedOrg.id }).catch(() => ({ success: false, data: [] })),
        smsAPI.getHistory({ org_id: selectedOrg.id }).catch(() => ({ success: false, data: [] }))
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
          toast.error(`Select at least one ${getMemberLabel().toLowerCase()}`)
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

  const getTemplates = () => {
    if (isLibrary) {
      return [
        { label: 'Seat Confirmation', text: 'Dear Student, your seat has been confirmed at our library. Welcome!' },
        { label: 'Payment Reminder', text: 'Dear Student, your library subscription is expiring soon. Please renew to continue.' },
        { label: 'Holiday Notice', text: 'Dear Student, the library will remain closed tomorrow on account of holiday.' }
      ]
    }
    if (orgType === 'tution') {
      return [
        { label: 'Class Schedule', text: 'Dear Student, your class is scheduled for tomorrow at 10:00 AM. Please be on time.' },
        { label: 'Fees Due', text: 'Dear Student, your tuition fees for this month are due. Please pay at the earliest.' },
        { label: 'Test Result', text: 'Dear Student, your test results have been declared. Please check the notice board.' }
      ]
    }
    return [
      { label: 'Welcome Message', text: `Welcome to our ${orgType}! We are happy to have you as a member.` },
      { label: 'Renewal Reminder', text: 'Your membership is expiring in 3 days. Renew now to avoid interruption.' },
      { label: 'Special Offer', text: 'Get 20% off on your next renewal. Valid for this week only!' }
    ]
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SMS</h1>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Send SMS</h2>
        
        {/* Templates */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Quick Templates</label>
          <div className="flex flex-wrap gap-2">
            {getTemplates().map((template, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFormData({ ...formData, message: template.text })}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full border transition-colors"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={formData.sendToAll} onChange={(e) => setFormData({ ...formData, sendToAll: e.target.checked, member_ids: [] })} />
              <span className="text-sm font-medium">Send to All Active {getMemberLabel()}s</span>
            </label>
          </div>
          
          {!formData.sendToAll && (
            <div>
              <label className="block text-sm font-medium mb-2">Select {getMemberLabel()}s</label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
                {members.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No active {getMemberLabel().toLowerCase()}s found</p>
                ) : (
                  members.map(m => (
                    <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-md transition-colors cursor-pointer border border-transparent hover:border-gray-200">
                      <input
                        type="checkbox"
                        checked={formData.member_ids.includes(m.id.toString())}
                        onChange={(e) => {
                          const id = m.id.toString();
                          const newIds = e.target.checked
                            ? [...formData.member_ids, id]
                            : formData.member_ids.filter(mid => mid !== id);
                          setFormData({ ...formData, member_ids: newIds });
                        }}
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.full_name || m.name}</p>
                        <p className="text-xs text-gray-500">{m.phone}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Selected: {formData.member_ids.length} {getMemberLabel().toLowerCase()}(s)</p>
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
              <div key={sms.id} className="border-l-4 border-primary pl-4 py-2">
                <p className="text-sm text-gray-900">{sms.message}</p>
                <p className="text-xs text-gray-500 mt-1">Sent to: {sms.recipient_count || 1} {getMemberLabel().toLowerCase()}(s) | {sms.sent_at}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SMS
