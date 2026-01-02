import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { X, Printer, Share2 } from 'lucide-react'
import QRCode from 'qrcode'

const InvoiceGenerator = ({ member, payment, onClose, org }) => {
  const [printing, setPrinting] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState(null)

  const handlePrint = () => {
    setPrinting(true)
    window.print()
    setTimeout(() => setPrinting(false), 1000)
  }

  const orgInfo = {
    name: org?.name || member.org_name || 'Organization',
    address: org?.address || member.org_address || 'Address',
    phone: org?.phone || member.org_phone || '',
    email: org?.email || member.org_email || '',
    website: org?.website || member.organization_website || ''
  }

  const payableAmount = useMemo(() => Number(payment?.amount || member.plan_price || 0), [payment, member])
  const paidAmount = useMemo(() => Number(payment?.amount || payableAmount), [payment, payableAmount])
  const dueAmount = Math.max(payableAmount - paidAmount, 0)

  const shareText = useMemo(() => {
    const name = member.full_name || member.name || 'Member'
    const code = member.member_code || 'N/A'
    const invoiceNo = payment?.receipt_number || payment?.id || 'INV'
    return [
      `Invoice ${invoiceNo}`,
      `Member: ${name} (${code})`,
      `Amount: ₹${payableAmount.toLocaleString('en-IN')}`,
      `Start: ${member.plan_start_date ? format(new Date(member.plan_start_date), 'dd MMM, yyyy') : 'N/A'}`,
      `End: ${member.plan_end_date ? format(new Date(member.plan_end_date), 'dd MMM, yyyy') : 'N/A'}`
    ].join('\n')
  }, [member, payableAmount, payment])

  useEffect(() => {
    let isMounted = true
    const build = async () => {
      try {
        const qrText = `Feestrack Invoice\nMember: ${member.full_name || member.name || ''}\nMember ID: ${member.member_code || ''}\nAmount: ${payableAmount}`
        const url = await QRCode.toDataURL(qrText, { width: 384, margin: 1 })
        if (isMounted) setQrDataUrl(url)
      } catch (e) {
        console.error('QR generation failed:', e)
        if (isMounted) setQrDataUrl(null)
      }
    }
    build()
    return () => {
      isMounted = false
    }
  }, [member, payableAmount])

  const handleShare = async () => {
    try {
      if (!qrDataUrl) {
        alert('QR not ready yet')
        return
      }
      const res = await fetch(qrDataUrl)
      const blob = await res.blob()
      const file = new File([blob], `invoice-${member.member_code || member.id}.png`, { type: blob.type || 'image/png' })

      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ text: shareText, files: [file] })
        return
      }

      await navigator.clipboard?.writeText?.(shareText)
      alert('Share not supported on this device. Invoice text copied to clipboard.')
    } catch (e) {
      console.error('Share failed:', e)
      alert('Unable to share invoice on this device.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; inset: 0; width: 100%; }
            .no-print { display: none !important; }
          }
        `}</style>

        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b bg-white sticky top-0 z-10 rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-900">Invoice</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="btn btn-primary flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button onClick={handlePrint} className="btn btn-primary flex items-center gap-2" disabled={printing}>
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="print-area px-4 sm:px-8 py-6">
          {/* Top Brand Row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-gray-200">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-wide text-gray-900 break-words">{orgInfo.name}</h1>
              {orgInfo.address && <p className="text-sm text-gray-700 mt-1 break-words">{orgInfo.address}</p>}
              {(orgInfo.phone || orgInfo.email) && (
                <p className="text-xs text-gray-600 mt-1">
                  {orgInfo.phone && <span>Ph: {orgInfo.phone}</span>}
                  {orgInfo.phone && orgInfo.email && ' · '}
                  {orgInfo.email && <span>Email: {orgInfo.email}</span>}
                </p>
              )}
            </div>
            <div className="text-left sm:text-right text-sm text-gray-700">
              <p>Invoice : <span className="font-semibold">{payment?.receipt_number || `INV${payment?.id || member.id || ''}`}</span></p>
              <p>Date : {format(new Date(), 'dd-MM-yyyy')}</p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 py-4 text-sm text-gray-800">
            <div className="space-y-1">
              <p><span className="font-semibold">Name :</span> {member.full_name || member.name}</p>
              <p><span className="font-semibold">Address :</span> {member.address || member.city || '—'}</p>
              <p><span className="font-semibold">Mobile :</span> {member.phone || '—'}</p>
              <p><span className="font-semibold">Member ID :</span> {member.member_code || '—'}</p>
              <p><span className="font-semibold">Seat No :</span> {member.seat_number || '—'}</p>
            </div>
            <div className="text-left sm:text-right space-y-1">
              <p className="font-semibold">{orgInfo.name}</p>
              {orgInfo.address && <p>{orgInfo.address}</p>}
              {orgInfo.email && <p>Email: {orgInfo.email}</p>}
              {orgInfo.phone && <p>Phone: {orgInfo.phone}</p>}
              {orgInfo.website && <p>Website: {orgInfo.website}</p>}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm text-gray-900 mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left">Invoice Date</th>
                  <th className="border px-3 py-2 text-left">Program</th>
                  <th className="border px-3 py-2 text-left">Start Date</th>
                  <th className="border px-3 py-2 text-left">Expiry Date</th>
                  <th className="border px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-2">{format(new Date(), 'dd-MM-yyyy')}</td>
                  <td className="border px-3 py-2">{member.plan_name || 'Full Time'}</td>
                  <td className="border px-3 py-2">{member.plan_start_date ? format(new Date(member.plan_start_date), 'dd-MM-yyyy') : '—'}</td>
                  <td className="border px-3 py-2">{member.plan_end_date ? format(new Date(member.plan_end_date), 'dd-MM-yyyy') : '—'}</td>
                  <td className="border px-3 py-2 text-right">{payableAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amounts */}
          <div className="text-right space-y-1 text-sm text-gray-900">
            <p>Enrollment Fee <span className="ml-4">0</span></p>
            <p>Discount <span className="ml-4">0</span></p>
            <p className="font-bold">Final Amount <span className="ml-4">{payableAmount.toLocaleString('en-IN')}</span></p>
            <p className="font-bold">Paid Amount <span className="ml-4">{paidAmount.toLocaleString('en-IN')}</span></p>
            <p className="font-bold">Due Amount <span className="ml-4">{dueAmount.toLocaleString('en-IN')}</span></p>
          </div>

          {/* QR / Note */}
          <div className="mt-6 flex flex-col items-center gap-3 text-sm text-gray-800">
            {qrDataUrl && <img src={qrDataUrl} alt="Invoice QR" className="w-40 h-40" />}
            <div className="text-center leading-relaxed">
              <p>"Any student displaying misbehavior will face strict legal action."</p>
              <p>"Fee is non-refundable under any circumstances."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceGenerator
