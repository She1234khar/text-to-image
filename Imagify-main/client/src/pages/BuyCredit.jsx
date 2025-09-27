import React, { useContext } from "react";
import { assets, plans } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import { motion } from "motion/react";
import axios from "axios";
import { toast } from "react-toastify";
import { useEffect } from "react";

const BuyCredit = () => {
  const { user, setShowLogin, backendUrl, token, loadCreditsData } = useContext(AppContext);

  useEffect(() => {
    // Dynamically load PayPal SDK if not present
    const existing = document.getElementById('paypal-sdk');
    if (existing) return;
    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=USD&disable-funding=card,credit,paylater`; 
    script.async = true;
    document.body.appendChild(script);
  }, []);
  const createPaypalOrder = async (planId)=>{
    const { data } = await axios.post(`${backendUrl}/api/paypal/create-order`, { planId }, { headers: { token } });
    if (!data.success) throw new Error(data.message || 'Failed to create order');
    return data.id;
  }

  const capturePaypalOrder = async (orderId, planId)=>{
    const { data } = await axios.post(`${backendUrl}/api/paypal/capture-order`, { orderId, planId }, { headers: { token } });
    if (!data.success) throw new Error(data.message || 'Failed to capture order');
    return data;
  }

  return (
    <motion.div
      initial={{ opacity: 0.2, y: 100 }}
      transition={{ duration: 1 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="min-h-[80vh] text-center pt-14 mb-10"
    >
      <button className="border border-gray-400 px-10 py-2 rounded-full mb-6">
        Our Plans
      </button>
      <h1 className="text-center text-4xl font-medium mb-6 sm:mb-10">
        Choose the plan
      </h1>
      <div className="flex flex-wrap justify-center gap-6 text-left">
        {plans.map((item, index) => (
          <div
            key={index}
            className="bg-white drop-shadow-sm border rounded-lg py-12 px-8 text-gray-600 hover:scale-105 transition-all duration-500"
          >
            <img width={40} src={assets.logo_icon} />
            <p className="mt-3 mb-1 font-semibold">{item.id}</p>
            <p className="text-sm">{item.desc}</p>
            <p className="mt-6">
              <span className="text-3xl font-medium">Rs. {item.price}</span> /{" "}
              {item.credits} credits
            </p>
            {user ? (
              <div className="mt-8">
                <div
                  id={`paypal-button-container-${index}`}
                  className="min-w-52"
                />
                <button
                  onClick={() => {
                    // Fallback direct credit (dev only)
                    toast.info('Loading PayPal...');
                  }}
                  className="hidden"
                >
                  Purchase
                </button>
                {typeof window !== 'undefined' && window.paypal && window.paypal.Buttons && window.paypal.Buttons.driver ? null : null}
                <script suppressHydrationWarning={true}></script>
                {typeof window !== 'undefined' && window.paypal && window.paypal.Buttons && window.paypal.Buttons !== null ? null : null}
                {
                  // Render PayPal buttons when SDK is ready
                }
                <RenderPaypal index={index} planId={item.id} createPaypalOrder={createPaypalOrder} capturePaypalOrder={capturePaypalOrder} loadCreditsData={loadCreditsData} />
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="w-full bg-gray-800 text-white mt-8 text-sm rounded-md py-2.5 min-w-52"
              >
                Get Started
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default BuyCredit;

// Helper component to render PayPal buttons per plan
function RenderPaypal({ index, planId, createPaypalOrder, capturePaypalOrder, loadCreditsData }){
  useEffect(() => {
    let buttons;
    const containerId = `paypal-button-container-${index}`;

    const render = async () => {
      if (!window.paypal || !window.paypal.Buttons) return;
      if (buttons) {
        try { buttons.close(); } catch (_) {}
      }
      buttons = window.paypal.Buttons({
        createOrder: async () => {
          try {
            const orderId = await createPaypalOrder(planId);
            return orderId;
          } catch (e) {
            toast.error(e.message || 'Failed to create order');
            throw e;
          }
        },
        onApprove: async (data) => {
          try {
            const res = await capturePaypalOrder(data.orderID, planId);
            loadCreditsData();
            if (res.invoice){
              toast.success(`Payment successful • ${res.invoice.currency} ${res.invoice.amount} • ${res.invoice.planId}`);
            } else {
              toast.success('Payment successful');
            }
            setTimeout(()=>{
              window.location.href = '/history';
            }, 800);
          } catch (e) {
            toast.error(e.message || 'Payment capture failed');
          }
        },
        onError: (err) => {
          toast.error('Payment error');
        },
      });

      try {
        buttons.render(`#${containerId}`);
      } catch (_) {}
    };

    // Try render immediately, and also when SDK becomes available
    render();
    const interval = setInterval(() => {
      if (window.paypal && window.paypal.Buttons) {
        render();
        clearInterval(interval);
      }
    }, 500);

    return () => {
      clearInterval(interval);
      if (buttons) {
        try { buttons.close(); } catch (_) {}
      }
    };
  }, [index, planId]);

  return null;
}
