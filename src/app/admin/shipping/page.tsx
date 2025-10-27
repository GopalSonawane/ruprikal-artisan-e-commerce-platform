"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminShipping() {
  const { toast } = useToast();
  const [shippingRules, setShippingRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState({
    pincodeStart: "",
    pincodeEnd: "",
    state: "",
    deliveryDays: 0,
    shippingCharge: 0,
    isCodAvailable: true,
    isActive: true,
  });

  useEffect(() => {
    fetchShippingRules();
  }, []);

  const fetchShippingRules = async () => {
    try {
      const res = await fetch("/api/shipping-rules");
      const data = await res.json();
      setShippingRules(data);
    } catch (error) {
      console.error("Failed to fetch shipping rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingRule
        ? `/api/shipping-rules?id=${editingRule.id}`
        : "/api/shipping-rules";
      const method = editingRule ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: `Shipping rule ${editingRule ? "updated" : "created"} successfully`,
        });
        setOpen(false);
        resetForm();
        fetchShippingRules();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save shipping rule",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this shipping rule?")) return;

    try {
      const res = await fetch(`/api/shipping-rules?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Success", description: "Shipping rule deleted successfully" });
        fetchShippingRules();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete shipping rule",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      pincodeStart: "",
      pincodeEnd: "",
      state: "",
      deliveryDays: 0,
      shippingCharge: 0,
      isCodAvailable: true,
      isActive: true,
    });
    setEditingRule(null);
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setFormData({
      pincodeStart: rule.pincodeStart,
      pincodeEnd: rule.pincodeEnd,
      state: rule.state,
      deliveryDays: rule.deliveryDays,
      shippingCharge: rule.shippingCharge,
      isCodAvailable: rule.isCodAvailable,
      isActive: rule.isActive,
    });
    setOpen(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Shipping Rules</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Shipping Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Edit Shipping Rule" : "Add New Shipping Rule"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pincode Start *</Label>
                  <Input
                    value={formData.pincodeStart}
                    onChange={(e) =>
                      setFormData({ ...formData, pincodeStart: e.target.value })
                    }
                    placeholder="400001"
                    maxLength={6}
                    required
                  />
                </div>
                <div>
                  <Label>Pincode End *</Label>
                  <Input
                    value={formData.pincodeEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, pincodeEnd: e.target.value })
                    }
                    placeholder="400099"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>State *</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Maharashtra"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Delivery Days *</Label>
                  <Input
                    type="number"
                    value={formData.deliveryDays}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryDays: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Shipping Charge *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.shippingCharge}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shippingCharge: parseFloat(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isCodAvailable}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isCodAvailable: checked })
                  }
                />
                <Label>COD Available</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label>Active</Label>
              </div>
              <div className="flex gap-4">
                <Button type="submit">{editingRule ? "Update" : "Create"}</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="text-left p-4">Pincode Range</th>
              <th className="text-left p-4">State</th>
              <th className="text-left p-4">Delivery Days</th>
              <th className="text-left p-4">Shipping Charge</th>
              <th className="text-left p-4">COD</th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shippingRules.map((rule) => (
              <tr key={rule.id} className="border-b">
                <td className="p-4 font-medium">
                  {rule.pincodeStart} - {rule.pincodeEnd}
                </td>
                <td className="p-4">{rule.state}</td>
                <td className="p-4">{rule.deliveryDays} days</td>
                <td className="p-4">₹{rule.shippingCharge.toFixed(2)}</td>
                <td className="p-4">
                  <span
                    className={`text-sm ${
                      rule.isCodAvailable ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {rule.isCodAvailable ? "Yes" : "No"}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`text-sm ${
                      rule.isActive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {rule.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(rule)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
