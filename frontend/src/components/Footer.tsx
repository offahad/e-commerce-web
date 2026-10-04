import React from 'react';
import { Phone, Mail, MapPin, ShieldCheck, Truck, Headphones, RotateCcw } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top 4 Value Props */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pb-8 sm:pb-10 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Dhaka Doorstep Express</div>
              <div className="text-slate-400 text-[11px]">Free delivery on orders over ৳1,000</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">100% Genuine BSTI</div>
              <div className="text-slate-400 text-[11px]">Direct brand factory procurement</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Doorstep Inspection</div>
              <div className="text-slate-400 text-[11px]">Check packages upon delivery</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Dedicated Hotline</div>
              <div className="text-slate-400 text-[11px] font-mono">+880 1700-000000</div>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 py-10">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                🛒
              </div>
              <span className="text-base font-black text-white tracking-tight">
                LITON <span className="text-emerald-500">BROTHERS</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Bangladesh&apos;s trusted supplier of pure edible oils, premium aromatic rice, hand-sorted spices, and daily household essentials.
            </p>
            <div className="text-slate-400 text-xs space-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tejgaon Central Warehouse, Dhaka-1208</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-mono">+880 1700-000000</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-500" />
                <span>care@litonbrothers.com</span>
              </div>
            </div>
          </div>

          {/* Essential Categories */}
          <div>
            <h4 className="font-black text-white text-xs uppercase tracking-wider mb-3">Grocery Categories</h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li><a href="#cooking-oil" className="hover:text-emerald-400 transition">Teer & Rupchanda Soybean Oil</a></li>
              <li><a href="#rice" className="hover:text-emerald-400 transition">Miniket & Nazirshail Premium Rice</a></li>
              <li><a href="#spices" className="hover:text-emerald-400 transition">Radhuni Pure Turmeric & Spices</a></li>
              <li><a href="#dairy-eggs" className="hover:text-emerald-400 transition">Fresh Farm Brown Eggs</a></li>
              <li><a href="#flours" className="hover:text-emerald-400 transition">Whole Wheat Atta & Maida</a></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="font-black text-white text-xs uppercase tracking-wider mb-3">Customer Service</h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li><span className="text-slate-300">Delivery Coverage:</span> Dhaka Metropolitan</li>
              <li><span className="text-slate-300">Delivery Slots:</span> 9am-12pm, 2pm-5pm, 6pm-9pm</li>
              <li><span className="text-slate-300">Payment Modes:</span> Cash on Delivery, bKash, Nagad</li>
              <li><span className="text-slate-300">Order Cancellation:</span> Permitted prior to dispatch</li>
              <li><span className="text-slate-300">Customer Approval:</span> Admin verified accounts</li>
            </ul>
          </div>

          {/* Payment Gateways & Apps */}
          <div>
            <h4 className="font-black text-white text-xs uppercase tracking-wider mb-3">Accepted Payments (BDT ৳)</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-[11px] font-bold text-slate-300 border border-slate-700">
                💵 Cash on Delivery
              </span>
              <span className="px-2.5 py-1 bg-pink-950/60 rounded-lg text-[11px] font-bold text-pink-300 border border-pink-900/60">
                🌸 bKash MFS
              </span>
              <span className="px-2.5 py-1 bg-orange-950/60 rounded-lg text-[11px] font-bold text-orange-300 border border-orange-900/60">
                ⚡ Nagad MFS
              </span>
              <span className="px-2.5 py-1 bg-purple-950/60 rounded-lg text-[11px] font-bold text-purple-300 border border-purple-900/60">
                🚀 Rocket
              </span>
              <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-[11px] font-bold text-slate-300 border border-slate-700">
                💳 Visa / MasterCard
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              All transactions are secured by server-authoritative pricing verification.
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div>
            &copy; 2026 Liton Brothers E-Commerce Platform. All rights reserved. Registered in Dhaka, Bangladesh.
          </div>
          <div className="flex gap-4">
            <span>Server: API v1.0.0</span>
            <span>•</span>
            <span>Currency: BDT (৳)</span>
            <span>•</span>
            <span>Status: Operational 99.98%</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
