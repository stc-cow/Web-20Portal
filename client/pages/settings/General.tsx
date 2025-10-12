import { AppShell } from "@/components/layout/AppSidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n";
import { supabase } from "@/lib/supabase";

type SettingsForm = {
  fuel_unit_price: number;
  vat_rate: number;
  supplier_name: string;
  supplier_address: string;
  invoice_prefix: string;
  invoice_sequence: number;
  fcm_server_key: string;
  fcm_sender_id: string;
};

export default function GeneralSettingsPage() {
  const { t } = useI18n();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("auth.role") : null;
  const isAdmin = role === "superadmin";

  const [form, setForm] = useState<SettingsForm>({
    fuel_unit_price: 0.63,
    vat_rate: 0.15,
    supplier_name: "",
    supplier_address: "",
    invoice_prefix: "INV-SEC-",
    invoice_sequence: 1,
    fcm_server_key: "",
    fcm_sender_id: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) {
        setForm((f) => ({
          fuel_unit_price: Number(data.fuel_unit_price ?? f.fuel_unit_price),
          vat_rate: Number(data.vat_rate ?? f.vat_rate),
          supplier_name: data.supplier_name ?? f.supplier_name,
          supplier_address: data.supplier_address ?? f.supplier_address,
          invoice_prefix: data.invoice_prefix ?? f.invoice_prefix,
          invoice_sequence: Number(data.invoice_sequence ?? f.invoice_sequence),
          fcm_server_key: data.fcm_server_key ?? f.fcm_server_key,
          fcm_sender_id: data.fcm_sender_id ?? f.fcm_sender_id,
        }));
      }
    })();
  }, []);

  const save = async () => {
    if (!isAdmin) return;
    setSaving(true);
    const { error } = await supabase.from("settings").upsert(
      [
        {
          id: 1,
          fuel_unit_price: form.fuel_unit_price,
          vat_rate: form.vat_rate,
          supplier_name: form.supplier_name,
          supplier_address: form.supplier_address,
          invoice_prefix: form.invoice_prefix,
          invoice_sequence: form.invoice_sequence,
          fcm_server_key: form.fcm_server_key,
          fcm_sender_id: form.fcm_sender_id,
        },
      ],
      { onConflict: "id" },
    );
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message });
      return;
    }
    toast({ title: "Saved", description: "General settings updated." });
  };

  return (
    <AppShell>
      <Header />
      <div className="px-4 pb-10 pt-4">
        <div className="mb-4 text-sm text-muted-foreground">
          {t("generalSettings")}
        </div>
        {!isAdmin && (
          <div className="mb-3 rounded border bg-muted p-3 text-sm">
            Only administrators can edit settings. Values are read-only.
          </div>
        )}
        <Card>
          <CardContent className="p-6">
            <div className="grid max-w-3xl gap-6 md:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground">
                  Fuel unit price
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={form.fuel_unit_price}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      fuel_unit_price: Number(e.target.value),
                    }))
                  }
                  disabled={!isAdmin}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">VAT rate</div>
                <Input
                  type="number"
                  step="0.01"
                  value={form.vat_rate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vat_rate: Number(e.target.value) }))
                  }
                  disabled={!isAdmin}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Supplier name
                </div>
                <Input
                  value={form.supplier_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplier_name: e.target.value }))
                  }
                  disabled={!isAdmin}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Supplier address
                </div>
                <Input
                  value={form.supplier_address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplier_address: e.target.value }))
                  }
                  disabled={!isAdmin}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Invoice prefix
                </div>
                <Input
                  value={form.invoice_prefix}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, invoice_prefix: e.target.value }))
                  }
                  disabled={!isAdmin}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Invoice sequence
                </div>
                <Input
                  type="number"
                  value={form.invoice_sequence}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      invoice_sequence: Number(e.target.value),
                    }))
                  }
                  disabled={!isAdmin}
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-muted-foreground">
                  FCM server key
                </div>
                <Input
                  value={form.fcm_server_key}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fcm_server_key: e.target.value }))
                  }
                  disabled={!isAdmin}
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-muted-foreground">
                  FCM sender ID
                </div>
                <Input
                  value={form.fcm_sender_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fcm_sender_id: e.target.value }))
                  }
                  disabled={!isAdmin}
                  className="mt-1"
                />
              </div>
              {isAdmin && (
                <div className="md:col-span-2 flex justify-end pt-2">
                  <Button
                    onClick={save}
                    disabled={saving}
                    className="bg-sky-600 hover:bg-sky-500"
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
