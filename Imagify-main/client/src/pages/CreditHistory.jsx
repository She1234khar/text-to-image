import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const CreditHistory = () => {
  const { backendUrl, token } = useContext(AppContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try{
        const {data} = await axios.get(`${backendUrl}/api/user/transactions`, {headers:{token}})
        if (data.success){
          setItems(data.transactions);
        } else {
          toast.error(data.message || 'Failed to load history')
        }
      }catch(err){
        toast.error(err.message || 'Failed to load history')
      }finally{
        setLoading(false)
      }
    }
    load()
  }, [backendUrl, token])

  if (loading){
    return <div className="min-h-[60vh] flex items-center justify-center text-gray-600">Loading history...</div>
  }

  return (
    <div className="min-h-[70vh] pt-14 mb-10">
      <h1 className="text-2xl font-semibold mb-6">Credits History</h1>
      {items.length === 0 ? (
        <p className="text-gray-500">No transactions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="text-left text-sm text-gray-600 border-b">
                <th className="p-3">Date</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Credits</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Order</th>
                <th className="p-3">Capture</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t)=> (
                <tr key={t._id} className="border-b last:border-0">
                  <td className="p-3 text-sm text-gray-700">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-sm">{t.planId}</td>
                  <td className="p-3 text-sm">+{t.creditsAdded}</td>
                  <td className="p-3 text-sm">{t.currency} {t.amount}</td>
                  <td className="p-3 text-xs text-gray-500">{t.orderId}</td>
                  <td className="p-3 text-xs text-gray-500">{t.captureId || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default CreditHistory



