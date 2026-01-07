import MapLinkButton from "./MapLinkButton";
import { Card } from "@/components/ui/card";

type Props = { address: string; pincode: string };

export default function LocationSummary({ address, pincode }: Props) {
  return (
    <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-blue-500">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Physical Address</h3>
        <p className="text-base text-slate-700">{address}</p>
        <p className="text-sm text-slate-500">Zip/Pin Code: <span className="font-mono text-slate-700">{pincode}</span></p>
      </div>
      <div>
        <MapLinkButton address={`${address} ${pincode}`} />
      </div>
    </Card>
  );
}