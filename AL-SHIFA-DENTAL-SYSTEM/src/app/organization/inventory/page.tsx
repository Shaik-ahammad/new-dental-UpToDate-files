"use client";

import { useEffect, useState } from "react";
import { 
  Package, Search, Plus, AlertTriangle, 
  ArrowDown, ArrowUp, FileSpreadsheet, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

export default function OrgInventory() {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ name: "", qty: "", unit: "pcs" });
  const [isAdding, setIsAdding] = useState(false);

  // 1. Fetch Inventory
  const fetchInventory = async () => {
    try {
      const res = await api.get("/organization/inventory");
      setInventory(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // 2. Add Stock Handler
  const handleAddStock = async () => {
    if(!newItem.name || !newItem.qty) return;
    setLoading(true);
    try {
      await api.post("/organization/inventory", {
        item_name: newItem.name,
        quantity: parseInt(newItem.qty),
        unit: newItem.unit
      });
      setNewItem({ name: "", qty: "", unit: "pcs" });
      setIsAdding(false);
      fetchInventory(); // Refresh
    } catch (e) {
      alert("Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventory Control</h1>
          <p className="text-slate-500 mt-1">Monitor medical supplies and automate restocking.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200">
             <FileSpreadsheet className="h-4 w-4 mr-2" /> Upload Excel
           </Button>
           <Button onClick={() => setIsAdding(!isAdding)} className="bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-600/20">
             <Plus className="h-4 w-4 mr-2" /> {isAdding ? "Cancel" : "Add Stock"}
           </Button>
        </div>
      </div>

      {/* QUICK ADD PANEL */}
      {isAdding && (
        <Card className="p-6 bg-cyan-50/50 border-cyan-100 animate-in slide-in-from-top-4">
           <h3 className="font-bold text-cyan-900 mb-4">Add / Restock Item</h3>
           <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-1 flex-1">
                 <label className="text-xs font-bold text-cyan-700 uppercase">Item Name</label>
                 <Input 
                   placeholder="e.g. Lidocaine Injection" 
                   value={newItem.name}
                   onChange={e => setNewItem({...newItem, name: e.target.value})}
                   className="bg-white border-cyan-200"
                 />
              </div>
              <div className="space-y-1 w-32">
                 <label className="text-xs font-bold text-cyan-700 uppercase">Quantity</label>
                 <Input 
                   type="number" 
                   placeholder="0" 
                   value={newItem.qty}
                   onChange={e => setNewItem({...newItem, qty: e.target.value})}
                   className="bg-white border-cyan-200"
                 />
              </div>
              <div className="space-y-1 w-32">
                 <label className="text-xs font-bold text-cyan-700 uppercase">Unit</label>
                 <select 
                   className="w-full h-10 rounded-md border border-cyan-200 bg-white px-3 text-sm"
                   value={newItem.unit}
                   onChange={e => setNewItem({...newItem, unit: e.target.value})}
                 >
                    <option value="pcs">Pcs</option>
                    <option value="ml">ml</option>
                    <option value="box">Box</option>
                 </select>
              </div>
              <Button onClick={handleAddStock} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                 Confirm
              </Button>
           </div>
        </Card>
      )}

      {/* INVENTORY TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
         {loading ? (
            <div className="p-12 text-center text-slate-400">Loading inventory...</div>
         ) : inventory.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-6">Item Name</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-900 flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <Package className="h-4 w-4" />
                       </div>
                       {item.item_name}
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                       {item.quantity} <span className="text-xs text-slate-400">{item.unit}</span>
                    </td>
                    <td className="p-4">
                       {item.quantity < 20 ? (
                          <Badge className="bg-red-100 text-red-700 border-0 hover:bg-red-100 flex w-fit gap-1">
                             <AlertTriangle className="h-3 w-3" /> Low Stock
                          </Badge>
                       ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100">
                             In Stock
                          </Badge>
                       )}
                    </td>
                    <td className="p-4 text-slate-400 text-xs">
                       {new Date(item.last_updated || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right pr-6">
                       <Button size="sm" variant="ghost" className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50">
                          Edit
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         ) : (
            <div className="p-12 text-center flex flex-col items-center">
               <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-slate-300" />
               </div>
               <h3 className="text-lg font-bold text-slate-900">Inventory Empty</h3>
               <p className="text-slate-500 text-sm max-w-xs mt-2 mb-6">
                 Start by adding items manually or uploading an Excel sheet.
               </p>
               <Button onClick={() => setIsAdding(true)} variant="outline">Add First Item</Button>
            </div>
         )}
      </div>
    </div>
  );
}